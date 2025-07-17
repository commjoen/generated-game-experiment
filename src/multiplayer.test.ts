import { describe, it, expect } from 'vitest';
import { WebSocket } from 'ws';
import fetch from 'node-fetch';

describe('Multiplayer server', () => {
  const WS_URL = 'ws://localhost:3001';
  const HEALTH_URL = 'http://localhost:3001/health';

  it('should respond to health check', async () => {
    const res = await fetch(HEALTH_URL);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('ok');
  });

  it('should allow a player to join via WebSocket', (done: any) => {
    const ws = new WebSocket(WS_URL);
    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'join', playerId: 'testplayer', timestamp: Date.now() }));
    });
    ws.on('message', (data: any) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'playerJoined' && msg.playerId === 'testplayer') {
        ws.close();
        done();
      }
    });
    ws.on('error', done);
  });

  it('should broadcast playerUpdate to other players', (done: any) => {
    const ws1 = new WebSocket(WS_URL);
    const ws2 = new WebSocket(WS_URL);
    let joined = 0;
    ws1.on('open', () => {
      ws1.send(JSON.stringify({ type: 'join', playerId: 'p1', timestamp: Date.now() }));
    });
    ws2.on('open', () => {
      ws2.send(JSON.stringify({ type: 'join', playerId: 'p2', timestamp: Date.now() }));
    });
    ws1.on('message', (data: any) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'playerJoined') joined++;
      if (joined === 2) {
        ws2.send(JSON.stringify({ type: 'playerUpdate', playerId: 'p2', position: { x: 123, y: 456, width: 40, height: 50, growLevel: 0 }, timestamp: Date.now() }));
      }
      if (msg.type === 'playerUpdate' && msg.playerId === 'p2' && msg.position.x === 123) {
        ws1.close();
        ws2.close();
        done();
      }
    });
    ws2.on('message', (_data: any) => {});
    ws1.on('error', done);
    ws2.on('error', done);
  });
}); 