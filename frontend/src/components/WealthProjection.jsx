import React, { useState, useMemo } from 'react';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, ComposedChart } from 'recharts';
import { TrendingUp, AlertTriangle, Info } from 'lucide-react';

const WealthProjection = ({ principal = 1000000 }) => {
  const [baseRate, setBaseRate] = useState(15);
  const [years, setYears] = useState(20);
  const [cost, setCost] = useState(1.5);
  const [infl, setInfl] = useState(6);

  const safePrincipal = principal || 10000; // fallback if zero

  // Formatters
  const fmt = (n) => {
    if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr';
    if (n >= 100000) return '₹' + (n / 100000).toFixed(2) + ' L';
    return '₹' + Math.round(n).toLocaleString('en-IN');
  };

  const fmtShort = (n) => {
    if (n >= 10000000) return '₹' + (n / 10000000).toFixed(1) + ' Cr';
    if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + ' L';
    return '₹' + Math.round(n).toLocaleString('en-IN');
  };

  const compound = (p, rate, y) => p * Math.pow(1 + rate / 100, y);

  // Derived Values
  const { chartData, tableData, summary, rateSummary } = useMemo(() => {
    const lowRate = Math.max(baseRate - 3, 8);
    const highRate = baseRate + 5;
    const netBase = baseRate - cost;
    const netLow = lowRate - cost;
    const netHigh = highRate - cost;

    const valBase = compound(safePrincipal, netBase, years);
    const valLow = compound(safePrincipal, netLow, years);
    const valHigh = compound(safePrincipal, netHigh, years);
    const valReal = compound(safePrincipal, netBase - infl, years);

    // Chart Data
    const cData = [];
    const maxYears = Math.min(years, 30);
    for (let y = 0; y <= maxYears; y += 1) {
      cData.push({
        year: y,
        label: `Yr ${y}`,
        invested: safePrincipal,
        conservative: compound(safePrincipal, netLow, y),
        base: compound(safePrincipal, netBase, y),
        optimistic: compound(safePrincipal, netHigh, y),
        real: compound(safePrincipal, netBase - infl, y),
      });
    }

    // Table Data
    const tData = [];
    const milestones = new Set([5, 10, 15, 20, 25, 30]);
    let firstCr = null;
    let firstTenCr = null;
    
    for (let y = 1; y <= maxYears; y++) {
      const v = compound(safePrincipal, netBase, y);
      if (!firstCr && v >= 10000000) firstCr = y;
      if (!firstTenCr && v >= 100000000) firstTenCr = y;
    }

    for (let y = 1; y <= maxYears; y++) {
      const isMilestone = milestones.has(y);
      tData.push({
        year: y,
        isMilestone,
        isTarget: y === years,
        isFirstCr: y === firstCr,
        isTenCr: y === firstTenCr,
        vLow: compound(safePrincipal, netLow, y),
        vBase: compound(safePrincipal, netBase, y),
        vHigh: compound(safePrincipal, netHigh, y),
        vReal: compound(safePrincipal, netBase - infl, y)
      });
    }

    return {
      chartData: cData,
      tableData: tData,
      summary: {
        valBase, valLow, valHigh, valReal,
        multBase: (valBase / safePrincipal).toFixed(1),
        multLow: (valLow / safePrincipal).toFixed(1),
        multHigh: (valHigh / safePrincipal).toFixed(1),
        purchasingPowerLoss: ((1 - valReal / valBase) * 100).toFixed(0),
        netRealRate: (netBase - infl).toFixed(1)
      },
      rateSummary: {
        low: lowRate, base: baseRate, high: highRate,
        netLow, netBase, netHigh
      }
    };
  }, [baseRate, years, cost, infl, safePrincipal]);

  return (
    <div className="wealth-projection-container animate-fade-in">
      <div className="wp-header">
        <div className="eyebrow">Real-Time Wealth Projection Calculator</div>
        <h1><span className="gold-text">{fmt(safePrincipal)}</span> Portfolio Value</h1>
        <p className="header-sub">Linked to your live portfolio · Aggressive retirement forecasting · 5–30 year horizon</p>
      </div>

      <div className="wp-controls glass-panel">
        <div className="control-group">
          <label>Target Return Rate</label>
          <div className="ctrl-val"><span className="highlight-cyan">{baseRate.toFixed(1)}</span>% CAGR</div>
          <input type="range" className="slider slider-cyan" min="10" max="25" step="0.5" value={baseRate} onChange={e => setBaseRate(Number(e.target.value))} />
        </div>
        <div className="control-group">
          <label>Time Horizon</label>
          <div className="ctrl-val"><span className="highlight-cyan">{years}</span> Years</div>
          <input type="range" className="slider slider-cyan" min="5" max="30" step="1" value={years} onChange={e => setYears(Number(e.target.value))} />
        </div>
        <div className="control-group">
          <label>Expense / Commission</label>
          <div className="ctrl-val"><span className="highlight-cyan">{cost.toFixed(2)}</span>% p.a.</div>
          <input type="range" className="slider slider-cyan" min="0.5" max="3" step="0.25" value={cost} onChange={e => setCost(Number(e.target.value))} />
        </div>
        <div className="control-group">
          <label>Inflation Rate</label>
          <div className="ctrl-val"><span className="highlight-cyan">{infl.toFixed(1)}</span>% p.a.</div>
          <input type="range" className="slider slider-cyan" min="4" max="8" step="0.5" value={infl} onChange={e => setInfl(Number(e.target.value))} />
        </div>
      </div>

      {/* Scenarios Outline */}
      <div className="scenarios-grid">
        <div className="sc-card red-border">
          <div className="sc-rate text-red">{rateSummary.low}% CAGR</div>
          <div className="sc-name">Conservative Scenario</div>
          <div className="sc-desc">Market underperforms or correction years drag returns. Realistic worst-case outcome for long-term equity.</div>
        </div>
        <div className="sc-card gold-border">
          <div className="sc-rate text-gold">{rateSummary.base}% CAGR</div>
          <div className="sc-name">Base Case (Your Target)</div>
          <div className="sc-desc">Your stated goal after costs. Achievable with structural growth stories over 15–25 years.</div>
        </div>
        <div className="sc-card green-border">
          <div className="sc-rate text-green">{rateSummary.high}% CAGR</div>
          <div className="sc-name">Optimistic Scenario</div>
          <div className="sc-desc">Mirrors exceptionally strong bull runs sustained over time. Exceptional but possible outcome.</div>
        </div>
      </div>

      {/* Big Number Cards */}
      <div className="big-cards-grid">
        <div className="big-card border-gold">
          <div className="bc-label">Live Portfolio Balance</div>
          <div className="bc-val">{fmt(safePrincipal)}</div>
          <div className="bc-sub">Current Value Today</div>
        </div>
        <div className="big-card border-red">
          <div className="bc-label">Conservative (net {rateSummary.netLow.toFixed(1)}%)</div>
          <div className="bc-val text-red">{fmt(summary.valLow)}</div>
          <div className="bc-sub">After {years} years</div>
          <div className="bc-growth text-red">{summary.multLow}× your money</div>
        </div>
        <div className="big-card border-gold">
          <div className="bc-label">Base Case (net {rateSummary.netBase.toFixed(1)}%)</div>
          <div className="bc-val text-gold">{fmt(summary.valBase)}</div>
          <div className="bc-sub">After {years} years</div>
          <div className="bc-growth text-gold">{summary.multBase}× your money</div>
        </div>
        <div className="big-card border-green">
          <div className="bc-label">Optimistic (net {rateSummary.netHigh.toFixed(1)}%)</div>
          <div className="bc-val text-green">{fmt(summary.valHigh)}</div>
          <div className="bc-sub">After {years} years</div>
          <div className="bc-growth text-green">{summary.multHigh}× your money</div>
        </div>
        <div className="big-card border-muted">
          <div className="bc-label">Real Value (inflation-adj.)</div>
          <div className="bc-val text-muted">{fmt(summary.valReal)}</div>
          <div className="bc-sub">Purchasing power in today's ₹</div>
          <div className="bc-growth text-muted">At {infl}% inflation p.a.</div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="wp-chart-section glass-panel">
        <h3 className="section-title">Wealth Growth Over Time — 3 Scenarios</h3>
        <p className="section-subtitle">Gross returns before inflation adjustment. Drag sliders to instantly recalculate trajectories.</p>
        
        <div className="chart-container" style={{ height: 350, marginTop: '2rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" stroke="var(--text-secondary)" tick={{fontSize: 12}} />
              <YAxis 
                stroke="var(--text-secondary)" 
                tick={{fontSize: 12}}
                tickFormatter={(val) => fmtShort(val)}
                width={80}
              />
              <RechartsTooltip 
                formatter={(value) => [fmt(value), '']}
                contentStyle={{background: '#151521', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px'}}
                itemStyle={{fontWeight: 600}}
              />
              
              <Area type="monotone" dataKey="optimistic" name="Optimistic" stroke="#00e5a0" fillOpacity={0.05} fill="#00e5a0" strokeWidth={2} />
              <Area type="monotone" dataKey="base" name="Base Case" stroke="#f5c842" fillOpacity={0.05} fill="#f5c842" strokeWidth={3} />
              <Area type="monotone" dataKey="conservative" name="Conservative" stroke="#ff5e5e" fillOpacity={0.05} fill="#ff5e5e" strokeWidth={2} />
              <Line type="monotone" dataKey="real" name="Real Value (Inflation-adj)" stroke="#f5c842" strokeDasharray="5 5" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-legend">
           <span className="legend-item"><span className="legend-line" style={{background: '#ff5e5e'}}></span> Conservative</span>
           <span className="legend-item"><span className="legend-line" style={{background: '#f5c842', height:'3px'}}></span> Base Case (Your Target)</span>
           <span className="legend-item"><span className="legend-line" style={{background: '#00e5a0'}}></span> Optimistic</span>
           <span className="legend-item"><span className="legend-line" style={{background: 'transparent', borderTop: '2px dashed #f5c842'}}></span> Real Value (Inflation-adjusted)</span>
        </div>
      </div>

      {/* Inflation Alert */}
      <div className="inflation-alert">
        <div className="alert-content">
          <AlertTriangle color="#ff8f8f" size={20} />
          <span>
            <strong>Inflation Reality Check:</strong> Your base case looks impressive at {fmt(summary.valBase)} — but at {infl}% annual inflation, that future wealth will have the purchasing power of only <strong>{fmt(summary.valReal)} in today's money</strong> ({summary.purchasingPowerLoss}% erosion). Your true net real compounding rate is <strong>{summary.netRealRate}% per year</strong>.
          </span>
        </div>
      </div>

      {/* Year Table Section */}
      <div className="wp-table-section glass-panel">
        <h3 className="section-title">Year-by-Year Projection</h3>
        <p className="section-subtitle">Tracking nominal portfolio values alongside crucial wealth milestones.</p>
        
        <div className="table-responsive">
          <table className="year-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Age of Investment</th>
                <th className="text-red">Conservative</th>
                <th className="text-gold">Base Case</th>
                <th className="text-green">Optimistic</th>
                <th className="text-muted">Real Value (Inflation-adj)</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.year} className={row.isMilestone ? 'highlight-row' : ''}>
                  <td className="yr">{row.year}</td>
                  <td className="detail">
                    {row.isTarget ? '🎯 Target Year' : (row.isMilestone ? '⭐ Milestone' : '')}
                  </td>
                  <td className="text-red font-semibold">{fmtShort(row.vLow)}</td>
                  <td className="text-gold font-bold">
                    {fmtShort(row.vBase)}
                    {row.isFirstCr && <span className="badge">FIRST ₹1 CR</span>}
                    {row.isTenCr && <span className="badge">₹10 CR</span>}
                  </td>
                  <td className="text-green font-semibold">{fmtShort(row.vHigh)}</td>
                  <td className="text-muted">{fmtShort(row.vReal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .wealth-projection-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          color: var(--text-primary);
        }

        .wp-header {
          padding: 1rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        
        .eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          letter-spacing: 2px;
          color: var(--accent-cyan);
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .wp-header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .gold-text { color: #f5c842; }

        .header-sub {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .wp-controls {
          display: flex;
          gap: 3rem;
          flex-wrap: wrap;
          padding: 2rem;
          border-radius: var(--radius-lg);
        }

        .control-group {
          flex: 1;
          min-width: 200px;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .control-group label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          text-transform: uppercase;
          color: var(--text-secondary);
          letter-spacing: 1px;
        }

        .ctrl-val {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .highlight-cyan {
          color: var(--accent-cyan);
        }

        .slider {
          -webkit-appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 4px;
          background: rgba(255,255,255,0.1);
          outline: none;
          margin-top: 10px;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--accent-cyan);
          cursor: pointer;
          transition: transform 0.1s;
        }
        .slider::-webkit-slider-thumb:hover { transform: scale(1.2); }

        .scenarios-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .sc-card {
          padding: 1.5rem;
          background: rgba(0,0,0,0.2);
          border-radius: var(--radius-md);
          border: 1px solid rgba(255,255,255,0.05);
        }

        .red-border { border-color: rgba(255, 94, 94, 0.3); }
        .gold-border { border-color: rgba(245, 200, 66, 0.3); }
        .green-border { border-color: rgba(0, 229, 160, 0.3); }

        .sc-rate { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.3rem; }
        .sc-name { color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.8rem; }
        .sc-desc { color: var(--text-primary); font-size: 0.85rem; line-height: 1.5; }

        .text-red { color: #ff5e5e; }
        .text-gold { color: #f5c842; }
        .text-green { color: #00e5a0; }
        .text-muted { color: #a0aec0; }

        .big-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .big-card {
          background: rgba(255,255,255,0.02);
          padding: 1.5rem;
          border-radius: var(--radius-md);
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.05);
        }
        
        .big-card::after {
          content: '';
          position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
        }
        .border-gold::after { background: #f5c842; }
        .border-red::after { background: #ff5e5e; }
        .border-green::after { background: #00e5a0; }
        .border-muted::after { background: #6b7494; }

        .bc-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.65rem;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        }

        .bc-val { font-size: 1.8rem; font-weight: 800; line-height: 1; }
        .bc-sub { font-size: 0.8rem; color: var(--text-secondary); margin-top: 8px; }
        .bc-growth { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; margin-top: 8px; }

        .wp-chart-section, .wp-table-section {
          padding: 2rem;
          border-radius: var(--radius-lg);
        }

        .section-title { font-size: 1.3rem; margin-bottom: 0.5rem; }
        .section-subtitle { color: var(--text-secondary); font-size: 0.9rem; }

        .chart-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          margin-top: 1.5rem;
          justify-content: center;
        }

        .legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-secondary); }
        .legend-line { width: 24px; height: 2px; border-radius: 2px; }

        .inflation-alert {
          background: rgba(255, 94, 94, 0.08);
          border: 1px solid rgba(255, 94, 94, 0.2);
          padding: 1.5rem;
          border-radius: var(--radius-md);
        }

        .alert-content {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          font-size: 0.9rem;
          line-height: 1.6;
        }

        .table-responsive {
          overflow-x: auto;
          margin-top: 1.5rem;
        }

        .year-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .year-table th {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          text-transform: uppercase;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          color: var(--text-secondary);
        }

        .year-table td {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          font-size: 0.9rem;
        }

        .highlight-row td {
          background: rgba(245, 200, 66, 0.05);
        }

        .yr { font-family: 'JetBrains Mono', monospace; color: var(--text-secondary); }
        .detail { color: var(--text-secondary); font-size: 0.8rem; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }

        .badge {
          display: inline-block;
          background: rgba(0, 229, 160, 0.15);
          color: #00e5a0;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.6rem;
          margin-left: 8px;
          font-family: 'JetBrains Mono', monospace;
          vertical-align: middle;
        }
      `}</style>
    </div>
  );
};

export default WealthProjection;
