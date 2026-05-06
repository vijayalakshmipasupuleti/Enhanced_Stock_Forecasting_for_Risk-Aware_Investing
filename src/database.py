"""
database.py  –  MongoDB persistence layer
==========================================
Collections:
  • users        – registered users (username, hashed password)
  • portfolio    – each user's stock holdings
  • trade_history – every buy/sell/remove action per user
  • sl_alerts    – stop-loss alert log per user

This implementation uses pymongo to connect to a MongoDB instance.
"""

import hashlib
import os
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pymongo import MongoClient, UpdateOne
from bson import ObjectId

# Configuration - Defaulting to local MongoDB
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = "stockvista"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# ─────────────────────────────────────────────────────────────────────────────
# Schema creation & Initialization
# ─────────────────────────────────────────────────────────────────────────────
def init_db():
    """Ensure collections and indexes exist, and seed demo users."""
    # Collections are created lazily in MongoDB, but we can create indexes
    db.users.create_index("username", unique=True)
    db.portfolio.create_index([("username", 1), ("symbol", 1)], unique=True)
    db.trade_history.create_index("username")
    db.sl_alerts.create_index("username")

    # Seed 3 demo users if not present
    seed_users = [
        ("user1", "pass1"),
        ("user2", "pass2"),
        ("user3", "pass3"),
    ]
    for uname, pwd in seed_users:
        if not db.users.find_one({"username": uname}):
            db.users.insert_one({
                "username": uname,
                "password_hash": _hash(pwd),
                "created_at": _now()
            })

    # Seed default portfolios for demo users if their portfolio is empty
    seed_portfolios = {
        "user1": [
            ("RELIANCE.NS", "Reliance Industries", 15, 2350),
            ("TCS.NS",      "Tata Consultancy",    10, 3400),
            ("HDFCBANK.NS", "HDFC Bank",           20, 1520),
            ("INFY.NS",     "Infosys",             25, 1430),
        ],
        "user2": [
            ("TATAMOTORS.NS", "Tata Motors",   50,  620),
            ("ITC.NS",        "ITC Limited",   100, 390),
            ("BAJFINANCE.NS", "Bajaj Finance", 8,   6800),
        ],
        "user3": [
            ("SBIN.NS",       "State Bank of India", 40, 580),
            ("BHARTIARTL.NS", "Bharti Airtel",       30, 1250),
            ("WIPRO.NS",      "Wipro",               60, 410),
        ],
    }
    
    for uname, holdings in seed_portfolios.items():
        if db.portfolio.count_documents({"username": uname}) == 0:
            bulk_data = []
            for sym, name, qty, avg_price in holdings:
                bulk_data.append({
                    "username": uname,
                    "symbol": sym,
                    "name": name,
                    "qty": float(qty),
                    "avg_price": float(avg_price),
                    "stop_loss": None,
                    "added_at": _now()
                })
            if bulk_data:
                db.portfolio.insert_many(bulk_data)

    print(f"[DB] MongoDB initialized (Database: {DB_NAME})")


