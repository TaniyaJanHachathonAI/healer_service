import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiService from '../services/api';
import type { TestExecution } from '../types';
import './Reports.css';

const Reports = () => {
  const { executionId } = useParams<{ executionId?: string }>();
  const [execution, setExecution] = useState<TestExecution | null>(null);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [healingHistory, setHealingHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'executions' | 'healing'>('executions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});

  const AUTOMATION_API_URL = (import.meta as any).env?.VITE_AUTOMATION_API_URL || 'http://127.0.0.1:3001';

  const toggleExpand = (id: string) => {
    setExpandedResults(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (executionId) {
      fetchExecution();
    } else {
      if (activeTab === 'executions') {
        fetchAllReports();
      } else {
        fetchHealingHistory();
      }
    }
  }, [executionId, activeTab]);

  const fetchAllReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getAllReports();
      setReportsList(data);
    } catch (err: any) {
      setError('Failed to load reports history');
    } finally {
      setLoading(false);
    }
  };

  const fetchHealingHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getHistory();
      setHealingHistory(data.items || []);
    } catch (err: any) {
      setError('Failed to load healing history from database');
    } finally {
      setLoading(false);
    }
  };

  const fetchExecution = async () => {
    if (!executionId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await apiService.getExecution(executionId);
      setExecution(data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load execution report');
      console.error('Error fetching execution:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (start: string, end?: string) => {
    if (!end) return 'Running...';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const downloadReport = () => {
    if (!execution) return;

    const reportData = {
      execution: {
        id: execution.id,
        status: execution.status,
        startTime: execution.startTime,
        endTime: execution.endTime,
        totalTests: execution.totalTests,
        passedTests: execution.passedTests,
        failedTests: execution.failedTests,
        healedTests: execution.healedTests,
      },
      results: execution.results.map(result => ({
        id: result.id,
        testName: result.testName,
        status: result.status,
        startTime: result.startTime,
        endTime: result.endTime,
        duration: result.duration,
        failure: result.failure ? {
          error: result.failure.error,
          payload: {
            failed_selector: result.failure.payload.failed_selector,
            use_of_selector: result.failure.payload.use_of_selector,
            page_url: result.failure.payload.page_url,
            selector_type: result.failure.payload.selector_type,
            timestamp: result.failure.payload.timestamp,
            semantic_dom_elements: result.failure.payload.semantic_dom?.total_elements || 0,
          },
        } : null,
      })),
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-report-${execution.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="reports">
        <div className="loading">Loading report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reports">
        <div className="error">{error}</div>
        <button onClick={() => executionId ? fetchExecution() : fetchAllReports()} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (!executionId) {
    return (
      <div className="reports">
        <div className="report-header">
          <h1>Execution & Healing History</h1>
          <p>View all previous test runs and AI healing records</p>
        </div>

        <div className="reports-tabs" style={{ display: 'flex', gap: '20px', marginBottom: '32px', borderBottom: '2px solid #e2e8f0' }}>
          <button 
            onClick={() => setActiveTab('executions')}
            style={{ 
              padding: '12px 24px', 
              border: 'none', 
              background: 'none', 
              fontSize: '16px', 
              fontWeight: '600', 
              color: activeTab === 'executions' ? '#3182ce' : '#718096',
              borderBottom: activeTab === 'executions' ? '3px solid #3182ce' : '3px solid transparent',
              cursor: 'pointer',
              marginBottom: '-2px'
            }}
          >
            📊 Test Executions
          </button>
          <button 
            onClick={() => setActiveTab('healing')}
            style={{ 
              padding: '12px 24px', 
              border: 'none', 
              background: 'none', 
              fontSize: '16px', 
              fontWeight: '600', 
              color: activeTab === 'healing' ? '#3182ce' : '#718096',
              borderBottom: activeTab === 'healing' ? '3px solid #3182ce' : '3px solid transparent',
              cursor: 'pointer',
              marginBottom: '-2px'
            }}
          >
            🔧 Healing Database
          </button>
        </div>

        <div className="reports-list-view">
          {activeTab === 'executions' ? (
            reportsList.length === 0 ? (
              <div className="empty-state">
                <p>No execution reports found yet. Start by running some tests!</p>
                <Link to="/test-execution" className="btn btn-primary">
                  Run Tests
                </Link>
              </div>
            ) : (
              <div className="history-grid">
                {reportsList.map((report) => (
                  <Link key={report.id} to={`/reports/${report.id}`} className="history-card">
                    <div className="history-card-header">
                      <span className={`status-badge status-${report.status}`}>
                        {report.status}
                      </span>
                      <span className="history-date">{formatDate(report.startTime)}</span>
                    </div>
                    <div className="history-stats">
                      <div className="stat">
                        <span className="stat-label">Total</span>
                        <span className="stat-value">{report.totalTests}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label passed">Passed</span>
                        <span className="stat-value">{report.passedTests}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label failed">Failed</span>
                        <span className="stat-value">{report.failedTests}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label healed">Healed</span>
                        <span className="stat-value">{report.healedTests}</span>
                      </div>
                    </div>
                    <div className="history-card-footer">
                      <span>View Full Report →</span>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            healingHistory.length === 0 ? (
              <div className="empty-state">
                <p>No selector healing records found in the database.</p>
              </div>
            ) : (
              <div className="healing-history-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {healingHistory.map((item) => (
                  <div key={item.id} className="healing-history-item" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #3182ce' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontWeight: '700', color: '#2d3748' }}>{formatDate(item.timestamp)}</span>
                      <span style={{ background: '#ebf8ff', color: '#2b6cb0', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                        Confidence: {(item.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '11px', color: '#718096', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Original (Broken)</span>
                        <code style={{ fontSize: '12px', background: '#fff5f5', color: '#c53030', padding: '4px 8px', borderRadius: '4px', wordBreak: 'break-all' }}>{item.old_selector}</code>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '11px', color: '#718096', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Healed (Success)</span>
                        <code style={{ fontSize: '12px', background: '#f0fff4', color: '#22543d', padding: '4px 8px', borderRadius: '4px', wordBreak: 'break-all' }}>{item.new_selector}</code>
                      </div>
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '13px', color: '#4a5568' }}>
                      <strong>URL:</strong> <a href={item.url} target="_blank" rel="noreferrer" style={{ color: '#3182ce' }}>{item.url}</a>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  // Final guard to satisfy TypeScript that 'execution' is not null
  if (!execution) {
    return (
      <div className="reports">
        <div className="error">Report details could not be loaded</div>
        <Link to="/test-execution" className="btn btn-secondary">
          ← Back to Test Execution
        </Link>
      </div>
    );
  }

  return (
    <div className="reports">
      <div className="report-header">
        <div className="header-content">
          <h1>Test Execution Report</h1>
          <p>Comprehensive analysis report with screenshots and failure details</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={downloadReport}>
            📥 Download Report
          </button>
          <Link to="/test-execution" className="btn btn-secondary">
            ← Back to Test Execution
          </Link>
        </div>
      </div>

      <div className="report-summary">
        <div className="summary-card">
          <div className="summary-header">
            <h2>Execution Summary</h2>
            <span className={`status-badge status-${execution.status}`}>
              {execution.status}
            </span>
          </div>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Execution ID</span>
              <span className="summary-value">{execution.id}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Start Time</span>
              <span className="summary-value">{formatDate(execution.startTime)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">End Time</span>
              <span className="summary-value">
                {execution.endTime ? formatDate(execution.endTime) : 'Running...'}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Duration</span>
              <span className="summary-value">
                {formatDuration(execution.startTime, execution.endTime)}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Tests</span>
              <span className="summary-value">{execution.totalTests}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Passed</span>
              <span className="summary-value passed">{execution.passedTests}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Failed</span>
              <span className="summary-value failed">{execution.failedTests}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Healed</span>
              <span className="summary-value healed">{execution.healedTests}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="report-results">
        <h2>Test Results Analysis</h2>
        <div className="results-list">
          {execution.results.map((result, index) => {
            const isExpanded = expandedResults[result.id];
            
            return (
              <div key={result.id} className={`result-card status-${result.status} ${isExpanded ? 'expanded' : 'collapsed'}`}>
                <div className="result-card-header" onClick={() => toggleExpand(result.id)} style={{ cursor: 'pointer' }}>
                  <div className="result-number">#{index + 1}</div>
                  <div className="result-info">
                    <h3 className="result-title">{result.testName}</h3>
                    <div className="result-meta">
                      <span>Status: <strong className={`status-${result.status}`}>{result.status}</strong></span>
                      <span>Duration: {result.duration ? `${(result.duration / 1000).toFixed(2)}s` : 'N/A'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={`result-status-badge status-${result.status}`}>
                      {result.status.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '20px', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                      ▼
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="expanded-content" style={{ animation: 'slideDown 0.3s ease-out' }}>
                    <div className="result-full-meta" style={{ display: 'flex', gap: '20px', marginBottom: '20px', fontSize: '13px', color: '#718096', padding: '12px', background: '#f7fafc', borderRadius: '8px' }}>
                      <span>Started: {formatDate(result.startTime)}</span>
                      {result.endTime && <span>Ended: {formatDate(result.endTime)}</span>}
                    </div>

                    {result.failure && (
                      <div className="failure-analysis">
                        <div className="failure-details">
                          <h4>Failure Analysis</h4>
                          <div className="failure-info">
                            <div className="info-row">
                              <span className="info-label">Error:</span>
                              <span className="info-value error-text">{result.failure.error}</span>
                            </div>
                            <div className="info-row">
                              <span className="info-label">Failed Selector:</span>
                              <span className="info-value selector-text">
                                {result.failure.payload.failed_selector}
                              </span>
                            </div>
                            <div className="info-row">
                              <span className="info-label">Use Case:</span>
                              <span className="info-value">{result.failure.payload.use_of_selector}</span>
                            </div>
                            <div className="info-row">
                              <span className="info-label">Page URL:</span>
                              <span className="info-value">
                                <a href={result.failure.payload.page_url} target="_blank" rel="noopener noreferrer">
                                  {result.failure.payload.page_url}
                                </a>
                              </span>
                            </div>
                            <div className="info-row">
                              <span className="info-label">Selector Type:</span>
                              <span className="info-value">{result.failure.payload.selector_type}</span>
                            </div>
                            <div className="info-row">
                              <span className="info-label">Timestamp:</span>
                              <span className="info-value">
                                {result.failure.payload.timestamp ? formatDate(result.failure.payload.timestamp) : 'N/A'}
                              </span>
                            </div>
                            <div className="info-row analysis-details" style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '16px', marginTop: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                              <h5 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#4a5568' }}>🔍 Deep Analysis Metadata (Passed to Healer API)</h5>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                <div>
                                  <span style={{ display: 'block', fontSize: '11px', color: '#718096', fontWeight: '600', textTransform: 'uppercase' }}>Semantic DOM Elements</span>
                                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{result.failure.payload.semantic_dom?.total_elements || 0} interactive elements</span>
                                </div>
                                <div>
                                  <span style={{ display: 'block', fontSize: '11px', color: '#718096', fontWeight: '600', textTransform: 'uppercase' }}>Full Coverage Mode</span>
                                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{result.failure.payload.full_coverage ? 'ENABLED (76% reduction)' : 'DISABLED'}</span>
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                  <span style={{ display: 'block', fontSize: '11px', color: '#718096', fontWeight: '600', textTransform: 'uppercase' }}>Use Case Analysis</span>
                                  <span style={{ fontSize: '14px', fontStyle: 'italic' }}>"{result.failure.payload.use_of_selector}"</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="screenshot-section">
                          <h4>Execution Screenshot</h4>
                          {result.screenshot ? (
                            <div className="screenshot-container" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                              <img 
                                src={`${AUTOMATION_API_URL}${result.screenshot}`} 
                                alt={`Failure in ${result.testName}`}
                                style={{ width: '100%', display: 'block' }}
                              />
                            </div>
                          ) : (
                            <div className="screenshot-placeholder">
                              <div className="placeholder-content">
                                <span style={{ fontSize: '48px', opacity: 0.3 }}>📸</span>
                                <p>No screenshot available</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="failure-actions">
                          <Link 
                            to={`/test-failures/${result.id}`}
                            className="btn btn-primary btn-small"
                          >
                            🔧 Heal Selector
                          </Link>
                        </div>
                      </div>
                    )}

                    {result.status === 'passed' && (
                      <div className="success-indicator">
                        <span className="success-icon">✅</span>
                        <span>Test passed successfully</span>
                      </div>
                    )}

                    {result.status === 'healed' && (
                      <div className="healed-indicator" style={{ background: '#f0fff4', border: '1px solid #c6f6d5', padding: '16px', borderRadius: '8px', marginTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: '#2f855a' }}>
                          <span className="healed-icon" style={{ fontSize: '20px' }}>✨</span>
                          <span style={{ fontWeight: '700' }}>Self-Healed Successfully</span>
                        </div>
                        <div className="healing-details" style={{ fontSize: '13px' }}>
                          <div style={{ marginBottom: '8px' }}>
                            <span style={{ color: '#718096', fontWeight: '600', display: 'block', textTransform: 'uppercase', fontSize: '11px' }}>Original Broken Selector</span>
                            <code style={{ background: '#fff5f5', color: '#c53030', padding: '4px 8px', borderRadius: '4px', display: 'block', marginTop: '4px', wordBreak: 'break-all' }}>
                              {result.failure?.payload.failed_selector}
                            </code>
                          </div>
                          <div>
                            <span style={{ color: '#718096', fontWeight: '600', display: 'block', textTransform: 'uppercase', fontSize: '11px' }}>Newly Applied Selector</span>
                            <code style={{ background: '#f0fff4', color: '#22543d', padding: '4px 8px', borderRadius: '4px', display: 'block', marginTop: '4px', wordBreak: 'break-all' }}>
                              {result.failure?.selectedLocator}
                            </code>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Reports;
