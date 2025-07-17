#!/bin/sh

echo "Starting multiplayer platformer game container..."

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
echo "🎮 Game is available at: http://localhost:80"
echo "🌐 Multiplayer server at: http://localhost:3001"
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