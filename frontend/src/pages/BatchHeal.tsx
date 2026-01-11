import { useState } from 'react';
import apiService from '../services/api';
import type { BatchHealRequest, BatchHealResponse } from '../types';
import './BatchHeal.css';

const BatchHeal = () => {
  const [selectors, setSelectors] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [selectorType, setSelectorType] = useState<'css' | 'xpath'>('css');
  const [result, setResult] = useState<BatchHealResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setResult(null);

    const selectorList = selectors
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (selectorList.length === 0) {
      setError('Please enter at least one selector');
      setLoading(false);
      return;
    }

    if (selectorList.length > 10) {
      setError('Maximum 10 selectors allowed per batch');
      setLoading(false);
      return;
    }

    try {
      const request: BatchHealRequest = {
        selectors: selectorList,
        selector_type: selectorType,
      };
      if (url) {
        request.url = url;
      }

      const response = await apiService.healBatch(request);
      setResult(response);
      setSuccess(`Successfully healed ${response.results.length} selector(s)!`);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to heal selectors. Please check your input and try again.');
      console.error('Error healing selectors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleReset = () => {
    setSelectors('');
    setUrl('');
    setSelectorType('css');
    setResult(null);
    setError(null);
    setSuccess(null);
  };

  const calculateAverage = (arr: number[]) => {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  };

  return (
    <div className="batch-heal">
      <div className="page-header">
        <h1>Batch Selector Healing</h1>
        <p>Heal up to 10 selectors at once for efficient bulk processing</p>
      </div>

      {error && <div className="error">{error}</div>}
      {success && !result && <div className="success">{success}</div>}

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-group">
          <label className="form-label">
            Selectors <span style={{ color: '#e53e3e' }}>*</span>
          </label>
          <textarea
            className="form-textarea"
            value={selectors}
            onChange={(e) => setSelectors(e.target.value)}
            placeholder="Enter one selector per line (max 10)&#10;Example:&#10;#submit-button&#10;.login-form&#10;//button[@id='submit']"
            required
            rows={8}
          />
          <div className="selector-hint">
            {selectors.split('\n').filter(s => s.trim().length > 0).length} / 10 selectors
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Selector Type
          </label>
          <select
            className="form-select"
            value={selectorType}
            onChange={(e) => setSelectorType(e.target.value as 'css' | 'xpath')}
          >
            <option value="css">CSS Selector</option>
            <option value="xpath">XPath</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            URL <span className="optional">(optional)</span>
          </label>
          <input
            type="url"
            className="form-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </div>

        <div className="button-group">
          <button type="submit" className="btn btn-primary" disabled={loading || !selectors.trim()}>
            {loading ? '⏳ Healing...' : '⚡ Heal Batch'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleReset} disabled={loading}>
            Reset
          </button>
        </div>
      </form>

      {loading && (
        <div className="loading">
          Processing {selectors.split('\n').filter(s => s.trim().length > 0).length} selector(s) with AI... This may take a moment.
        </div>
      )}

      {result && (
        <div className="result-card">
          <div className="result-header">
            <div>
              <h2 className="result-title">Batch Healing Results</h2>
              <div className="result-summary">
                {result.results.length} selector(s) processed
                {result.total_processing_time_ms && ` in ${result.total_processing_time_ms.toFixed(0)}ms`}
              </div>
            </div>
          </div>

          <div className="results-list">
            {result.results.map((item, index) => (
              <div key={index} className="result-item">
                <div className="result-item-header">
                  <span className="result-item-index">Selector {index + 1}</span>
                  <span className="confidence-badge">
                    Confidence: {(item.confidence * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="result-item-section">
                  <div className="result-item-label">Original</div>
                  <div className="result-item-content">{item.original_selector}</div>
                </div>

                <div className="result-item-section">
                  <div className="result-item-label">Healed</div>
                  <div className="result-item-content">{item.healed_selector}</div>
                  <button className="copy-button" onClick={() => handleCopy(item.healed_selector)}>
                    📋 Copy
                  </button>
                </div>

                <div className="result-item-metrics">
                  <div className="metric-item">
                    <div className="metric-label">Method</div>
                    <div className="metric-value">{item.method}</div>
                  </div>
                  {item.stability_score !== undefined && (
                    <div className="metric-item">
                      <div className="metric-label">Stability</div>
                      <div className="metric-value">{(item.stability_score * 100).toFixed(1)}%</div>
                    </div>
                  )}
                  {item.semantic_score !== undefined && (
                    <div className="metric-item">
                      <div className="metric-label">Semantic</div>
                      <div className="metric-value">{(item.semantic_score * 100).toFixed(1)}%</div>
                    </div>
                  )}
                  {item.processing_time_ms !== undefined && (
                    <div className="metric-item">
                      <div className="metric-label">Time</div>
                      <div className="metric-value">{item.processing_time_ms.toFixed(0)}ms</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="batch-summary">
            <div className="summary-title">Batch Summary</div>
            <div className="summary-grid">
              <div className="summary-item">
                <div className="summary-label">Total Processed</div>
                <div className="summary-value">{result.results.length}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Avg Confidence</div>
                <div className="summary-value">
                  {(calculateAverage(result.results.map(r => r.confidence)) * 100).toFixed(1)}%
                </div>
              </div>
              {result.results.some(r => r.stability_score !== undefined) && (
                <div className="summary-item">
                  <div className="summary-label">Avg Stability</div>
                  <div className="summary-value">
                    {(calculateAverage(result.results.map(r => r.stability_score || 0)) * 100).toFixed(1)}%
                  </div>
                </div>
              )}
              {result.total_processing_time_ms !== undefined && (
                <div className="summary-item">
                  <div className="summary-label">Total Time</div>
                  <div className="summary-value">{result.total_processing_time_ms.toFixed(0)}ms</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchHeal;
