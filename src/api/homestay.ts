import type { ApiResponse, HomestayItem, OrderItem } from "@/types/business";
import { get, post } from "@/utils/request";
import { mapHomestay, mapOrderEntity, toNum, type BackendPage } from "@/utils/backend";

export interface CreateHomestayOrderPayload {
  homestayId: string;
  roomTypeId: string;
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  price: number;
  people: number;
  guestName: string;
  guestMobile: string;
}

export async function getHomestayList(): Promise<ApiResponse<HomestayItem[]>> {
  const res = await get<ApiResponse<BackendPage<Parameters<typeof mapHomestay>[0]>>>("/homestay", {
    params: { page: 1, pageSize: 50 },
  });
  return { code: 200, message: "ok", data: res.data.list.map(mapHomestay) };
}

export async function getHomestayDetail(id: string): Promise<ApiResponse<HomestayItem>> {
  const res = await get<ApiResponse<Parameters<typeof mapHomestay>[0]>>(
    `/homestay/${encodeURIComponent(id)}`,
  );
  return { code: 200, message: "ok", data: mapHomestay(res.data) };
}

export interface HomestayReview {
  id: string;
  user: string;
  date: string;
  score: number;
  content: string;
}

export async function getHomestayReviews(id: string): Promise<ApiResponse<HomestayReview[]>> {
  const res = await get<ApiResponse<BackendPage<Record<string, unknown>>>>(
    `/homestay/${encodeURIComponent(id)}/reviews`,
    { params: { page: 1, pageSize: 5 } },
  );
  const list = (res.data.list ?? []).map((r) => ({
    id: String(r.id ?? ""),
    user: `住客 ${String(r.userId ?? "").padStart(4, "0")}`,
    date: String(r.createTime ?? "").slice(0, 10),
    score: Number(r.score ?? 0),
    content: String(r.content ?? ""),
  }));
  return { code: 200, message: "ok", data: list };
}

export async function createHomestayOrder(
  payload: CreateHomestayOrderPayload,
): Promise<ApiResponse<OrderItem>> {
  const res = await post<ApiResponse<any>>("/order/homestay", {
    homestayId: toNum(payload.homestayId),
    roomId: toNum(payload.roomTypeId),
    checkIn: payload.checkIn,
    checkOut: payload.checkOut,
    guestName: payload.guestName,
    guestMobile: payload.guestMobile,
  });
  return { code: 200, message: "ok", data: mapOrderEntity(res.data) };
}
