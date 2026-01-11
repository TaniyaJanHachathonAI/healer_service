import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiService from '../services/api';
import type { TestExecution, FailurePayload } from '../types';
import './Reports.css';

const Reports = () => {
  const { executionId } = useParams<{ executionId?: string }>();
  const [execution, setExecution] = useState<TestExecution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFailure, setSelectedFailure] = useState<string | null>(null);

  useEffect(() => {
    if (executionId) {
      fetchExecution();
    } else {
      setError('Execution ID is required');
      setLoading(false);
    }
  }, [executionId]);

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

  if (error || !execution) {
    return (
      <div className="reports">
        <div className="error">{error || 'Report not found'}</div>
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
          {execution.results.map((result, index) => (
            <div key={result.id} className={`result-card status-${result.status}`}>
              <div className="result-card-header">
                <div className="result-number">#{index + 1}</div>
                <div className="result-info">
                  <h3 className="result-title">{result.testName}</h3>
                  <div className="result-meta">
                    <span>Status: <strong className={`status-${result.status}`}>{result.status}</strong></span>
                    <span>Duration: {result.duration ? `${(result.duration / 1000).toFixed(2)}s` : 'N/A'}</span>
                    <span>Time: {formatDate(result.startTime)}</span>
                  </div>
                </div>
                <span className={`result-status-badge status-${result.status}`}>
                  {result.status.toUpperCase()}
                </span>
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
                    </div>
                  </div>

                  <div className="screenshot-section">
                    <h4>Screenshot</h4>
                    <div className="screenshot-placeholder">
                      <div className="placeholder-content">
                        <span style={{ fontSize: '48px', opacity: 0.3 }}>📸</span>
                        <p>Screenshot placeholder</p>
                        <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '8px' }}>
                          Screenshot will be available when API is integrated
                        </p>
                      </div>
                    </div>
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
                <div className="healed-indicator">
                  <span className="healed-icon">🔧</span>
                  <span>Test healed and passed</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
