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

// POST endpoint for transactions
app.post('/api/transactions', (req, res) => {
  const { userId, transactions } = req.body;
  
  // Validate required fields
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'userId is required'
    });
  }
  
  if (!transactions || !Array.isArray(transactions)) {
    return res.status(400).json({
      success: false,
      message: 'transactions must be an array'
    });
  }
  
  // Log the received data
  console.log('=== POST /api/transactions received ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('UserId:', userId);
  console.log('Number of transactions:', transactions.length);
  console.log('Transactions:');
  
  transactions.forEach((transaction, index) => {
    console.log(`  Transaction ${index + 1}:`);
    console.log(`    ID: ${transaction.id}`);
    console.log(`    Date: ${transaction.date}`);
    console.log(`    Description: ${transaction.description}`);
    console.log(`    Amount: ${transaction.amount}`);
    console.log(`    Currency: ${transaction.currency}`);
    console.log(`    Entry Type: ${transaction.entryType}`);
    console.log(`    Status: ${transaction.status}`);
    console.log('');
  });
  
  console.log('Full request body:', req.body);
  console.log('================================');
  
  res.status(200).json({
    success: true,
    message: 'Transactions logged successfully',
    receivedAt: new Date().toISOString(),
    loggedData: {
      userId,
      transactionCount: transactions.length,
      transactions: transactions
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
      'POST /api/transactions': 'Log transactions for a user',
      'GET /api/health': 'Health check endpoint'
    }
  });
});

// Only start the server if we're not in a serverless environment
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Express.js server running on port ${PORT}`);
    console.log(`📝 POST endpoint available at: http://localhost:${PORT}/api/log`);
    console.log(`💳 Transactions endpoint at: http://localhost:${PORT}/api/transactions`);
    console.log(`🏥 Health check at: http://localhost:${PORT}/api/health`);
  });
}

// Export for Vercel serverless functions
module.exports = app; 