<script setup lang="ts">
import { goBack } from "@/utils/navigation";

defineProps<{ title?: string }>();

function toHome() {
  uni.reLaunch({ url: "/pages/index/index" });
}

const ICON_BACK =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTAyNDFBIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTE1IDRsLTggOCA4IDgiLz48L3N2Zz4=";
const ICON_HOME =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTAyNDFBIiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMyAxMC41TDEyIDNsOSA3LjVWMjFoLTZ2LTZIOXY2SDN6Ii8+PC9zdmc+";
</script>

<template>
  <view class="nb">
    <view class="nb__btn" @tap="goBack">
      <image class="nb__icon" :src="ICON_BACK" mode="aspectFit" />
    </view>
    <text class="nb__title">{{ title }}</text>
    <view class="nb__right">
      <slot name="right" />
      <view class="nb__btn" @tap="toHome">
        <image class="nb__icon" :src="ICON_HOME" mode="aspectFit" />
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.nb {
  position: sticky;
  top: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 16rpx;
  padding-top: var(--status-bar-height);
  background: rgba(251, 251, 249, 0.9);
  border-bottom: 1rpx solid $line;
  color: $text-main;
}

@supports (backdrop-filter: blur(1px)) {
  .nb {
    background: rgba(251, 251, 249, 0.78);
    backdrop-filter: blur(16px) saturate(150%);
  }
}

.nb__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  transition: background 0.16s $ease;
}

.nb__btn:active {
  background: $line-2;
}

.nb__icon {
  width: 36rpx;
  height: 36rpx;
}

.nb__title {
  flex: 1;
  text-align: center;
  font-family: $font-serif;
  font-size: 34rpx;
  font-weight: 600;
  letter-spacing: 0.01em;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.nb__right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
</style>
