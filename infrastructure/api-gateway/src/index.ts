import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Server } from 'socket.io';
import http from 'http';
import { RedisClientType, createClient } from 'redis';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Redis client for caching
let redisClient: RedisClientType;

async function initRedis() {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  await redisClient.connect();
  console.log('Connected to Redis');
}

// Service routes mapping
const services = {
  dashboard: process.env.DASHBOARD_BACKEND_URL || 'http://dashboard-backend:8000',
  accounting: process.env.ACCOUNTING_BACKEND_URL || 'http://accounting-backend:8000',
  administration: process.env.ADMINISTRATION_BACKEND_URL || 'http://administration-backend:8000',
  sales: process.env.SALES_BACKEND_URL || 'http://sales-backend:8000',
  hr: process.env.HR_BACKEND_URL || 'http://hr-backend:8000',
  legal: process.env.LEGAL_BACKEND_URL || 'http://legal-backend:8000',
  rd: process.env.RD_BACKEND_URL || 'http://rd-backend:8000',
};

// Proxy configuration for each service
Object.entries(services).forEach(([name, target]) => {
  app.use(
    `/api/${name}`,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        [`^/api/${name}`]: '',
      },
      onProxyReq: (proxyReq, req) => {
        // Add custom headers or modify request
        proxyReq.setHeader('X-Gateway-Request', 'true');
      },
      onError: (err, req, res) => {
        console.error(`Proxy error for ${name}:`, err);
        res.status(502).json({
          success: false,
          error: {
            code: 'GATEWAY_ERROR',
            message: `Service ${name} is currently unavailable`,
          },
        });
      },
    })
  );
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: Object.keys(services),
    },
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-module', (module: string) => {
    socket.join(module);
    console.log(`Client ${socket.id} joined module: ${module}`);
  });

  socket.on('leave-module', (module: string) => {
    socket.leave(module);
    console.log(`Client ${socket.id} left module: ${module}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Broadcast function for services to emit events
app.post('/api/broadcast', express.json(), (req, res) => {
  const { module, event, data } = req.body;

  if (!module || !event) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_BROADCAST',
        message: 'Module and event are required',
      },
    });
  }

  io.to(module).emit(event, data);

  res.json({
    success: true,
    data: { message: 'Event broadcasted successfully' },
  });
});

// Start server
const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await initRedis();

    server.listen(PORT, () => {
      console.log(`API Gateway running on port ${PORT}`);
      console.log(`WebSocket server ready`);
      console.log('Available services:', Object.keys(services).join(', '));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await redisClient.quit();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
