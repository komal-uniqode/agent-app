import { useState, useEffect } from 'react';
import './EditModal.css';

export default function EditModal({ request, isOpen, onClose, onSave }) {
  const [status, setStatus] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (request && isOpen) {
      setStatus(request.status || 'pending');
      setResponse(request.response || '');
      setError('');
    }
  }, [request, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const updates = {};
      if (status !== request.status) {
        updates.status = status;
      }
      if (response !== request.response) {
        updates.response = response.trim();
      }

      if (Object.keys(updates).length === 0) {
        setError('No changes to save');
        setLoading(false);
        return;
      }

      await onSave(request.id, updates);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update request');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Escalation Request</h2>
          <button className="close-button" onClick={handleClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="request-info">
            <p><strong>Request ID:</strong> {request.id}</p>
            <p><strong>Customer Name:</strong> {request.customer_name || 'N/A'}</p>
            <p><strong>Date of Visit:</strong> {request.date_of_visit || 'N/A'}</p>
            <p><strong>Question:</strong> {request.question}</p>
            <p><strong>Created:</strong> {new Date(request.created_at).toLocaleString()}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={loading}
              >
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="timeout">Timeout</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="response">Response</label>
              <textarea
                id="response"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Enter response to the question..."
                rows="5"
                disabled={loading}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="modal-actions">
              <button type="button" onClick={handleClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

