import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Activity, BarChart2, Globe, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { API_BASE, formatPrice, formatPercent, formatVolume } from '../utils/format';

const MarketPage = () => {
  const [overview, setOverview] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState('^NSEI');

  useEffect(() => {
    let alive = true;
    const fetchAll = async () => {
      try {
        const [ovRes, intRes] = await Promise.all([
          fetch(`${API_BASE}/market-overview`),
          fetch(`${API_BASE}/intraday?ticker=${encodeURIComponent(selectedIndex)}&period=1d&interval=5m`)
        ]);
        if (!ovRes.ok || !intRes.ok) throw new Error();
        const ov = await ovRes.json();
        const intr = await intRes.json();
        if (!alive) return;
        setOverview(ov);
        setTrendData(intr.points || []);
        setError(null);
      } catch {
        if (alive) setError('Unable to load market data');
      }
    };
    fetchAll();
    const iv = setInterval(fetchAll, 15000);
    return () => { alive = false; clearInterval(iv); };
  }, [selectedIndex]);

  const indices = overview?.indices || [];
  const marketStatus = overview?.market_status || 'LOADING';

  return (
    <div className="market-page animate-fade-in">
      <div className="market-hero">
        <Globe size={28} color="var(--accent-blue)" />
        <div>
          <h1>Indian Market Overview</h1>
          <p>Live data from NSE & BSE · Auto-refreshing every 15s</p>
        </div>
        <div className="status-pill">
          <span className="status-dot" />
          {marketStatus}
        </div>
      </div>

      {error && <div className="mkt-error">{error}</div>}

      {/* Index Cards */}
      <div className="index-cards-grid">
        {indices.map((idx, i) => {
          const up = idx.change_percent >= 0;
          const isSelected = idx.symbol === selectedIndex;
          return (
            <div
              key={i}
              className={`index-card glass-panel ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedIndex(idx.symbol)}
            >
              <div className="ic-top">
                <span className="ic-name">{idx.name}</span>
                {up ? <TrendingUp size={18} className="up" /> : <TrendingDown size={18} className="down" />}
              </div>
              <div className={`ic-price ${up ? 'up' : 'down'}`}>{formatPrice(idx.price)}</div>
              <div className={`ic-change ${up ? 'up' : 'down'}`}>{formatPercent(idx.change_percent)}</div>
              <div className="ic-volume">Vol: {formatVolume(idx.volume)}</div>
            </div>
          );
        })}
      </div>

      {/* Intraday Chart */}
      <div className="chart-section glass-panel">
        <div className="chart-header">
          <h2>
            {indices.find(i => i.symbol === selectedIndex)?.name || selectedIndex} — Intraday
          </h2>
          <span className="live-badge">LIVE</span>
        </div>
        <div style={{ width: '100%', height: '380px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIdx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} minTickGap={30} />
              <YAxis domain={['auto', 'auto']} stroke="var(--text-secondary)" tick={{ fontSize: 12 }} tickFormatter={v => v.toFixed(0)} />
              <RechartsTooltip
                contentStyle={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                formatter={(value) => [formatPrice(value), 'Index Level']}
              />
              <Area type="monotone" dataKey="value" stroke="var(--accent-blue)" strokeWidth={3} fillOpacity={1} fill="url(#colorIdx)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style>{`
        .market-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .market-hero {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .market-hero h1 {
          font-size: 1.6rem;
          font-weight: 700;
          margin: 0;
        }

        .market-hero p {
          color: var(--text-secondary);
          font-size: 0.88rem;
          margin: 0;
        }

        .status-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(0, 255, 157, 0.08);
          border: 1px solid rgba(0, 255, 157, 0.2);
          color: var(--accent-green);
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-green);
          box-shadow: 0 0 8px var(--accent-green);
          animation: blink 1.5s infinite alternate;
        }

        @keyframes blink {
          0% { opacity: 0.4; }
          100% { opacity: 1; }
        }

        .mkt-error {
          color: #fca5a5;
          font-size: 0.85rem;
        }

        /* Index Cards */
        .index-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
        }

        .index-card {
          padding: 1.25rem;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .index-card:hover {
          border-color: rgba(255,255,255,0.15);
        }

        .index-card.selected {
          border-color: var(--accent-cyan);
          background: rgba(0, 240, 255, 0.04);
        }

        .ic-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .ic-name {
          font-size: 0.82rem;
          color: var(--text-secondary);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ic-price {
          font-size: 1.5rem;
          font-weight: 800;
          font-family: 'JetBrains Mono', monospace;
          margin-bottom: 4px;
        }

        .ic-change {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .ic-volume {
          margin-top: 8px;
          font-size: 0.78rem;
          color: var(--text-secondary);
        }

        .up { color: var(--accent-green); }
        .down { color: var(--accent-red); }

        /* Chart */
        .chart-section {
          padding: 1.5rem;
          border-radius: var(--radius-lg);
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .chart-header h2 {
          font-size: 1.2rem;
          font-weight: 600;
          margin: 0;
        }

        .live-badge {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 20px;
          background: rgba(0, 255, 157, 0.1);
          color: var(--accent-green);
          border: 1px solid rgba(0, 255, 157, 0.2);
          letter-spacing: 1px;
        }
      `}</style>
    </div>
  );
};

export default MarketPage;
