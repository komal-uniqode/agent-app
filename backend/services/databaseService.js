import { connectToMongoDB, getCollections, COLLECTIONS } from '../config/mongodb.js';

class DatabaseService {
  constructor() {
    this.collections = null;
    this.isConnected = false;
  }

  // Initialize MongoDB connection
  async initialize() {
    try {
      const { collections } = await connectToMongoDB();
      this.collections = collections;
      this.isConnected = true;
      console.log('MongoDB service initialized successfully');
      return { success: true, message: 'MongoDB service initialized' };
    } catch (error) {
      console.error('MongoDB initialization error:', error);
      throw new Error(`Failed to initialize MongoDB service: ${error.message}`);
    }
  }

  // Test connection to MongoDB
  async testConnection() {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }
      
      // Test the connection by pinging the database
      const db = this.collections.users.db;
      await db.admin().ping();
      
      console.log('MongoDB connection test successful');
      console.log('Available collections:', Object.keys(COLLECTIONS));
      return { success: true, message: 'MongoDB connection successful' };
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw new Error(`Failed to connect to MongoDB: ${error.message}`);
    }
  }

  // Get collections (for future use)
  getCollections() {
    if (!this.isConnected || !this.collections) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.collections;
  }

  // Valid status values
  static VALID_STATUSES = ['pending', 'resolved', 'timeout'];

  // Validate status value
  static validateStatus(status) {
    if (!DatabaseService.VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${DatabaseService.VALID_STATUSES.join(', ')}`);
    }
    return true;
  }

  // Create escalation request
  async createEscalationRequest(question, customerName, dateOfVisit, status = 'pending') {
    try {
      // Validate status
      DatabaseService.validateStatus(status);
      
      // Validate required fields
      if (!question || question.trim() === '') {
        throw new Error('Question is required');
      }
      if (!customerName || customerName.trim() === '') {
        throw new Error('Customer name is required');
      }
      if (!dateOfVisit || dateOfVisit.trim() === '') {
        throw new Error('Date of visit is required');
      }
      
      if (!this.isConnected) {
        await this.initialize();
      }

      const escalationRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        question: question.trim(),
        customer_name: customerName.trim(),
        date_of_visit: dateOfVisit.trim(),
        status: status,
        resolved_at: null,
        response: null,
        created_at: new Date().toISOString(),
      };

      if (!this.collections || !this.collections.escalation_requests) {
        throw new Error('Database collections not properly initialized');
      }

      const result = await this.collections.escalation_requests.insertOne(escalationRequest);
      
      // Verify the insert by querying the database
      const verifyDoc = await this.collections.escalation_requests.findOne({ _id: result.insertedId });
      
      return {
        success: true,
        data: escalationRequest,
        insertedId: result.insertedId,
      };
    } catch (error) {
      throw new Error(`Failed to create escalation request: ${error.message}`);
    }
  }

  // Get all escalation requests
  async getAllEscalationRequests() {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      if (!this.collections || !this.collections.escalation_requests) {
        throw new Error('Database collections not properly initialized');
      }

      const requests = await this.collections.escalation_requests
        .find({})
        .sort({ created_at: -1 })
        .toArray();

      return {
        success: true,
        data: requests,
        count: requests.length,
      };
    } catch (error) {
      console.error('Error fetching escalation requests:', error);
      throw new Error(`Failed to fetch escalation requests: ${error.message}`);
    }
  }

  // Create knowledge base item
  async createKnowledgeBaseItem(id, question, answer) {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      if (!this.collections || !this.collections.knowledge_base) {
        throw new Error('Database collections not properly initialized');
      }

      // Validate required fields
      if (!id || id.trim() === '') {
        throw new Error('ID is required');
      }
      if (!question || question.trim() === '') {
        throw new Error('Question is required');
      }
      if (!answer || answer.trim() === '') {
        throw new Error('Answer is required');
      }

      const knowledgeItem = {
        id: id.trim(),
        question: question.trim(),
        answer: answer.trim(),
        created_at: new Date().toISOString(),
      };

      const result = await this.collections.knowledge_base.insertOne(knowledgeItem);

      return {
        success: true,
        data: knowledgeItem,
        insertedId: result.insertedId,
      };
    } catch (error) {
      console.error('Error creating knowledge base item:', error);
      throw new Error(`Failed to create knowledge base item: ${error.message}`);
    }
  }

  // Update escalation request
  async updateEscalationRequest(requestId, updates) {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      if (!this.collections || !this.collections.escalation_requests) {
        throw new Error('Database collections not properly initialized');
      }

      // First, check if the request exists
      const existing = await this.collections.escalation_requests.findOne({ id: requestId });
      if (!existing) {
        throw new Error(`Escalation request with id ${requestId} not found`);
      }

      // Validate status if provided
      if (updates.status) {
        DatabaseService.validateStatus(updates.status);
      }

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Check if status is being changed to 'resolved' (not already resolved)
      const isBeingResolved = updates.status === 'resolved' && existing.status !== 'resolved';

      // If status is being set to 'resolved' and resolved_at is null, set it
      if (isBeingResolved && !updates.resolved_at) {
        updateData.resolved_at = new Date().toISOString();
      }

      // If status is being changed from 'resolved' to something else, clear resolved_at
      if (updates.status && updates.status !== 'resolved' && existing.status === 'resolved') {
        updateData.resolved_at = null;
      }

      // Update the document
      const updateResult = await this.collections.escalation_requests.updateOne(
        { id: requestId },
        { $set: updateData }
      );

      if (updateResult.matchedCount === 0) {
        throw new Error(`Escalation request with id ${requestId} not found`);
      }

      if (updateResult.modifiedCount === 0) {
        console.warn(`No changes made to escalation request ${requestId}`);
      }

      // Fetch the updated document
      const updated = await this.collections.escalation_requests.findOne({ id: requestId });

      // Check if we should add to knowledge base:
      // 1. Status was just changed to 'resolved' AND response exists
      // 2. OR response was just added AND status is already 'resolved'
      const responseJustAdded = updates.response && !existing.response && existing.status === 'resolved';
      const shouldAddToKB = (isBeingResolved || responseJustAdded) && 
                           updated.response && 
                           updated.response.trim() !== '' &&
                           updated.status === 'resolved';

      if (shouldAddToKB) {
        try {
          // Check if knowledge base item with this escalation request ID already exists
          const existingKBItem = await this.collections.knowledge_base.findOne({ 
            id: requestId 
          });

          if (!existingKBItem) {
            await this.createKnowledgeBaseItem(requestId, updated.question, updated.response);
            console.log(`✅ Added resolved request ${requestId} to knowledge base`);
          } else {
            console.log(`ℹ️  Knowledge base item with ID "${requestId}" already exists, skipping`);
          }
        } catch (kbError) {
          // Log error but don't fail the update
          console.error(`Failed to add to knowledge base: ${kbError.message}`);
        }
      }

      return {
        success: true,
        data: updated,
      };
    } catch (error) {
      console.error('Error updating escalation request:', error);
      throw new Error(`Failed to update escalation request: ${error.message}`);
    }
  }
}

export default new DatabaseService();
