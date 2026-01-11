import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import apiService from '../services/api';
import type { HealthResponse } from '../types';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const healthData = await apiService.getHealth();
        setHealth(healthData);
      } catch (error) {
        console.error('Health check failed:', error);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/test-execution', label: 'Test Execution', icon: '🎭' },
  ];

  const getHealthStatusColor = () => {
    if (!health) return '#888';
    switch (health.status) {
      case 'healthy': return '#4caf50';
      case 'degraded': return '#ff9800';
      case 'unhealthy': return '#f44336';
      default: return '#888';
    }
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Selector Healer</h1>
          <div className="health-indicator" title={health?.status || 'Unknown'}>
            <span
              className="health-dot"
              style={{ backgroundColor: getHealthStatusColor() }}
            />
            <span className="health-text">{health?.status || 'Checking...'}</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="system-info">
            <div className="info-item">
              <span>DB:</span>
              <span className={health?.database === 'connected' ? 'status-good' : 'status-bad'}>
                {health?.database || 'Unknown'}
              </span>
            </div>
            <div className="info-item">
              <span>LLM:</span>
              <span className={health?.llm_available ? 'status-good' : 'status-bad'}>
                {health?.llm_available ? 'Available' : 'Unavailable'}
              </span>
            </div>
          </div>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
