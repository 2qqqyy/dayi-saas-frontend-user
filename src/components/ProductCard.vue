<template>
  <view class="product" :class="{ 'product--soldout': soldOut }" @tap="emit('click')">
    <view class="product__img">
      <image :src="item.image" mode="aspectFill" @error="onImgError" />
      <view v-if="soldOut" class="product__mask"><text>{{ tr("已售罄") }}</text></view>
    </view>
    <view class="product__info">
      <text class="product__name">{{ tc(item.name, item.nameEn) }}</text>
      <text class="product__summary">{{ tc(item.summary, item.summaryEn) }}</text>
      <text v-if="item.merchantName" class="product__shop">{{ item.merchantName }}</text>
      <view class="product__bottom">
        <view class="product__price">
          <Price :value="item.price" :size="32" />
        </view>
        <view
          class="product__cart"
          :class="{ 'product__cart--off': soldOut }"
          @tap.stop="soldOut ? emit('click') : emit('add')"
        >
          <image class="product__cart-icon" :src="ICON_BAG" mode="aspectFit" @error="onImgError" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { FALLBACK_IMAGE } from "@/utils/backend";
import { computed } from "vue";
import type { ProductItem } from "@/types/business";
import Price from "./Price.vue";
import { tc, tr } from "@/utils/i18n";

const props = defineProps<{ item: ProductItem }>();
const emit = defineEmits<{
  (e: "click"): void;
  (e: "add"): void;
}>();

const soldOut = computed(() => props.item.stock <= 0);

/* 小程序不渲染内联 svg，购物袋图标走 data URI */
const ICON_BAG =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTAyNDFBIiBzdHJva2Utd2lkdGg9IjEuNyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNNiA3aDEybDEuMiAxM0g0LjhMNiA3eiIvPjxwYXRoIGQ9Ik05IDdhMyAzIDAgMCAxIDYgMCIvPjwvc3ZnPg==";

/** 图片加载失败兜底：URL 失效时换占位图，避免白块 */
function onImgError(e: any) {
  const src = e?.target?.src;
  if (src && src !== FALLBACK_IMAGE) {
    e.target.src = FALLBACK_IMAGE;
  }
}
</script>

<style lang="scss" scoped>
.product {
  padding: 14rpx 14rpx 18rpx;
  min-width: 0;
  border-radius: 28rpx;
  background: $glass-1;
  border: 1rpx solid $glass-edge;
  box-shadow: 0 22rpx 56rpx -36rpx rgba(16, 36, 26, 0.45), inset 0 2rpx 0 rgba(255, 255, 255, 0.66);
  backdrop-filter: blur(20px) saturate(168%);
  -webkit-backdrop-filter: blur(20px) saturate(168%);
}

.product__img {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: 20rpx;
  overflow: hidden;
  margin-bottom: 16rpx;
  background: $img-bg;
}

.product__img image {
  width: 100%;
  height: 100%;
}

.product__mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(16, 36, 26, 0.42);
}

.product__mask text {
  padding: 8rpx 24rpx;
  border-radius: 999rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.7);
  color: #fff;
  font-size: 20rpx;
}

.product--soldout .product__name {
  color: $text-sub;
}

.product__info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.product__name {
  font-size: 27rpx;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0;
  color: $text-main;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.product__summary {
  font-size: 20rpx;
  color: $text-mute;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  min-width: 0;
}

.product__shop {
  font-size: 19rpx;
  color: $text-mute;
}

.product__bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 10rpx;
}

.product__price {
  display: flex;
  align-items: baseline;
  gap: 10rpx;
  min-width: 0;
}

.product__cart {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  border: 1rpx solid $line-strong;
  flex-shrink: 0;
  transition: transform 0.16s $ease;
}

.product__cart:active {
  transform: scale(0.92);
}

.product__cart--off {
  opacity: 0.4;
}

.product__cart-icon {
  width: 26rpx;
  height: 26rpx;
}
</style>
