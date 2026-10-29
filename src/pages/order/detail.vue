<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { ref, computed } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { useOrderStore } from "@/stores/order";
import { useUserStore } from "@/stores/user";
import { addCartItem } from "@/api/cart";
import request from "@/utils/request";
import { requestRefund } from "@/api/order";
import type { OrderItem, OrderStatus } from "@/types/business";
import { go } from "@/utils/navigation";
import { FALLBACK_IMAGE } from "@/utils/backend";
import { tr } from "@/utils/i18n";

import Price from "@/components/Price.vue";
import EmptyState from "@/components/EmptyState.vue";
import LoadingState from "@/components/LoadingState.vue";

const orderStore = useOrderStore();
const userStore = useUserStore();
const orderId = ref("");
const order = ref<OrderItem | null>(null);
const loading = ref(true);

const STATUS_LABEL: Record<OrderStatus, string> = {
  all: "全部",
  pending_payment: "待付款",
  pending_use: "待使用",
  pending_delivery: "待发货",
  pending_receive: "待收货",
  completed: "已完成",
  after_sale: "售后",
};

/** 库里更细的状态优先展示，避免退款中/已退款都写成「售后」 */
const RAW_LABEL: Record<string, string> = {
  refunding: "退款中",
  refunded: "已退款",
  refund_rejected: "退款被拒",
  cancelled: "已取消",
};

/** 与后端 /order/{id}/refund 放行集合保持一致 */
const REFUNDABLE = ["pending_delivery", "pending_use", "completed", "shipping", "shipped", "pending_receive", "refund_rejected"];

const TYPE_LABEL: Record<string, string> = {
  picking: "采摘",
  homestay: "民宿",
  product: "商城",
};

async function reloadOrder() {
  await orderStore.ensureSeeded();
  order.value = orderStore.findOrder(orderId.value);
}

// 从商家/核销流程返回时刷新，避免仍显示旧状态
onShow(() => {
  if (orderId.value) {
    reloadOrder().catch(() => {});
  }
});

onLoad(async (options) => {
  orderId.value = (options?.id as string) || "";
  try {
    await reloadOrder();
  } catch {
    uni.showToast({ title: tr("订单加载失败，请稍后重试"), icon: "none" });
  } finally {
    loading.value = false;
  }
  loadMyReview();
});

const statusText = computed(() => {
  if (!order.value) return "";
  return tr(RAW_LABEL[order.value.rawStatus || ""] ?? STATUS_LABEL[order.value.status]);
});

const canRefund = computed(() =>
  REFUNDABLE.includes(order.value?.rawStatus || ""),
);

/** 我的评价：完成后可评，一单一评 */
const myReview = ref<{ score: number; content: string } | null>(null);
const showReview = ref(false);
const reviewScore = ref(5);
const reviewText = ref("");
const submittingReview = ref(false);

const canReview = computed(
  () => order.value?.status === "completed" && !myReview.value && !showReview.value,
);

/** 商城订单完成/取消后可一键把商品加回购物车 */
const canReorder = computed(
  () => order.value?.type === "product"
    && ["completed", "cancelled"].includes(order.value.rawStatus || ""),
);

async function loadMyReview() {
  if (!userStore.isLogin) return;
  try {
    const res: any = await request.get("/order/reviews", { params: { page: 1, pageSize: 50 } });
    const list = Array.isArray(res?.data?.list) ? res.data.list : Array.isArray(res?.data) ? res.data : [];
    const hit = list.find((r: any) => String(r.orderId) === String(orderId.value));
    if (hit) myReview.value = { score: Number(hit.score) || 5, content: String(hit.content || "") };
  } catch {
    /* 评价拉取失败不阻断订单详情 */
  }
}

async function onSubmitReview() {
  const id = order.value?.id;
  if (!id || submittingReview.value) return;
  if (!reviewText.value.trim()) {
    uni.showToast({ title: tr("写点体验感受吧"), icon: "none" });
    return;
  }
  submittingReview.value = true;
  const res: any = await request.post(`/order/${id}/review`, {
    score: reviewScore.value,
    content: reviewText.value.trim(),
  });
  submittingReview.value = false;
  if (res?.code !== 0 && res?.code !== 200) {
    uni.showToast({ title: res?.message || tr("提交失败，请重试"), icon: "none" });
    return;
  }
  showReview.value = false;
  myReview.value = { score: reviewScore.value, content: reviewText.value.trim() };
  uni.showToast({ title: tr("评价成功"), icon: "success" });
}

async function onReorder() {
  const items = ((order.value?.extra as any)?.items ?? []) as { productId: number; skuId: number; quantity: number }[];
  if (!items.length) {
    uni.showToast({ title: tr("商品已下架"), icon: "none" });
    return;
  }
  for (const it of items) {
    await addCartItem(String(it.productId), String(it.skuId), it.quantity);
  }
  uni.showToast({ title: tr("已加入购物车"), icon: "success" });
  setTimeout(() => go("pages/mall/cart"), 600);
}

