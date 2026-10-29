<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { onShow } from "@dcloudio/uni-app";
import { useCartStore } from "@/stores/cart";
import { useUserStore } from "@/stores/user";
import { requireLogin, go } from "@/utils/navigation";
import { FALLBACK_IMAGE } from "@/utils/backend";
import { tr } from "@/utils/i18n";

import QuantitySelector from "@/components/QuantitySelector.vue";
import Price from "@/components/Price.vue";
import EmptyState from "@/components/EmptyState.vue";

const cartStore = useCartStore();
const userStore = useUserStore();

// 购物车真身在 cart_item 表：后台改价、改库存或别的设备加购后，回到本页即可看到最新数据
onShow(() => {
  cartStore.syncFromServer();
});

function onDelete(id: string) {
  uni.showModal({
    title: tr("提示"),
    content: tr("确定删除该商品吗？"),
    success: (res) => {
      if (res.confirm) cartStore.removeCart([id]);
    },
  });
}

function onCheckout() {
  if (!userStore.isLogin) {
    requireLogin("pages/mall/cart");
    return;
  }
  if (!cartStore.selectedItems.length) {
    uni.showToast({ title: tr("请先选择商品"), icon: "none" });
    return;
  }
  go("pages/order/product-order?from=cart");
}
</script>

<template>
  <view class="page">
    <NavBar :title="tr('购物车')" />
    <template v-if="!cartStore.cartList.length">
      <EmptyState :title="tr('购物车还是空的')" :description="tr('去挑选一些乡村好物吧')" :action-text="tr('去逛逛')" @action="go('pages/mall/index')" />
    </template>
    <template v-else>
      <view class="cart__list">
        <view v-for="item in cartStore.cartList" :key="item.id" class="cart__item card">
          <view
            class="cart__check"
            :class="{ active: item.selected, disabled: item.invalid }"
            @tap="!item.invalid && cartStore.toggleSelect(item.id)"
          >
            <text>{{ item.selected ? "✓" : "" }}</text>
          </view>
          <image class="cart__img" :src="item.image || FALLBACK_IMAGE" mode="aspectFill" />
          <view class="cart__info">
            <view class="cart__head">
              <text class="cart__name">{{ item.name }}</text>
              <view class="cart__delete" @tap="onDelete(item.id)">
                <text>{{ tr("删除") }}</text>
              </view>
            </view>
            <text class="cart__spec">{{ item.summary }}</text>
            <text v-if="item.invalid" class="cart__invalid">{{ tr("商品已失效") }}</text>
            <view class="cart__foot">
              <Price :value="item.price" :size="32" />
              <QuantitySelector
                :model-value="item.quantity"
                :max="item.stock"
                @update:model-value="cartStore.updateQuantity(item.id, $event)"
              />
            </view>
          </view>
        </view>
      </view>

      <!-- 底部结算栏 -->
      <view class="cart__bar">
        <view class="cart__all" @tap="cartStore.toggleSelectAll(!cartStore.allSelected)">
          <view class="cart__check" :class="{ active: cartStore.allSelected }">
            <text>{{ cartStore.allSelected ? "✓" : "" }}</text>
          </view>
          <text>{{ tr("全选") }}</text>
        </view>
        <view class="cart__total">
          <text class="cart__total-label">{{ tr("合计") }}</text>
          <Price :value="cartStore.selectedAmount" :size="36" />
        </view>
        <view
          class="cart__checkout"
          :class="{ 'cart__checkout--off': !cartStore.selectedCount }"
          @tap="onCheckout"
        >
          <text>{{ tr("去结算") }} ({{ cartStore.selectedCount }})</text>
        </view>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.cart__list {
  padding: 24rpx;
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.cart__item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx;
}

.cart__check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  border: 2rpx solid #d8ddd6;
  color: #fff;
  font-size: 26rpx;
  flex-shrink: 0;

  &.active {
    background: $green;
    border-color: $green;
  }

  &.disabled {
    background: #f0f1ee;
    border-color: #e4e6e2;
  }
}

.cart__img {
  width: 160rpx;
  height: 160rpx;
  border-radius: $radius-sm;
  flex-shrink: 0;
}

.cart__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.cart__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12rpx;
}

.cart__name {
  flex: 1;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cart__spec {
  font-size: 22rpx;
  color: $text-sub;
}

.cart__invalid {
  font-size: 22rpx;
  color: #d96a3b;
}

.cart__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8rpx;
}

.cart__delete {
  flex-shrink: 0;
  padding: 2rpx 8rpx;
  font-size: 23rpx;
  color: $text-sub;

  &:active {
    color: $danger;
  }
}

.cart__bar {
  position: fixed;
  left: 50%;
  right: auto;
  bottom: 0;
  width: 100%;
  max-width: $app-max-width;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1rpx solid #f0f1ee;
}

.cart__all {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 26rpx;
}

.cart__total {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  justify-content: flex-end;
}

.cart__total-label {
  font-size: 24rpx;
  color: $text-sub;
}

.cart__checkout {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  padding: 0 40rpx;
  border-radius: 44rpx;
  background: $green;
  color: #f7f3e6;
  font-size: 28rpx;
  font-weight: 600;

  &--off {
    background: #c3cbc0;
  }
}
</style>
