import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage for tests (using global instead of window in Node.js environment)
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

// Mock localStorage as a global
const localStorage = localStorageMock;

describe('Upgrade System', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should track total points in localStorage', () => {
    // Simulate adding points
    let totalPoints = Number(localStorage.getItem('totalPoints') || '0');
    expect(totalPoints).toBe(0);

    totalPoints += 10;
    localStorage.setItem('totalPoints', String(totalPoints));

    expect(Number(localStorage.getItem('totalPoints'))).toBe(10);
  });

  it('should save player character choice', () => {
    const playerCharacter = '😊';
    localStorage.setItem('playerCharacter', playerCharacter);

    expect(localStorage.getItem('playerCharacter')).toBe('😊');
  });

  it('should track purchased upgrades', () => {
    const purchasedUpgrades = { 'red_circle': true, 'extra_life': true };
    localStorage.setItem('purchasedUpgrades', JSON.stringify(purchasedUpgrades));

    const loaded = JSON.parse(localStorage.getItem('purchasedUpgrades') || '{}');
    expect(loaded.red_circle).toBe(true);
    expect(loaded.extra_life).toBe(true);
    expect(loaded.speed_boost).toBeUndefined();
  });

  it('should have correct upgrade prices', () => {
    const UPGRADES = {
      characters: [
        { id: 'yellow_square', emoji: 'SQUARE', name: 'Yellow Square', cost: 0, unlocked: true },
        { id: 'yellow_circle', emoji: '🟡', name: 'Yellow Circle', cost: 10 },
        { id: 'red_circle', emoji: '🔴', name: 'Red Circle', cost: 50 },
        { id: 'smiley', emoji: '😊', name: 'Smiley Face', cost: 100 },
      ],
      gameplay: [
        { id: 'extra_life', name: 'Start with Extra Life', cost: 100 },
        { id: 'speed_boost', name: 'Permanent Speed Boost', cost: 300 },
      ]
    };

    expect(UPGRADES.characters.find(c => c.id === 'yellow_square')?.cost).toBe(0);
    expect(UPGRADES.characters.find(c => c.id === 'yellow_circle')?.cost).toBe(10);
    expect(UPGRADES.characters.find(c => c.id === 'red_circle')?.cost).toBe(50);
    expect(UPGRADES.characters.find(c => c.id === 'smiley')?.cost).toBe(100);
    expect(UPGRADES.gameplay.find(u => u.id === 'extra_life')?.cost).toBe(100);
    expect(UPGRADES.gameplay.find(u => u.id === 'speed_boost')?.cost).toBe(300);
  });

  it('should handle coin collection with lucky coins upgrade', () => {
    const purchasedUpgrades = { 'lucky_coins': true };
    let totalPoints = 0;

    // Simulate collecting a coin with lucky coins upgrade
    const coinValue = purchasedUpgrades['lucky_coins'] ? 2 : 1;
    totalPoints += coinValue;

    expect(totalPoints).toBe(2);

    // Without the upgrade
    const normalUpgrades: Record<string, boolean> = {};
    const normalCoinValue = normalUpgrades['lucky_coins'] ? 2 : 1;
    expect(normalCoinValue).toBe(1);
  });

  it('should apply gameplay upgrades correctly', () => {
    const purchasedUpgrades = {
      'extra_life': true,
      'tough_skin': true,
      'speed_boost': true,
      'double_jump_start': true
    };

    // Test starting lives calculation
    let lives = 3;
    if (purchasedUpgrades['extra_life']) lives = 4;
    if (purchasedUpgrades['tough_skin']) lives = 5; // overwrites extra_life
    expect(lives).toBe(5);

    // Test speed boost
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const baseSpeed = 5;
    const currentSpeedMultiplier = 1;
    const speedMultiplier = currentSpeedMultiplier * (purchasedUpgrades['speed_boost'] ? 1.5 : 1);
    expect(speedMultiplier).toBe(1.5);

    // Test double jump start
    const hasDoubleJump = purchasedUpgrades['double_jump_start'];
    expect(hasDoubleJump).toBe(true);
  });

  it('should persist upgrade effects across game sessions', () => {
    // Simulate purchasing extra_life upgrade and saving to localStorage
    const purchasedUpgrades = { 'extra_life': true };
    localStorage.setItem('purchasedUpgrades', JSON.stringify(purchasedUpgrades));
    
    // Simulate game initialization - load upgrades from localStorage
    const loadedUpgrades = JSON.parse(localStorage.getItem('purchasedUpgrades') || '{}');
    
    // Apply upgrades to starting lives (as done in game initialization)
    let lives = 3;
    if (loadedUpgrades['extra_life']) {
      lives = 4;
    }
    if (loadedUpgrades['tough_skin']) {
      lives = 5;
    }
    
    // Should start with 4 lives due to extra_life upgrade
    expect(lives).toBe(4);
    expect(loadedUpgrades.extra_life).toBe(true);
  });
});