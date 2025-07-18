const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const cors = require('cors');

// Enable progress logging only in development (not in Docker/Render)
const ENABLE_PROGRESS_LOG =
  process.env.NODE_ENV !== 'production' &&
  !process.env.RENDER &&
  !process.env.DOCKER;

// Create Express app for health checks
const app = express();
const server = http.createServer(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Register collectibles from the client (called at level generation)
app.post('/register-collectibles', express.json(), (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  const collectibles = req.body.collectibles;
  let added = 0;
  if (Array.isArray(collectibles)) {
    collectibles.forEach(c => {
      if (c && c.id && c.type && !gameSession.collectibles.has(c.id)) {
        gameSession.collectibles.set(c.id, {
          id: c.id,
          type: c.type,
          collected: false,
          collectedBy: null,
          timestamp: Date.now()
        });
        added++;
      }
    });
    res.json({ status: 'ok', added });
  } else {
    res.status(400).json({ status: 'error', message: 'Invalid collectibles' });
  }
});

// WebSocket server
const wss = new WebSocket.Server({ server });

// Game state management
class GameSession {
  constructor() {
    this.players = new Map();
    this.collectibles = new Map();
    this.hostId = null;
    this.lastUpdate = Date.now();
    this.joinCount = 0;
    this.lastLoggedScores = new Map(); // Track last logged score per player
  }

  generateDefaultName() {
    this.joinCount++;
    return `Player ${String(this.joinCount).padStart(3, '0')}`;
  }

  addPlayer(playerId, ws, name) {
    const isHost = this.players.size === 0;
    if (isHost) {
      this.hostId = playerId;
    }

    const playerName = (typeof name === 'string' && name.trim()) ? name.trim().slice(0, 12) : this.generateDefaultName();
    this.players.set(playerId, {
      id: playerId,
      ws: ws,
      x: 100,
      y: 350,
      width: 40,
      height: 50,
      growLevel: 0,
      isHost: isHost,
      lastSeen: Date.now(),
      name: playerName,
      score: 0
    });

    console.log(`Player ${playerId} joined (${this.players.size} total players)`);

    // Notify all players about the new player
    this.broadcast({
      type: 'playerJoined',
      playerId: playerId,
      isHost: isHost,
      timestamp: Date.now()
    });

    // Send current game state to the new player
    this.sendGameState(playerId);
  }

  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) return;

    this.players.delete(playerId);
    console.log(`Player ${playerId} left (${this.players.size} total players)`);

    // If the host left, assign a new host
    if (this.hostId === playerId && this.players.size > 0) {
      const newHost = this.players.values().next().value;
      newHost.isHost = true;
      this.hostId = newHost.id;
      console.log(`New host assigned: ${newHost.id}`);
    }

    // Notify remaining players
    this.broadcast({
      type: 'playerLeft',
      playerId: playerId,
      timestamp: Date.now()
    });
  }

  updatePlayerPosition(playerId, position) {
    const player = this.players.get(playerId);
    if (!player) return;

    player.x = position.x;
    player.y = position.y;
    player.width = position.width;
    player.height = position.height;
    player.growLevel = position.growLevel;
    player.lastSeen = Date.now();

    // Only log if position or score changed since last log
    const last = this.lastLoggedScores.get(playerId) || {};
    const positionChanged = last.x !== player.x || last.y !== player.y || last.growLevel !== player.growLevel;
    const scoreChanged = last.score !== player.score;
    if (ENABLE_PROGRESS_LOG && (positionChanged || scoreChanged)) {
      console.log(`[PROGRESS] Player '${player.name}' (${playerId}) moved to x:${player.x}, y:${player.y}, growLevel:${player.growLevel}, score:${player.score || 0}`);
      this.lastLoggedScores.set(playerId, { x: player.x, y: player.y, growLevel: player.growLevel, score: player.score });
    }

    // Broadcast position update to other players, always include name and score
    this.broadcast({
      type: 'playerUpdate',
      playerId: playerId,
      position: position,
      name: player.name,
      score: player.score || 0,
      timestamp: Date.now()
    }, playerId); // Exclude the sender
  }

  collectItem(playerId, collectibleId) {
    // Mark collectible as collected
    const c = this.collectibles.get(collectibleId);
    if (c) {
      c.collected = true;
      c.collectedBy = playerId;
      c.timestamp = Date.now();
    }

    // Increment score only if coin
    const player = this.players.get(playerId);
    let scoreChanged = false;
    if (player && c && c.type === 'coin') {
      const oldScore = player.score || 0;
      player.score = oldScore + 1;
      scoreChanged = player.score !== oldScore;
    }

    // Log collectible collection and score
    if (ENABLE_PROGRESS_LOG && player && c) {
      console.log(`[PROGRESS] Player '${player.name}' (${playerId}) collected '${c.type}' (ID: ${collectibleId}). New score: ${player.score}`);
      // Also log score change immediately
      if (scoreChanged) {
        this.lastLoggedScores.set(playerId, { x: player.x, y: player.y, growLevel: player.growLevel, score: player.score });
      }
    }

    // Notify all players, always include updated name and score
    this.broadcast({
      type: 'itemCollected',
      playerId: playerId,
      collectibleId: collectibleId,
      name: player ? player.name : '',
      score: player ? player.score : 0,
      timestamp: Date.now()
    });
  }

  sendGameState(playerId) {
    const player = this.players.get(playerId);
    if (!player || !player.ws) return;

    const gameState = {
      players: Array.from(this.players.values()).map(p => ({
        id: p.id,
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
        growLevel: p.growLevel,
        isHost: p.isHost,
        name: p.name,
        score: p.score || 0
      })),
      collectibles: Array.from(this.collectibles.values()),
      timestamp: Date.now()
    };

    this.send(player.ws, {
      type: 'gameState',
      gameState: gameState
    });
  }

  broadcast(message, excludePlayerId = null) {
    this.players.forEach((player, playerId) => {
      if (playerId !== excludePlayerId && player.ws) {
        this.send(player.ws, message);
      }
    });
  }

  send(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(data));
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  }

  // Clean up inactive players
  cleanupInactivePlayers() {
    const now = Date.now();
    const timeout = 30000; // 30 seconds

    this.players.forEach((player, playerId) => {
      if (now - player.lastSeen > timeout) {
        console.log(`Removing inactive player: ${playerId}`);
        this.removePlayer(playerId);
      }
    });
  }
}

// Single game session for now (could be extended to multiple rooms)
const gameSession = new GameSession();

// Clean up inactive players every 30 seconds
setInterval(() => {
  gameSession.cleanupInactivePlayers();
}, 30000);

// WebSocket connection handling
wss.on('connection', (ws) => {
  let playerId = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'join':
          playerId = message.playerId;
          gameSession.addPlayer(playerId, ws, message.name);
          break;

        case 'playerUpdate':
          if (playerId && message.position) {
            gameSession.updatePlayerPosition(playerId, message.position);
          }
          break;

        case 'collectItem':
          if (playerId && message.collectibleId) {
            gameSession.collectItem(playerId, message.collectibleId);
          }
          break;

        case 'ping':
          // Respond with pong
          gameSession.send(ws, { type: 'pong', timestamp: Date.now() });
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    if (playerId) {
      gameSession.removePlayer(playerId);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    if (playerId) {
      gameSession.removePlayer(playerId);
    }
  });
});

app.use(cors());

//const PORT = process.env.PORT || 3001;
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Multiplayer server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log(`WebSocket server listening for connections`);
});