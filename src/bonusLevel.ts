export interface BonusLevel {
  platforms: BonusRect[];
  boxes: BonusRect[];
  collectibles: BonusCollectible[];
  spikes: BonusRect[];
  movingPlatforms: BonusMovingPlatform[];
  finishFlag: { x: number; y: number; width: number; height: number };
}

interface BonusRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BonusCollectible extends BonusRect {
  collected: boolean;
  type: 'coin';
  id: string;
}

interface BonusMovingPlatform extends BonusRect {
  dx: number;
  range: number;
  startX: number;
}

export function generateBonusVerticalLevelForTest(
  canvasWidth: number
): BonusLevel {
  const LEVEL_HEIGHT = 3200;
  const platforms = [{ x: 0, y: LEVEL_HEIGHT, width: canvasWidth, height: 50 }];
  const boxes: BonusRect[] = [];
  const spikes: BonusRect[] = [];
  const movingPlatforms: BonusMovingPlatform[] = [];
  const collectibles: BonusCollectible[] = [];
  // Fill the level with coins (grid)
  const coinSpacingX = 60;
  const coinSpacingY = 60;
  for (let y = LEVEL_HEIGHT - 100; y > 0; y -= coinSpacingY) {
    for (let x = 20; x < canvasWidth - 20; x += coinSpacingX) {
      collectibles.push({
        x,
        y,
        width: 20,
        height: 20,
        collected: false,
        type: 'coin',
        id: `testcoin_${x}_${y}`,
      });
    }
  }
  // Only moving platforms, close to each other, including lower and middle platforms
  const platWidth = 80;
  const platHeight = 20;
  const verticalGap = 60;
  const startY = LEVEL_HEIGHT - 60;
  const endY = 80;
  const horizontalGaps = [
    40,
    canvasWidth / 2 - platWidth / 2,
    canvasWidth - platWidth - 40,
  ];
  let platIndex = 0;
  for (let y = startY; y > endY; y -= verticalGap) {
    let xs;
    if (y > LEVEL_HEIGHT - 300) {
      xs = horizontalGaps;
    } else if (y > LEVEL_HEIGHT / 2) {
      // Middle: add 3 platforms per row for more density
      xs = horizontalGaps;
    } else {
      xs = [40 + (platIndex % 2) * (canvasWidth - platWidth - 80)];
    }
    for (const x of xs) {
      movingPlatforms.push({
        x,
        y,
        width: platWidth,
        height: platHeight,
        dx: platIndex % 2 === 0 ? 2 : -2,
        range: 120,
        startX: x,
      });
      platIndex++;
    }
  }
  // Lower the top beam by one jump length
  const JUMP_POWER = 13;
  const jumpLength = JUMP_POWER * 8; // 104
  const topBeamHeight = 50;
  const topBeamY = 40 + jumpLength; // Lowered by one jump length from the top
  const topBeam = {
    x: 0,
    y: topBeamY,
    width: canvasWidth,
    height: topBeamHeight,
  };
  platforms.push(topBeam); // Add to the end so the floor is still platforms[0]
  const finishFlag = {
    x: canvasWidth / 2 - 12,
    y: topBeamY - 80 + topBeamHeight,
    width: 24,
    height: 80,
  };
  return {
    platforms,
    boxes,
    collectibles,
    spikes,
    movingPlatforms,
    finishFlag,
  };
}
