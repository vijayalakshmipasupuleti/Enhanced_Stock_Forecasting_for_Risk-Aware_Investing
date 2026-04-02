import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Loader2, AlertCircle } from 'lucide-react';

const CandlestickChart = ({ ticker }) => {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('http://localhost:8081/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticker: ticker, period: '6mo' })
        });
        
        if (!res.ok) throw new Error('Failed to fetch candlestick data');
        
        const data = await res.json();
        
        const formattedData = data.data.map(item => ({
          x: new Date(item.date),
          y: [item.open, item.high, item.low, item.close]
        }));

        setSeries([{ data: formattedData }]);

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (ticker) {
      fetchHistory();
    }
  }, [ticker]);

  const options = {
    chart: {
      type: 'candlestick',
      height: 450,
      background: 'transparent',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
        }
      },
      animations: { enabled: false }
    },
    title: {
      text: `${ticker} - Live Technical Chart`,
      align: 'left',
      style: {
        color: 'var(--text-primary)',
        fontSize: '16px',
        fontWeight: '600'
      }
    },
    xaxis: {
      type: 'datetime',
      labels: {
        style: { colors: 'var(--text-secondary)' }
      },
      axisBorder: { color: 'rgba(255,255,255,0.1)' },
      axisTicks: { color: 'rgba(255,255,255,0.1)' }
    },
    yaxis: {
      tooltip: { enabled: true },
      labels: {
        style: { colors: 'var(--text-secondary)' },
        formatter: (value) => '₹' + value.toFixed(2)
      }
    },
    grid: {
      borderColor: 'rgba(255, 255, 255, 0.05)',
      strokeDashArray: 4,
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#26a69a',   // TradingView default green
          downward: '#ef5350'  // TradingView default red
        },
        wick: {
          useFillColor: true
        }
      }
    },
    tooltip: {
      theme: 'dark'
    }
  };

  return (
    <div className="candlestick-container glass-panel">
      {loading ? (
        <div className="loading-state">
          <Loader2 className="spinner" size={32} />
          <span>Loading Live Data for {ticker}...</span>
        </div>
      ) : error ? (
        <div className="error-state">
          <AlertCircle size={32} />
          <span>{error}</span>
        </div>
      ) : (
        <div id="chart">
          <ReactApexChart options={options} series={series} type="candlestick" height={450} />
        </div>
      )}

      <style jsx>{`
        .candlestick-container {
          padding: 1rem;
          margin-top: 1rem;
          min-height: 450px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .loading-state, .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          gap: 1rem;
          height: 300px;
        }

        .error-state {
          color: var(--accent-red);
        }

        .spinner {
          animation: spin 1s linear infinite;
          color: var(--accent-cyan);
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        /* Customize apexcharts internal styles to fit dark theme better if needed */
        :global(.apexcharts-tooltip) {
          background: #1e1e2d !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5) !important;
        }
        :global(.apexcharts-tooltip-title) {
          background: #151521 !important;
          border-bottom: 1px solid rgba(255,255,255,0.1) !important;
        }
        :global(.apexcharts-menu) {
          background: #1e1e2d !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: white !important;
        }
        :global(.apexcharts-theme-light .apexcharts-menu-item:hover) {
          background: rgba(255,255,255,0.1) !important;
        }
      `}</style>
    </div>
  );
};

export default CandlestickChart;
