import { Alert, Product } from '../types';
import { getCurrentDateTime, getExpiryStatus, getDaysUntilExpiry } from './dateUtils';

/**
 * アラート生成のしきい値設定
 */
export const ALERT_THRESHOLDS = {
  LOW_STOCK: 10,        // 在庫少数アラートのしきい値
  EXPIRING_SOON: 30,    // 期限切れ警告のしきい値（日数）
} as const;

/**
 * 商品の在庫状況に基づいてアラートを生成
 * @param products 商品一覧
 * @returns 生成されたアラート一覧
 */
export const generateAlerts = (products: Product[]): Alert[] => {
  const alerts: Alert[] = [];
  const currentDateTime = getCurrentDateTime();

  products.forEach(product => {
    // 在庫少数アラート
    if (product.currentStock <= ALERT_THRESHOLDS.LOW_STOCK && product.currentStock > 0) {
      alerts.push({
        id: `low_stock_${product.id}`,
        type: 'low_stock',
        severity: product.currentStock <= 5 ? 'error' : 'warning',
        message: `${product.name}の在庫が少なくなっています（残り${product.currentStock}個）`,
        productId: product.id,
        createdAt: currentDateTime,
      });
    }

    // 在庫切れアラート
    if (product.currentStock === 0) {
      alerts.push({
        id: `out_of_stock_${product.id}`,
        type: 'low_stock',
        severity: 'error',
        message: `${product.name}の在庫がありません`,
        productId: product.id,
        createdAt: currentDateTime,
      });
    }

    // 販売期限関連のアラート
    if (product.salesEndDate) {
      const expiryStatus = getExpiryStatus(product.salesEndDate, ALERT_THRESHOLDS.EXPIRING_SOON);
      const daysUntilExpiry = getDaysUntilExpiry(product.salesEndDate);

      if (expiryStatus === 'expired') {
        alerts.push({
          id: `expired_${product.id}`,
          type: 'expired',
          severity: 'error',
          message: `${product.name}の販売期限が切れています`,
          productId: product.id,
          createdAt: currentDateTime,
        });
      } else if (expiryStatus === 'warning' && daysUntilExpiry !== null) {
        alerts.push({
          id: `expiring_${product.id}`,
          type: 'expiring',
          severity: 'warning',
          message: `${product.name}の販売期限が近づいています（${daysUntilExpiry}日後）`,
          productId: product.id,
          createdAt: currentDateTime,
        });
      }
    }
  });

  // 作成日時の降順でソート
  return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/**
 * アラートの重要度順にソート
 * @param alerts アラート一覧
 * @returns ソートされたアラート一覧
 */
export const sortAlertsBySeverity = (alerts: Alert[]): Alert[] => {
  const severityOrder = { 'error': 0, 'warning': 1, 'info': 2 };
  
  return [...alerts].sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    
    // 同じ重要度の場合は作成日時の降順
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

/**
 * アラートタイプ別の集計
 * @param alerts アラート一覧
 * @returns アラートタイプ別の件数
 */
export const getAlertCounts = (alerts: Alert[]) => {
  const counts = {
    low_stock: 0,
    expiring: 0,
    expired: 0,
    total: alerts.length,
  };

  alerts.forEach(alert => {
    counts[alert.type]++;
  });

  return counts;
};

/**
 * 重要度別の集計
 * @param alerts アラート一覧
 * @returns 重要度別の件数
 */
export const getSeverityCounts = (alerts: Alert[]) => {
  const counts = {
    error: 0,
    warning: 0,
    info: 0,
    total: alerts.length,
  };

  alerts.forEach(alert => {
    counts[alert.severity]++;
  });

  return counts;
};