<script setup lang="ts">
import { computed } from "vue";
import type { OrderItem, OrderStatus } from "@/types/business";
import { FALLBACK_IMAGE } from "@/utils/backend";
import { tr } from "@/utils/i18n";
import Price from "./Price.vue";

const props = defineProps<{ item: OrderItem }>();
const emit = defineEmits<{
  (e: "click"): void;
  (e: "cancel"): void;
  (e: "pay"): void;
  (e: "confirm"): void;
}>();

const TYPE_LABEL: Record<string, string> = {
  picking: "采摘",
  homestay: "民宿",
  product: "商城",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  all: "全部",
  pending_payment: "待付款",
  pending_use: "待使用",
  pending_delivery: "待发货",
  pending_receive: "待收货",
  completed: "已完成",
  after_sale: "售后",
};

/** 售后聚合态用后端细分状态展示，避免已取消/已退款/退款被拒都写成「售后」 */
const RAW_LABEL: Record<string, string> = {
  refunding: "退款中",
  refunded: "已退款",
  refund_rejected: "退款被拒",
  cancelled: "已取消",
};

const statusText = computed(() => {
  const raw = props.item.rawStatus || "";
  if (props.item.status === "after_sale" && RAW_LABEL[raw]) {
    return tr(RAW_LABEL[raw]);
  }
  return tr(STATUS_LABEL[props.item.status] ?? props.item.status);
});
</script>

<template>
  <view class="order card" @tap="emit('click')">
    <view class="order__head">
      <view class="order__badge">{{ tr(TYPE_LABEL[item.type]) }}</view>
      <text class="order__status" :class="item.status">{{ statusText }}</text>
    </view>
    <view class="order__body">
      <view class="order__img">
        <image :src="item.image || FALLBACK_IMAGE" mode="aspectFill" />
      </view>
      <view class="order__info">
        <text class="order__title">{{ item.title }}</text>
        <text class="order__subtitle">{{ item.subtitle }}</text>
        <text class="order__time">{{ item.createdAt }}</text>
      </view>
    </view>
    <view class="order__foot">
      <text class="order__amount">
        {{ tr("实付") }} <Price :value="item.amount" :size="30" :color="'#26352A'" />
      </text>
      <view class="order__actions">
        <view v-if="item.status === 'pending_payment'" class="order__btn order__btn--ghost" @tap.stop="emit('cancel')">
          {{ tr("取消订单") }}
        </view>
        <view v-if="item.status === 'pending_payment'" class="order__btn order__btn--primary" @tap.stop="emit('pay')">
          {{ tr("立即支付") }}
        </view>
        <view v-if="item.status === 'pending_receive'" class="order__btn order__btn--primary" @tap.stop="emit('confirm')">
          {{ tr("确认收货") }}
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.order {
  padding: 24rpx;
}

.order__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.order__badge {
  padding: 4rpx 18rpx;
  border-radius: 20rpx;
  background: $green-bg;
  color: $green;
  font-size: 22rpx;
}

.order__status {
  font-size: 24rpx;
  color: $text-sub;

  /* 需要用户操作的：醒目暖色 */
  &.pending_payment {
    color: #d96a3b;
    font-weight: 600;
  }

  &.pending_receive {
    color: $green;
    font-weight: 600;
  }

  /* 进行中的预约 / 待发货：绿色系 */
  &.pending_use,
  &.pending_delivery {
    color: $green;
  }

  /* 已完成 / 售后：弱化 */
  &.completed,
  &.after_sale {
    color: $text-sub;
  }
}

.order__body {
  display: flex;
  gap: 20rpx;
}

.order__img {
  width: 140rpx;
  height: 140rpx;
  border-radius: $radius-sm;
  overflow: hidden;
  flex-shrink: 0;
}

.order__img image {
  width: 100%;
  height: 100%;
}

.order__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.order__title {
  font-size: 28rpx;
  font-weight: 600;
}

.order__subtitle {
  font-size: 24rpx;
  color: $text-sub;
}

.order__time {
  font-size: 22rpx;
  color: $text-sub;
}

.order__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f1ee;
}

.order__amount {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
  font-size: 24rpx;
}

.order__actions {
  display: flex;
  gap: 16rpx;
}

.order__btn {
  padding: 12rpx 28rpx;
  border-radius: 32rpx;
  font-size: 24rpx;

  &--ghost {
    border: 1rpx solid #d8ddd6;
    color: $text-main;
  }

  &--primary {
    background: $green;
    color: #f7f3e6;
  }
}
</style>
