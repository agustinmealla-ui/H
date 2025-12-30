/**
 * Formatting utilities
 * Centralized number/date formatting functions
 */

/**
 * Format large numbers with suffix (T, B, M)
 */
export function formatLargeNumber(num: number | null | undefined): string {
  if (num == null) return "N/A";
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toFixed(0)}`;
}

/**
 * Format volume with suffix (B, M, K)
 */
export function formatVolume(num: number | null | undefined): string {
  if (num == null) return "N/A";
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(0);
}

/**
 * Format currency with $ prefix
 */
export function formatCurrency(num: number | null | undefined, decimals = 2): string {
  if (num == null) return "N/A";
  return `$${num.toFixed(decimals)}`;
}

/**
 * Format percentage (input as decimal, e.g., 0.15 -> "15.00%")
 */
export function formatPercent(num: number | null | undefined, decimals = 2): string {
  if (num == null) return "N/A";
  return `${(num * 100).toFixed(decimals)}%`;
}

/**
 * Format ratio/multiplier
 */
export function formatRatio(num: number | null | undefined, decimals = 2): string {
  if (num == null) return "N/A";
  return num.toFixed(decimals);
}

/**
 * Format date string to localized short format
 */
export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format timestamp to time string
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}
