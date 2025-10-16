import { Product, StockMovement, ProductNote, User, Stocktaking, StocktakingItem, Alert } from '../types';
import * as mockData from './mockData';
import { generateAlerts } from './alertUtils';

// メモリ内データストア（リロード時にリセットされる）
class DataStore {
  private products: Product[] = [...mockData.products];
  private stockMovements: StockMovement[] = [...mockData.stockMovements];
  private productNotes: ProductNote[] = [...mockData.productNotes];
  private users: User[] = [...mockData.users];
  private stocktakings: Stocktaking[] = [...mockData.stocktakings];

  // Products
  getProducts(): Product[] {
    return [...this.products];
  }
  
  // Alerts（動的生成）
  getAlerts(): Alert[] {
    return generateAlerts(this.products);
  }

  addProduct(product: Product): void {
    this.products.push(product);
  }

  updateProduct(id: string, product: Product): void {
    const index = this.products.findIndex(p => p.id === id);
    if (index !== -1) {
      this.products[index] = product;
    }
  }

  deleteProduct(id: string): void {
    this.products = this.products.filter(p => p.id !== id);
  }

  // Stock Movements
  getStockMovements(): StockMovement[] {
    return [...this.stockMovements];
  }

  addStockMovement(movement: StockMovement): void {
    this.stockMovements.push(movement);
    
    // 関連する商品の在庫数を更新
    const product = this.products.find(p => p.id === movement.productId);
    if (product) {
      const change = movement.movementType === 'in' ? movement.quantity : -movement.quantity;
      
      // 状態別在庫を更新
      switch (movement.condition) {
        case 'new':
          product.stockBreakdown.new = Math.max(0, product.stockBreakdown.new + change);
          break;
        case 'used':
          product.stockBreakdown.used = Math.max(0, product.stockBreakdown.used + change);
          break;
        case 'damaged':
          product.stockBreakdown.damaged = Math.max(0, product.stockBreakdown.damaged + change);
          break;
      }
      
      // 総在庫数を更新
      product.currentStock = product.stockBreakdown.new + product.stockBreakdown.used + product.stockBreakdown.damaged;
      product.updatedAt = new Date().toISOString();
    }
  }

  // Product Notes
  getProductNotes(): ProductNote[] {
    return [...this.productNotes];
  }

  addProductNote(note: ProductNote): void {
    this.productNotes.push(note);
  }

  // Users
  getUsers(): User[] {
    return [...this.users];
  }

  addUser(user: User): void {
    this.users.push(user);
  }

  updateUser(id: string, user: User): void {
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.users[index] = user;
    }
  }

  deleteUser(id: string): void {
    this.users = this.users.filter(u => u.id !== id);
  }

  // Stocktakings
  getStocktakings(): Stocktaking[] {
    return [...this.stocktakings];
  }

  addStocktaking(stocktaking: Stocktaking): void {
    this.stocktakings.push(stocktaking);
  }

  updateStocktaking(id: string, stocktaking: Stocktaking): void {
    const index = this.stocktakings.findIndex(s => s.id === id);
    if (index !== -1) {
      this.stocktakings[index] = stocktaking;
    }
  }

  // IDジェネレーター
  generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}

// シングルトンインスタンス
export const dataStore = new DataStore();

// 従来のエクスポートも維持（後方互換性）
export const products = dataStore.getProducts();
export const stockMovements = dataStore.getStockMovements();
export const productNotes = dataStore.getProductNotes();
export const users = dataStore.getUsers();
export const stocktakings = dataStore.getStocktakings();
export const alerts = dataStore.getAlerts(); // 動的生成されたアラート

// 他のマスターデータは静的なまま
export {
  categories,
  storageLocations,
  licensors,
  licensees,
  manufacturers,
  userRoles,
  reports
} from './mockData';