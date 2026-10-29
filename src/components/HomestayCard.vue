<script setup lang="ts">
import { FALLBACK_IMAGE } from "@/utils/backend";
import type { HomestayItem } from "@/types/business";
import Rating from "./Rating.vue";
import Price from "./Price.vue";
import { tc, tr } from "@/utils/i18n";

const props = defineProps<{ item: HomestayItem }>();
const emit = defineEmits<{ (e: "click"): void }>();

function minPrice() {
  return Math.min(...props.item.roomTypes.map((r) => r.price));
}

/** 图片加载失败兜底：URL 失效时换占位图，避免白块 */
function onImgError(e: any) {
  const src = e?.target?.src;
  if (src && src !== FALLBACK_IMAGE) {
    e.target.src = FALLBACK_IMAGE;
  }
}
</script>

<template>
  <view class="homestay" @tap="emit('click')">
    <view class="homestay__img">
      <image :src="item.image" mode="aspectFill" @error="onImgError" />
    </view>
    <view class="homestay__info">
      <text class="homestay__name">{{ tc(item.name, item.nameEn) }}</text>
      <view class="homestay__meta">
        <Rating :value="item.rating" :size="24" />
        <text class="homestay__addr">{{ item.address }}</text>
      </view>
      <text class="homestay__summary">{{ tc(item.summary, item.summaryEn) }}</text>
      <view class="homestay__tags">
        <text v-for="tag in item.tags" :key="tag" class="homestay__tag">{{ tag }}</text>
      </view>
      <view class="homestay__price">
        <Price :value="minPrice()" :size="34" />
        <text class="homestay__night">/{{ tr("晚起") }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.homestay {
  padding: 16rpx 16rpx 24rpx;
  border-radius: 28rpx;
  background: $glass-1;
  border: 1rpx solid $glass-edge;
  box-shadow: 0 22rpx 56rpx -36rpx rgba(16, 36, 26, 0.45), inset 0 2rpx 0 rgba(255, 255, 255, 0.66);
  backdrop-filter: blur(20px) saturate(168%);
  -webkit-backdrop-filter: blur(20px) saturate(168%);
}

.homestay__img {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 20rpx;
  overflow: hidden;
  margin-bottom: 18rpx;
  background: $img-bg;
}

.homestay__img image {
  width: 100%;
  height: 100%;
}

.homestay__info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.homestay__name {
  font-family: $font-serif;
  font-size: 32rpx;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: $text-main;
}

.homestay__meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 21rpx;
  color: $text-mute;
}

.homestay__addr {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.homestay__summary {
  font-size: 22rpx;
  line-height: 1.55;
  color: $text-sub;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.homestay__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx 16rpx;
  margin-top: 2rpx;
}

.homestay__tag {
  font-size: 19rpx;
  color: $text-mute;
}

.homestay__price {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  margin-top: 6rpx;
}

.homestay__night {
  font-size: 19rpx;
  color: $text-mute;
}
</style>
