<script setup lang="ts">
import { FALLBACK_IMAGE } from "@/utils/backend";
import { computed } from "vue";
import { tc, tr } from "@/utils/i18n";
import type { TravelRoute } from "@/types/business";

const props = withDefaults(defineProps<{ item: TravelRoute; compact?: boolean }>(), { compact: false });
const emit = defineEmits<{ (e: "click"): void }>();

/**
 * 配图嵌入方式：
 * - 普通横版实拍图：16:9 铺满；
 * - imageFit === "contain" 的竖版插画：按图片自身比例做相框，同图虚化铺底。
 */
const isPoster = computed(
  () => props.item.imageFit === "contain" && !!props.item.imageRatio,
);

const frameStyle = computed(() =>
  isPoster.value ? { aspectRatio: String(props.item.imageRatio) } : {},
);

const stops = computed(() => (props.item.stops ?? []).slice(0, 3));

/** 图片加载失败兜底：URL 失效时换占位图，避免白块 */
function onImgError(e: any) {
  const src = e?.target?.src;
  if (src && src !== FALLBACK_IMAGE) {
    e.target.src = FALLBACK_IMAGE;
  }
}
</script>

<template>
  <view class="route" :class="{ 'route--compact': compact }" @tap="emit('click')">
    <view class="route__figure" :class="{ 'route__figure--poster': isPoster }">
      <image
        v-if="isPoster"
        class="route__figure-bg"
        :src="item.image"
        mode="aspectFill"
      @error="onImgError" />
      <view class="route__frame" :style="frameStyle">
        <image class="route__img" :src="item.image" mode="aspectFill" @error="onImgError" />
      </view>
    </view>

    <view class="route__info">
      <text class="route__meta">{{ item.duration }} · {{ tr("全程") }} {{ item.distance }}</text>
      <text class="route__title">{{ tc(item.title, item.titleEn) }}</text>
      <text class="route__summary">{{ tc(item.summary, item.summaryEn) }}</text>
      <view v-if="stops.length" class="route__stops">
        <text v-for="(stop, i) in stops" :key="stop" class="route__stop">
          {{ i + 1 }} {{ stop }}
        </text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.route {
  display: flex;
  flex-direction: column;
  height: 100%;
  white-space: normal;
}

.route__figure {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12rpx;
  overflow: hidden;
  background: $img-bg;
  flex-shrink: 0;
}

.route__figure-bg {
  position: absolute;
  inset: -14%;
  width: 128%;
  height: 128%;
  filter: blur(16px);
  opacity: 0.7;
}

.route__frame {
  position: absolute;
  inset: 0;
}

.route__figure--poster .route__frame {
  left: 50%;
  right: auto;
  height: 100%;
  transform: translateX(-50%);
  border: 6rpx solid rgba(255, 253, 248, 0.94);
  border-radius: 10rpx;
  overflow: hidden;
}

.route__img {
  display: block;
  width: 100%;
  height: 100%;
}

.route__info {
  padding: 20rpx 2rpx 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-height: 0;
}

.route__meta {
  font-size: 20rpx;
  letter-spacing: 0.02em;
  color: $text-mute;
}

.route__title {
  font-family: $font-serif;
  font-size: 36rpx;
  font-weight: 500;
  line-height: 1.45;
  letter-spacing: 0.02em;
  color: $text-main;
}

.route__summary {
  font-size: 22rpx;
  line-height: 1.5;
  color: $text-sub;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.route__stops {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx 16rpx;
  margin-top: 4rpx;
}

.route__stop {
  font-size: 20rpx;
  color: $text-mute;
}

/* 紧凑模式：图片吃掉剩余高度，文字区永远完整，不会被 swiper 裁切 */
.route--compact {
  height: 100%;
  min-height: 0;
}

.route--compact .route__figure {
  flex: 1;
  min-height: 0;
  aspect-ratio: auto;
}

.route--compact .route__info {
  flex-shrink: 0;
}

.route--compact .route__title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.route--compact .route__summary {
  -webkit-line-clamp: 1;
}

.route--compact .route__stops {
  display: none;
}
</style>
