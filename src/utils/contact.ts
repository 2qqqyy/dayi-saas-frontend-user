/**
 * 平台客服联系方式。
 *
 * 全站对外只有一个客服号：优先读后台「系统配置」contact_phone，
 * 这里的常量仅作为配置缺失时的兜底，不再冒充各商家自己的电话。
 */
export const MERCHANT_NAME = "青梅里平台客服";
export const MERCHANT_PHONE = "400-888-8888";
export const MERCHANT_SERVICE_TIME = "每日 08:30 - 20:00";

/** 展示用的分组号码：手机号 3-4-4，座机 / 400 按 3-3-4 分组 */
export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * 拨打电话。
 * H5 端 uni.makePhoneCall 不可用，因此优先用 tel: 协议跳转，
 * 小程序 / App 端仍走 uni.makePhoneCall。
 */
export function callMerchant(phone: string = MERCHANT_PHONE) {
  // #ifdef H5
  window.location.href = `tel:${phone}`;
  // #endif
  // #ifndef H5
  uni.makePhoneCall({ phoneNumber: phone });
  // #endif
}

/** 复制号码，桌面端浏览器无法直接拨号时使用 */
export function copyMerchantPhone(phone: string = MERCHANT_PHONE) {
  uni.setClipboardData({
    data: phone,
    success: () => uni.showToast({ title: "号码已复制", icon: "none" }),
  });
}

/** 复制后台配置的客服微信（contact_wechat），未配置时不展示 */
export function copyWechat(wechat: string) {
  uni.setClipboardData({
    data: wechat,
    success: () => uni.showToast({ title: "微信号已复制", icon: "none" }),
  });
}
