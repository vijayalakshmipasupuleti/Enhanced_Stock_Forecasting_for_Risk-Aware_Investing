import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Briefcase, BarChart3, Activity,
  Plus, Minus, Trash2, ShieldAlert, X, CheckCircle, AlertTriangle,
  Search, Bell, History, ArrowUpRight, ChevronDown
} from 'lucide-react';
import { API_BASE, formatPrice, formatPercent, formatINR } from '../utils/format';

/* ─────────────────────────────────────────────
   DEFAULT DATA
───────────────────────────────────────────── */
const DEFAULT_PORTFOLIOS = {
  'user1': [
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries', qty: 15, avgPrice: 2350, stopLoss: null },
    { symbol: 'TCS.NS',      name: 'Tata Consultancy',    qty: 10, avgPrice: 3400, stopLoss: null },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank',           qty: 20, avgPrice: 1520, stopLoss: null },
    { symbol: 'INFY.NS',     name: 'Infosys',             qty: 25, avgPrice: 1430, stopLoss: null },
  ],
  'user2': [
    { symbol: 'TATAMOTORS.NS', name: 'Tata Motors',   qty: 50,  avgPrice: 620,  stopLoss: null },
    { symbol: 'ITC.NS',        name: 'ITC Limited',   qty: 100, avgPrice: 390,  stopLoss: null },
    { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance', qty: 8,   avgPrice: 6800, stopLoss: null },
  ],
  'user3': [
    { symbol: 'SBIN.NS',       name: 'State Bank of India', qty: 40, avgPrice: 580,  stopLoss: null },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel',       qty: 30, avgPrice: 1250, stopLoss: null },
    { symbol: 'WIPRO.NS',      name: 'Wipro',               qty: 60, avgPrice: 410,  stopLoss: null },
  ]
};

const shortSym = s => s.replace('.NS','').replace('.BO','');

/* ─────────────────────────────────────────────
   TOAST
───────────────────────────────────────────── */
const Toast = ({ toasts, onDismiss }) => (
  <div className="toast-stack">
    {toasts.map(t => (
      <div key={t.id} className={`toast toast-${t.type}`}>
        {t.type === 'success' ? <CheckCircle size={16}/> :
         t.type === 'warn'    ? <ShieldAlert size={16}/> :
                                <AlertTriangle size={16}/>}
        <span>{t.msg}</span>
        <button className="toast-close" onClick={() => onDismiss(t.id)}><X size={13}/></button>
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────────
   ADD STOCK MODAL  (search + add new holding)
───────────────────────────────────────────── */
const AddStockModal = ({ onClose, onAdd, existingSymbols }) => {
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected]   = useState(null);
  const [qty, setQty]             = useState('');
  const [price, setPrice]         = useState('');
  const [stopLoss, setStopLoss]   = useState('');
  const [error, setError]         = useState('');
  const debounceRef = useRef(null);

  const handleQuery = (v) => {
    setQuery(v);
    setSelected(null);
    clearTimeout(debounceRef.current);
    if (v.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(v.trim())}&limit=10`);
        const data = await res.json();
        setResults(data.results || []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 400);
  };

  const handleSelect = (r) => {
    setSelected(r);
    setQuery(r.symbol);
    setResults([]);
  };

  const handleAdd = () => {
    setError('');
    if (!selected) { setError('Search and select a stock first.'); return; }
    if (existingSymbols.includes(selected.symbol)) {
      setError(`${shortSym(selected.symbol)} is already in your portfolio. Use Buy to add more.`);
      return;
    }
    const q = parseInt(qty, 10);
    const p = parseFloat(price);
    if (isNaN(q) || q <= 0) { setError('Enter a valid quantity.'); return; }
    if (isNaN(p) || p <= 0) { setError('Enter a valid buy price.'); return; }
    const sl = stopLoss ? parseFloat(stopLoss) : null;
    if (sl !== null && (isNaN(sl) || sl <= 0)) { setError('Enter a valid stop-loss price or leave blank.'); return; }
    onAdd({ symbol: selected.symbol, name: selected.name || selected.symbol, qty: q, avgPrice: p, stopLoss: sl });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card glass-panel modal-wide" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header" style={{ borderColor: 'var(--accent-cyan)' }}>
          <div className="modal-title-row">
            <Plus size={20} style={{ color: 'var(--accent-cyan)' }}/>
            <h3 className="modal-title" style={{ color: 'var(--accent-cyan)' }}>Add Stock to Portfolio</h3>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>

        <div className="modal-body">
          {/* Search */}
          <div className="form-group">
            <label>Search Stock / Symbol</label>
            <div className="search-wrap">
              <Search size={16} className="search-icon-input"/>
              <input
                type="text"
                className="modal-input search-input-pad"
                placeholder="e.g. RELIANCE, TCS, INFY..."
                value={query}
                onChange={e => handleQuery(e.target.value)}
                autoFocus
              />
              {searching && <span className="search-spinner"/>}
            </div>
            {results.length > 0 && (
              <div className="search-dropdown">
                {results.map((r, i) => (
                  <button key={i} className="search-result-row" onClick={() => handleSelect(r)}>
                    <div className="sr-left">
                      <span className="sr-sym">{r.symbol}</span>
                      <span className="sr-name">{r.name}</span>
                    </div>
                    <span className="sr-tag">{r.market || r.exchange}</span>
                  </button>
                ))}
              </div>
            )}
            {selected && (
              <div className="selected-pill">
                <CheckCircle size={14}/> {selected.symbol} — {selected.name}
              </div>
            )}
          </div>

          {/* Qty, Price, SL */}
          <div className="form-row-2">
            <div className="form-group">
              <label>Quantity</label>
              <input type="number" min="1" placeholder="Shares" value={qty} onChange={e=>setQty(e.target.value)} className="modal-input"/>
            </div>
            <div className="form-group">
              <label>Buy Price (₹)</label>
              <input type="number" min="0" step="0.01" placeholder="Avg. buy price" value={price} onChange={e=>setPrice(e.target.value)} className="modal-input"/>
            </div>
          </div>

          <div className="form-group">
            <label>Stop-Loss Price (₹) <span className="lbl-optional">optional</span></label>
            <input type="number" min="0" step="0.01" placeholder="Auto-sell if price drops below this" value={stopLoss} onChange={e=>setStopLoss(e.target.value)} className="modal-input"/>
            <p className="form-hint">If set, the stock will be automatically sold when live price falls to or below this level.</p>
          </div>

          {qty && price && (
            <div className="trade-summary">
              <span>Total Investment</span>
              <span className="trade-amount">{formatINR(parseFloat(qty||0)*parseFloat(price||0))}</span>
            </div>
          )}

          {error && <div className="modal-error"><AlertTriangle size={14}/>{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-confirm" style={{ background:'var(--accent-cyan)', color:'#0a0a0f' }} onClick={handleAdd}>
            <Plus size={16}/> Add to Portfolio
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   TRADE MODAL  (buy more / sell / set stop-loss)
───────────────────────────────────────────── */
const TradeModal = ({ stock, mode, onClose, onConfirm }) => {
  const [qty, setQty]           = useState('');
  const [price, setPrice]       = useState('');
  const [stopLoss, setStopLoss] = useState(stock?.stopLoss ?? '');
  const [slPct, setSlPct]       = useState('');
  const [error, setError]       = useState('');

  const isStopLoss = mode === 'stoploss';
  const isBuy      = mode === 'buy';
  const isSell     = mode === 'sell';

  // Quick % helpers for stop-loss
  const applyPct = (pct) => {
    const v = (stock.currentPrice * (1 - pct / 100)).toFixed(2);
    setStopLoss(v);
    setSlPct(pct);
  };

  const handleSubmit = () => {
    setError('');
    if (isStopLoss) {
      const sl = parseFloat(stopLoss);
      if (isNaN(sl) || sl <= 0) { setError('Enter a valid stop-loss price.'); return; }
      if (sl >= stock.currentPrice) { setError('Stop-loss must be below current price.'); return; }
      onConfirm({ stopLoss: sl });
      return;
    }
    const q = parseInt(qty, 10);
    const p = parseFloat(price);
    if (isNaN(q) || q <= 0) { setError('Enter a valid quantity.'); return; }
    if (isNaN(p) || p <= 0) { setError('Enter a valid price.'); return; }
    if (isSell && q > stock.qty) { setError(`Cannot sell more than ${stock.qty} shares held.`); return; }
    onConfirm({ qty: q, price: p });
  };

  const title       = isStopLoss ? 'Set Stop-Loss' : isBuy ? 'Buy More Shares' : 'Sell Shares';
  const accentColor = isStopLoss ? '#f59e0b' : isBuy ? 'var(--accent-green)' : 'var(--accent-red)';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card glass-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderColor: accentColor }}>
          <div className="modal-title-row">
            {isStopLoss ? <ShieldAlert size={20} style={{ color: accentColor }}/> :
              isBuy ? <Plus size={20} style={{ color: accentColor }}/> :
                      <Minus size={20} style={{ color: accentColor }}/>}
            <h3 className="modal-title" style={{ color: accentColor }}>{title}</h3>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>

        <div className="modal-stock-info">
          <span className="msym">{shortSym(stock.symbol)}</span>
          <span className="mname">{stock.name}</span>
          <span className="mprice">{formatPrice(stock.currentPrice)}</span>
        </div>

        <div className="modal-body">
          {isStopLoss ? (
            <>
              <div className="form-group">
                <label>Stop-Loss Price (₹)</label>
                <input
                  type="number" min="0" step="0.01" autoFocus
                  placeholder={`Below ${stock.currentPrice?.toFixed(2)}`}
                  value={stopLoss}
                  onChange={e => { setStopLoss(e.target.value); setSlPct(''); }}
                  className="modal-input"
                />
              </div>
              <div className="sl-quick-pct">
                <span className="form-hint">Quick set:</span>
                {[2,5,8,10,15].map(p => (
                  <button key={p} className={`pct-btn ${slPct===p?'pct-active':''}`} onClick={() => applyPct(p)}>
                    -{p}%
                  </button>
                ))}
              </div>
              {stopLoss && (
                <div className="sl-preview-box">
                  <div className="sl-preview-row">
                    <span>Stop-Loss Price</span>
                    <span className="sl-pre-val">{formatPrice(parseFloat(stopLoss)||0)}</span>
                  </div>
                  <div className="sl-preview-row">
                    <span>Max Loss per Share</span>
                    <span className="sl-pre-loss">
                      {formatPrice(stock.currentPrice - (parseFloat(stopLoss)||0))}
                      &nbsp;({(((stock.currentPrice - (parseFloat(stopLoss)||0)) / stock.currentPrice)*100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="sl-preview-row">
                    <span>Max Portfolio Loss</span>
                    <span className="sl-pre-loss">
                      {formatINR(stock.qty * (stock.currentPrice - (parseFloat(stopLoss)||0)))}
                    </span>
                  </div>
                </div>
              )}
              <p className="form-hint sl-hint">
                <ShieldAlert size={12}/>&nbsp;
                When live price falls to or below this level, the system will <strong>automatically sell</strong> all shares and log the trade.
                {stock.stopLoss && ` (Current: ${formatPrice(stock.stopLoss)})`}
              </p>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Quantity</label>
                <input type="number" min="1" placeholder="No. of shares" value={qty}
                  onChange={e => setQty(e.target.value)} className="modal-input" autoFocus/>
                {isSell && <p className="form-hint">You hold {stock.qty} shares.</p>}
              </div>
              <div className="form-group">
                <label>Price per share (₹)</label>
                <input type="number" min="0" step="0.01"
                  placeholder={`LTP: ${stock.currentPrice?.toFixed(2)??''}`}
                  value={price} onChange={e => setPrice(e.target.value)} className="modal-input"/>
              </div>
              {qty && price && (
                <div className="trade-summary">
                  <span>Estimated {isBuy ? 'Cost' : 'Proceeds'}</span>
                  <span className="trade-amount">{formatINR(parseFloat(qty)*parseFloat(price))}</span>
                </div>
              )}
            </>
          )}
          {error && <div className="modal-error"><AlertTriangle size={14}/>{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-confirm" style={{ background: accentColor, color: isStopLoss ? '#0a0a0f' : isBuy ? '#0a0a0f' : '#fff' }}
            onClick={handleSubmit}>
            <CheckCircle size={16}/> Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   DELETE CONFIRM MODAL
───────────────────────────────────────────── */
const DeleteModal = ({ stock, onClose, onConfirm }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-card modal-card-sm glass-panel" onClick={e => e.stopPropagation()}>
      <div className="modal-header" style={{ borderColor: 'var(--accent-red)' }}>
        <div className="modal-title-row">
          <Trash2 size={18} style={{ color:'var(--accent-red)' }}/>
          <h3 className="modal-title" style={{ color:'var(--accent-red)' }}>Remove Holding</h3>
        </div>
        <button className="modal-close" onClick={onClose}><X size={18}/></button>
      </div>
      <div className="modal-body">
        <p className="delete-msg">
          Remove <strong>{shortSym(stock.symbol)}</strong> ({stock.name}) from your portfolio?
          This action cannot be undone.
        </p>
      </div>
      <div className="modal-footer">
        <button className="btn-cancel" onClick={onClose}>Cancel</button>
        <button className="btn-confirm btn-danger" onClick={onConfirm}>
          <Trash2 size={16}/> Remove
        </button>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   STOP-LOSS ALERT PANEL
───────────────────────────────────────────── */
const StopLossPanel = ({ alerts, onDismiss, onClearAll }) => {
  if (!alerts.length) return null;
  return (
    <div className="sl-alert-panel">
      <div className="sl-panel-header">
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Bell size={16} style={{ color:'#fca5a5' }}/>
          <strong style={{ color:'#fca5a5' }}>Stop-Loss Alerts</strong>
          <span className="sl-count">{alerts.length}</span>
        </div>
        <button className="sl-clear-btn" onClick={onClearAll}>Clear All</button>
      </div>
      {alerts.map(a => (
        <div key={a.id} className="sl-alert-row">
          <div className="sl-alert-icon"><ShieldAlert size={15}/></div>
          <div className="sl-alert-body">
            <span className="sl-alert-sym">{shortSym(a.symbol)}</span>
            <span className="sl-alert-msg">{a.message || a.msg}</span>
            <span className="sl-alert-time">
              {a.alerted_at ? new Date(a.alerted_at).toLocaleString('en-IN') : (a.time || '')}
            </span>
          </div>
          <button className="sl-dismiss" onClick={() => onDismiss(a.id)}><X size={13}/></button>
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────
   TRADE HISTORY PANEL
───────────────────────────────────────────── */
const HistoryPanel = ({ history, onClear }) => {
  const [open, setOpen] = useState(false);
  if (!history.length) return null;
  return (
    <div className="history-section glass-panel">
      <button className="history-toggle" onClick={() => setOpen(o => !o)}>
        <History size={16}/> Trade History ({history.length})
        <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}/>
      </button>
      {open && (
        <>
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Stock</th><th>Action</th><th className="right">Qty</th>
                  <th className="right">Price</th><th className="right">Total</th><th>When</th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((h, i) => (
                  <tr key={i} className={`ht-row ht-${h.action.toLowerCase()}`}>
                    <td><strong>{shortSym(h.symbol)}</strong><br/><small style={{color:'var(--text-secondary)'}}>{h.name}</small></td>
                    <td>
                      <span className={`action-tag at-${h.action.toLowerCase()}`}>{h.action}</span>
                    </td>
                    <td className="right mono">{h.qty}</td>
                    <td className="right mono">{formatPrice(h.price)}</td>
                    <td className="right mono">{formatINR(h.qty * h.price)}</td>
                    <td className="ht-time">{h.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="sl-clear-btn" style={{ margin:'0.75rem 1rem 0.75rem auto', display:'flex' }} onClick={onClear}>
            Clear History
          </button>
        </>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════
   MAIN DASHBOARD
════════════════════════════════════════════ */
/* ════════════════════════════════════════════
   MAIN DASHBOARD
════════════════════════════════════════════ */
const DashboardPage = ({ user }) => {
  const navigate = useNavigate();

  // ── State ──
  const [holdings,     setHoldings]    = useState([]);
  const [tradeHistory, setHistory]     = useState([]);
  const [slAlerts,     setSlAlerts]    = useState([]);
  const [triggered,    setTriggered]   = useState(new Set()); // symbols already auto-sold this session
  const [dbReady,      setDbReady]     = useState(false);

  const [quotesBySymbol, setQuotesBySymbol] = useState({});
  const [indices,        setIndices]        = useState([]);
  const [fetchError,     setFetchError]     = useState(null);

  const [modal,  setModal]  = useState(null);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const pushToast = useCallback((msg, type = 'success') => {
    const id = ++toastIdRef.current;
    setToasts(p => [...p.slice(-3), { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);

  const dismissToast = id => setToasts(p => p.filter(t => t.id !== id));

  // ── DB helper ──
  const dbCall = useCallback(async (path, body = null, method = 'POST') => {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API_BASE}${path}`, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  }, []);

  const normaliseHolding = (h) => ({
    symbol:    h.symbol,
    name:      h.name,
    qty:       Number(h.qty),
    avgPrice:  Number(h.avg_price ?? h.avgPrice ?? 0),
    stopLoss:  h.stop_loss != null ? Number(h.stop_loss) : (h.stopLoss ?? null),
  });

  const normaliseHistory = (h) => ({
    symbol:  h.symbol,
    name:    h.name,
    action:  h.action,
    qty:     Number(h.qty),
    price:   Number(h.price),
    time:    h.traded_at ? new Date(h.traded_at).toLocaleString('en-IN') : (h.time || ''),
  });

  const refreshPortfolio = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/db/portfolio?username=${encodeURIComponent(user)}`);
      if (res.ok) {
        const d = await res.json();
        setHoldings((d.holdings || []).map(normaliseHolding));
      }
    } catch { /* silently ignore */ }
  }, [user]);

  // ── Load everything from the DB on mount ──
  useEffect(() => {
    let alive = true;
    const loadAll = async () => {
      try {
        const [pRes, hRes, aRes] = await Promise.all([
          fetch(`${API_BASE}/db/portfolio?username=${encodeURIComponent(user)}`),
          fetch(`${API_BASE}/db/trade/history?username=${encodeURIComponent(user)}`),
          fetch(`${API_BASE}/db/alerts?username=${encodeURIComponent(user)}`),
        ]);
        if (!alive) return;
        if (pRes.ok) {
          const pd = await pRes.json();
          setHoldings((pd.holdings || []).map(normaliseHolding));
        }
        if (hRes.ok) {
          const hd = await hRes.json();
          setHistory((hd.history || []).map(normaliseHistory));
        }
        if (aRes.ok) {
          const ad = await aRes.json();
          setSlAlerts(ad.alerts || []);
        }
        setDbReady(true);
      } catch (err) {
        if (alive) console.error('DB load error:', err);
        setDbReady(true);
      }
    };
    loadAll();
    return () => { alive = false; };
  }, [user]);

  const logTrade = useCallback((symbol, name, action, qty, price) => {
    const entry = { symbol, name, action, qty, price, time: new Date().toLocaleString('en-IN') };
    setHistory(prev => [entry, ...prev]);
    dbCall('/db/trade/log', { username: user, symbol, name, action, qty, price }).catch(() => {});
  }, [user, dbCall]);

  /* ── fetch quotes ── */
  useEffect(() => {
    if (!holdings.length) return;
    let alive = true;
    const go = async () => {
      try {
        const res = await fetch(`${API_BASE}/quotes`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ tickers: holdings.map(h => h.symbol) })
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!alive) return;
        const map = {};
        for (const q of data.quotes||[]) map[q.symbol] = q;
        setQuotesBySymbol(map);
        setFetchError(null);
      } catch { if (alive) setFetchError('Live quotes unavailable'); }
    };
    go();
    const iv = setInterval(go, 15000);
    return () => { alive = false; clearInterval(iv); };
  }, [holdings]);

  /* ── fetch indices ── */
  useEffect(() => {
    let alive = true;
    const go = async () => {
      try {
        const res = await fetch(`${API_BASE}/market-overview`);
        const data = await res.json();
        if (alive) setIndices(data.indices||[]);
      } catch {}
    };
    go();
    const iv = setInterval(go, 30000);
    return () => { alive = false; clearInterval(iv); };
  }, []);

  const stocks = useMemo(() => holdings.map(h => {
    const live  = quotesBySymbol[h.symbol];
    const price = live?.price > 0 ? live.price : null;
    const changePct = live?.change_percent || 0;
    const slHit = h.stopLoss && price !== null && price > 0 && price <= h.stopLoss;
    return { ...h, currentPrice: price, changePct, slHit };
  }), [holdings, quotesBySymbol]);

  /* ── AUTO-SELL on stop-loss ── */
  useEffect(() => {
    if (!dbReady) return;
    const newTriggered = new Set(triggered);
    let holdingsChanged = false;

    const autoSell = async () => {
      for (const st of stocks) {
        if (!st.stopLoss || !st.slHit) continue;
        // Guard: never auto-sell if we don't have a real live price
        if (!st.currentPrice || st.currentPrice <= 0) continue;
        if (newTriggered.has(st.symbol)) continue;

        newTriggered.add(st.symbol);
        holdingsChanged = true;

        try {
          await dbCall('/db/portfolio/remove', { username: user, symbol: st.symbol });
          const msg = `Auto-sold ${st.qty} shares @ ${formatPrice(st.currentPrice)} — stop-loss ${formatPrice(st.stopLoss)} triggered.`;
          await dbCall('/db/alerts/add', { username: user, symbol: st.symbol, message: msg });
          logTrade(st.symbol, st.name, 'SL-SELL', st.qty, st.currentPrice);
          setSlAlerts(prev => [...prev, { id: Date.now() + Math.random(), symbol: st.symbol, message: msg, alerted_at: new Date().toISOString() }]);
          pushToast(`🔴 STOP-LOSS HIT: ${shortSym(st.symbol)} sold`, 'warn');
        } catch (err) {
          console.error('Auto-sell failed:', err);
        }
      }

      if (holdingsChanged) {
        setTriggered(newTriggered);
        refreshPortfolio();
      }
    };

    autoSell();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stocks, dbReady]);

  /* ── Summary ── */
  const totalValue    = stocks.reduce((s,st) => s + (st.currentPrice ? st.qty * st.currentPrice : 0), 0);
  const totalInvested = stocks.reduce((s,st) => s + st.qty * st.avgPrice,     0);
  const totalPL       = totalValue - totalInvested;
  const totalPLpct    = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;


  /* ── Action handlers ── */
  const handleModalConfirm = async (data) => {
    const { type, stock } = modal;
    setModal(null);

    try {
      if (type === 'delete') {
        await dbCall('/db/portfolio/remove', { username: user, symbol: stock.symbol });
        logTrade(stock.symbol, stock.name, 'REMOVE', stock.qty, stock.currentPrice);
        pushToast(`${shortSym(stock.symbol)} removed from portfolio.`);
        await refreshPortfolio();

      } else if (type === 'add') {
        await dbCall('/db/portfolio/add', {
          username: user, symbol: data.symbol, name: data.name,
          qty: data.qty, avg_price: data.avgPrice, stop_loss: data.stopLoss || null,
        });
        pushToast(`${shortSym(data.symbol)} added — ${data.qty} shares @ ${formatPrice(data.avgPrice)}.`);
        await refreshPortfolio();

      } else if (type === 'buy') {
        await dbCall('/db/portfolio/buy', {
          username: user, symbol: stock.symbol, qty: data.qty, price: data.price,
        });
        logTrade(stock.symbol, stock.name, 'BUY', data.qty, data.price);
        pushToast(`Bought ${data.qty} shares of ${shortSym(stock.symbol)} @ ${formatPrice(data.price)}.`);
        await refreshPortfolio();

      } else if (type === 'sell') {
        await dbCall('/db/portfolio/sell', {
          username: user, symbol: stock.symbol, qty: data.qty,
        });
        logTrade(stock.symbol, stock.name, 'SELL', data.qty, data.price);
        pushToast(`Sold ${data.qty} shares of ${shortSym(stock.symbol)} @ ${formatPrice(data.price)}.`);
        await refreshPortfolio();

      } else if (type === 'stoploss') {
        await dbCall('/db/portfolio/stoploss', {
          username: user, symbol: stock.symbol, stop_loss: data.stopLoss,
        });
        const newT = new Set(triggered);
        newT.delete(stock.symbol);
        setTriggered(newT);
        pushToast(`Stop-loss for ${shortSym(stock.symbol)} set to ${formatPrice(data.stopLoss)}.`);
        await refreshPortfolio();
      }
    } catch (err) {
      pushToast(`Error: ${err.message}`, 'error');
    }
  };

  const openModal = (type, stock, e) => { e?.stopPropagation(); setModal({ type, stock }); };

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="dash-page animate-fade-in">
      {/* Toasts */}
      <Toast toasts={toasts} onDismiss={dismissToast}/>

      {/* Modals */}
      {modal?.type === 'add' && (
        <AddStockModal
          existingSymbols={holdings.map(h => h.symbol)}
          onClose={() => setModal(null)}
          onAdd={data => handleModalConfirm({ ...data })}
        />
      )}
      {modal && ['buy','sell','stoploss'].includes(modal.type) && (
        <TradeModal
          stock={stocks.find(s => s.symbol === modal.stock?.symbol) || modal.stock}
          mode={modal.type}
          onClose={() => setModal(null)}
          onConfirm={handleModalConfirm}
        />
      )}
      {modal?.type === 'delete' && (
        <DeleteModal
          stock={modal.stock}
          onClose={() => setModal(null)}
          onConfirm={() => handleModalConfirm({})}
        />
      )}

      {/* Indices Strip */}
      <div className="indices-strip">
        {indices.map((idx, i) => {
          const up = idx.change_percent >= 0;
          return (
            <div key={i} className="index-chip">
              <span className="idx-name">{idx.name}</span>
              <span className={`idx-price ${up?'up':'down'}`}>{formatPrice(idx.price)}</span>
              <span className={`idx-change ${up?'up':'down'}`}>
                {up ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                {formatPercent(idx.change_percent)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card glass-panel">
          <div className="sc-icon"><Briefcase size={22}/></div>
          <div><span className="sc-label">Portfolio Value</span><span className="sc-value">{formatINR(totalValue)}</span></div>
        </div>
        <div className="summary-card glass-panel">
          <div className="sc-icon invested"><BarChart3 size={22}/></div>
          <div><span className="sc-label">Total Invested</span><span className="sc-value">{formatINR(totalInvested)}</span></div>
        </div>
        <div className="summary-card glass-panel">
          <div className={`sc-icon ${totalPL>=0?'profit':'loss'}`}>
            {totalPL>=0 ? <TrendingUp size={22}/> : <TrendingDown size={22}/>}
          </div>
          <div>
            <span className="sc-label">Total P&L</span>
            <span className={`sc-value ${totalPL>=0?'up':'down'}`}>
              {formatINR(totalPL)} ({formatPercent(totalPLpct)})
            </span>
          </div>
        </div>
        <div className="summary-card glass-panel">
          <div className="sc-icon"><Activity size={22}/></div>
          <div><span className="sc-label">Holdings</span><span className="sc-value">{stocks.length} Stocks</span></div>
        </div>
      </div>

      {fetchError && <div className="quote-error">{fetchError}</div>}

      {/* Stop-Loss Alert Panel */}
      <StopLossPanel
        alerts={slAlerts}
        onDismiss={async (id) => {
          setSlAlerts(prev => prev.filter(a => a.id !== id));
          try { await fetch(`${API_BASE}/db/alerts/dismiss`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ alert_id: id, username: user }) }); } catch {}
        }}
        onClearAll={async () => {
          setSlAlerts([]);
          try { await fetch(`${API_BASE}/db/alerts?username=${encodeURIComponent(user)}`, { method:'DELETE' }); } catch {}
        }}
      />

      {/* Holdings Section */}
      <div className="holdings-section">
        <div className="holdings-header">
          <h2 className="section-title">
            <Briefcase size={20}/> Your Holdings <span className="live-chip">Live</span>
          </h2>
          <button className="add-stock-btn" onClick={() => setModal({ type:'add', stock:null })}>
            <Plus size={16}/> Add Stock
          </button>
        </div>

        <div className="holdings-table-wrap glass-panel">
          {stocks.length === 0 ? (
            <div className="empty-dashboard">
              <div className="empty-hero">
                <div className="hero-icon-ring">
                  <Briefcase size={40} className="hero-icon" />
                </div>
                <h2 className="hero-title">Welcome back, {user}!</h2>
                <p className="hero-subtitle">Your personalized Indian stock market command center is ready. Start building your portfolio to unlock all features.</p>
                <button className="add-stock-btn-large" onClick={() => setModal({ type:'add', stock:null })}>
                  <Plus size={20}/> Add Your First Stock
                </button>
              </div>

              <div className="guide-grid">
                <div className="guide-card" onClick={() => navigate('/ai-forecast')}>
                  <div className="gc-icon ai"><Activity size={20}/></div>
                  <div className="gc-body">
                    <h3>AI Price Forecast</h3>
                    <p>Predict stock trends using our XGBoost machine learning model based on technicals & sentiment.</p>
                  </div>
                </div>
                <div className="guide-card" onClick={() => navigate('/market')}>
                  <div className="gc-icon market"><TrendingUp size={20}/></div>
                  <div className="gc-body">
                    <h3>Market Intelligence</h3>
                    <p>Track live NIFTY/SENSEX indices and discover trending stocks in the Indian market.</p>
                  </div>
                </div>
                <div className="guide-card" onClick={() => navigate('/calculators/wealth-forecaster')}>
                  <div className="gc-icon wealth"><BarChart3 size={20}/></div>
                  <div className="gc-body">
                    <h3>Wealth Projection</h3>
                    <p>Model your long-term growth with inflation adjustments and expense planning.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <table className="holdings-table">

              <thead>
                <tr>
                  <th>Stock</th>
                  <th className="right">Qty</th>
                  <th className="right">Avg. Price</th>
                  <th className="right">LTP</th>
                  <th className="right d-md">Current Value</th>
                  <th className="right">P&amp;L</th>
                  <th className="right d-md">Stop-Loss</th>
                  <th className="center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock, i) => {
                  const hasPrice = stock.currentPrice !== null;
                  const value  = hasPrice ? stock.qty * stock.currentPrice : 0;
                  const inv    = stock.qty * stock.avgPrice;
                  const pl     = hasPrice ? value - inv : 0;
                  const plPct  = (hasPrice && inv > 0) ? (pl/inv)*100 : 0;
                  const up     = pl >= 0;
                  const slNear = hasPrice && stock.stopLoss && (stock.currentPrice - stock.stopLoss) / stock.currentPrice < 0.03;
                  
                  return (
                    <tr
                      key={i}
                      className={`clickable-row ${stock.slHit?'sl-row-hit':''} ${slNear&&!stock.slHit?'sl-row-near':''}`}
                      onClick={() => navigate(`/stock/${encodeURIComponent(stock.symbol)}`)}
                    >
                      <td>
                        <div className="stock-cell">
                          <span className="stock-sym">
                            {shortSym(stock.symbol)}
                            {stock.slHit && (
                              <span className="sl-badge"><ShieldAlert size={11}/> SL Hit</span>
                            )}
                            {slNear && !stock.slHit && (
                              <span className="sl-badge sl-badge-warn"><AlertTriangle size={11}/> Near SL</span>
                            )}
                          </span>
                          <span className="stock-name">{stock.name}</span>
                        </div>
                      </td>
                      <td className="right mono">{stock.qty}</td>
                      <td className="right mono">{formatPrice(stock.avgPrice)}</td>
                      <td className={`right mono ${hasPrice ? (up?'up':'down') : ''}`}>
                        {hasPrice ? (
                          <>
                            {formatPrice(stock.currentPrice)}
                            <br/><small style={{fontSize:'0.7rem',opacity:0.7}}>{formatPercent(stock.changePct)}</small>
                          </>
                        ) : (
                          <span style={{opacity:0.4, fontSize:'0.8rem'}}>Fetching...</span>
                        )}
                      </td>
                      <td className="right mono d-md">{hasPrice ? formatINR(value) : '—'}</td>
                      <td className={`right mono ${hasPrice ? (up?'up':'down') : ''}`}>
                        {hasPrice ? (
                          <>
                            {formatINR(pl)}<br/>
                            <small>{formatPercent(plPct)}</small>
                          </>
                        ) : '—'}
                      </td>
                      <td className="right mono d-md">
                        {stock.stopLoss
                          ? <span className={`sl-val-text ${stock.slHit?'sl-hit-text':slNear?'sl-near-text':''}`}>{formatPrice(stock.stopLoss)}</span>
                          : <span style={{opacity:0.3}}>—</span>}
                      </td>
                      <td className="action-cell" onClick={e => e.stopPropagation()}>
                        <div className="action-btns">
                          <button className="act-btn btn-buy"  title="Buy more" onClick={e => openModal('buy',stock,e)}><Plus size={13}/><span> Buy</span></button>
                          <button className="act-btn btn-sell" title="Sell"     onClick={e => openModal('sell',stock,e)}><Minus size={13}/><span> Sell</span></button>
                          <button className={`act-btn btn-sl ${stock.stopLoss?'sl-active':''}`} title="Set Stop-Loss" onClick={e => openModal('stoploss',stock,e)}><ShieldAlert size={13}/></button>
                          <button className="act-btn btn-del"  title="Remove"   onClick={e => openModal('delete',stock,e)}><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Trade History */}
      <HistoryPanel
        history={tradeHistory}
        onClear={async () => {
          setHistory([]);
          try { await fetch(`${API_BASE}/db/trade/history?username=${encodeURIComponent(user)}`, { method:'DELETE' }); } catch {}
        }}
      />

      {/* ═══ STYLES ═══ */}
      <style>{`
        .dash-page { display:flex; flex-direction:column; gap:1.5rem; position:relative; }

        /* ── Toast Stack ── */
        .toast-stack { position:fixed; bottom:2rem; right:2rem; z-index:9999; display:flex; flex-direction:column; gap:8px; max-width:400px; }
        .toast { display:flex; align-items:center; gap:10px; padding:13px 18px; border-radius:12px; font-size:0.88rem; font-weight:500; backdrop-filter:blur(14px); box-shadow:0 8px 30px rgba(0,0,0,.45); animation:toastIn .35s cubic-bezier(.34,1.56,.64,1); }
        .toast-success { background:rgba(0,255,157,.14); border:1px solid rgba(0,255,157,.3); color:#7cf7c8; }
        .toast-warn    { background:rgba(239,68,68,.18);  border:1px solid rgba(239,68,68,.4); color:#fca5a5; }
        .toast-error   { background:rgba(239,68,68,.14);  border:1px solid rgba(239,68,68,.3); color:#fca5a5; }
        .toast-close { background:none; border:none; cursor:pointer; color:inherit; margin-left:auto; padding:2px; opacity:.65; }
        .toast-close:hover { opacity:1; }
        @keyframes toastIn { from{transform:translateY(16px);opacity:0} to{transform:none;opacity:1} }

        /* ── Modal ── */
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.68); backdrop-filter:blur(7px); z-index:1000; display:flex; align-items:center; justify-content:center; padding:1rem; animation:mFade .2s ease; }
        @keyframes mFade { from{opacity:0} to{opacity:1} }
        .modal-card { width:100%; max-width:480px; border-radius:20px; overflow:hidden; animation:mUp .3s cubic-bezier(.34,1.56,.64,1); }
        .modal-wide { max-width:560px; }
        .modal-card-sm { max-width:400px; }
        @keyframes mUp { from{transform:translateY(28px) scale(.97);opacity:0} to{transform:none;opacity:1} }
        .modal-header { display:flex; align-items:center; justify-content:space-between; padding:1.2rem 1.5rem; border-bottom:1px solid; }
        .modal-title-row { display:flex; align-items:center; gap:10px; }
        .modal-title { font-size:1.05rem; font-weight:700; margin:0; }
        .modal-close { background:none; border:none; color:var(--text-secondary); cursor:pointer; padding:4px; border-radius:6px; transition:all .2s; }
        .modal-close:hover { color:var(--text-primary); background:rgba(255,255,255,.06); }
        .modal-stock-info { display:flex; align-items:center; gap:10px; padding:.85rem 1.5rem; background:rgba(255,255,255,.03); border-bottom:1px solid rgba(255,255,255,.05); }
        .msym { font-weight:800; font-size:1.05rem; color:var(--text-primary); }
        .mname { font-size:.82rem; color:var(--text-secondary); flex:1; }
        .mprice { font-weight:700; font-family:'JetBrains Mono',monospace; color:var(--accent-cyan); }
        .modal-body { padding:1.4rem 1.5rem; display:flex; flex-direction:column; gap:.95rem; }
        .form-group { display:flex; flex-direction:column; gap:6px; position:relative; }
        .form-group label { font-size:.77rem; text-transform:uppercase; letter-spacing:.5px; color:var(--text-secondary); font-weight:600; }
        .lbl-optional { font-size:.7rem; color:var(--text-secondary); opacity:.6; text-transform:none; letter-spacing:0; margin-left:4px; }
        .modal-input { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.12); border-radius:10px; padding:10px 14px; color:var(--text-primary); font-size:.97rem; outline:none; transition:border-color .2s; width:100%; box-sizing:border-box; }
        .modal-input:focus { border-color:var(--accent-cyan); }
        .modal-input::placeholder { color:var(--text-secondary); opacity:.45; }
        .form-hint { font-size:.77rem; color:var(--text-secondary); margin:0; display:flex; align-items:center; gap:4px; line-height:1.5; }
        .form-row-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .trade-summary { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:rgba(0,240,255,.05); border-radius:10px; border:1px solid rgba(0,240,255,.12); font-size:.87rem; color:var(--text-secondary); }
        .trade-amount { font-weight:700; font-size:1rem; color:var(--text-primary); font-family:'JetBrains Mono',monospace; }
        .modal-error { display:flex; align-items:center; gap:8px; font-size:.82rem; color:#fca5a5; background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.22); border-radius:8px; padding:8px 12px; }
        .delete-msg { color:var(--text-secondary); font-size:.93rem; line-height:1.65; margin:0; }
        .delete-msg strong { color:var(--text-primary); }
        .modal-footer { display:flex; gap:10px; justify-content:flex-end; padding:1rem 1.5rem; border-top:1px solid rgba(255,255,255,.06); }
        .btn-cancel { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); color:var(--text-secondary); border-radius:10px; padding:9px 20px; cursor:pointer; font-size:.9rem; transition:background .2s; }
        .btn-cancel:hover { background:rgba(255,255,255,.1); }
        .btn-confirm { display:flex; align-items:center; gap:7px; border:none; border-radius:10px; padding:9px 20px; font-size:.9rem; font-weight:700; cursor:pointer; transition:filter .2s,transform .12s; }
        .btn-confirm:hover { filter:brightness(1.12); transform:translateY(-1px); }
        .btn-danger { background:var(--accent-red)!important; color:#fff!important; }

        /* ── Search in AddModal ── */
        .search-wrap { position:relative; }
        .search-icon-input { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-secondary); pointer-events:none; }
        .search-input-pad { padding-left:36px!important; }
        .search-spinner { position:absolute; right:12px; top:50%; transform:translateY(-50%); width:14px; height:14px; border:2px solid rgba(255,255,255,.15); border-top-color:var(--accent-cyan); border-radius:50%; animation:spin .7s linear infinite; }
        @keyframes spin { to{transform:translateY(-50%) rotate(360deg)} }
        .search-dropdown { position:absolute; top:calc(100% + 4px); left:0; right:0; background:#1a1a2e; border:1px solid rgba(255,255,255,.12); border-radius:12px; overflow:hidden; z-index:200; box-shadow:0 8px 24px rgba(0,0,0,.5); }
        .search-result-row { width:100%; background:none; border:none; padding:10px 14px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; transition:background .15s; border-bottom:1px solid rgba(255,255,255,.04); gap:8px; }
        .search-result-row:hover { background:rgba(0,240,255,.07); }
        .sr-left { display:flex; flex-direction:column; text-align:left; }
        .sr-sym { font-weight:700; color:var(--text-primary); font-size:.9rem; }
        .sr-name { font-size:.75rem; color:var(--text-secondary); margin-top:1px; }
        .sr-tag { font-size:.7rem; font-weight:600; padding:2px 8px; border-radius:999px; background:rgba(0,240,255,.1); color:var(--accent-cyan); white-space:nowrap; }
        .selected-pill { display:inline-flex; align-items:center; gap:7px; background:rgba(0,255,157,.1); border:1px solid rgba(0,255,157,.25); color:#7cf7c8; font-size:.82rem; font-weight:600; padding:6px 12px; border-radius:999px; margin-top:2px; }

        /* ── Stop-loss quick % ── */
        .sl-quick-pct { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .pct-btn { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); color:var(--text-secondary); border-radius:8px; padding:5px 12px; cursor:pointer; font-size:.82rem; transition:all .18s; }
        .pct-btn:hover, .pct-active { background:rgba(239,68,68,.2); border-color:rgba(239,68,68,.4); color:#fca5a5; }
        .sl-preview-box { background:rgba(239,68,68,.07); border:1px solid rgba(239,68,68,.18); border-radius:12px; padding:12px 14px; display:flex; flex-direction:column; gap:8px; }
        .sl-preview-row { display:flex; justify-content:space-between; font-size:.85rem; color:var(--text-secondary); }
        .sl-pre-val { font-weight:700; color:var(--text-primary); font-family:'JetBrains Mono',monospace; }
        .sl-pre-loss { font-weight:700; color:#fca5a5; font-family:'JetBrains Mono',monospace; }
        .sl-hint { color:#fbbf24; }

        /* ── SL Alert Panel ── */
        .sl-alert-panel { background:rgba(239,68,68,.07); border:1px solid rgba(239,68,68,.25); border-radius:16px; overflow:hidden; }
        .sl-panel-header { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid rgba(239,68,68,.15); }
        .sl-count { background:rgba(239,68,68,.3); color:#fca5a5; font-size:.7rem; font-weight:700; padding:2px 8px; border-radius:999px; }
        .sl-clear-btn { background:none; border:1px solid rgba(255,255,255,.12); color:var(--text-secondary); border-radius:8px; padding:5px 12px; font-size:.78rem; cursor:pointer; transition:all .18s; }
        .sl-clear-btn:hover { color:var(--text-primary); border-color:rgba(255,255,255,.25); }
        .sl-alert-row { display:flex; align-items:flex-start; gap:10px; padding:10px 16px; border-bottom:1px solid rgba(239,68,68,.08); transition:background .15s; }
        .sl-alert-row:last-child { border-bottom:none; }
        .sl-alert-row:hover { background:rgba(239,68,68,.06); }
        .sl-alert-icon { color:#fca5a5; margin-top:2px; flex-shrink:0; }
        .sl-alert-body { flex:1; display:flex; flex-direction:column; gap:2px; }
        .sl-alert-sym { font-weight:700; color:#fca5a5; font-size:.88rem; }
        .sl-alert-msg { font-size:.82rem; color:var(--text-secondary); line-height:1.4; }
        .sl-alert-time { font-size:.72rem; color:var(--text-secondary); opacity:.6; }
        .sl-dismiss { background:none; border:none; color:var(--text-secondary); cursor:pointer; padding:3px; opacity:.6; margin-top:1px; }
        .sl-dismiss:hover { opacity:1; color:var(--text-primary); }

        /* ── Indices ── */
        .indices-strip { display:flex; gap:10px; overflow-x:auto; padding-bottom:4px; }
        .index-chip { display:flex; align-items:center; gap:10px; padding:9px 16px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; white-space:nowrap; font-size:.84rem; min-width:max-content; }
        .idx-name { color:var(--text-secondary); font-weight:500; }
        .idx-price { font-weight:700; font-family:'JetBrains Mono',monospace; }
        .idx-change { display:flex; align-items:center; gap:3px; font-weight:600; font-size:.79rem; }
        .up { color:var(--accent-green); } .down { color:var(--accent-red); }

        /* ── Summary ── */
        .summary-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px; }
        .summary-card { display:flex; align-items:center; gap:14px; padding:1.2rem; border-radius:var(--radius-md); }
        .sc-icon { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; background:rgba(0,240,255,.08); color:var(--accent-cyan); flex-shrink:0; }
        .sc-icon.invested { background:rgba(54,163,255,.08); color:var(--accent-blue); }
        .sc-icon.profit   { background:rgba(0,255,157,.08);  color:var(--accent-green); }
        .sc-icon.loss     { background:rgba(255,77,77,.08);   color:var(--accent-red); }
        .sc-label { display:block; font-size:.76rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:.5px; }
        .sc-value { display:block; font-size:1.28rem; font-weight:700; color:var(--text-primary); margin-top:2px; }
        .quote-error { color:#fca5a5; font-size:.85rem; }

        /* ── Holdings ── */
        .holdings-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem; }
        .section-title { display:flex; align-items:center; gap:10px; font-size:1.07rem; font-weight:600; color:var(--text-primary); margin:0; }
        .live-chip { font-size:.63rem; text-transform:uppercase; letter-spacing:1px; color:var(--accent-green); background:rgba(0,255,157,.1); border:1px solid rgba(0,255,157,.22); padding:3px 10px; border-radius:999px; font-weight:700; }
        .add-stock-btn { display:inline-flex; align-items:center; gap:7px; background:rgba(0,240,255,.12); border:1px solid rgba(0,240,255,.3); color:var(--accent-cyan); border-radius:10px; padding:9px 18px; font-size:.88rem; font-weight:700; cursor:pointer; transition:all .2s; }
        .add-stock-btn:hover { background:rgba(0,240,255,.2); box-shadow:0 0 16px rgba(0,240,255,.15); }
        .holdings-table-wrap { border-radius:var(--radius-md); overflow:hidden; }
        .holdings-table { width:100%; border-collapse:collapse; }
        .holdings-table th { padding:11px 14px; font-size:.72rem; text-transform:uppercase; letter-spacing:.5px; color:var(--text-secondary); font-weight:500; background:rgba(0,0,0,.2); text-align:left; }
        .holdings-table th.right,.holdings-table td.right { text-align:right; }
        .holdings-table th.center,.holdings-table td.center { text-align:center; }
        .holdings-table td { padding:12px 14px; border-bottom:1px solid rgba(255,255,255,.04); font-size:.88rem; }
        .clickable-row { cursor:pointer; transition:background .15s; }
        .clickable-row:hover { background:rgba(0,240,255,.03); }
        .sl-row-hit  { background:rgba(239,68,68,.05)!important; }
        .sl-row-near { background:rgba(251,191,36,.03)!important; }
        .sl-row-hit:hover  { background:rgba(239,68,68,.09)!important; }
        .stock-cell { display:flex; flex-direction:column; }
        .stock-sym { font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
        .stock-name { font-size:.76rem; color:var(--text-secondary); margin-top:2px; }
        .mono { font-family:'JetBrains Mono',monospace; font-size:.84rem; }
        .sl-badge { display:inline-flex; align-items:center; gap:3px; font-size:.62rem; font-weight:700; background:rgba(239,68,68,.22); color:#fca5a5; border:1px solid rgba(239,68,68,.4); padding:2px 6px; border-radius:999px; text-transform:uppercase; animation:blink 1.4s infinite; }
        .sl-badge-warn { background:rgba(251,191,36,.18); color:#fbbf24; border-color:rgba(251,191,36,.35); animation:none; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.55} }
        .sl-val-text { font-family:'JetBrains Mono',monospace; color:#fbbf24; font-size:.82rem; }
        .sl-hit-text { color:#fca5a5!important; font-weight:700; }
        .sl-near-text { color:#fbbf24!important; }
        .action-cell { padding:8px 10px!important; }
        .action-btns { display:flex; gap:5px; justify-content:center; }
        .act-btn { display:inline-flex; align-items:center; gap:3px; border:none; border-radius:8px; padding:5px 10px; font-size:.74rem; font-weight:700; cursor:pointer; transition:filter .2s,transform .12s; white-space:nowrap; }
        .act-btn:hover { filter:brightness(1.22); transform:translateY(-1px); }
        .act-btn:active { transform:none; }
        .btn-buy  { background:rgba(0,255,157,.18); color:var(--accent-green); border:1px solid rgba(0,255,157,.3); }
        .btn-sell { background:rgba(239,68,68,.18);  color:#fca5a5;            border:1px solid rgba(239,68,68,.3); }
        .btn-sl   { background:rgba(251,191,36,.15); color:#fbbf24;            border:1px solid rgba(251,191,36,.3); padding:5px 8px; }
        .btn-sl.sl-active { background:rgba(239,68,68,.18); color:#fca5a5; border-color:rgba(239,68,68,.35); }
        .btn-del  { background:rgba(180,46,46,.18);  color:#f87171;            border:1px solid rgba(180,46,46,.32); padding:5px 8px; }
        .empty-portfolio { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; padding:4rem 2rem; color:var(--text-secondary); font-size:.95rem; }

        /* ── Empty Dashboard (New User) ── */
        .empty-dashboard { padding: 3rem 2rem; display: flex; flex-direction: column; gap: 3rem; }
        .empty-hero { text-align: center; max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 1.25rem; }
        .hero-icon-ring { width: 80px; height: 80px; border-radius: 50%; background: rgba(0, 240, 255, 0.08); border: 1px solid rgba(0, 240, 255, 0.2); display: flex; align-items: center; justify-content: center; }
        .hero-icon { color: var(--accent-cyan); opacity: 0.8; }
        .hero-title { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); margin: 0; background: linear-gradient(135deg, #fff 0%, var(--text-secondary) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-subtitle { color: var(--text-secondary); line-height: 1.6; font-size: 1rem; margin: 0; opacity: 0.8; }
        .add-stock-btn-large { display: inline-flex; align-items: center; gap: 10px; background: var(--accent-cyan); color: #0a0e17; border: none; border-radius: 12px; padding: 14px 28px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); margin-top: 0.5rem; }
        .add-stock-btn-large:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(0, 240, 255, 0.3); }

        .guide-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; }
        .guide-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 16px; padding: 1.5rem; display: flex; gap: 1.25rem; cursor: pointer; transition: all 0.25s; }
        .guide-card:hover { background: rgba(255, 255, 255, 0.06); border-color: rgba(255, 255, 255, 0.12); transform: translateY(-4px); }
        .gc-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .gc-icon.ai { background: rgba(189, 0, 255, 0.12); color: #bd00ff; }
        .gc-icon.market { background: rgba(0, 255, 157, 0.12); color: #00ff9d; }
        .gc-icon.wealth { background: rgba(255, 171, 0, 0.12); color: #ffab00; }
        .gc-body h3 { font-size: 1rem; font-weight: 700; color: var(--text-primary); margin: 0 0 6px; }
        .gc-body p { font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; margin: 0; opacity: 0.7; }


        /* ── Trade History ── */
        .history-section { border-radius:var(--radius-md); overflow:hidden; }
        .history-toggle { display:flex; align-items:center; gap:10px; width:100%; background:none; border:none; color:var(--text-primary); font-size:.92rem; font-weight:600; padding:1rem 1.25rem; cursor:pointer; transition:background .2s; }
        .history-toggle:hover { background:rgba(255,255,255,.03); }
        .history-table-wrap { overflow-x:auto; }
        .history-table { width:100%; border-collapse:collapse; }
        .history-table th { padding:10px 14px; font-size:.72rem; text-transform:uppercase; letter-spacing:.5px; color:var(--text-secondary); background:rgba(0,0,0,.15); text-align:left; }
        .history-table td { padding:11px 14px; border-bottom:1px solid rgba(255,255,255,.04); font-size:.85rem; }
        .ht-time { font-size:.75rem; color:var(--text-secondary); white-space:nowrap; }
        .action-tag { display:inline-block; font-size:.7rem; font-weight:700; padding:2px 8px; border-radius:999px; text-transform:uppercase; }
        .at-buy     { background:rgba(0,255,157,.18); color:var(--accent-green); }
        .at-sell    { background:rgba(239,68,68,.18);  color:#fca5a5; }
        .at-sl-sell { background:rgba(239,68,68,.28);  color:#fca5a5; border:1px solid rgba(239,68,68,.4); }
        .at-remove  { background:rgba(180,46,46,.18);  color:#f87171; }

        /* ── Responsive ── */
        @media (max-width:900px) { .d-md { display:none!important; } }
        @media (max-width:600px) {
          .act-btn span { display:none; }
          .act-btn { padding:5px 7px; }
          .form-row-2 { grid-template-columns:1fr; }
          .add-stock-btn span { display:none; }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
