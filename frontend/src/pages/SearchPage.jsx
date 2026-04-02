import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, ArrowRight, Loader2, Building2 } from 'lucide-react';
import { API_BASE } from '../utils/format';

const POPULAR_STOCKS = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
  { symbol: 'INFY.NS', name: 'Infosys' },
  { symbol: 'ITC.NS', name: 'ITC Limited' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
  { symbol: 'SBIN.NS', name: 'State Bank of India' },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors' },
  { symbol: 'WIPRO.NS', name: 'Wipro' },
  { symbol: 'LT.NS', name: 'Larsen & Toubro' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance' },
];

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);
  const debounceTimer = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}&limit=15`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => doSearch(val), 300);
  };

  const handleNavigate = (symbol) => {
    navigate(`/stock/${encodeURIComponent(symbol)}`);
  };

  const getMarketBadge = (item) => {
    if (item.market === 'NSE') return <span className="mkt-badge nse">NSE</span>;
    if (item.market === 'BSE') return <span className="mkt-badge bse">BSE</span>;
    return <span className="mkt-badge global">{item.exchange || 'GLOBAL'}</span>;
  };

  return (
    <div className="search-page animate-fade-in">
      <div className="search-hero">
        <h1>Search Stocks</h1>
        <p>Discover & analyze any stock on NSE, BSE, or global exchanges</p>
      </div>

      <div className="search-bar-wrapper">
        <Search size={22} className="search-icon" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search by name or symbol... (e.g. Reliance, TCS, INFY)"
          className="search-input"
        />
        {loading && <Loader2 size={20} className="spin" />}
      </div>

      {/* Search Results */}
      {searched && (
        <div className="results-section">
          <h3 className="results-heading">
            {loading ? 'Searching...' : results.length > 0 ? `${results.length} results found` : 'No results found'}
          </h3>
          <div className="results-list">
            {results.map((item, i) => (
              <div key={i} className="result-card" onClick={() => handleNavigate(item.symbol)}>
                <div className="result-left">
                  <div className="result-icon">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <div className="result-symbol">{item.symbol}</div>
                    <div className="result-name">{item.name}</div>
                  </div>
                </div>
                <div className="result-right">
                  {getMarketBadge(item)}
                  <span className="type-tag">{item.type}</span>
                  <ArrowRight size={16} className="result-arrow" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popular stocks when no search yet */}
      {!searched && (
        <div className="popular-section">
          <h3 className="section-label">Popular Indian Stocks</h3>
          <div className="popular-grid">
            {POPULAR_STOCKS.map((stock) => (
              <div key={stock.symbol} className="popular-chip" onClick={() => handleNavigate(stock.symbol)}>
                <TrendingUp size={16} />
                <div>
                  <span className="chip-symbol">{stock.symbol.replace('.NS', '')}</span>
                  <span className="chip-name">{stock.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .search-page {
          max-width: 800px;
          margin: 0 auto;
        }

        .search-hero {
          text-align: center;
          margin-bottom: 2rem;
        }

        .search-hero h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #fff, var(--accent-cyan));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .search-hero p {
          color: var(--text-secondary);
        }

        .search-bar-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          margin-bottom: 2rem;
          transition: border-color 0.3s, box-shadow 0.3s;
        }

        .search-bar-wrapper:focus-within {
          border-color: var(--accent-cyan);
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.1);
        }

        .search-icon {
          color: var(--text-secondary);
          flex-shrink: 0;
        }

        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 1.05rem;
        }

        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.25);
        }

        .spin {
          animation: spin 1s linear infinite;
          color: var(--accent-cyan);
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* Results */
        .results-heading {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }

        .results-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .result-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 18px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .result-card:hover {
          border-color: rgba(0, 240, 255, 0.3);
          background: rgba(0, 240, 255, 0.03);
          transform: translateX(4px);
        }

        .result-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .result-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-cyan);
        }

        .result-symbol {
          font-weight: 700;
          font-size: 1rem;
          color: var(--text-primary);
        }

        .result-name {
          font-size: 0.82rem;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .result-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .mkt-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .mkt-badge.nse {
          background: rgba(0, 240, 255, 0.1);
          color: var(--accent-cyan);
        }

        .mkt-badge.bse {
          background: rgba(189, 0, 255, 0.1);
          color: var(--accent-purple);
        }

        .mkt-badge.global {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
        }

        .type-tag {
          font-size: 0.7rem;
          color: var(--text-secondary);
          text-transform: uppercase;
        }

        .result-arrow {
          color: var(--text-secondary);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .result-card:hover .result-arrow {
          opacity: 1;
        }

        /* Popular */
        .section-label {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }

        .popular-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 10px;
        }

        .popular-chip {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--accent-cyan);
        }

        .popular-chip:hover {
          border-color: rgba(0, 240, 255, 0.3);
          background: rgba(0, 240, 255, 0.03);
        }

        .chip-symbol {
          display: block;
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .chip-name {
          display: block;
          font-size: 0.78rem;
          color: var(--text-secondary);
          margin-top: 1px;
        }
      `}</style>
    </div>
  );
};

export default SearchPage;
