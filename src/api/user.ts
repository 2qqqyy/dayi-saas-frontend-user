import type { AddressItem, ApiResponse, FavoriteItem, UserInfo } from "@/types/business";
import { del, get, post, put } from "@/utils/request";
import { mapAddress, mapFavorite, mapUserInfo, toStr } from "@/utils/backend";

export interface LoginPayload {
  mobile: string;
  code: string;
}

export function sendSmsCode(mobile: string): Promise<ApiResponse<{ expire: number }>> {
  return post<ApiResponse<{ expire: number }>>("/user/sms", { mobile });
}

export async function login(
  payload: LoginPayload,
): Promise<ApiResponse<{ token: string; userInfo: UserInfo }>> {
  const res = await post<
    ApiResponse<{ token: string; expireAt: number; userInfo: Parameters<typeof mapUserInfo>[0] }>
  >("/user/login", payload);
  return {
    code: 200,
    message: "ok",
    data: { token: res.data.token, userInfo: mapUserInfo(res.data.userInfo) },
  };
}

/** 注册：与登录分开走 /auth/register，后台「允许新用户注册」开关只拦这条链路 */
export async function register(
  payload: LoginPayload & { nickname?: string },
): Promise<ApiResponse<{ token: string; userInfo: UserInfo }>> {
  const res = await post<
    ApiResponse<{ token: string; expireAt: number; userInfo: Parameters<typeof mapUserInfo>[0] }>
  >("/auth/register", payload);
  return {
    code: 200,
    message: "ok",
    data: { token: res.data.token, userInfo: mapUserInfo(res.data.userInfo) },
  };
}

export async function getUserInfo(): Promise<ApiResponse<UserInfo>> {
  const res = await get<ApiResponse<Parameters<typeof mapUserInfo>[0]>>("/user/info");
  return { code: 200, message: "ok", data: mapUserInfo(res.data) };
}

/** 更新昵称/头像：后端只回 msg，改完重新拉一次以服务端为准 */
export async function updateUserInfo(
  patch: { nickname?: string; avatar?: string },
): Promise<ApiResponse<UserInfo>> {
  await put("/user/info", patch);
  return getUserInfo();
}

/** 新增收藏，返回服务端落库后的收藏行（含 rowId） */
export async function addFavorite(
  payload: { targetId: string; type: FavoriteItem["type"]; title: string; subtitle: string; image: string },
): Promise<ApiResponse<FavoriteItem>> {
  const res = await post<ApiResponse<Parameters<typeof mapFavorite>[0]>>("/user/favorites", {
    targetId: Number(payload.targetId),
    type: payload.type,
    title: payload.title,
    subtitle: payload.subtitle,
    // 占位图是本地兜底用的 base64，不能写进 image varchar(255)
    image: payload.image.startsWith("data:") ? "" : payload.image,
  });
  return { code: 200, message: "ok", data: mapFavorite(res.data) };
}

/** 取消收藏：按 favorite 表主键删，本地未落库的收藏没有 rowId */
export async function removeFavorite(rowId: string): Promise<ApiResponse<boolean>> {
  await del(`/user/favorites/${toStr(rowId)}`);
  return { code: 200, message: "ok", data: true };
}

/** 收藏列表（首次进入时用于初始化本地收藏） */
export async function getFavorites(): Promise<ApiResponse<FavoriteItem[]>> {
  const res = await get<ApiResponse<Parameters<typeof mapFavorite>[0][]>>("/user/favorites");
  return { code: 200, message: "ok", data: res.data.map(mapFavorite) };
}

/** 收货地址列表（首次进入时用于初始化本地地址） */
export async function getAddresses(): Promise<ApiResponse<AddressItem[]>> {
  const res = await get<ApiResponse<Parameters<typeof mapAddress>[0][]>>("/user/addresses");
  return { code: 200, message: "ok", data: res.data.map(mapAddress) };
}

/** 保存地址（新建 POST / 已有 PUT，均落库返回真实 id） */
export async function saveAddress(address: AddressItem): Promise<ApiResponse<AddressItem>> {
  const body = {
    receiver: address.name,
    mobile: address.mobile,
    province: address.province,
    city: address.city,
    district: address.district,
    detail: address.detail,
    isDefault: address.isDefault ? 1 : 0,
  };
  const numericId = /^\d+$/.test(address.id);
  const raw = numericId
    ? await put<ApiResponse<Parameters<typeof mapAddress>[0]>>(
        `/user/addresses/${address.id}`,
        body,
      )
    : await post<ApiResponse<Parameters<typeof mapAddress>[0]>>("/user/addresses", body);
  return { code: 200, message: "ok", data: mapAddress(raw.data) };
}

/** 删除地址 */
export async function deleteAddress(id: string): Promise<ApiResponse<boolean>> {
  await del(`/user/addresses/${toStr(id)}`);
  return { code: 200, message: "ok", data: true };
}

/** 设为默认地址 */
export async function setDefaultAddress(id: string): Promise<ApiResponse<boolean>> {
  await put(`/user/addresses/${toStr(id)}/default`);
  return { code: 200, message: "ok", data: true };
}

/** ===== 意见反馈：提交后进入后台「用户反馈」处理，回复在本页可见 ===== */

export interface FeedbackPayload {
  type: string;
  content: string;
  contact?: string;
}

export interface FeedbackRecord {
  id: string;
  type: string;
  content: string;
  /** 0 待处理 / 1 已处理 */
  status: number;
  reply: string;
  handler: string;
  time: string;
}

export function getFeedbackTypes(): Promise<ApiResponse<string[]>> {
  return get<ApiResponse<string[]>>("/user/feedback/types");
}

export function submitFeedback(
  payload: FeedbackPayload,
): Promise<ApiResponse<{ id: string }>> {
  return post<ApiResponse<{ id: string }>>("/user/feedback", payload);
}

export function getMyFeedback(): Promise<ApiResponse<FeedbackRecord[]>> {
  return get<ApiResponse<FeedbackRecord[]>>("/user/feedback");
}
