import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import ollamaService from './services/ollamaService.js';
import QueueService from './services/queueService.js';
import { chatHandler } from './api/chat.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRouter from './api/auth/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configure CORS for both local and production
const allowedOrigins = [
  'http://localhost:5173',
  'https://aithink.truyenthong.edu.vn'
];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Relax handshake options for Cloudflare Tunnel
  allowEIO3: true,
  transports: ['polling', 'websocket'],
  pingTimeout: 60000,
  pingInterval: 25000,
  // Add connection state recovery
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  }
});

const PORT = process.env.PORT || 3000;
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT_REQUESTS) || 8;

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Initialize queue service with max concurrent = 8
const queueService = new QueueService(MAX_CONCURRENT);

// Track online users
let onlineUsers = 0;

// Broadcast status to all connected clients
const broadcastStatus = () => {
  io.emit('system:status', {
    onlineUsers,
    queue: queueService.getStatus()
  });
};

// Set queue service callback
queueService.setStatusChangeCallback(() => {
  broadcastStatus();
});

// REST API routes
app.use('/api/auth', authRouter);

app.get('/api/health', async (req, res) => {
  const ollamaHealthy = await ollamaService.healthCheck();
  res.json({
    success: true,
    status: ollamaHealthy ? 'healthy' : 'unhealthy',
    ollama: ollamaHealthy,
    queue: queueService.getStatus()
  });
});

app.get('/api/queue/status', (req, res) => {
  res.json({
    success: true,
    data: queueService.getStatus()
  });
});

// Serve static files from frontend build
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// WebSocket connection
io.on('connection', (socket) => {
  onlineUsers++;
  console.log(`✅ Client connected: ${socket.id}, Online users: ${onlineUsers}`);
  
  // Send initial system status
  broadcastStatus();
  
  // Setup chat handler
  chatHandler(socket, queueService);
  
  socket.on('disconnect', (reason) => {
    onlineUsers--;
    console.log(`❌ Client disconnected: ${socket.id}, reason: ${reason}, Online users: ${onlineUsers}`);
    broadcastStatus();
  });
  
  socket.on('error', (error) => {
    console.error(`❌ Socket error for ${socket.id}:`, error);
  });
});

// Handle connection errors
io.engine.on('connection_error', (err) => {
  console.error('❌ Connection error:', {
    message: err.message,
    code: err.code,
    context: err.context
  });
});

// SPA fallback - serve index.html for non-API routes (MUST be after Socket.io setup)
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Initialize and start server
async function startServer() {
  try {
    console.log('🚀 Initializing AIThink Backend...');
    
    // Initialize Ollama service
    await ollamaService.initialize();
    
    // Check Ollama health
    const isHealthy = await ollamaService.healthCheck();
    if (!isHealthy) {
      console.warn('⚠️  Warning: Cannot connect to Ollama. Make sure Ollama is running.');
    } else {
      console.log('✅ Ollama connection verified');
    }
    
    // Start server
    httpServer.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 Max concurrent requests: ${MAX_CONCURRENT}`);
      console.log(`🤖 Using model: ${process.env.OLLAMA_MODEL}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
