<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import type { PaymentMethod } from "@/types/business";
import { mockPay } from "@/api/payment";
import { useOrderStore } from "@/stores/order";
import { go } from "@/utils/navigation";
import { tr } from "@/utils/i18n";

import Price from "@/components/Price.vue";

const orderStore = useOrderStore();

const orderId = ref("");
const amount = ref(0);
const method = ref<PaymentMethod>("wechat");
const paying = ref(false);
const success = ref(false);

onLoad((options) => {
  orderId.value = (options?.orderId as string) || "";
  amount.value = Number(options?.amount) || 0;
});

const methods: { key: PaymentMethod; label: string; desc: string; icon: string }[] = [
  { key: "wechat", label: "微信支付", desc: "推荐使用微信支付", icon: "微" },
  { key: "alipay", label: "支付宝", desc: "使用支付宝付款", icon: "支" },
  { key: "balance", label: "余额支付", desc: "使用青梅里余额", icon: "余" },
];

import { requestOrderSubscribe } from "@/utils/wxSubscribe";

async function pay() {
  // 下单后的第一个用户手势：在这里申请发货/退款/核销订阅授权
  requestOrderSubscribe();
  if (paying.value) return;
  paying.value = true;
  try {
    await mockPay({ orderId: orderId.value, method: method.value, amount: amount.value });
    // 先乐观更新，再整体对齐一次：订单状态以 order 表为准，商家端立刻能看到「待发货/待使用」
    orderStore.payOrder(orderId.value);
    orderStore.ensureSeeded().catch(() => {});
    success.value = true;
  } catch {
    // 失败原因由请求拦截器统一提示，这里不重复弹
  } finally {
    paying.value = false;
  }
}

function onDone() {
  go(`pages/order/detail?id=${orderId.value}`);
}
</script>

<template>
  <view class="page">
    <NavBar :title="tr('支付')" />
    <template v-if="success">
      <view class="success">
        <view class="success__icon">
          <text class="success__check">✓</text>
        </view>
        <text class="success__title">{{ tr("支付成功") }}</text>
        <text class="success__desc">{{ tr("订单创建成功，请等待商家确认") }}</text>
        <view class="success__btn" @tap="onDone">{{ tr("查看订单") }}</view>
      </view>
    </template>
    <template v-else>
      <view class="pay-amount card">
        <text class="pay-amount__label">{{ tr("支付金额") }}</text>
        <Price :value="amount" :size="56" :color="'#26352A'" />
      </view>

      <view class="pay-methods card">
        <view
          v-for="m in methods"
          :key="m.key"
          class="pay-methods__item"
          :class="{ active: method === m.key }"
          @tap="method = m.key"
        >
          <view class="pay-methods__icon">{{ m.icon }}</view>
          <view class="pay-methods__info">
            <text class="pay-methods__label">{{ tr(m.label) }}</text>
            <text class="pay-methods__desc">{{ tr(m.desc) }}</text>
          </view>
          <view class="pay-methods__radio" :class="{ active: method === m.key }">
            <text>{{ method === m.key ? '●' : '' }}</text>
          </view>
        </view>
      </view>

      <view class="pay-note">
        <text>{{ tr("本演示为模拟支付，不产生真实扣款。") }}</text>
      </view>

      <view class="pay-bar">
        <view class="pay-bar__btn" :class="{ 'pay-bar__btn--disabled': paying }" @tap="pay">
          <text>{{ paying ? tr("支付中…") : tr("立即支付") + ' ¥' + amount }}</text>
        </view>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.pay-amount {
  padding: 40rpx 24rpx;
  text-align: center;
}

.pay-amount__label {
  display: block;
  font-size: 26rpx;
  color: $text-sub;
  margin-bottom: 16rpx;
}

.pay-methods {
  margin-top: 24rpx;
  padding: 8rpx 24rpx;
}

.pay-methods__item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #f0f1ee;
}

.pay-methods__item:last-child {
  border-bottom: none;
}

.pay-methods__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border-radius: 16rpx;
  background: $green-bg;
  color: $green;
  font-size: 32rpx;
  font-weight: 700;
}

.pay-methods__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.pay-methods__label {
  font-size: 28rpx;
  font-weight: 600;
}

.pay-methods__desc {
  font-size: 22rpx;
  color: $text-sub;
}

.pay-methods__radio {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 2rpx solid #d8ddd6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $green;
  font-size: 22rpx;

  &.active {
    border-color: $green;
  }
}

.pay-note {
  padding: 24rpx;
  text-align: center;
  color: $text-sub;
  font-size: 22rpx;
}

.pay-bar {
  position: fixed;
  left: 50%;
  right: auto;
  bottom: 0;
  width: 100%;
  max-width: $app-max-width;
  transform: translateX(-50%);
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1rpx solid #f0f1ee;
}

.pay-bar__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: 44rpx;
  background: $green;
  color: #f7f3e6;
  font-size: 30rpx;
  font-weight: 600;

  &--disabled {
    opacity: 0.7;
  }
}

.success {
  padding: 160rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.success__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96rpx;
  height: 96rpx;
  margin-bottom: 24rpx;
  border-radius: 50%;
  background: $success-bg;
  color: $success;
}

.success__check {
  font-size: 48rpx;
  font-weight: 700;
  line-height: 1;
}

.success__title {
  font-size: 40rpx;
  font-weight: 800;
}

.success__desc {
  margin-top: 12rpx;
  font-size: 26rpx;
  color: $text-sub;
}

.success__btn {
  margin-top: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  padding: 0 64rpx;
  border-radius: 44rpx;
  background: $green;
  color: #f7f3e6;
  font-size: 30rpx;
  font-weight: 600;
}
</style>
