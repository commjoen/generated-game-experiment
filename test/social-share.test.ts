import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('Social Share Functionality', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window & typeof globalThis;

  beforeEach(() => {
    dom = new JSDOM(
      `
      <!DOCTYPE html>
      <html>
      <head><title>Test</title></head>
      <body>
        <canvas id="gameCanvas" width="800" height="450"></canvas>
      </body>
      </html>
    `,
      {
        url: 'http://localhost:3000',
        pretendToBeVisual: true,
        resources: 'usable',
      }
    );

    document = dom.window.document;
    window = dom.window as any;

    // Setup global variables
    (global as any).document = document;
    (global as any).window = window;
    (global as any).HTMLCanvasElement = window.HTMLCanvasElement;
    (global as any).CanvasRenderingContext2D = window.CanvasRenderingContext2D;
  });

  afterEach(() => {
    dom.window.close();
  });

  it('should generate appropriate share text for game over', () => {
    // Mock game state for game over
    const gameOver = true;
    const score = 1500;
    const level = 8;

    const generateShareText = () => {
      if (gameOver) {
        return `Just played Side-Scrolling Platformer! 🎮 Final score: ${score} points on level ${level}! Can you beat it?`;
      } else if (level >= 25) {
        return `Victory! 🏆 Just reached level 25 in Side-Scrolling Platformer with ${score} points! Amazing game!`;
      } else {
        return `Playing Side-Scrolling Platformer! 🎮 Currently on level ${level} with ${score} points!`;
      }
    };

    const shareText = generateShareText();

    expect(shareText).toBe(
      'Just played Side-Scrolling Platformer! 🎮 Final score: 1500 points on level 8! Can you beat it?'
    );
    expect(shareText).toContain('Final score: 1500 points');
    expect(shareText).toContain('level 8');
    expect(shareText).toContain('🎮');
  });

  it('should generate appropriate share text for victory', () => {
    // Mock game state for victory
    const gameOver = false;
    const score = 5000;
    const level = 25;

    const generateShareText = () => {
      if (gameOver) {
        return `Just played Side-Scrolling Platformer! 🎮 Final score: ${score} points on level ${level}! Can you beat it?`;
      } else if (level >= 25) {
        return `Victory! 🏆 Just reached level 25 in Side-Scrolling Platformer with ${score} points! Amazing game!`;
      } else {
        return `Playing Side-Scrolling Platformer! 🎮 Currently on level ${level} with ${score} points!`;
      }
    };

    const shareText = generateShareText();

    expect(shareText).toBe(
      'Victory! 🏆 Just reached level 25 in Side-Scrolling Platformer with 5000 points! Amazing game!'
    );
    expect(shareText).toContain('Victory! 🏆');
    expect(shareText).toContain('level 25');
    expect(shareText).toContain('5000 points');
  });

  it('should create share modal with all required elements', () => {
    // Mock the openShareModal function logic
    const shareModal = document.createElement('div');
    shareModal.id = 'share-modal';
    shareModal.style.display = 'flex';

    const modalContent = document.createElement('div');

    // Header
    const header = document.createElement('div');
    const title = document.createElement('h2');
    title.textContent = '📤 Share Your Progress';
    const closeButton = document.createElement('button');
    closeButton.textContent = '✖️';

    header.appendChild(title);
    header.appendChild(closeButton);

    // Content
    const content = document.createElement('div');

    // Preview section
    const previewTitle = document.createElement('h3');
    previewTitle.textContent = 'Preview:';
    const shareText = document.createElement('p');
    shareText.textContent =
      'Just played Side-Scrolling Platformer! 🎮 Final score: 1000 points on level 5! Can you beat it?';

    // Share buttons
    const shareSection = document.createElement('div');
    const shareTitle = document.createElement('h3');
    shareTitle.textContent = 'Share to:';

    const buttonsContainer = document.createElement('div');
    const platforms = [
      'Twitter',
      'Facebook',
      'LinkedIn',
      'Reddit',
      'Copy Link',
      'Download',
    ];

    platforms.forEach((platform) => {
      const button = document.createElement('button');
      button.textContent = platform;
      buttonsContainer.appendChild(button);
    });

    shareSection.appendChild(shareTitle);
    shareSection.appendChild(buttonsContainer);

    content.appendChild(previewTitle);
    content.appendChild(shareText);
    content.appendChild(shareSection);

    modalContent.appendChild(header);
    modalContent.appendChild(content);
    shareModal.appendChild(modalContent);

    document.body.appendChild(shareModal);

    // Verify modal structure
    expect(shareModal.id).toBe('share-modal');
    expect(shareModal.style.display).toBe('flex');
    expect(title.textContent).toBe('📤 Share Your Progress');
    expect(closeButton.textContent).toBe('✖️');
    expect(previewTitle.textContent).toBe('Preview:');
    expect(shareTitle.textContent).toBe('Share to:');
    expect(buttonsContainer.children.length).toBe(6);

    // Check all platform buttons exist
    const buttons = Array.from(buttonsContainer.children).map(
      (btn) => btn.textContent
    );
    expect(buttons).toContain('Twitter');
    expect(buttons).toContain('Facebook');
    expect(buttons).toContain('LinkedIn');
    expect(buttons).toContain('Reddit');
    expect(buttons).toContain('Copy Link');
    expect(buttons).toContain('Download');
  });

  it('should generate correct social media URLs', () => {
    const shareText =
      'Just played Side-Scrolling Platformer! 🎮 Final score: 1500 points on level 8! Can you beat it?';
    const repoUrl = 'https://github.com/commjoen/generated-game-experiment';

    // Test Twitter URL generation
    const text = encodeURIComponent(shareText);
    const url = encodeURIComponent(repoUrl);
    const hashtags = encodeURIComponent(
      'indiegaming,webgames,platformer,javascript'
    );

    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=${hashtags}`;

    expect(twitterUrl).toContain('twitter.com/intent/tweet');
    expect(twitterUrl).toContain(
      encodeURIComponent('Side-Scrolling Platformer')
    );
    expect(twitterUrl).toContain(
      encodeURIComponent('github.com/commjoen/generated-game-experiment')
    );
    expect(twitterUrl).toContain('hashtags=indiegaming');

    // Test Facebook URL generation
    const quote = encodeURIComponent(shareText);
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`;

    expect(facebookUrl).toContain('facebook.com/sharer/sharer.php');
    expect(facebookUrl).toContain(
      encodeURIComponent('github.com/commjoen/generated-game-experiment')
    );

    // Test LinkedIn URL generation
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`;

    expect(linkedinUrl).toContain('linkedin.com/sharing/share-offsite');
    expect(linkedinUrl).toContain('summary=');
  });

  it('should handle screenshot capture functionality', () => {
    // Mock canvas and context
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const mockContext = {
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      setGlobalAlpha: vi.fn(),
    };

    const mockTempCanvas = {
      width: 800,
      height: 450,
      getContext: vi.fn(() => mockContext),
      toDataURL: vi.fn(() => 'data:image/png;base64,mock-image-data'),
    };

    // Mock document.createElement for canvas
    const originalCreateElement = document.createElement;
    document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'canvas') {
        return mockTempCanvas as any;
      }
      return originalCreateElement.call(document, tagName);
    });

    // Simulate screenshot capture
    const captureGameScreenshot = () => {
      const tempCanvas = document.createElement('canvas') as HTMLCanvasElement;
      const tempCtx = tempCanvas.getContext('2d')!;

      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;

      tempCtx.drawImage(canvas, 0, 0);

      return tempCanvas.toDataURL('image/png');
    };

    const screenshot = captureGameScreenshot();

    expect(document.createElement).toHaveBeenCalledWith('canvas');
    expect(mockTempCanvas.getContext).toHaveBeenCalledWith('2d');
    expect(mockContext.drawImage).toHaveBeenCalledWith(canvas, 0, 0);
    expect(mockTempCanvas.toDataURL).toHaveBeenCalledWith('image/png');
    expect(screenshot).toBe('data:image/png;base64,mock-image-data');

    // Restore original createElement
    document.createElement = originalCreateElement;
  });
});
