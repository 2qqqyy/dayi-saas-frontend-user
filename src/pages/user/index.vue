<script setup lang="ts">
import { computed, ref } from "vue";
import { tr } from "@/utils/i18n";
import { onShow } from "@dcloudio/uni-app";
import type { OrderStatus } from "@/types/business";
import { useUserStore } from "@/stores/user";
import { getUnreadCount } from "@/api/userMessage";
import { useOrderStore } from "@/stores/order";
import { useCartStore } from "@/stores/cart";
import { useAppStore } from "@/stores/app";
import { go } from "@/utils/navigation";
import { requireLogin } from "@/utils/navigation";

import AppTabBar from "@/components/AppTabBar.vue";
import AppNavbar from "@/components/AppNavbar.vue";

const userStore = useUserStore();
const orderStore = useOrderStore();
const cartStore = useCartStore();
const appStore = useAppStore();

// 后台改了订单状态、收藏或资料，回到「我的」就能看到，不用重开小程序
onShow(() => {
  loadUnread();
  if (!userStore.isLogin) return;
  userStore.fetchUserInfo().catch(() => {});
  userStore.ensureSeeded(true).catch(() => {});
  orderStore.ensureSeeded().catch(() => {});
  cartStore.syncFromServer();
});

/** 订单快捷入口，图标用 SVG path，避免 emoji 在各端表现不一致 */
const orderEntries: { label: string; path: string; status: OrderStatus; d: string }[] = [
  {
    label: "待付款",
    status: "pending_payment",
    path: "pages/order/index?status=pending_payment",
    d: "M3 7h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zM3 10h18M7 15h4",
  },
  {
    label: "待使用",
    status: "pending_use",
    path: "pages/order/index?status=pending_use",
    d: "M4 6h16v13H4zM8 3v4M16 3v4M4 11h16",
  },
  {
    label: "待收货",
    status: "pending_receive",
    path: "pages/order/index?status=pending_receive",
    d: "M2 7l10-4 10 4v10l-10 4-10-4V7zM2 7l10 4 10-4M12 21V11",
  },
  {
    label: "售后",
    status: "after_sale",
    path: "pages/order/index?status=after_sale",
    d: "M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6",
  },
];

const menus: { label: string; desc: string; path: string; guest?: boolean }[] = [
  { label: "我的订单", desc: "查看全部订单", path: "pages/order/index" },
  { label: "我的收藏", desc: "景点 / 民宿 / 商品 / 路线", path: "pages/user/favorite" },
  { label: "收货地址", desc: "管理常用地址", path: "pages/user/address" },
  { label: "个人资料", desc: "头像与昵称", path: "pages/user/profile" },
  // 攻略是公开内容，游客也能看，不套登录拦截
  { label: "山野攻略", desc: "游玩路线与体验分享", path: "pages/travel/guide", guest: true },
];

const visibleMenus = computed(() => menus.filter((m) => m.label !== "我的订单"));

const unreadMsg = ref(0);
async function loadUnread() {
  if (!userStore.isLogin) {
    unreadMsg.value = 0;
    return;
  }
  const res = await getUnreadCount();
  unreadMsg.value = res.data ?? 0;
}

function badgeOf(status: OrderStatus) {
  if (!userStore.isLogin) return 0;
  return orderStore.countByStatus(status);
}

function onMenu(menu: (typeof menus)[number]) {
  if (!menu.guest && !userStore.isLogin) {
    requireLogin(menu.path);
    return;
  }
  go(menu.path);
}

function onOrderEntry(path: string) {
  if (!userStore.isLogin) {
    requireLogin(path);
    return;
  }
  go(path);
}

function onLogin() {
  go("pages/user/login");
}

function onLogout() {
  uni.showModal({
    title: tr("提示"),
    content: tr("确定退出登录吗？"),
    success: (res) => {
      if (res.confirm) {
        userStore.logout();
        // 购物车、订单是按账号缓存的，退出时一并清掉，避免换号后看到上一个人的数据
        cartStore.clearLocal();
        orderStore.clearLocal();
        uni.showToast({ title: tr("已退出登录"), icon: "none" });
      }
    },
  });
}

