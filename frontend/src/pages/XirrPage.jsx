import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Percent, TrendingUp, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { formatINR } from '../utils/format';

const calculateXIRR = (cashFlows, guess = 0.1) => {
  if (!cashFlows || cashFlows.length < 2) return null;
  const flows = cashFlows.map(f => ({
    date: new Date(f.date).getTime(),
    amount: f.type === 'Investment' ? -Math.abs(f.amount) : Math.abs(f.amount)
  })).sort((a, b) => a.date - b.date);
  if (!flows.some(f => f.amount > 0) || !flows.some(f => f.amount < 0)) return null;
  const d0 = flows[0].date;
  const f = (rate) => flows.reduce((sum, flow) => sum + flow.amount / Math.pow(1 + rate, (flow.date - d0) / 86400000 / 365.25), 0);
  const df = (rate) => flows.reduce((sum, flow) => {
    const t = (flow.date - d0) / 86400000 / 365.25;
    return sum - (t * flow.amount) / Math.pow(1 + rate, t + 1);
  }, 0);
  let rate = guess;
  for (let i = 0; i < 100; i++) {
    const y = f(rate);
    const yPrime = df(rate);
    if (Math.abs(yPrime) < 1e-15) break;
    const newRate = rate - y / yPrime;
    if (Math.abs(newRate - rate) < 1e-7) return newRate;
    rate = newRate;
  }
  return null;
};

const FREQUENCIES = [
  { label: '14 Days', value: '14 Days', days: 14 },
  { label: 'Monthly', value: 'Monthly', days: 30.44 },
  { label: 'Quarterly', value: 'Quarterly', days: 91.25 },
  { label: 'Half Yearly', value: 'Half Yearly', days: 182.5 },
  { label: 'Yearly', value: 'Yearly', days: 365 },
];

