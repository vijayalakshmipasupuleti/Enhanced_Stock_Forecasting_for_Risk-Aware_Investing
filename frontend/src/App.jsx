import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MarketPage from './pages/MarketPage';
import CalculatorsPage from './pages/CalculatorsPage';
import SipPage from './pages/SipPage';
import LumpsumPage from './pages/LumpsumPage';
import XirrPage from './pages/XirrPage';
import WealthProjectionPage from './pages/WealthProjectionPage';
import StockDetailPage from './pages/StockDetailPage';

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (username) => setUser(username);

  const handleLogout = () => setUser(null);

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<DashboardPage user={user} />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/calculators" element={<CalculatorsPage />} />
          <Route path="/calculators/sip" element={<SipPage />} />
          <Route path="/calculators/lumpsum" element={<LumpsumPage />} />
          <Route path="/calculators/xirr" element={<XirrPage />} />
          <Route path="/calculators/wealth-forecaster" element={<WealthProjectionPage />} />
          <Route path="/stock/:symbol" element={<StockDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
