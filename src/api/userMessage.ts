import type { ApiResponse } from "@/types/business";
import request from "@/utils/request";

export interface UserMessageItem {
  id: number;
  type: string;
  orderId?: number;
  title: string;
  titleEn?: string;
  content: string;
  contentEn?: string;
  readFlag: number;
  createTime: string;
}

export async function getMessages(): Promise<ApiResponse<UserMessageItem[]>> {
  const res: any = await request.get("/user/messages");
  return { code: 0, message: "ok", data: Array.isArray(res?.data) ? res.data : [] };
}

export async function getUnreadCount(): Promise<ApiResponse<number>> {
  const res: any = await request.get("/user/messages/unread-count");
  const n = Number(res?.data);
  return { code: 0, message: "ok", data: Number.isFinite(n) ? n : 0 };
}

export async function markRead(id: number): Promise<ApiResponse<boolean>> {
  await request.post(`/user/messages/${id}/read`);
  return { code: 0, message: "ok", data: true };
}

export async function markAllRead(): Promise<ApiResponse<boolean>> {
  await request.post("/user/messages/read-all");
  return { code: 0, message: "ok", data: true };
}
