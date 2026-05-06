import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Brain, TrendingUp, TrendingDown, Minus, Newspaper, BarChart2,
  Calendar, AlertCircle, Loader2, Search, RefreshCw, Info, Building2, X
} from 'lucide-react';
import { API_BASE } from '../utils/format';

/* ─── tiny colour helpers ─── */
const GREEN  = 'var(--accent-green,  #00e676)';
const RED    = '#ff4d6d';
const YELLOW = '#ffd60a';
const CYAN   = 'var(--accent-cyan, #00f0ff)';
const PURPLE = 'var(--accent-purple, #bd00ff)';

function pctColor(v) {
  if (v > 0) return GREEN;
  if (v < 0) return RED;
  return 'var(--text-secondary)';
}

/* ─── sparkline-style simple SVG line chart ─── */
function MiniChart({ data = [] }) {
  if (!data.length) return null;

  const W = 900, H = 220;
  const actuals   = data.filter(d => d.actual   !== null && d.actual   !== undefined);
  const predicted = data.filter(d => d.predicted !== null && d.predicted !== undefined);
  const all = [...actuals.map(d => d.actual), ...predicted.map(d => d.predicted)];
  if (!all.length) return null;

  const minY = Math.min(...all) * 0.995;
  const maxY = Math.max(...all) * 1.005;
  const n    = data.length;

  const xScale = (i) => (i / (n - 1)) * W;
  const yScale = (v) => H - ((v - minY) / (maxY - minY + 1e-9)) * H;

  const toPath = (pts) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(p.idx).toFixed(1)},${yScale(p.v).toFixed(1)}`).join(' ');

  const indexedActual = actuals.map(d => ({ idx: data.indexOf(d), v: d.actual }));
  const indexedPred   = predicted.map(d => ({ idx: data.indexOf(d), v: d.predicted }));

  const lastActualIdx = indexedActual.length ? indexedActual[indexedActual.length - 1].idx : 0;
  const bridge = indexedActual.length && indexedPred.length
    ? [{ idx: lastActualIdx, v: indexedActual[indexedActual.length - 1].v }, ...indexedPred]
    : indexedPred;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: 200, display: 'block' }}
    >
      <defs>
        <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={CYAN}   stopOpacity="0.25" />
          <stop offset="100%" stopColor={CYAN}   stopOpacity="0" />
        </linearGradient>
        <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={PURPLE} stopOpacity="0.25" />
          <stop offset="100%" stopColor={PURPLE} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Actual area */}
      {indexedActual.length > 1 && (
        <>
          <path
            d={`${toPath(indexedActual)} L${xScale(indexedActual.at(-1).idx).toFixed(1)},${H} L${xScale(indexedActual[0].idx).toFixed(1)},${H} Z`}
            fill="url(#actualGrad)"
          />
          <path d={toPath(indexedActual)} fill="none" stroke={CYAN} strokeWidth="2.5" strokeLinejoin="round" />
        </>
      )}

      {/* Predicted area */}
      {bridge.length > 1 && (
        <>
          <path
            d={`${toPath(bridge)} L${xScale(bridge.at(-1).idx).toFixed(1)},${H} L${xScale(bridge[0].idx).toFixed(1)},${H} Z`}
            fill="url(#predGrad)"
          />
          <path
            d={toPath(bridge)}
            fill="none" stroke={PURPLE} strokeWidth="2.5"
            strokeDasharray="6 3" strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}

/* ─── Forecast card ─── */
function ForecastCard({ label, icon: Icon, iconColor, price, change_pct, ci, currency }) {
  const isPos = change_pct > 0;
  const isNeg = change_pct < 0;

  return (
    <div className="fc-card">
      <div className="fc-card-header">
        <Icon size={20} color={iconColor} />
        <span className="fc-card-label">{label}</span>
      </div>
      <div className="fc-card-price">
        <span className="fc-currency">{currency}</span>
        <span className="fc-amount">{price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
      </div>
      <div className="fc-change" style={{ color: pctColor(change_pct) }}>
        {isPos ? '+' : ''}{change_pct}%
      </div>
      <div className="fc-ci">
        Range: {ci.low.toLocaleString('en-IN', { maximumFractionDigits: 2 })} – {ci.high.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
      </div>
    </div>
  );
}

/* ─── Sentiment badge ─── */
function SentimentBadge({ label, score }) {
  const cfg = {
    Bullish:  { color: GREEN,   icon: TrendingUp,   bg: 'rgba(0,230,118,0.1)' },
    Bearish:  { color: RED,     icon: TrendingDown, bg: 'rgba(255,77,109,0.1)' },
    Neutral:  { color: YELLOW,  icon: Minus,        bg: 'rgba(255,214,10,0.1)' },
  };
  const { color, icon: Icon, bg } = cfg[label] || cfg.Neutral;

  return (
    <div className="sentiment-badge" style={{ background: bg, border: `1px solid ${color}30` }}>
      <Icon size={16} color={color} />
      <span style={{ color, fontWeight: 700 }}>{label}</span>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
        (score: {score >= 0 ? '+' : ''}{score.toFixed(3)})
      </span>
    </div>
  );
}

/* ─── Main page ─── */
export default function AIForecastPage() {
  const [ticker, setTicker]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [result,  setResult]      = useState(null);
  const [error,   setError]       = useState('');

  // Suggestion dropdown state
  const [suggestions, setSuggestions] = useState([]);
  const [showDrop,    setShowDrop]    = useState(false);
  const [searching,   setSearching]   = useState(false);
  const [activeIdx,   setActiveIdx]   = useState(-1);

  const inputRef    = useRef(null);
  const wrapperRef  = useRef(null);
  const debounceRef = useRef(null);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Debounced live search ── */
  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setSuggestions([]); setSearching(false); return; }
    setSearching(true);
    try {
      const res  = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}&limit=8`);
      const data = res.ok ? await res.json() : {};
      setSuggestions(data.results || []);
    } catch { setSuggestions([]); }
    finally   { setSearching(false); }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value.toUpperCase();
    setTicker(val);
    setActiveIdx(-1);
    setShowDrop(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 280);
  };

  const runForecastWith = useCallback(async (sym) => {
    const symbol = (sym || ticker).trim().toUpperCase();
    if (!symbol) return;
    setShowDrop(false);
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: symbol }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      setResult(await res.json());
    } catch (e) {
      setError(e.message || 'Forecast failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  // Keep legacy alias so quick-picks still work
  const runForecast = runForecastWith;

  const selectSuggestion = (sym) => {
    setTicker(sym);
    setShowDrop(false);
    setSuggestions([]);
    setActiveIdx(-1);
    runForecastWith(sym);
  };

  const clearInput = () => {
    setTicker('');
    setSuggestions([]);
    setShowDrop(false);
    inputRef.current?.focus();
  };

  /* ── Keyboard navigation inside dropdown ── */
  const handleKeyDown = (e) => {
    if (!showDrop || !suggestions.length) {
      if (e.key === 'Enter') runForecastWith(ticker);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0) selectSuggestion(suggestions[activeIdx].symbol);
      else runForecastWith(ticker);
    } else if (e.key === 'Escape') {
      setShowDrop(false);
      setActiveIdx(-1);
    }
  };

  const QUICK = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'SBIN.NS', 'AAPL', 'TSLA'];

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div className="afp-shell">
      <style>{`
        :root {
          --accent-green: #00e676;
        }

        /* ── Page shell ── */
        .afp-shell {
          color: var(--text-primary);
          max-width: 1100px;
          margin: 0 auto;
          padding-bottom: 3rem;
          font-family: 'Inter', sans-serif;
        }

        /* ── Hero section ── */
        .afp-hero {
          background: linear-gradient(135deg, rgba(0,240,255,0.07), rgba(189,0,255,0.07));
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 2rem 2.5rem;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .afp-hero-icon {
          width: 60px; height: 60px;
          background: linear-gradient(135deg, rgba(0,240,255,0.15), rgba(189,0,255,0.15));
          border: 1px solid rgba(0,240,255,0.25);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .afp-hero-title {
          font-size: 1.6rem; font-weight: 800;
          background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; line-height: 1.2; margin: 0 0 4px;
        }
        .afp-hero-sub { color: var(--text-secondary); font-size: 0.9rem; margin: 0; }

        /* ── Search bar ── */
        .afp-search-wrap {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .afp-search-row {
          display: flex; gap: 12px;
        }
        /* Wrapper gives us position:relative anchor for the dropdown */
        .afp-input-outer {
          flex: 1; position: relative;
        }
        .afp-input-wrap {
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 12px 16px;
          transition: all 0.2s;
        }
        .afp-input-wrap.open {
          border-color: var(--accent-cyan);
          box-shadow: 0 0 16px rgba(0,240,255,0.12);
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
          border-bottom-color: transparent;
        }
        .afp-input-wrap:focus-within:not(.open) {
          border-color: var(--accent-cyan);
          box-shadow: 0 0 16px rgba(0,240,255,0.12);
        }
        .afp-input {
          flex: 1; background: transparent; border: none; outline: none;
          color: var(--text-primary); font-size: 1rem; font-family: inherit;
          text-transform: uppercase;
        }
        .afp-input::placeholder { color: rgba(255,255,255,0.25); text-transform: none; }
        .afp-clear-btn {
          background: none; border: none; cursor: pointer; padding: 2px;
          color: var(--text-secondary); display: flex; align-items: center;
          transition: color 0.15s;
        }
        .afp-clear-btn:hover { color: var(--text-primary); }

        /* ── Suggestions dropdown ── */
        .afp-dropdown {
          position: absolute;
          top: 100%; left: 0; right: 0;
          background: var(--bg-secondary);
          border: 1px solid var(--accent-cyan);
          border-top: none;
          border-bottom-left-radius: 10px;
          border-bottom-right-radius: 10px;
          box-shadow: 0 12px 36px rgba(0,0,0,0.55);
          z-index: 500;
          overflow: hidden;
          animation: dropIn 0.15s ease;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: none; }
        }
        .afp-drop-searching {
          padding: 14px 16px;
          font-size: 0.85rem; color: var(--text-secondary);
          display: flex; align-items: center; gap: 8px;
        }
        .afp-drop-empty {
          padding: 14px 16px;
          font-size: 0.85rem; color: var(--text-secondary); text-align: center;
        }
        .afp-drop-section {
          padding: 8px 14px 4px;
          font-size: 0.68rem; text-transform: uppercase; letter-spacing: 1.2px;
          color: rgba(255,255,255,0.3);
          background: rgba(0,0,0,0.15);
        }
        .afp-sug-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 16px; cursor: pointer;
          transition: background 0.15s;
          border-bottom: 1px solid rgba(255,255,255,0.025);
        }
        .afp-sug-item:last-child { border-bottom: none; }
        .afp-sug-item:hover, .afp-sug-item.active {
          background: rgba(0,240,255,0.07);
        }
        .afp-sug-left { display: flex; align-items: center; gap: 10px; }
        .afp-sug-icon { color: var(--accent-cyan); opacity: 0.75; flex-shrink: 0; }
        .afp-sug-symbol {
          font-size: 0.9rem; font-weight: 700; color: var(--text-primary); line-height: 1.2;
        }
        .afp-sug-name   {
          font-size: 0.73rem; color: var(--text-secondary); line-height: 1.2;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px;
        }
        .afp-mkt-badge {
          font-size: 0.6rem; font-weight: 700; padding: 3px 7px;
          border-radius: 5px; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0;
        }
        .afp-mkt-badge.nse    { background: rgba(0,240,255,0.1);   color: var(--accent-cyan); }
        .afp-mkt-badge.bse    { background: rgba(189,0,255,0.12);  color: var(--accent-purple); }
        .afp-mkt-badge.global { background: rgba(255,255,255,0.05); color: var(--text-secondary); }

        .afp-btn {
          padding: 12px 24px;
          background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
          border: none; border-radius: 10px;
          color: #000; font-weight: 700; font-size: 0.95rem;
          cursor: pointer; transition: all 0.2s; white-space: nowrap;
          display: flex; align-items: center; gap: 8px;
          align-self: flex-start;
        }
        .afp-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,240,255,0.25); }
        .afp-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

        /* Quick picks */
        .quick-picks {
          display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;
        }
        .qp-chip {
          padding: 5px 12px; border-radius: 20px;
          border: 1px solid var(--border-color);
          background: rgba(255,255,255,0.03);
          color: var(--text-secondary); font-size: 0.78rem;
          cursor: pointer; transition: all 0.2s;
        }
        .qp-chip:hover {
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
          background: rgba(0,240,255,0.05);
        }

        /* ── Loading ── */
        .afp-loading {
          text-align: center; padding: 4rem 0;
          display: flex; flex-direction: column; align-items: center; gap: 1rem;
        }
        .afp-loading-spin {
          animation: spin 1s linear infinite; color: var(--accent-cyan);
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .afp-loading-text { color: var(--text-secondary); font-size: 0.95rem; }
        .afp-loading-sub  { color: rgba(255,255,255,0.3); font-size: 0.8rem; }

        /* ── Error ── */
        .afp-error {
          background: rgba(255,77,109,0.08);
          border: 1px solid rgba(255,77,109,0.3);
          border-radius: 12px; padding: 1rem 1.5rem;
          display: flex; align-items: center; gap: 12px;
          color: #ff4d6d; font-size: 0.9rem;
        }

        /* ── Result panels ── */
        .afp-result { animation: fadeIn 0.5s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }

        /* Stock header */
        .afp-stock-header {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 16px; padding: 1.25rem 1.5rem;
          margin-bottom: 1.5rem;
        }
        .afp-stock-meta { display: flex; flex-direction: column; gap: 2px; }
        .afp-stock-name { font-size: 1.2rem; font-weight: 700; }
        .afp-stock-sym  { font-size: 0.8rem; color: var(--text-secondary); }
        .afp-stock-price {
          font-size: 2rem; font-weight: 800;
          background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .afp-stock-sub { font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px; }

        /* Sentiment */
        .sentiment-badge {
          display: inline-flex; align-items: center; gap: 8px;
          border-radius: 8px; padding: 6px 14px;
          font-size: 0.9rem;
        }

        /* Forecast cards */
        .fc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1rem; margin-bottom: 1.5rem;
        }
        .fc-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 16px; padding: 1.25rem 1.5rem;
          transition: all 0.2s;
        }
        .fc-card:hover {
          border-color: rgba(0,240,255,0.25);
          box-shadow: 0 4px 20px rgba(0,240,255,0.08);
          transform: translateY(-2px);
        }
        .fc-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .fc-card-label  { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); }
        .fc-card-price  { display: flex; align-items: baseline; gap: 4px; margin-bottom: 4px; }
        .fc-currency    { font-size: 0.85rem; color: var(--text-secondary); }
        .fc-amount      { font-size: 1.7rem; font-weight: 800; color: var(--text-primary); }
        .fc-change      { font-size: 1rem; font-weight: 700; margin-bottom: 6px; }
        .fc-ci          { font-size: 0.72rem; color: var(--text-secondary); }

        /* Stats row */
        .afp-stats-row {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1rem; margin-bottom: 1.5rem;
        }
        .afp-stat {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px; padding: 1rem 1.25rem;
        }
        .afp-stat-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); margin-bottom: 4px; }
        .afp-stat-val   { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); }

        /* Chart */
        .afp-chart-panel {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 16px; padding: 1.25rem 1.5rem;
          margin-bottom: 1.5rem;
        }
        .afp-panel-title {
          font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;
          color: var(--text-secondary); margin: 0 0 1rem;
          display: flex; align-items: center; gap: 8px;
        }
        .chart-legend { display: flex; gap: 16px; margin-bottom: 12px; }
        .legend-dot   { width: 12px; height: 3px; border-radius: 2px; display: inline-block; }
        .legend-item  { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: var(--text-secondary); }

        /* News */
        .afp-news-panel {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 16px; padding: 1.25rem 1.5rem;
        }
        .news-item {
          display: flex; gap: 12px; align-items: flex-start;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .news-item:last-child { border-bottom: none; }
        .news-score {
          flex-shrink: 0; width: 36px; height: 36px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.7rem; font-weight: 700;
        }
        .news-body { flex: 1; }
        .news-title  { font-size: 0.88rem; color: var(--text-primary); margin-bottom: 3px; line-height: 1.4; }
        .news-meta   { font-size: 0.72rem; color: var(--text-secondary); }

        /* Disclaimer */
        .afp-disclaimer {
          padding: 10px 14px;
          background: rgba(255,214,10,0.05);
          border: 1px solid rgba(255,214,10,0.15);
          border-radius: 10px; margin-top: 1.5rem;
          display: flex; gap: 10px; align-items: flex-start;
          font-size: 0.75rem; color: var(--text-secondary);
        }

        /* Refresh btn */
        .afp-refresh-btn {
          background: none; border: 1px solid var(--border-color);
          border-radius: 8px; padding: 6px 12px;
          color: var(--text-secondary); cursor: pointer;
          font-size: 0.8rem; display: flex; align-items: center; gap: 6px;
          transition: all 0.2s;
        }
        .afp-refresh-btn:hover { border-color: var(--accent-cyan); color: var(--accent-cyan); }

        @media (max-width: 600px) {
          .afp-hero { flex-direction: column; text-align: center; }
          .afp-search-row { flex-direction: column; }
          .fc-amount { font-size: 1.4rem; }
        }
      `}</style>

      {/* Hero */}
      <div className="afp-hero">
        <div className="afp-hero-icon">
          <Brain size={30} color={CYAN} />
        </div>
        <div>
          <h1 className="afp-hero-title">AI Stock Price Predictor</h1>
          <p className="afp-hero-sub">
            Ensemble AI model (XGBoost + RF + Ridge) trained on 3 years of price history, 40+ technical indicators &amp; live news sentiment —
            predicts prices for <strong>1 week</strong>, <strong>1 month</strong> and <strong>6 months</strong>.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="afp-search-wrap">
        <div className="afp-search-row">

          {/* Input + suggestions dropdown */}
          <div className="afp-input-outer" ref={wrapperRef}>
            <div className={`afp-input-wrap ${showDrop && ticker ? 'open' : ''}`}>
              <Search size={18} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
              <input
                ref={inputRef}
                className="afp-input"
                placeholder="Search stock, e.g. RELIANCE or TCS…"
                value={ticker}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => { if (ticker && suggestions.length) setShowDrop(true); }}
                autoComplete="off"
                disabled={loading}
              />
              {searching && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-cyan)', flexShrink: 0 }} />}
              {ticker && !loading && (
                <button className="afp-clear-btn" onClick={clearInput} title="Clear">
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Dropdown */}
            {showDrop && ticker && (
              <div className="afp-dropdown">
                {searching ? (
                  <div className="afp-drop-searching">
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    Searching markets…
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="afp-drop-empty">No results for "{ticker}"</div>
                ) : (
                  <>
                    <div className="afp-drop-section">Stocks &amp; ETFs</div>
                    {suggestions.map((item, idx) => {
                      const mktClass = item.market === 'NSE' ? 'nse' : item.market === 'BSE' ? 'bse' : 'global';
                      const mktLabel = item.market === 'NSE' ? 'NSE' : item.market === 'BSE' ? 'BSE' : (item.exchange || 'GLOBAL');
                      return (
                        <div
                          key={item.symbol}
                          className={`afp-sug-item${activeIdx === idx ? ' active' : ''}`}
                          onMouseEnter={() => setActiveIdx(idx)}
                          onMouseLeave={() => setActiveIdx(-1)}
                          onMouseDown={(e) => { e.preventDefault(); selectSuggestion(item.symbol); }}
                        >
                          <div className="afp-sug-left">
                            <Building2 size={16} className="afp-sug-icon" />
                            <div>
                              <div className="afp-sug-symbol">{item.symbol}</div>
                              <div className="afp-sug-name">{item.name}</div>
                            </div>
                          </div>
                          <span className={`afp-mkt-badge ${mktClass}`}>{mktLabel}</span>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>

          <button
            className="afp-btn"
            onClick={() => runForecastWith(ticker)}
            disabled={loading || !ticker.trim()}
          >
            {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Brain size={18} />}
            {loading ? 'Training…' : 'Predict'}
          </button>
        </div>

        <div className="quick-picks">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>Quick:</span>
          {QUICK.map(s => (
            <button
              key={s}
              className="qp-chip"
              onClick={() => { setTicker(s); setSuggestions([]); setShowDrop(false); runForecastWith(s); }}
              disabled={loading}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="afp-loading">
          <Loader2 size={48} className="afp-loading-spin" />
          <p className="afp-loading-text">Training AI model for <strong>{ticker}</strong>…</p>
          <p className="afp-loading-sub">
            Fetching 2 years of price history · computing 30+ indicators · analysing news sentiment
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="afp-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {!loading && result && (
        <div className="afp-result">
          {/* Stock header */}
          <div className="afp-stock-header">
            <div className="afp-stock-meta">
              <span className="afp-stock-name">{result.name}</span>
              <span className="afp-stock-sym">{result.ticker} · {result.exchange}</span>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div className="afp-stock-price">
                {result.currency} {result.current_price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
              <div className="afp-stock-sub">Current Price</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
              <SentimentBadge label={result.sentiment} score={result.sentiment_score} />
              <button
                className="afp-refresh-btn"
                onClick={() => runForecast(result.ticker)}
                disabled={loading}
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>

          {/* Forecast cards */}
          <div className="fc-grid">
            <ForecastCard
              label="1 Week Forecast"
              icon={Calendar}
              iconColor={CYAN}
              price={result.forecast['1w'].price}
              change_pct={result.forecast['1w'].change_pct}
              ci={result.forecast['1w'].ci}
              currency={result.currency}
            />
            <ForecastCard
              label="1 Month Forecast"
              icon={BarChart2}
              iconColor={PURPLE}
              price={result.forecast['1m'].price}
              change_pct={result.forecast['1m'].change_pct}
              ci={result.forecast['1m'].ci}
              currency={result.currency}
            />
            <ForecastCard
              label="6 Month Forecast"
              icon={TrendingUp}
              iconColor={YELLOW}
              price={result.forecast['6m'].price}
              change_pct={result.forecast['6m'].change_pct}
              ci={result.forecast['6m'].ci}
              currency={result.currency}
            />
          </div>

          {/* Accuracy metrics */}
          <div className="afp-stats-row">
            <div className="afp-stat">
              <div className="afp-stat-label">Model</div>
              <div className="afp-stat-val" style={{ fontSize: '0.78rem' }}>{result.model}</div>
            </div>
            <div className="afp-stat">
              <div className="afp-stat-label">Back-test RMSE</div>
              <div className="afp-stat-val">{result.metrics.RMSE.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
            </div>
            <div className="afp-stat">
              <div className="afp-stat-label">Back-test MAPE</div>
              <div className="afp-stat-val">{result.metrics.MAPE.toFixed(2)}%</div>
            </div>
            <div className="afp-stat">
              <div className="afp-stat-label">News Articles</div>
              <div className="afp-stat-val">{result.news_headlines.length}</div>
            </div>
            <div className="afp-stat">
              <div className="afp-stat-label">Generated At</div>
              <div className="afp-stat-val" style={{ fontSize: '0.78rem' }}>
                {new Date(result.generated_at).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Price chart */}
          <div className="afp-chart-panel">
            <h3 className="afp-panel-title">
              <BarChart2 size={16} />
              Price History + 30-Day Forecast
            </h3>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-dot" style={{ background: CYAN }} />
                Actual
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: PURPLE, borderTop: '2px dashed ' + PURPLE }} />
                Predicted
              </div>
            </div>
            <MiniChart data={result.chart_data} />
          </div>

          {/* News headlines */}
          {result.news_headlines.length > 0 && (
            <div className="afp-news-panel">
              <h3 className="afp-panel-title">
                <Newspaper size={16} />
                Key News Headlines Used for Sentiment
              </h3>
              {result.news_headlines.map((n, i) => {
                const sc = n.score;
                const bg = sc > 0.05
                  ? 'rgba(0,230,118,0.12)'
                  : sc < -0.05
                    ? 'rgba(255,77,109,0.12)'
                    : 'rgba(255,255,255,0.05)';
                const fc = sc > 0.05 ? GREEN : sc < -0.05 ? RED : YELLOW;
                const label = sc > 0.05 ? '▲' : sc < -0.05 ? '▼' : '●';

                return (
                  <div key={i} className="news-item">
                    <div className="news-score" style={{ background: bg, color: fc }}>
                      {label}
                    </div>
                    <div className="news-body">
                      <div className="news-title">{n.title}</div>
                      <div className="news-meta">
                        {n.source && <span>{n.source}</span>}
                        {n.published && <span> · {n.published}</span>}
                        <span> · Sentiment: {sc >= 0 ? '+' : ''}{sc.toFixed(3)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Disclaimer */}
          <div className="afp-disclaimer">
            <Info size={16} color={YELLOW} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              <strong>Disclaimer:</strong> AI predictions are for educational purposes only and do not constitute financial advice.
              Stock markets are inherently unpredictable. Please consult a SEBI-registered financial advisor before investing.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