/* 小程序不渲染内联 svg，订单入口与头像占位统一用 data URI */
const ICON_ORDER_1 =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTQxODFBIiBzdHJva2Utd2lkdGg9IjEuNiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMyA3aDE4djExYTIgMiAwIDAgMS0yIDJINWEyIDIgMCAwIDEtMi0yVjd6TTMgMTBoMThNNyAxNWg0Ii8+PC9zdmc+";
const ICON_ORDER_2 =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTQxODFBIiBzdHJva2Utd2lkdGg9IjEuNiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNNCA2aDE2djEzSDR6TTggM3Y0TTE2IDN2NE00IDExaDE2Ii8+PC9zdmc+";
const ICON_ORDER_3 =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTQxODFBIiBzdHJva2Utd2lkdGg9IjEuNiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMiA3bDEwLTQgMTAgNHYxMGwtMTAgNC0xMC00Vjd6TTIgN2wxMCA0IDEwLTRNMTIgMjFWMTEiLz48L3N2Zz4=";
const ICON_ORDER_4 =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTQxODFBIiBzdHJva2Utd2lkdGg9IjEuNiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjAgMTFhOCA4IDAgMSAwLTIuMyA1LjdNMjAgNXY2aC02Ii8+PC9zdmc+";
const ICON_USER =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOEE5Mjk2IiBzdHJva2Utd2lkdGg9IjEuNiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjgiIHI9IjQiLz48cGF0aCBkPSJNNCAyMWMwLTQgMy42LTYgOC02czggMiA4IDYiLz48L3N2Zz4=";
const ORDER_ICONS = [ICON_ORDER_1, ICON_ORDER_2, ICON_ORDER_3, ICON_ORDER_4];


</script>

<template>
  <view class="user">
    <view class="user__head" :style="{ paddingTop: appStore.safeAreaTop + 'px' }">
      <AppNavbar :title="tr('我的')" />
    </view>

    <view class="user__body">
      <!-- 个人信息 -->
      <view class="profile" @tap="userStore.isLogin ? go('pages/user/profile') : onLogin()">
        <image
          v-if="userStore.isLogin && userStore.userInfo?.avatar"
          class="profile__avatar"
          :src="userStore.userInfo.avatar"
          mode="aspectFill"
        />
        <view v-else class="profile__avatar profile__avatar--ph">
          <image class="profile__avatar-icon" :src="ICON_USER" mode="aspectFit" />
        </view>
        <view class="profile__info">
          <text class="profile__name">
            {{ userStore.isLogin ? userStore.userInfo?.nickname || tr("青梅里用户") : tr("登录 / 注册") }}
          </text>
          <text class="profile__level">
            {{ userStore.isLogin ? userStore.userInfo?.level || tr("山野旅行家") : tr("保存你的路线与山居订单") }}
          </text>
        </view>
        <text class="profile__arrow">›</text>
      </view>

      <!-- 订单入口 -->
      <view class="orders">
        <view class="orders__head" @tap="userStore.isLogin && go('pages/order/index')">
          <text class="orders__title">{{ tr("我的订单") }}</text>
          <view class="orders__more">
            <text>{{ tr("全部") }}</text>
            <text class="orders__arrow">›</text>
          </view>
        </view>
        <view class="orders__row">
          <view
            v-for="(o, i) in orderEntries"
            :key="o.label"
            class="orders__item"
            @tap="onOrderEntry(o.path)"
          >
            <view class="orders__icon">
              <image class="orders__icon-img" :src="ORDER_ICONS[i]" mode="aspectFit" />
              <text v-if="badgeOf(o.status)" class="orders__badge">
                {{ badgeOf(o.status) > 99 ? "99+" : badgeOf(o.status) }}
              </text>
            </view>
            <text class="orders__label">{{ tr(o.label) }}</text>
          </view>
        </view>
      </view>

      <!-- 功能 -->
      <view class="menus">
        <view
          v-for="m in visibleMenus"
          :key="m.label"
          class="menus__item"
          @tap="onMenu(m)"
        >
          <view class="menus__text">
            <text class="menus__label">{{ tr(m.label) }}</text>
            <text class="menus__desc">{{ tr(m.desc) }}</text>
          </view>
          <text class="menus__arrow">›</text>
        </view>
      </view>

      <view class="menus">
        <view class="menus__item" @tap="go('pages/user/ticket')">
          <view class="menus__text">
            <text class="menus__label">{{ tr("客服与工单") }}</text>
            <text class="menus__desc">{{ tr("售后 · 退款纠纷 · 投诉建议") }}</text>
          </view>
          <text class="menus__arrow">›</text>
        </view>
        <view class="menus__item" @tap="go('pages/user/messages')">
          <view class="menus__text">
            <text class="menus__label">{{ tr("消息中心") }}</text>
            <text class="menus__desc">{{ tr("发货 / 退款 / 核销进展") }}</text>
          </view>
          <view v-if="unreadMsg" class="menus__badge">{{ unreadMsg > 99 ? "99+" : unreadMsg }}</view>
          <text class="menus__arrow">›</text>
        </view>
        <view class="menus__item" @tap="go('pages/user/footprint')">
          <view class="menus__text">
            <text class="menus__label">{{ tr("我的足迹") }}</text>
            <text class="menus__desc">{{ tr("看过的景点与商品") }}</text>
          </view>
          <text class="menus__arrow">›</text>
        </view>
        <view class="menus__item" @tap="go('pages/user/display')">
          <view class="menus__text">
            <text class="menus__label">{{ tr("外观") }}</text>
            <text class="menus__desc">{{ tr("关怀模式 · 主题 · 字体与字号") }}</text>
          </view>
          <text class="menus__arrow">›</text>
        </view>
        <view class="menus__item" @tap="go('pages/user/settings')">
          <view class="menus__text">
            <text class="menus__label">{{ tr("设置") }}</text>
          </view>
          <text class="menus__arrow">›</text>
        </view>
        <view v-if="userStore.isLogin" class="menus__item" @tap="onLogout">
          <view class="menus__text">
            <text class="menus__label menus__label--danger">{{ tr("退出登录") }}</text>
          </view>
        </view>
      </view>

      <text class="user__foot">{{ tr("青梅里 · 成都邛崃䢺江镇") }}</text>
    </view>

    <AppTabBar current="user" />
  </view>
