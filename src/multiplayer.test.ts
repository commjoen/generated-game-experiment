import { describe, it, expect } from 'vitest';
import { WebSocket } from 'ws';
import fetch from 'node-fetch';

const WS_URL = 'ws://localhost:3001';
const HEALTH_URL = 'http://localhost:3001/health';

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Multiplayer server', () => {
  it('should respond to health check', async () => {
    const res = await fetch(HEALTH_URL);
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.status).toBe('ok');
  });

  it('should increment and broadcast score when a coin is collected', async () => {
    // Register a coin collectible
    await fetch('http://localhost:3001/register-collectibles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectibles: [{ id: 'coin1', type: 'coin' }] })
    });

    // Player 1 joins
    const ws1 = new WebSocket(WS_URL);
    let ws1Score = 0;
    let ws1Ready = false;
    ws1.on('open', () => {
      ws1.send(JSON.stringify({ type: 'join', playerId: 'p1', name: 'P1', timestamp: Date.now() }));
    });
    ws1.on('message', (data: any) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'gameState') {
        ws1Ready = true;
      }
      if (msg.type === 'itemCollected' && msg.collectibleId === 'coin1') {
        ws1Score = msg.score;
      }
    });

    // Wait for ws1 to be ready
    await wait(200);

    // Player 1 collects the coin
    ws1.send(JSON.stringify({ type: 'collectItem', playerId: 'p1', collectibleId: 'coin1' }));
    await wait(200);
    expect(ws1Score).toBe(1);
    ws1.close();
  });

  it('should broadcast updated scores to all players', async () => {
    // Register a new coin collectible
    await fetch('http://localhost:3001/register-collectibles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectibles: [{ id: 'coin2', type: 'coin' }] })
    });

    // Player 1 joins
    const ws1 = new WebSocket(WS_URL);
    let ws1Score = 0;
    let ws2Score = 0;
    let ws1Ready = false;
    let ws2Ready = false;
    ws1.on('open', () => {
      ws1.send(JSON.stringify({ type: 'join', playerId: 'p1', name: 'P1', timestamp: Date.now() }));
    });
    ws1.on('message', (data: any) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'gameState') ws1Ready = true;
      if (msg.type === 'itemCollected' && msg.collectibleId === 'coin2') {
        ws1Score = msg.score;
      }
    });

    // Player 2 joins
    const ws2 = new WebSocket(WS_URL);
    ws2.on('open', () => {
      ws2.send(JSON.stringify({ type: 'join', playerId: 'p2', name: 'P2', timestamp: Date.now() }));
    });
    ws2.on('message', (data: any) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'gameState') ws2Ready = true;
      if (msg.type === 'itemCollected' && msg.collectibleId === 'coin2') {
        ws2Score = msg.score;
      }
    });

    // Wait for both to be ready
    await wait(300);

    // Player 2 collects the coin
    ws2.send(JSON.stringify({ type: 'collectItem', playerId: 'p2', collectibleId: 'coin2' }));
    await wait(300);
    expect(ws2Score).toBe(1);
    expect(ws1Score).toBe(1);
    ws1.close();
    ws2.close();
  });
}); 