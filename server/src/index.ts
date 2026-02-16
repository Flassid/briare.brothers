import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import campaignRoutes from './routes/campaigns.js';
import { setupSocketHandlers } from './socket/handlers.js';
import { authMiddleware } from './middleware/auth.js';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// CORS configuration - allow both frontend ports
const corsOptions = {
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', authMiddleware, campaignRoutes);

// Socket.IO setup with stable connection settings
const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,    // 60 seconds before disconnect
  pingInterval: 25000,   // Ping every 25 seconds
  connectTimeout: 45000, // 45 seconds to connect
});

// Setup socket handlers
setupSocketHandlers(io);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`
🏰 Dungeon.AI Server is running!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 HTTP: http://localhost:${PORT}
🔌 WebSocket: ws://localhost:${PORT}
⚡ Environment: ${process.env.NODE_ENV || 'development'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

export { io };
