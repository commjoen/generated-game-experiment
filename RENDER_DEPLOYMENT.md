# Render.com Deployment Guide

Deploy your multiplayer platformer game to Render.com with automatic builds, HTTPS, and WebSocket support.

## 🚀 Quick Deploy

### Method 1: Using render.yaml (Recommended)

1. **Fork/Clone** this repository to your GitHub account

2. **Connect to Render**:
   - Go to [render.com](https://render.com) and sign up/login
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

3. **Deploy**:
   - Click "Apply" and wait for the build to complete
   - Your game will be available at `https://your-app-name.onrender.com`

### Method 2: Manual Setup

1. **Create Web Service**:
   - Go to Render Dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure Settings**:
   ```
   Name: platformer-game
   Environment: Docker
   Region: Oregon (or preferred)
   Branch: main
   Dockerfile Path: ./Dockerfile
   ```

3. **Environment Variables** (optional):
   ```
   NODE_ENV=production
   PORT=3001
   ```

4. **Deploy**: Click "Create Web Service"

## 🌐 Render Configuration

### render.yaml Features

```yaml
services:
  - type: web
    name: platformer-game
    env: docker
    plan: starter              # Free tier available
    region: oregon
    autoDeploy: true          # Auto-deploy on git push
    healthCheckPath: /        # Health monitoring
```

### Auto-Detection

The app automatically detects Render deployment:
- ✅ Uses HTTPS/WSS for secure WebSocket connections
- ✅ Configures proper proxy paths for multiplayer
- ✅ Sets up health checks for both game and multiplayer server
- ✅ Handles Render's domain and SSL automatically

## 🎮 How It Works on Render

### Architecture
```
Internet → Render Load Balancer → Your Container
                                 ├─ nginx (port 80) → Game Client
                                 └─ Node.js (port 3001) → Multiplayer Server
```

### URL Structure
- **Game**: `https://your-app.onrender.com/`
- **Multiplayer WebSocket**: `wss://your-app.onrender.com/ws`
- **Health Check**: `https://your-app.onrender.com/mp/health`

### WebSocket Proxying
Nginx automatically proxies WebSocket connections:
```
Client WebSocket Request → nginx → Node.js Multiplayer Server
wss://your-app.onrender.com/ws → localhost:3001
```

## 🔧 Configuration Options

### Environment Variables

Set these in Render Dashboard → Your Service → Environment:

```bash
# Required
NODE_ENV=production

# Optional
PORT=3001                    # Multiplayer server port
RENDER_EXTERNAL_HOSTNAME     # Auto-set by Render
```

### Custom Domain

1. **Add Custom Domain** in Render Dashboard
2. **Update DNS** to point to Render
3. **SSL Certificate** is automatically provisioned
4. **WebSocket** will work automatically at your custom domain

## 📊 Monitoring & Health Checks

### Built-in Health Checks

Render automatically monitors:
- ✅ Main game client (HTTP GET to `/`)
- ✅ Multiplayer server (HTTP GET to `/mp/health`)
- ✅ Container health (Docker HEALTHCHECK)

### Logs

View real-time logs in Render Dashboard:
```bash
# Example log output
🌐 Detected Render.com deployment
✓ Multiplayer server started successfully
✓ Game client started successfully
🎮 Game is available at: https://your-app.onrender.com
🌐 Multiplayer WebSocket: wss://your-app.onrender.com/ws
```

### Metrics

Render provides:
- CPU and Memory usage
- Request count and response times
- Health check status
- Build and deployment history

## 🆓 Free Tier Limitations

Render's free tier includes:
- ✅ 750 hours/month (enough for personal projects)
- ✅ Automatic HTTPS
- ✅ WebSocket support
- ⚠️ Sleeps after 15 minutes of inactivity
- ⚠️ Cold start delay (~30 seconds)

### Handling Sleep Mode

The game handles cold starts gracefully:
1. **Game loads** immediately (static files from CDN)
2. **Multiplayer attempts connection** to server
3. **If server is sleeping**, falls back to single-player mode
4. **When server wakes up**, automatically reconnects

## 🔒 Security & Performance

### HTTPS & WSS

Render automatically provides:
- ✅ SSL/TLS certificates
- ✅ HTTP → HTTPS redirects
- ✅ WebSocket Secure (WSS) connections
- ✅ Modern security headers

### Performance Optimization

```nginx
# Automatic optimizations included:
- Gzip compression
- Static file caching
- WebSocket connection pooling
- Health check monitoring
```

## 🚀 Production Best Practices

### 1. Custom Domain
```bash
# Better than .onrender.com subdomain
your-game.com → Better branding
your-game.com/ws → Clean WebSocket URL
```

### 2. Monitoring
- Set up Render alerts for downtime
- Monitor health check endpoints
- Watch build and deploy logs

### 3. Scaling
```yaml
# Upgrade plan for production:
plan: standard  # No sleep, better performance
instances: 2    # Load balancing
```

### 4. Environment Management
```bash
# Use environment-specific configs
NODE_ENV=production
GAME_VERSION=1.0.0
MULTIPLAYER_ENABLED=true
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Build Fails
```bash
# Check Dockerfile and dependencies
docker build -t test . # Test locally first
```

#### 2. WebSocket Connection Issues
```javascript
// Check browser console for errors
// Verify WSS URL in Network tab
wss://your-app.onrender.com/ws
```

#### 3. Health Check Failures
```bash
# Test endpoints manually
curl https://your-app.onrender.com/
curl https://your-app.onrender.com/mp/health
```

### Debug Steps

1. **Check Render Logs**:
   - Dashboard → Your Service → Logs
   - Look for startup errors

2. **Test Locally**:
   ```bash
   docker build -t platformer-game .
   docker run -p 8080:80 -p 3001:3001 platformer-game
   ```

3. **Verify Health Endpoints**:
   ```bash
   curl https://your-app.onrender.com/
   curl https://your-app.onrender.com/mp/health
   ```

## 📈 Deployment Pipeline

### Automatic Deployments

```bash
git push origin main
│
├─ Render detects push
├─ Triggers build
├─ Runs Docker build
├─ Deploys container
├─ Health checks pass
└─ Goes live automatically
```

### Manual Deployments

- Render Dashboard → Your Service → Manual Deploy
- Or use Render API for CI/CD integration

## 💰 Cost Optimization

### Free Tier Strategy
- Use for development and testing
- Accept sleep limitations
- Monitor usage hours

### Paid Tier Benefits
```
Starter ($7/month):
✅ No sleep
✅ Better performance
✅ Custom domains
✅ More build minutes
```

## 🌟 Advanced Features

### Environment-Based Configuration
```yaml
# render.yaml
envVars:
  - key: GAME_MODE
    value: production
  - key: MULTIPLAYER_ROOMS
    value: 10
```

### Build Optimization
```yaml
buildFilter:
  paths:
    - src/**
    - public/**
    - Dockerfile
    - package.json
# Only rebuild when these files change
```

### Health Check Customization
```yaml
healthCheckPath: /
# Custom health check endpoint
```

## 🎯 Next Steps

1. **Deploy**: Use the render.yaml method
2. **Test**: Verify game and multiplayer work
3. **Monitor**: Check logs and metrics
4. **Scale**: Upgrade plan if needed
5. **Customize**: Add your own domain

Your multiplayer platformer game is now ready for the world! 🎮