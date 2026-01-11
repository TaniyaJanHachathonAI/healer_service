import { useState } from 'react';
import apiService from '../services/api';
import type { HealRequest, HealResponse } from '../types';
import './SingleHeal.css';

const SingleHeal = () => {
  const [formData, setFormData] = useState<HealRequest>({
    selector: '',
    url: '',
    selector_type: 'css',
  });
  const [result, setResult] = useState<HealResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setResult(null);

    try {
      const response = await apiService.heal(formData);
      setResult(response);
      setSuccess('Selector healed successfully!');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to heal selector. Please check your input and try again.');
      console.error('Error healing selector:', err);
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
    setFormData({
      selector: '',
      url: '',
      selector_type: 'css',
    });
    setResult(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="single-heal">
      <div className="page-header">
        <h1>Single Selector Healing</h1>
        <p>Heal a single CSS or XPath selector with AI-powered intelligence</p>
      </div>

      {error && <div className="error">{error}</div>}
      {success && !result && <div className="success">{success}</div>}

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-group">
          <label className="form-label">
            Selector <span style={{ color: '#e53e3e' }}>*</span>
          </label>
          <textarea
            className="form-textarea"
            value={formData.selector}
            onChange={(e) => setFormData({ ...formData, selector: e.target.value })}
            placeholder="Enter CSS or XPath selector (e.g., #submit-button or //button[@id='submit'])"
            required
            rows={3}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Selector Type
          </label>
          <select
            className="form-select"
            value={formData.selector_type}
            onChange={(e) => setFormData({ ...formData, selector_type: e.target.value as 'css' | 'xpath' })}
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
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder="https://example.com"
          />
        </div>

        <div className="button-group">
          <button type="submit" className="btn btn-primary" disabled={loading || !formData.selector}>
            {loading ? '⏳ Healing...' : '🔧 Heal Selector'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleReset} disabled={loading}>
            Reset
          </button>
        </div>
      </form>

      {loading && <div className="loading">Processing selector with AI... This may take a moment.</div>}

      {result && (
        <div className="result-card">
          <div className="result-header">
            <h2 className="result-title">Healing Result</h2>
            <span className="confidence-badge">
              Confidence: {(result.confidence * 100).toFixed(1)}%
            </span>
          </div>

          <div className="result-section">
            <div className="result-section-title">Original Selector</div>
            <div className="result-content">{formData.selector}</div>
          </div>

          <div className="result-section">
            <div className="result-section-title">Healed Selector</div>
            <div className="result-content">{result.healed_selector}</div>
            <button className="copy-button" onClick={() => handleCopy(result.healed_selector)}>
              📋 Copy to Clipboard
            </button>
          </div>

          <div className="result-metrics">
            <div className="metric-item">
              <div className="metric-label">Method</div>
              <div className="metric-value">{result.method}</div>
            </div>
            {result.stability_score !== undefined && (
              <div className="metric-item">
                <div className="metric-label">Stability Score</div>
                <div className="metric-value">{(result.stability_score * 100).toFixed(1)}%</div>
              </div>
            )}
            {result.semantic_score !== undefined && (
              <div className="metric-item">
                <div className="metric-label">Semantic Score</div>
                <div className="metric-value">{(result.semantic_score * 100).toFixed(1)}%</div>
              </div>
            )}
            {result.processing_time_ms !== undefined && (
              <div className="metric-item">
                <div className="metric-label">Processing Time</div>
                <div className="metric-value">{result.processing_time_ms.toFixed(0)}ms</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleHeal;
