import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Calculator, TrendingUp, LogOut, Search, Menu, X, Loader2, Building2, ArrowRight } from 'lucide-react';
import { API_BASE } from '../utils/format';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/market', icon: BarChart3, label: 'Market', exact: true },
  { to: '/calculators', icon: Calculator, label: 'Calculators', exact: false },
];

const Layout = ({ user, onLogout, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setShowDropdown(false);
    setQuery('');
  }, [location.pathname]);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}&limit=6`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setShowDropdown(true);
    
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => doSearch(val), 300);
  };

  const handleResultClick = (symbol) => {
    setShowDropdown(false);
    setQuery('');
    navigate(`/stock/${encodeURIComponent(symbol)}`);
  };

  const getMarketBadge = (item) => {
    if (item.market === 'NSE') return <span className="mkt-badge nse">NSE</span>;
    if (item.market === 'BSE') return <span className="mkt-badge bse">BSE</span>;
    return <span className="mkt-badge global">{item.exchange || 'GLOBAL'}</span>;
  };

  return (
    <div className="layout-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <TrendingUp size={26} color="var(--accent-cyan)" />
          <div>
            <span className="brand-name">StockVista</span>
            <span className="brand-tag">Indian Markets</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => {
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">{user?.charAt(0)?.toUpperCase() || 'U'}</div>
            <span className="username">{user}</span>
          </div>
          <button className="logout-btn" onClick={onLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <div className="main-area">
        {/* Top Bar */}
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          
          {/* Global Search Bar */}
          <div className="topbar-search-container" ref={searchRef}>
            <div className={`topbar-search ${showDropdown && query ? 'active-search' : ''}`}>
              <Search size={18} className="search-icon-global" />
              <input 
                type="text" 
                placeholder="Search stocks (e.g. RELIANCE, TCS, INFY)..." 
                value={query}
                onChange={handleSearchChange}
                onFocus={() => { if (query) setShowDropdown(true); }}
                className="global-search-input"
              />
              {isSearching && <Loader2 size={16} className="spin" />}
            </div>

            {/* Dropdown Results */}
            {showDropdown && query && (
              <div className="search-dropdown animate-fade-in">
                {isSearching ? (
                  <div className="search-loading">Searching markets...</div>
                ) : results.length > 0 ? (
                  <div className="search-results-list">
                    <div className="dropdown-heading">Stocks</div>
                    {results.map((item, i) => (
                      <div key={i} className="dropdown-item" onClick={() => handleResultClick(item.symbol)}>
                        <div className="dropdown-item-left">
                          <Building2 size={16} className="item-icon" />
                          <div className="item-details">
                            <span className="item-symbol">{item.symbol}</span>
                            <span className="item-name">{item.name}</span>
                          </div>
                        </div>
                        <div className="dropdown-item-right">
                          {getMarketBadge(item)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="search-empty">No results found for "{query}"</div>
                )}
              </div>
            )}
          </div>

          <div className="topbar-right">
            <span className="market-tag">🇮🇳 NSE / BSE</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          {children}
        </main>
      </div>

      <style>{`
        .layout-shell {
          display: flex;
          min-height: 100vh;
          background: var(--bg-primary);
        }

        /* ===== SIDEBAR ===== */
        .sidebar {
          width: 240px;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 200;
          transition: transform 0.3s ease;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 1.5rem 1.25rem;
          border-bottom: 1px solid var(--border-color);
        }

        .brand-name {
          display: block;
          font-size: 1.2rem;
          font-weight: 700;
          background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.2;
        }

        .brand-tag {
          display: block;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: var(--text-secondary);
        }

        .sidebar-nav {
          flex: 1;
          padding: 1rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 10px;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
        }

        .nav-item.active {
          background: rgba(0, 240, 255, 0.08);
          color: var(--accent-cyan);
          font-weight: 600;
        }

        .nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          width: 3px;
          height: 24px;
          background: var(--accent-cyan);
          border-radius: 0 4px 4px 0;
        }

        .sidebar-footer {
          padding: 1rem 1.25rem;
          border-top: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.85rem;
          color: white;
        }

        .username {
          font-size: 0.85rem;
          color: var(--text-primary);
          font-weight: 500;
        }

        .sidebar-footer .logout-btn {
          padding: 8px;
          border-radius: 8px;
          color: var(--text-secondary);
          transition: all 0.2s;
          background: none;
          border: none;
          cursor: pointer;
        }

        .sidebar-footer .logout-btn:hover {
          background: rgba(255, 68, 68, 0.15);
          color: #ff4444;
        }

        .sidebar-overlay {
          display: none;
        }

        /* ===== MAIN AREA ===== */
        .main-area {
          flex: 1;
          margin-left: 240px;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .topbar {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 24px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .menu-toggle {
          display: none;
          background: none;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          padding: 6px;
        }

        /* GLOBAL SEARCH */
        .topbar-search-container {
          position: relative;
          flex: 1;
          max-width: 520px;
        }

        .topbar-search {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          transition: all 0.2s;
        }

        .topbar-search:focus-within, .topbar-search.active-search {
          border-color: var(--accent-cyan);
          background: rgba(0, 240, 255, 0.02);
          box-shadow: 0 0 15px rgba(0, 240, 255, 0.1);
        }

        .search-icon-global {
          color: var(--text-secondary);
          flex-shrink: 0;
        }
        .topbar-search:focus-within .search-icon-global { color: var(--accent-cyan); }

        .global-search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 0.95rem;
          width: 100%;
        }

        .global-search-input::placeholder {
          color: rgba(255, 255, 255, 0.25);
        }

        .spin {
          animation: spin 1s linear infinite;
          color: var(--accent-cyan);
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* DROPDOWN */
        .search-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          overflow: hidden;
          z-index: 1000;
        }

        .search-loading, .search-empty {
          padding: 20px;
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .dropdown-heading {
          padding: 12px 16px 8px;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-secondary);
          background: rgba(0,0,0,0.2);
        }

        .dropdown-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.2s;
          border-bottom: 1px solid rgba(255,255,255,0.02);
        }
        .dropdown-item:last-child { border-bottom: none; }

        .dropdown-item:hover {
          background: rgba(0, 240, 255, 0.05);
        }

        .dropdown-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .item-icon { color: var(--accent-cyan); opacity: 0.8; }
        
        .item-details { display: flex; flex-direction: column; }
        .item-symbol { font-weight: 700; font-size: 0.9rem; color: var(--text-primary); }
        .item-name { font-size: 0.75rem; color: var(--text-secondary); }

        .mkt-badge {
          font-size: 0.6rem; font-weight: 700; padding: 3px 6px; border-radius: 4px;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .mkt-badge.nse { background: rgba(0, 240, 255, 0.1); color: var(--accent-cyan); }
        .mkt-badge.bse { background: rgba(189, 0, 255, 0.1); color: var(--accent-purple); }
        .mkt-badge.global { background: rgba(255, 255, 255, 0.05); color: var(--text-secondary); }

        .topbar-right {
          margin-left: auto;
        }

        .market-tag {
          font-size: 0.8rem;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.04);
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .page-content {
          flex: 1;
          padding: 24px;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
          }

          .sidebar.open {
            transform: translateX(0);
          }

          .sidebar-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 199;
          }

          .main-area {
            margin-left: 0;
          }

          .menu-toggle {
            display: block;
          }

          .page-content {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
