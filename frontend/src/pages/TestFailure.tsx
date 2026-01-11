import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import type { FailurePayload, HealingResponse, HealedSelector } from '../types';
import './TestFailure.css';

const TestFailure = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [payload, setPayload] = useState<FailurePayload | null>(null);
  const [healingResponse, setHealingResponse] = useState<HealingResponse | null>(null);
  const [selectedSelector, setSelectedSelector] = useState<string | null>(null);
  const [selectorType, setSelectorType] = useState<'css' | 'xpath'>('css');
  const [loading, setLoading] = useState(true);
  const [healing, setHealing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [healerOptions, setHealerOptions] = useState({
    full_coverage: true,
    selector_type: 'mixed' as 'css' | 'xpath' | 'mixed',
    vision_enabled: true
  });

  useEffect(() => {
    if (testId) {
      fetchFailure();
    }
  }, [testId]);

  const fetchFailure = async () => {
    if (!testId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await apiService.getFailure(testId);
      setPayload(data.payload);
      setExecutionId((data as any).executionId || null);
      
      // Construct screenshot URL
      if (data.payload.screenshot_path) {
        const AUTOMATION_API_URL = (import.meta as any).env?.VITE_AUTOMATION_API_URL || 'http://127.0.0.1:3001';
        const filename = data.payload.screenshot_path.split(/[\\/]/).pop();
        setScreenshotUrl(`${AUTOMATION_API_URL}/screenshots/${filename}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load failure details');
      console.error('Error fetching failure:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleHeal = async () => {
    if (!payload) return;

    setHealing(true);
    setError(null);

    try {
      const response = await apiService.healFailure(payload, healerOptions);
      setHealingResponse(response);
      
      // Auto-select if available
      if (response.auto_selected?.css) {
        setSelectedSelector(response.auto_selected.css);
        setSelectorType('css');
      } else if (response.auto_selected?.xpath) {
        setSelectedSelector(response.auto_selected.xpath);
        setSelectorType('xpath');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to heal selector');
      console.error('Error healing selector:', err);
    } finally {
      setHealing(false);
    }
  };

  const handleSelectSelector = (selector: string, type: 'css' | 'xpath') => {
    setSelectedSelector(selector);
    setSelectorType(type);
  };

  const handleHealAndRerun = async () => {
    if (!selectedSelector || !payload) {
      setError('Please select a locator');
      return;
    }

    setHealing(true);
    setError(null);

    if (!executionId) {
      setError('Execution ID not found. Please go back to test execution page.');
      return;
    }

    try {
      await apiService.healAndRerun({
        executionId,
        testId: testId!,
        selectedSelector,
        selectorType,
      });

      alert('Locator updated successfully! Test will be re-executed.');
      navigate(`/test-execution/${executionId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to heal and re-run test');
      console.error('Error healing and re-running:', err);
    } finally {
      setHealing(false);
    }
  };

  if (loading) {
    return (
      <div className="test-failure">
        <div className="loading">Loading failure details...</div>
      </div>
    );
  }

  if (error && !payload) {
    return (
      <div className="test-failure">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="test-failure">
        <div className="error">Failure details not found</div>
      </div>
    );
  }

  return (
    <div className="test-failure">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/test-execution')}>
          ← Back to Test Execution
        </button>
        <h1>Test Failure Details</h1>
        <p>Review failure details and heal the selector</p>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="failure-details-card">
        <h2>Failure Information</h2>
        <div className="failure-info-grid">
          <div className="info-item">
            <span className="info-label">Test Name</span>
            <span className="info-value">{payload.test_name || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Failed Selector</span>
            <span className="info-value selector-value">{payload.failed_selector}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Use Case (Context)</span>
            <span className="info-value">{payload.use_of_selector}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Page URL</span>
            <span className="info-value">
              <a href={payload.page_url} target="_blank" rel="noopener noreferrer">
                {payload.page_url}
              </a>
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Semantic Analysis</span>
            <span className="info-value">
              {payload.semantic_dom && typeof payload.semantic_dom.total_elements === 'number'
                ? payload.semantic_dom.total_elements
                : 0} interactive elements captured
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Timestamp</span>
            <span className="info-value">
              {payload.timestamp ? new Date(payload.timestamp).toLocaleString() : 'N/A'}
            </span>
          </div>
        </div>

        {screenshotUrl && (
          <div className="screenshot-section">
            <h3>Screenshot</h3>
            <img src={screenshotUrl} alt="Failure screenshot" className="screenshot-image" />
          </div>
        )}
      </div>

      {!healingResponse && (
        <div className="heal-action-card">
          <h2>Heal Selector</h2>
          <p style={{ marginBottom: '20px' }}>Configure healing options and request AI suggestions from the Python service.</p>
          
          <div className="healer-settings" style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '16px', color: '#4a5568', textTransform: 'uppercase' }}>🔧 Healer Settings (Python API Arguments)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#718096', marginBottom: '8px' }}>Selector Type</label>
                <select 
                  value={healerOptions.selector_type}
                  onChange={(e) => setHealerOptions({...healerOptions, selector_type: e.target.value as any})}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                >
                  <option value="mixed">Mixed (CSS & XPath)</option>
                  <option value="css">CSS Only</option>
                  <option value="xpath">XPath Only</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                <input 
                  type="checkbox" 
                  id="full_coverage"
                  checked={healerOptions.full_coverage}
                  onChange={(e) => setHealerOptions({...healerOptions, full_coverage: e.target.checked})}
                />
                <label htmlFor="full_coverage" style={{ fontSize: '14px', fontWeight: '500' }}>Full Coverage Mode</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                <input 
                  type="checkbox" 
                  id="vision_enabled"
                  checked={healerOptions.vision_enabled}
                  onChange={(e) => setHealerOptions({...healerOptions, vision_enabled: e.target.checked})}
                />
                <label htmlFor="vision_enabled" style={{ fontSize: '14px', fontWeight: '500' }}>Vision AI Analysis</label>
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary btn-large"
            onClick={handleHeal}
            disabled={healing}
          >
            {healing ? '⏳ Healing...' : '🔧 Heal Selector'}
          </button>
        </div>
      )}

      {healingResponse && (
        <>
          <div className="healed-selectors-card">
            <h2>Healed Selectors</h2>
            <p>Select a locator from the suggestions below. Top 5 CSS and Top 5 XPath selectors are shown.</p>

            <div className="selector-tabs">
              <button
                className={`tab-button ${selectorType === 'css' ? 'active' : ''}`}
                onClick={() => setSelectorType('css')}
              >
                CSS Selectors ({healingResponse.css_selectors.length})
              </button>
              <button
                className={`tab-button ${selectorType === 'xpath' ? 'active' : ''}`}
                onClick={() => setSelectorType('xpath')}
              >
                XPath Selectors ({healingResponse.xpath_selectors.length})
              </button>
            </div>

            <div className="selectors-list">
              {(selectorType === 'css' ? healingResponse.css_selectors : healingResponse.xpath_selectors).length === 0 ? (
                <div className="empty-state" style={{ padding: '40px', textAlign: 'center', background: '#f7fafc', borderRadius: '8px', border: '2px dashed #cbd5e0' }}>
                  <p>No {selectorType.toUpperCase()} suggestions found for this element.</p>
                  <p style={{ fontSize: '13px', color: '#718096', marginTop: '8px' }}>Try switching tabs or adjusting healing options.</p>
                </div>
              ) : (
                (selectorType === 'css' ? healingResponse.css_selectors : healingResponse.xpath_selectors).map(
                  (selector: HealedSelector, index: number) => {
                    const selectorValue = selectorType === 'css' 
                      ? selector['Suggested Selector'] 
                      : selector.XPath;
                    const isSelected = selectedSelector === selectorValue;

                    return (
                      <div
                        key={index}
                        className={`selector-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectSelector(selectorValue, selectorType)}
                      >
                        <div className="selector-item-header">
                          <span className="selector-rank">#{selector.RankIndex}</span>
                          <span className="selector-score">Score: {(selector.Score * 100).toFixed(1)}%</span>
                        </div>
                        <div className="selector-value-display">
                          {selectorType === 'css' ? selector['Suggested Selector'] : selector.XPath}
                        </div>
                        <div className="selector-metadata">
                          <span>Tag: {selector.Tag}</span>
                          {selector.Text && <span>Text: {selector.Text.substring(0, 50)}</span>}
                          {selector.Role && <span>Role: {selector.Role}</span>}
                        </div>
                      </div>
                    );
                  }
                )
              )}
            </div>

            {selectedSelector && (
              <div className="selected-selector-card">
                <h3>Selected Selector</h3>
                <div className="selected-selector-value">{selectedSelector}</div>
                <div className="selected-selector-type">Type: {selectorType.toUpperCase()}</div>
                <button
                  className="btn btn-primary btn-large"
                  onClick={handleHealAndRerun}
                  disabled={healing}
                >
                  {healing ? '⏳ Updating...' : '✅ Update Locator & Re-execute Test'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TestFailure;
