export class MultiplayerManager {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.isHost = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.reconnectDelay = 1000;
        this.playerId = this.generatePlayerId();
    }
    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9);
    }
    // Check if multiplayer server is available (optional)
    async checkServerAvailable(serverUrl = this.getDefaultServerUrl()) {
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
            let healthUrl;
            if (httpUrl.includes('/ws')) {
                healthUrl = httpUrl.replace('/ws', '/mp/health');
            }
            else {
                healthUrl = `${httpUrl}/health`;
            }
            const response = await fetch(healthUrl, {
                method: 'GET',
                signal: AbortSignal.timeout(2000),
            });
            return response.ok;
        }
        catch (_error) {
            console.log('Multiplayer server not available, running in single-player mode');
            return false;
        }
    }
    getDefaultServerUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const hostname = window.location.hostname;
        // Render.com or any production: always use relative /ws
        if (hostname === 'onrender.com' ||
            hostname.endsWith('.onrender.com') ||
            !host.includes('localhost')) {
            return '/ws';
        }
        // If running in development (localhost:5173), try local server
        if (host.includes('localhost:5173') || host.includes('127.0.0.1:5173')) {
            return 'ws://localhost:3001';
        }
        // If running in Docker container locally, use direct connection to port 3001
        if (host.includes(':8080') ||
            (hostname === 'localhost' && host.includes(':80'))) {
            const baseHostname = host.split(':')[0];
            return `${protocol}//${baseHostname}:3001`;
        }
        // Default fallback for HTTP
        return `${protocol}//${host}:3001`;
    }
    // Initialize multiplayer connection (optional)
    async initialize(serverUrl = this.getDefaultServerUrl()) {
        try {
            // First check if server is available
            const serverAvailable = await this.checkServerAvailable(serverUrl);
            if (!serverAvailable) {
                console.log('Multiplayer server not available, continuing in single-player mode');
                return false;
            }
            this.ws = new WebSocket(serverUrl);
            return new Promise((resolve) => {
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
                    }
                    catch {
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
                    }
                    catch (error) {
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
        }
        catch (_error) {
            console.log('Failed to initialize multiplayer, continuing in single-player mode');
            return false;
        }
    }
    attemptReconnect(serverUrl) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => {
                this.initialize(serverUrl);
            }, this.reconnectDelay * this.reconnectAttempts);
        }
        else {
            console.log('Max reconnection attempts reached, continuing in single-player mode');
        }
    }
    handleMessage(data) {
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
            case 'playerUpdate':
                if (this._onPlayerUpdate) {
                    this._onPlayerUpdate(data.playerId, data.position, data.score, data.name);
                }
                break;
            case 'itemCollected':
                if (this._onPlayerUpdate) {
                    this._onPlayerUpdate(data.playerId, {}, data.score, data.name);
                }
                break;
            case 'pong':
                // Handle ping/pong for connection health
                break;
        }
    }
    send(data) {
        if (this.ws && this.isConnected) {
            try {
                this.ws.send(JSON.stringify(data));
            }
            catch (error) {
                console.error('Error sending message:', error);
                this.isConnected = false;
            }
        }
    }
    // Send player position update
    updatePlayerPosition(x, y, width, height, growLevel) {
        if (!this.isConnected)
            return;
        this.send({
            type: 'playerUpdate',
            playerId: this.playerId,
            position: { x, y, width, height, growLevel },
            timestamp: Date.now(),
        });
    }
    // Send collectible pickup
    collectItem(collectibleId) {
        if (!this.isConnected)
            return;
        this.send({
            type: 'collectItem',
            playerId: this.playerId,
            collectibleId,
            timestamp: Date.now(),
        });
    }
    // Event handlers
    onGameStateUpdate(callback) {
        this.onStateUpdate = callback;
    }
    onPlayerJoined(callback) {
        this.onPlayerJoin = callback;
    }
    onPlayerLeft(callback) {
        this.onPlayerLeave = callback;
    }
    /**
     * Register a callback for player position updates.
     * @param callback (playerId: string, position: any) => void
     */
    onPlayerUpdate(callback) {
        this._onPlayerUpdate = callback;
    }
    // Getters
    get connected() {
        return this.isConnected;
    }
    get currentPlayerId() {
        return this.playerId;
    }
    get isHostPlayer() {
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
