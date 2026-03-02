import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { connectDB } from './config/db.js';
import { initializeAI } from './config/ai.js';
import replyRouter from './routes/reply.js';
import ticketsRouter from './routes/tickets.js';
import assistantRouter from './routes/assistant.js';
import authRouter from './routes/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5001;
const useHTTPS = process.env.NODE_HTTPS === '1' || process.env.NODE_HTTPS === 'true';

// CORS: allow HTTPS and HTTP origins (e.g. when UI runs with Vite HTTPS)
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((u) => u.trim()).filter(Boolean)
  : [
      'http://localhost:5173',
      'https://localhost:5173',
      'http://localhost:5174',
      'https://localhost:5174',
      'http://localhost:3000',
      'https://localhost:3000',
      'http://127.0.0.1:5173',
      'https://127.0.0.1:5173',
    ];
function corsOrigin(origin, cb) {
  if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
  if (allowedOrigins.some((o) => o.startsWith('*'))) return cb(null, true);
  cb(null, false);
}
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint  
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'medivoice-api',
    version: process.env.APP_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/reply', replyRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/auth', authRouter);
app.use('/assistant', assistantRouter);

// Default API endpoint (GET only; POST etc. fall through to 404)
app.get('/api', (req, res) => {
  res.json({ message: 'LanChain Backend API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Optional HTTPS: cert paths from env or node-service/.cert (same certs as client/.cert for local dev)
function getHttpsOptions() {
  const certDir = path.join(__dirname, '..', '.cert');
  const keyPath = process.env.SSL_KEY_PATH || path.join(certDir, 'key.pem');
  const certPath = process.env.SSL_CERT_PATH || path.join(certDir, 'cert.pem');
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) return null;
  return {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
}

const httpsOptions = useHTTPS ? getHttpsOptions() : null;
if (useHTTPS && !httpsOptions) {
  console.warn('NODE_HTTPS is set but SSL key/cert not found. Set SSL_KEY_PATH and SSL_CERT_PATH or add .cert/key.pem and .cert/cert.pem. Falling back to HTTP.');
}

// Initialize and start server
async function startServer() {
  try {
    // Initialize Google AI
    console.log('Initializing Google AI...');
    initializeAI();
    console.log('✓ Google AI initialized');

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('✓ MongoDB connected');

    const protocol = httpsOptions ? 'https' : 'http';
    const server = httpsOptions
      ? https.createServer(httpsOptions, app)
      : http.createServer(app);

    server.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║  LanChain Backend Server Started       ║
║  Port: ${PORT}                             ║
║  Protocol: ${protocol}                          ║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(25)} ║
║  Health: ${protocol}://localhost:${PORT}/health    ║
╚════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the server
startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
