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
}

export default new DatabaseService();
