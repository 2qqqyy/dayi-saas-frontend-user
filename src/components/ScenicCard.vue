<script setup lang="ts">
import { FALLBACK_IMAGE } from "@/utils/backend";
import { tc } from "@/utils/i18n";
import type { ScenicItem } from "@/types/business";
import Rating from "./Rating.vue";

defineProps<{ item: ScenicItem }>();
const emit = defineEmits<{ (e: "click"): void }>();

/** 图片加载失败兜底：URL 失效时换占位图，避免白块 */
function onImgError(e: any) {
  const src = e?.target?.src;
  if (src && src !== FALLBACK_IMAGE) {
    e.target.src = FALLBACK_IMAGE;
  }
}
</script>

<template>
  <view class="scenic" @tap="emit('click')">
    <view class="scenic__img">
      <image :src="item.image" mode="aspectFill" @error="onImgError" />
    </view>
    <view class="scenic__info">
      <text class="scenic__name">{{ tc(item.name, item.nameEn) }}</text>
      <view class="scenic__meta">
        <Rating :value="item.rating" :size="24" />
        <!-- 早期 3 条景点没有 distance 数据，退化为展示真实位置，避免出现半显示半空白 -->
        <text class="scenic__distance">{{ item.distance || item.location }}</text>
      </view>
      <text class="scenic__summary">{{ tc(item.summary, item.summaryEn) }}</text>
      <view class="scenic__tags">
        <text v-for="tag in item.tags" :key="tag" class="scenic__tag">{{ tag }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.scenic {
  display: flex;
  gap: 24rpx;
  padding: 28rpx 0;
  border-bottom: 1rpx solid $line;
}

.scenic__img {
  width: 200rpx;
  height: 150rpx;
  border-radius: 10rpx;
  overflow: hidden;
  flex-shrink: 0;
  background: $img-bg;
}

.scenic__img image {
  width: 100%;
  height: 100%;
}

.scenic__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.scenic__name {
  font-family: $font-serif;
  font-size: 32rpx;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: $text-main;
}

.scenic__meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.scenic__distance {
  font-size: 20rpx;
  color: $text-mute;
}

.scenic__summary {
  font-size: 21rpx;
  line-height: 1.55;
  color: $text-sub;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.scenic__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx 16rpx;
  margin-top: 2rpx;
}

.scenic__tag {
  font-size: 19rpx;
  color: $text-mute;
}
</style>
