<script setup lang="ts">
import { watch } from "vue";

const props = withDefaults(
  defineProps<{
    show: boolean;
    title?: string;
    round?: boolean;
  }>(),
  { title: "", round: true },
);

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
  (e: "close"): void;
}>();

function close() {
  emit("update:show", false);
  emit("close");
}

watch(
  () => props.show,
  (val) => {
    // 弹层打开时短暂延迟避免遮罩与面板同步动画冲突
  },
);
</script>

<template>
  <view v-if="show" class="popup">
    <view class="popup__mask" @tap="close" />
    <view class="popup__panel" :class="{ 'popup__panel--round': round }">
      <view v-if="round" class="popup__handle" />
      <view v-if="title" class="popup__header">
        <text class="popup__title">{{ title }}</text>
        <view class="popup__close" @tap="close">
          <text class="popup__close-icon">×</text>
        </view>
      </view>
      <view class="popup__body">
        <slot />
      </view>
      <view v-if="$slots.footer" class="popup__footer">
        <slot name="footer" />
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.popup {
  position: fixed;
  inset: 0;
  z-index: 200;
}

.popup__mask {
  position: absolute;
  inset: 0;
  background: rgba(16, 28, 21, 0.35);
  animation: fade 0.2s $ease;
}

.popup__panel {
  position: absolute;
  left: 50%;
  right: auto;
  bottom: 0;
  width: 100%;
  max-width: $app-max-width;
  transform: translateX(-50%);
  background: $surface;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: slide 0.28s $ease;
  padding-bottom: env(safe-area-inset-bottom);

  &--round {
    border-radius: 40rpx 40rpx 0 0;
    box-shadow: 0 -24rpx 64rpx -30rpx rgba(16, 36, 26, 0.35);
  }
}

.popup__handle {
  width: 64rpx;
  height: 6rpx;
  margin: 16rpx auto 0;
  border-radius: $radius-xs;
  background: $line-strong;
}

.popup__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx 16rpx;
}

.popup__title {
  font-family: $font-serif;
  font-size: 34rpx;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: $ink;
}

.popup__close {
  width: 52rpx;
  height: 52rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: -8rpx;
  border-radius: $radius-sm;
  color: $text-sub;
}

.popup__close-icon {
  font-size: 40rpx;
  line-height: 1;
}

.popup__body {
  padding: 0 32rpx 32rpx;
  overflow-y: auto;
}

.popup__footer {
  padding: 16rpx 32rpx 24rpx;
  border-top: 1rpx solid $line-2;
}

@keyframes fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slide {
  from {
    transform: translateX(-50%) translateY(100%);
  }
  to {
    transform: translateX(-50%) translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .popup__mask,
  .popup__panel {
    animation: none;
  }
}
</style>
