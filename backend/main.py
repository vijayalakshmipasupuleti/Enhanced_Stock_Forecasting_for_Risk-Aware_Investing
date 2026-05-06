import sys
import os
import uvicorn
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
import traceback
from datetime import datetime, timezone
import json
from urllib.request import urlopen, Request
from urllib.parse import quote as url_quote

# Add parent directory to path to allow importing from src
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.data_loader import DataLoader
from src.feature_engineering import FeatureEngineer
from src.models import ModelTrainer
from src.risk_analysis import RiskAnalyzer
from src.evaluation import evaluate_predictions
from src.forecaster import run_forecast
from src.database import (
    init_db, authenticate_user, register_user,
    get_portfolio, add_holding, buy_holding, sell_holding, remove_holding, set_stop_loss,
    log_trade, get_trade_history, clear_trade_history,
    add_sl_alert, get_sl_alerts, dismiss_sl_alert, clear_sl_alerts,
)

app = FastAPI(title="StockVista API", version="2.0.0")

@app.on_event("startup")
def on_startup():
    """Initialize the SQLite database on server start."""
    init_db()
    print("[DB] Database initialised.")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StockRequest(BaseModel):
    ticker: str
    start_date: str
    end_date: str

class HistoryRequest(BaseModel):
    ticker: str
    period: str = "6mo" # yfinance valid periods: 1d,5d,1mo,3mo,6mo,1y,2y,5y,10y,ytd,max

class QuotesRequest(BaseModel):
    tickers: List[str]

class ChartPoint(BaseModel):
    date: str
    actual: Optional[float]
    predicted: Optional[float]

class Metrics(BaseModel):
    RMSE: float
    MAPE: float
    VaR_95: float
    Sharpe_Ratio: float
    Decision_Score: float
    Volatility: str

class PredictionResponse(BaseModel):
    ticker: str
    model: str
    metrics: Metrics
    chart_data: List[ChartPoint]
    current_price: float
    predicted_high: float

def _safe_float(value, default=0.0):
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default

def _fi_get(info, key, default=None):
    if info is None:
        return default
    try:
        if hasattr(info, "get"):
            value = info.get(key, default)
            if value is not None:
                return value
    except Exception:
        pass
    try:
        value = getattr(info, key)
        if value is not None:
            return value
    except Exception:
        pass
    return default

