# Deployment Guide - Spend Wise

This guide explains how to deploy your Spend Wise application (frontend + backend) to Vercel.

## 🚀 Quick Deploy to Vercel

### Option 1: Deploy Everything Together (Recommended)

1. **Push your code to GitHub**
2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect the configuration

3. **Deploy**: Vercel will build and deploy both frontend and backend automatically

### Option 2: Manual Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## 🌐 URL Structure After Deployment

After deployment, you'll have:

- **Frontend**: `https://your-app.vercel.app`
- **Backend API**: `https://your-app.vercel.app/api/log`
- **Health Check**: `https://your-app.vercel.app/api/health`

**Same domain!** ✅ Both frontend and backend will be on the same URL.

## 📁 Project Structure for Vercel

```
spend-wise/
├── src/                    # Frontend (Vite React)
├── server/                 # Backend (Express.js)
├── api/                    # Vercel serverless functions
│   ├── log.js
│   └── health.js
├── vercel.json            # Vercel configuration
├── package.json           # Frontend dependencies
└── server/package.json    # Backend dependencies
```

## 🔧 Configuration Files

### vercel.json
Routes API requests to the backend and serves the frontend:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    },
    {
      "src": "server/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## 🔄 Frontend-Backend Communication

### Development (Local)
```javascript
// Frontend calls backend
fetch('http://localhost:3001/api/log', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello', data: {} })
})
```

### Production (Vercel)
```javascript
// Frontend calls backend (same domain!)
fetch('/api/log', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello', data: {} })
})
```

## 🛠️ Alternative Hosting Options

### 1. **Railway** (Good for full-stack)
- Deploy both frontend and backend
- Separate URLs for each
- Easy database integration

### 2. **Render** (Good for full-stack)
- Free tier available
- Automatic deployments
- Separate services for frontend/backend

### 3. **Netlify + Railway**
- Netlify: Frontend hosting
- Railway: Backend hosting
- Different URLs, need CORS configuration

### 4. **Heroku** (Paid)
- Deploy both together
- Good for full-stack applications

## 🔍 Testing Your Deployment

### Test the API
```bash
# Test the deployed API
curl -X POST https://your-app.vercel.app/api/log \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from production!", "data": {"test": true}}'
```

### Test the Frontend
Visit `https://your-app.vercel.app` to see your React app.

## 📊 Environment Variables

If you need environment variables:

1. **Vercel Dashboard**: Go to your project settings
2. **Environment Variables**: Add any needed variables
3. **Redeploy**: Changes will be applied automatically

## 🐛 Troubleshooting

### Common Issues:

1. **API not working**: Check if routes are correctly configured in `vercel.json`
2. **Build fails**: Ensure all dependencies are in the correct `package.json`
3. **CORS errors**: Shouldn't happen with same-domain deployment

### Debug Commands:
```bash
# Check Vercel logs
vercel logs

# Redeploy
vercel --prod
```

## 💡 Pro Tips

1. **Use relative URLs** in your frontend code for API calls
2. **Test locally** with `npm run dev` before deploying
3. **Check Vercel logs** if something doesn't work
4. **Use environment variables** for sensitive data

## 🎯 Summary

- ✅ **Same URL** for frontend and backend
- ✅ **Automatic deployments** from GitHub
- ✅ **Free hosting** with Vercel
- ✅ **Easy scaling** as your app grows
- ✅ **Built-in analytics** and monitoring

Your Spend Wise app will be live at `https://your-app.vercel.app` with both frontend and backend working seamlessly together! 