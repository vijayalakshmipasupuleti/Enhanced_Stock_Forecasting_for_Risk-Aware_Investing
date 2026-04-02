import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Briefcase, ArrowUpRight, BarChart3, Activity } from 'lucide-react';
import { API_BASE, formatPrice, formatPercent, formatINR, formatVolume } from '../utils/format';

const USER_PORTFOLIOS = {
  'user1': [
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries', qty: 15, avgPrice: 2350 },
    { symbol: 'TCS.NS', name: 'Tata Consultancy', qty: 10, avgPrice: 3400 },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', qty: 20, avgPrice: 1520 },
    { symbol: 'INFY.NS', name: 'Infosys', qty: 25, avgPrice: 1430 },
  ],
  'user2': [
    { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', qty: 50, avgPrice: 620 },
    { symbol: 'ITC.NS', name: 'ITC Limited', qty: 100, avgPrice: 390 },
    { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance', qty: 8, avgPrice: 6800 },
  ],
  'user3': [
    { symbol: 'SBIN.NS', name: 'State Bank of India', qty: 40, avgPrice: 580 },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', qty: 30, avgPrice: 1250 },
    { symbol: 'WIPRO.NS', name: 'Wipro', qty: 60, avgPrice: 410 },
  ]
};

const DashboardPage = ({ user }) => {
  const navigate = useNavigate();
  const holdings = useMemo(() => USER_PORTFOLIOS[user] || [], [user]);
  const [quotesBySymbol, setQuotesBySymbol] = useState({});
  const [indices, setIndices] = useState([]);
  const [error, setError] = useState(null);

  // Fetch live quotes for portfolio
  useEffect(() => {
    if (!holdings.length) return;
    let alive = true;
    const fetchQuotes = async () => {
      try {
        const res = await fetch(`${API_BASE}/quotes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tickers: holdings.map(h => h.symbol) })
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!alive) return;
        const map = {};
        for (const q of data.quotes || []) map[q.symbol] = q;
        setQuotesBySymbol(map);
        setError(null);
      } catch {
        if (alive) setError('Live quotes unavailable');
      }
    };
    fetchQuotes();
    const iv = setInterval(fetchQuotes, 15000);
    return () => { alive = false; clearInterval(iv); };
  }, [holdings]);

  // Fetch Indian indices
  useEffect(() => {
    let alive = true;
    const fetchIndices = async () => {
      try {
        const res = await fetch(`${API_BASE}/market-overview`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (alive) setIndices(data.indices || []);
      } catch { /* silent */ }
    };
    fetchIndices();
    const iv = setInterval(fetchIndices, 30000);
    return () => { alive = false; clearInterval(iv); };
  }, []);

  const stocks = useMemo(() => holdings.map(h => {
    const live = quotesBySymbol[h.symbol];
    const price = live?.price > 0 ? live.price : h.avgPrice;
    const changePct = live?.change_percent || 0;
    return { ...h, currentPrice: price, changePct };
  }), [holdings, quotesBySymbol]);

  const totalValue = stocks.reduce((s, st) => s + st.qty * st.currentPrice, 0);
  const totalInvested = stocks.reduce((s, st) => s + st.qty * st.avgPrice, 0);
  const totalPL = totalValue - totalInvested;
  const totalPLpct = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  return (
    <div className="dash-page animate-fade-in">
      {/* Indian Indices Strip */}
      <div className="indices-strip">
        {indices.map((idx, i) => {
          const up = idx.change_percent >= 0;
          return (
            <div key={i} className="index-chip">
              <span className="idx-name">{idx.name}</span>
              <span className={`idx-price ${up ? 'up' : 'down'}`}>{formatPrice(idx.price)}</span>
              <span className={`idx-change ${up ? 'up' : 'down'}`}>
                {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {formatPercent(idx.change_percent)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Portfolio Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card glass-panel">
          <div className="sc-icon"><Briefcase size={22} /></div>
          <div>
            <span className="sc-label">Portfolio Value</span>
            <span className="sc-value">{formatINR(totalValue)}</span>
          </div>
        </div>
        <div className="summary-card glass-panel">
          <div className="sc-icon invested"><BarChart3 size={22} /></div>
          <div>
            <span className="sc-label">Total Invested</span>
            <span className="sc-value">{formatINR(totalInvested)}</span>
          </div>
        </div>
        <div className="summary-card glass-panel">
          <div className={`sc-icon ${totalPL >= 0 ? 'profit' : 'loss'}`}>
            {totalPL >= 0 ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
          </div>
          <div>
            <span className="sc-label">Total P&L</span>
            <span className={`sc-value ${totalPL >= 0 ? 'up' : 'down'}`}>
              {formatINR(totalPL)} ({formatPercent(totalPLpct)})
            </span>
          </div>
        </div>
        <div className="summary-card glass-panel">
          <div className="sc-icon"><Activity size={22} /></div>
          <div>
            <span className="sc-label">Holdings</span>
            <span className="sc-value">{stocks.length} Stocks</span>
          </div>
        </div>
      </div>

      {error && <div className="quote-error">{error}</div>}

      {/* Holdings Table */}
      <div className="holdings-section">
        <h2 className="section-title">
          <Briefcase size={20} />
          Your Holdings
          <span className="live-chip">Live</span>
        </h2>

        <div className="holdings-table-wrap glass-panel">
          <table className="holdings-table">
            <thead>
              <tr>
                <th>Stock</th>
                <th className="right">Qty</th>
                <th className="right">Avg. Price</th>
                <th className="right">LTP</th>
                <th className="right">Current Value</th>
                <th className="right">P&L</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock, i) => {
                const value = stock.qty * stock.currentPrice;
                const invested = stock.qty * stock.avgPrice;
                const pl = value - invested;
                const plPct = invested > 0 ? (pl / invested) * 100 : 0;
                const up = pl >= 0;
                return (
                  <tr key={i} onClick={() => navigate(`/stock/${encodeURIComponent(stock.symbol)}`)} className="clickable-row">
                    <td>
                      <div className="stock-cell">
                        <span className="stock-sym">{stock.symbol.replace('.NS', '').replace('.BO', '')}</span>
                        <span className="stock-name">{stock.name}</span>
                      </div>
                    </td>
                    <td className="right mono">{stock.qty}</td>
                    <td className="right mono">{formatPrice(stock.avgPrice)}</td>
                    <td className={`right mono ${up ? 'up' : 'down'}`}>{formatPrice(stock.currentPrice)}</td>
                    <td className="right mono">{formatINR(value)}</td>
                    <td className={`right mono ${up ? 'up' : 'down'}`}>
                      {formatINR(pl)}<br/>
                      <small>{formatPercent(plPct)}</small>
                    </td>
                    <td className="arrow-cell"><ArrowUpRight size={16} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .dash-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Indices Strip */
        .indices-strip {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .index-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          white-space: nowrap;
          font-size: 0.85rem;
          min-width: max-content;
        }

        .idx-name {
          color: var(--text-secondary);
          font-weight: 500;
        }

        .idx-price {
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
        }

        .idx-change {
          display: flex;
          align-items: center;
          gap: 3px;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .up { color: var(--accent-green); }
        .down { color: var(--accent-red); }

        /* Summary Cards */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 12px;
        }

        .summary-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 1.25rem;
          border-radius: var(--radius-md);
        }

        .sc-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 240, 255, 0.08);
          color: var(--accent-cyan);
          flex-shrink: 0;
        }

        .sc-icon.invested { background: rgba(54, 163, 255, 0.08); color: var(--accent-blue); }
        .sc-icon.profit { background: rgba(0, 255, 157, 0.08); color: var(--accent-green); }
        .sc-icon.loss { background: rgba(255, 77, 77, 0.08); color: var(--accent-red); }

        .sc-label {
          display: block;
          font-size: 0.78rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .sc-value {
          display: block;
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-top: 2px;
        }

        .quote-error {
          color: #fca5a5;
          font-size: 0.85rem;
        }

        /* Holdings */
        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .live-chip {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--accent-green);
          background: rgba(0, 255, 157, 0.1);
          border: 1px solid rgba(0, 255, 157, 0.2);
          padding: 3px 10px;
          border-radius: 999px;
          font-weight: 700;
        }

        .holdings-table-wrap {
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .holdings-table {
          width: 100%;
          border-collapse: collapse;
        }

        .holdings-table th {
          padding: 12px 16px;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary);
          font-weight: 500;
          background: rgba(0, 0, 0, 0.2);
          text-align: left;
        }

        .holdings-table th.right, .holdings-table td.right {
          text-align: right;
        }

        .holdings-table td {
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          font-size: 0.9rem;
        }

        .clickable-row {
          cursor: pointer;
          transition: background 0.15s;
        }

        .clickable-row:hover {
          background: rgba(0, 240, 255, 0.03);
        }

        .stock-cell {
          display: flex;
          flex-direction: column;
        }

        .stock-sym {
          font-weight: 700;
          color: var(--text-primary);
        }

        .stock-name {
          font-size: 0.78rem;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .mono {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
        }

        .arrow-cell {
          color: var(--text-secondary);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .clickable-row:hover .arrow-cell {
          opacity: 1;
          color: var(--accent-cyan);
        }

        @media (max-width: 768px) {
          .holdings-table th:nth-child(3),
          .holdings-table td:nth-child(3),
          .holdings-table th:nth-child(5),
          .holdings-table td:nth-child(5) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
