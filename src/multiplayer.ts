interface PlayerState {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  growLevel: number;
  isHost?: boolean;
}

interface GameState {
  players: Map<string, PlayerState>;
  collectibles: Array<{ x: number; y: number; collected: boolean; type: string; id: string }>;
  timestamp: number;
}

export class MultiplayerManager {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private playerId: string;
  private isHost = false;
  private onStateUpdate?: (gameState: GameState) => void;
  private onPlayerJoin?: (playerId: string) => void;
  private onPlayerLeave?: (playerId: string) => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 1000;

  constructor() {
    this.playerId = this.generatePlayerId();
  }

  private generatePlayerId(): string {
    return 'player_' + Math.random().toString(36).substr(2, 9);
  }

  // Check if multiplayer server is available (optional)
  async checkServerAvailable(serverUrl: string = this.getDefaultServerUrl()): Promise<boolean> {
    try {
      // Try to make a quick HTTP request to check if server is running
      const httpUrl = serverUrl.replace('ws://', 'http://').replace('wss://', 'https://');
      const healthUrl = httpUrl.includes('/mp') ? `${httpUrl}/health` : `${httpUrl}/health`;
      
      const response = await fetch(healthUrl, { 
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      return response.ok;
    } catch (error) {
      console.log('Multiplayer server not available, running in single-player mode');
      return false;
    }
  }

  private getDefaultServerUrl(): string {
    // Auto-detect the WebSocket URL based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    
    // If running in development (localhost:5173), try local server
    if (host.includes('localhost:5173') || host.includes('127.0.0.1:5173')) {
      return 'ws://localhost:3001';
    }
    
    // If running in Docker container, use direct connection to port 3001
    if (host.includes(':8080') || host.includes(':80')) {
      const hostname = host.split(':')[0];
      return `${protocol}//${hostname}:3001`;
    }
    
    // Default fallback
    return `${protocol}//${host}:3001`;
  }

  // Initialize multiplayer connection (optional)
  async initialize(serverUrl: string = this.getDefaultServerUrl()): Promise<boolean> {
    try {
      // First check if server is available
      const serverAvailable = await this.checkServerAvailable(serverUrl);
      if (!serverAvailable) {
        console.log('Multiplayer server not available, continuing in single-player mode');
        return false;
      }

      this.ws = new WebSocket(serverUrl);
      
      return new Promise<boolean>((resolve) => {
        if (!this.ws) {
          resolve(false);
          return;
        }

        const timeout = setTimeout(() => {
          console.log('Connection timeout, falling back to single-player mode');
          this.disconnect();
          resolve(false);
        }, 5000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('Connected to multiplayer server');
          
          // Send join message
          this.send({
            type: 'join',
            playerId: this.playerId,
            timestamp: Date.now()
          });
          
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          console.log('Disconnected from multiplayer server');
          this.attemptReconnect(serverUrl);
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          console.log('WebSocket error, falling back to single-player mode');
          this.isConnected = false;
          resolve(false);
        };
      });
    } catch (error) {
      console.log('Failed to initialize multiplayer, continuing in single-player mode');
      return false;
    }
  }

  private attemptReconnect(serverUrl: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.initialize(serverUrl);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.log('Max reconnection attempts reached, continuing in single-player mode');
    }
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'gameState':
        if (this.onStateUpdate) {
          this.onStateUpdate(data.gameState);
        }
        break;
      case 'playerJoined':
        if (data.playerId === this.playerId) {
          this.isHost = data.isHost || false;
        }
        if (this.onPlayerJoin) {
          this.onPlayerJoin(data.playerId);
        }
        break;
      case 'playerLeft':
        if (this.onPlayerLeave) {
          this.onPlayerLeave(data.playerId);
        }
        break;
      case 'pong':
        // Handle ping/pong for connection health
        break;
    }
  }

  private send(data: any) {
    if (this.ws && this.isConnected) {
      try {
        this.ws.send(JSON.stringify(data));
      } catch (error) {
        console.error('Error sending message:', error);
        this.isConnected = false;
      }
    }
  }

  // Send player position update
  updatePlayerPosition(x: number, y: number, width: number, height: number, growLevel: number) {
    if (!this.isConnected) return;

    this.send({
      type: 'playerUpdate',
      playerId: this.playerId,
      position: { x, y, width, height, growLevel },
      timestamp: Date.now()
    });
  }

  // Send collectible pickup
  collectItem(collectibleId: string) {
    if (!this.isConnected) return;

    this.send({
      type: 'collectItem',
      playerId: this.playerId,
      collectibleId,
      timestamp: Date.now()
    });
  }

  // Event handlers
  onGameStateUpdate(callback: (gameState: GameState) => void) {
    this.onStateUpdate = callback;
  }

  onPlayerJoined(callback: (playerId: string) => void) {
    this.onPlayerJoin = callback;
  }

  onPlayerLeft(callback: (playerId: string) => void) {
    this.onPlayerLeave = callback;
  }

  // Getters
  get connected(): boolean {
    return this.isConnected;
  }

  get currentPlayerId(): string {
    return this.playerId;
  }

  get isHostPlayer(): boolean {
    return this.isHost;
  }

  // Disconnect
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  // Send ping to keep connection alive
  ping() {
    if (this.isConnected) {
      this.send({ type: 'ping', timestamp: Date.now() });
    }
  }
}

// Export a singleton instance
export const multiplayerManager = new MultiplayerManager();