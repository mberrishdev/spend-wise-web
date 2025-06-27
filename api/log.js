export default function handler(req, res) {
  if (req.method === 'POST') {
    const { message, data, timestamp } = req.body || {};
    console.log('=== POST /api/log received ===');
    console.log('Timestamp:', timestamp || new Date().toISOString());
    console.log('Message:', message);
    console.log('Data:', data);
    console.log('Request body:', req.body);
    console.log('================================');
    res.status(200).json({
      success: true,
      message: 'Data logged successfully',
      receivedAt: new Date().toISOString(),
      loggedData: { message, data, timestamp: timestamp || new Date().toISOString() },
    });
  } else {
    res.status(200).json({ status: 'OK', info: 'Send a POST request to log data.' });
  }
} 