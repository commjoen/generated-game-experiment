import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebSocket } from 'ws';
import fetch from 'node-fetch';
import {
  setupServer,
  teardownServer,
  getTestPort,
} from '../test/server-manager';

beforeAll(async () => {
  await setupServer();
  await new Promise((r) => setTimeout(r, 400));
});

afterAll(async () => {
  await teardownServer();
});

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Multiplayer server', () => {
  function getBaseUrl() {
    return `http://localhost:${getTestPort()}`;
  }
  function getWsUrl() {
    return `ws://localhost:${getTestPort()}`;
  }

  it('should respond to health check', async () => {
    const HEALTH_URL = getBaseUrl() + '/health';
    const res = await fetch(HEALTH_URL);
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.status).toBe('ok');
  });

  it('should increment and broadcast score when a coin is collected', async () => {
    // Register a coin collectible
    await fetch(getBaseUrl() + '/register-collectibles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectibles: [{ id: 'coin1', type: 'coin' }] }),
    });

    // Player 1 joins
    const ws1 = new WebSocket(getWsUrl());
    let ws1Score = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let ws1Ready = false;
    ws1.on('open', () => {
      ws1.send(
        JSON.stringify({
          type: 'join',
          playerId: 'p1',
          name: 'P1',
          timestamp: Date.now(),
        })
      );
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
    ws1.send(
      JSON.stringify({
        type: 'collectItem',
        playerId: 'p1',
        collectibleId: 'coin1',
      })
    );
    await wait(200);
    expect(ws1Score).toBe(1);
    ws1.close();
  });

  it('should broadcast updated scores to all players', async () => {
    // Register a new coin collectible
    await fetch(getBaseUrl() + '/register-collectibles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectibles: [{ id: 'coin2', type: 'coin' }] }),
    });

    // Player 1 joins
    const ws1 = new WebSocket(getWsUrl());
    let ws1Score = 0;
    let ws2Score = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let ws1Ready = false;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let ws2Ready = false;
    ws1.on('open', () => {
      ws1.send(
        JSON.stringify({
          type: 'join',
          playerId: 'p1',
          name: 'P1',
          timestamp: Date.now(),
        })
      );
    });
    ws1.on('message', (data: any) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'gameState') ws1Ready = true;
      if (msg.type === 'itemCollected' && msg.collectibleId === 'coin2') {
        ws1Score = msg.score;
      }
    });

    // Player 2 joins
    const ws2 = new WebSocket(getWsUrl());
    ws2.on('open', () => {
      ws2.send(
        JSON.stringify({
          type: 'join',
          playerId: 'p2',
          name: 'P2',
          timestamp: Date.now(),
        })
      );
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
    ws2.send(
      JSON.stringify({
        type: 'collectItem',
        playerId: 'p2',
        collectibleId: 'coin2',
      })
    );
    await wait(300);
    expect(ws2Score).toBe(1);
    expect(ws1Score).toBe(1);
    ws1.close();
    ws2.close();
  });

  it('should ensure score updates are properly received by the collecting player', async () => {
    // Register a new coin collectible
    await fetch(getBaseUrl() + '/register-collectibles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectibles: [{ id: 'coin3', type: 'coin' }] }),
    });

    // Player joins
    const ws = new WebSocket(getWsUrl());
    let playerScore = 0;
    let itemCollectedReceived = false;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let playerUpdateReceived = false;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let gameStateReceived = false;

    ws.on('open', () => {
      ws.send(
        JSON.stringify({
          type: 'join',
          playerId: 'collector',
          name: 'Collector',
          timestamp: Date.now(),
        })
      );
    });

    ws.on('message', (data: any) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'gameState') {
        gameStateReceived = true;
        // Find self in the gameState
        const selfPlayer = msg.gameState.players.find(
          (p: any) => p.id === 'collector'
        );
        if (selfPlayer && typeof selfPlayer.score === 'number') {
          playerScore = selfPlayer.score;
        }
      }
      if (
        msg.type === 'itemCollected' &&
        msg.collectibleId === 'coin3' &&
        msg.playerId === 'collector'
      ) {
        itemCollectedReceived = true;
        if (typeof msg.score === 'number') {
          playerScore = msg.score;
        }
      }
      if (msg.type === 'playerUpdate' && msg.playerId === 'collector') {
        playerUpdateReceived = true;
        if (typeof msg.score === 'number') {
          playerScore = msg.score;
        }
      }
    });

    // Wait for connection to be ready
    await wait(200);

    // Player collects the coin
    ws.send(
      JSON.stringify({
        type: 'collectItem',
        playerId: 'collector',
        collectibleId: 'coin3',
      })
    );
    await wait(300);

    // The player should receive their own score update through itemCollected or subsequent messages
    expect(playerScore).toBe(1);
    expect(itemCollectedReceived).toBe(true);

    ws.close();
  });

  it('should handle score updates correctly for the collecting player', async () => {
    // This test simulates the proper client behavior where score comes from server
    await fetch(getBaseUrl() + '/register-collectibles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectibles: [{ id: 'coin4', type: 'coin' }] }),
    });

    const ws = new WebSocket(getWsUrl());
    let receivedScore = 0;
    let scoreUpdateCount = 0;

    ws.on('open', () => {
      ws.send(
        JSON.stringify({
          type: 'join',
          playerId: 'scoretest',
          name: 'ScoreTest',
          timestamp: Date.now(),
        })
      );
    });

    ws.on('message', (data: any) => {
      const msg = JSON.parse(data.toString());

      // Count all score updates for this player
      if (
        (msg.type === 'itemCollected' ||
          msg.type === 'playerUpdate' ||
          msg.type === 'gameState') &&
        typeof msg.score === 'number'
      ) {
        if (msg.type === 'itemCollected' && msg.playerId === 'scoretest') {
          receivedScore = msg.score;
          scoreUpdateCount++;
        }
        if (msg.type === 'playerUpdate' && msg.playerId === 'scoretest') {
          receivedScore = msg.score;
          scoreUpdateCount++;
        }
        if (msg.type === 'gameState') {
          const selfPlayer = msg.gameState.players.find(
            (p: any) => p.id === 'scoretest'
          );
          if (selfPlayer && typeof selfPlayer.score === 'number') {
            receivedScore = selfPlayer.score;
            scoreUpdateCount++;
          }
        }
      }
    });

    // Wait for connection
    await wait(200);

    // Collect coin
    ws.send(
      JSON.stringify({
        type: 'collectItem',
        playerId: 'scoretest',
        collectibleId: 'coin4',
      })
    );
    await wait(300);

    // Verify score was updated correctly
    expect(receivedScore).toBe(1);
    expect(scoreUpdateCount).toBeGreaterThan(0);

    ws.close();
  });

  it('should handle bonus level collectibles correctly when registered', async () => {
    // Test that bonus level collectibles work the same as regular level collectibles
    // Register multiple bonus level coins (simulating a lot of coins in bonus level)
    const bonusCoins = Array.from({ length: 10 }, (_, i) => ({
      id: `bonus_coin_${i}`,
      type: 'coin',
    }));
    await fetch(getBaseUrl() + '/register-collectibles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectibles: bonusCoins }),
    });

    // Player joins
    const ws = new WebSocket(getWsUrl());
    let playerScore = 0;
    let scoreUpdates = 0;

    ws.on('open', () => {
      ws.send(
        JSON.stringify({
          type: 'join',
          playerId: 'bonustest',
          name: 'BonusTest',
          timestamp: Date.now(),
        })
      );
    });

    ws.on('message', (data: any) => {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'itemCollected' && msg.playerId === 'bonustest') {
        playerScore = msg.score;
        scoreUpdates++;
      }

      if (msg.type === 'playerUpdate' && msg.playerId === 'bonustest') {
        playerScore = msg.score;
        scoreUpdates++;
      }

      if (msg.type === 'gameState') {
        const selfPlayer = msg.gameState.players.find(
          (p: any) => p.id === 'bonustest'
        );
        if (selfPlayer && typeof selfPlayer.score === 'number') {
          playerScore = selfPlayer.score;
        }
      }
    });

    await wait(200); // Wait for connection

    // Collect multiple coins rapidly (simulating bonus level collection)
    for (let i = 0; i < 5; i++) {
      ws.send(
        JSON.stringify({
          type: 'collectItem',
          playerId: 'bonustest',
          collectibleId: `bonus_coin_${i}`,
        })
      );
      await wait(50); // Small delay between collections
    }

    await wait(300); // Wait for all updates

    // Verify the score increased correctly for multiple coins
    expect(playerScore).toBe(5);
    expect(scoreUpdates).toBeGreaterThan(0);

    ws.close();
  });
});
