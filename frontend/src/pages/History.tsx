import { useState, useEffect } from 'react';
import apiService from '../services/api';
import type { HistoryResponse, HistoryEntry } from '../types';
import './History.css';

const History = () => {
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {
        page,
        page_size: pageSize,
      };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const data = await apiService.getHistory(params);
      setHistory(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load history. Please try again.');
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, pageSize]);

  const handleFilter = () => {
    setPage(1);
    fetchHistory();
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  useEffect(() => {
    if (startDate || endDate) {
      const timeoutId = setTimeout(() => {
        handleFilter();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [startDate, endDate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getConfidenceClass = (confidence: number) => {
    if (confidence >= 0.8) return 'confidence-high';
    if (confidence >= 0.5) return 'confidence-medium';
    return 'confidence-low';
  };

  const totalPages = history ? Math.ceil(history.total_count / history.page_size) : 0;
  const startItem = history ? (history.page - 1) * history.page_size + 1 : 0;
  const endItem = history ? Math.min(history.page * history.page_size, history.total_count) : 0;

  return (
    <div className="history">
      <div className="page-header">
        <h1>Healing History</h1>
        <p>Browse past healing attempts with pagination and filtering</p>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="filters-card">
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">Start Date</label>
            <input
              type="date"
              className="filter-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label">End Date</label>
            <input
              type="date"
              className="filter-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label">Page Size</label>
            <select
              className="filter-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
          </div>
        </div>
        <div className="filter-actions">
          <button className="btn btn-primary" onClick={handleFilter}>
            Apply Filters
          </button>
          <button className="btn btn-secondary" onClick={handleResetFilters}>
            Reset
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading history...</div>
      ) : history && history.items.length > 0 ? (
        <>
          <div className="history-table-card">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Selectors</th>
                  <th>Confidence</th>
                  <th>Timestamp</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {history.items.map((entry: HistoryEntry) => (
                  <tr key={entry.id}>
                    <td className="selector-cell">
                      <div className="original" title="Broken selector">{entry.old_selector}</div>
                      <div className="healed" title="Healed selector">{entry.new_selector}</div>
                    </td>
                    <td className={`confidence-cell ${getConfidenceClass(entry.confidence)}`}>
                      {(entry.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="timestamp-cell">{formatDate(entry.timestamp)}</td>
                    <td className="metrics-cell">
                      <div style={{ fontSize: '11px', color: '#718096' }}>ID: {entry.id}</div>
                      <div style={{ fontSize: '11px', color: '#718096', wordBreak: 'break-all' }}>
                        URL: <a href={entry.url} target="_blank" rel="noreferrer">{new URL(entry.url).hostname}</a>
                      </div>
                      {entry.feedback_rating && (
                        <div className={`feedback-badge ${entry.feedback_rating}`}>
                          {entry.feedback_rating === 'positive' ? '👍' : '👎'}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <div className="pagination-info">
              Showing {startItem} to {endItem} of {history.total_count} entries
            </div>
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                ««
              </button>
              <button
                className="pagination-btn"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                ‹ Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    className={`pagination-btn ${page === pageNum ? 'active' : ''}`}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                className="pagination-btn"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                Next ›
              </button>
              <button
                className="pagination-btn"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
              >
                »»
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📜</div>
          <div className="empty-state-title">No History Found</div>
          <div className="empty-state-text">
            {startDate || endDate
              ? 'Try adjusting your filters to see more results.'
              : 'Start healing selectors to see history here.'}
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
