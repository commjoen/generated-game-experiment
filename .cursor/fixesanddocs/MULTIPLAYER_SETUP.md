# Multiplayer Setup (Single Container)

This platformer game now includes **optional multiplayer functionality** that runs entirely within a single Docker container. The game is designed to work perfectly in single-player mode if multiplayer is not available.

## Key Features

- ✅ **Always works in single-player mode** - even if multiplayer server fails
- 🎮 **Optional multiplayer** - automatically detects and enables when available
- 🐳 **Single container** - no need for Docker Compose
- 🔄 **Auto-reconnection** - attempts to reconnect if multiplayer connection drops
- 🚀 **Zero configuration** - works out of the box

## Quick Start

### Single Container (Recommended)

Build and run everything in one container:

```bash
# Build the container
docker build -t platformer-game .

# Run the container
docker run -p 8080:80 -p 3001:3001 platformer-game
```

The game will be available at:
- **Game**: http://localhost:8080
- **Multiplayer**: Automatically detected and enabled

### Development Mode

For development with hot reload:

```bash
# Install dependencies
npm install

# Start development server (game only)
npm run dev

# In another terminal, start multiplayer server
cd server
npm install
npm start
```

## How It Works

### Single Container Architecture

```
┌─────────────────────────────────────┐
│           Docker Container          │
├─────────────────────────────────────┤
│  nginx (port 80)                    │
│  ├─ Serves game client              │
│  └─ Proxies /mp/* to Node.js server │
│                                     │
│  Node.js Server (port 3001)        │
│  ├─ WebSocket multiplayer server    │
│  └─ Health check endpoint          │
└─────────────────────────────────────┘
```

### Multiplayer Detection

The game automatically:

1. **Detects the environment** (development vs Docker)
2. **Attempts to connect** to the multiplayer server
3. **Falls back gracefully** to single-player if connection fails
4. **Continues working** even if multiplayer server stops

### Connection Logic

```javascript
// Auto-detection based on current URL
Development (localhost:5173) → ws://localhost:3001
Docker (localhost:8080)     → ws://localhost:3001
Production                  → wss://yourdomain:3001
```

## Container Startup Process

1. **Multiplayer server starts** in background (Node.js on port 3001)
2. **Health check** verifies server is running
3. **Nginx starts** serving the game (port 80)
4. **Game connects** to multiplayer server automatically
5. **Falls back** to single-player if connection fails

## Multiplayer Features

- **Real-time player positions** - see other players moving around
- **Shared collectibles** - items collected by one player affect all players
- **Host/client roles** - first player becomes the host
- **Automatic cleanup** - removes inactive players after 30 seconds
- **Connection resilience** - attempts reconnection with exponential backoff

## Configuration

### Environment Variables

```bash
# Optional: Override multiplayer server port
PORT=3001

# Optional: Set Node environment
NODE_ENV=production
```

### Docker Run Options

```bash
# Basic run
docker run -p 8080:80 -p 3001:3001 platformer-game

# With environment variables
docker run -p 8080:80 -p 3001:3001 -e PORT=3001 platformer-game

# With custom name
docker run --name my-platformer -p 8080:80 -p 3001:3001 platformer-game
```

## Health Checks

The container includes built-in health checks:

```bash
# Check if both services are running
curl http://localhost:8080         # Game client
curl http://localhost:3001/health  # Multiplayer server
```

Docker health check runs automatically and verifies both services.

## Troubleshooting

### Game Works, Multiplayer Doesn't

This is expected behavior! The game is designed to work without multiplayer.

Check multiplayer server:
```bash
curl http://localhost:3001/health
```

### Connection Issues

1. **Firewall**: Ensure ports 80 and 3001 are open
2. **Browser console**: Check for WebSocket connection errors
3. **Server logs**: `docker logs <container-name>`

### Container Won't Start

```bash
# Check container logs
docker logs <container-name>

# Check if ports are already in use
netstat -tulpn | grep :8080
netstat -tulpn | grep :3001
```

## Security Notes

- The multiplayer server runs locally within the container
- No external dependencies required
- WebSocket connections are direct (no authentication in this demo)
- For production, consider adding authentication and rate limiting

## Production Deployment

For production deployment:

1. **Use HTTPS/WSS** for secure WebSocket connections
2. **Configure firewall** to allow necessary ports
3. **Add authentication** for multiplayer sessions
4. **Monitor health checks** for service availability
5. **Consider load balancing** for multiple containers

Example production run:
```bash
docker run -d \
  --name platformer-game \
  --restart unless-stopped \
  -p 80:80 \
  -p 3001:3001 \
  platformer-game
```

## Architecture Benefits

- ✅ **Simplified deployment** - single container, no orchestration
- ✅ **Graceful degradation** - works without multiplayer
- ✅ **Auto-recovery** - reconnects when possible
- ✅ **Development friendly** - easy to test locally
- ✅ **Production ready** - health checks and proper shutdown