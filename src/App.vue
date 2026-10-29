<script setup lang="ts">
import { onLaunch, onPageNotFound } from "@dcloudio/uni-app";
import { useAppStore } from "@/stores/app";
import { useUserStore } from "@/stores/user";
import { useOrderStore } from "@/stores/order";
import { useCartStore } from "@/stores/cart";
import { applyPrefs, loadPrefs } from "@/utils/appearance";
import { startAutoTranslate } from "@/utils/i18n";
import { bindOpenidIfNeeded } from "@/utils/wxSubscribe";

// #ifdef MP-WEIXIN
onPageNotFound(() => {
  uni.reLaunch({ url: "/pages/common/error" });
});
// #endif

onLaunch(() => {
  applyPrefs(loadPrefs());
  bindOpenidIfNeeded();
  startAutoTranslate();
  const appStore = useAppStore();
  const sys = uni.getSystemInfoSync();
  appStore.setSafeArea(sys.statusBarHeight ?? 0, sys.safeAreaInsets?.bottom ?? 0);

  // 用户态、订单由 Pinia 在初始化时从本地 storage 自动恢复；购物车登录后以服务端为准
  const userStore = useUserStore();
  const orderStore = useOrderStore();
  const cartStore = useCartStore();

  // 收藏 / 地址首次进入时由接口下发，这里统一触发一次
  // （失败不阻塞启动，页面自身的错误态会给出提示）
  userStore.ensureSeeded().catch((e) => {
    console.error("[app] 初始化收藏与地址失败", e);
  });

  if (userStore.isLogin) {
    orderStore.ensureSeeded().catch((e) => {
      console.error("[app] 初始化订单失败", e);
    });
    // 启动即对齐一次服务端购物车，角标不会停留在上个账号的本地缓存上
    cartStore.syncFromServer();
  }
});
</script>

<style lang="scss">
body {
  background-color: #dfe8dd;
}

