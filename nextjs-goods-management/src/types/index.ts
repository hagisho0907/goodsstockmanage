export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  categoryName: string;
  currentStock: number; // 総在庫数（自動計算: new + used + damaged）
  storageLocationId: string;
  storageLocationName: string;
  stockBreakdown: {
    new: number;      // 正常在庫数
    used: number;     // 中古在庫数
    damaged: number;  // 破損在庫数
  };
  usedStockImages?: string[];    // 中古品の写真
  damagedStockImages?: string[]; // 破損品の写真
  imageUrl?: string;
  salesEndDate?: string;
  ipInfo?: {
    productionQuantity?: number;
    salesRegions?: string[];
    salesStartDate?: string;
    salesEndDate?: string;
    licensorId?: string;
    licensorName?: string;
    licenseeId?: string;
    licenseeName?: string;
    manufacturerId?: string;
    manufacturerName?: string;
  };
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  movementType: 'in' | 'out';
  quantity: number;
  condition: 'new' | 'used' | 'damaged'; // 在庫の状態
  reason: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  type: 'low_stock' | 'expiring' | 'expired';
  severity: 'info' | 'warning' | 'error';
  message: string;
  productId?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface StorageLocation {
  id: string;
  name: string;
  code: string;
}

export interface ProductNote {
  id: string;
  productId: string;
  noteType: 'general' | 'damage' | 'handover' | 'quality';
  content: string;
  attachments?: {
    url: string;
    name: string;
    type: string;
  }[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface Licensor {
  id: string;
  name: string;
  contactInfo?: string;
}

export interface Licensee {
  id: string;
  name: string;
  contactInfo?: string;
}

export interface Manufacturer {
  id: string;
  name: string;
  contactInfo?: string;
}

export interface Stocktaking {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
  items: StocktakingItem[];
}

export interface StocktakingItem {
  id: string;
  stocktakingId: string;
  productId: string;
  productName: string;
  productSku: string;
  theoreticalStock: {
    new: number;
    used: number;
    damaged: number;
    total: number;
  };
  actualStock?: {
    new: number;
    used: number;
    damaged: number;
    total: number;
  };
  difference?: {
    new: number;
    used: number;
    damaged: number;
    total: number;
  };
  notes?: string;
  checkedBy?: string;
  checkedByName?: string;
  checkedAt?: string;
  status: 'pending' | 'checked' | 'discrepancy';
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'manager' | 'inventory_manager' | 'warehouse_worker' | 'sales' | 'viewer';
  department?: string;
  storageLocationAccess: string[];
  isActive: boolean;
  lastLoginAt?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedBy?: string;
  updatedByName?: string;
  updatedAt?: string;
}

export interface UserRole {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
}

export interface Report {
  id: string;
  name: string;
  description: string;
  type: 'stock_summary' | 'movement_history' | 'alert_history' | 'stocktaking_summary' | 'user_activity';
  parameters?: {
    dateRange?: {
      start: string;
      end: string;
    };
    categories?: string[];
    storageLocations?: string[];
    users?: string[];
    productIds?: string[];
  };
  generatedBy: string;
  generatedByName: string;
  generatedAt: string;
  status: 'generating' | 'completed' | 'failed';
  downloadUrl?: string;
  fileSize?: number;
}
