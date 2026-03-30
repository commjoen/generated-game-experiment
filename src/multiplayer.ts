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
  collectibles: Array<{
    x: number;
    y: number;
    collected: boolean;
    type: string;
    id: string;
  }>;
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

  // WebRTC peer-to-peer support
  private webRTCEnabled = false;
  private peerConnections = new Map<string, RTCPeerConnection>();
  private dataChannels = new Map<string, RTCDataChannel>();

  constructor() {
    this.playerId = this.generatePlayerId();
    this.webRTCEnabled = typeof RTCPeerConnection !== 'undefined';
  }

  private generatePlayerId(): string {
    return 'player_' + Math.random().toString(36).substr(2, 9);
  }

  // Check if multiplayer server is available (optional)
  async checkServerAvailable(
    serverUrl: string = this.getDefaultServerUrl()
  ): Promise<boolean> {
    try {
      // For relative /ws, use /mp/health
      if (serverUrl === '/ws') {
        const response = await fetch('/mp/health', {
          method: 'GET',
          signal: AbortSignal.timeout(2000),
        });
        return response.ok;
      }
      // Otherwise, use the old logic
      const httpUrl = serverUrl
        .replace('ws://', 'http://')
        .replace('wss://', 'https://');
      let healthUrl: string;
      if (httpUrl.includes('/ws')) {
        healthUrl = httpUrl.replace('/ws', '/mp/health');
      } else {
        healthUrl = `${httpUrl}/health`;
      }
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      return response.ok;
    } catch (_error) {
      console.log(
        'Multiplayer server not available, running in single-player mode'
      );
      return false;
    }
  }

  private getDefaultServerUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const hostname = window.location.hostname;
    // Render.com or any production: always use relative /ws
    if (
      hostname === 'onrender.com' ||
      hostname.endsWith('.onrender.com') ||
      !host.includes('localhost')
    ) {
      return '/ws';
    }
    // If running in development (localhost:5173), try local server
    if (host.includes('localhost:5173') || host.includes('127.0.0.1:5173')) {
      return 'ws://localhost:3001';
    }
    // If running in Docker container locally, use direct connection to port 3001
    if (
      host.includes(':8080') ||
      (hostname === 'localhost' && host.includes(':80'))
    ) {
      const baseHostname = host.split(':')[0];
      return `${protocol}//${baseHostname}:3001`;
    }
    // Default fallback for HTTP
    return `${protocol}//${host}:3001`;
  }

  // Initialize multiplayer connection (optional)
  async initialize(
    serverUrl: string = this.getDefaultServerUrl()
  ): Promise<boolean> {
    try {
      // First check if server is available
      const serverAvailable = await this.checkServerAvailable(serverUrl);
      if (!serverAvailable) {
        console.log(
          'Multiplayer server not available, continuing in single-player mode'
        );
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
          // Get playerName from localStorage or default
          let playerName = '';
          try {
            playerName = localStorage.getItem('playerName') || '';
          } catch {
            // Ignore localStorage errors
          }
          this.send({
            type: 'join',
            playerId: this.playerId,
            name: playerName,
            timestamp: Date.now(),
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

        this.ws.onerror = (_error) => {
          clearTimeout(timeout);
          console.log('WebSocket error, falling back to single-player mode');
          this.isConnected = false;
          resolve(false);
        };
      });
    } catch (_error) {
      console.log(
        'Failed to initialize multiplayer, continuing in single-player mode'
      );
      return false;
    }
  }

  private attemptReconnect(serverUrl: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );

      setTimeout(() => {
        this.initialize(serverUrl);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.log(
        'Max reconnection attempts reached, continuing in single-player mode'
      );
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
        } else if (this.webRTCEnabled) {
          // Another player joined – we are the initiator of the WebRTC connection
          this.initWebRTCConnection(data.playerId, true);
        }
        if (this.onPlayerJoin) {
          this.onPlayerJoin(data.playerId);
        }
        break;
      case 'playerLeft':
        if (this.webRTCEnabled) {
          this.cleanupPeerConnection(data.playerId);
        }
        if (this.onPlayerLeave) {
          this.onPlayerLeave(data.playerId);
        }
        break;
      case 'playerUpdate':
        if (this._onPlayerUpdate) {
          this._onPlayerUpdate(
            data.playerId,
            data.position,
            data.score,
            data.name
          );
        }
        break;
      case 'itemCollected':
        if (this._onPlayerUpdate) {
          this._onPlayerUpdate(data.playerId, {}, data.score, data.name);
        }
        break;
      case 'rtcSignal':
        if (this.webRTCEnabled) {
          this.handleRTCSignal(data.fromId, data.signal);
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
  updatePlayerPosition(
    x: number,
    y: number,
    width: number,
    height: number,
    growLevel: number
  ) {
    if (!this.isConnected) return;

    const message = {
      type: 'playerUpdate',
      playerId: this.playerId,
      position: { x, y, width, height, growLevel },
      timestamp: Date.now(),
    };

    // Prefer direct peer DataChannels for lower-latency position updates
    let sentViaPeer = false;
    this.dataChannels.forEach((dc) => {
      if (dc.readyState === 'open') {
        try {
          dc.send(JSON.stringify(message));
          sentViaPeer = true;
        } catch (_e) {
          // DataChannel may have closed unexpectedly; fall through to WS
        }
      }
    });

    // Fall back to WebSocket relay when no DataChannels are open yet
    if (!sentViaPeer) {
      this.send(message);
    }
  }

  // Send collectible pickup
  collectItem(collectibleId: string) {
    if (!this.isConnected) return;
    this.send({
      type: 'collectItem',
      playerId: this.playerId,
      collectibleId,
      timestamp: Date.now(),
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

  private _onPlayerUpdate?: (
    playerId: string,
    position: any,
    score?: number,
    name?: string
  ) => void;
  /**
   * Register a callback for player position updates.
   * @param callback (playerId: string, position: any) => void
   */
  onPlayerUpdate(
    callback: (
      playerId: string,
      position: any,
      score?: number,
      name?: string
    ) => void
  ): void {
    this._onPlayerUpdate = callback;
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

  // WebRTC peer-to-peer connection management

  private async initWebRTCConnection(
    peerId: string,
    isInitiator: boolean
  ): Promise<void> {
    if (this.peerConnections.has(peerId)) return; // Already connected

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      this.peerConnections.set(peerId, pc);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.send({
            type: 'rtcSignal',
            targetId: peerId,
            signal: { type: 'ice-candidate', candidate: event.candidate },
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === 'failed' ||
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'closed'
        ) {
          this.cleanupPeerConnection(peerId);
        }
      };

      if (isInitiator) {
        const dc = pc.createDataChannel('game', { ordered: true });
        this.setupDataChannel(dc, peerId);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.send({
          type: 'rtcSignal',
          targetId: peerId,
          signal: { type: 'offer', sdp: pc.localDescription },
        });
      } else {
        pc.ondatachannel = (event) => {
          this.setupDataChannel(event.channel, peerId);
        };
      }
    } catch (error) {
      console.error(`WebRTC connection to ${peerId} failed:`, error);
      this.cleanupPeerConnection(peerId);
    }
  }

  private setupDataChannel(dc: RTCDataChannel, peerId: string): void {
    this.dataChannels.set(peerId, dc);

    dc.onopen = () => {
      console.log(`WebRTC DataChannel opened with peer ${peerId}`);
    };

    dc.onclose = () => {
      this.dataChannels.delete(peerId);
    };

    dc.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        // Only handle position updates via DataChannel to avoid duplicate
        // processing of authoritative server messages (scores, item collection, etc.)
        if (data.type === 'playerUpdate') {
          this.handleMessage(data);
        }
      } catch (_e) {
        // Ignore malformed messages
      }
    };
  }

  private async handleRTCSignal(fromId: string, signal: any): Promise<void> {
    try {
      if (signal.type === 'offer') {
        await this.initWebRTCConnection(fromId, false);
        const pc = this.peerConnections.get(fromId);
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.send({
          type: 'rtcSignal',
          targetId: fromId,
          signal: { type: 'answer', sdp: pc.localDescription },
        });
      } else if (signal.type === 'answer') {
        const pc = this.peerConnections.get(fromId);
        if (pc) {
          await pc.setRemoteDescription(
            new RTCSessionDescription(signal.sdp)
          );
        }
      } else if (signal.type === 'ice-candidate') {
        const pc = this.peerConnections.get(fromId);
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      }
    } catch (error) {
      console.error(`WebRTC signaling error from ${fromId}:`, error);
    }
  }

  private cleanupPeerConnection(peerId: string): void {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }
    const dc = this.dataChannels.get(peerId);
    if (dc) {
      dc.close();
      this.dataChannels.delete(peerId);
    }
  }

  // Returns true when at least one WebRTC DataChannel is open
  get webRTCConnected(): boolean {
    for (const dc of this.dataChannels.values()) {
      if (dc.readyState === 'open') return true;
    }
    return false;
  }

  // Disconnect
  disconnect() {
    // Close all WebRTC peer connections
    this.peerConnections.forEach((_pc, peerId) => {
      this.cleanupPeerConnection(peerId);
    });
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
