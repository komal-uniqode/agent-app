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
  async createEscalationRequest(question, status = 'pending') {
    try {
      // Validate status
      DatabaseService.validateStatus(status);
      
      if (!this.isConnected) {
        await this.initialize();
      }

      const escalationRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        question: question,
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
}

export default new DatabaseService();
