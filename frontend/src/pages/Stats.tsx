import { useState, useEffect } from 'react';
import apiService from '../services/api';
import type { StatsResponse } from '../types';
import './Stats.css';

const Stats = () => {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await apiService.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load statistics. Please try again.');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getMethodCount = (methods: Record<string, number>) => {
    return Object.entries(methods)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const totalMethodUsage = stats
    ? Object.values(stats.methods_used).reduce((sum, count) => sum + count, 0)
    : 0;

  return (
    <div className="stats">
      <div className="page-header">
        <h1>Statistics Dashboard</h1>
        <p>Performance metrics and usage statistics</p>
      </div>

      <button
        className="refresh-button"
        onClick={() => fetchStats(true)}
        disabled={refreshing || loading}
      >
        {refreshing ? '⏳ Refreshing...' : '🔄 Refresh Stats'}
      </button>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading statistics...</div>
      ) : stats ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <div>
                  <div className="stat-label">Total Healings</div>
                  <p className="stat-value">{stats.total_healings.toLocaleString()}</p>
                </div>
                <div className="stat-icon">🔢</div>
              </div>
              <div className="stat-description">
                Total number of selectors healed since the service started
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div>
                  <div className="stat-label">Success Rate</div>
                  <p className="stat-value">{(stats.success_rate * 100).toFixed(1)}%</p>
                </div>
                <div className="stat-icon">✅</div>
              </div>
              <div className="stat-description">
                Percentage of successful healing attempts
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${stats.success_rate * 100}%` }}
                />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div>
                  <div className="stat-label">Avg Confidence</div>
                  <p className="stat-value">{(stats.average_confidence * 100).toFixed(1)}%</p>
                </div>
                <div className="stat-icon">📊</div>
              </div>
              <div className="stat-description">
                Average confidence score across all healings
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${stats.average_confidence * 100}%` }}
                />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div>
                  <div className="stat-label">Avg Processing Time</div>
                  <p className="stat-value">{stats.average_processing_time_ms.toFixed(0)}ms</p>
                </div>
                <div className="stat-icon">⏱️</div>
              </div>
              <div className="stat-description">
                Average time to process a single healing request
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div>
                  <div className="stat-label">Total Feedback</div>
                  <p className="stat-value">{stats.total_feedback.toLocaleString()}</p>
                </div>
                <div className="stat-icon">💬</div>
              </div>
              <div className="stat-description">
                Total number of feedback submissions received
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div>
                  <div className="stat-label">Positive Feedback</div>
                  <p className="stat-value">
                    {stats.total_feedback > 0
                      ? ((stats.positive_feedback_count / stats.total_feedback) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
                <div className="stat-icon">👍</div>
              </div>
              <div className="stat-description">
                {stats.positive_feedback_count} out of {stats.total_feedback} feedback submissions
              </div>
              {stats.total_feedback > 0 && (
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(stats.positive_feedback_count / stats.total_feedback) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="charts-section">
            <div className="chart-card">
              <h2 className="chart-title">Methods Used</h2>
              {Object.keys(stats.methods_used).length > 0 ? (
                <div className="methods-list">
                  {getMethodCount(stats.methods_used).map((method) => (
                    <div key={method.name} className="method-item">
                      <span className="method-name">{method.name}</span>
                      <span className="method-count">
                        {method.count} ({totalMethodUsage > 0
                          ? ((method.count / totalMethodUsage) * 100).toFixed(1)
                          : 0}%)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-text">No method data available</div>
                </div>
              )}
            </div>

            <div className="chart-card">
              <h2 className="chart-title">Recent Activity</h2>
              {stats.recent_activity && stats.recent_activity.length > 0 ? (
                <div className="activity-list">
                  {stats.recent_activity.slice(-10).reverse().map((activity, index) => (
                    <div key={index} className="activity-item">
                      <span className="activity-date">{formatDate(activity.date)}</span>
                      <span className="activity-count">{activity.count} healings</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-text">No recent activity data</div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📈</div>
          <div className="empty-state-title">No Statistics Available</div>
          <div className="empty-state-text">
            Statistics will appear here once the service starts processing healings.
          </div>
        </div>
      )}
    </div>
  );
};

export default Stats;