# ─────────────────────────────────────────────────────────────────────────────
# Utilities
# ─────────────────────────────────────────────────────────────────────────────
def _hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _clean_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Convert ObjectId to string and rename _id to id for compatibility."""
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc


def _clean_docs(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [_clean_doc(doc) for doc in docs]


# ─────────────────────────────────────────────────────────────────────────────
# User authentication
# ─────────────────────────────────────────────────────────────────────────────
def authenticate_user(username: str, password: str) -> Optional[dict]:
    user = db.users.find_one({"username": username.strip(), "password_hash": _hash(password)})
    return _clean_doc(user)


def register_user(username: str, password: str) -> dict:
    username = username.strip()
    if not username or not password:
        raise ValueError("Username and password are required.")
    
    if db.users.find_one({"username": username}):
        raise ValueError("Username already taken.")
    
    db.users.insert_one({
        "username": username,
        "password_hash": _hash(password),
        "created_at": _now()
    })
    return {"username": username}


# ─────────────────────────────────────────────────────────────────────────────
# Portfolio CRUD
# ─────────────────────────────────────────────────────────────────────────────
def get_portfolio(username: str) -> List[dict]:
    docs = list(db.portfolio.find({"username": username}).sort("added_at", 1))
    return _clean_docs(docs)


def add_holding(username: str, symbol: str, name: str, qty: float, avg_price: float, stop_loss: Optional[float] = None) -> List[dict]:
    symbol = symbol.strip().upper()
    existing = db.portfolio.find_one({"username": username, "symbol": symbol})
    if existing:
        raise ValueError(f"{symbol} is already in portfolio. Use buy to add shares.")
    
    db.portfolio.insert_one({
        "username": username,
        "symbol": symbol,
        "name": name,
        "qty": float(qty),
        "avg_price": float(avg_price),
        "stop_loss": float(stop_loss) if stop_loss else None,
        "added_at": _now()
    })
    return get_portfolio(username)


def buy_holding(username: str, symbol: str, qty: float, price: float) -> List[dict]:
    symbol = symbol.strip().upper()
    row = db.portfolio.find_one({"username": username, "symbol": symbol})
    if not row:
        raise ValueError(f"{symbol} not found in portfolio. Add it first.")
    
    old_qty = float(row["qty"])
    old_avg = float(row["avg_price"])
    new_qty = old_qty + float(qty)
    new_avg = ((old_qty * old_avg) + (float(qty) * float(price))) / new_qty
    
    db.portfolio.update_one(
        {"_id": row["_id"]},
        {"$set": {"qty": new_qty, "avg_price": round(new_avg, 4)}}
    )
    return get_portfolio(username)


def sell_holding(username: str, symbol: str, qty: float) -> List[dict]:
    symbol = symbol.strip().upper()
    row = db.portfolio.find_one({"username": username, "symbol": symbol})
    if not row:
        raise ValueError(f"{symbol} not found in portfolio.")
    
    old_qty = float(row["qty"])
    if float(qty) >= old_qty:
        db.portfolio.delete_one({"_id": row["_id"]})
    else:
        db.portfolio.update_one(
            {"_id": row["_id"]},
            {"$set": {"qty": old_qty - float(qty)}}
        )
    return get_portfolio(username)


def remove_holding(username: str, symbol: str) -> List[dict]:
    symbol = symbol.strip().upper()
    db.portfolio.delete_one({"username": username, "symbol": symbol})
    return get_portfolio(username)


def set_stop_loss(username: str, symbol: str, stop_loss: Optional[float]) -> List[dict]:
    symbol = symbol.strip().upper()
    db.portfolio.update_one(
        {"username": username, "symbol": symbol},
        {"$set": {"stop_loss": float(stop_loss) if stop_loss is not None else None}}
    )
    return get_portfolio(username)


# ─────────────────────────────────────────────────────────────────────────────
# Trade history
# ─────────────────────────────────────────────────────────────────────────────
def log_trade(username: str, symbol: str, name: str, action: str, qty: float, price: float) -> dict:
    entry = {
        "username": username,
        "symbol": symbol.strip().upper(),
        "name": name,
        "action": action,
        "qty": float(qty),
        "price": float(price),
        "total": round(float(qty) * float(price), 2),
        "traded_at": _now(),
    }
    result = db.trade_history.insert_one(entry)
    entry["id"] = str(result.inserted_id)
    entry.pop("_id", None)
    return entry


def get_trade_history(username: str, limit: int = 200) -> List[dict]:
    docs = list(db.trade_history.find({"username": username}).sort("traded_at", -1).limit(limit))
    return _clean_docs(docs)


def clear_trade_history(username: str) -> None:
    db.trade_history.delete_many({"username": username})


# ─────────────────────────────────────────────────────────────────────────────
# Stop-loss alerts
# ─────────────────────────────────────────────────────────────────────────────
def add_sl_alert(username: str, symbol: str, message: str) -> dict:
    entry = {
        "username": username,
        "symbol": symbol.strip().upper(),
        "message": message,
        "alerted_at": _now(),
        "dismissed": 0
    }
    result = db.sl_alerts.insert_one(entry)
    entry["id"] = str(result.inserted_id)
    entry.pop("_id", None)
    return entry


def get_sl_alerts(username: str) -> List[dict]:
    docs = list(db.sl_alerts.find({"username": username, "dismissed": 0}).sort("alerted_at", -1))
    return _clean_docs(docs)


def dismiss_sl_alert(alert_id: str, username: str) -> None:
    try:
        db.sl_alerts.update_one(
            {"_id": ObjectId(alert_id), "username": username},
            {"$set": {"dismissed": 1}}
        )
    except Exception:
        # If alert_id is not a valid ObjectId, skip
        pass


def clear_sl_alerts(username: str) -> None:
    db.sl_alerts.update_many({"username": username}, {"$set": {"dismissed": 1}})
