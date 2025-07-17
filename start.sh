#!/bin/sh

echo "Starting multiplayer platformer game container..."

# Detect if running on Render (Render sets RENDER environment variable)
if [ -n "$RENDER" ] || [ -n "$RENDER_EXTERNAL_HOSTNAME" ]; then
    echo "🌐 Detected Render.com deployment"
    export IS_RENDER=true
    # Use Render-optimized nginx config
    cp /etc/nginx/nginx-render.conf /etc/nginx/nginx.conf 2>/dev/null || echo "Using default nginx config"
    
    # Set WebSocket URL for Render
    export WS_URL="wss://${RENDER_EXTERNAL_HOSTNAME:-$RENDER_EXTERNAL_URL}/ws"
    echo "🔗 WebSocket URL: $WS_URL"
else
    echo "🐳 Local/Docker deployment"
    export IS_RENDER=false
fi

# Start the multiplayer server in background
echo "Starting multiplayer server on port 3001..."
cd /app
node server.js &
SERVER_PID=$!

# Wait a moment for server to start
sleep 2

# Check if multiplayer server started successfully
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✓ Multiplayer server started successfully (PID: $SERVER_PID)"
else
    echo "⚠ Multiplayer server failed to start, but continuing with game-only mode"
fi

# Start nginx in the foreground
echo "Starting game client on port 80..."
nginx -g "daemon off;" &
NGINX_PID=$!

echo "✓ Game client started successfully"
echo ""
if [ "$IS_RENDER" = "true" ]; then
    echo "🎮 Game is available at: https://${RENDER_EXTERNAL_HOSTNAME:-your-app}.onrender.com"
    echo "🌐 Multiplayer WebSocket: wss://${RENDER_EXTERNAL_HOSTNAME:-your-app}.onrender.com/ws"
else
    echo "🎮 Game is available at: http://localhost:80"
    echo "🌐 Multiplayer server at: http://localhost:3001"
fi
echo ""
echo "The game will work in single-player mode even if multiplayer server fails."

# Function to handle shutdown
shutdown() {
    echo ""
    echo "Shutting down services..."
    kill $SERVER_PID 2>/dev/null
    kill $NGINX_PID 2>/dev/null
    wait $SERVER_PID 2>/dev/null
    wait $NGINX_PID 2>/dev/null
    echo "Services stopped."
    exit 0
}

# Trap signals for graceful shutdown
trap shutdown SIGTERM SIGINT

# Wait for nginx (main process)
wait $NGINX_PID