/** 订单附加信息在该类型下可能缺字段，统一收敛取值为字符串，避免渲染报错 */
const extra = computed<Record<string, string>>(() => {
  const raw = (order.value?.extra ?? {}) as Record<string, unknown>;
  const out: Record<string, string> = {};
  Object.keys(raw).forEach((k) => {
    const v = raw[k];
    out[k] = v === undefined || v === null || v === "" ? "-" : String(v);
  });
  return out;
});

function onPay() {
  if (order.value) go(`pages/payment/index?orderId=${order.value.id}&amount=${order.value.amount}`);
}

const refunding = ref(false);

/** 申请退款：订单状态落库为 refunding，商家端「订单」与后台待办即时出现这一单 */
function onRefund() {
  const id = order.value?.id;
  if (!id || refunding.value) return;
  uni.showModal({
    title: tr("申请退款"),
    editable: true,
    placeholderText: tr("请填写退款原因"),
    success: async (res) => {
      if (!res.confirm) return;
      const reason = (res.content || "").trim();
      if (!reason) {
        uni.showToast({ title: tr("请填写退款原因"), icon: "none" });
        return;
      }
      refunding.value = true;
      try {
        await requestRefund(id, reason);
        // 状态以库为准，回读一次让「退款中」立刻显示
        await orderStore.ensureSeeded().catch(() => {});
        order.value = orderStore.findOrder(id);
        uni.showToast({ title: tr("退款申请已提交，请等待处理"), icon: "none" });
      } catch {
        // 当前状态不可退款等原因由请求拦截器统一提示
      } finally {
        refunding.value = false;
      }
    },
  });
}
</script>

<template>
  <view class="page">
    <NavBar :title="tr('订单详情')" />
    <template v-if="loading">
      <view class="detail__wrap"><LoadingState :rows="2" /></view>
    </template>
    <template v-else-if="!order">
      <EmptyState :title="tr('订单不存在')" :description="tr('可能已被删除')" :action-text="tr('返回订单')" @action="go('pages/order/index')" />
    </template>
    <template v-else>
      <view class="detail card">
        <view class="detail__head">
          <view class="detail__badge">{{ tr(TYPE_LABEL[order.type]) }}</view>
          <text class="detail__status">{{ statusText }}</text>
        </view>
        <view class="detail__main">
          <image class="detail__img" :src="order.image || FALLBACK_IMAGE" mode="aspectFill" />
          <view class="detail__info">
            <text class="detail__title">{{ order.title }}</text>
            <text class="detail__subtitle">{{ order.subtitle }}</text>
            <text class="detail__time">{{ tr("下单时间") }} {{ order.createdAt }}</text>
          </view>
        </view>
        <view class="detail__amount">
          <text>{{ tr("实付金额") }}</text>
          <Price :value="order.amount" :size="36" :color="'#26352A'" />
        </view>
      </view>

      <!-- 采摘订单 -->
      <view v-if="order.type === 'picking'" class="info card">
        <view class="info__row"><text class="info__label">{{ tr("预约日期") }}</text><text class="info__value">{{ extra.date }}</text></view>
        <view class="info__row"><text class="info__label">{{ tr("预约场次") }}</text><text class="info__value">{{ order.subtitle }}</text></view>
        <view class="info__row">
          <text class="info__label">{{ tr("联系人") }}</text>
          <text class="info__value">{{ extra.contactName }} {{ extra.contactMobile }}</text>
        </view>
        <view class="info__row">
          <text class="info__label">{{ tr("核销码") }}</text>
          <text class="info__code">{{ extra.verifyCode }}</text>
        </view>
      </view>

      <!-- 民宿订单 -->
      <view v-else-if="order.type === 'homestay'" class="info card">
        <view class="info__row"><text class="info__label">{{ tr("入住日期") }}</text><text class="info__value">{{ extra.checkIn }}</text></view>
        <view class="info__row"><text class="info__label">{{ tr("退房日期") }}</text><text class="info__value">{{ extra.checkOut }}</text></view>
        <view class="info__row">
          <text class="info__label">{{ tr("入住人") }}</text>
          <text class="info__value">{{ extra.guestName }} {{ extra.guestMobile }}</text>
        </view>
      </view>

      <!-- 商城订单 -->
      <view v-else-if="order.type === 'product'" class="info card">
        <view class="info__row"><text class="info__label">{{ tr("收货地址") }}</text><text class="info__value">{{ extra.address }}</text></view>
        <view class="info__row"><text class="info__label">{{ tr("物流信息") }}</text><text class="info__value">{{ extra.logistics || tr('待发货') }}</text></view>
        <view class="info__row"><text class="info__label">{{ tr("订单状态") }}</text><text class="info__value">{{ statusText }}</text></view>
      </view>

      <view v-if="['refund_rejected', 'refunded', 'cancelled'].includes(order.rawStatus || '')" class="reject card">
        <text class="reject__title">{{ tr(order.rawStatus === "refund_rejected" ? "退款被拒" : order.rawStatus === "refunded" ? "退款已完成" : "订单已取消") }}</text>
        <text v-if="order.remark || extra.cancelReason" class="reject__reason">{{ tr("原因") }}：{{ order.remark || extra.cancelReason }}</text>
        <text class="reject__tip">{{ tr("如有疑问可通过「我的-工单」联系平台介入") }}</text>
      </view>

      <view v-if="myReview" class="review card">
        <text class="review__title">{{ tr("我的评价") }} {{ "★".repeat(myReview.score) }}</text>
        <text class="review__content">{{ myReview.content }}</text>
      </view>

      <view v-if="showReview" class="review card">
        <view class="review__stars">
          <text
            v-for="n in 5"
            :key="n"
            class="review__star"
            :class="{ 'review__star--on': n <= reviewScore }"
            @tap="reviewScore = n"
          >★</text>
        </view>
        <textarea
          class="review__input"
          v-model="reviewText"
          :maxlength="300"
          :placeholder="tr('写点体验感受吧')"
        />
        <view class="review__submit" @tap="onSubmitReview">{{ tr("提交评价") }}</view>
      </view>

      <view class="detail__bar">
        <template v-if="order.status === 'pending_payment'">
          <view class="detail__pay" @tap="onPay">{{ tr("立即支付") }}</view>
        </template>
        <template v-else>
          <view class="detail__ghost" @tap="go('pages/user/ticket?orderId=' + order.id)">{{ tr("售后咨询") }}</view>
          <view v-if="canReorder" class="detail__ghost" @tap="onReorder">{{ tr("再次购买") }}</view>
          <view v-if="canReview" class="detail__ghost" @tap="showReview = true">{{ tr("评价") }}</view>
          <view v-if="canRefund" class="detail__ghost" @tap="onRefund">{{ tr("申请退款") }}</view>
          <view class="detail__back" @tap="go('pages/order/index')">{{ tr("返回订单列表") }}</view>
        </template>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.detail__wrap {
  padding: 24rpx;
}

