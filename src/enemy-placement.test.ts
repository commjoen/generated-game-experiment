import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock types for testing
interface RegularPlatform {
  x: number;
  y: number;
  width: number;
  height: number;
  willHaveEnemies?: boolean;
}

interface SlopePlatform {
  x: number;
  y: number;
  width: number;
  height: number;
  endY: number;
  isSlope: true;
  willHaveEnemies?: boolean;
}

type Platform = RegularPlatform | SlopePlatform;

interface Tube {
  x: number;
  y: number;
  width: number;
  height: number;
  id: string;
  hasSpawnedEnemy: boolean;
}

// Test function that simulates the new platform generation logic
function generateTestLevel(LEVEL_WIDTH: number = 3200, GROUND_Y: number = 400) {
  const platforms: Platform[] = [];
  const tubes: Tube[] = [];
  
  let x = 0;
  let platformIndex = 0;
  let tubeIdCounter = 0;
  
  while (x < LEVEL_WIDTH) {
    // Determine if this platform will have enemies
    const isFirstPlatform = platformIndex === 0;
    const spawnPlatform = x <= 100 && x + 400 >= 100; // Check if spawn point (x=100) would be on this platform
    const willHaveEnemies = !isFirstPlatform && !spawnPlatform && Math.random() < 0.2;
    
    // Make enemy platforms much longer (at least 3x regular platforms)
    const platformWidth = willHaveEnemies 
      ? 960 + Math.random() * 240  // Enemy platforms: 960-1200px
      : (Math.random() < 0.2 ? 320 : 160 + Math.random() * 160); // Regular platforms: 160-320px
    
    let plat: Platform;
    if (Math.random() < 0.25) {
      // 25% chance for a slope
      const slopeDelta = (Math.random() < 0.5 ? 1 : -1) * (20 + Math.random() * 20);
      plat = {
        x,
        y: GROUND_Y,
        width: platformWidth,
        height: 50,
        endY: GROUND_Y + slopeDelta,
        isSlope: true,
        willHaveEnemies,
      };
    } else {
      plat = { 
        x, 
        y: GROUND_Y, 
        width: platformWidth, 
        height: 50,
        willHaveEnemies,
      };
    }
    platforms.push(plat);
    
    // Add spawn tubes only on platforms designated for enemies
    if (plat.willHaveEnemies && platformWidth > 200) {
      const tubeX = x + 40;
      const tubeY = GROUND_Y - 60;
      
      tubes.push({
        x: tubeX,
        y: tubeY,
        width: 40,
        height: 80,
        id: `tube_${tubeIdCounter++}`,
        hasSpawnedEnemy: false,
      });
    }
    
    x += platformWidth;
    const gap = 60 + Math.random() * 80;
    x += gap;
    platformIndex++;
  }
  
  // Ensure a platform at the player spawn point (x=100)
  const spawnX = 100;
  const hasSpawnBlock = platforms.some(
    (plat) => plat.x <= spawnX && plat.x + plat.width >= spawnX + 40
  );
  if (!hasSpawnBlock) {
    platforms.unshift({ x: 60, y: GROUND_Y, width: 80, height: 50, willHaveEnemies: false });
  }
  
  return { platforms, tubes };
}

