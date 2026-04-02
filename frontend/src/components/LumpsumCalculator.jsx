import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Calculator } from 'lucide-react';

const LumpsumCalculator = () => {
  const [investment, setInvestment] = useState(25000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);

  const totalValue = investment * Math.pow(1 + rate / 100, years);
  const estReturns = totalValue - investment;

  const chartData = [
    { name: 'Invested amount', value: investment, color: '#e0e7ff' }, // Light blue
    { name: 'Est. returns', value: estReturns, color: '#4f46e5' },    // Dark blue
  ];

  const formatCurrency = (val) => {
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  return (
    <div className="calculator-wrapper glass-panel animate-fade-in">
      <div className="calc-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calculator className="calc-icon" size={24} color="var(--accent-cyan)" />
          <h2 className="text-gradient">Lumpsum Calculator</h2>
        </div>
      </div>

      <div className="calc-layout">
        <div className="calc-inputs">
          
          <div className="input-group">
            <div className="flex-between">
              <label>Total investment</label>
              <div className="input-with-symbol">
                <span>₹</span>
                <input 
                  type="number" 
                  value={investment} 
                  onChange={(e) => setInvestment(Number(e.target.value))}
                />
              </div>
            </div>
            <input 
              type="range" 
              min="500" 
              max="1000000" 
              step="500"
              value={investment} 
              onChange={(e) => setInvestment(Number(e.target.value))}
              className="slider"
            />
          </div>

          <div className="input-group">
            <div className="flex-between">
              <label>Expected return rate (p.a)</label>
              <div className="input-with-symbol">
                <input 
                  type="number" 
                  value={rate} 
                  onChange={(e) => setRate(Number(e.target.value))}
                />
                <span>%</span>
              </div>
            </div>
            <input 
              type="range" 
              min="1" 
              max="30" 
              step="0.5"
              value={rate} 
              onChange={(e) => setRate(Number(e.target.value))}
              className="slider"
            />
          </div>

          <div className="input-group">
            <div className="flex-between">
              <label>Time period</label>
              <div className="input-with-symbol">
                <input 
                  type="number" 
                  value={years} 
                  onChange={(e) => setYears(Number(e.target.value))}
                />
                <span>Yr</span>
              </div>
            </div>
            <input 
              type="range" 
              min="1" 
              max="40" 
              step="1"
              value={years} 
              onChange={(e) => setYears(Number(e.target.value))}
              className="slider"
            />
          </div>

          <div className="results-list">
            <div className="result-row">
              <span>Invested amount</span>
              <strong>{formatCurrency(investment)}</strong>
            </div>
            <div className="result-row">
              <span>Est. returns</span>
              <strong>{formatCurrency(estReturns)}</strong>
            </div>
            <div className="result-row total">
              <span>Total value</span>
              <strong>{formatCurrency(totalValue)}</strong>
            </div>
          </div>

        </div>

        <div className="calc-chart-section">
          <div className="chart-legend">
            <span className="legend-item"><span className="dot" style={{background: '#e0e7ff'}}></span> Invested amount</span>
            <span className="legend-item"><span className="dot" style={{background: '#4f46e5'}}></span> Est. returns</span>
          </div>
          
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
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
        }

        .calc-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
        }

        @media (max-width: 768px) {
          .calc-layout {
            grid-template-columns: 1fr;
          }
        }

        .flex-between {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .input-group {
          margin-bottom: 2rem;
        }

        .input-group label {
          color: var(--text-secondary);
          font-weight: 500;
        }

        .input-with-symbol {
          background: rgba(0, 240, 255, 0.05);
          display: flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid rgba(0, 240, 255, 0.2);
        }

        .input-with-symbol span {
          color: var(--accent-cyan);
          font-weight: 600;
        }

        .input-with-symbol input {
          background: transparent;
          border: none;
          color: var(--accent-cyan);
          font-weight: 600;
          font-size: 1rem;
          width: 80px;
          text-align: right;
          outline: none;
          padding: 0 5px;
        }

        /* Slider specific styling */
        .slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 5px;
          background: rgba(255,255,255,0.1);
          outline: none;
          margin-top: 10px;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--accent-cyan);
          cursor: pointer;
          transition: transform 0.1s;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        .results-list {
          margin-top: 3rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .result-row {
          display: flex;
          justify-content: space-between;
          font-size: 1rem;
          color: var(--text-secondary);
        }
        
        .result-row strong {
          color: var(--text-primary);
          font-family: monospace;
          font-size: 1.1rem;
        }

        .result-row.total {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        .calc-chart-section {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .chart-legend {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .dot {
          width: 20px;
          height: 8px;
          border-radius: 4px;
        }

        .chart-container {
          width: 100%;
          display: flex;
          justify-content: center;
        }
      `}</style>
    </div>
  );
};

export default LumpsumCalculator;
