import { get } from "@/utils/request";
import { STORAGE_KEYS } from "@/utils/constants";
import { getStorage } from "@/utils/storage";

export interface AppearancePrefs {
  themeCode: string;
  elder: boolean;
  mode: "auto" | "light" | "dark";
  fontStyle: "serif" | "sans";
  textSize: "sm" | "md" | "lg" | "xl";
  uiScale: "sm" | "md" | "lg";
  contentWidth: "narrow" | "standard" | "wide";
  lang: "zh" | "en";
}

export const DEFAULT_PREFS: AppearancePrefs = {
  themeCode: "forest",
  elder: false,
  mode: "light",
  fontStyle: "serif",
  textSize: "md",
  uiScale: "md",
  contentWidth: "standard",
  lang: "zh",
};

const KEY = "qm-appearance-prefs";

export interface ThemeOption {
  code: string;
  name: string;
  description: string;
  primaryColor: string;
  deepColor: string;
  lightColor: string;
  accentColor: string;
  softColor: string;
  tintColor: string;
  isDefault?: number;
}

export function loadPrefs(): AppearancePrefs {
  try {
    const raw = uni.getStorageSync(KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(p: AppearancePrefs) {
  uni.setStorageSync(KEY, JSON.stringify(p));
  applyPrefs(p);
}

/** 把偏好落到 H5 根节点；小程序端由页面/tabbar 读取同一份偏好自行应用 */

/** 把主色相对默认青梅绿的色相差算出来，用于给内置绿色图标整体换色 */
function hueOf(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let hue = 0;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  return (hue * 60 + 360) % 360;
}

export function applyPrefs(p: AppearancePrefs) {
  // #ifdef H5
  const root = document.documentElement;
  root.dataset.qmElder = p.elder ? "true" : "false";
  root.dataset.qmTheme = p.themeCode;
  root.dataset.qmMode = p.mode;
  root.dataset.qmFont = p.fontStyle;
  root.dataset.qmText = p.elder ? "xl" : p.textSize;
  root.dataset.qmScale = p.elder ? "lg" : p.uiScale;
  root.dataset.qmWidth = p.contentWidth;
  root.dataset.qmLang = p.lang;

  const textFactor: Record<string, number> = { sm: 0.94, md: 1, lg: 1.06, xl: 1.12 };
  const uiFactor: Record<string, number> = { sm: 0.96, md: 1, lg: 1.05 };
  const zoom = textFactor[p.elder ? "xl" : p.textSize] * uiFactor[p.elder ? "lg" : p.uiScale];
  root.style.setProperty("--qm-zoom", String(Math.round(zoom * 100) / 100));

  try {
    const cached = uni.getStorageSync("qm-themes");
    const themes: ThemeOption[] = cached ? JSON.parse(cached) : [];
    const t = themes.find((x) => x.code === p.themeCode);
    if (t) {
      root.style.setProperty("--qm-primary", t.primaryColor);
      root.style.setProperty("--qm-deep", t.deepColor);
      root.style.setProperty("--qm-accent", t.accentColor);
      root.style.setProperty("--qm-soft", t.softColor);
      root.style.setProperty("--qm-tint-40", t.tintColor + "66");
      root.style.setProperty("--qm-soft-70", t.softColor + "B3");
      root.style.setProperty("--qm-primary-08", t.primaryColor + "14");
      root.style.setProperty("--qm-primary-20", t.primaryColor + "33");
      root.style.setProperty("--qm-hero-top", t.deepColor + "99");
      const shift = Math.round(hueOf(t.primaryColor) - hueOf("#2f5d43"));
      root.style.setProperty("--qm-icon-filter", `hue-rotate(${shift}deg) saturate(1.05)`);
    }
  } catch {
    /* 主题缓存损坏时用默认绿 */
  }
  // #endif
}

export function cacheThemes(themes: ThemeOption[]) {
  uni.setStorageSync("qm-themes", JSON.stringify(themes));
}

export async function fetchThemes(): Promise<ThemeOption[]> {
  const res = await get<{ code: number; data: { themes: ThemeOption[]; defaultTheme: string } }>(
    "/common/appearance",
  );
  return (res.data as any)?.themes ?? [];
}

function hasToken(): boolean {
  return !!getStorage<string>(STORAGE_KEYS.token, "");
}

export async function fetchRemotePrefs(): Promise<Partial<AppearancePrefs> | null> {
  // 外观是设备级偏好：未登录不去请求，避免 401 把访客踢回登录页
  if (!hasToken()) return null;
  try {
    const res = await get<any>("/user/preferences");
    const d = res.data || {};
    return {
      themeCode: d.themeCode || undefined,
      elder: d.elderMode === true || d.elderMode === 1,
    };
  } catch {
    return null;
  }
}

export async function pushRemotePrefs(p: AppearancePrefs) {
  if (!hasToken()) return;
  try {
    await (await import("@/utils/request")).put("/user/preferences", {
      themeCode: p.themeCode,
      elderMode: p.elder,
    });
  } catch {
    /* 未登录或网络异常时只保留本地偏好 */
  }
}
