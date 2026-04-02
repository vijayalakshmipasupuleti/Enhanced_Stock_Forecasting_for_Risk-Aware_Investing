import React, { useState, useMemo } from 'react';
import { Calculator, Info, TrendingUp, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const calculateXIRR = (cashFlows, guess = 0.1) => {
  if (!cashFlows || cashFlows.length < 2) return null;

  const flows = cashFlows.map(f => ({
    date: new Date(f.date).getTime(),
    amount: f.type === 'Investment' ? -Math.abs(f.amount) : Math.abs(f.amount)
  })).sort((a, b) => a.date - b.date);

  if (!flows.some(f => f.amount > 0) || !flows.some(f => f.amount < 0)) return null;

  const d0 = flows[0].date;

  const f = (rate) => flows.reduce((sum, flow) => {
    return sum + flow.amount / Math.pow(1 + rate, (flow.date - d0) / 86400000 / 365.25);
  }, 0);

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

const XirrCalculator = () => {
  const [frequency, setFrequency] = useState('Yearly');
  const [startDate, setStartDate] = useState('2021-01-01');
  const [maturityDate, setMaturityDate] = useState('2024-01-01');
  const [recurringAmount, setRecurringAmount] = useState(10000);
  const [maturityAmount, setMaturityAmount] = useState(60000);

  // Generate Cashflows and Chart Data
  const { xirrResult, chartData } = useMemo(() => {
    let daysStep = 365;
    if (frequency === '14 Days') daysStep = 14;
    else if (frequency === 'Monthly') daysStep = 30.44;
    else if (frequency === 'Quarterly') daysStep = 91.25;
    else if (frequency === 'Half Yearly') daysStep = 182.5;

    const sDate = new Date(startDate);
    const mDate = new Date(maturityDate);
    const totalDays = (mDate - sDate) / 86400000;

    if (totalDays <= 0 || recurringAmount <= 0 || maturityAmount <= 0) return { xirrResult: null, chartData: [] };

    let cashFlows = [];
    let currentData = [];
    let cDate = new Date(sDate);
    let totalInvested = 0;

    // Linear growth estimation for the chart just to simulate the "Portfolio Growth" look from screenshot
    const periods = Math.floor(totalDays / daysStep) + 1;
    const impliedRatePerPeriod = Math.pow(maturityAmount / (recurringAmount * periods), 1/periods) - 1 || 0.01;

    let idx = 0;
    while (cDate <= mDate) {
      cashFlows.push({ date: new Date(cDate), amount: recurringAmount, type: 'Investment' });
      totalInvested += recurringAmount;
      
      // Approximation for the chart
      let approxVal = totalInvested * Math.pow(1 + Math.abs(impliedRatePerPeriod), idx);
      if (cDate.getTime() === mDate.getTime()) approxVal = maturityAmount;

      currentData.push({
        year: cDate.getFullYear(),
        dateStr: cDate.toLocaleDateString(),
        invested: totalInvested,
        portfolio: approxVal
      });
      
      cDate = new Date(cDate.getTime() + daysStep * 86400000);
      idx++;
    }

    // Add final maturity
    cashFlows.push({ date: mDate, amount: maturityAmount, type: 'Withdrawal' });

    // Ensure the last chart point perfectly matches maturity amount
    if (currentData.length > 0) {
      currentData[currentData.length - 1].portfolio = maturityAmount;
    }

    const rate = calculateXIRR(cashFlows);
    return {
      xirrResult: rate !== null ? (rate * 100).toFixed(2) : null,
      chartData: currentData
    };

  }, [frequency, startDate, maturityDate, recurringAmount, maturityAmount]);

  const formatCurrency = (val) => '₹' + Math.round(val).toLocaleString('en-IN');

  return (
    <div className="calculator-wrapper glass-panel animate-fade-in">
      <div className="calc-header">
        <h2 className="text-gradient">XIRR Calculator - Extended Internal Rate of Return Calculator</h2>
      </div>

      <div className="xirr-layout">
        <div className="form-section">
          
          <div className="freq-group">
            <label>Investment Frequency</label>
            <div className="radio-group">
              {['14 Days', 'Monthly', 'Quarterly', 'Half Yearly', 'Yearly'].map(freq => (
                <label key={freq} className="radio-label">
                  <input 
                    type="radio" 
                    name="freq" 
                    value={freq} 
                    checked={frequency === freq}
                    onChange={(e) => setFrequency(e.target.value)}
                  />
                  <span>{freq}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="input-row">
            <label>Start date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="input-row">
            <label>Maturity date</label>
            <input type="date" value={maturityDate} onChange={(e) => setMaturityDate(e.target.value)} />
          </div>

          <div className="input-row">
            <label>Recurring investment amount</label>
            <div className="input-with-symbol">
              <span>₹</span>
              <input type="number" value={recurringAmount} onChange={(e) => setRecurringAmount(Number(e.target.value))} />
            </div>
          </div>

          <div className="input-row">
            <label>Total maturity amount</label>
            <div className="input-with-symbol">
              <span>₹</span>
              <input type="number" value={maturityAmount} onChange={(e) => setMaturityAmount(Number(e.target.value))} />
            </div>
          </div>
        </div>

        <div className="display-section">
          <div className="xirr-result-box">
            <span className="tooltip-trigger">Your XIRR <Info size={14}/></span>
            <div className="xirr-value">{xirrResult !== null ? `${xirrResult}%` : '---'}</div>
          </div>

          <div className="chart-section">
            <h4 style={{marginBottom: '1rem', color: 'var(--text-primary)'}}>Wealth Projection</h4>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="year" stroke="var(--text-secondary)" tick={{fontSize: 12}} />
                <YAxis 
                  stroke="var(--text-secondary)" 
                  tick={{fontSize: 12}} 
                  tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}K` : val}
                />
                <RechartsTooltip 
                  labelFormatter={(v, payloads) => payloads.length > 0 ? payloads[0].payload.dateStr : ''}
                  formatter={(value) => [formatCurrency(value), '']}
                  contentStyle={{background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="portfolio" 
                  name="Portfolio Growth (returns)"
                  stroke="#4f46e5" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPortfolio)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="invested" 
                  name="Investment Amount"
                  stroke="#00f0ff" 
                  strokeWidth={2}
                  fill="none" 
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              <span className="legend-item"><span className="dot" style={{background: '#00f0ff'}}></span> Investment Amount</span>
              <span className="legend-item"><span className="dot" style={{background: '#4f46e5'}}></span> Portfolio Growth (returns)</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .calculator-wrapper {
          padding: 2rem;
          background: var(--glass-bg);
          border-radius: var(--radius-lg);
          border: var(--glass-border);
          color: var(--text-primary);
        }

        .calc-header {
          margin-bottom: 2rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding-bottom: 1rem;
        }

        .xirr-layout {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 3rem;
        }

        @media (max-width: 768px) {
          .xirr-layout {
            grid-template-columns: 1fr;
          }
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .freq-group label {
          display: block;
          color: var(--text-secondary);
          margin-bottom: 0.8rem;
          font-weight: 500;
        }

        .radio-group {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          color: var(--text-primary);
        }

        .radio-label input {
          accent-color: var(--accent-cyan);
        }

        .input-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .input-row label {
          color: var(--text-secondary);
          font-weight: 500;
        }

        .input-row input[type="date"] {
          background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-primary);
          padding: 8px 12px;
          border-radius: 6px;
          outline: none;
        }

        .input-with-symbol {
          background: rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .input-with-symbol span {
          color: var(--text-secondary);
          margin-right: 8px;
        }

        .input-with-symbol input {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-weight: 600;
          font-size: 1rem;
          width: 100px;
          text-align: right;
          outline: none;
        }

        .display-section {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .xirr-result-box {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: var(--radius-md);
          padding: 1.5rem;
        }

        .tooltip-trigger {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .xirr-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--accent-green);
        }

        .chart-legend {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          margin-top: 1rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
};

export default XirrCalculator;
