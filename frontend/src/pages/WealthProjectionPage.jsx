import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatINRCompact as fmtShort, formatINR as fmt } from '../utils/format';

const PRINCIPAL = 1000000;

function compound(p, rate, years) {
  return p * Math.pow(1 + rate / 100, years);
}

const WealthProjectionPage = () => {
  const navigate = useNavigate();
  
  const [baseRate, setBaseRate] = useState(15);
  const [years, setYears] = useState(20);
  const [cost, setCost] = useState(1.5);
  const [infl, setInfl] = useState(6);

  const lowRate = Math.max(baseRate - 3, 8);
  const highRate = baseRate + 5;
  const netBase = baseRate - cost;
  const netLow = lowRate - cost;
  const netHigh = highRate - cost;

  const valBase = compound(PRINCIPAL, netBase, years);
  const valLow = compound(PRINCIPAL, netLow, years);
  const valHigh = compound(PRINCIPAL, netHigh, years);
  const valReal = compound(PRINCIPAL, netBase - infl, years);

  const multBase = (valBase / PRINCIPAL).toFixed(1);
  const multLow = (valLow / PRINCIPAL).toFixed(1);
  const multHigh = (valHigh / PRINCIPAL).toFixed(1);

  const purchasingPowerLoss = ((1 - valReal / valBase) * 100).toFixed(0);

  // Table Data Generation
  const tableData = useMemo(() => {
    const milestones = new Set([5, 10, 15, 20, 25, 30]);
    const maxYears = Math.min(years, 30);
    const data = [];
    
    let firstCr = null;
    let firstTenCr = null;
    for (let y = 1; y <= maxYears; y++) {
      const v = compound(PRINCIPAL, netBase, y);
      if (!firstCr && v >= 10000000) firstCr = y;
      if (!firstTenCr && v >= 100000000) firstTenCr = y;
    }

    for (let y = 1; y <= maxYears; y++) {
      data.push({
        year: y,
        isMilestone: milestones.has(y),
        isTarget: y === years,
        isCr: y === firstCr,
        isTenCr: y === firstTenCr,
        vLow: compound(PRINCIPAL, netLow, y),
        vBase: compound(PRINCIPAL, netBase, y),
        vHigh: compound(PRINCIPAL, netHigh, y),
        vReal: compound(PRINCIPAL, netBase - infl, y),
      });
    }
    return data;
  }, [years, netBase, netLow, netHigh, infl]);

  // SVG Chart Generation
  const Chart = () => {
    const maxYears = Math.min(years, 30);
    const W = 900, H = 260;
    const pad = { top: 20, right: 20, bottom: 30, left: 70 };
    const cW = W - pad.left - pad.right;
    const cH = H - pad.top - pad.bottom;
    
    const maxVal = compound(PRINCIPAL, netHigh, maxYears);
    const xScale = y => pad.left + (y / maxYears) * cW;
    const yScale = v => pad.top + cH - (v / maxVal) * cH;

    const makePathData = (rate) => {
      let d = `M ${xScale(0)} ${yScale(PRINCIPAL)}`;
      for (let y = 0.5; y <= maxYears; y += 0.5) {
        d += ` L ${xScale(y)} ${yScale(compound(PRINCIPAL, rate, y))}`;
      }
      return d;
    };

    const makeAreaData = (rate) => {
      let d = makePathData(rate);
      d += ` L ${xScale(maxYears)} ${yScale(0)} L ${xScale(0)} ${yScale(0)} Z`;
      return d;
    };

    const yLabels = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
        const v = (maxVal / steps) * i;
        const y = yScale(v);
        yLabels.push(
            <g key={`y-${i}`}>
                <text x={pad.left - 8} y={y + 4} textAnchor="end" fill="var(--text-secondary)" fontSize="10">{fmtShort(v)}</text>
                <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            </g>
        );
    }

    const xLabels = [];
    const xStep = maxYears <= 15 ? 1 : maxYears <= 20 ? 5 : 5;
    for (let y = 0; y <= maxYears; y += xStep) {
        xLabels.push(
            <text key={`x-${y}`} x={xScale(y)} y={H - 4} textAnchor="middle" fill="var(--text-secondary)" fontSize="10">Yr {y}</text>
        );
    }

    return (
      <svg className="linechart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <path d={makeAreaData(netHigh)} fill="#00e5a0" opacity="0.05" />
        <path d={makeAreaData(netBase)} fill="#f5c842" opacity="0.05" />
        <path d={makeAreaData(netLow)} fill="#ff5e5e" opacity="0.05" />
        
        {yLabels}
        {xLabels}
        
        <path d={makePathData(netLow)} fill="none" stroke="#ff5e5e" strokeWidth="2.5" strokeLinecap="round" />
        <path d={makePathData(netBase)} fill="none" stroke="#f5c842" strokeWidth="2.5" strokeLinecap="round" />
        <path d={makePathData(netHigh)} fill="none" stroke="#00e5a0" strokeWidth="2.5" strokeLinecap="round" />
        <path d={makePathData(netBase - infl)} fill="none" stroke="#f5c842" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6,4" />
      </svg>
    );
  };

  return (
    <div className="calc-page-wrapper animate-fade-in wealth-projection">
      <button className="back-btn" onClick={() => navigate('/calculators')}>
        <ArrowLeft size={18} /> Back to Calculators
      </button>

      <div className="header">
        <div className="eyebrow">Wealth Forecaster</div>
        <h1>₹<span>10,00,000</span> Invested Today</h1>
        <div className="header-sub">31 funds · Lump sum · Aggressive retirement portfolio · 15–30 year horizon</div>
      </div>

      <div className="controls">
        <div className="control-group">
          <div className="ctrl-label">Target Return Rate</div>
          <div className="ctrl-val"><span>{baseRate}</span>% CAGR</div>
          <input type="range" min="10" max="25" value={baseRate} step="0.5" onChange={e => setBaseRate(parseFloat(e.target.value))} />
        </div>
        <div className="control-group">
          <div className="ctrl-label">Time Horizon</div>
          <div className="ctrl-val"><span>{years}</span> Years</div>
          <input type="range" min="5" max="30" value={years} step="1" onChange={e => setYears(parseInt(e.target.value))} />
        </div>
        <div className="control-group">
          <div className="ctrl-label">Expense / Commission</div>
          <div className="ctrl-val"><span>{cost}</span>% p.a.</div>
          <input type="range" min="0.5" max="3" value={cost} step="0.25" onChange={e => setCost(parseFloat(e.target.value))} />
        </div>
        <div className="control-group">
          <div className="ctrl-label">Inflation Rate</div>
          <div className="ctrl-val"><span>{infl}</span>% p.a.</div>
          <input type="range" min="4" max="8" value={infl} step="0.5" onChange={e => setInfl(parseFloat(e.target.value))} />
        </div>
      </div>

      <div className="main-content">
        {/* Scenario cards */}
        <div className="scenarios">
          <div className="sc-card" style={{ borderColor: 'rgba(255,94,94,0.3)' }}>
            <div className="sc-rate" style={{ color: '#ff5e5e' }}>{lowRate}% CAGR</div>
            <div className="sc-name">Conservative Scenario</div>
            <div className="sc-desc">Market underperforms or correction years drag returns. Still a realistic outcome for some funds in your mix.</div>
          </div>
          <div className="sc-card" style={{ borderColor: 'rgba(245,200,66,0.3)' }}>
            <div className="sc-rate" style={{ color: '#f5c842' }}>{baseRate}% CAGR</div>
            <div className="sc-name">Base Case (Your Target)</div>
            <div className="sc-desc">Your stated goal after costs. Achievable with India's structural growth story over {years} years. Most likely long-run outcome.</div>
          </div>
          <div className="sc-card" style={{ borderColor: 'rgba(0,229,160,0.3)' }}>
            <div className="sc-rate" style={{ color: '#00e5a0' }}>{highRate}% CAGR</div>
            <div className="sc-name">Optimistic Scenario</div>
            <div className="sc-desc">Mirrors your last 3 years of performance sustained. Exceptional but possible if small/mid-cap continues structural bull run.</div>
          </div>
        </div>

        {/* Big number cards */}
        <div className="big-cards">
          <div className="big-card" style={{ borderBottomColor: '#f5c842' }}>
            <div className="bc-label">Invested</div>
            <div className="bc-val">₹10,00,000</div>
            <div className="bc-sub">One-time lump sum today</div>
            <div className="bc-growth" style={{ color: 'var(--text-secondary)' }}>Spread across 31 funds</div>
          </div>
          <div className="big-card" style={{ borderBottomColor: '#ff5e5e' }}>
            <div className="bc-label">Conservative ({lowRate}% → net {netLow.toFixed(1)}%)</div>
            <div className="bc-val" style={{ color: '#ff5e5e' }}>{fmt(valLow)}</div>
            <div className="bc-sub">After {years} years</div>
            <div className="bc-growth" style={{ color: '#ff5e5e' }}>{multLow}× your money</div>
          </div>
          <div className="big-card" style={{ borderBottomColor: '#f5c842' }}>
            <div className="bc-label">Base Case ({baseRate}% → net {netBase.toFixed(1)}%)</div>
            <div className="bc-val" style={{ color: '#f5c842' }}>{fmt(valBase)}</div>
            <div className="bc-sub">After {years} years · Your target</div>
            <div className="bc-growth" style={{ color: '#f5c842' }}>{multBase}× your money</div>
          </div>
          <div className="big-card" style={{ borderBottomColor: '#00e5a0' }}>
            <div className="bc-label">Optimistic ({highRate}% → net {netHigh.toFixed(1)}%)</div>
            <div className="bc-val" style={{ color: '#00e5a0' }}>{fmt(valHigh)}</div>
            <div className="bc-sub">After {years} years</div>
            <div className="bc-growth" style={{ color: '#00e5a0' }}>{multHigh}× your money</div>
          </div>
          <div className="big-card" style={{ borderBottomColor: '#6b7494' }}>
            <div className="bc-label">Real Value (inflation-adjusted)</div>
            <div className="bc-val" style={{ color: '#a0aec0' }}>{fmt(valReal)}</div>
            <div className="bc-sub">Purchasing power in today's ₹</div>
            <div className="bc-growth" style={{ color: 'var(--text-secondary)' }}>At {infl}% inflation p.a.</div>
          </div>
        </div>

        {/* Line chart */}
        <div className="chart-card">
          <div className="chart-title">Wealth Growth Over Time — 3 Scenarios</div>
          <div className="chart-sub">Gross returns before inflation adjustment. Slide the controls above to explore different outcomes.</div>
          <div className="chart-area">
            <Chart />
          </div>
          <div className="chart-legend">
            <div className="legend-item"><div className="legend-box" style={{ background: '#ff5e5e' }}/> Conservative</div>
            <div className="legend-item"><div className="legend-box" style={{ background: '#f5c842' }}/> Base Case (Your Target)</div>
            <div className="legend-item"><div className="legend-box" style={{ background: '#00e5a0' }}/> Optimistic</div>
            <div className="legend-item"><div className="legend-box" style={{ background: 'transparent', borderTop: '2px dashed #f5c842' }}/> Real Value (Inflation-adjusted)</div>
          </div>
        </div>

        {/* Inflation note */}
        <div className="inflation-note">
          <strong><AlertTriangle size={16} style={{display:'inline', verticalAlign:'sub'}}/> Inflation Reality Check:</strong> Your {fmt(valBase)} at base case looks impressive — but at {infl}% annual inflation, that money will have the purchasing power of only <strong>{fmt(valReal)} in today's rupees</strong> ({purchasingPowerLoss}% purchasing power erosion). This is why maximising real returns above inflation matters. Your net real return at base case = <strong>{(netBase - infl).toFixed(1)}% per year</strong> — still very solid for retirement wealth creation.
        </div>

        {/* Year by year table */}
        <div className="chart-card">
          <div className="chart-title">Year-by-Year Projection</div>
          <div className="chart-sub">Nominal value across all 3 scenarios. Gold rows = milestone years.</div>
          <div style={{overflowX:'auto'}}>
            <table className="year-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Age of Investment</th>
                  <th className="val-low">Conservative</th>
                  <th className="val-base">Base/Target ({(baseRate).toFixed(1)}%)</th>
                  <th className="val-high">Optimistic</th>
                  <th>Real Value (Infl-adj.)</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map(row => (
                  <tr key={row.year} className={row.isMilestone ? 'highlight-row' : ''}>
                    <td className="yr">{row.year}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {row.isTarget ? '🎯 Target Year' : (row.isMilestone ? '⭐ Milestone' : '')}
                    </td>
                    <td className="val-low">{fmtShort(row.vLow)}</td>
                    <td className="val-base">
                      {fmtShort(row.vBase)}
                      {row.isCr && <span className="milestone-badge">FIRST ₹1 CR</span>}
                      {row.isTenCr && <span className="milestone-badge">₹10 CR</span>}
                    </td>
                    <td className="val-high">{fmtShort(row.vHigh)}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{fmtShort(row.vReal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="disclaimer">
          ⚠️ <strong>Disclaimer:</strong> All projections are mathematical illustrations based on constant compounding rates and do not guarantee actual returns. Mutual fund investments are subject to market risks. Past performance is not indicative of future results. Returns shown are pre-tax; actual post-tax returns will vary. LTCG at 12.5% applies on equity gains above ₹1.25 lakh per year.
        </div>
      </div>

      <style>{`
        .wealth-projection {
          max-width: 1300px;
          margin: 0 auto;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 24px;
          font-size: 0.9rem;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }

        .header {
          background: linear-gradient(135deg, rgba(11, 14, 23, 0.5) 0%, rgba(15, 26, 46, 0.5) 100%);
          padding: 30px;
          border: 1px solid var(--border-color);
          border-radius: 16px 16px 0 0;
          border-bottom: inset;
          position: relative; 
          overflow: hidden;
        }
        
        .eyebrow { font-family: monospace; font-size: 0.75rem; letter-spacing: 2px; color: #f5c842; text-transform: uppercase; margin-bottom: 10px; }
        .header h1 { font-size: 2.2rem; font-weight: 800; color: #fff; letter-spacing: -1px; margin:0;}
        .header h1 span { color: #f5c842; }
        .header-sub { color: var(--text-secondary); font-size: 0.88rem; margin-top: 8px; }

        .controls {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-top: none;
          padding: 24px 30px;
          display: flex; gap: 40px; flex-wrap: wrap; align-items: center;
          border-radius: 0 0 16px 16px;
          margin-bottom: 30px;
        }
        
        .control-group { display: flex; flex-direction: column; gap: 6px; }
        .ctrl-label { font-family: monospace; font-size: 0.7rem; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-secondary); }
        .ctrl-val { font-size: 1.3rem; font-weight: 700; color: #fff; }
        .ctrl-val span { color: #f5c842; }
        
        input[type=range] {
          -webkit-appearance: none; width: 180px; height: 4px;
          background: var(--border-color); border-radius: 4px; outline: none; cursor: pointer;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 16px; height: 16px;
          border-radius: 50%; background: #f5c842; cursor: pointer;
        }

        /* Scenarios */
        .scenarios { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px; margin-bottom: 28px; }
        .sc-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 18px 20px;
        }
        .sc-rate { font-size: 1.4rem; font-weight: 800; margin-bottom: 4px; }
        .sc-name { font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 10px; }
        .sc-desc { font-size: 0.8rem; color: var(--text-primary); line-height: 1.6; }

        /* Big cards */
        .big-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 36px; }
        .big-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 24px 22px;
          border-bottom: 3px solid;
          transition: transform 0.2s;
        }
        .big-card:hover { transform: translateY(-2px); }
        .bc-label { font-family: monospace; font-size: 0.65rem; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 10px; }
        .bc-val { font-size: 1.6rem; font-weight: 800; color: #fff; line-height: 1; }
        .bc-sub { font-size: 0.75rem; color: var(--text-secondary); margin-top: 6px; }
        .bc-growth { font-family: monospace; font-size: 0.78rem; margin-top: 8px; }

        /* Chart */
        .chart-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 28px;
          margin-bottom: 28px;
        }
        .chart-title { font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 6px; }
        .chart-sub { font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 24px; }
        .chart-area { position: relative; height: 260px; }
        .chart-legend { display:flex; gap:24px; margin-top:16px; flex-wrap:wrap; }
        .legend-item { display:flex; align-items:center; gap:8px; font-size:0.75rem; color:var(--text-secondary); }
        .legend-box { width:28px; height:3px; border-radius:2px; }

        /* Inflation note */
        .inflation-note {
          background: rgba(255,94,94,0.07);
          border: 1px solid rgba(255,94,94,0.2);
          border-radius: 10px; padding: 18px 22px;
          font-size: 0.85rem; color: var(--text-primary); line-height: 1.7;
          margin-bottom: 28px;
        }
        .inflation-note strong { color: #ff5e5e; }

        /* Year table */
        .year-table { width: 100%; border-collapse: collapse; text-align: left;}
        .year-table th {
          font-family: monospace; font-size: 0.7rem; letter-spacing: 1.2px;
          text-transform: uppercase; color: var(--text-secondary); padding: 12px 16px;
          border-bottom: 1px solid var(--border-color);
        }
        .year-table td { padding: 12px 16px; font-size: 0.88rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .year-table tr:hover td { background: rgba(255,255,255,0.02); }
        .yr { font-family: monospace; color: var(--text-secondary); }
        .val-low { color: #ff5e5e; font-weight: 600; }
        .val-base { color: #f5c842; font-weight: 600; }
        .val-high { color: #00e5a0; font-weight: 600; }
        .highlight-row td { background: rgba(245,200,66,0.06) !important; }
        .milestone-badge {
          display: inline-block; font-family: monospace;
          font-size: 0.6rem; padding: 2px 7px; border-radius: 10px;
          background: rgba(245,200,66,0.15); color: #f5c842;
          margin-left: 8px; letter-spacing: 0.5px;
        }

        .disclaimer { font-size: 0.75rem; color: var(--text-secondary); line-height: 1.7; padding: 20px 0; border-top: 1px solid var(--border-color); }
      `}</style>
    </div>
  );
};

export default WealthProjectionPage;
