import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, PiggyBank, TrendingUp, IndianRupee } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, PieChart, Pie, Cell } from 'recharts';
import { formatINR } from '../utils/format';

const SipPage = () => {
  const navigate = useNavigate();
  const [monthly, setMonthly] = useState(10000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(15);

  const result = useMemo(() => {
    const n = years * 12;
    const r = rate / 100 / 12;
    const futureValue = monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const invested = monthly * n;
    const returns = futureValue - invested;
    const returnPct = invested > 0 ? (returns / invested) * 100 : 0;

    // Year-by-year data for chart
    const chartData = [];
    for (let y = 0; y <= years; y++) {
      const months = y * 12;
      const fv = months === 0 ? 0 : monthly * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
      const inv = monthly * months;
      chartData.push({
        year: `${y}Y`,
        invested: Math.round(inv),
        growth: Math.round(fv),
        returns: Math.round(fv - inv),
      });
    }

    return { futureValue, invested, returns, returnPct, chartData };
  }, [monthly, rate, years]);

  const pieData = [
    { name: 'Invested', value: result.invested, color: '#36a3ff' },
    { name: 'Returns', value: result.returns, color: '#00f0ff' },
  ];

  return (
    <div className="sip-page animate-fade-in">
      <button className="back-btn" onClick={() => navigate('/calculators')}>
        <ChevronLeft size={18} /> Back to Calculators
      </button>

      <div className="page-header">
        <div className="header-icon"><PiggyBank size={28} /></div>
        <div>
          <h1>SIP Calculator</h1>
          <p>Calculate returns on your Systematic Investment Plan</p>
        </div>
      </div>

      <div className="calc-layout">
        {/* Left: Inputs */}
        <div className="inputs-panel glass-panel">
          <div className="input-section">
            <div className="input-header">
              <label>Monthly Investment</label>
              <div className="input-value-box">
                <span>₹</span>
                <input type="number" value={monthly} onChange={e => setMonthly(Math.max(500, Number(e.target.value)))} />
              </div>
            </div>
            <input type="range" className="slider" min="500" max="200000" step="500" value={monthly} onChange={e => setMonthly(Number(e.target.value))} />
            <div className="range-labels"><span>₹500</span><span>₹2,00,000</span></div>
          </div>

          <div className="input-section">
            <div className="input-header">
              <label>Expected Return Rate (p.a.)</label>
              <div className="input-value-box">
                <input type="number" value={rate} onChange={e => setRate(Math.min(30, Math.max(1, Number(e.target.value))))} />
                <span>%</span>
              </div>
            </div>
            <input type="range" className="slider" min="1" max="30" step="0.5" value={rate} onChange={e => setRate(Number(e.target.value))} />
            <div className="range-labels"><span>1%</span><span>30%</span></div>
          </div>

          <div className="input-section">
            <div className="input-header">
              <label>Time Period</label>
              <div className="input-value-box">
                <input type="number" value={years} onChange={e => setYears(Math.min(40, Math.max(1, Number(e.target.value))))} />
                <span>Yr</span>
              </div>
            </div>
            <input type="range" className="slider" min="1" max="40" step="1" value={years} onChange={e => setYears(Number(e.target.value))} />
            <div className="range-labels"><span>1 Yr</span><span>40 Yrs</span></div>
          </div>
        </div>

        {/* Right: Results */}
        <div className="results-panel">
          <div className="result-cards">
            <div className="result-card invested">
              <span className="rc-label">Invested Amount</span>
              <span className="rc-value">{formatINR(result.invested)}</span>
              <span className="rc-sub">{monthly.toLocaleString('en-IN')} × {years * 12} months</span>
            </div>
            <div className="result-card returns">
              <span className="rc-label">Estimated Returns</span>
              <span className="rc-value">{formatINR(result.returns)}</span>
              <span className="rc-sub positive">+{result.returnPct.toFixed(1)}% total gain</span>
            </div>
            <div className="result-card total">
              <span className="rc-label">Total Value</span>
              <span className="rc-value big">{formatINR(result.futureValue)}</span>
              <span className="rc-sub">{(result.futureValue / result.invested).toFixed(1)}× your investment</span>
            </div>
          </div>

          {/* Donut Chart */}
          <div className="donut-section glass-panel">
            <h3>Investment Breakdown</h3>
            <div className="donut-layout">
              <div className="donut-chart">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie data={pieData} innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip formatter={(v) => formatINR(v)} contentStyle={{ background: '#151521', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="donut-legend">
                <div className="legend-row">
                  <span className="legend-dot" style={{ background: '#36a3ff' }} />
                  <span className="legend-label">Invested</span>
                  <span className="legend-val">{formatINR(result.invested)}</span>
                </div>
                <div className="legend-row">
                  <span className="legend-dot" style={{ background: '#00f0ff' }} />
                  <span className="legend-label">Returns</span>
                  <span className="legend-val">{formatINR(result.returns)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Chart */}
      <div className="chart-section glass-panel">
        <h3>Growth Over Time</h3>
        <p className="chart-sub">Invested amount vs total growth projection year by year</p>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={result.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradInvested" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#36a3ff" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#36a3ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="year" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
              <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12 }} tickFormatter={v => formatINR(v)} width={80} />
              <RechartsTooltip formatter={(v) => formatINR(v)} contentStyle={{ background: '#151521', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
              <Area type="monotone" dataKey="growth" name="Total Value" stroke="#00f0ff" strokeWidth={2.5} fillOpacity={1} fill="url(#gradGrowth)" />
              <Area type="monotone" dataKey="invested" name="Invested" stroke="#36a3ff" strokeWidth={2} fillOpacity={1} fill="url(#gradInvested)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style>{`
        .sip-page { display: flex; flex-direction: column; gap: 1.5rem; }

        .back-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; background: rgba(255,255,255,0.04);
          border: 1px solid var(--border-color); border-radius: 8px;
          color: var(--text-secondary); cursor: pointer; font-size: 0.85rem;
          transition: all 0.2s; align-self: flex-start;
        }
        .back-btn:hover { color: var(--text-primary); border-color: rgba(255,255,255,0.2); }

        .page-header { display: flex; align-items: center; gap: 16px; }
        .header-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; background: rgba(0,240,255,0.08); color: var(--accent-cyan); }
        .page-header h1 { font-size: 1.6rem; font-weight: 700; margin: 0; }
        .page-header p { color: var(--text-secondary); font-size: 0.9rem; margin: 0; }

        .calc-layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: 1.25rem; }
        @media (max-width: 800px) { .calc-layout { grid-template-columns: 1fr; } }

        /* Inputs */
        .inputs-panel { padding: 1.5rem; border-radius: var(--radius-lg); display: flex; flex-direction: column; gap: 1.5rem; }
        .input-section { display: flex; flex-direction: column; gap: 8px; }
        .input-header { display: flex; justify-content: space-between; align-items: center; }
        .input-header label { font-size: 0.82rem; color: var(--text-secondary); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
        .input-value-box { display: flex; align-items: center; gap: 4px; background: rgba(255,255,255,0.04); border: 1px solid var(--border-color); border-radius: 8px; padding: 6px 12px; }
        .input-value-box span { color: var(--accent-cyan); font-weight: 600; font-size: 0.9rem; }
        .input-value-box input { width: 80px; background: transparent; border: none; outline: none; color: var(--text-primary); font-weight: 700; font-size: 1rem; text-align: right; font-family: 'JetBrains Mono', monospace; }
        .slider { -webkit-appearance: none; width: 100%; height: 5px; border-radius: 5px; background: rgba(255,255,255,0.08); outline: none; }
        .slider::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: var(--accent-cyan); cursor: pointer; transition: transform 0.15s; box-shadow: 0 0 10px rgba(0,240,255,0.3); }
        .slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
        .range-labels { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-secondary); }

        /* Results */
        .results-panel { display: flex; flex-direction: column; gap: 1.25rem; }
        .result-cards { display: flex; flex-direction: column; gap: 10px; }
        .result-card { padding: 1.25rem; border-radius: var(--radius-md); background: var(--bg-secondary); border: 1px solid var(--border-color); }
        .rc-label { display: block; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .rc-value { display: block; font-size: 1.5rem; font-weight: 800; font-family: 'JetBrains Mono', monospace; color: var(--text-primary); }
        .rc-value.big { font-size: 1.8rem; background: linear-gradient(135deg, var(--accent-cyan), var(--accent-blue)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .rc-sub { display: block; font-size: 0.78rem; color: var(--text-secondary); margin-top: 4px; }
        .rc-sub.positive { color: var(--accent-green); }
        .result-card.total { border-color: rgba(0,240,255,0.2); background: rgba(0,240,255,0.03); }

        /* Donut */
        .donut-section { padding: 1.5rem; border-radius: var(--radius-md); }
        .donut-section h3 { font-size: 1rem; font-weight: 600; margin: 0 0 1rem 0; }
        .donut-layout { display: flex; align-items: center; gap: 1.5rem; }
        .donut-chart { flex-shrink: 0; }
        .donut-legend { display: flex; flex-direction: column; gap: 14px; }
        .legend-row { display: flex; align-items: center; gap: 10px; }
        .legend-dot { width: 12px; height: 12px; border-radius: 4px; flex-shrink: 0; }
        .legend-label { font-size: 0.85rem; color: var(--text-secondary); min-width: 70px; }
        .legend-val { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); font-family: 'JetBrains Mono', monospace; }

        /* Chart */
        .chart-section { padding: 1.5rem; border-radius: var(--radius-lg); }
        .chart-section h3 { font-size: 1.1rem; font-weight: 600; margin: 0; }
        .chart-sub { color: var(--text-secondary); font-size: 0.85rem; margin: 4px 0 1.5rem 0; }
      `}</style>
    </div>
  );
};

export default SipPage;
