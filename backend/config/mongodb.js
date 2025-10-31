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

// Schema validation for escalation_requests collection
const ESCALATION_REQUESTS_SCHEMA = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['id', 'question', 'status', 'resolved_at', 'response', 'created_at', 'customer_name', 'date_of_visit'],
    properties: {
      id: {
        bsonType: 'string',
        description: 'Unique request ID - required'
      },
      question: {
        bsonType: 'string',
        description: 'Customer question or issue summary - required'
      },
      customer_name: {
        bsonType: 'string',
        description: 'Customer name - required'
      },
      date_of_visit: {
        bsonType: 'string',
        description: 'Date of customer visit - required'
      },
      status: {
        enum: ['pending', 'resolved', 'timeout'],
        description: 'Request status - must be one of: pending, resolved, timeout'
      },
      resolved_at: {
        bsonType: ['string', 'null'],
        description: 'Timestamp when request was resolved - can be null'
      },
      response: {
        bsonType: ['string', 'null'],
        description: 'Response to the request - can be null'
      },
      created_at: {
        bsonType: 'string',
        description: 'Timestamp when request was created - required'
      }
    }
  }
};

// Schema validation for knowledge_base collection
const KNOWLEDGE_BASE_SCHEMA = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['id', 'question', 'answer', 'created_at'],
    properties: {
      id: {
        bsonType: 'string',
        description: 'Unique knowledge base item ID - required'
      },
      question: {
        bsonType: 'string',
        description: 'Question or topic - required'
      },
      answer: {
        bsonType: 'string',
        description: 'Answer or information content - required'
      },
      created_at: {
        bsonType: 'string',
        description: 'Timestamp when knowledge base item was created - required'
      }
    }
  }
};

// Set up collection with schema validation
async function setupCollectionWithValidation(collectionName, schema, existingCollection) {
  try {
    const collections = await db.listCollections({ name: collectionName }).toArray();
    
    if (collections.length === 0) {
      // Collection doesn't exist, create it with validation
      console.log(`📋 Creating collection ${collectionName} with schema validation...`);
      await db.createCollection(collectionName, {
        validator: schema
      });
      console.log(`✅ Collection ${collectionName} created with schema validation`);
    } else {
      // Collection exists, update validation if needed
      try {
        await db.command({
          collMod: collectionName,
          validator: schema,
          validationLevel: 'strict',
          validationAction: 'error'
        });
        console.log(`✅ Collection ${collectionName} validation schema updated`);
      } catch (error) {
        // If update fails (might already have validation), just log it
        console.log(`ℹ️  Collection ${collectionName} validation check: ${error.message}`);
      }
    }
    
    return db.collection(collectionName);
  } catch (error) {
    console.error(`Error setting up collection ${collectionName}:`, error);
    // Return existing collection even if validation setup fails
    return existingCollection || db.collection(collectionName);
  }
}

// Connect to MongoDB
export async function connectToMongoDB() {
  try {
    if (!client.topology || !client.topology.isConnected()) {
      await client.connect();
      console.log('Connected to MongoDB successfully');
    }
    
    db = client.db(DATABASE_NAME);
    
    // Initialize collections (create basic references first)
    const basicCollections = {
      users: db.collection(COLLECTIONS.USERS),
      conversations: db.collection(COLLECTIONS.CONVERSATIONS),
      knowledge_base: db.collection(COLLECTIONS.KNOWLEDGE_BASE),
      escalation_requests: db.collection(COLLECTIONS.ESCALATION_REQUESTS),
    };
    
    // Set up schema validation for collections
    collections = {
      users: basicCollections.users,
      conversations: basicCollections.conversations,
      knowledge_base: await setupCollectionWithValidation(
        COLLECTIONS.KNOWLEDGE_BASE,
        KNOWLEDGE_BASE_SCHEMA,
        basicCollections.knowledge_base
      ),
      escalation_requests: await setupCollectionWithValidation(
        COLLECTIONS.ESCALATION_REQUESTS,
        ESCALATION_REQUESTS_SCHEMA,
        basicCollections.escalation_requests
      ),
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