const XirrPage = () => {
  const navigate = useNavigate();
  const [frequency, setFrequency] = useState('Monthly');
  const [startDate, setStartDate] = useState('2021-01-01');
  const [maturityDate, setMaturityDate] = useState('2024-01-01');
  const [recurringAmount, setRecurringAmount] = useState(10000);
  const [maturityAmount, setMaturityAmount] = useState(500000);

  const { xirrResult, chartData, totalInvested, numPayments } = useMemo(() => {
    const freq = FREQUENCIES.find(f => f.value === frequency);
    const daysStep = freq?.days || 365;
    const sDate = new Date(startDate);
    const mDate = new Date(maturityDate);
    const totalDays = (mDate - sDate) / 86400000;
    if (totalDays <= 0 || recurringAmount <= 0 || maturityAmount <= 0) return { xirrResult: null, chartData: [], totalInvested: 0, numPayments: 0 };

    let cashFlows = [];
    let currentData = [];
    let cDate = new Date(sDate);
    let invested = 0;

    const periods = Math.floor(totalDays / daysStep) + 1;
    const impliedRate = Math.pow(maturityAmount / (recurringAmount * periods), 1 / periods) - 1 || 0.01;

    let idx = 0;
    while (cDate <= mDate) {
      cashFlows.push({ date: new Date(cDate), amount: recurringAmount, type: 'Investment' });
      invested += recurringAmount;
      let approxVal = invested * Math.pow(1 + Math.abs(impliedRate), idx);
      if (cDate.getTime() === mDate.getTime()) approxVal = maturityAmount;
      currentData.push({
        label: cDate.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        invested,
        portfolio: Math.round(approxVal),
      });
      cDate = new Date(cDate.getTime() + daysStep * 86400000);
      idx++;
    }

    cashFlows.push({ date: mDate, amount: maturityAmount, type: 'Withdrawal' });
    if (currentData.length > 0) currentData[currentData.length - 1].portfolio = maturityAmount;

    const rate = calculateXIRR(cashFlows);
    return {
      xirrResult: rate !== null ? (rate * 100).toFixed(2) : null,
      chartData: currentData,
      totalInvested: invested,
      numPayments: cashFlows.length - 1,
    };
  }, [frequency, startDate, maturityDate, recurringAmount, maturityAmount]);

  const gain = maturityAmount - totalInvested;
  const gainPct = totalInvested > 0 ? (gain / totalInvested * 100).toFixed(1) : '0';

  return (
    <div className="xirr-page animate-fade-in">
      <button className="back-btn" onClick={() => navigate('/calculators')}>
        <ChevronLeft size={18} /> Back to Calculators
      </button>

      <div className="page-header">
        <div className="header-icon green"><Percent size={28} /></div>
        <div>
          <h1>XIRR Calculator</h1>
          <p>Extended Internal Rate of Return for irregular cash flows</p>
        </div>
      </div>

      <div className="calc-layout">
        {/* Inputs */}
        <div className="inputs-panel glass-panel">
          {/* Frequency buttons */}
          <div className="input-section">
            <label className="section-label">Investment Frequency</label>
            <div className="freq-buttons">
              {FREQUENCIES.map(f => (
                <button
                  key={f.value}
                  className={`freq-btn ${frequency === f.value ? 'active' : ''}`}
                  onClick={() => setFrequency(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="date-row">
            <div className="input-section">
              <label className="section-label">Start Date</label>
              <input type="date" className="date-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="input-section">
              <label className="section-label">Maturity Date</label>
              <input type="date" className="date-input" value={maturityDate} onChange={e => setMaturityDate(e.target.value)} />
            </div>
          </div>

          <div className="input-section">
            <div className="input-header">
              <label className="section-label">Recurring Amount</label>
              <div className="input-value-box green">
                <span>₹</span>
                <input type="number" value={recurringAmount} onChange={e => setRecurringAmount(Math.max(100, Number(e.target.value)))} />
              </div>
            </div>
            <input type="range" className="slider green" min="100" max="100000" step="100" value={recurringAmount} onChange={e => setRecurringAmount(Number(e.target.value))} />
            <div className="range-labels"><span>₹100</span><span>₹1,00,000</span></div>
          </div>

          <div className="input-section">
            <div className="input-header">
              <label className="section-label">Maturity Amount</label>
              <div className="input-value-box green">
                <span>₹</span>
                <input type="number" value={maturityAmount} onChange={e => setMaturityAmount(Math.max(100, Number(e.target.value)))} />
              </div>
            </div>
            <input type="range" className="slider green" min="1000" max="10000000" step="1000" value={maturityAmount} onChange={e => setMaturityAmount(Number(e.target.value))} />
            <div className="range-labels"><span>₹1,000</span><span>₹1 Cr</span></div>
          </div>
        </div>

        {/* Results */}
        <div className="results-panel">
          {/* XIRR Hero */}
          <div className="xirr-hero glass-panel">
            <span className="xirr-label">Your XIRR</span>
            {xirrResult !== null ? (
              <span className={`xirr-value ${Number(xirrResult) >= 0 ? 'positive' : 'negative'}`}>
                {xirrResult}%
              </span>
            ) : (
              <span className="xirr-value neutral">—</span>
            )}
            <span className="xirr-sub">Annualized Return (Newton-Raphson Method)</span>
          </div>

          <div className="result-cards">
            <div className="result-card">
              <span className="rc-label">Total Invested</span>
              <span className="rc-value">{formatINR(totalInvested)}</span>
              <span className="rc-sub">{numPayments} payments × {formatINR(recurringAmount)}</span>
            </div>
            <div className="result-card">
              <span className="rc-label">Maturity Value</span>
              <span className="rc-value">{formatINR(maturityAmount)}</span>
            </div>
            <div className="result-card">
              <span className="rc-label">Total Gain / Loss</span>
              <span className={`rc-value ${gain >= 0 ? 'gain' : 'loss'}`}>{gain >= 0 ? '+' : ''}{formatINR(gain)}</span>
              <span className={`rc-sub ${gain >= 0 ? 'positive' : ''}`}>{gain >= 0 ? '+' : ''}{gainPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="chart-section glass-panel">
        <h3>Investment vs Portfolio Growth</h3>
        <p className="chart-sub">See how your recurring investments grow compared to the portfolio value over time</p>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff9d" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00ff9d" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradBlue2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#36a3ff" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#36a3ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} minTickGap={40} />
              <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12 }} tickFormatter={v => formatINR(v)} width={80} />
              <RechartsTooltip formatter={(v) => formatINR(v)} contentStyle={{ background: '#151521', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
              <Area type="monotone" dataKey="portfolio" name="Portfolio Value" stroke="#00ff9d" strokeWidth={2.5} fillOpacity={1} fill="url(#gradGreen)" />
              <Area type="monotone" dataKey="invested" name="Total Invested" stroke="#36a3ff" strokeWidth={2} fillOpacity={1} fill="url(#gradBlue2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style>{`
        .xirr-page { display: flex; flex-direction: column; gap: 1.5rem; }
        .back-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: rgba(255,255,255,0.04); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-secondary); cursor: pointer; font-size: 0.85rem; transition: all 0.2s; align-self: flex-start; }
        .back-btn:hover { color: var(--text-primary); border-color: rgba(255,255,255,0.2); }
        .page-header { display: flex; align-items: center; gap: 16px; }
        .header-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .header-icon.green { background: rgba(0,255,157,0.1); color: #00ff9d; }
        .page-header h1 { font-size: 1.6rem; font-weight: 700; margin: 0; }
        .page-header p { color: var(--text-secondary); font-size: 0.9rem; margin: 0; }

        .calc-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        @media (max-width: 800px) { .calc-layout { grid-template-columns: 1fr; } }

        .inputs-panel { padding: 1.5rem; border-radius: var(--radius-lg); display: flex; flex-direction: column; gap: 1.5rem; }
        .input-section { display: flex; flex-direction: column; gap: 8px; }
        .section-label { font-size: 0.82rem; color: var(--text-secondary); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }

        .freq-buttons { display: flex; flex-wrap: wrap; gap: 6px; }
        .freq-btn { padding: 8px 14px; border-radius: 8px; border: 1px solid var(--border-color); background: rgba(255,255,255,0.03); color: var(--text-secondary); cursor: pointer; font-size: 0.82rem; font-weight: 500; transition: all 0.2s; }
        .freq-btn:hover { border-color: rgba(0,255,157,0.3); color: var(--text-primary); }
        .freq-btn.active { background: rgba(0,255,157,0.1); border-color: rgba(0,255,157,0.4); color: #00ff9d; font-weight: 700; }

        .date-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .date-input { padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-color); background: rgba(255,255,255,0.04); color: var(--text-primary); font-size: 0.9rem; font-family: 'JetBrains Mono', monospace; outline: none; transition: border-color 0.2s; }
        .date-input:focus { border-color: rgba(0,255,157,0.4); }

        .input-header { display: flex; justify-content: space-between; align-items: center; }
        .input-value-box { display: flex; align-items: center; gap: 4px; background: rgba(255,255,255,0.04); border: 1px solid var(--border-color); border-radius: 8px; padding: 6px 12px; }
        .input-value-box.green span { color: #00ff9d; font-weight: 600; font-size: 0.9rem; }
        .input-value-box input { width: 100px; background: transparent; border: none; outline: none; color: var(--text-primary); font-weight: 700; font-size: 1rem; text-align: right; font-family: 'JetBrains Mono', monospace; }
        .slider { -webkit-appearance: none; width: 100%; height: 5px; border-radius: 5px; background: rgba(255,255,255,0.08); outline: none; }
        .slider.green::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #00ff9d; cursor: pointer; box-shadow: 0 0 10px rgba(0,255,157,0.3); }
        .slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
        .range-labels { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-secondary); }

        /* Results */
        .results-panel { display: flex; flex-direction: column; gap: 1.25rem; }

        .xirr-hero { padding: 2rem; border-radius: var(--radius-lg); display: flex; flex-direction: column; align-items: center; gap: 8px; border: 1px solid rgba(0,255,157,0.15); background: rgba(0,255,157,0.03); }
        .xirr-label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-secondary); font-weight: 600; }
        .xirr-value { font-size: 3.5rem; font-weight: 900; font-family: 'JetBrains Mono', monospace; }
        .xirr-value.positive { color: #00ff9d; }
        .xirr-value.negative { color: var(--accent-red); }
        .xirr-value.neutral { color: var(--text-secondary); }
        .xirr-sub { font-size: 0.78rem; color: var(--text-secondary); }

        .result-cards { display: flex; flex-direction: column; gap: 10px; }
        .result-card { padding: 1.1rem 1.25rem; border-radius: var(--radius-md); background: var(--bg-secondary); border: 1px solid var(--border-color); }
        .rc-label { display: block; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .rc-value { display: block; font-size: 1.3rem; font-weight: 800; font-family: 'JetBrains Mono', monospace; color: var(--text-primary); }
        .rc-value.gain { color: #00ff9d; }
        .rc-value.loss { color: var(--accent-red); }
        .rc-sub { display: block; font-size: 0.78rem; color: var(--text-secondary); margin-top: 3px; }
        .rc-sub.positive { color: #00ff9d; }

        .chart-section { padding: 1.5rem; border-radius: var(--radius-lg); }
        .chart-section h3 { font-size: 1.1rem; font-weight: 600; margin: 0; }
        .chart-sub { color: var(--text-secondary); font-size: 0.85rem; margin: 4px 0 1.5rem 0; }
      `}</style>
    </div>
  );
};

export default XirrPage;
