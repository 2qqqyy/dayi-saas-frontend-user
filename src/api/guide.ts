import type { ApiResponse } from "@/types/business";
import { get } from "@/utils/request";
import type { HomeGuide } from "@/api/home";

export interface GuideDetail extends HomeGuide {
  /** 正文纯文本，按换行分段渲染 */
  content: string;
}

/** 攻略列表：后台「内容管理-攻略」新增/下架后即时生效 */
export function getGuideList(): Promise<ApiResponse<HomeGuide[]>> {
  return get<ApiResponse<HomeGuide[]>>("/guides");
}

/** 攻略详情，后端会顺带把浏览量 +1 */
export function getGuideDetail(id: string | number): Promise<ApiResponse<GuideDetail>> {
  return get<ApiResponse<GuideDetail>>(`/guides/${id}`);
}
