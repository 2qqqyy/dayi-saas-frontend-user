<script setup lang="ts">
import { tr } from "@/utils/i18n";

withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    moreText?: string;
    showMore?: boolean;
  }>(),
  { subtitle: "", moreText: "更多", showMore: false },
);

const emit = defineEmits<{ (e: "more"): void }>();
</script>

<template>
  <view class="section-title">
    <view class="section-title__text">
      <text class="section-title__main">{{ tr(title) }}</text>
      <text v-if="subtitle" class="section-title__sub">{{ tr(subtitle) }}</text>
    </view>
    <view v-if="showMore" class="section-title__more" @tap="emit('more')">
      <text>{{ tr(moreText) }}</text>
      <text class="section-title__arrow">›</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.section-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24rpx;
  margin: 68rpx 2rpx 26rpx;
  padding-top: 22rpx;
  border-top: 1rpx solid $line-2;
}

.section-title__text {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.section-title__main {
  font-family: $font-serif;
  font-size: 42rpx;
  line-height: 1.3;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: $text-main;
}

.section-title__sub {
  font-size: 21rpx;
  line-height: 1.5;
  letter-spacing: 0.02em;
  color: $text-mute;
}

.section-title__more {
  display: flex;
  align-items: center;
  gap: 6rpx;
  flex-shrink: 0;
  margin-bottom: 4rpx;
  padding-bottom: 3rpx;
  border-bottom: 1rpx solid $line-strong;
  font-size: 20rpx;
  color: $text-mute;
}

.section-title__arrow {
  font-size: 24rpx;
  line-height: 1;
  color: $text-main;
}
</style>
import { tr } from "@/utils/i18n";
