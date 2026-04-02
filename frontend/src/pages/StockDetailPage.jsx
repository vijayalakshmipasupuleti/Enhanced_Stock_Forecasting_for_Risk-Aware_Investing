import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, TrendingDown, Loader2, ArrowUpRight, BarChart3, Activity, Layers } from 'lucide-react';
import { API_BASE, formatPrice, formatPercent, formatVolume, formatMarketCap } from '../utils/format';
import CandlestickChart from '../components/CandlestickChart';
import StockChart from '../components/StockChart';

const StockDetailPage = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const decodedSymbol = decodeURIComponent(symbol);

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [predData, setPredData] = useState(null);
  const [predLoading, setPredLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chart');

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/stock-detail?ticker=${encodeURIComponent(decodedSymbol)}`)
      .then(res => {
        if (!res.ok) throw new Error('Stock not found');
        return res.json();
      })
      .then(data => { setDetail(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [decodedSymbol]);

  const handlePredict = async () => {
    setPredLoading(true);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const start = new Date();
      start.setFullYear(start.getFullYear() - 1);
      const startDate = start.toISOString().split('T')[0];

      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: decodedSymbol, start_date: startDate, end_date: endDate })
      });
      if (!res.ok) throw new Error('Prediction failed');
      const data = await res.json();
      setPredData(data);
      setActiveTab('prediction');
    } catch (e) {
      alert('Prediction failed: ' + e.message);
    } finally {
      setPredLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <Loader2 size={36} className="spin" />
        <p>Loading {decodedSymbol}...</p>
        <style>{`.loading-page { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh; gap: 1rem; color: var(--text-secondary); } .spin { animation: spin 1s linear infinite; color: var(--accent-cyan); } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-page">
        <p>Error: {error}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
        <style>{`.error-page { text-align: center; padding: 4rem; color: var(--accent-red); } .error-page button { margin-top: 1rem; padding: 10px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); cursor: pointer; }`}</style>
      </div>
    );
  }

  const d = detail;
  const up = d.change_percent >= 0;
  const cleanSym = d.symbol.replace('.NS', '').replace('.BO', '');

  const dayPercent = d.day_high > d.day_low ? ((d.price - d.day_low) / (d.day_high - d.day_low)) * 100 : 50;
  const yearPercent = d.fifty_two_week_high > d.fifty_two_week_low ? ((d.price - d.fifty_two_week_low) / (d.fifty_two_week_high - d.fifty_two_week_low)) * 100 : 50;

  return (
    <div className="stock-detail-page animate-fade-in">
      {/* Back + Header */}
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ChevronLeft size={20} />
        Back
      </button>

      <div className="stock-header">
        <div className="stock-header-left">
          <h1 className="stock-title">{cleanSym}</h1>
          <span className="stock-fullname">{d.name}</span>
          <div className="stock-tags">
            <span className="tag">{d.market}</span>
            <span className="tag">{d.exchange}</span>
          </div>
        </div>
        <div className="stock-header-right">
          <div className={`price-big ${up ? 'up' : 'down'}`}>{formatPrice(d.price)}</div>
          <div className={`change-line ${up ? 'up' : 'down'}`}>
            {up ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            {d.change >= 0 ? '+' : ''}{d.change.toFixed(2)} ({formatPercent(d.change_percent)})
          </div>
        </div>
      </div>

      {/* Key Stats Grid */}
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Open</span>
          <span className="stat-val">{formatPrice(d.open)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Prev. Close</span>
          <span className="stat-val">{formatPrice(d.previous_close)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Volume</span>
          <span className="stat-val">{formatVolume(d.volume)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Avg. Volume</span>
          <span className="stat-val">{formatVolume(d.avg_volume)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Market Cap</span>
          <span className="stat-val">{formatMarketCap(d.market_cap)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">P/E Ratio</span>
          <span className="stat-val">{d.pe_ratio > 0 ? d.pe_ratio.toFixed(2) : '—'}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">EPS</span>
          <span className="stat-val">{d.eps > 0 ? formatPrice(d.eps) : '—'}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Div. Yield</span>
          <span className="stat-val">{d.dividend_yield > 0 ? (d.dividend_yield * 100).toFixed(2) + '%' : '—'}</span>
        </div>
      </div>

      {/* Day Range & 52W Range */}
      <div className="range-section">
        <div className="range-bar">
          <div className="range-label-row">
            <span>Day Range</span>
            <span className="range-vals">{formatPrice(d.day_low)} — {formatPrice(d.day_high)}</span>
          </div>
          <div className="range-track">
            <div className="range-fill" style={{ width: `${dayPercent}%` }}></div>
            <div className="range-dot" style={{ left: `${dayPercent}%` }}></div>
          </div>
        </div>
        <div className="range-bar">
          <div className="range-label-row">
            <span>52 Week Range</span>
            <span className="range-vals">{formatPrice(d.fifty_two_week_low)} — {formatPrice(d.fifty_two_week_high)}</span>
          </div>
          <div className="range-track">
            <div className="range-fill" style={{ width: `${yearPercent}%` }}></div>
            <div className="range-dot" style={{ left: `${yearPercent}%` }}></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-bar">
        <button className={`tab ${activeTab === 'chart' ? 'active' : ''}`} onClick={() => setActiveTab('chart')}>
          <BarChart3 size={16} /> Technical Chart
        </button>
        <button className={`tab ${activeTab === 'prediction' ? 'active' : ''}`} onClick={() => { if (predData) setActiveTab('prediction'); else handlePredict(); }}>
          <Activity size={16} /> {predLoading ? 'Running ML...' : 'AI Prediction'}
        </button>
      </div>

      {/* Chart Content */}
      <div className="chart-content">
        {activeTab === 'chart' && <CandlestickChart ticker={decodedSymbol} />}
        {activeTab === 'prediction' && predData && (
          <div className="pred-section">
            <div className="pred-metrics-grid">
              <div className="pm-card"><span className="pm-label">Model</span><span className="pm-val">{predData.model}</span></div>
              <div className="pm-card"><span className="pm-label">RMSE</span><span className="pm-val">{predData.metrics.RMSE.toFixed(2)}</span></div>
              <div className="pm-card"><span className="pm-label">MAPE</span><span className="pm-val">{predData.metrics.MAPE.toFixed(2)}%</span></div>
              <div className="pm-card"><span className="pm-label">Risk Score</span><span className="pm-val">{predData.metrics.Decision_Score.toFixed(1)}/100</span></div>
              <div className="pm-card"><span className="pm-label">Sharpe</span><span className="pm-val">{predData.metrics.Sharpe_Ratio.toFixed(2)}</span></div>
              <div className="pm-card"><span className="pm-label">Volatility</span><span className="pm-val">{predData.metrics.Volatility}</span></div>
            </div>
            <StockChart data={predData.chart_data} title="XGBoost Prediction vs Actual" />
          </div>
        )}
      </div>

      <style>{`
        .stock-detail-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
          align-self: flex-start;
        }

        .back-btn:hover {
          color: var(--text-primary);
          border-color: rgba(255,255,255,0.2);
        }

        .stock-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .stock-title {
          font-size: 2rem;
          font-weight: 800;
          margin: 0;
        }

        .stock-fullname {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        .stock-tags {
          display: flex;
          gap: 6px;
          margin-top: 6px;
        }

        .tag {
          font-size: 0.65rem;
          padding: 3px 10px;
          border-radius: 4px;
          background: rgba(255,255,255,0.05);
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .stock-header-right {
          text-align: right;
        }

        .price-big {
          font-size: 2.2rem;
          font-weight: 800;
          font-family: 'JetBrains Mono', monospace;
        }

        .change-line {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 1rem;
          font-weight: 600;
          justify-content: flex-end;
          margin-top: 4px;
        }

        .up { color: var(--accent-green); }
        .down { color: var(--accent-red); }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1px;
          background: var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          padding: 14px 16px;
          background: var(--bg-secondary);
        }

        .stat-label {
          font-size: 0.82rem;
          color: var(--text-secondary);
        }

        .stat-val {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary);
          font-family: 'JetBrains Mono', monospace;
        }

        /* Range Bars */
        .range-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        @media (max-width: 600px) {
          .range-section { grid-template-columns: 1fr; }
        }

        .range-bar {
          padding: 16px 18px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
        }

        .range-label-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.82rem;
          color: var(--text-secondary);
          margin-bottom: 10px;
        }

        .range-vals {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.78rem;
          color: var(--text-primary);
        }

        .range-track {
          position: relative;
          height: 6px;
          border-radius: 3px;
          background: rgba(255,255,255,0.06);
        }

        .range-fill {
          height: 100%;
          border-radius: 3px;
          background: linear-gradient(90deg, var(--accent-cyan), var(--accent-blue));
        }

        .range-dot {
          position: absolute;
          top: -5px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--accent-cyan);
          border: 3px solid var(--bg-secondary);
          transform: translateX(-50%);
          box-shadow: 0 0 8px rgba(0, 240, 255, 0.4);
        }

        /* Tabs */
        .tabs-bar {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: var(--bg-secondary);
          border-radius: 12px;
          border: 1px solid var(--border-color);
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          background: none;
          border: none;
          transition: all 0.2s;
        }

        .tab:hover {
          color: var(--text-primary);
        }

        .tab.active {
          background: rgba(0, 240, 255, 0.08);
          color: var(--accent-cyan);
          font-weight: 600;
        }

        /* Prediction Section */
        .pred-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .pred-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 8px;
        }

        .pm-card {
          padding: 14px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .pm-label {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary);
        }

        .pm-val {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-primary);
          font-family: 'JetBrains Mono', monospace;
        }
      `}</style>
    </div>
  );
};

export default StockDetailPage;
