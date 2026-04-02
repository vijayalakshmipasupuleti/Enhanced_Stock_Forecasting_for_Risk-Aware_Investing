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

app = FastAPI(title="AntigravityStocks API", version="1.0.0")

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
    req = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
    )
    with urlopen(req, timeout=15) as response:
        return json.loads(response.read().decode("utf-8"))

def _fetch_quote_via_chart(ticker: str):
    """Fetch latest quote data using the v8 chart API (more reliable than v7 quote)."""
    symbol = ticker.strip().upper()
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{url_quote(symbol)}"
        f"?range=2d&interval=1d"
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
    quotes = (chart.get("indicators", {}).get("quote", []) or [{}])[0]
    closes = quotes.get("close", []) or []
    volumes = quotes.get("volume", []) or []

    current_price = _safe_float(meta.get("regularMarketPrice"))
    previous_close = _safe_float(meta.get("chartPreviousClose") or meta.get("previousClose"))

    if current_price == 0 and closes:
        for c in reversed(closes):
            if c is not None:
                current_price = _safe_float(c)
                break

    day_volume = 0.0
    if volumes:
        for v in reversed(volumes):
            if v is not None:
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

        # 3. Model Training (Fastest Model for API - XGBoost)
        # Note: In a real app, successful models are saved/loaded. 
        # Here we train on the fly as per original script design.
        trainer = ModelTrainer(df_features, target_col='Close')
        trainer.split_data()
        
        model_name = 'XGBoost'
        trainer.train_xgboost()
        
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
    """Real-time stock search using Yahoo Finance autocomplete API."""
    try:
        url = (
            f"https://query1.finance.yahoo.com/v1/finance/search"
            f"?q={url_quote(q)}&quotesCount={limit}&newsCount=0&listsCount=0"
        )
        payload = _http_get_json(url)
        quotes = payload.get("quotes", [])

        results = []
        for item in quotes:
            symbol = item.get("symbol", "")
            exchange = item.get("exchDisp") or item.get("exchange", "")
            stock_type = item.get("quoteType", "EQUITY")
            name = item.get("shortname") or item.get("longname") or symbol

            # Determine market tag
            market = "GLOBAL"
            if symbol.endswith(".NS"):
                market = "NSE"
            elif symbol.endswith(".BO"):
                market = "BSE"

            results.append({
                "symbol": symbol,
                "name": name,
                "exchange": exchange,
                "type": stock_type,
                "market": market,
            })

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
            f"?range=5d&interval=1d"
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

        current_price = _safe_float(meta.get("regularMarketPrice"))
        previous_close = _safe_float(meta.get("chartPreviousClose") or meta.get("previousClose"))
        change = current_price - previous_close if previous_close else 0.0
        change_pct = (change / previous_close * 100) if previous_close else 0.0

        # Get today's OHLV from most recent data point
        today_open = _safe_float(opens[-1]) if opens else 0.0
        today_high = _safe_float(highs[-1]) if highs else 0.0
        today_low = _safe_float(lows[-1]) if lows else 0.0
        today_volume = _safe_float(volumes[-1]) if volumes else 0.0

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

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8081, reload=True)
