import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock DOM methods and localStorage
const mockElement = {
  style: {} as CSSStyleDeclaration,
  innerHTML: '',
  textContent: '',
  value: '',
  addEventListener: vi.fn(),
  getAttribute: vi.fn(() => null),
  classList: {
    contains: vi.fn(() => false),
  },
};

const mockDocument = {
  getElementById: vi.fn(() => mockElement),
  querySelector: vi.fn(() => mockElement),
  addEventListener: vi.fn(),
};

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Set up global mocks
Object.defineProperty(global, 'document', {
  value: mockDocument,
});

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

Object.defineProperty(global, 'window', {
  value: {},
});

// Import the scanner functions after setting up mocks
import {
  findProductByBarcode,
  ShoppingCart,
  isValidBarcode,
  PRODUCTS,
} from './products';

describe('Scanner Integration', () => {
  let cart: ShoppingCart;
  
  beforeEach(() => {
    localStorage.clear();
    cart = new ShoppingCart();
    vi.clearAllMocks();
  });

  describe('Barcode Scanning Workflow', () => {
    it('should successfully scan and add valid product to cart', () => {
      const appleBarcode = '123456789012';
      const product = findProductByBarcode(appleBarcode);
      
      expect(product).toBeDefined();
      expect(product?.name).toBe('Apple - Red Delicious');
      
      const success = cart.addProduct(product!, 1);
      expect(success).toBe(true);
      expect(cart.getTotalItems()).toBe(1);
      expect(cart.getTotalPrice()).toBe(1.50);
    });

    it('should reject invalid barcode formats', () => {
      expect(isValidBarcode('123')).toBe(false);
      expect(isValidBarcode('12345678901')).toBe(false);
      expect(isValidBarcode('1234567890123')).toBe(false);
      expect(isValidBarcode('123456789abc')).toBe(false);
      expect(isValidBarcode('')).toBe(false);
    });

    it('should handle non-existent products gracefully', () => {
      const fakeBarcode = '999999999999';
      const product = findProductByBarcode(fakeBarcode);
      
      expect(product).toBeNull();
    });

    it('should accumulate quantities when scanning same product multiple times', () => {
      const appleBarcode = '123456789012';
      const product = findProductByBarcode(appleBarcode)!;
      
      cart.addProduct(product, 1);
      cart.addProduct(product, 2);
      
      expect(cart.getTotalItems()).toBe(3);
      expect(cart.getItems()).toHaveLength(1);
      expect(cart.getItems()[0].quantity).toBe(3);
    });

    it('should handle multiple different products in cart', () => {
      const apple = findProductByBarcode('123456789012')!;
      const banana = findProductByBarcode('234567890123')!;
      const milk = findProductByBarcode('345678901234')!;
      
      cart.addProduct(apple, 1);
      cart.addProduct(banana, 2);
      cart.addProduct(milk, 1);
      
      expect(cart.getTotalItems()).toBe(4);
      expect(cart.getItems()).toHaveLength(3);
      expect(cart.getTotalPrice()).toBe(1.50 + 4.50 + 3.99); // 1*1.50 + 2*2.25 + 1*3.99
    });
  });

  describe('Cart Management Operations', () => {
    it('should remove individual items from cart', () => {
      const apple = findProductByBarcode('123456789012')!;
      cart.addProduct(apple, 3);
      
      expect(cart.removeProduct(apple.id, 1)).toBe(true);
      expect(cart.getTotalItems()).toBe(2);
      
      expect(cart.removeProduct(apple.id)).toBe(true);
      expect(cart.isEmpty()).toBe(true);
    });

    it('should clear entire cart', () => {
      const apple = findProductByBarcode('123456789012')!;
      const banana = findProductByBarcode('234567890123')!;
      
      cart.addProduct(apple, 1);
      cart.addProduct(banana, 2);
      
      expect(cart.getTotalItems()).toBe(3);
      
      cart.clear();
      expect(cart.isEmpty()).toBe(true);
      expect(cart.getTotalItems()).toBe(0);
      expect(cart.getTotalPrice()).toBe(0);
    });

    it('should persist cart state across sessions', () => {
      const apple = findProductByBarcode('123456789012')!;
      cart.addProduct(apple, 2);
      
      // Simulate new session
      const newCart = new ShoppingCart();
      expect(newCart.getTotalItems()).toBe(2);
      expect(newCart.getItems()[0].product.id).toBe(apple.id);
    });
  });

  describe('Product Database Integrity', () => {
    it('should have all products with valid data', () => {
      expect(PRODUCTS.length).toBeGreaterThan(0);
      
      PRODUCTS.forEach(product => {
        expect(product.id).toBeTruthy();
        expect(product.name).toBeTruthy();
        expect(product.barcode).toBeTruthy();
        expect(product.price).toBeGreaterThan(0);
        expect(product.quantity).toBeGreaterThanOrEqual(0);
        expect(product.category).toBeTruthy();
        expect(isValidBarcode(product.barcode)).toBe(true);
      });
    });

    it('should have unique barcodes for all products', () => {
      const barcodes = PRODUCTS.map(p => p.barcode);
      const uniqueBarcodes = new Set(barcodes);
      
      expect(uniqueBarcodes.size).toBe(barcodes.length);
    });

    it('should have unique product IDs', () => {
      const ids = PRODUCTS.map(p => p.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should include essential product categories', () => {
      const categories = new Set(PRODUCTS.map(p => p.category));
      
      expect(categories).toContain('Fruits');
      expect(categories).toContain('Dairy');
      expect(categories).toContain('Beverages');
      expect(categories).toContain('Bakery');
    });
  });

  describe('Stock Management', () => {
    it('should respect product stock limits', () => {
      const product = PRODUCTS.find(p => p.quantity > 0)!;
      
      // Should be able to add up to stock limit
      expect(cart.addProduct(product, product.quantity)).toBe(true);
      
      // Should not be able to exceed stock
      expect(cart.addProduct(product, 1)).toBe(false);
    });

    it('should prevent adding zero or negative quantities', () => {
      const apple = findProductByBarcode('123456789012')!;
      
      expect(cart.addProduct(apple, 0)).toBe(false);
      expect(cart.addProduct(apple, -1)).toBe(false);
      expect(cart.isEmpty()).toBe(true);
    });
  });

  describe('Price Calculations', () => {
    it('should calculate correct totals for mixed cart', () => {
      const apple = findProductByBarcode('123456789012')!; // $1.50
      const milk = findProductByBarcode('345678901234')!;  // $3.99
      const bread = findProductByBarcode('456789012345')!; // $2.99
      
      cart.addProduct(apple, 2);   // $3.00
      cart.addProduct(milk, 1);    // $3.99
      cart.addProduct(bread, 3);   // $8.97
      
      expect(cart.getTotalPrice()).toBeCloseTo(15.96, 2);
      expect(cart.getTotalItems()).toBe(6);
    });

    it('should handle price precision correctly', () => {
      const banana = findProductByBarcode('234567890123')!; // $2.25
      
      cart.addProduct(banana, 3);
      expect(cart.getTotalPrice()).toBeCloseTo(6.75, 2);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const apple = findProductByBarcode('123456789012')!;
      
      // Should not throw error even if storage fails
      expect(() => cart.addProduct(apple, 1)).not.toThrow();
      
      // Restore original method
      localStorage.setItem = originalSetItem;
    });

    it('should handle corrupted storage data', () => {
      localStorage.setItem('scannerCart', 'invalid json');
      
      // Should not throw error and start with empty cart
      expect(() => new ShoppingCart()).not.toThrow();
      const newCart = new ShoppingCart();
      expect(newCart.isEmpty()).toBe(true);
    });
  });
});