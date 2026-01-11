import { useState, useEffect } from 'react';
import apiService from '../services/api';
import type { FeedbackRequest, HistoryEntry } from '../types';
import './Feedback.css';

const Feedback = () => {
  const [healingId, setHealingId] = useState<number | ''>('');
  const [feedbackType, setFeedbackType] = useState<'positive' | 'negative' | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recentHistory, setRecentHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const fetchRecentHistory = async () => {
      setLoadingHistory(true);
      try {
        const data = await apiService.getHistory({ page: 1, page_size: 10 });
        setRecentHistory(data.items); // HistoryResponse has 'items'
      } catch (err) {
        console.error('Error fetching recent history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchRecentHistory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!feedbackType) {
      setError('Please select a feedback type');
      setLoading(false);
      return;
    }

    if (healingId === '') {
      setError('Please enter a healing ID');
      setLoading(false);
      return;
    }

    try {
      const request: FeedbackRequest = {
        healing_id: Number(healingId),
        rating: feedbackType,
      };
      if (comment.trim()) {
        request.comment = comment.trim();
      }

      await apiService.submitFeedback(request);
      setSuccess('Thank you for your feedback! It helps us improve the service.');
      setHealingId('');
      setFeedbackType(null);
      setComment('');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to submit feedback. Please try again.');
      console.error('Error submitting feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFromHistory = (entry: HistoryEntry) => {
    setHealingId(entry.id);
    setError(null);
  };

  return (
    <div className="feedback">
      <div className="page-header">
        <h1>Submit Feedback</h1>
        <p>Help improve the service by providing feedback on healing results</p>
      </div>

      <div className="info-card">
        <div className="info-title">💡 Why Your Feedback Matters</div>
        <p className="info-text">
          Your feedback helps us improve the selector healing accuracy and user experience.
          Whether the healed selector worked perfectly or needs improvement, your input
          is valuable for training and optimizing the AI models.
        </p>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-group">
          <label className="form-label">
            Healing ID <span className="required">*</span>
          </label>
          <input
            type="number"
            className="form-input"
            value={healingId}
            onChange={(e) => setHealingId(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Enter the healing ID from your history"
            required
          />
          {recentHistory.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div className="form-label" style={{ fontSize: '12px', marginBottom: '8px' }}>
                Recent Healings (click to select):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentHistory.slice(0, 5).map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => handleSelectFromHistory(entry)}
                    style={{
                      padding: '12px',
                      background: healingId === entry.id ? '#edf2f7' : '#f7fafc',
                      border: `2px solid ${healingId === entry.id ? '#3182ce' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#1a202c', marginBottom: '4px' }}>
                      ID: {entry.id}
                    </div>
                    <div className="history-selector" style={{ fontSize: '11px', color: '#4a5568', wordBreak: 'break-all' }}>
                      {entry.old_selector.substring(0, 40)}... → {entry.new_selector.substring(0, 40)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">
            Feedback Type <span className="required">*</span>
          </label>
          <div className="feedback-type-group">
            <div
              className={`feedback-type-option positive ${feedbackType === 'positive' ? 'selected' : ''}`}
              onClick={() => setFeedbackType('positive')}
            >
              <div className="feedback-type-icon">👍</div>
              <div className="feedback-type-label">Positive</div>
            </div>
            <div
              className={`feedback-type-option negative ${feedbackType === 'negative' ? 'selected' : ''}`}
              onClick={() => setFeedbackType('negative')}
            >
              <div className="feedback-type-icon">👎</div>
              <div className="feedback-type-label">Negative</div>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Comment <span style={{ color: '#a0aec0', fontWeight: 400, marginLeft: '4px' }}>(optional)</span>
          </label>
          <textarea
            className="form-textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us more about your experience or any suggestions..."
            rows={5}
          />
        </div>

        <div className="button-group">
          <button type="submit" className="btn btn-primary" disabled={loading || !feedbackType || healingId === ''}>
            {loading ? '⏳ Submitting...' : '💬 Submit Feedback'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setHealingId('');
              setFeedbackType(null);
              setComment('');
              setError(null);
              setSuccess(null);
            }}
            disabled={loading}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};

export default Feedback;
