import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agent_app';
const DATABASE_NAME = process.env.MONGODB_DATABASE || 'agent_app';

// Create MongoDB client
const client = new MongoClient(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Database and collection references
let db = null;
let collections = {};

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  CONVERSATIONS: 'conversations',
  KNOWLEDGE_BASE: 'knowledge_base',
  ESCALATION_REQUESTS: 'escalation_requests',
};

// Connect to MongoDB
export async function connectToMongoDB() {
  try {
    if (!client.topology || !client.topology.isConnected()) {
      await client.connect();
      console.log('Connected to MongoDB successfully');
    }
    
    db = client.db(DATABASE_NAME);
    
    // Initialize collections
    collections = {
      users: db.collection(COLLECTIONS.USERS),
      conversations: db.collection(COLLECTIONS.CONVERSATIONS),
      knowledge_base: db.collection(COLLECTIONS.KNOWLEDGE_BASE),
      escalation_requests: db.collection(COLLECTIONS.ESCALATION_REQUESTS),
    };
    
    return { client, db, collections };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Get database instance
export function getDatabase() {
  if (!db) {
    throw new Error('Database not connected. Call connectToMongoDB() first.');
  }
  return db;
}

// Get collections
export function getCollections() {
  if (!collections || Object.keys(collections).length === 0) {
    throw new Error('Collections not initialized. Call connectToMongoDB() first.');
  }
  return collections;
}

// Close MongoDB connection
export async function closeMongoDBConnection() {
  try {
    if (client && client.topology && client.topology.isConnected()) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
}

export { client, db, collections };
