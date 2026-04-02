import React from 'react';
import { Calculator } from 'lucide-react';
import WealthProjection from '../components/WealthProjection';
import LumpsumCalculator from '../components/LumpsumCalculator';
import XirrCalculator from '../components/XirrCalculator';

const CalculatorsPage = () => {
  return (
    <div className="calcs-page animate-fade-in">
      <div className="calcs-hero">
        <Calculator size={28} color="var(--accent-cyan)" />
        <div>
          <h1>Financial Calculators</h1>
          <p>Wealth projection, lumpsum returns & XIRR for smart portfolio planning</p>
        </div>
      </div>

      <div className="calcs-stack">
        <WealthProjection principal={1000000} />
        <LumpsumCalculator />
        <XirrCalculator />
      </div>

      <style>{`
        .calcs-page {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .calcs-hero {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .calcs-hero h1 {
          font-size: 1.6rem;
          font-weight: 700;
          margin: 0;
        }

        .calcs-hero p {
          color: var(--text-secondary);
          font-size: 0.88rem;
          margin: 0;
        }

        .calcs-stack {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
      `}</style>
    </div>
  );
};

export default CalculatorsPage;
