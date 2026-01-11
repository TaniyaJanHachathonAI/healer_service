import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../services/api';
import type { TestExecution } from '../types';
import './TestExecution.css';

const TestExecution = () => {
  const { executionId } = useParams<{ executionId: string }>();
  const navigate = useNavigate();
  const [testFiles, setTestFiles] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [execution, setExecution] = useState<TestExecution | null>(null);
  const [headless, setHeadless] = useState<boolean>(true);

  useEffect(() => {
    fetchAvailableTests();
    if (executionId) {
      fetchExecution(executionId);
    }
  }, [executionId]);

  const fetchExecution = async (id: string) => {
    try {
      setLoading(true);
      const data = await apiService.getExecution(id);
      setExecution(data);
    } catch (err: any) {
      console.error('Error fetching execution:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTests = async () => {
    try {
      setLoadingFiles(true);
      const data = await apiService.getAvailableTests();
      setTestFiles(data.testFiles);
      setError(null);
    } catch (err: any) {
      setError('Failed to load available tests.');
      console.error('Error fetching tests:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleExecute = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one test file');
      return;
    }

    setLoading(true);
    setError(null);
    setExecution(null);

    try {
      const result = await apiService.executeTests({ 
        testFiles: selectedFiles,
        headless: headless 
      });
      setExecution(result);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to execute tests.');
      console.error('Error executing tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFile = (file: string) => {
    setSelectedFiles(prev =>
      prev.includes(file) ? prev.filter(f => f !== file) : [...prev, file]
    );
  };

  const formatDuration = (start: string, end?: string) => {
    if (!end) return 'Running...';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    return `${(duration / 1000).toFixed(2)}s`;
  };

  return (
    <div className="test-execution">
      <div className="page-header">
        <h1>Test Execution</h1>
        <p>Execute Playwright tests and view results</p>
      </div>

      {loading && !execution && <div className="loading">Loading results...</div>}
      {error && <div className="error">{error}</div>}

      <div className="execution-card">
        <h2>Select Test Files</h2>
        {testFiles.length === 0 ? (
          <div className="empty-state">
            <p>No test files available. Make sure locator files exist in the automation framework.</p>
            <button className="btn btn-secondary" onClick={fetchAvailableTests}>
              🔄 Refresh
            </button>
          </div>
        ) : (
          <>
            <div className="test-files-list">
              {testFiles.map(file => (
                <label key={file} className="test-file-item">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file)}
                    onChange={() => toggleFile(file)}
                  />
                  <span>{file}</span>
                </label>
              ))}
            </div>
            <div className="execution-options">
              <h3>Execution Mode</h3>
              <div className="mode-options">
                <label className="mode-option">
                  <input
                    type="radio"
                    name="executionMode"
                    checked={headless}
                    onChange={() => setHeadless(true)}
                  />
                  <span>Headless Mode (Background)</span>
                </label>
                <label className="mode-option">
                  <input
                    type="radio"
                    name="executionMode"
                    checked={!headless}
                    onChange={() => setHeadless(false)}
                  />
                  <span>Headed Mode (Visible Browser)</span>
                </label>
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleExecute}
              disabled={loading || selectedFiles.length === 0}
            >
              {loading ? '⏳ Executing...' : '▶️ Execute Tests'}
            </button>
          </>
        )}
      </div>

      {execution && (
        <div className="execution-result-card">
          <div className="result-header">
            <h2>Execution Results</h2>
            <div className={`status-badge status-${execution.status}`}>
              {execution.status}
            </div>
          </div>

          <div className="execution-summary">
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
            <div className="summary-item">
              <span className="summary-label">Duration</span>
              <span className="summary-value">{formatDuration(execution.startTime, execution.endTime)}</span>
            </div>
          </div>

          <div className="test-results-list">
            {execution.results.map(result => (
              <div key={result.id} className={`test-result-item status-${result.status}`}>
                <div className="result-item-header">
                  <span className="result-name">{result.testName}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {result.status === 'healed' && (
                      <span className="healed-badge" style={{ fontSize: '10px', background: '#e3f2fd', color: '#1976d2', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                        HEALED
                      </span>
                    )}
                    <span className={`result-status status-${result.status}`}>
                      {result.status}
                    </span>
                  </div>
                </div>
                {result.status === 'healed' && result.failure?.selectedLocator && (
                  <div className="healed-locator-preview" style={{ fontSize: '11px', color: '#2f855a', background: '#f0fff4', padding: '8px', borderRadius: '4px', margin: '8px 0', border: '1px solid #c6f6d5' }}>
                    <strong>Healed with:</strong> <code style={{ wordBreak: 'break-all' }}>{result.failure.selectedLocator}</code>
                  </div>
                )}
                <div className="result-actions">
                  {result.failure && (
                    <button
                      className="btn btn-small btn-primary"
                      onClick={() => navigate(`/test-failures/${result.id}`)}
                    >
                      View Details
                    </button>
                  )}
                  <button
                    className="btn btn-small btn-secondary"
                    onClick={() => navigate(`/reports/${execution.id}`)}
                  >
                    📄 View Report
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="execution-actions" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '2px solid #e2e8f0' }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/reports/${execution.id}`)}
            >
              📊 View Full Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestExecution;
