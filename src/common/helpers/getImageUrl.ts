import { Product } from "@/features/catalog/products/types/Product";
import { CartItem } from "@/features/commerce/carts/types/Cart";

/**
 * Normalizes a raw image URL string by prepending the API base URL if relative.
 */
export function getImageUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  if (
    rawUrl.startsWith("http://") ||
    rawUrl.startsWith("https://") ||
    rawUrl.startsWith("data:")
  ) {
    return rawUrl;
  }

  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "";
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
  return `${cleanBase}${cleanPath}`;
}

/**
 * Extracts and resolves the primary/first image URL of a Product or CartItem.
 */
export function getProductImageUrl(
  productOrItem?: Product | CartItem | null,
): string | null {
  if (!productOrItem) return null;

  const product: Product =
    "product" in productOrItem && productOrItem.product
      ? (productOrItem as CartItem).product
      : (productOrItem as Product);

  const rawUrl =
    product.primaryImage?.image?.url ||
    product.images?.find((img) => img.isPrimary)?.image?.url ||
    product.images?.[0]?.image?.url;

  return getImageUrl(rawUrl);
}

export default getImageUrl;
