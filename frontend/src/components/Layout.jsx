import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Calculator, TrendingUp, LogOut, Search, Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/market', icon: BarChart3, label: 'Market' },
  { to: '/calculators', icon: Calculator, label: 'Calculators' },
];

const Layout = ({ user, onLogout, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="layout-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <TrendingUp size={26} color="var(--accent-cyan)" />
          <div>
            <span className="brand-name">StockVista</span>
            <span className="brand-tag">Indian Markets</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
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
          <div className="topbar-search" onClick={() => navigate('/search')}>
            <Search size={18} />
            <span>Search stocks (e.g. RELIANCE, TCS, INFY)...</span>
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

        .topbar-search {
          flex: 1;
          max-width: 520px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .topbar-search:hover {
          border-color: rgba(0, 240, 255, 0.3);
          background: rgba(255, 255, 255, 0.06);
        }

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
