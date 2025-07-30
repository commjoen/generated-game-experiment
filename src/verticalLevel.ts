// Types
export interface Rect { x: number; y: number; width: number; height: number; }
export interface Collectible extends Rect { collected: boolean; type: 'coin' | 'heart' | 'doublejump' | 'grow'; id: string; }
export interface MovingPlatform extends Rect { dx: number; range: number; startX: number; }
export interface Platform extends Rect {}

export interface VerticalLevel {
  platforms: Platform[];
  boxes: Rect[];
  collectibles: Collectible[];
  spikes: Rect[];
  movingPlatforms: MovingPlatform[];
  finishFlag: { x: number; y: number; width: number; height: number };
}

const LEVEL_HEIGHT = 3200;
const JUMP_POWER = 13;
const minPlatformWidth = 140;
const maxPlatformWidth = 320;
const platformHeight = 50;

let collectibleIdCounter = 0;
function generateCollectibleId(type: string) {
  return `${type}_${Date.now()}_${collectibleIdCounter++}`;
}

export function generateVerticalLevel(canvasWidth: number): VerticalLevel {
  let y = LEVEL_HEIGHT;
  const platformSpacing = Math.min(JUMP_POWER * 8, 180);
  const platforms: Platform[] = [];
  const boxes: Rect[] = [];
  const collectibles: Collectible[] = [];
  const spikes: Rect[] = [];
  const movingPlatforms: MovingPlatform[] = [];
  const finishFlag = { x: 0, y: 0, width: 24, height: 80 };
  const platformCenters: { x: number, y: number }[] = [];
  let lastX = 100 + Math.random() * (canvasWidth - minPlatformWidth - 200);
  let isFirst = true;
  while (y > 0) {
    let x, width;
    if (isFirst) {
      x = 0;
      width = canvasWidth;
      isFirst = false;
    } else {
      width = minPlatformWidth + Math.random() * (maxPlatformWidth - minPlatformWidth);
      let minX = Math.max(0, lastX - width + 40);
      let maxX = Math.min(canvasWidth - width, lastX + width - 40);
      if (minX > maxX) { minX = maxX = lastX; }
      x = minX + Math.random() * (maxX - minX);
    }
    platforms.push({ x, y, width, height: platformHeight });
    platformCenters.push({ x: x + width / 2, y: y - 30 });
    if (Math.random() < 0.5) {
      collectibles.push({ x: x + width / 2 - 10, y: y - 30, width: 20, height: 20, collected: false, type: 'coin', id: generateCollectibleId('coin') });
    }
    if (Math.random() < 0.3 && y < LEVEL_HEIGHT - platformSpacing) {
      spikes.push({ x: x + width / 2 - 20, y: y + platformHeight - 15, width: 40, height: 15 });
    }
    // Add moving platforms, but ensure they do not overlap with any box
    if (Math.random() < 0.2 && y < LEVEL_HEIGHT - platformSpacing) {
      const movingPlat = { x: x - 60, y: y - 100, width: 80, height: 20, dx: 2, range: 120, startX: x - 60 };
      // Check for overlap with any box
      const overlapsBox = boxes.some(box =>
        movingPlat.x < box.x + box.width &&
        movingPlat.x + movingPlat.width > box.x &&
        movingPlat.y < box.y + box.height &&
        movingPlat.y + movingPlat.height > box.y
      );
      if (!overlapsBox) {
        movingPlatforms.push(movingPlat);
      }
    }
    y -= platformSpacing;
    if (Math.random() < 0.5 && y > 50) {
      boxes.push({ x: x + 10, y: y - 40, width: 40, height: 40 });
    }
    lastX = x;
  }
  // Ensure unique positions for heart, doublejump, and grow
  function shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  // Place heart, doublejump, and grow only if enough platforms
  if (platformCenters.length >= 3) {
    const shuffled = shuffle([...platformCenters]);
    // Heart
    const heartPos = shuffled[0];
    collectibles.push({ x: heartPos.x - 10, y: heartPos.y, width: 20, height: 20, collected: false, type: 'heart', id: generateCollectibleId('heart') });
    // Doublejump
    const doublejumpPos = shuffled[1];
    collectibles.push({ x: doublejumpPos.x - 10, y: doublejumpPos.y - 30, width: 20, height: 20, collected: false, type: 'doublejump', id: generateCollectibleId('doublejump') });
    // Grow
    const growPos = shuffled[2];
    collectibles.push({ x: growPos.x - 10, y: growPos.y - 60, width: 20, height: 20, collected: false, type: 'grow', id: generateCollectibleId('grow') });
  } else if (platformCenters.length === 2) {
    // Place only heart and doublejump
    const shuffled = shuffle([...platformCenters]);
    const heartPos = shuffled[0];
    collectibles.push({ x: heartPos.x - 10, y: heartPos.y, width: 20, height: 20, collected: false, type: 'heart', id: generateCollectibleId('heart') });
    const doublejumpPos = shuffled[1];
    collectibles.push({ x: doublejumpPos.x - 10, y: doublejumpPos.y - 30, width: 20, height: 20, collected: false, type: 'doublejump', id: generateCollectibleId('doublejump') });
  } else if (platformCenters.length === 1) {
    // Place only heart
    const heartPos = platformCenters[0];
    collectibles.push({ x: heartPos.x - 10, y: heartPos.y, width: 20, height: 20, collected: false, type: 'heart', id: generateCollectibleId('heart') });
  }
  const spawnY = LEVEL_HEIGHT;
  const hasSpawnBlock = platforms.some(plat => plat.y <= spawnY && plat.y + plat.height >= spawnY - 40);
  if (!hasSpawnBlock) {
    platforms.unshift({ x: 100, y: LEVEL_HEIGHT, width: minPlatformWidth + Math.random() * (maxPlatformWidth - minPlatformWidth), height: platformHeight });
  }
  const lastPlat = platforms[platforms.length - 1];
  finishFlag.x = lastPlat.x + lastPlat.width / 2 - finishFlag.width / 2;
  finishFlag.y = lastPlat.y - finishFlag.height;
  return { platforms, boxes, collectibles, spikes, movingPlatforms, finishFlag };
}