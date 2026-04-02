import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Activity, BarChart2, Globe, TrendingUp, Zap } from 'lucide-react';

const MarketDashboard = () => {
    const [marketVolume, setMarketVolume] = useState(0);
    const [activeStocks, setActiveStocks] = useState(0);
    const [trendData, setTrendData] = useState([]);
    const [marketStatus, setMarketStatus] = useState('LOADING');
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const fetchOverview = async () => {
            try {
                const overviewRes = await fetch('http://localhost:8081/market-overview?tickers=^GSPC,^IXIC,^DJI,^RUT');
                if (!overviewRes.ok) {
                    throw new Error('Failed to fetch market overview');
                }
                const overview = await overviewRes.json();

                const intradayRes = await fetch('http://localhost:8081/intraday?ticker=^GSPC&period=1d&interval=5m');
                if (!intradayRes.ok) {
                    throw new Error('Failed to fetch intraday data');
                }
                const intraday = await intradayRes.json();

                if (!isMounted) {
                    return;
                }
                setMarketVolume(overview.total_volume || 0);
                setActiveStocks(overview.tracked_symbols || 0);
                setMarketStatus(overview.market_status || 'UNKNOWN');
                setTrendData(intraday.points || []);
                setError(null);
            } catch {
                if (isMounted) {
                    setError('Unable to refresh Yahoo market feed');
                }
            }
        };

        fetchOverview();
        const interval = setInterval(fetchOverview, 15000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const formatVolume = (vol) => {
        return new Intl.NumberFormat('en-US').format(vol);
    };

    return (
        <div className="market-dashboard animate-fade-in">
            <div className="dashboard-header text-center">
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '1rem'}}>
                    <Globe size={32} color="var(--accent-blue)" />
                    <h1 className="text-gradient" style={{fontSize: '2.5rem', margin: 0}}>Global Market Overview</h1>
                </div>
                <p style={{color: 'var(--text-secondary)', fontSize: '1.1rem'}}>Live Yahoo market feed with FastAPI polling.</p>
                <div className="live-badge">Live Yahoo Data</div>
                {error && <div className="market-error">{error}</div>}
            </div>

            <div className="macro-metrics-grid">
                
                {/* Metric 1: Stocks Available */}
                <div className="macro-card glass-panel">
                    <div className="macro-icon">
                        <BarChart2 size={24} color="#00f0ff" />
                    </div>
                    <div className="macro-content">
                        <h3>Stocks Available in Market</h3>
                        <div className="macro-value system-font">{activeStocks.toLocaleString()}</div>
                        <p className="macro-sub">Tracked benchmark instruments</p>
                    </div>
                </div>

                {/* Metric 2: Live Volume Sold */}
                <div className="macro-card glass-panel pulse-glow">
                    <div className="macro-icon">
                        <Zap size={24} color="#f50057" />
                    </div>
                    <div className="macro-content">
                        <h3>Shares Sold Today (Live)</h3>
                        <div className="macro-value dynamic-tick system-font flex-center">
                            {formatVolume(marketVolume)} <TrendingUp size={24} color="#f50057" style={{marginLeft: '10px'}}/>
                        </div>
                        <p className="macro-sub">Aggregated volume from tracked indices</p>
                    </div>
                </div>

                {/* Metric 3: Market Status */}
                <div className="macro-card glass-panel">
                    <div className="macro-icon">
                        <Activity size={24} color="#00e676" />
                    </div>
                    <div className="macro-content">
                        <h3>Market Status</h3>
                        <div className="macro-value status-open">
                            <span className="live-dot"></span> {marketStatus}
                        </div>
                        <p className="macro-sub">Trading session active</p>
                    </div>
                </div>

            </div>

            <div className="market-trend-section glass-panel">
                <div className="trend-header">
                    <h2>Market Benchmark Index (Live)</h2>
                    <span className="live-pulse-badge">YAHOO FASTAPI</span>
                </div>
                
                <div style={{ width: '100%', height: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorIndex" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis 
                                dataKey="time" 
                                stroke="var(--text-secondary)" 
                                tick={{fontSize: 12}}
                                minTickGap={30}
                            />
                            <YAxis 
                                domain={['auto', 'auto']}
                                stroke="var(--text-secondary)" 
                                tick={{fontSize: 12}} 
                                tickFormatter={(val) => val.toFixed(0)}
                            />
                            <RechartsTooltip 
                                contentStyle={{background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff'}}
                                itemStyle={{color: 'var(--accent-cyan)'}}
                                formatter={(value) => [value.toFixed(2), "Index Level"]}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="var(--accent-blue)" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorIndex)" 
                                isAnimationActive={false} // Disable animation for live ticking performance
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <style jsx>{`
                .market-dashboard {
                    display: flex;
                    flex-direction: column;
                    gap: 3rem;
                }

                .dashboard-header {
                    margin-bottom: 1rem;
                    position: relative;
                }

                .live-badge {
                    display: inline-flex;
                    margin-top: 0.9rem;
                    padding: 6px 12px;
                    border-radius: 999px;
                    background: rgba(0, 255, 157, 0.12);
                    border: 1px solid rgba(0, 255, 157, 0.25);
                    color: #7cf7c8;
                    font-size: 0.8rem;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                }

                .market-error {
                    margin-top: 0.75rem;
                    color: #fca5a5;
                    font-size: 0.85rem;
                }

                .macro-metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 2rem;
                }

                .macro-card {
                    display: flex;
                    align-items: flex-start;
                    gap: 1.5rem;
                    padding: 2rem;
                    border-radius: var(--radius-lg);
                }

                .macro-icon {
                    background: rgba(255,255,255,0.05);
                    padding: 16px;
                    border-radius: 16px;
                    border: 1px solid rgba(255,255,255,0.05);
                }

                .macro-content h3 {
                    font-size: 1rem;
                    color: var(--text-secondary);
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .macro-value {
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 0.5rem;
                }

                .macro-sub {
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                }

                .dynamic-tick {
                    color: #fff;
                    text-shadow: 0 0 20px rgba(245, 0, 87, 0.5);
                }

                .status-open {
                    color: #00e676;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .live-dot {
                    width: 12px;
                    height: 12px;
                    background-color: #00e676;
                    border-radius: 50%;
                    box-shadow: 0 0 10px #00e676;
                    animation: blink 1.5s infinite alternate;
                }

                @keyframes blink {
                    0% { opacity: 0.4; transform: scale(0.8); }
                    100% { opacity: 1; transform: scale(1.2); }
                }

                .pulse-glow {
                    position: relative;
                }
                .pulse-glow::after {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    border-radius: var(--radius-lg);
                    border: 1px solid rgba(245, 0, 87, 0.3);
                    pointer-events: none;
                    animation: border-pulse 2s infinite;
                }

                @keyframes border-pulse {
                    0% { box-shadow: 0 0 0 0 rgba(245, 0, 87, 0.1); }
                    70% { box-shadow: 0 0 0 10px rgba(245, 0, 87, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(245, 0, 87, 0); }
                }

                .market-trend-section {
                    padding: 2rem;
                    border-radius: var(--radius-lg);
                }

                .trend-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                .trend-header h2 {
                    font-size: 1.5rem;
                    color: white;
                }

                .live-pulse-badge {
                    background: rgba(245, 0, 87, 0.1);
                    color: #f50057;
                    padding: 4px 12px;
                    border-radius: 20px;
                    border: 1px solid rgba(245, 0, 87, 0.3);
                    font-size: 0.8rem;
                    font-weight: 700;
                    letter-spacing: 1px;
                }
            `}</style>
        </div>
    );
};

export default MarketDashboard;
