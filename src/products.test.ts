import { describe, it, expect, beforeEach } from 'vitest';
import {
  Product,
  PRODUCTS,
  findProductByBarcode,
  getProductsByCategory,
  getCategories,
  ShoppingCart,
  isValidBarcode,
  generateRandomBarcode,
} from './products';

// Mock localStorage for tests
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

// Set up global localStorage mock
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('Product Database', () => {
  it('should have products with required fields', () => {
    expect(PRODUCTS.length).toBeGreaterThan(0);
    
    PRODUCTS.forEach(product => {
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('barcode');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('quantity');
      expect(product).toHaveProperty('category');
      
      expect(typeof product.id).toBe('string');
      expect(typeof product.name).toBe('string');
      expect(typeof product.barcode).toBe('string');
      expect(typeof product.price).toBe('number');
      expect(typeof product.quantity).toBe('number');
      expect(typeof product.category).toBe('string');
      
      expect(product.price).toBeGreaterThan(0);
      expect(product.quantity).toBeGreaterThanOrEqual(0);
    });
  });

  it('should find products by barcode', () => {
    const apple = findProductByBarcode('123456789012');
    expect(apple).toBeDefined();
    expect(apple?.name).toBe('Apple - Red Delicious');
    
    const nonExistent = findProductByBarcode('999999999999');
    expect(nonExistent).toBeNull();
  });

  it('should get products by category', () => {
    const fruits = getProductsByCategory('Fruits');
    expect(fruits.length).toBeGreaterThan(0);
    fruits.forEach(product => {
      expect(product.category).toBe('Fruits');
    });
    
    const nonExistentCategory = getProductsByCategory('NonExistent');
    expect(nonExistentCategory.length).toBe(0);
  });

  it('should get all categories', () => {
    const categories = getCategories();
    expect(categories.length).toBeGreaterThan(0);
    expect(categories).toContain('Fruits');
    expect(categories).toContain('Dairy');
    
    // Should be sorted
    const sortedCategories = [...categories].sort();
    expect(categories).toEqual(sortedCategories);
  });

  it('should validate barcodes correctly', () => {
    expect(isValidBarcode('123456789012')).toBe(true);
    expect(isValidBarcode('000000000000')).toBe(true);
    expect(isValidBarcode('12345678901')).toBe(false); // 11 digits
    expect(isValidBarcode('1234567890123')).toBe(false); // 13 digits
    expect(isValidBarcode('12345678901a')).toBe(false); // contains letter
    expect(isValidBarcode('')).toBe(false); // empty
  });

  it('should generate valid random barcodes', () => {
    const barcode1 = generateRandomBarcode();
    const barcode2 = generateRandomBarcode();
    
    expect(isValidBarcode(barcode1)).toBe(true);
    expect(isValidBarcode(barcode2)).toBe(true);
    expect(barcode1).not.toBe(barcode2); // Should be different
  });
});

describe('Shopping Cart', () => {
  let cart: ShoppingCart;
  let appleProduct: Product;
  let bananaProduct: Product;

  beforeEach(() => {
    localStorage.clear();
    cart = new ShoppingCart();
    appleProduct = PRODUCTS.find(p => p.name === 'Apple - Red Delicious')!;
    bananaProduct = PRODUCTS.find(p => p.name === 'Bananas - Organic')!;
  });

  it('should start empty', () => {
    expect(cart.isEmpty()).toBe(true);
    expect(cart.getTotalItems()).toBe(0);
    expect(cart.getTotalPrice()).toBe(0);
    expect(cart.getItems()).toEqual([]);
  });

  it('should add products to cart', () => {
    const success = cart.addProduct(appleProduct, 2);
    expect(success).toBe(true);
    expect(cart.isEmpty()).toBe(false);
    expect(cart.getTotalItems()).toBe(2);
    expect(cart.getTotalPrice()).toBe(3.00);
    
    const items = cart.getItems();
    expect(items.length).toBe(1);
    expect(items[0].product).toBe(appleProduct);
    expect(items[0].quantity).toBe(2);
  });

  it('should handle adding same product multiple times', () => {
    cart.addProduct(appleProduct, 1);
    cart.addProduct(appleProduct, 2);
    
    expect(cart.getTotalItems()).toBe(3);
    const items = cart.getItems();
    expect(items.length).toBe(1);
    expect(items[0].quantity).toBe(3);
  });

  it('should add different products', () => {
    cart.addProduct(appleProduct, 1);
    cart.addProduct(bananaProduct, 2);
    
    expect(cart.getTotalItems()).toBe(3);
    expect(cart.getItems().length).toBe(2);
    expect(cart.getTotalPrice()).toBe(1.50 + 4.50); // 1*1.50 + 2*2.25
  });

  it('should not add invalid quantities', () => {
    expect(cart.addProduct(appleProduct, 0)).toBe(false);
    expect(cart.addProduct(appleProduct, -1)).toBe(false);
    expect(cart.addProduct(appleProduct, appleProduct.quantity + 1)).toBe(false);
    expect(cart.isEmpty()).toBe(true);
  });

  it('should not exceed product stock', () => {
    cart.addProduct(appleProduct, appleProduct.quantity);
    expect(cart.addProduct(appleProduct, 1)).toBe(false);
    expect(cart.getTotalItems()).toBe(appleProduct.quantity);
  });

  it('should remove products from cart', () => {
    cart.addProduct(appleProduct, 3);
    
    const success = cart.removeProduct(appleProduct.id, 1);
    expect(success).toBe(true);
    expect(cart.getTotalItems()).toBe(2);
    
    const items = cart.getItems();
    expect(items[0].quantity).toBe(2);
  });

  it('should remove entire product if quantity not specified', () => {
    cart.addProduct(appleProduct, 3);
    cart.removeProduct(appleProduct.id);
    
    expect(cart.isEmpty()).toBe(true);
  });

  it('should remove entire product if removing all or more', () => {
    cart.addProduct(appleProduct, 3);
    cart.removeProduct(appleProduct.id, 5);
    
    expect(cart.isEmpty()).toBe(true);
  });

  it('should not remove non-existent products', () => {
    expect(cart.removeProduct('nonexistent')).toBe(false);
  });

  it('should clear all products', () => {
    cart.addProduct(appleProduct, 1);
    cart.addProduct(bananaProduct, 2);
    
    cart.clear();
    expect(cart.isEmpty()).toBe(true);
    expect(cart.getTotalItems()).toBe(0);
  });

  it('should persist cart in localStorage', () => {
    cart.addProduct(appleProduct, 2);
    
    // Create new cart instance
    const newCart = new ShoppingCart();
    expect(newCart.getTotalItems()).toBe(2);
    expect(newCart.getItems()[0].product.id).toBe(appleProduct.id);
  });

  it('should handle localStorage errors gracefully', () => {
    // Mock localStorage to throw error
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = () => {
      throw new Error('Storage quota exceeded');
    };
    
    // Should not throw error
    expect(() => cart.addProduct(appleProduct, 1)).not.toThrow();
    
    // Restore original method
    localStorage.setItem = originalSetItem;
  });

  it('should handle corrupted localStorage data', () => {
    localStorage.setItem('scannerCart', 'invalid json');
    
    // Should not throw error and start with empty cart
    const newCart = new ShoppingCart();
    expect(newCart.isEmpty()).toBe(true);
  });
});