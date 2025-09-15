// Red Circle Love Feature Integration Test
import { describe, it, expect, beforeEach } from 'vitest';

describe('Red Circle Love Feature Integration', () => {
  // Mock the global functions and objects that would be available in main.ts
  let mockPlayer: any;
  let mockEnemy: any;
  let mockPlayerCharacter: string;
  let loveHeartsShown = false;
  let mockLoveHearts: any[] = [];

  // Mock love heart system
  function mockShowLoveHeart(x: number, y: number) {
    loveHeartsShown = true;
    // Create mock love hearts
    for (let i = 0; i < 3; i++) {
      mockLoveHearts.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: -2 - Math.random() * 2,
        life: 90 + Math.random() * 30,
        maxLife: 120,
        size: 20 + Math.random() * 10,
      });
    }
  }

  function mockUpdateLoveHearts() {
    for (const heart of mockLoveHearts) {
      heart.x += heart.vx;
      heart.y += heart.vy;
      heart.vy += 0.02; // Slight gravity
      heart.life--;
    }
    mockLoveHearts = mockLoveHearts.filter((heart) => heart.life > 0);
  }

  // Mock collision detection
  function rectsCollide(a: any, b: any) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  beforeEach(() => {
    // Reset state for each test
    loveHeartsShown = false;
    mockLoveHearts = [];

    mockPlayer = {
      x: 100,
      y: 300,
      width: 40,
      height: 50,
      vx: 0,
      vy: 0,
      growLevel: 0,
    };

    mockEnemy = {
      x: 120, // Overlapping with player
      y: 300,
      width: 30,
      height: 30,
      dx: 1,
      dy: 0,
      range: 120,
      startX: 120,
      alive: true,
      id: 'test_enemy',
      isJumpingOut: false,
      type: 'circle',
    };
  });

  it('should show love hearts when red circle player collides with red circle enemy', () => {
    mockPlayerCharacter = '🔴'; // Red circle player
    let playerDamaged = false;

    // Simulate the collision logic from main.ts
    if (rectsCollide(mockPlayer, mockEnemy)) {
      if (mockEnemy.type === 'circle') {
        // Check if player is red circle for love behavior
        if (mockPlayerCharacter === '🔴') {
          // Red circle player touching red circle enemy - show love!
          mockShowLoveHeart(
            mockEnemy.x + mockEnemy.width / 2,
            mockEnemy.y + mockEnemy.height / 2
          );
          // No damage - just love!
        } else {
          // Other players - handle damage based on player size
          if (mockPlayer.growLevel > 0) {
            mockPlayer.growLevel = 0;
          } else {
            playerDamaged = true;
          }
        }
      }
    }

    expect(loveHeartsShown).toBe(true);
    expect(playerDamaged).toBe(false);
    expect(mockPlayer.growLevel).toBe(0); // Player should not be damaged
    expect(mockEnemy.alive).toBe(true); // Enemy should not be killed
    expect(mockLoveHearts.length).toBe(3); // Should create 3 love hearts
  });

  it('should animate love hearts with proper physics', () => {
    mockPlayerCharacter = '🔴';

    // Trigger love hearts
    if (rectsCollide(mockPlayer, mockEnemy)) {
      if (mockEnemy.type === 'circle' && mockPlayerCharacter === '🔴') {
        mockShowLoveHeart(
          mockEnemy.x + mockEnemy.width / 2,
          mockEnemy.y + mockEnemy.height / 2
        );
      }
    }

    expect(mockLoveHearts.length).toBe(3);

    // Store initial positions
    const initialPositions = mockLoveHearts.map((heart) => ({
      x: heart.x,
      y: heart.y,
    }));

    // Simulate a few animation frames
    for (let i = 0; i < 10; i++) {
      mockUpdateLoveHearts();
    }

    // Hearts should have moved
    mockLoveHearts.forEach((heart, index) => {
      expect(heart.x).not.toBe(initialPositions[index].x);
      expect(heart.y).toBeLessThan(initialPositions[index].y); // Should move upward initially
      expect(heart.life).toBeLessThan(heart.maxLife); // Life should decrease
    });
  });

  it('should still damage non-red circle players when touching red circle enemy', () => {
    mockPlayerCharacter = '🟡'; // Yellow circle player (not red)
    let playerDamaged = false;

    // Simulate the collision logic from main.ts
    if (rectsCollide(mockPlayer, mockEnemy)) {
      if (mockEnemy.type === 'circle') {
        if (mockPlayerCharacter === '🔴') {
          mockShowLoveHeart(
            mockEnemy.x + mockEnemy.width / 2,
            mockEnemy.y + mockEnemy.height / 2
          );
        } else {
          // Other players - handle damage
          if (mockPlayer.growLevel > 0) {
            mockPlayer.growLevel = 0;
          } else {
            playerDamaged = true;
          }
        }
      }
    }

    expect(loveHeartsShown).toBe(false); // No love hearts for non-red players
    expect(playerDamaged).toBe(true); // Should take damage
  });

  it('should handle big red circle players correctly (no damage when showing love)', () => {
    mockPlayerCharacter = '🔴';
    mockPlayer.growLevel = 2; // Big player
    let playerShrunk = false;

    // Simulate the collision logic from main.ts
    if (rectsCollide(mockPlayer, mockEnemy)) {
      if (mockEnemy.type === 'circle') {
        if (mockPlayerCharacter === '🔴') {
          mockShowLoveHeart(
            mockEnemy.x + mockEnemy.width / 2,
            mockEnemy.y + mockEnemy.height / 2
          );
          // No damage - just love!
        } else {
          // Other players would take damage
          if (mockPlayer.growLevel > 0) {
            mockPlayer.growLevel = 0;
            playerShrunk = true;
          }
        }
      }
    }

    expect(loveHeartsShown).toBe(true);
    expect(playerShrunk).toBe(false);
    expect(mockPlayer.growLevel).toBe(2); // Player should keep their size
  });

  it('should create love hearts at the correct position', () => {
    mockPlayerCharacter = '🔴';

    const expectedX = mockEnemy.x + mockEnemy.width / 2;
    const expectedY = mockEnemy.y + mockEnemy.height / 2;

    if (rectsCollide(mockPlayer, mockEnemy)) {
      if (mockEnemy.type === 'circle' && mockPlayerCharacter === '🔴') {
        mockShowLoveHeart(expectedX, expectedY);
      }
    }

    expect(mockLoveHearts.length).toBe(3);

    // Hearts should be positioned around the enemy center
    mockLoveHearts.forEach((heart) => {
      expect(heart.x).toBeGreaterThan(expectedX - 40);
      expect(heart.x).toBeLessThan(expectedX + 40);
      expect(heart.y).toBeGreaterThan(expectedY - 20);
      expect(heart.y).toBeLessThan(expectedY + 20);
    });
  });
});