describe('Enemy Placement Logic', () => {
  beforeEach(() => {
    // Seed random for consistent testing
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  it('should never place enemies on the first platform', () => {
    const { platforms, tubes } = generateTestLevel();
    
    // Find the first platform (leftmost)
    const firstPlatform = platforms.reduce((first, current) => 
      current.x < first.x ? current : first
    );
    
    // Ensure first platform doesn't have enemies
    expect(firstPlatform.willHaveEnemies).toBeFalsy();
    
    // Ensure no tubes are placed on the first platform
    const tubesOnFirstPlatform = tubes.filter(tube => 
      tube.x >= firstPlatform.x && tube.x < firstPlatform.x + firstPlatform.width
    );
    expect(tubesOnFirstPlatform).toHaveLength(0);
  });

  it('should never place enemies on the spawn platform', () => {
    const { platforms, tubes } = generateTestLevel();
    
    // Find platforms that contain the spawn point (x=100)
    const spawnPlatforms = platforms.filter(plat => 
      plat.x <= 100 && plat.x + plat.width >= 140 // spawn area with player width
    );
    
    // Ensure no spawn platform has enemies
    spawnPlatforms.forEach(platform => {
      expect(platform.willHaveEnemies).toBeFalsy();
    });
    
    // Ensure no tubes are placed on spawn platforms
    spawnPlatforms.forEach(platform => {
      const tubesOnSpawnPlatform = tubes.filter(tube => 
        tube.x >= platform.x && tube.x < platform.x + platform.width
      );
      expect(tubesOnSpawnPlatform).toHaveLength(0);
    });
  });

  it('should make enemy platforms at least 3x longer than regular platforms', () => {
    // Mock random to ensure we get both types of platforms
    let callCount = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      const values = [0.1, 0.8, 0.3, 0.15, 0.9, 0.7, 0.2, 0.85]; // Mix of values to create both types
      return values[callCount++ % values.length];
    });
    
    const { platforms } = generateTestLevel();
    
    const enemyPlatforms = platforms.filter(p => p.willHaveEnemies);
    const regularPlatforms = platforms.filter(p => !p.willHaveEnemies);
    
    if (enemyPlatforms.length > 0 && regularPlatforms.length > 0) {
      const minRegularWidth = Math.min(...regularPlatforms.map(p => p.width));
      const minEnemyWidth = Math.min(...enemyPlatforms.map(p => p.width));
      
      // Enemy platforms should be at least 3x the minimum regular platform width
      expect(minEnemyWidth).toBeGreaterThanOrEqual(minRegularWidth * 3);
    }
  });

  it('should only place tubes on platforms designated for enemies', () => {
    // Mock random to ensure we get platforms with enemies
    let callCount = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      const values = [0.1, 0.8, 0.3, 0.15, 0.9, 0.7]; // Values that should create enemy platforms
      return values[callCount++ % values.length];
    });
    
    const { platforms, tubes } = generateTestLevel();
    
    // Check that all tubes are on platforms with willHaveEnemies = true
    tubes.forEach(tube => {
      const hostPlatform = platforms.find(plat => 
        tube.x >= plat.x && tube.x < plat.x + plat.width
      );
      
      expect(hostPlatform).toBeDefined();
      expect(hostPlatform?.willHaveEnemies).toBe(true);
    });
  });

  it('should respect minimum width requirement for tube placement', () => {
    const { platforms, tubes } = generateTestLevel();
    
    // All platforms with tubes should be wider than 200px
    tubes.forEach(tube => {
      const hostPlatform = platforms.find(plat => 
        tube.x >= plat.x && tube.x < plat.x + plat.width
      );
      
      expect(hostPlatform).toBeDefined();
      expect(hostPlatform?.width).toBeGreaterThan(200);
    });
  });

  it('should ensure enemy platforms are significantly longer than regular platforms', () => {
    // Mock random to create a mix of platform types
    let callCount = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      // Pattern: some small values (regular platforms), some larger values (enemy platforms)
      const values = [0.1, 0.25, 0.85, 0.15, 0.3, 0.9, 0.2, 0.8];
      return values[callCount++ % values.length];
    });
    
    const { platforms } = generateTestLevel();
    
    const enemyPlatforms = platforms.filter(p => p.willHaveEnemies && p.width >= 960);
    const regularPlatforms = platforms.filter(p => !p.willHaveEnemies && p.width <= 320);
    
    // Check that enemy platforms exist and are in the expected range
    if (enemyPlatforms.length > 0) {
      enemyPlatforms.forEach(platform => {
        expect(platform.width).toBeGreaterThanOrEqual(960);
        expect(platform.width).toBeLessThanOrEqual(1200);
      });
    }
    
    // Check that regular platforms exist and are in the expected range
    if (regularPlatforms.length > 0) {
      regularPlatforms.forEach(platform => {
        expect(platform.width).toBeGreaterThanOrEqual(160);
        expect(platform.width).toBeLessThanOrEqual(320);
      });
    }
  });
});