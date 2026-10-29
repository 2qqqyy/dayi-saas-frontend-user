<script setup lang="ts">
import { tr } from "@/utils/i18n";

withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    readonly?: boolean;
  }>(),
  { modelValue: "", placeholder: "搜索目的地 / 景点 / 好物", readonly: false },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "search", value: string): void;
  (e: "select"): void;
}>();

/* 小程序不渲染内联 <svg>，图标统一走 data URI 的 image */
const ICON_SEARCH =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNkM3NzZFIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTEiIGN5PSIxMSIgcj0iNyIvPjxwYXRoIGQ9Ik0yMCAyMGwtMy4yLTMuMiIvPjwvc3ZnPg==";
</script>

<template>
  <view class="searchbar" @tap="emit('select')">
    <image class="searchbar__icon" :src="ICON_SEARCH" mode="aspectFit" />
    <input
      class="searchbar__input"
      :value="modelValue"
      :placeholder="tr(placeholder)"
      :disabled="readonly"
      placeholder-class="searchbar__placeholder"
      @input="emit('update:modelValue', ($event.detail as any).value)"
      @confirm="emit('search', modelValue)"
    />
  </view>
</template>

<style lang="scss" scoped>
.searchbar {
  display: flex;
  align-items: center;
  height: 84rpx;
  padding: 0 24rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.5);
  border: 1rpx solid rgba(255, 255, 255, 0.72);
  box-shadow: 0 18rpx 44rpx -30rpx rgba(16, 36, 26, 0.4), inset 0 2rpx 0 rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(18px) saturate(170%);
  -webkit-backdrop-filter: blur(18px) saturate(170%);
  gap: 14rpx;
  transition: transform 0.16s $ease, border-color 0.28s $ease;
}

.searchbar:active {
  transform: scale(0.99);
}

.searchbar__icon {
  width: 32rpx;
  height: 32rpx;
  flex-shrink: 0;
}

.searchbar__input {
  flex: 1;
  height: 100%;
  font-size: 27rpx;
  color: $text-main;
}

.searchbar__placeholder {
  color: $text-mute;
}
</style>
