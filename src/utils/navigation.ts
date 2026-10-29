import { TAB_PAGES } from "@/utils/constants";

export function go(path: string) {
  // 底部 Tab 页未使用原生 tabBar，改用 reLaunch 切换自定义导航
  if (TAB_PAGES.includes(path)) {
    uni.reLaunch({ url: `/${path}` });
    return;
  }
  uni.navigateTo({ url: `/${path}` });
}

export function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
    return;
  }
  // 项目未配置原生 tabBar，switchTab 会失败，须用 reLaunch 回首页
  uni.reLaunch({ url: "/pages/index/index" });
}

export function requireLogin(nextPath?: string) {
  uni.navigateTo({
    url: nextPath
      ? `/pages/user/login?redirect=${encodeURIComponent(`/${nextPath}`)}`
      : "/pages/user/login",
  });
}
