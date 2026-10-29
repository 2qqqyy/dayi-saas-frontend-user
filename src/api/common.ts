import type { ApiResponse } from "@/types/business";
import { get } from "@/utils/request";

/**
 * 公开系统配置（无需登录）。
 * 后台「系统配置」里改客服电话 / 站点简介 / 备案号，这里即时生效。
 */
export function getPublicConfigs(
  keys?: string[],
): Promise<ApiResponse<Record<string, string>>> {
  return get<ApiResponse<Record<string, string>>>("/common/configs", {
    params: keys && keys.length ? { keys: keys.join(",") } : undefined,
  });
}
