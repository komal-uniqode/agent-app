// server.js
import express from 'express';
import cors from 'cors';
import { AccessToken } from 'livekit-server-sdk';
import dotenv from 'dotenv';
import databaseService from './services/databaseService.js';

// Load environment variables
dotenv.config();

const createToken = async () => {
  // If this room doesn't exist, it'll be automatically created when the first
  // participant joins
  const roomName = 'quickstart-room';
  // Identifier to be used for participant.
  // It's available as LocalParticipant.identity with livekit-client SDK
  const participantName = 'quickstart-username';

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set in environment variables');
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
    // Token to expire after 10 minutes
    ttl: '10m',
  });
  at.addGrant({ roomJoin: true, room: roomName });

  return await at.toJwt();
};

const app = express();
const port = 4200;

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',  // Next.js dev server
    'http://localhost:3001',  // Alternative port
    'http://localhost:5173',  // Vite dev server (admin frontend)
    'http://127.0.0.1:3000',  // Alternative localhost
    'http://127.0.0.1:5173',  // Vite alternative
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Middleware
app.use(express.json());

// Existing LiveKit token endpoint
app.get('/getToken', async (req, res) => {
  
  try {
    const token = await createToken();
    res.json({
      token: token,
      roomName: 'quickstart-room',
      participantName: 'quickstart-username',
      expiresIn: 600 // 10 minutes in seconds
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test MongoDB connection
    await databaseService.testConnection();
    res.json({ 
      status: 'OK', 
      message: 'Server is running',
      mongodb: 'Connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Server is running but MongoDB connection failed',
      error: error.message 
    });
  }
});

// Create escalation request endpoint
app.post('/api/escalation-requests', async (req, res) => {
  try {
    const { question, customer_name, date_of_visit } = req.body;
    
    if (!question || question.trim() === '') {
      return res.status(400).json({ error: 'Question is required' });
    }
    if (!customer_name || customer_name.trim() === '') {
      return res.status(400).json({ error: 'Customer name is required' });
    }
    if (!date_of_visit || date_of_visit.trim() === '') {
      return res.status(400).json({ error: 'Date of visit is required' });
    }

    const result = await databaseService.createEscalationRequest(
      question.trim(),
      customer_name.trim(),
      date_of_visit.trim()
    );
    
    // Log service request creation
    console.log('📋 SERVICE REQUEST CREATED:');
    console.log(`   ID: ${result.data.id}`);
    console.log(`   Customer: ${result.data.customer_name}`);
    console.log(`   Date of Visit: ${result.data.date_of_visit}`);
    console.log(`   Question: ${result.data.question}`);
    console.log(`   Status: ${result.data.status}`);
    console.log(`   Created At: ${result.data.created_at}`);
    
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create escalation request' });
  }
});

// Get all escalation requests endpoint
app.get('/api/escalation-requests', async (req, res) => {
  try {
    const result = await databaseService.getAllEscalationRequests();
    res.json(result);
  } catch (error) {
    console.error('Error fetching escalation requests:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch escalation requests' });
  }
});

// Update escalation request endpoint
app.put('/api/escalation-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, response } = req.body;

    const updates = {};
    if (status !== undefined) {
      updates.status = status;
    }
    if (response !== undefined) {
      updates.response = response;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const result = await databaseService.updateEscalationRequest(id, updates);
    res.json(result);
  } catch (error) {
    console.error('Error updating escalation request:', error);
    res.status(500).json({ error: error.message || 'Failed to update escalation request' });
  }
});

// Get all knowledge base items endpoint
app.get('/api/knowledge-base', async (req, res) => {
  try {
    const result = await databaseService.getAllKnowledgeBaseItems();
    res.json(result);
  } catch (error) {
    console.error('Error fetching knowledge base items:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch knowledge base items' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  // Test MongoDB connection on startup
  databaseService.testConnection()
    .then(() => console.log('✅ MongoDB connection successful'))
    .catch((error) => console.error('❌ MongoDB connection failed:', error.message));
});