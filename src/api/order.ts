import type { ApiResponse, OrderItem, OrderType } from "@/types/business";
import { get, post } from "@/utils/request";
import { mapOrder, mapOrderEntity, type BackendOrderRow, type BackendPage } from "@/utils/backend";

export async function getOrderList(status?: string): Promise<ApiResponse<OrderItem[]>> {
  const res = await get<ApiResponse<BackendPage<BackendOrderRow>>>("/order", {
    params: { status, page: 1, pageSize: 100 },
  });
  return { code: 200, message: "ok", data: res.data.list.map(mapOrder) };
}

export async function getOrderDetail(id: string): Promise<ApiResponse<OrderItem>> {
  const res = await get<ApiResponse<BackendOrderRow>>(`/order/${encodeURIComponent(id)}`);
  return { code: 200, message: "ok", data: mapOrder(res.data) };
}

export interface CreateProductOrderPayload {
  addressId: string;
  items: { productId: string; skuId: string; quantity: number }[];
}

/** 商城下单走后端 /order/product，保证管理端可见订单 */
export async function createProductOrder(
  payload: CreateProductOrderPayload,
): Promise<ApiResponse<OrderItem>> {
  const res = await post<ApiResponse<any>>("/order/product", {
    addressId: Number(payload.addressId),
    items: payload.items.map((i) => ({
      productId: Number(i.productId),
      skuId: Number(i.skuId),
      quantity: i.quantity,
    })),
  });
  return { code: 200, message: "ok", data: mapOrderEntity(res.data) };
}

/** 取消订单（后端同步状态） */
export async function cancelOrder(id: string, reason?: string): Promise<ApiResponse<boolean>> {
  await post<ApiResponse<any>>(`/order/${encodeURIComponent(id)}/cancel`, { reason });
  return { code: 200, message: "ok", data: true };
}

/** 确认收货（后端同步状态） */
export async function confirmOrder(id: string): Promise<ApiResponse<boolean>> {
  await post<ApiResponse<any>>(`/order/${encodeURIComponent(id)}/confirm`);
  return { code: 200, message: "ok", data: true };
}

/** 申请退款：后端把订单置为 refunding，商家端与后台的「退款待处理」待办随即出现 */
export async function requestRefund(id: string, reason: string): Promise<ApiResponse<boolean>> {
  await post<ApiResponse<any>>(`/order/${encodeURIComponent(id)}/refund`, { reason });
  return { code: 200, message: "ok", data: true };
}
