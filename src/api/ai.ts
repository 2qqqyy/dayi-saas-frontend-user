import type { ApiResponse, AIMessage, ItineraryPlan } from "@/types/business";
import { get, post } from "@/utils/request";

export interface AIChatPayload {
  message: string;
  /** 同一会话共用 sessionId，后台「AI 客服」按会话聚合查看 */
  sessionId?: string;
}

export interface ItineraryPayload {
  date: string;
  people: number;
  type: string;
}

export function chatWithAI(payload: AIChatPayload): Promise<ApiResponse<AIMessage>> {
  return post<ApiResponse<AIMessage>>("/ai/chat", payload);
}

export function generateItinerary(
  payload: ItineraryPayload,
): Promise<ApiResponse<ItineraryPlan>> {
  return post<ApiResponse<ItineraryPlan>>("/ai/itinerary", payload);
}

export function saveItinerary(id: number): Promise<ApiResponse<null>> {
  return post<ApiResponse<null>>(`/ai/itinerary/${id}/save`);
}

/** 推荐问题：取后台知识库中启用的条目标题，运营新增知识即影响此处 */
export function getAISuggestions(): Promise<ApiResponse<string[]>> {
  return get<ApiResponse<string[]>>("/ai/suggestions");
}

/**
 * 问答反馈：写 ai_conversation 的 resolved / transferred，
 * 后台「AI 客服」的解决率与转人工列表据此统计。
 * 注意后端用 Boolean.parseBoolean 解析，必须传真正的布尔值。
 */
export function submitAiFeedback(payload: {
  sessionId: string;
  resolved?: boolean;
  transferred?: boolean;
}): Promise<ApiResponse<null>> {
  return post<ApiResponse<null>>("/ai/conversations/feedback", payload);
}
