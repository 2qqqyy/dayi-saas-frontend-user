import type { ApiResponse } from "@/types/business";
import { get } from "@/utils/request";

/** 公告（后台「内容管理-公告」维护，未登录可见 ALL + USER） */
export interface NoticeItem {
  id: number;
  title: string;
  titleEn?: string;
  summary: string;
  summaryEn?: string;
  contentEn?: string;
  /** NOTICE 村务提醒 / ACTIVITY 活动 / SYSTEM 系统 */
  category: string;
  audience: string;
  pinned: boolean;
  publishTime: string;
  expireTime: string;
  read?: boolean;
  content?: string;
}

export const NOTICE_CATEGORY_LABEL: Record<string, string> = {
  NOTICE: "村务提醒",
  ACTIVITY: "山野活动",
  SERVICE: "服务通知",
  SYSTEM: "系统通知",
};

export function getNotices(limit = 6): Promise<ApiResponse<NoticeItem[]>> {
  return get<ApiResponse<NoticeItem[]>>("/common/notices", { params: { limit } });
}

export function getNoticeDetail(id: number | string): Promise<ApiResponse<NoticeItem>> {
  return get<ApiResponse<NoticeItem>>(`/common/notices/${id}`);
}
