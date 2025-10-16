/**
 * 日付・時刻関連のユーティリティ関数
 */

/**
 * 現在の日時を取得
 * @returns 現在の日時（ISO形式）
 */
export const getCurrentDateTime = (): string => {
  return new Date().toISOString();
};

/**
 * 現在の日付を取得（時刻なし）
 * @returns 現在の日付（YYYY-MM-DD形式）
 */
export const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * 販売期限の判定
 * @param salesEndDate 販売期限日（YYYY-MM-DD形式）
 * @returns 期限切れかどうか
 */
export const isExpired = (salesEndDate?: string): boolean => {
  if (!salesEndDate) return false;
  
  const today = getCurrentDate();
  return salesEndDate < today;
};

/**
 * 販売期限までの日数を計算
 * @param salesEndDate 販売期限日（YYYY-MM-DD形式）
 * @returns 残り日数（負の値は期限切れ）
 */
export const getDaysUntilExpiry = (salesEndDate?: string): number | null => {
  if (!salesEndDate) return null;
  
  const today = new Date(getCurrentDate());
  const expiryDate = new Date(salesEndDate);
  
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * 販売期限の状態を判定
 * @param salesEndDate 販売期限日（YYYY-MM-DD形式）
 * @param warningDays 警告を出す日数（デフォルト: 30日）
 * @returns 期限の状態
 */
export const getExpiryStatus = (
  salesEndDate?: string,
  warningDays: number = 30
): 'expired' | 'warning' | 'normal' | 'none' => {
  if (!salesEndDate) return 'none';
  
  const daysUntilExpiry = getDaysUntilExpiry(salesEndDate);
  
  if (daysUntilExpiry === null) return 'none';
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= warningDays) return 'warning';
  
  return 'normal';
};

/**
 * 日付をフォーマット（日本語）
 * @param dateString 日付文字列
 * @returns フォーマットされた日付
 */
export const formatDateJP = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ja-JP');
};

/**
 * 日時をフォーマット（日本語）
 * @param dateTimeString 日時文字列
 * @returns フォーマットされた日時
 */
export const formatDateTimeJP = (dateTimeString: string): string => {
  return new Date(dateTimeString).toLocaleString('ja-JP');
};

/**
 * 相対時間を取得（○日前、○時間前など）
 * @param dateTimeString 日時文字列
 * @returns 相対時間の文字列
 */
export const getRelativeTime = (dateTimeString: string): string => {
  const now = new Date();
  const past = new Date(dateTimeString);
  const diffMs = now.getTime() - past.getTime();
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return 'たった今';
  if (diffMinutes < 60) return `${diffMinutes}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 30) return `${diffDays}日前`;
  
  return formatDateJP(dateTimeString);
};