<script setup lang="ts">
import type { PickingItem } from "@/types/business";
import { tc, tr } from "@/utils/i18n";
import Rating from "./Rating.vue";
import Price from "./Price.vue";

defineProps<{ item: PickingItem }>();
const emit = defineEmits<{ (e: "click"): void }>();
</script>

<template>
  <view class="picking" @tap="emit('click')">
    <view class="picking__img">
      <image :src="item.image" mode="aspectFill" />
    </view>
    <view class="picking__info">
      <text class="picking__name">{{ tc(item.orchardName, item.orchardNameEn) }}</text>
      <view class="picking__meta">
        <Rating :value="item.rating" :size="24" />
        <!-- orchard 表没有 distance 字段，退化为展示真实地址 -->
        <text class="picking__distance">{{ item.distance || tc(item.address, item.addressEn) }}</text>
      </view>
      <text class="picking__summary">{{ tc(item.summary, item.summaryEn) }}</text>
      <view class="picking__price">
        <text class="picking__from">¥{{ item.sessions[0]?.price }} / {{ tr("人起") }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.picking {
  padding: 16rpx 16rpx 24rpx;
  border-radius: 28rpx;
  background: $glass-1;
  border: 1rpx solid $glass-edge;
  box-shadow: 0 22rpx 56rpx -36rpx rgba(16, 36, 26, 0.45), inset 0 2rpx 0 rgba(255, 255, 255, 0.66);
  backdrop-filter: blur(18px) saturate(165%);
  -webkit-backdrop-filter: blur(18px) saturate(165%);
}

.picking__img {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 20rpx;
  overflow: hidden;
  margin-bottom: 18rpx;
  background: $img-bg;
}

.picking__img image {
  width: 100%;
  height: 100%;
}

.picking__info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.picking__name {
  font-family: $font-serif;
  font-size: 32rpx;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: $text-main;
}

.picking__meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 21rpx;
  color: $text-mute;
}

.picking__distance {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.picking__summary {
  font-size: 22rpx;
  line-height: 1.55;
  color: $text-sub;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.picking__price {
  margin-top: 6rpx;
}

.picking__from {
  font-size: 26rpx;
  font-weight: 600;
  color: $price;
}
</style>
