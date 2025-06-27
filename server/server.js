const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined')); // HTTP request logger

// POST endpoint that logs something
app.post('/api/log', (req, res) => {
  const { message, data, timestamp } = req.body;
  
  // Log the received data
  console.log('=== POST /api/log received ===');
  console.log('Timestamp:', timestamp || new Date().toISOString());
  console.log('Message:', message);
  console.log('Data:', data);
  console.log('Request body:', req.body);
  console.log('================================');
  
  // You can also log to a file or database here
  // For example, you could write to a log file:
  // fs.appendFileSync('server.log', `${new Date().toISOString()} - ${JSON.stringify(req.body)}\n`);
  
  res.status(200).json({
    success: true,
    message: 'Data logged successfully',
    receivedAt: new Date().toISOString(),
    loggedData: {
      message,
      data,
      timestamp: timestamp || new Date().toISOString()
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Spend Wise Express.js Server',
    endpoints: {
      'POST /api/log': 'Log data to server console',
      'GET /api/health': 'Health check endpoint'
    }
  });
});

// Only start the server if we're not in a serverless environment
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Express.js server running on port ${PORT}`);
    console.log(`📝 POST endpoint available at: http://localhost:${PORT}/api/log`);
    console.log(`🏥 Health check at: http://localhost:${PORT}/api/health`);
  });
}

// Export for Vercel serverless functions
module.exports = app; 