// Load environment variables first
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Debug environment variables
console.log('Environment:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '***' + process.env.SUPABASE_URL.slice(-8) : 'Not set');
console.log('- N8N_WEBHOOK_URL:', process.env.N8N_WEBHOOK_URL ? 'Set' : 'Not set');

const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');

// Initialize express app
const app = express();
const apiRouter = express.Router();

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${method} ${originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*', // In production, replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  console.log('Health check called');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    node_env: process.env.NODE_ENV,
    db_connected: true,
    routes: ['/api/health', '/api/students', '/api/student/:id', '/api/daily-checkin']
  });
});

// API Routes
apiRouter.use('/daily-checkin', require('./dailyCheckin'));
apiRouter.use('/assign-intervention', require('./assignIntervention'));
apiRouter.use('/complete-task', require('./completeTask'));
apiRouter.use('/student', require('./getStudent'));
apiRouter.use('/students', require('./students'));

// API 404 handler
apiRouter.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use('/api', apiRouter);

// Root route for sanity checks
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'FocusLoop API',
    status: 'ok',
    docs: '/api/health'
  });
});

// Catch-all 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;  // Changed to 3001 to avoid conflicts
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`- Health check: http://localhost:${PORT}/api/health`);
    console.log(`- Create student: POST http://localhost:${PORT}/api/students`);
    console.log(`- List students:  GET http://localhost:${PORT}/api/students`);
  });
}

// Export for Vercel
module.exports = app;
module.exports.handler = serverless(app);
