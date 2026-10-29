<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { ref, computed } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { getProductDetail } from "@/api/product";
import { createProductOrder } from "@/api/order";
import { useCartStore } from "@/stores/cart";
import { useOrderStore } from "@/stores/order";
import { useUserStore } from "@/stores/user";
import { go } from "@/utils/navigation";
import { tr } from "@/utils/i18n";

import Price from "@/components/Price.vue";
import EmptyState from "@/components/EmptyState.vue";
import ContactCard from "@/components/ContactCard.vue";

interface OrderLine {
  productId: string;
  skuId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  skuName: string;
}

const cartStore = useCartStore();
const orderStore = useOrderStore();
const userStore = useUserStore();

const items = ref<OrderLine[]>([]);
const remark = ref("");
const loading = ref(true);
const fromCart = ref(false);
const submitting = ref(false);

onLoad(async (options) => {
  if (options?.from === "cart") {
    fromCart.value = true;
    items.value = cartStore.selectedItems.map((i) => ({
      productId: i.productId,
      skuId: i.skuId,
      name: i.name,
      image: i.image,
      price: i.price,
      quantity: i.quantity,
      skuName: i.summary,
    }));
    loading.value = false;
  } else {
    fromCart.value = false;
    const productId = (options?.productId as string) || "";
    const skuId = (options?.skuId as string) || "";
    const quantity = Number(options?.quantity) || 1;
    if (!productId) {
      items.value = [];
      loading.value = false;
      return;
    }
    try {
      const res = await getProductDetail(productId);
      const p = res.data;
      if (!p) throw new Error("商品不存在");
      const skus = p.skus ?? [];
      const sku = skus.find((s) => s.id === skuId) ?? skus[0];
      items.value = [
        {
          productId: p.id,
          skuId: sku?.id ?? "",
          name: p.name,
          image: p.image,
          price: sku?.price ?? p.price,
          quantity,
          skuName: sku?.name ?? "",
        },
      ];
    } catch (e) {
      items.value = [];
      uni.showToast({ title: tr("商品加载失败"), icon: "none" });
    } finally {
      loading.value = false;
    }
  }
});

onShow(() => {
  // 从地址页返回后刷新默认地址
});

const address = computed(() => userStore.defaultAddress);
const addressText = computed(() => {
  const a = address.value;
  if (!a) return "";
  return `${a.province}${a.city}${a.district}${a.detail}`;
});

// 金额按分收敛，避免 39.9*3 = 119.69999999999999 直接渲染到界面
const round2 = (n: number) => Math.round(n * 100) / 100;
const subtotal = computed(() =>
  round2(items.value.reduce((s, i) => s + i.price * i.quantity, 0)),
);
const freight = computed(() => (subtotal.value >= 99 || !items.value.length ? 0 : 10));
const total = computed(() => round2(subtotal.value + freight.value));
const totalQty = computed(() => items.value.reduce((s, i) => s + i.quantity, 0));

function submit() {
  if (submitting.value) return;
  if (!items.value.length) return;
  if (!address.value) {
    uni.showToast({ title: tr("请先添加收货地址"), icon: "none" });
    setTimeout(() => go("pages/user/address"), 600);
    return;
  }
  submitting.value = true;
  createProductOrder({
    addressId: address.value.id,
    items: items.value.map((i) => ({
      productId: i.productId,
      skuId: i.skuId,
      quantity: i.quantity,
    })),
  })
    .then((res) => {
      orderStore.addOrder(res.data);
      if (fromCart.value) cartStore.clearSelected();
      go(`pages/payment/index?orderId=${res.data.id}&amount=${res.data.amount}`);
    })
    .catch(() => {
      uni.showToast({ title: tr("下单失败，请重试"), icon: "none" });
    })
    .finally(() => {
      submitting.value = false;
    });
}
</script>

