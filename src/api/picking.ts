import type { ApiResponse, OrderItem, PickingItem } from "@/types/business";
import { get, post } from "@/utils/request";
import { mapOrchard, mapOrderEntity, toNum, type BackendPage } from "@/utils/backend";

export interface CreatePickingOrderPayload {
  orchardId: string;
  sessionId: string;
  sessionTime: string;
  price: number;
  date: string;
  people: number;
  contactName: string;
  contactMobile: string;
}

export async function getPickingList(): Promise<ApiResponse<PickingItem[]>> {
  const res = await get<ApiResponse<BackendPage<Parameters<typeof mapOrchard>[0]>>>("/picking", {
    params: { page: 1, pageSize: 50 },
  });
  return { code: 200, message: "ok", data: res.data.list.map(mapOrchard) };
}

export async function getPickingDetail(id: string): Promise<ApiResponse<PickingItem>> {
  const res = await get<ApiResponse<Parameters<typeof mapOrchard>[0]>>(
    `/picking/${encodeURIComponent(id)}`,
  );
  return { code: 200, message: "ok", data: mapOrchard(res.data) };
}

export async function createPickingOrder(
  payload: CreatePickingOrderPayload,
): Promise<ApiResponse<OrderItem>> {
  const res = await post<ApiResponse<any>>("/order/picking", {
    orchardId: toNum(payload.orchardId),
    sessionId: toNum(payload.sessionId),
    date: payload.date,
    peopleNum: payload.people,
    contactName: payload.contactName,
    contactMobile: payload.contactMobile,
  });
  return { code: 200, message: "ok", data: mapOrderEntity(res.data) };
}
