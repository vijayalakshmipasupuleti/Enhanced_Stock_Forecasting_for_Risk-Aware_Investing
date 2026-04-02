import React, { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, Globe } from 'lucide-react';

const TOP_MARKET_STOCKS = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.' },
    { symbol: 'V', name: 'Visa Inc.' },
    { symbol: 'UNH', name: 'UnitedHealth Group' },
    { symbol: '^GSPC', name: 'S&P 500 Index' }
];

const GlobalSearch = ({ onSearch }) => {
    const [query, setQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    // Close suggestions on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim().toUpperCase());
            setShowSuggestions(false);
        } else {
            // Empty search goes to market overview
            onSearch('');
            setShowSuggestions(false);
        }
    };

    const handleSelectOption = (symbol) => {
        setQuery(symbol);
        onSearch(symbol);
        setShowSuggestions(false);
    };

    const filteredOptions = TOP_MARKET_STOCKS.filter(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase()) || 
        stock.name.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="global-search-container animate-fade-in" ref={wrapperRef}>
            <div className="search-header">
                <h2>Explore the Market</h2>
                <p>Search over thousands of real-time stocks or view the comprehensive market dashboard.</p>
            </div>
            
            <form className="search-box glass-panel" onSubmit={handleSearch}>
                <Search size={24} className="search-icon" />
                <input 
                    type="text" 
                    placeholder="Search stocks (e.g., AAPL) or hit 'Enter' for Market Overview..." 
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                />
                <button type="submit" className="explore-btn">
                    {query.trim() ? "Analyze" : <><Globe size={18} /> Market Overview</>}
                </button>
            </form>

            {showSuggestions && (query.trim() || true) && (
                <div className="suggestions-dropdown glass-panel">
                    <div className="suggestions-header">Top Market Stocks</div>
                    <ul className="suggestions-list">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.slice(0, 6).map((stock) => (
                                <li key={stock.symbol} onClick={() => handleSelectOption(stock.symbol)}>
                                    <div className="stock-info">
                                        <span className="stock-symbol">{stock.symbol}</span>
                                        <span className="stock-name">{stock.name}</span>
                                    </div>
                                    <TrendingUp size={16} color="var(--accent-cyan)" />
                                </li>
                            ))
                        ) : (
                            <li className="no-results">No top stocks exactly matching "{query}". Hit enter to try custom analysis.</li>
                        )}
                    </ul>
                </div>
            )}

            <style jsx>{`
                .global-search-container {
                    margin-bottom: 3rem;
                    position: relative;
                    z-index: 50;
                }

                .search-header {
                    margin-bottom: 1.5rem;
                    text-align: center;
                }

                .search-header h2 {
                    font-size: 2rem;
                    color: white;
                    margin-bottom: 0.5rem;
                    background: linear-gradient(90deg, #fff, var(--accent-cyan));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .search-header p {
                    color: var(--text-secondary);
                    font-size: 1rem;
                }

                .search-box {
                    display: flex;
                    align-items: center;
                    padding: 0.5rem 0.5rem 0.5rem 1.5rem;
                    border-radius: 30px;
                    transition: all 0.3s ease;
                    border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(0,0,0,0.3);
                }

                .search-box:focus-within {
                    border-color: var(--accent-cyan);
                    box-shadow: 0 0 20px rgba(0, 240, 255, 0.15);
                    background: rgba(0,0,0,0.5);
                }

                .search-icon {
                    color: var(--text-secondary);
                    margin-right: 1rem;
                }

                .search-box input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: white;
                    font-size: 1.1rem;
                    outline: none;
                    padding: 10px 0;
                }

                .search-box input::placeholder {
                    color: rgba(255,255,255,0.3);
                }

                .explore-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 24px;
                    border-radius: 20px;
                    background: linear-gradient(135deg, var(--accent-cyan), var(--accent-blue));
                    color: white;
                    font-weight: 600;
                    border: none;
                    cursor: pointer;
                    transition: opacity 0.2s, transform 0.1s;
                }

                .explore-btn:hover {
                    opacity: 0.9;
                }

                .explore-btn:active {
                    transform: scale(0.98);
                }

                .suggestions-dropdown {
                    position: absolute;
                    top: calc(100% + 10px);
                    left: 0;
                    right: 0;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                }

                .suggestions-header {
                    padding: 1rem 1.5rem;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: var(--text-secondary);
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    background: rgba(0,0,0,0.2);
                }

                .suggestions-list {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }

                .suggestions-list li {
                    padding: 1rem 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    transition: background 0.2s;
                    border-bottom: 1px solid rgba(255,255,255,0.02);
                }

                .suggestions-list li:last-child {
                    border-bottom: none;
                }

                .suggestions-list li:hover {
                    background: rgba(0, 240, 255, 0.05);
                }

                .stock-info {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .stock-symbol {
                    font-weight: 700;
                    font-size: 1.1rem;
                    color: white;
                    min-width: 60px;
                }

                .stock-name {
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                }

                .no-results {
                    color: var(--text-secondary);
                    padding: 1.5rem;
                    text-align: center;
                    font-style: italic;
                }
            `}</style>
        </div>
    );
};

export default GlobalSearch;
