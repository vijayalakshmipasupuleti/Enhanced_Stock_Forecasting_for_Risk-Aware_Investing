# Stock Market Portfolio Main

Hybrid MCA/final-year project that combines a stock forecasting pipeline, a FastAPI backend, and a React dashboard.

## What This Project Does

- Downloads and caches stock data from Yahoo Finance
- Builds technical indicators such as RSI, MACD, moving averages, and lag features
- Trains ML and DL models for stock forecasting
- Computes risk metrics including volatility, VaR, max drawdown, Sharpe ratio, and a decision score
- Exposes prediction and history APIs through FastAPI
- Renders a frontend dashboard with portfolio views, stock analysis, charts, and calculators

## Current Architecture

This repository contains three connected layers:

1. Root ML pipeline
   - `main.py`
   - `src/data_loader.py`
   - `src/feature_engineering.py`
   - `src/models.py`
   - `src/risk_analysis.py`
   - `src/evaluation.py`
   - `src/visualization.py`

2. Backend API
   - `backend/main.py`
   - FastAPI endpoints:
     - `POST /predict`
     - `POST /history`

3. Frontend web app
   - `frontend/src/App.jsx`
   - Components under `frontend/src/components/`

## Frontend Features

- Demo login page with sample users
- Demo portfolio dashboard with selectable holdings
- Stock analysis flow backed by `POST /predict`
- Candlestick chart backed by `POST /history`
- Market overview screen with simulated live-style data
- Wealth projection calculator
- Lumpsum calculator
- XIRR calculator

## Important Notes

- The login and portfolio data are currently demo data.
- The market overview screen is a simulated dashboard, not a live market feed.
- The forecasting pipeline has been updated to predict the next closing price instead of learning the current close directly.

## Setup

### Prerequisites

- Python 3.10+
- Node.js and npm
- A working virtual environment in `venv/`

### Install Python Dependencies

```bash
pip install -r requirements.txt
```

### Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Install Root Tooling

```bash
npm install
```

## Run Options

### Run the Full Stack

From the repo root:

```bash
npm run dev
```

This starts:

- FastAPI on `http://localhost:8081`
- Vite frontend on its default dev port

### Run Only the Backend

```bash
run_backend.bat
```

### Run Only the Root ML Pipeline

```bash
run.bat
```

Or directly:

```bash
python main.py --ticker AAPL --start 2020-01-01 --end 2023-01-01
```

## Outputs

Running the root ML pipeline writes charts into `outputs/`, for example:

- `LinearRegression_prediction.png`
- `RandomForest_prediction.png`
- `XGBoost_prediction.png`
- `rmse_comparison.png`
- `sharpe_comparison.png`
- `var_comparison.png`

## Tech Stack

- Python
- FastAPI
- Uvicorn
- pandas
- numpy
- scikit-learn
- xgboost
- tensorflow
- yfinance
- React
- Vite
- Recharts
- ApexCharts

## Next Cleanup Targets

- Replace demo login and portfolio data with real persistence
- Improve API error handling and configuration management
- Add tests for the ML pipeline and backend endpoints
- Separate academic/demo views from production-style functionality more clearly
