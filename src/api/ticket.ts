import request from "@/utils/request";
import type { ApiResponse } from "@/types/business";

export interface TicketRow {
  id: number;
  ticketNo: string;
  orderId?: number;
  merchantId?: number;
  category: string;
  title: string;
  status: number;
  priority: number;
  createTime: string;
  updateTime: string;
}

export interface TicketMessage {
  id: number;
  senderType: "USER" | "MERCHANT" | "ADMIN";
  senderName: string;
  content: string;
  createTime: string;
}

export interface TicketListRow {
  ticket: TicketRow;
  userName?: string;
  lastMessage?: string;
}

export const TICKET_CATEGORY: Record<string, string> = {
  AFTER_SALE: "售后问题",
  REFUND: "退款纠纷",
  COMPLAINT: "投诉商家",
  OTHER: "其他咨询",
};

export const TICKET_STATUS: Record<number, string> = {
  0: "待处理",
  1: "处理中",
  2: "已解决",
  3: "已关闭",
};

export async function getTickets(page = 1, pageSize = 20): Promise<ApiResponse<TicketListRow[]>> {
  const res: any = await request.get("/user/tickets", { params: { page, pageSize } });
  const d = res?.data ?? {};
  return { code: 0, message: "ok", data: Array.isArray(d.list) ? d.list : [] };
}

export async function createTicket(payload: {
  orderId?: number;
  category: string;
  title: string;
  content: string;
}): Promise<ApiResponse<TicketRow | null>> {
  const res: any = await request.post("/user/tickets", payload);
  return { code: 0, message: res?.message ?? "ok", data: res?.data ?? null };
}

export async function getTicketDetail(id: number | string): Promise<
  ApiResponse<{ ticket: TicketRow; messages: TicketMessage[]; merchantName?: string } | null>
> {
  const res: any = await request.get(`/user/tickets/${id}`);
  const ok = res?.code === 0 || res?.code === 200;
  if (!ok) return { code: res?.code ?? -1, message: res?.message ?? "加载失败", data: null };
  return { code: 0, message: "ok", data: res.data };
}

export async function replyTicket(id: number | string, content: string): Promise<ApiResponse<boolean>> {
  const res: any = await request.post(`/user/tickets/${id}/messages`, { content });
  return { code: 0, message: res?.message ?? "ok", data: res?.code === 0 || res?.code === 200 };
}

export async function closeTicket(id: number | string): Promise<ApiResponse<boolean>> {
  const res: any = await request.put(`/user/tickets/${id}/close`);
  return { code: 0, message: res?.message ?? "ok", data: res?.code === 0 || res?.code === 200 };
}
