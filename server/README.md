# Spend Wise Express.js Server

A simple Express.js server with a POST endpoint that logs data.

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Start the server:
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on port 3001 (or the PORT environment variable if set).

## Endpoints

### POST /api/log
Logs data to the server console.

**Request Body:**
```json
{
  "message": "Your log message",
  "data": {
    "key": "value",
    "anotherKey": "anotherValue"
  },
  "timestamp": "2024-01-01T00:00:00.000Z" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data logged successfully",
  "receivedAt": "2024-01-01T00:00:00.000Z",
  "loggedData": {
    "message": "Your log message",
    "data": {
      "key": "value",
      "anotherKey": "anotherValue"
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /api/health
Health check endpoint.

### GET /
Server information and available endpoints.

## Testing the POST endpoint

You can test the POST endpoint using curl:

```bash
curl -X POST http://localhost:3001/api/log \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test log message",
    "data": {
      "userId": 123,
      "action": "login",
      "ip": "192.168.1.1"
    }
  }'
```

Or using JavaScript fetch:

```javascript
fetch('http://localhost:3001/api/log', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Test log message',
    data: {
      userId: 123,
      action: 'login',
      ip: '192.168.1.1'
    }
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## Features

- **CORS enabled** - Allows cross-origin requests
- **JSON body parsing** - Automatically parses JSON request bodies
- **Request logging** - Uses Morgan for HTTP request logging
- **Console logging** - Logs all POST data to the server console
- **Health check** - Built-in health check endpoint 