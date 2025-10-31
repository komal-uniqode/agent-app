import { useState, useEffect } from 'react';
import { api } from '../services/api';
import EditModal from './EditModal';
import './RequestsList.css';

export default function RequestsList() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await api.getEscalationRequests();
      setRequests(result.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleSave = async (id, updates) => {
    try {
      await api.updateEscalationRequest(id, updates);
      await fetchRequests(); // Refresh the list
    } catch (err) {
      throw err; // Re-throw to let EditModal handle it
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'resolved':
        return 'status-resolved';
      case 'timeout':
        return 'status-timeout';
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading escalation requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
        <button onClick={fetchRequests}>Retry</button>
      </div>
    );
  }

  return (
    <div className="requests-container">
      <div className="requests-header">
        <h1>Escalation Requests</h1>
        <button onClick={fetchRequests} className="refresh-button">
          🔄 Refresh
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="empty-state">
          <p>No escalation requests found.</p>
        </div>
      ) : (
        <div className="requests-table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer Name</th>
                <th>Date of Visit</th>
                <th>Question</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Resolved At</th>
                <th>Response</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="id-cell">{request.id}</td>
                  <td className="customer-name-cell">{request.customer_name || 'N/A'}</td>
                  <td>{request.date_of_visit || 'N/A'}</td>
                  <td className="question-cell">{request.question}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td>{formatDate(request.created_at)}</td>
                  <td>{formatDate(request.resolved_at)}</td>
                  <td className="response-cell">
                    {request.response || <span className="no-response">No response</span>}
                  </td>
                  <td>
                    <button
                      onClick={() => handleEdit(request)}
                      className="edit-button"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EditModal
        request={selectedRequest}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRequest(null);
        }}
        onSave={handleSave}
      />
    </div>
  );
}

