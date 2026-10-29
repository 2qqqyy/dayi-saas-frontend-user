import type { ApiResponse } from "@/types/business";
import { get } from "@/utils/request";

/** 首页四大业务线入口 */
export interface HomeFeature {
  title: string;
  desc: string;
  path: string;
  /** 入口图标的 svg path */
  d: string;
  bg: string;
  color: string;
}

/** 首页模块标题 */
export interface HomeSection {
  title: string;
  subtitle: string;
  /** 「更多」跳转地址，季节推荐位为空字符串 */
  more: string;
}

/** 后台「内容管理-轮播图」维护，linkType 为空或未知时视为纯展示 */
export interface HomeBanner {
  titleEn?: string;
  id: number;
  title: string;
  image: string;
  /** picking / homestay / mall / ai / route / scenic / url */
  linkType: string;
  /** 与 linkType 配合：scenic 放景点 id，url 放外链 */
  linkUrl: string;
}

/** 后台「内容管理-攻略」维护，首页只下发最新 4 条 */
export interface HomeGuide {
  titleEn?: string;
  id: number;
  title: string;
  author: string;
  cover: string;
  viewCount: number;
  publishTime: string;
}

export interface HomeConfig {
  /** 品牌头图 */
  heroImage: string;
  features: HomeFeature[];
  sections: {
    routes: HomeSection;
    picking: HomeSection;
    homestay: HomeSection;
    season: HomeSection;
    product: HomeSection;
  };
  season: { image: string; title: string; desc: string; path: string };
  aiEntry: { title: string; desc: string; path: string };
  banners?: HomeBanner[];
  guides?: HomeGuide[];
}

/** 轮播图 linkType → 站内页面，与后台「内容管理-轮播图」的跳转类型一一对应 */
const BANNER_LINK_PATH: Record<string, string> = {
  picking: "pages/travel/picking",
  homestay: "pages/travel/homestay",
  mall: "pages/mall/index",
  ai: "pages/ai/index",
  route: "pages/travel/index",
  scenic: "pages/travel/scenic-detail",
  product: "pages/mall/product-detail",
};

/** 需要在「跳转目标」里填内容 ID 的类型，缺 ID 时退回对应列表页 */
const BANNER_ID_FALLBACK: Record<string, string> = {
  scenic: "pages/travel/index",
  product: "pages/mall/index",
};

/**
 * 解析轮播图跳转：
 * - url → 仅接受 http(s) 外链；
 * - scenic / product → 拼成详情页并带上后台填的 ID；
 * - 其余未知类型返回空串，页面按纯展示处理，不会出现点了没反应的死链。
 */
export function resolveBannerPath(banner: HomeBanner): string {
  const url = (banner.linkUrl || "").trim();
  const type = (banner.linkType || "").trim().toLowerCase();
  if (type === "url") return /^https?:\/\//i.test(url) ? url : "";
  const base = BANNER_LINK_PATH[type] || "";
  if (!base) return "";
  if (BANNER_ID_FALLBACK[type]) {
    return url ? `${base}?id=${encodeURIComponent(url)}` : BANNER_ID_FALLBACK[type];
  }
  return base;
}

export function getHomeConfig(): Promise<ApiResponse<HomeConfig>> {
  return get<ApiResponse<HomeConfig>>("/home/config");
}
