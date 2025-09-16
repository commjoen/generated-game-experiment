/**
 * Product database and cart management for hand-scanner feature
 */

export interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  quantity: number;
  category: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// Static product database for demonstration
export const PRODUCTS: Product[] = [
  {
    id: 'p001',
    name: 'Apple - Red Delicious',
    barcode: '123456789012',
    price: 1.50,
    quantity: 100,
    category: 'Fruits',
  },
  {
    id: 'p002', 
    name: 'Bananas - Organic',
    barcode: '234567890123',
    price: 2.25,
    quantity: 80,
    category: 'Fruits',
  },
  {
    id: 'p003',
    name: 'Milk - Whole 1L',
    barcode: '345678901234',
    price: 3.99,
    quantity: 50,
    category: 'Dairy',
  },
  {
    id: 'p004',
    name: 'Bread - Whole Wheat',
    barcode: '456789012345',
    price: 2.99,
    quantity: 30,
    category: 'Bakery',
  },
  {
    id: 'p005',
    name: 'Orange Juice - 1L',
    barcode: '567890123456',
    price: 4.49,
    quantity: 25,
    category: 'Beverages',
  },
  {
    id: 'p006',
    name: 'Chicken Breast - 1kg',
    barcode: '678901234567',
    price: 12.99,
    quantity: 15,
    category: 'Meat',
  },
  {
    id: 'p007',
    name: 'Pasta - Spaghetti 500g',
    barcode: '789012345678',
    price: 1.99,
    quantity: 60,
    category: 'Pantry',
  },
  {
    id: 'p008',
    name: 'Tomatoes - Cherry 250g',
    barcode: '890123456789',
    price: 3.49,
    quantity: 40,
    category: 'Vegetables',
  },
  {
    id: 'p009',
    name: 'Cereal - Cornflakes',
    barcode: '901234567890',
    price: 5.99,
    quantity: 20,
    category: 'Breakfast',
  },
  {
    id: 'p010',
    name: 'Coffee - Ground 250g',
    barcode: '012345678901',
    price: 8.99,
    quantity: 35,
    category: 'Beverages',
  },
];

/**
 * Find a product by barcode
 */
export function findProductByBarcode(barcode: string): Product | null {
  return PRODUCTS.find(product => product.barcode === barcode) || null;
}

/**
 * Get all products in a category
 */
export function getProductsByCategory(category: string): Product[] {
  return PRODUCTS.filter(product => product.category === category);
}

/**
 * Get all unique categories
 */
export function getCategories(): string[] {
  return [...new Set(PRODUCTS.map(product => product.category))].sort();
}

/**
 * Cart management class
 */
export class ShoppingCart {
  private items: Map<string, CartItem> = new Map();
  private storageKey = 'scannerCart';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Add a product to the cart
   */
  addProduct(product: Product, quantity: number = 1): boolean {
    if (quantity <= 0 || quantity > product.quantity) {
      return false;
    }

    const existingItem = this.items.get(product.id);
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.quantity) {
        return false;
      }
      existingItem.quantity = newQuantity;
    } else {
      this.items.set(product.id, { product, quantity });
    }

    this.saveToStorage();
    return true;
  }

  /**
   * Remove a product from the cart
   */
  removeProduct(productId: string, quantity?: number): boolean {
    const item = this.items.get(productId);
    if (!item) {
      return false;
    }

    if (quantity === undefined || quantity >= item.quantity) {
      this.items.delete(productId);
    } else {
      item.quantity -= quantity;
    }

    this.saveToStorage();
    return true;
  }

  /**
   * Clear all items from the cart
   */
  clear(): void {
    this.items.clear();
    this.saveToStorage();
  }

  /**
   * Get all items in the cart
   */
  getItems(): CartItem[] {
    return Array.from(this.items.values());
  }

  /**
   * Get total number of items in cart
   */
  getTotalItems(): number {
    return Array.from(this.items.values()).reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Get total price of items in cart
   */
  getTotalPrice(): number {
    return Array.from(this.items.values()).reduce(
      (total, item) => total + (item.product.price * item.quantity),
      0
    );
  }

  /**
   * Check if cart is empty
   */
  isEmpty(): boolean {
    return this.items.size === 0;
  }

  /**
   * Save cart to localStorage
   */
  private saveToStorage(): void {
    try {
      const cartData = Array.from(this.items.values());
      localStorage.setItem(this.storageKey, JSON.stringify(cartData));
    } catch (error) {
      console.warn('Failed to save cart to storage:', error);
    }
  }

  /**
   * Load cart from localStorage
   */
  private loadFromStorage(): void {
    try {
      const cartData = localStorage.getItem(this.storageKey);
      if (cartData) {
        const items: CartItem[] = JSON.parse(cartData);
        this.items.clear();
        items.forEach(item => {
          this.items.set(item.product.id, item);
        });
      }
    } catch (error) {
      console.warn('Failed to load cart from storage:', error);
      this.items.clear();
    }
  }
}

/**
 * Validate barcode format (simple validation)
 */
export function isValidBarcode(barcode: string): boolean {
  // Check if barcode is 12 digits (UPC-A format)
  return /^\d{12}$/.test(barcode);
}

/**
 * Generate a random barcode for testing
 */
export function generateRandomBarcode(): string {
  return Math.floor(Math.random() * 900000000000 + 100000000000).toString();
}