def _http_get_json(url: str):
    """Fetch JSON from Yahoo Finance, retrying on query2 if query1 fails (rate-limit/timeout)."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
    }
    urls_to_try = [url, url.replace("query1.finance.yahoo.com", "query2.finance.yahoo.com")]
    last_exc = None
    for attempt_url in urls_to_try:
        try:
            req = Request(attempt_url, headers=headers)
            with urlopen(req, timeout=20) as response:
                return json.loads(response.read().decode("utf-8"))
        except Exception as exc:
            last_exc = exc
            continue
    raise last_exc

def _fetch_quote_via_chart(ticker: str):
    """Fetch latest quote data using the v8 chart API (more reliable than v7 quote)."""
    symbol = ticker.strip().upper()
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{url_quote(symbol)}"
        f"?range=7d&interval=1d"
    )
    try:
        payload = _http_get_json(url)
    except Exception:
        return {}

    result = payload.get("chart", {}).get("result", [])
    if not result:
        return {}

    chart = result[0]
    meta = chart.get("meta", {})
    timestamps = chart.get("timestamp", []) or []
    indicators = chart.get("indicators", {}).get("quote", [{}])[0]
    closes = indicators.get("close", []) or []

    # 1. Primary: Last valid close from chart indicators (most accurate for official close)
    current_price = 0.0
    for c in reversed(closes):
        if c is not None and c > 0:
            current_price = _safe_float(c)
            break
            
    # 2. Secondary: regularMarketPrice as fallback if chart is empty
    if current_price <= 0:
        current_price = _safe_float(meta.get("regularMarketPrice"))
    
    # 3. Tertiary: chartPreviousClose as a last resort
    previous_close = _safe_float(meta.get("chartPreviousClose") or meta.get("previousClose"))
    if current_price <= 0:
        current_price = previous_close

    # 4. Extract Volume
    volumes = indicators.get("volume", []) or []
    day_volume = _safe_float(meta.get("regularMarketVolume"))
    if day_volume <= 0:
        for v in reversed(volumes):
            if v is not None and v > 0:
                day_volume = _safe_float(v)
                break

    return {
        "symbol": symbol,
        "name": meta.get("shortName") or meta.get("longName") or symbol,
        "price": current_price,
        "previous_close": previous_close,
        "volume": day_volume,
        "currency": meta.get("currency") or "INR",
        "exchange": meta.get("fullExchangeName") or meta.get("exchangeName") or "",
    }


def _fetch_quote_map(tickers: List[str]):
    """Fetch quotes for multiple tickers using v8 chart API."""
    quote_map = {}
    for ticker in tickers:
        symbol = ticker.strip().upper()
        if not symbol:
            continue
        data = _fetch_quote_via_chart(symbol)
        if data:
            quote_map[symbol] = data
    return quote_map


def _get_latest_quote(ticker: str):
    data = _fetch_quote_via_chart(ticker)
    current_price = data.get("price", 0.0)
    previous_close = data.get("previous_close", 0.0)

    change_pct = 0.0
    if previous_close != 0:
        change_pct = ((current_price - previous_close) / previous_close) * 100

    return {
        "symbol": ticker.upper(),
        "name": data.get("name", ticker.upper()),
        "price": current_price,
        "previous_close": previous_close,
        "change_percent": change_pct,
        "volume": data.get("volume", 0.0),
        "currency": data.get("currency", "INR"),
        "exchange": data.get("exchange", ""),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: StockRequest):
    try:
        print(f"Received request: {request}")
        
        # 1. Load Data
        loader = DataLoader(request.ticker, request.start_date, request.end_date)
        df = loader.load_data()
        
        if df is None or df.empty:
            raise HTTPException(status_code=404, detail="No data found for ticker")

        # 2. Feature Engineering
        fe = FeatureEngineer(df)
        df_features = fe.prepare_data()

        # 3. Model Training (Ensemble for stability)
        trainer = ModelTrainer(df_features, target_col='Close')
        trainer.split_data()
        
        model_name = 'Ensemble'
        trainer.train_ensemble()
        
        # 4. Predictions & Evaluation
        preds = trainer.predict(model_name)
        actuals = trainer.get_actual_values(model_name)
        
        # Alignment
        min_len = min(len(preds), len(actuals))
        preds = preds[:min_len]
        actuals = actuals[:min_len]
        test_dates = trainer.get_prediction_dates(model_name)[:min_len]

        # Metrics
        eval_metrics = evaluate_predictions(actuals, preds)
        
        # Risk Analysis
        risk_analyzer = RiskAnalyzer(actuals, preds)
        risk_metrics = risk_analyzer.get_risk_metrics()
        decision_score = risk_analyzer.risk_aware_decision_score(0, risk_metrics)
        
        # Construct Chart Data
        chart_data = []
        for i in range(len(test_dates)):
            chart_data.append({
                "date": test_dates[i],
                "actual": float(actuals[i]),
                "predicted": float(preds[i])
            })
            
        # Determine Volatility Label
        vol = risk_metrics.get('Annualized Volatility', 0.0)
        vol_label = "Low" if vol < 0.15 else "Medium" if vol < 0.3 else "High"
        
        return {
            "ticker": request.ticker,
            "model": model_name,
            "metrics": {
                "RMSE": eval_metrics.get('RMSE', 0.0),
                "MAPE": eval_metrics.get('MAPE', 0.0),
                "VaR_95": risk_metrics.get('VaR (95%)', 0.0),
                "Sharpe_Ratio": risk_metrics.get('Sharpe Ratio', 0.0),
                "Decision_Score": decision_score,
                "Volatility": vol_label
            },
            "chart_data": chart_data,
            "current_price": float(actuals[-1]) if len(actuals) > 0 else 0.0,
            "predicted_high": float(max(preds)) if len(preds) > 0 else 0.0
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/history")
async def get_history(request: HistoryRequest):
    try:
        symbol = request.ticker.upper()
        url = (
            f"https://query1.finance.yahoo.com/v8/finance/chart/{url_quote(symbol)}"
            f"?range={url_quote(request.period)}&interval=1d"
        )
        payload = _http_get_json(url)
        result = payload.get("chart", {}).get("result", [])
        if not result:
            raise HTTPException(status_code=404, detail="No historical data found")

        chart = result[0]
        timestamps = chart.get("timestamp", []) or []
        quotes = (chart.get("indicators", {}).get("quote", []) or [{}])[0]
        opens = quotes.get("open", []) or []
        highs = quotes.get("high", []) or []
        lows = quotes.get("low", []) or []
        closes = quotes.get("close", []) or []
        volumes = quotes.get("volume", []) or []

        history_data = []
        max_len = min(len(timestamps), len(opens), len(highs), len(lows), len(closes), len(volumes))
        for i in range(max_len):
            if closes[i] is None:
                continue
            history_data.append({
                "date": datetime.fromtimestamp(int(timestamps[i]), tz=timezone.utc).strftime('%Y-%m-%d'),
                "open": _safe_float(opens[i]),
                "high": _safe_float(highs[i]),
                "low": _safe_float(lows[i]),
                "close": _safe_float(closes[i]),
                "volume": _safe_float(volumes[i])
            })
            
        return {
            "ticker": symbol,
            "data": history_data
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/quotes")
async def get_quotes(request: QuotesRequest):
    try:
        if not request.tickers:
            raise HTTPException(status_code=400, detail="At least one ticker is required")

        unique_tickers = list(dict.fromkeys([t.strip().upper() for t in request.tickers if t.strip()]))
        if not unique_tickers:
            raise HTTPException(status_code=400, detail="No valid tickers provided")

        source_map = _fetch_quote_map(unique_tickers)
        quotes = []
        for ticker in unique_tickers:
            try:
                item = source_map.get(ticker, {})
                current_price = _safe_float(item.get("price"))
                previous_close = _safe_float(item.get("previous_close"))
                change_pct = 0.0 if previous_close == 0 else ((current_price - previous_close) / previous_close) * 100
                quotes.append({
                    "symbol": ticker,
                    "name": item.get("name", ticker),
                    "price": current_price,
                    "previous_close": previous_close,
                    "change_percent": change_pct,
                    "volume": _safe_float(item.get("volume")),
                    "currency": item.get("currency", "INR"),
                    "exchange": item.get("exchange", ""),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                })
            except Exception:
                quotes.append({
                    "symbol": ticker,
                    "name": ticker,
                    "price": 0.0,
                    "previous_close": 0.0,
                    "change_percent": 0.0,
                    "volume": 0.0,
                    "currency": "INR",
                    "exchange": "",
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    "error": "Unable to fetch quote"
                })

        return {"quotes": quotes}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search")
async def search_stocks(
    q: str = Query("", min_length=1),
    limit: int = Query(10, ge=1, le=25)
):
    """Real-time stock search using Yahoo Finance autocomplete API.
    Fetches up to 40 raw results from Yahoo then filters and ranks them:
      - Drops MUTUALFUND, CURRENCY, CRYPTOCURRENCY, FUTURE, OPTION types
      - Drops Yahoo internal fund codes beginning with '0P'
      - Drops entries with no usable name
      - Returns EQUITY first, then INDEX, then ETF, then others
    """
    try:
        # Over-fetch so we still have enough after filtering junk
        fetch_count = min(limit * 4, 40)
        url = (
            f"https://query1.finance.yahoo.com/v1/finance/search"
            f"?q={url_quote(q)}&quotesCount={fetch_count}&newsCount=0&listsCount=0"
        )
        payload = _http_get_json(url)
        quotes = payload.get("quotes", [])

        # Types to completely discard
        SKIP_TYPES = {"MUTUALFUND", "CURRENCY", "CRYPTOCURRENCY", "FUTURE", "OPTION"}

        results = []
        for item in quotes:
            symbol     = item.get("symbol", "")
            quote_type = item.get("quoteType", "EQUITY").upper()

            # Drop unwanted asset types
            if quote_type in SKIP_TYPES:
                continue
            # Drop Yahoo internal 0Pxxxxxxxxxx fund codes
            if symbol.startswith("0P"):
                continue
            # Drop entries with no usable display name
            name = item.get("shortname") or item.get("longname") or ""
            if not name.strip():
                continue

            exchange = item.get("exchDisp") or item.get("exchange", "")

            # Market tag
            market = "GLOBAL"
            if symbol.endswith(".NS"):
                market = "NSE"
            elif symbol.endswith(".BO"):
                market = "BSE"

            # Priority score for sorting: lower = shown first
            prio = 0 if quote_type == "EQUITY" else 1 if quote_type == "INDEX" else 2 if quote_type == "ETF" else 3

            results.append({
                "symbol":   symbol,
                "name":     name.strip(),
                "exchange": exchange,
                "type":     quote_type,
                "market":   market,
                "_prio":    prio,
            })

        # Sort: EQUITYs first (preserving Yahoo's relevance order within each tier)
        results.sort(key=lambda r: r["_prio"])

        # Remove internal sort key before returning
        for r in results:
            r.pop("_prio", None)

        results = results[:limit]
        return {"query": q, "count": len(results), "results": results}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stock-detail")
async def stock_detail(
    ticker: str = Query(..., min_length=1)
):
    """Get detailed stock information for a single ticker using v8 chart API."""
    try:
        symbol = ticker.strip().upper()
        url = (
            f"https://query1.finance.yahoo.com/v8/finance/chart/{url_quote(symbol)}"
            f"?range=10d&interval=1d"
        )
        payload = _http_get_json(url)
        result = payload.get("chart", {}).get("result", [])
        if not result:
            raise HTTPException(status_code=404, detail=f"No data found for {symbol}")

        chart = result[0]
        meta = chart.get("meta", {})
        timestamps = chart.get("timestamp", []) or []
        quotes_data = (chart.get("indicators", {}).get("quote", []) or [{}])[0]
        opens = quotes_data.get("open", []) or []
        highs = quotes_data.get("high", []) or []
        lows = quotes_data.get("low", []) or []
        closes = quotes_data.get("close", []) or []
        volumes = quotes_data.get("volume", []) or []

        # Prioritize last valid close from chart for official accuracy
        current_price = 0.0
        for c in reversed(closes):
            if c is not None and c > 0:
                current_price = _safe_float(c)
                break
        
        if current_price <= 0:
            current_price = _safe_float(meta.get("regularMarketPrice"))

        previous_close = _safe_float(meta.get("chartPreviousClose") or meta.get("previousClose"))
        if current_price <= 0:
            current_price = previous_close
        change = current_price - previous_close if previous_close else 0.0
        change_pct = (change / previous_close * 100) if previous_close else 0.0

        # Get most recent non-None OHLV (Yahoo sometimes appends a null row for weekends/holidays)
        def _last_valid(lst):
            for v in reversed(lst):
                if v is not None:
                    return _safe_float(v)
            return 0.0

        today_open   = _last_valid(opens)
        today_high   = _last_valid(highs)
        today_low    = _last_valid(lows)
        today_volume = _last_valid(volumes)

        # Calculate 52-week from meta or available data
        fifty_two_high = _safe_float(meta.get("fiftyTwoWeekHigh"))
        fifty_two_low = _safe_float(meta.get("fiftyTwoWeekLow"))

        return {
            "symbol": symbol,
            "name": meta.get("shortName") or meta.get("longName") or symbol,
            "price": current_price,
            "previous_close": previous_close,
            "change": change,
            "change_percent": change_pct,
            "open": today_open,
            "day_high": today_high,
            "day_low": today_low,
            "volume": today_volume,
            "market_cap": 0.0,
            "pe_ratio": 0.0,
            "eps": 0.0,
            "fifty_two_week_high": fifty_two_high,
            "fifty_two_week_low": fifty_two_low,
            "avg_volume": 0.0,
            "dividend_yield": 0.0,
            "currency": meta.get("currency") or "INR",
            "exchange": meta.get("fullExchangeName") or meta.get("exchangeName") or "",
            "market": "NSE" if symbol.endswith(".NS") else "BSE" if symbol.endswith(".BO") else "GLOBAL",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/market-overview")
async def market_overview(
    tickers: str = Query("^NSEI,^BSESN,^NSEBANK,^CNXIT")
):
    try:
        symbols = [s.strip().upper() for s in tickers.split(",") if s.strip()]
        if not symbols:
            raise HTTPException(status_code=400, detail="No index symbols provided")

        index_quotes = []
        total_volume = 0.0
        for symbol in symbols:
            quote = _get_latest_quote(symbol)
            index_quotes.append(quote)
            total_volume += quote["volume"]

        top_index = index_quotes[0]
        market_status = "OPEN" if top_index.get("price", 0.0) > 0 else "CLOSED"

        return {
            "market_status": market_status,
            "tracked_symbols": len(index_quotes),
            "total_volume": total_volume,
            "indices": index_quotes,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/intraday")
async def intraday(
    ticker: str = Query("^NSEI"),
    period: str = Query("1d"),
    interval: str = Query("5m")
):
    try:
        symbol = ticker.upper()
        url = (
            f"https://query1.finance.yahoo.com/v8/finance/chart/{url_quote(symbol)}"
            f"?range={url_quote(period)}&interval={url_quote(interval)}"
        )
        payload = _http_get_json(url)
        result = payload.get("chart", {}).get("result", [])
        if not result:
            raise HTTPException(status_code=404, detail="No intraday data found")
        chart = result[0]
        timestamps = chart.get("timestamp", []) or []
        quotes = (chart.get("indicators", {}).get("quote", []) or [{}])[0]
        closes = quotes.get("close", []) or []

        points = []
        max_len = min(len(timestamps), len(closes))
        for i in range(max_len):
            if closes[i] is None:
                continue
            points.append({
                "time": datetime.fromtimestamp(int(timestamps[i]), tz=timezone.utc).strftime("%H:%M"),
                "value": _safe_float(closes[i])
            })

        return {"ticker": symbol, "points": points}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class ForecastRequest(BaseModel):
    ticker: str

@app.post("/forecast")
async def forecast_stock(request: ForecastRequest):
    """
    AI-powered multi-horizon price forecast.
    Trains XGBoost on 3 years of price history + technical indicators + news sentiment.
    Returns predicted prices at 1 week, 1 month, and 6 months horizons.
    """
    try:
        ticker = request.ticker.strip().upper()
        if not ticker:
            raise HTTPException(status_code=400, detail="Ticker symbol is required")
        print(f"[FORECAST] Starting forecast for {ticker}")
        result = run_forecast(ticker)
        print(f"[FORECAST] Done for {ticker}")
        return result
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────────
# DATABASE-BACKED AUTH & PORTFOLIO ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str

class AddHoldingRequest(BaseModel):
    username: str
    symbol: str
    name: str
    qty: float
    avg_price: float
    stop_loss: Optional[float] = None

class BuyRequest(BaseModel):
    username: str
    symbol: str
    qty: float
    price: float

class SellRequest(BaseModel):
    username: str
    symbol: str
    qty: float

class RemoveRequest(BaseModel):
    username: str
    symbol: str

class StopLossRequest(BaseModel):
    username: str
    symbol: str
    stop_loss: Optional[float] = None

class TradeLogRequest(BaseModel):
    username: str
    symbol: str
    name: str
    action: str
    qty: float
    price: float

class SlAlertRequest(BaseModel):
    username: str
    symbol: str
    message: str

class DismissAlertRequest(BaseModel):
    alert_id: str
    username: str


@app.post("/auth/login")
async def login(req: LoginRequest):
    user = authenticate_user(req.username, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    return {"success": True, "username": user["username"]}


@app.post("/auth/register")
async def register(req: RegisterRequest):
    try:
        result = register_user(req.username, req.password)
        return {"success": True, "username": result["username"]}
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@app.get("/db/portfolio")
async def db_get_portfolio(username: str = Query(...)):
    try:
        holdings = get_portfolio(username)
        return {"username": username, "holdings": holdings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/db/portfolio/add")
async def db_add_holding(req: AddHoldingRequest):
    try:
        holdings = add_holding(req.username, req.symbol, req.name, req.qty, req.avg_price, req.stop_loss)
        log_trade(req.username, req.symbol, req.name, "BUY", req.qty, req.avg_price)
        return {"success": True, "holdings": holdings}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/db/portfolio/buy")
async def db_buy(req: BuyRequest):
    try:
        holdings = buy_holding(req.username, req.symbol, req.qty, req.price)
        # Get name from portfolio
        h = next((h for h in holdings if h["symbol"] == req.symbol.upper()), {})
        log_trade(req.username, req.symbol, h.get("name", req.symbol), "BUY", req.qty, req.price)
        return {"success": True, "holdings": holdings}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/db/portfolio/sell")
async def db_sell(req: SellRequest):
    try:
        # Get holding details before sell for trade log
        curr = get_portfolio(req.username)
        h = next((x for x in curr if x["symbol"] == req.symbol.upper()), {})
        # Fetch live price for trade log
        price_data = _fetch_quote_via_chart(req.symbol)
        price = price_data.get("price") or h.get("avg_price", 0)
        holdings = sell_holding(req.username, req.symbol, req.qty)
        log_trade(req.username, req.symbol, h.get("name", req.symbol), "SELL", req.qty, price)
        return {"success": True, "holdings": holdings}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/db/portfolio/remove")
async def db_remove(req: RemoveRequest):
    try:
        curr = get_portfolio(req.username)
        h = next((x for x in curr if x["symbol"] == req.symbol.upper()), {})
        price_data = _fetch_quote_via_chart(req.symbol)
        price = price_data.get("price") or h.get("avg_price", 0)
        holdings = remove_holding(req.username, req.symbol)
        log_trade(req.username, req.symbol, h.get("name", req.symbol), "REMOVE", h.get("qty", 0), price)
        return {"success": True, "holdings": holdings}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/db/portfolio/stoploss")
async def db_set_stoploss(req: StopLossRequest):
    try:
        holdings = set_stop_loss(req.username, req.symbol, req.stop_loss)
        return {"success": True, "holdings": holdings}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/db/trade/log")
async def db_log_trade(req: TradeLogRequest):
    try:
        entry = log_trade(req.username, req.symbol, req.name, req.action, req.qty, req.price)
        return {"success": True, "entry": entry}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/db/trade/history")
async def db_trade_history(username: str = Query(...), limit: int = Query(200)):
    try:
        history = get_trade_history(username, limit)
        return {"username": username, "history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/db/trade/history")
async def db_clear_history(username: str = Query(...)):
    try:
        clear_trade_history(username)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/db/alerts/add")
async def db_add_alert(req: SlAlertRequest):
    try:
        entry = add_sl_alert(req.username, req.symbol, req.message)
        return {"success": True, "alert": entry}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/db/alerts")
async def db_get_alerts(username: str = Query(...)):
    try:
        alerts = get_sl_alerts(username)
        return {"username": username, "alerts": alerts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/db/alerts/dismiss")
async def db_dismiss_alert(req: DismissAlertRequest):
    try:
        dismiss_sl_alert(req.alert_id, req.username)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/db/alerts")
async def db_clear_alerts(username: str = Query(...)):
    try:
        clear_sl_alerts(username)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8081, reload=True)
