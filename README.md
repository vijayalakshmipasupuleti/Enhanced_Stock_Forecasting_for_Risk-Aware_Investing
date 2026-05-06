# Enhanced Stock Forecasting for Risk-Aware Investing

A full-stack AI-powered stock forecasting and portfolio management platform that combines machine learning price prediction with institutional-grade risk assessment. Built with **Python (FastAPI)** backend and **React (Vite)** frontend.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Directory Structure](#directory-structure)
5. [Algorithms & Models](#algorithms--models)
6. [Feature Engineering Pipeline](#feature-engineering-pipeline)
7. [Risk Analysis Engine](#risk-analysis-engine)
8. [Backend API Reference](#backend-api-reference)
9. [Database Layer (MongoDB)](#database-layer-mongodb)
10. [Frontend Application](#frontend-application)
11. [Data Flow (End-to-End)](#data-flow-end-to-end)
12. [Setup & Installation](#setup--installation)
13. [Running the Application](#running-the-application)
14. [Evaluation Metrics](#evaluation-metrics)

---

## Project Overview

**StockVista** is a financial intelligence system that predicts future stock prices at multiple time horizons (1 week, 1 month, 6 months) while simultaneously evaluating the risk associated with each prediction. Unlike traditional forecasting tools that only minimize prediction error (RMSE), this system optimizes for **risk-adjusted returns**, ensuring investors understand both potential profit and downside exposure.

### Key Capabilities

| Feature | Description |
|---|---|
| **Multi-Horizon Forecasting** | Predicts stock prices at 1-week, 1-month, and 6-month horizons using direct forecasting (no recursive error compounding) |
| **Ensemble ML Model** | Blends XGBoost (50%), Random Forest (30%), and Ridge Regression (20%) for robust predictions |
| **40+ Technical Indicators** | Normalised features including RSI, MACD, Bollinger Bands, ATR, CCI, MFI, OBV, Stochastic Oscillator |
| **News Sentiment Analysis** | Keyword-based sentiment scoring from live Yahoo Finance news headlines |
| **Risk Metrics** | VaR (95%), Sharpe Ratio, Max Drawdown, Volatility, and a composite Decision Score |
| **Portfolio Management** | Full CRUD operations — Add, Buy, Sell, Remove stocks with persistent MongoDB storage |
| **Stop-Loss Automation** | Automatic sell execution when live price breaches user-defined stop-loss levels |
| **Financial Calculators** | SIP, Lumpsum, XIRR, and Wealth Projection calculators with interactive charts |
| **Real-Time Market Data** | Live quotes, intraday charts, and market indices via Yahoo Finance API |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                  │
│  LoginPage → Layout (Sidebar + Global Search + TopBar)          │
│  ├── DashboardPage (Portfolio, Live Quotes, Stop-Loss, Trades)  │
│  ├── AIForecastPage (Multi-Horizon Prediction + Charts)         │
│  ├── MarketPage (Market Overview, Index Tracking)               │
│  ├── StockDetailPage (Individual Stock Analysis)                │
│  └── CalculatorsPage (SIP, Lumpsum, XIRR, Wealth Forecaster)   │
│                          │ HTTP (fetch)                         │
├──────────────────────────┼──────────────────────────────────────┤
│                   BACKEND (FastAPI + Uvicorn)                   │
│  backend/main.py — 20+ REST endpoints                          │
│  ├── /forecast      → src/forecaster.py (Ensemble AI Pipeline) │
│  ├── /predict       → src/models.py (LSTM, BiLSTM, XGBoost)    │
│  ├── /quotes        → Yahoo Finance v8 Chart API               │
│  ├── /search        → Yahoo Finance v1 Search API              │
│  ├── /auth/*        → src/database.py (User Authentication)    │
│  └── /db/*          → src/database.py (Portfolio CRUD)          │
│                          │                                      │
├──────────────────────────┼──────────────────────────────────────┤
│                   DATABASE (MongoDB)                            │
│  Database: stockvista                                           │
│  ├── users          (username, password_hash, created_at)       │
│  ├── portfolio      (username, symbol, name, qty, avg_price,    │
│  │                   stop_loss, added_at)                       │
│  ├── trade_history  (username, symbol, action, qty, price,      │
│  │                   total, traded_at)                          │
│  └── sl_alerts      (username, symbol, message, alerted_at,     │
│                      dismissed)                                 │
├─────────────────────────────────────────────────────────────────┤
│                   EXTERNAL DATA SOURCE                          │
│  Yahoo Finance API (v8 Chart, v1 Search)                        │
│  └── Price History, Live Quotes, News Headlines, Market Indices │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Backend
| Technology | Purpose |
|---|---|
| Python 3.10+ | Core language |
| FastAPI | REST API framework |
| Uvicorn | ASGI server |
| XGBoost | Gradient-boosted tree model |
| Scikit-learn | Random Forest, Ridge Regression, StandardScaler, MinMaxScaler |
| TensorFlow / Keras | LSTM and Bi-LSTM deep learning models |
| Pandas / NumPy | Data manipulation and numerical computation |
| yfinance | Yahoo Finance data downloader (used by root ML pipeline) |
| pymongo | MongoDB driver |
| Matplotlib / Seaborn | Chart generation for standalone ML pipeline |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool and dev server |
| React Router DOM | Client-side routing |
| Lucide React | Icon library |
| Recharts / ApexCharts | Data visualization |
| Vanilla CSS | Custom styling with CSS variables |

### Database & External APIs
| Technology | Purpose |
|---|---|
| MongoDB | Document-based persistence for users, portfolios, trades, alerts |
| Yahoo Finance v8 Chart API | Historical OHLCV data and live quotes |
| Yahoo Finance v1 Search API | Stock symbol search and news headlines |

---

## Directory Structure

```
stockmarket-portfolio-main/
│
├── .gitignore                 # Git ignore rules
├── README.md                  # Project documentation (this file)
├── main.py                    # Standalone ML pipeline entry point
├── requirements.txt           # Python dependencies
├── package.json               # Root npm scripts (concurrently runs backend + frontend)
│
├── docs/                      # Documentation
│   └── VIVA_EXPLANATION.md    # Academic viva preparation notes
│
├── scripts/                   # Utility batch scripts
│   ├── run.bat                # Run standalone ML pipeline
│   └── run_backend.bat        # Run backend server only
│
├── src/                       # Core Python modules (ML + DB)
│   ├── data_loader.py         # Downloads & caches stock data via yfinance
│   ├── feature_engineering.py # Computes RSI, MACD, moving averages, volatility, lag features
│   ├── models.py              # ModelTrainer class — Ridge, RF, XGBoost, LSTM, Bi-LSTM
│   ├── forecaster.py          # Production forecaster — Ensemble + 40+ features + sentiment
│   ├── risk_analysis.py       # RiskAnalyzer — VaR, Sharpe, Max Drawdown, Decision Score
│   ├── evaluation.py          # RMSE, MAE, MAPE, Directional Accuracy
│   ├── visualization.py       # Matplotlib chart generation
│   └── database.py            # MongoDB persistence layer (users, portfolio, trades, alerts)
│
├── backend/
│   ├── main.py                # FastAPI application — all REST endpoints
│   └── data/                  # Cached CSV files from Yahoo Finance (auto-generated, gitignored)
│
└── frontend/
    ├── index.html             # HTML entry point
    ├── package.json           # Frontend dependencies
    └── src/
        ├── main.jsx           # React DOM render
        ├── App.jsx            # Root component — routing & auth state
        ├── index.css          # Global CSS design system (dark theme, variables)
        ├── App.css            # App-level styles
        ├── utils/
        │   └── format.js      # ₹ currency formatters, API_BASE constant
        ├── components/
        │   ├── Layout.jsx         # Sidebar + TopBar + Global Search
        │   ├── LoginPage.jsx      # Authentication UI (login + register)
        │   ├── GlobalSearch.jsx    # Search component
        │   ├── Header.jsx         # Page header
        │   ├── PortfolioGrid.jsx   # Portfolio card grid
        │   ├── MetricCard.jsx      # Reusable metric display card
        │   ├── StockChart.jsx      # Line chart component
        │   ├── CandlestickChart.jsx# OHLC candlestick chart (ApexCharts)
        │   ├── StockInput.jsx      # Stock ticker input with search
        │   ├── MarketDashboard.jsx  # Market overview component
        │   ├── LumpsumCalculator.jsx# Lumpsum investment calculator
        │   ├── WealthProjection.jsx # Wealth forecaster with inflation
        │   └── XirrCalculator.jsx   # XIRR return calculator
        └── pages/
            ├── DashboardPage.jsx       # Main portfolio dashboard
            ├── AIForecastPage.jsx       # AI prediction page
            ├── MarketPage.jsx           # Market indices overview
            ├── StockDetailPage.jsx      # Individual stock detail
            ├── CalculatorsPage.jsx       # Calculator hub
            ├── SipPage.jsx              # SIP calculator page
            ├── LumpsumPage.jsx          # Lumpsum calculator page
            ├── XirrPage.jsx             # XIRR calculator page
            └── WealthProjectionPage.jsx # Wealth forecaster page
```

---

## Algorithms & Models

The project implements **two forecasting pipelines**:

### Pipeline 1: Root ML Pipeline (`main.py` + `src/models.py`)

Used for academic evaluation — trains 5 models and compares them. Predicts the **next day's closing price**.

| Model | Type | Architecture |
|---|---|---|
| **Ridge Regression** | Linear | L2-regularised linear regression (alpha=1.0) |
| **Random Forest** | Ensemble | 200 trees, max_depth=8 |
| **XGBoost** | Gradient Boosting | 500 estimators, lr=0.03, max_depth=5 |
| **LSTM** | Deep Learning | 2 LSTM layers (64→32 units) + Dropout(0.2) + Dense(16→1) |
| **Bi-LSTM** | Deep Learning | 2 Bidirectional LSTM layers (64→32) + Dropout(0.2) + Dense(16→1) |

**Data preprocessing**: MinMaxScaler for both features and target. Sequence length of 60 for LSTM/BiLSTM. 80/20 time-based train/test split.

### Pipeline 2: Production Forecaster (`src/forecaster.py`)

Powers the `/forecast` API endpoint. Uses **direct multi-horizon forecasting** — a separate model is trained for each time horizon.

| Component | Detail |
|---|---|
| **Ensemble** | 50% XGBoost + 30% Random Forest + 20% Ridge Regression |
| **Horizons** | 7 days (1 week), 30 days (1 month), 180 days (6 months) |
| **Target Variable** | `log(Close[t+h] / Close[t])` — cumulative log-return |
| **Feature Scaling** | StandardScaler on all 40+ features |
| **Train/Test Split** | 85% train / 15% test (time-based) |
| **Confidence Intervals** | 90th percentile of absolute residuals from held-out test set |
| **Sentiment Nudge** | Capped at ±0.8% adjustment from news sentiment |
| **Realistic Caps** | 1-week: ±10%, 1-month: ±25%, 6-month: ±60% |

**Why direct forecasting?** Traditional recursive forecasting predicts one step ahead, then feeds predictions back as input — errors compound exponentially. Direct forecasting trains a separate model per horizon, predicting cumulative returns directly from current features with zero error compounding.

---

## Feature Engineering Pipeline

### Root Pipeline Features (`src/feature_engineering.py`)

| Feature | Formula/Method |
|---|---|
| RSI (14-day) | `100 - (100 / (1 + avg_gain / avg_loss))` |
| MACD | EMA(12) - EMA(26), Signal Line = EMA(MACD, 9) |
| Moving Averages | SMA(20), SMA(50), SMA(200) |
| Volatility | Rolling 20-day std dev of daily returns |
| Lag Features | Close shifted by 1, 2, 3, 5 days |

### Production Forecaster Features (`src/forecaster.py` — 40+ features)

All features are **normalised** as ratios or z-scores so the model works consistently across stocks at different price levels.

| Category | Features |
|---|---|
| **MA Ratios** | `Close / SMA(5,10,20,50,200)` — 5 features |
| **EMA Ratios** | `Close / EMA(12,26,50)` — 3 features |
| **MACD (normalised)** | `MACD/Price`, `Signal/Price`, `Histogram/Price` — 3 features |
| **RSI** | 14-day RSI normalised to [0,1] — 1 feature |
| **Stochastic** | %K and %D (14-day) — 2 features |
| **Williams %R** | 14-day Williams %R — 1 feature |
| **Bollinger Bands** | %B position and Band Width — 2 features |
| **ATR** | 14-day ATR normalised by price — 1 feature |
| **CCI** | 20-day Commodity Channel Index — 1 feature |
| **MFI** | 14-day Money Flow Index — 1 feature |
| **Volume Ratio** | Current volume / 20-day avg volume — 1 feature |
| **OBV Z-Score** | On-Balance Volume (30-day z-score) — 1 feature |
| **Log-Return Momentum** | `log(Close / Close[t-h])` for h = 1,2,3,5,10,20 — 6 features |
| **Realised Volatility** | 5-day and 20-day rolling std of log-returns — 2 features |
| **Candle Features** | High-Low ratio, Close-Open ratio — 2 features |
| **52-Week Position** | Position within 52-week high/low range — 1 feature |
| **Trend Strength** | 20-day linear regression slope — 1 feature |
| **Cyclical Time** | Sin/Cos encoding of day-of-week and month — 4 features |

---

## Risk Analysis Engine

Implemented in `src/risk_analysis.py`, the risk engine evaluates every prediction.

| Metric | Formula | Interpretation |
|---|---|---|
| **Volatility** | `std(daily_returns)` | Measures daily price fluctuation |
| **Annualised Volatility** | `Volatility × √252` | Scaled to yearly risk |
| **Max Drawdown** | `max((peak - trough) / peak)` | Worst observed loss from peak |
| **VaR (95%)** | 5th percentile of sorted returns (Historical Simulation) | "We are 95% confident loss won't exceed this in a day" |
| **Sharpe Ratio** | `(annualised_return - Rf) / annualised_std` | Return per unit of risk |
| **Decision Score** | `(Sharpe×10) + ((1-Drawdown)×50) - (VaR×100)` clamped to [0,100] | Composite buy/sell heuristic |

---

## Backend API Reference

The FastAPI server runs on `http://localhost:8081`. All endpoints:

### Forecasting & Market Data

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/forecast` | AI multi-horizon price prediction (1w, 1m, 6m) |
| `POST` | `/predict` | Academic pipeline prediction (Ensemble model) |
| `POST` | `/history` | Historical OHLCV candlestick data |
| `POST` | `/quotes` | Batch live quotes for multiple tickers |
| `GET` | `/search?q=...&limit=10` | Real-time stock search (filters mutual funds, crypto, etc.) |
| `GET` | `/stock-detail?ticker=...` | Detailed single stock info (OHLCV, 52-week range) |
| `GET` | `/market-overview?tickers=...` | Market indices overview (NIFTY, SENSEX, etc.) |
| `GET` | `/intraday?ticker=...&period=1d&interval=5m` | Intraday price chart data |

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Login with username & password |
| `POST` | `/auth/register` | Register a new user |

### Portfolio Management

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/db/portfolio?username=...` | Get user's portfolio holdings |
| `POST` | `/db/portfolio/add` | Add a new stock to portfolio |
| `POST` | `/db/portfolio/buy` | Buy more shares of existing holding |
| `POST` | `/db/portfolio/sell` | Sell shares (auto-removes if qty reaches 0) |
| `POST` | `/db/portfolio/remove` | Remove entire holding |
| `POST` | `/db/portfolio/stoploss` | Set/update stop-loss price |

### Trade History & Alerts

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/db/trade/log` | Log a trade entry |
| `GET` | `/db/trade/history?username=...` | Get trade history (latest 200) |
| `DELETE` | `/db/trade/history?username=...` | Clear all trade history |
| `POST` | `/db/alerts/add` | Add a stop-loss alert |
| `GET` | `/db/alerts?username=...` | Get active (undismissed) alerts |
| `POST` | `/db/alerts/dismiss` | Dismiss a specific alert |
| `DELETE` | `/db/alerts?username=...` | Dismiss all alerts |

---

## Database Layer (MongoDB)

**Database**: MongoDB (NoSQL Document Store)  
**Database Name**: `stockvista`  
**Connection URI**: `mongodb://localhost:27017/` (configurable via `MONGO_URI` environment variable)  
**Driver**: `pymongo >= 4.0.0`  
**Implementation File**: `src/database.py`

### Why MongoDB?

MongoDB was chosen for its flexible document schema — stock portfolio data varies per user and doesn't require rigid relational joins. Documents are stored as BSON (Binary JSON), making it natural to work with Python dictionaries and JavaScript objects.

### Entity Relationship Diagram

```
┌──────────────────┐       1:N        ┌──────────────────────┐
│     users         │───────────────▶│      portfolio         │
│                    │                │                        │
│  _id (ObjectId)    │                │  _id (ObjectId)        │
│  username (unique) │                │  username (FK)         │
│  password_hash     │                │  symbol                │
│  created_at        │                │  name                  │
└──────────────────┘                │  qty                   │
        │                           │  avg_price             │
        │                           │  stop_loss             │
        │ 1:N                       │  added_at              │
        │                           └──────────────────────┘
        │
        ├──────────────────▶ ┌──────────────────────┐
        │                    │   trade_history        │
        │                    │                        │
        │                    │  _id (ObjectId)        │
        │                    │  username (FK)         │
        │                    │  symbol                │
        │                    │  name                  │
        │                    │  action                │
        │                    │  qty                   │
        │                    │  price                 │
        │                    │  total                 │
        │                    │  traded_at             │
        │                    └──────────────────────┘
        │
        └──────────────────▶ ┌──────────────────────┐
                             │     sl_alerts          │
                             │                        │
                             │  _id (ObjectId)        │
                             │  username (FK)         │
                             │  symbol                │
                             │  message               │
                             │  alerted_at            │
                             │  dismissed             │
                             └──────────────────────┘
```

**Relationships** (logical, not enforced by MongoDB):
- One **user** → Many **portfolio** documents (one per stock held)
- One **user** → Many **trade_history** documents (every buy/sell action)
- One **user** → Many **sl_alerts** documents (when stop-loss triggers)

---

### Collection 1: `users`

Stores registered user accounts with hashed passwords.

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto | MongoDB primary key |
| `username` | String | ✅ | Unique login identifier |
| `password_hash` | String | ✅ | SHA-256 hash of plaintext password |
| `created_at` | String (ISO) | ✅ | UTC timestamp of account creation |

**Index**: `username` — **unique** (prevents duplicate accounts)

**Hashing Method**: `hashlib.sha256(password.encode()).hexdigest()`

**Example Document**:
```json
{
  "_id": ObjectId("664a1b2c3d4e5f6a7b8c9d0e"),
  "username": "user1",
  "password_hash": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
  "created_at": "2026-05-06T03:20:00+00:00"
}
```

---

### Collection 2: `portfolio`

Stores each user's current stock holdings. Each document = one stock in one user's portfolio.

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto | MongoDB primary key |
| `username` | String | ✅ | Owner of this holding |
| `symbol` | String | ✅ | Stock ticker (e.g., `RELIANCE.NS`, `TCS.NS`, `AAPL`) |
| `name` | String | ✅ | Company display name |
| `qty` | Float | ✅ | Number of shares held |
| `avg_price` | Float | ✅ | Weighted average purchase price per share (₹) |
| `stop_loss` | Float / null | ❌ | Auto-sell trigger price. If live price ≤ this → auto-sell |
| `added_at` | String (ISO) | ✅ | When the holding was first added |

**Index**: `(username, symbol)` — **compound unique** (one entry per stock per user)

**How `avg_price` is updated on Buy**:
```
new_avg = ((old_qty × old_avg) + (buy_qty × buy_price)) / (old_qty + buy_qty)
```

**Example Documents**:
```json
// user1's Reliance holding
{
  "_id": ObjectId("664a1b2c3d4e5f6a7b8c9d10"),
  "username": "user1",
  "symbol": "RELIANCE.NS",
  "name": "Reliance Industries",
  "qty": 15.0,
  "avg_price": 2350.0,
  "stop_loss": null,
  "added_at": "2026-05-06T03:20:00+00:00"
}

// user1's TCS holding with stop-loss set
{
  "_id": ObjectId("664a1b2c3d4e5f6a7b8c9d11"),
  "username": "user1",
  "symbol": "TCS.NS",
  "name": "Tata Consultancy",
  "qty": 10.0,
  "avg_price": 3400.0,
  "stop_loss": 3200.0,
  "added_at": "2026-05-06T03:20:00+00:00"
}
```

---

### Collection 3: `trade_history`

Logs every trade action performed by a user. Acts as an audit trail.

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto | MongoDB primary key |
| `username` | String | ✅ | Who performed the trade |
| `symbol` | String | ✅ | Stock ticker symbol |
| `name` | String | ✅ | Company name |
| `action` | String | ✅ | Type of trade: `BUY`, `SELL`, `REMOVE`, or `SL-SELL` |
| `qty` | Float | ✅ | Number of shares traded |
| `price` | Float | ✅ | Price per share at time of trade |
| `total` | Float | ✅ | `qty × price` — total transaction value |
| `traded_at` | String (ISO) | ✅ | UTC timestamp of the trade |

**Index**: `username` — regular (for fast user-specific queries)

**Action Types Explained**:
| Action | Trigger | Description |
|---|---|---|
| `BUY` | Manual | User buys shares (new addition or adding to existing) |
| `SELL` | Manual | User sells a portion of shares |
| `REMOVE` | Manual | User removes entire holding from portfolio |
| `SL-SELL` | Automatic | System auto-sells when live price ≤ stop-loss level |

**Example Documents**:
```json
// Manual buy
{
  "_id": ObjectId("664a2c3d4e5f6a7b8c9d0001"),
  "username": "user1",
  "symbol": "RELIANCE.NS",
  "name": "Reliance Industries",
  "action": "BUY",
  "qty": 15.0,
  "price": 2350.0,
  "total": 35250.0,
  "traded_at": "2026-05-06T03:20:00+00:00"
}

// Automatic stop-loss sell
{
  "_id": ObjectId("664a2c3d4e5f6a7b8c9d0002"),
  "username": "user1",
  "symbol": "TCS.NS",
  "name": "Tata Consultancy",
  "action": "SL-SELL",
  "qty": 10.0,
  "price": 3180.50,
  "total": 31805.0,
  "traded_at": "2026-05-06T10:15:30+00:00"
}
```

---

### Collection 4: `sl_alerts`

Stores notifications generated when a stop-loss is triggered.

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto | MongoDB primary key |
| `username` | String | ✅ | Alert owner |
| `symbol` | String | ✅ | Stock that triggered the alert |
| `message` | String | ✅ | Human-readable alert description |
| `alerted_at` | String (ISO) | ✅ | When the alert was generated |
| `dismissed` | Integer | ✅ | `0` = active/visible, `1` = dismissed by user |

**Index**: `username` — regular

**Example Document**:
```json
{
  "_id": ObjectId("664a3d4e5f6a7b8c9d0e0003"),
  "username": "user1",
  "symbol": "TCS.NS",
  "message": "Auto-sold 10 shares @ ₹3,180.50 — stop-loss ₹3,200.00 triggered.",
  "alerted_at": "2026-05-06T10:15:30+00:00",
  "dismissed": 0
}
```

---

### Database CRUD Operations Mapping

How each API endpoint maps to database operations:

| API Endpoint | MongoDB Operation | Collection |
|---|---|---|
| `POST /auth/register` | `db.users.insert_one()` | users |
| `POST /auth/login` | `db.users.find_one({ username, password_hash })` | users |
| `GET /db/portfolio` | `db.portfolio.find({ username })` | portfolio |
| `POST /db/portfolio/add` | `db.portfolio.insert_one()` | portfolio |
| `POST /db/portfolio/buy` | `db.portfolio.update_one({ $set: { qty, avg_price } })` | portfolio |
| `POST /db/portfolio/sell` | `db.portfolio.update_one()` or `delete_one()` (if qty=0) | portfolio |
| `POST /db/portfolio/remove` | `db.portfolio.delete_one()` | portfolio |
| `POST /db/portfolio/stoploss` | `db.portfolio.update_one({ $set: { stop_loss } })` | portfolio |
| `POST /db/trade/log` | `db.trade_history.insert_one()` | trade_history |
| `GET /db/trade/history` | `db.trade_history.find().sort("traded_at", -1).limit(200)` | trade_history |
| `DELETE /db/trade/history` | `db.trade_history.delete_many({ username })` | trade_history |
| `POST /db/alerts/add` | `db.sl_alerts.insert_one()` | sl_alerts |
| `GET /db/alerts` | `db.sl_alerts.find({ username, dismissed: 0 })` | sl_alerts |
| `POST /db/alerts/dismiss` | `db.sl_alerts.update_one({ $set: { dismissed: 1 } })` | sl_alerts |
| `DELETE /db/alerts` | `db.sl_alerts.update_many({ $set: { dismissed: 1 } })` | sl_alerts |

---

### Seeded Demo Data (Auto-created on First Startup)

The `init_db()` function seeds the following data if the database is empty:

**Demo Users**:

| Username | Password | Password Hash (SHA-256) |
|---|---|---|
| `user1` | `pass1` | `a665a45920422f9d...` |
| `user2` | `pass2` | `b3a8e0e1f9ab1bfe...` |
| `user3` | `pass3` | `3b5d5c7548aeed4e...` |

**Demo Portfolios**:

| User | Symbol | Company Name | Qty | Avg Price (₹) |
|---|---|---|---|---|
| user1 | RELIANCE.NS | Reliance Industries | 15 | 2,350 |
| user1 | TCS.NS | Tata Consultancy | 10 | 3,400 |
| user1 | HDFCBANK.NS | HDFC Bank | 20 | 1,520 |
| user1 | INFY.NS | Infosys | 25 | 1,430 |
| user2 | TATAMOTORS.NS | Tata Motors | 50 | 620 |
| user2 | ITC.NS | ITC Limited | 100 | 390 |
| user2 | BAJFINANCE.NS | Bajaj Finance | 8 | 6,800 |
| user3 | SBIN.NS | State Bank of India | 40 | 580 |
| user3 | BHARTIARTL.NS | Bharti Airtel | 30 | 1,250 |
| user3 | WIPRO.NS | Wipro | 60 | 410 |

---

### Cached CSV Data Storage (`backend/data/`)

The Yahoo Finance API responses are cached as CSV files on disk to avoid redundant API calls. These are **not stored in MongoDB** — they are flat files.

**File naming convention**: `{TICKER}_{START_DATE}_{END_DATE}.csv`

**Example files**:
```
backend/data/
├── AAPL_2020-01-01_2023-01-01.csv
├── RELIANCE.NS_2025-04-10_2026-04-10.csv
├── TCS.NS_2025-04-02_2026-04-02.csv
└── TSLA_2025-04-01_2026-04-01.csv
```

**CSV Column Structure** (OHLCV format):
| Column | Type | Description |
|---|---|---|
| Date | String | Trading date (YYYY-MM-DD) |
| Open | Float | Opening price |
| High | Float | Day's highest price |
| Low | Float | Day's lowest price |
| Close | Float | Closing price |
| Volume | Integer | Number of shares traded |

**Example CSV rows**:
```csv
Date,Open,High,Low,Close,Volume
2025-04-01,174.53,176.82,173.91,175.24,58432100
2025-04-02,175.60,177.45,174.20,176.89,62145300
```

The `DataLoader` class in `src/data_loader.py` checks if a cached file exists before calling Yahoo Finance. If the file exists, it reads from disk. If not, it downloads and saves it.

---

### How Data Flows Between Collections

```
User registers → INSERT into [users]
        │
User logs in → QUERY [users] by (username + password_hash)
        │
User adds stock → INSERT into [portfolio] + INSERT into [trade_history] (action: BUY)
        │
User buys more → UPDATE [portfolio] (recalculate avg_price) + INSERT [trade_history]
        │
User sells → UPDATE/DELETE [portfolio] + INSERT [trade_history] (action: SELL)
        │
User sets stop-loss → UPDATE [portfolio] (set stop_loss field)
        │
Live price ≤ stop_loss → DELETE from [portfolio]
                        + INSERT into [trade_history] (action: SL-SELL)
                        + INSERT into [sl_alerts] (with message)
        │
User dismisses alert → UPDATE [sl_alerts] (dismissed: 0 → 1)
```

---

## Frontend Application

### Routing Map

| Route | Page | Description |
|---|---|---|
| `/` | `DashboardPage` | Portfolio overview, live quotes, P&L, trade actions, stop-loss alerts |
| `/market` | `MarketPage` | Market indices (NIFTY 50, SENSEX, Bank NIFTY, NIFTY IT) |
| `/ai-forecast` | `AIForecastPage` | AI price prediction with search, forecast cards, chart, news |
| `/stock/:symbol` | `StockDetailPage` | Individual stock detail page with candlestick chart |
| `/calculators` | `CalculatorsPage` | Calculator hub navigation |
| `/calculators/sip` | `SipPage` | Systematic Investment Plan calculator |
| `/calculators/lumpsum` | `LumpsumPage` | One-time investment growth calculator |
| `/calculators/xirr` | `XirrPage` | Extended Internal Rate of Return calculator |
| `/calculators/wealth-forecaster` | `WealthProjectionPage` | Long-term wealth projection with inflation |

### Key Frontend Features

- **Session Persistence**: User session stored in `localStorage` (key: `stockvista_user`), survives page refresh
- **Global Search**: Real-time stock search in the top bar with debounced API calls (300ms), filters out mutual funds/crypto/currencies
- **Live Quotes**: Portfolio stock prices auto-refresh every 15 seconds via `/quotes` endpoint
- **Market Indices**: Index data auto-refreshes every 30 seconds via `/market-overview`
- **Stop-Loss Automation**: Frontend checks live prices against stop-loss levels and triggers auto-sell via backend API
- **Trade History**: Collapsible panel showing all BUY/SELL/REMOVE/SL-SELL actions with timestamps
- **Toast Notifications**: Success/warning/error toasts for all trade actions
- **INR Formatting**: All prices formatted in Indian numbering system (Lakhs, Crores)

---

## Data Flow (End-to-End)

### Flow 1: AI Forecast (User searches a stock → gets prediction)

```
User types "RELIANCE.NS" on AI Forecast Page
        │
        ▼
Frontend sends POST /forecast { ticker: "RELIANCE.NS" }
        │
        ▼
Backend calls src/forecaster.run_forecast("RELIANCE.NS")
        │
        ├── 1. fetch_price_history() → Yahoo Finance v8 API → 3 years OHLCV data
        ├── 2. fetch_news() → Yahoo Finance v1 Search API → 20 news headlines
        │       └── _score_headline() → keyword-based bullish/bearish scoring
        ├── 3. build_features() → 40+ normalised technical indicators
        ├── 4. For each horizon (7d, 30d, 180d):
        │       ├── Build target: log(Close[t+h] / Close[t])
        │       ├── 85/15 time-based train/test split
        │       ├── StandardScaler on features
        │       ├── _train_ensemble() → XGBoost + RF + Ridge
        │       ├── Back-test on held-out test set → RMSE, MAPE, CI
        │       ├── Predict on latest features
        │       ├── Apply sentiment nudge (capped ±0.8%)
        │       └── Clamp to realistic caps (±10%, ±25%, ±60%)
        ├── 5. Generate 30-day forward chart (smooth interpolation + volatility noise)
        │
        ▼
Backend returns JSON: { ticker, name, current_price, forecast, metrics, chart_data, sentiment, news }
        │
        ▼
Frontend renders: Stock header → 3 Forecast Cards → Stats → Chart → News headlines
```

### Flow 2: Portfolio Dashboard (User views portfolio)

```
User logs in → DashboardPage loads
        │
        ├── GET /db/portfolio?username=user1       → Holdings list
        ├── GET /db/trade/history?username=user1   → Trade history
        ├── GET /db/alerts?username=user1           → Stop-loss alerts
        │
        ▼
Frontend extracts unique ticker symbols from holdings
        │
        ├── POST /quotes { tickers: ["RELIANCE.NS", "TCS.NS", ...] }
        │       └── Backend fetches live price for each via Yahoo Finance v8 Chart API
        │
        ├── GET /market-overview → NIFTY 50, SENSEX, Bank NIFTY, NIFTY IT indices
        │
        ▼
Frontend computes: Current Value, Total P&L, % Change per stock
        │
        ├── Checks: if (live_price <= stop_loss) → Auto-sell triggered
        │       ├── POST /db/portfolio/remove
        │       ├── POST /db/alerts/add
        │       └── POST /db/trade/log (action: "SL-SELL")
        │
        ▼
Renders: Index strip → Summary cards → Stop-loss alerts → Holdings table → Trade history
```

---

## Setup & Installation

### Prerequisites

- **Python 3.10+** with pip
- **Node.js 18+** with npm
- **MongoDB** running locally on default port (27017)

### Step 1: Clone the Repository

```bash
git clone https://github.com/vijayalakshmipasupuleti/Enhanced_Stock_Forecasting_for_Risk-Aware_Investing.git
cd Enhanced_Stock_Forecasting_for_Risk-Aware_Investing
```

### Step 2: Create & Activate Virtual Environment

```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
```

### Step 3: Install Python Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### Step 5: Install Root Tooling

```bash
npm install
```

### Step 6: Start MongoDB

Ensure MongoDB is running on `mongodb://localhost:27017/`. The database `stockvista` and its collections are created automatically on first startup.

---

## Running the Application

### Full Stack (Recommended)

```bash
npm run dev
```

This starts both services concurrently:
- **FastAPI backend** → `http://localhost:8081`
- **Vite frontend** → `http://localhost:5173` (default)

### Backend Only

```bash
run_backend.bat
# or
venv\Scripts\python.exe -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8081
```

### Standalone ML Pipeline (Academic)

```bash
python main.py --ticker AAPL --start 2020-01-01 --end 2023-01-01
```

Outputs prediction charts and comparison graphs to the `outputs/` folder.

---

## Evaluation Metrics

| Metric | Formula | What It Measures |
|---|---|---|
| **RMSE** | `√(mean((actual - predicted)²))` | Average magnitude of prediction error |
| **MAE** | `mean(|actual - predicted|)` | Average absolute error |
| **MAPE** | `mean(|actual - predicted| / actual) × 100` | Percentage error relative to actual price |
| **Directional Accuracy** | `% of days where sign(Δactual) == sign(Δpredicted)` | How often the model predicts the correct direction |

---

## Demo Credentials

| Username | Password |
|---|---|
| user1 | pass1 |
| user2 | pass2 |
| user3 | pass3 |

---

## License

This project was developed as part of an MCA academic project.
