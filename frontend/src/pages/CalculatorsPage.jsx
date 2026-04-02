import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, TrendingUp, ArrowRight, BarChart3, PiggyBank, Percent, LineChart } from 'lucide-react';

const CALCULATORS = [
  {
    id: 'sip',
    title: 'SIP Calculator',
    subtitle: 'Systematic Investment Plan',
    description: 'Calculate how your monthly SIP investments grow over time with the power of compounding. See the impact of different amounts, durations, and expected returns.',
    icon: PiggyBank,
    color: '#00f0ff',
    gradient: 'linear-gradient(135deg, rgba(0,240,255,0.12), rgba(0,240,255,0.02))',
    borderColor: 'rgba(0,240,255,0.25)',
    tags: ['Monthly Investment', 'Compounding', 'Goal Planning'],
  },
  {
    id: 'lumpsum',
    title: 'Lumpsum Calculator',
    subtitle: 'One-Time Investment',
    description: 'Estimate the future value of a one-time lump sum investment. Understand how a single deposit grows over years at different expected return rates.',
    icon: BarChart3,
    color: '#bd00ff',
    gradient: 'linear-gradient(135deg, rgba(189,0,255,0.12), rgba(189,0,255,0.02))',
    borderColor: 'rgba(189,0,255,0.25)',
    tags: ['One-Time', 'Future Value', 'CAGR'],
  },
  {
    id: 'xirr',
    title: 'XIRR Calculator',
    subtitle: 'Extended Internal Rate of Return',
    description: 'Compute the true annualized return (XIRR) for investments with irregular cash flows — perfect for SIPs, RDs, or any recurring investment schedule.',
    icon: Percent,
    color: '#00ff9d',
    gradient: 'linear-gradient(135deg, rgba(0,255,157,0.12), rgba(0,255,157,0.02))',
    borderColor: 'rgba(0,255,157,0.25)',
    tags: ['IRR', 'Cash Flows', 'True Returns'],
  },
  {
    id: 'wealth-forecaster',
    title: 'Wealth Forecaster',
    subtitle: 'Long-Term Scenario Planning',
    description: 'Model your wealth across conservative, base, and optimistic scenarios. Includes real-return inflation tracking and expense/commission deduction modeling.',
    icon: LineChart,
    color: '#f5c842',
    gradient: 'linear-gradient(135deg, rgba(245,200,66,0.12), rgba(245,200,66,0.02))',
    borderColor: 'rgba(245,200,66,0.25)',
    tags: ['Inflation-Adjusted', 'Scenarios', 'Retirement'],
  },
];

const CalculatorsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="calcs-hub animate-fade-in">
      <div className="hub-header">
        <Calculator size={32} color="var(--accent-cyan)" />
        <div>
          <h1>Financial Calculators</h1>
          <p>Plan your investments, visualize growth, and make data-driven decisions</p>
        </div>
      </div>

      <div className="calcs-grid">
        {CALCULATORS.map((calc) => {
          const Icon = calc.icon;
          return (
            <div
              key={calc.id}
              className="calc-card"
              style={{ background: calc.gradient, borderColor: calc.borderColor }}
              onClick={() => navigate(`/calculators/${calc.id}`)}
            >
              <div className="card-top">
                <div className="card-icon" style={{ background: `rgba(${calc.color === '#00f0ff' ? '0,240,255' : calc.color === '#bd00ff' ? '189,0,255' : '0,255,157'},0.12)`, color: calc.color }}>
                  <Icon size={28} />
                </div>
                <ArrowRight size={20} className="card-arrow" />
              </div>

              <h2 className="card-title">{calc.title}</h2>
              <span className="card-subtitle">{calc.subtitle}</span>
              <p className="card-desc">{calc.description}</p>

              <div className="card-tags">
                {calc.tags.map((tag, i) => (
                  <span key={i} className="tag-chip" style={{ borderColor: calc.borderColor, color: calc.color }}>{tag}</span>
                ))}
              </div>

              <button className="card-btn" style={{ background: calc.color }}>
                Open Calculator <ArrowRight size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        .calcs-hub {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .hub-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .hub-header h1 {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0;
        }

        .hub-header p {
          color: var(--text-secondary);
          font-size: 0.92rem;
          margin: 0;
        }

        .calcs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.25rem;
        }

        .calc-card {
          border: 1px solid;
          border-radius: 16px;
          padding: 2rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .calc-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-arrow {
          color: var(--text-secondary);
          opacity: 0;
          transform: translateX(-8px);
          transition: all 0.3s;
        }

        .calc-card:hover .card-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        .card-title {
          font-size: 1.35rem;
          font-weight: 700;
          margin: 4px 0 0 0;
        }

        .card-subtitle {
          font-size: 0.78rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 500;
        }

        .card-desc {
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 4px 0;
        }

        .card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 4px;
        }

        .tag-chip {
          font-size: 0.68rem;
          padding: 3px 10px;
          border-radius: 20px;
          border: 1px solid;
          font-weight: 600;
          letter-spacing: 0.3px;
        }

        .card-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          border: none;
          border-radius: 10px;
          color: #0a0e17;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
        }

        .card-btn:hover {
          opacity: 0.9;
          transform: scale(1.02);
        }

        @media (max-width: 768px) {
          .calcs-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default CalculatorsPage;
