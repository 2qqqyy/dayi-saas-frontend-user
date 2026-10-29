<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { ref, computed } from "vue";
import { onShow, onLoad } from "@dcloudio/uni-app";
import { useOrderStore } from "@/stores/order";
import { useUserStore } from "@/stores/user";
import { ORDER_STATUS_TABS } from "@/utils/constants";
import { go } from "@/utils/navigation";
import { tr } from "@/utils/i18n";

import OrderCard from "@/components/OrderCard.vue";
import EmptyState from "@/components/EmptyState.vue";
import LoadingState from "@/components/LoadingState.vue";

const orderStore = useOrderStore();
const userStore = useUserStore();
const active = ref("all");
const loading = ref(true);

/** 从跳转链接带入的 status 决定默认选中的标签页 */
onLoad((options) => {
  const status = (options?.status as string) || "";
  if (status && ORDER_STATUS_TABS.some((t) => t.value === status)) {
    active.value = status;
  }
});

onShow(async () => {
  if (!userStore.isLogin) {
    uni.showToast({ title: tr("请先登录"), icon: "none" });
    setTimeout(() => go("pages/user/login"), 600);
    return;
  }
  loading.value = true;
  try {
    await orderStore.ensureSeeded();
  } catch {
    uni.showToast({ title: tr("订单加载失败，请稍后重试"), icon: "none" });
  } finally {
    loading.value = false;
  }
});

const list = computed(() => {
  if (active.value === "all") return orderStore.orderList;
  return orderStore.orderList.filter((o) => o.status === active.value);
});

/** 每个标签的订单数量，展示在标签后 */
function tabCount(value: string) {
  if (value === "all") return orderStore.orderList.length;
  return orderStore.orderList.filter((o) => o.status === value).length;
}

async function onCancel(id: string) {
  try {
    await orderStore.cancelOrder(id);
    uni.showToast({ title: tr("订单已取消"), icon: "none" });
  } catch {
    uni.showToast({ title: tr("取消失败，请稍后重试"), icon: "none" });
  }
}

function onPay(id: string) {
  const order = orderStore.findOrder(id);
  if (order) go(`pages/payment/index?orderId=${id}&amount=${order.amount}`);
}

async function onConfirm(id: string) {
  try {
    await orderStore.confirmReceive(id);
    uni.showToast({ title: tr("已确认收货"), icon: "success" });
  } catch {
    uni.showToast({ title: tr("操作失败，请稍后重试"), icon: "none" });
  }
}

function onDetail(id: string) {
  go(`pages/order/detail?id=${id}`);
}
</script>

<template>
  <view class="page">
    <NavBar :title="tr('我的订单')" />
    <view class="tabs">
      <view
        v-for="t in ORDER_STATUS_TABS"
        :key="t.value"
        class="tabs__item"
        :class="{ active: active === t.value }"
        @tap="active = t.value"
      >
        <text>{{ tr(t.label) }}</text>
        <text v-if="tabCount(t.value)" class="tabs__count">{{ tabCount(t.value) }}</text>
      </view>
    </view>

    <view class="order-list">
      <template v-if="loading">
        <LoadingState :rows="3" />
      </template>
      <template v-else-if="!list.length">
        <EmptyState :title="tr('暂无相关订单')" :description="tr('去发现一些好玩的地方吧')" :action-text="tr('去逛逛')" @action="go('pages/index/index')" />
      </template>
      <template v-else>
        <OrderCard
          v-for="o in list"
          :key="o.id"
          :item="o"
          @click="onDetail(o.id)"
          @cancel="onCancel(o.id)"
          @pay="onPay(o.id)"
          @confirm="onConfirm(o.id)"
        />
      </template>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.tabs {
  display: flex;
  gap: 16rpx;
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 16rpx 24rpx;
  position: sticky;
  top: 0;
  background: $cream;
  z-index: 10;
}

.tabs__item {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  flex-shrink: 0;
  padding: 12rpx 28rpx;
  border-radius: 32rpx;
  background: #fff;
  color: $text-main;
  font-size: 26rpx;

  &.active {
    background: $green;
    color: #f7f3e6;
  }
}

.tabs__count {
  font-size: 20rpx;
  opacity: 0.75;
}

.order-list {
  padding: 8rpx 24rpx 48rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
</style>
