<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { useUserStore } from "@/stores/user";
import { useCartStore } from "@/stores/cart";
import { useOrderStore } from "@/stores/order";
import { go, requireLogin } from "@/utils/navigation";
import { tr } from "@/utils/i18n";

const userStore = useUserStore();
const cartStore = useCartStore();
const orderStore = useOrderStore();

const menus = [
  { label: "账号与安全", desc: "手机号、登录密码", action: "account" },
  { label: "意见反馈", desc: "提交问题与建议，查看官方回复", action: "feedback" },
  { label: "清除缓存", desc: "清理本地缓存数据", action: "cache" },
  { label: "关于青梅里", desc: "版本信息", action: "about" },
];

/** 退出登录 / 清缓存都要丢掉按账号缓存的购物车与订单，否则换号会看到上一个人的数据 */
function clearAccountCaches() {
  cartStore.clearLocal();
  orderStore.clearLocal();
}

function onMenu(action: string) {
  if (action === "cache") {
    uni.showModal({
      title: tr("提示"),
      content: tr("将清理收藏、地址、购物车、订单的本地缓存（登录状态保留），并重新从服务器拉取。确定继续吗？"),
      success: (res) => {
        if (!res.confirm) return;
        userStore.clearCaches();
        clearAccountCaches();
        if (userStore.isLogin) {
          userStore.ensureSeeded(true).catch(() => {});
          orderStore.ensureSeeded().catch(() => {});
          cartStore.syncFromServer();
        }
        uni.showToast({ title: tr("缓存已清理"), icon: "none" });
      },
    });
  } else if (action === "about") {
    uni.showModal({
      title: tr("关于青梅里"),
      content: tr("青梅里 v1.0.0\n乡村旅游 · 青梅采摘 · 民宿体验 · 农产品商城 · 在线客服"),
      showCancel: false,
    });
  } else if (action === "feedback") {
    if (!userStore.isLogin) {
      requireLogin("pages/user/feedback");
      return;
    }
    go("pages/user/feedback");
  } else {
    go("pages/user/profile");
  }
}

function onLogout() {
  uni.showModal({
    title: tr("提示"),
    content: tr("确定退出登录吗？"),
    success: (res) => {
      if (res.confirm) {
        userStore.logout();
        clearAccountCaches();
        uni.showToast({ title: tr("已退出登录"), icon: "none" });
        setTimeout(() => go("pages/user/index"), 500);
      }
    },
  });
}
</script>

<template>
  <view class="page">
    <NavBar :title="tr('设置')" />
    <view class="settings card">
      <view v-for="m in menus" :key="m.label" class="settings__item" @tap="onMenu(m.action)">
        <view class="settings__text">
          <text class="settings__label">{{ tr(m.label) }}</text>
          <text class="settings__desc">{{ tr(m.desc) }}</text>
        </view>
        <text class="settings__arrow">›</text>
      </view>
    </view>

    <view class="logout" @tap="onLogout">
      <text>{{ tr("退出登录") }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.settings {
  padding: 8rpx 24rpx;
}

.settings__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #f0f1ee;
}

.settings__item:last-child {
  border-bottom: none;
}

.settings__text {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.settings__label {
  font-size: 28rpx;
  font-weight: 600;
}

.settings__desc {
  font-size: 22rpx;
  color: $text-sub;
}

.settings__arrow {
  font-size: 40rpx;
  color: $text-sub;
}

.logout {
  margin-top: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: $radius-lg;
  background: $glass-1;
  border: 1rpx solid $line;
  color: $danger;
  font-size: 30rpx;
  font-weight: 600;
}
</style>
