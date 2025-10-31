import { useState, useEffect } from 'react';
import { api } from '../services/api';
import './KnowledgeBaseList.css';

export default function KnowledgeBaseList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await api.getKnowledgeBaseItems();
      setItems(result.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load knowledge base items');
    } finally {
      setLoading(false);
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
        <p>Loading knowledge base...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
        <button onClick={fetchItems}>Retry</button>
      </div>
    );
  }

  return (
    <div className="kb-container">
      <div className="kb-header">
        <h1>Knowledge Base</h1>
        <button onClick={fetchItems} className="refresh-button">
          🔄 Refresh
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <p>No knowledge base items found.</p>
        </div>
      ) : (
        <div className="kb-table-container">
          <table className="kb-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Question</th>
                <th>Answer</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="id-cell">{item.id}</td>
                  <td className="question-cell">{item.question}</td>
                  <td className="answer-cell">{item.answer}</td>
                  <td>{formatDate(item.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