</template>

<style lang="scss" scoped>
.user {
  min-height: 100vh;
}

.user__body {
  padding: 8rpx 40rpx calc(160rpx + env(safe-area-inset-bottom));
}

/* ---------- 个人信息 ---------- */
.profile {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-top: 12rpx;
  padding: 30rpx 28rpx;
  border-radius: 34rpx;
  background: $glass-1;
  border: 1rpx solid $glass-edge;
  box-shadow: $glass-shadow;
  backdrop-filter: blur(22px) saturate(175%);
  -webkit-backdrop-filter: blur(22px) saturate(175%);
}

.profile__avatar {
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: $img-bg;
  flex-shrink: 0;
}

.profile__avatar--ph {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid $line;
}

.profile__avatar-icon {
  width: 48rpx;
  height: 48rpx;
}

.profile__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.profile__name {
  font-family: $font-serif;
  font-size: 40rpx;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: $text-main;
}

.profile__level {
  font-size: 21rpx;
  color: $text-mute;
}

.profile__arrow {
  font-size: 32rpx;
  color: $text-mute;
}

/* ---------- 订单 ---------- */
.orders {
  margin-top: 24rpx;
  padding: 30rpx 22rpx 8rpx;
  border-radius: 34rpx 34rpx 30rpx 30rpx;
  background: $glass-2;
  border: 1rpx solid $glass-edge-soft;
  box-shadow: 0 22rpx 56rpx -38rpx rgba(16, 36, 26, 0.42), inset 0 2rpx 0 rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(18px) saturate(165%);
  -webkit-backdrop-filter: blur(18px) saturate(165%);
}

.orders__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.orders__title {
  font-family: $font-serif;
  font-size: 34rpx;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: $text-main;
}

.orders__more {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: 20rpx;
  color: $text-mute;
}

.orders__arrow {
  font-size: 24rpx;
  line-height: 1;
}

.orders__row {
  display: flex;
  margin-top: 26rpx;
}

.orders__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 6rpx 0 22rpx;
}

.orders__icon {
  position: relative;
  width: 48rpx;
  height: 48rpx;
}

.orders__icon-img {
  width: 48rpx;
  height: 48rpx;
}

.orders__badge {
  position: absolute;
  top: -10rpx;
  right: -16rpx;
  min-width: 28rpx;
  height: 28rpx;
  padding: 0 8rpx;
  border-radius: 14rpx;
  background: $price;
  color: #fff;
  font-size: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orders__label {
  font-size: 21rpx;
  color: $text-sub;
}

/* ---------- 功能列表 ---------- */
.menus {
  margin-top: 24rpx;
  padding: 6rpx 28rpx;
  border-radius: 30rpx;
  background: $glass-1;
  border: 1rpx solid $glass-edge;
  box-shadow: 0 22rpx 56rpx -38rpx rgba(16, 36, 26, 0.42), inset 0 2rpx 0 rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(18px) saturate(165%);
  -webkit-backdrop-filter: blur(18px) saturate(165%);
}

.menus__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 30rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.5);
}

.menus__item:last-child {
  border-bottom: none;
}

.menus__text {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.menus__label {
  font-size: 27rpx;
  color: $text-main;
}

.menus__label--danger {
  color: $danger;
}

.menus__desc {
  font-size: 20rpx;
  color: $text-mute;
}

.menus__badge {
  min-width: 36rpx;
  height: 36rpx;
  padding: 0 10rpx;
  border-radius: 999rpx;
  background: $price;
  color: #fff;
  font-size: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8rpx;
}

.menus__arrow {
  font-size: 28rpx;
  color: $text-mute;
}

.user__foot {
  display: block;
  margin-top: 64rpx;
  text-align: center;
  font-size: 17rpx;
  letter-spacing: 0.22em;
  color: $text-mute;
}
</style>