<template>
  <view class="page">
    <NavBar :title="tr('确认订单')" />
    <template v-if="loading">
      <view class="loading"><text>{{ tr("加载中…") }}</text></view>
    </template>
    <template v-else-if="!items.length">
      <EmptyState :title="tr('没有待结算商品')" :description="tr('去挑选一些乡村好物吧')" :action-text="tr('去逛逛')" @action="go('pages/mall/index')" />
    </template>
    <template v-else>
      <!-- 收货地址 -->
      <view class="addr card" @tap="go('pages/user/address')">
        <view class="addr__info">
          <template v-if="address">
            <text class="addr__name">{{ address.name }} {{ address.mobile }}</text>
            <text class="addr__detail">{{ addressText }}</text>
          </template>
          <template v-else>
            <text class="addr__empty">{{ tr("添加收货地址") }}</text>
          </template>
        </view>
        <text class="addr__arrow">›</text>
      </view>

      <!-- 商品列表 -->
      <view class="goods card">
        <view v-for="(item, idx) in items" :key="idx" class="goods__item">
          <image class="goods__img" :src="item.image" mode="aspectFill" />
          <view class="goods__info">
            <text class="goods__name">{{ item.name }}</text>
            <text class="goods__sku">{{ item.skuName }}</text>
            <view class="goods__price">
              <Price :value="item.price" :size="30" />
              <text class="goods__qty">×{{ item.quantity }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 配送与备注 -->
      <view class="meta card">
        <view class="meta__item">
          <text class="meta__label">{{ tr("配送方式") }}</text>
          <text class="meta__value">{{ tr("顺丰速运（乡村直发）") }}</text>
        </view>
        <view class="meta__item">
          <text class="meta__label">{{ tr("订单备注") }}</text>
          <input class="meta__input" v-model="remark" :placeholder="tr('选填，给卖家留言')" />
        </view>
      </view>

      <!-- 金额明细 -->
      <view class="calc card">
        <view class="calc__row">
          <text>{{ tr("商品金额") }}</text>
          <text>¥{{ subtotal }}</text>
        </view>
        <view class="calc__row">
          <text>{{ tr("运费") }}</text>
          <text>{{ freight === 0 ? tr("包邮") : "¥" + freight }}</text>
        </view>
        <view class="calc__row calc__row--total">
          <text>{{ tr("实付款") }}</text>
          <text class="calc__amount">¥{{ total }}</text>
        </view>
      </view>

      <!-- 平台客服电话：可代联商家 -->
      <ContactCard
        compact
        :label="tr('平台客服电话（可代联商家）')"
        :tip="tr('发货时间、改地址、开发票等需求可致电平台客服，由客服代为联系商家')"
      />

      <view class="submit-bar">
        <view class="submit-bar__total">
          <text>{{ tr("实付款") }}</text>
          <text class="submit-bar__amount">¥{{ total }}</text>
        </view>
        <view
          class="submit-bar__btn"
          :class="{ 'submit-bar__btn--disabled': submitting }"
          @tap="submit"
          >{{ submitting ? tr("提交中…") : tr("提交订单") }}</view
        >
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.loading {
  padding: 120rpx 0;
  text-align: center;
  color: $text-sub;
}

.addr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx;
}

.addr__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.addr__name {
  font-size: 30rpx;
  font-weight: 700;
}

.addr__detail {
  font-size: 26rpx;
  color: $text-sub;
}

.addr__empty {
  font-size: 28rpx;
  color: $text-sub;
}

.addr__arrow {
  font-size: 44rpx;
  color: $text-sub;
}

.goods {
  margin-top: 24rpx;
  padding: 8rpx 24rpx;
}

.goods__item {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f1ee;
}

.goods__item:last-child {
  border-bottom: none;
}

.goods__img {
  width: 140rpx;
  height: 140rpx;
  border-radius: $radius-sm;
  flex-shrink: 0;
}

.goods__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.goods__name {
  font-size: 28rpx;
  font-weight: 600;
}

.goods__sku {
  font-size: 22rpx;
  color: $text-sub;
}

.goods__price {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.goods__qty {
  font-size: 26rpx;
  color: $text-sub;
}

.meta {
  margin-top: 24rpx;
  padding: 8rpx 24rpx;
}

.meta__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f1ee;
}

.meta__item:last-child {
  border-bottom: none;
}

.meta__label {
  font-size: 28rpx;
}

.meta__value {
  font-size: 26rpx;
  color: $text-sub;
}

.meta__input {
  flex: 1;
  text-align: right;
  font-size: 26rpx;
}

.calc {
  margin-top: 24rpx;
  padding: 8rpx 24rpx;
}

.calc__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  font-size: 26rpx;
}

.calc__row--total {
  border-top: 1rpx solid #f0f1ee;
}

.calc__amount {
  font-size: 36rpx;
  font-weight: 800;
  color: #d96a3b;
}

.submit-bar {
  position: fixed;
  left: 50%;
  right: auto;
  bottom: 0;
  width: 100%;
  max-width: $app-max-width;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1rpx solid #f0f1ee;
}

.submit-bar__total {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.submit-bar__amount {
  font-size: 40rpx;
  font-weight: 800;
  color: #d96a3b;
}

.submit-bar__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  padding: 0 48rpx;
  border-radius: 44rpx;
  background: $green;
  color: #f7f3e6;
  font-size: 30rpx;
  font-weight: 600;
}

.submit-bar__btn--disabled {
  opacity: 0.6;
}
</style>
