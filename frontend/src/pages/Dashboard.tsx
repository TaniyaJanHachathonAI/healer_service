import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';
import type { StatsResponse } from '../types';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiService.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
  }, []);

  const quickActions = [
    {
      icon: '🎭',
      title: 'Test Execution',
      description: 'Execute Playwright tests and view results with self-healing capabilities',
      path: '/test-execution',
    },
    {
      icon: '📝',
      title: 'Execution History',
      description: 'View all previous test automation reports and healing history',
      path: '/reports',
    },
  ];

  const features = [
    {
      title: 'Smart Selector Healing',
      description: 'Uses Python MatchingEngine and LLMs to identify the most robust selectors automatically.',
    },
    {
      title: 'Semantic DOM Analysis',
      description: 'Achieves 76% cost reduction by extracting only interactive elements for analysis.',
    },
    {
      title: 'Vision Model Integration',
      description: 'Combines DOM context with visual analysis of screenshots for enhanced healing accuracy.',
    },
    {
      title: 'Persistent History',
      description: 'Tracks every execution and healing attempt in a local SQLite database for continuous learning.',
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Test Automation Dashboard</h1>
        <p>Self-healing test automation with AI-powered selector healing</p>
      </div>

      {stats && stats.total_healings > 0 && (
        <div className="stats-overview" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
          <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '12px', color: '#718096', textTransform: 'uppercase', marginBottom: '8px' }}>Total Healings</span>
            <span style={{ fontSize: '24px', fontWeight: '700', color: '#3182ce' }}>{stats.total_healings}</span>
          </div>
          <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '12px', color: '#718096', textTransform: 'uppercase', marginBottom: '8px' }}>Success Rate</span>
            <span style={{ fontSize: '24px', fontWeight: '700', color: '#38a169' }}>{(stats.success_rate * 100).toFixed(1)}%</span>
          </div>
          <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '12px', color: '#718096', textTransform: 'uppercase', marginBottom: '8px' }}>Confidence Avg</span>
            <span style={{ fontSize: '24px', fontWeight: '700', color: '#805ad5' }}>{(stats.average_confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '12px', color: '#718096', textTransform: 'uppercase', marginBottom: '8px' }}>Recent Healings</span>
            <span style={{ fontSize: '24px', fontWeight: '700', color: '#d69e2e' }}>{stats.recent_healings_count}</span>
          </div>
        </div>
      )}

      <div className="quick-actions">
        {quickActions.map((action) => (
          <Link key={action.path} to={action.path} className="action-card">
            <div className="action-card-header">
              <span className="action-icon">{action.icon}</span>
              <h3 className="action-title">{action.title}</h3>
            </div>
            <p className="action-description">{action.description}</p>
          </Link>
        ))}
      </div>

      <div className="features-section">
        <h2>Key Features</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-item">
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
