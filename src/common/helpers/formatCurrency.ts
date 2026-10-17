/**
 * Formats a numeric price into a localized currency string (vi-VN).
 * Example:
 * formatCurrency(50000, "VND") => "50.000 VND"
 * formatCurrency(50000) => "50.000 ₫"
 */
export function formatCurrency(
  price?: number | null,
  currency?: string | null,
): string | null {
  if (price === undefined || price === null) return null;
  const formatted = price.toLocaleString("vi-VN");
  return currency ? `${formatted} ${currency}` : `${formatted} ₫`;
}

export const formatPrice = formatCurrency;

export default formatCurrency;