.detail {
  padding: 24rpx;
}

.detail__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.detail__badge {
  padding: 4rpx 18rpx;
  border-radius: 20rpx;
  background: $green-bg;
  color: $green;
  font-size: 22rpx;
}

.detail__status {
  font-size: 26rpx;
  color: #d96a3b;
}

.detail__main {
  display: flex;
  gap: 20rpx;
}

.detail__img {
  width: 140rpx;
  height: 140rpx;
  border-radius: $radius-sm;
  flex-shrink: 0;
}

.detail__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.detail__title {
  font-size: 28rpx;
  font-weight: 600;
}

.detail__subtitle,
.detail__time {
  font-size: 24rpx;
  color: $text-sub;
}

.detail__amount {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f1ee;
  font-size: 26rpx;
}

.info {
  margin-top: 24rpx;
  padding: 8rpx 24rpx;
}

.info__row {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f1ee;
}

.info__row:last-child {
  border-bottom: none;
}

.info__label {
  font-size: 26rpx;
  color: $text-sub;
}

.info__value {
  font-size: 26rpx;
  color: $text-main;
  text-align: right;
}

.info__code {
  font-size: 32rpx;
  font-weight: 800;
  color: $green;
  letter-spacing: 4rpx;
}

.reject {
  padding: 24rpx;
  border-left: 6rpx solid $price;
}

.reject__title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: $price;
}

.reject__reason,
.reject__tip {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: $text-sub;
  line-height: 1.6;
}

.review {
  padding: 24rpx;
}

.review__title {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  color: $text-main;
}

.review__content {
  display: block;
  margin-top: 10rpx;
  font-size: 25rpx;
  color: $text-sub;
  line-height: 1.7;
}

.review__stars {
  display: flex;
  gap: 12rpx;
}

.review__star {
  font-size: 40rpx;
  color: $disabled;
}

.review__star--on {
  color: $yellow;
}

.review__input {
  width: 100%;
  height: 160rpx;
  margin-top: 16rpx;
  padding: 16rpx;
  border-radius: $radius-sm;
  background: $green-soft;
  font-size: 25rpx;
}

.review__submit {
  margin-top: 16rpx;
  height: 76rpx;
  border-radius: 999rpx;
  background: $green;
  color: #f7f3e6;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail__bar {
  margin-top: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.detail__pay,
.detail__back,
.detail__ghost {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 600;
}

.detail__pay {
  background: $green;
  color: #f7f3e6;
}

.detail__back {
  background: $green-bg;
  color: $green;
}

.detail__ghost {
  background: #fff;
  border: 1rpx solid #e4e7e1;
  color: $text-sub;
}
</style>