page {
  --qm-type-scale: 1;
  max-width: $app-max-width;
  margin: 0 auto;
  background-color: $canvas-a;
  color: $text-main;
  font-family: "SF Pro Text", -apple-system, BlinkMacSystemFont, "PingFang SC",
    "Helvetica Neue", "Microsoft YaHei", sans-serif;
  font-size: $font-md;
  line-height: 1.6;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

/* 宽屏（PC）下给居中容器一层柔和描边，避免"悬浮一列"的割裂感 */
@media (min-width: #{$app-max-width + 1px}) {
  page {
    box-shadow: 0 0 120rpx rgba(16, 36, 26, 0.08);
  }
}

view,
text,
image,
scroll-view,
button,
input,
textarea {
  box-sizing: border-box;
}

input,
textarea {
  font-family: inherit;
}

/* ---------- 统一图标尺寸（H5 下 svg 里的 rpx 不生效，必须用 CSS 约束） ---------- */
.icon-xs svg {
  width: 36rpx;
  height: 36rpx;
}
.icon-sm svg {
  width: 44rpx;
  height: 44rpx;
}
.icon-md svg {
  width: 56rpx;
  height: 56rpx;
}

/* ---------- 页面容器：底部给悬浮胶囊 tabbar 留出空间 ---------- */
.page {
  min-height: 100vh;
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

.page--detail {
  padding-bottom: calc(180rpx + env(safe-area-inset-bottom));
}

/* ---------- 表面与按钮 ---------- */
.card {
  background: $glass-1;
  border: 1rpx solid $glass-edge;
  border-radius: $radius-xl;
  box-shadow: $glass-shadow;
  backdrop-filter: blur(20px) saturate(168%);
  -webkit-backdrop-filter: blur(20px) saturate(168%);
}

/* 宋体只给大标题，正文仍用无衬线 */
.serif {
  font-family: $font-serif;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: $radius-lg;
  background: $green;
  color: #f7f3e6;
  font-size: 30rpx;
  font-weight: 600;
  letter-spacing: 0.02em;
  border: none;
  transition: transform 0.16s $ease, opacity 0.16s $ease;
}

.btn-primary:active {
  transform: scale(0.98);
  opacity: 0.92;
}

.btn-ghost {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: $radius-lg;
  background: rgba(255, 255, 255, 0.5);
  color: $ink;
  font-size: 30rpx;
  font-weight: 500;
  border: 1rpx solid $line-strong;
  transition: transform 0.16s $ease;
}

.btn-ghost:active {
  transform: scale(0.98);
}

.btn-pill {
  border-radius: 999rpx;
}

.btn-sm {
  height: 64rpx;
  padding: 0 28rpx;
  font-size: 26rpx;
  border-radius: $radius-md;
}

/* ---------- 文本工具类 ---------- */
.text-sub {
  color: $text-sub;
}

.text-green {
  color: $green;
}

.ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

/* 数字用等宽字形，金额/统计不跳动 */
.tnum {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}

/* 统一的按压反馈：所有可点元素都能套 */
.press {
  transition: transform 0.16s $ease, opacity 0.16s $ease;
}
.press:active {
  transform: scale(0.985);
  opacity: 0.92;
}

/* ---------- 统一底部操作栏 ---------- */
.bottom-bar {
  position: fixed;
  left: 50%;
  right: auto;
  bottom: 0;
  z-index: 20;
  width: 100%;
  max-width: $app-max-width;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 32rpx calc(20rpx + env(safe-area-inset-bottom));
  background: rgba(255, 253, 248, 0.96);
  border-top: 1rpx solid $line;
}

/* ---------- 统一区块间距 ---------- */
.section-gap {
  margin-top: $space-xl;
}

/* 入场：一次编排好的轻微上浮，不逐块乱动 */
@keyframes qm-rise {
  from {
    opacity: 0;
    transform: translateY(16rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.rise {
  animation: qm-rise 0.52s $ease both;
}

@media (prefers-reduced-motion: reduce) {
  .rise {
    animation: none;
  }
  .press:active,
  .btn-primary:active,
  .btn-ghost:active {
    transform: none;
  }
}
page {
  background-color: $canvas-a;
  background-image:
    radial-gradient(120% 55% at 8% 0%, rgba(201, 219, 154, 0.55) 0%, rgba(201, 219, 154, 0) 58%),
    radial-gradient(95% 50% at 96% 10%, rgba(120, 174, 150, 0.42) 0%, rgba(120, 174, 150, 0) 62%),
    radial-gradient(120% 60% at 50% 104%, rgba(244, 238, 220, 0.85) 0%, rgba(244, 238, 220, 0) 66%);
  background-attachment: fixed;
}

/* ================= Liquid Glass ================= */
.glass {
  background: $glass-1;
  border: 1rpx solid $glass-edge;
  box-shadow: $glass-shadow;
  backdrop-filter: blur(20px) saturate(170%);
  -webkit-backdrop-filter: blur(20px) saturate(170%);
}
.glass-soft {
  background: $glass-2;
  border: 1rpx solid $glass-edge-soft;
  box-shadow: 0 18rpx 50rpx -34rpx rgba(16, 36, 26, 0.4), inset 0 2rpx 0 rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
}
.glass-dark {
  background: $glass-dark;
  border: 1rpx solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 30rpx 70rpx -30rpx rgba(8, 18, 12, 0.6), inset 0 2rpx 0 rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass { background: rgba(255, 255, 255, 0.86); }
  .glass-soft { background: rgba(255, 255, 255, 0.74); }
  .glass-dark { background: rgba(16, 36, 26, 0.9); }
}

/* ================= 外观偏好（H5） ================= */

/* 整套跟着主题走：分隔线、标签、内置绿色图标、AI 深色块 */
html[data-qm-theme] .section-title {
  border-top-color: var(--qm-primary-20, rgba(46, 94, 68, 0.2)) !important;
}
html[data-qm-theme] .bulletin__tag,
html[data-qm-theme] .product__shop,
html[data-qm-theme] .orders__icon,
html[data-qm-theme] .tabbar__label.active,
html[data-qm-theme] .theme__name,
html[data-qm-theme] .more-goods {
  color: var(--qm-primary, #2f5d43) !important;
}
html[data-qm-theme] .features__icon,
html[data-qm-theme] .tabbar__img,
html[data-qm-theme] .picking__from {
  filter: var(--qm-icon-filter, none);
}
html[data-qm-theme] .ai-entry {
  background: linear-gradient(160deg, var(--qm-deep, #10241a) 0%, #0b1712 100%) !important;
}
html[data-qm-theme] .seg__item--on {
  color: var(--qm-deep, #10241a) !important;
}


/* 主题：整页底色 / 头图 / 选中态一起变，切主题一眼可见 */
html[data-qm-theme] page {
  background-image:
    radial-gradient(120% 55% at 8% 0%, var(--qm-tint-40, rgba(201, 219, 154, 0.4)) 0%, rgba(201, 219, 154, 0) 58%),
    radial-gradient(95% 50% at 96% 10%, var(--qm-soft-70, rgba(120, 174, 150, 0.42)) 0%, rgba(120, 174, 150, 0) 62%),
    radial-gradient(120% 60% at 50% 104%, rgba(244, 238, 220, 0.85) 0%, rgba(244, 238, 220, 0) 66%) !important;
}
html[data-qm-theme] .hero__veil {
  background: linear-gradient(
    180deg,
    var(--qm-hero-top, rgba(9, 20, 14, 0.34)) 0%,
    rgba(9, 20, 14, 0) 28%,
    rgba(9, 20, 14, 0.08) 52%,
    rgba(8, 18, 12, 0.66) 100%
  ) !important;
}
html[data-qm-theme] .tabbar__item.active {
  background: var(--qm-primary-08, rgba(46, 94, 68, 0.08)) !important;
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.95), 0 8rpx 20rpx -14rpx var(--qm-primary-20, rgba(46, 94, 68, 0.2)) !important;
}
html[data-qm-theme] .features__icon-wrap {
  border-color: var(--qm-primary-20, rgba(46, 94, 68, 0.2)) !important;
}
html[data-qm-theme] .more-goods {
  color: var(--qm-primary, #2f5d43) !important;
}
html[data-qm-theme] .product__cart {
  border-color: var(--qm-primary-20, rgba(46, 94, 68, 0.2)) !important;
}

/* #ifdef H5 */
html[data-qm-width="narrow"] page {
  max-width: 420px !important;
}
html[data-qm-width="standard"] page {
  max-width: 480px !important;
}
html[data-qm-width="wide"] page {
  max-width: 640px !important;
}
uni-page-body {
  zoom: var(--qm-zoom, 1);
}
html[data-qm-font="sans"] .navbar__title,
html[data-qm-font="sans"] .section-title__main,
html[data-qm-font="sans"] .hero__title,
html[data-qm-font="sans"] .login__headline,
html[data-qm-font="sans"] .profile__name,
html[data-qm-font="sans"] .orders__title,
html[data-qm-font="sans"] .route__title,
html[data-qm-font="sans"] .picking__name,
html[data-qm-font="sans"] .homestay__name,
html[data-qm-font="sans"] .scenic__name {
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif !important;
}
html[data-qm-theme] .btn-primary,
html[data-qm-theme] .login__submit {
  background: var(--qm-primary, #2f5d43) !important;
}
html[data-qm-theme] .tabbar__label.active,
html[data-qm-theme] .section-title__more {
  color: var(--qm-primary, #2f5d43) !important;
}
html[data-qm-mode="dark"] page {
  background-color: #0b1410 !important;
  background-image:
    radial-gradient(120% 55% at 8% 0%, rgba(46, 94, 68, 0.5) 0%, rgba(46, 94, 68, 0) 58%),
    radial-gradient(120% 60% at 50% 104%, rgba(50, 40, 28, 0.5) 0%, rgba(50, 40, 28, 0) 66%) !important;
  color: #eef3ee !important;
}
html[data-qm-mode="dark"] .nb {
  background: rgba(14, 23, 18, 0.86) !important;
  border-bottom-color: rgba(255, 255, 255, 0.12) !important;
}

html[data-qm-mode="dark"] .nb__icon {
  filter: invert(0.92);
}

html[data-qm-mode="dark"] .glass,
html[data-qm-mode="dark"] .glass-soft,
html[data-qm-mode="dark"] .product,
html[data-qm-mode="dark"] .picking,
html[data-qm-mode="dark"] .homestay,
html[data-qm-mode="dark"] .profile,
html[data-qm-mode="dark"] .orders,
html[data-qm-mode="dark"] .menus,
html[data-qm-mode="dark"] .features,
html[data-qm-mode="dark"] .bulletin,
html[data-qm-mode="dark"] .card {
  background: rgba(255, 255, 255, 0.07) !important;
  border-color: rgba(255, 255, 255, 0.14) !important;
}
html[data-qm-mode="dark"] .section-title__main,
html[data-qm-mode="dark"] .navbar__title,
html[data-qm-mode="dark"] .profile__name,
html[data-qm-mode="dark"] .orders__title,
html[data-qm-mode="dark"] .route__title,
html[data-qm-mode="dark"] .picking__name,
html[data-qm-mode="dark"] .homestay__name,
html[data-qm-mode="dark"] .scenic__name,
html[data-qm-mode="dark"] .product__name,
html[data-qm-mode="dark"] .menus__label {
  color: #eef3ee !important;
}
html[data-qm-mode="dark"] .section-title__sub,
html[data-qm-mode="dark"] .menus__desc,
html[data-qm-mode="dark"] .product__summary,
html[data-qm-mode="dark"] .hero__slogan {
  color: rgba(238, 243, 238, 0.62) !important;
}
html[data-qm-elder="true"] .tabbar__label {
  font-size: 22rpx !important;
}
html[data-qm-elder="true"] .menus__label {
  font-size: 30rpx !important;
}
html[data-qm-elder="true"] .product__name {
  font-size: 30rpx !important;
}
/* #endif */
</style>
