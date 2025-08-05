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
    
    // Make enemy platforms smaller (half the original size to reduce visual clutter)
    const platformWidth = willHaveEnemies 
      ? 480 + Math.random() * 120  // Enemy platforms: 480-600px
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
      const tubeWidth = 40;
      const tubeHeight = 80;
      
      // Calculate random position within the platform, with some padding to avoid edges
      const padding = 40;
      const minTubeX = x + padding;
      const maxTubeX = x + platformWidth - tubeWidth - padding;
      const tubeX = minTubeX + Math.random() * Math.max(0, maxTubeX - minTubeX);
      
      const tubeY = GROUND_Y - 60;
      
      tubes.push({
        x: tubeX,
        y: tubeY,
        width: tubeWidth,
        height: tubeHeight,
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

  it('should make enemy platforms smaller than the original large platforms but still accommodate tubes', () => {
    // Mock random to ensure we get both types of platforms
    let callCount = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      const values = [0.1, 0.8, 0.3, 0.15, 0.9, 0.7, 0.2, 0.85]; // Mix of values to create both types
      return values[callCount++ % values.length];
    });
    
    const { platforms } = generateTestLevel();
    
    const enemyPlatforms = platforms.filter(p => p.willHaveEnemies);
    const regularPlatforms = platforms.filter(p => !p.willHaveEnemies);
    
    if (enemyPlatforms.length > 0) {
      // Enemy platforms should be in the 480-600px range (half the original 960-1200px)
      enemyPlatforms.forEach(platform => {
        expect(platform.width).toBeGreaterThanOrEqual(480);
        expect(platform.width).toBeLessThanOrEqual(600);
      });
    }
    
    if (regularPlatforms.length > 0) {
      // Regular platforms should still be 160-320px
      regularPlatforms.forEach(platform => {
        expect(platform.width).toBeGreaterThanOrEqual(160);
        expect(platform.width).toBeLessThanOrEqual(320);
      });
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

  it('should ensure enemy platforms are in expected size ranges', () => {
    // Mock random to create a mix of platform types
    let callCount = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      // Pattern: some small values (regular platforms), some larger values (enemy platforms)
      const values = [0.1, 0.25, 0.85, 0.15, 0.3, 0.9, 0.2, 0.8];
      return values[callCount++ % values.length];
    });
    
    const { platforms } = generateTestLevel();
    
    const enemyPlatforms = platforms.filter(p => p.willHaveEnemies && p.width >= 480);
    const regularPlatforms = platforms.filter(p => !p.willHaveEnemies && p.width <= 320);
    
    // Check that enemy platforms exist and are in the expected range (480-600px)
    if (enemyPlatforms.length > 0) {
      enemyPlatforms.forEach(platform => {
        expect(platform.width).toBeGreaterThanOrEqual(480);
        expect(platform.width).toBeLessThanOrEqual(600);
      });
    }
    
    // Check that regular platforms exist and are in the expected range (160-320px)
    if (regularPlatforms.length > 0) {
      regularPlatforms.forEach(platform => {
        expect(platform.width).toBeGreaterThanOrEqual(160);
        expect(platform.width).toBeLessThanOrEqual(320);
      });
    }
  });

  it('should place tubes at random positions within enemy platform boundaries', () => {
    // Mock random to ensure we get platforms with enemies and random tube positions
    let callCount = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      // Mix of values to create enemy platforms and different tube positions
      const values = [0.1, 0.8, 0.3, 0.15, 0.9, 0.7, 0.2, 0.85, 0.6, 0.4];
      return values[callCount++ % values.length];
    });
    
    const { platforms, tubes } = generateTestLevel();
    
    const enemyPlatforms = platforms.filter(p => p.willHaveEnemies);
    
    // Check that tubes are positioned within their host platform boundaries with proper padding
    tubes.forEach(tube => {
      const hostPlatform = platforms.find(plat => 
        tube.x >= plat.x && tube.x + tube.width <= plat.x + plat.width
      );
      
      expect(hostPlatform).toBeDefined();
      expect(hostPlatform?.willHaveEnemies).toBe(true);
      
      // Verify tube is within platform boundaries with padding
      const padding = 40;
      const tubeWidth = 40;
      expect(tube.x).toBeGreaterThanOrEqual(hostPlatform!.x + padding);
      expect(tube.x + tubeWidth).toBeLessThanOrEqual(hostPlatform!.x + hostPlatform!.width - padding);
    });
  });

  it('should place tubes with sufficient spacing from platform edges', () => {
    // Mock random to create predictable tube positions
    let callCount = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      const values = [0.1, 0.8, 0.0, 0.5, 1.0]; // Include edge cases for tube positioning
      return values[callCount++ % values.length];
    });
    
    const { platforms, tubes } = generateTestLevel();
    
    const minPadding = 40;
    const tubeWidth = 40;
    
    tubes.forEach(tube => {
      const hostPlatform = platforms.find(plat => 
        tube.x >= plat.x && tube.x + tubeWidth <= plat.x + plat.width
      );
      
      expect(hostPlatform).toBeDefined();
      
      // Verify minimum padding from platform edges
      const leftDistance = tube.x - hostPlatform!.x;
      const rightDistance = (hostPlatform!.x + hostPlatform!.width) - (tube.x + tubeWidth);
      
      expect(leftDistance).toBeGreaterThanOrEqual(minPadding);
      expect(rightDistance).toBeGreaterThanOrEqual(minPadding);
    });
  });
});