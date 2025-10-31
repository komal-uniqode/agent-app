const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4200';

export const api = {
  // Get all escalation requests
  async getEscalationRequests() {
    const response = await fetch(`${API_BASE_URL}/api/escalation-requests`);
    if (!response.ok) {
      throw new Error('Failed to fetch escalation requests');
    }
    return response.json();
  },

  // Update escalation request
  async updateEscalationRequest(id, updates) {
    const response = await fetch(`${API_BASE_URL}/api/escalation-requests/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update escalation request');
    }
    return response.json();
  },

  // Get all knowledge base items
  async getKnowledgeBaseItems() {
    const response = await fetch(`${API_BASE_URL}/api/knowledge-base`);
    if (!response.ok) {
      throw new Error('Failed to fetch knowledge base items');
    }
    return response.json();
  },
};

