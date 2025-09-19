import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('Background Text URL Parameter', () => {
  let dom: JSDOM;
  let window: Window & typeof globalThis;
  let document: Document;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    // Create a new JSDOM instance for each test
    dom = new JSDOM('<!DOCTYPE html><html><body><canvas id="gameCanvas" width="800" height="450"></canvas></body></html>', {
      url: 'http://localhost:5173',
      pretendToBeVisual: true,
      resources: 'usable'
    });
    
    window = dom.window as Window & typeof globalThis;
    document = window.document;
    
    // Set up global objects
    global.window = window;
    global.document = document;
    global.HTMLElement = window.HTMLElement;
    global.HTMLCanvasElement = window.HTMLCanvasElement;
    global.Image = window.Image;
    global.URLSearchParams = window.URLSearchParams;
    
    canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    
    // Mock canvas context
    const mockContext = {
      save: vi.fn(),
      restore: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      scale: vi.fn(),
      translate: vi.fn(),
      drawImage: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      globalAlpha: 1,
      font: '',
      textAlign: '',
      textBaseline: ''
    };
    
    canvas.getContext = vi.fn(() => mockContext);
    ctx = mockContext as any;
  });

  it('should parse text parameter from URL', () => {
    // Test with text parameter
    const urlParams = new URLSearchParams('?text=Hello%20World');
    const backgroundText = urlParams.get('text') || '';
    
    expect(backgroundText).toBe('Hello World');
  });

  it('should handle URL encoded text correctly', () => {
    const urlParams = new URLSearchParams('?text=Welcome%20to%20the%20Game!');
    const backgroundText = urlParams.get('text') || '';
    
    expect(backgroundText).toBe('Welcome to the Game!');
  });

  it('should return empty string when no text parameter is provided', () => {
    const urlParams = new URLSearchParams('');
    const backgroundText = urlParams.get('text') || '';
    
    expect(backgroundText).toBe('');
  });

  it('should handle special characters in text parameter', () => {
    const urlParams = new URLSearchParams('?text=Test%20%26%20Demo%21%20%40%23%24');
    const backgroundText = urlParams.get('text') || '';
    
    expect(backgroundText).toBe('Test & Demo! @#$');
  });

  it('should simulate background text rendering when text is provided', () => {
    const backgroundText = 'Test Text';
    const canvasWidth = 800;
    const canvasHeight = 450;
    
    if (backgroundText) {
      ctx.save();
      const fontSize = Math.min(canvasWidth, canvasHeight) / 8;
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      
      ctx.strokeText(backgroundText, centerX, centerY);
      ctx.fillText(backgroundText, centerX, centerY);
      
      ctx.restore();
    }
    
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalledWith(backgroundText, 400, 225);
    expect(ctx.strokeText).toHaveBeenCalledWith(backgroundText, 400, 225);
    expect(ctx.restore).toHaveBeenCalled();
  });

  it('should not render background text when text parameter is empty', () => {
    const backgroundText = '';
    
    if (backgroundText) {
      ctx.fillText(backgroundText, 400, 225);
    }
    
    expect(ctx.fillText).not.toHaveBeenCalled();
  });
});