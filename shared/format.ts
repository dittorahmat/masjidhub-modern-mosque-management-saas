/**
 * Canonical formatting helpers for currency, numbers, and dates.
 */

/**
 * Format a number to Indonesian Rupiah currency string.
 * Example: formatRupiah(1500000) => "Rp 1.500.000"
 */
export function formatRupiah(amount: number | string | null | undefined, fallback = 'Rp 0'): string {
  if (amount === null || amount === undefined) return fallback;
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return fallback;
  return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
}

/**
 * Format raw numbers with Indonesian locale separators.
 * Example: formatNumber(1250) => "1.250"
 */
export function formatNumber(val: number | string | null | undefined, fallback = '0'): string {
  if (val === null || val === undefined) return fallback;
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return fallback;
  return num.toLocaleString('id-ID');
}
