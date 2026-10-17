import { CartItem } from "@/features/commerce/carts";

export default function getProductImageUrl(item: CartItem): string | null {
  const rawUrl =
    item.product?.primaryImage?.image?.url ||
    item.product?.images?.[0]?.image?.url;
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
