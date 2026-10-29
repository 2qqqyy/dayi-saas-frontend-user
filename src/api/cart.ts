import type { ApiResponse, CartItem } from "@/types/business";
import { del, get, post, put } from "@/utils/request";
import { mapCartItem } from "@/utils/backend";

type RawCartItem = Parameters<typeof mapCartItem>[0];

/** 服务端购物车（cart_item 表）；游客未登录时 store 退回本地缓存 */
export async function getCartList(): Promise<ApiResponse<CartItem[]>> {
  const res = await get<ApiResponse<RawCartItem[]>>("/cart");
  return { code: 200, message: "ok", data: res.data.map(mapCartItem) };
}

/** 加购；同一 SKU 已在车里时后端累加数量 */
export function addCartItem(
  productId: string,
  skuId: string,
  quantity: number,
): Promise<ApiResponse<unknown>> {
  return post<ApiResponse<unknown>>("/cart", {
    productId: Number(productId),
    skuId: Number(skuId),
    quantity,
  });
}

export function updateCartQuantity(id: string, quantity: number): Promise<ApiResponse<unknown>> {
  return put<ApiResponse<unknown>>(`/cart/${id}/quantity`, undefined, { params: { quantity } });
}

export function updateCartSelect(id: string, selected: boolean): Promise<ApiResponse<unknown>> {
  return put<ApiResponse<unknown>>(`/cart/${id}/select`, undefined, {
    params: { selected: selected ? 1 : 0 },
  });
}

export function updateCartSelectAll(selected: boolean): Promise<ApiResponse<unknown>> {
  return put<ApiResponse<unknown>>("/cart/select-all", undefined, {
    params: { selected: selected ? 1 : 0 },
  });
}

export function removeCartItems(ids: string[]): Promise<ApiResponse<unknown>> {
  return post<ApiResponse<unknown>>("/cart/remove", { ids: ids.map(Number) });
}

export function clearSelectedItems(): Promise<ApiResponse<unknown>> {
  return del<ApiResponse<unknown>>("/cart/items/selected");
}

export function clearCartItems(): Promise<ApiResponse<unknown>> {
  return del<ApiResponse<unknown>>("/cart/items");
}
