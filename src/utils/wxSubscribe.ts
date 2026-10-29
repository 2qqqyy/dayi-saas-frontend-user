import request from "@/utils/request";

interface WxConfig {
  configured: boolean;
  templates: Record<string, string>;
}

let cached: WxConfig | null = null;

async function getConfig(): Promise<WxConfig | null> {
  if (cached) return cached;
  try {
    const res: any = await request.get("/common/wx/config");
    const d = res?.data;
    if (d) {
      cached = { configured: !!d.configured, templates: d.templates || {} };
      return cached;
    }
  } catch {
    /* 未配置时静默跳过 */
  }
  return null;
}

/** 小程序登录：wx.login 的 code 换 openid 绑定到当前账号 */
export function bindOpenidIfNeeded() {
  // #ifdef MP-WEIXIN
  uni.login({
    provider: "weixin",
    success: async (res) => {
      if (!res.code) return;
      try {
        await request.post("/user/wx/openid", { code: res.code });
      } catch {
        /* 未配置微信凭证时后端返回失败，忽略 */
      }
    },
  });
  // #endif
}

/**
 * 订单关键节点前申请订阅消息授权（必须在用户点击手势内调用）。
 * 未配置模板时直接返回，不打扰用户。
 */
export async function requestOrderSubscribe() {
  // #ifdef MP-WEIXIN
  const cfg = await getConfig();
  if (!cfg?.configured) return;
  const ids = Object.values(cfg.templates).filter((id) => !!id);
  if (!ids.length) return;
  uni.requestSubscribeMessage({
    tmplIds: ids,
    success: () => {},
    fail: () => {},
  });
  // #endif
}
