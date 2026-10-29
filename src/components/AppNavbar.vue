<script setup lang="ts">
import { goBack } from "@/utils/navigation";
import { useAppStore } from "@/stores/app";

withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    showBack?: boolean;
    transparent?: boolean;
  }>(),
  { title: "", subtitle: "", showBack: false, transparent: false },
);

const appStore = useAppStore();

const ICON_BACK =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTQxODFBIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTE1IDRsLTggOCA4IDgiLz48L3N2Zz4=";
</script>

<template>
  <view
    class="navbar"
    :class="{ 'navbar--transparent': transparent }"
    :style="{ paddingTop: appStore.safeAreaTop + 'px' }"
  >
    <view class="navbar__bar">
      <view v-if="showBack" class="navbar__back" @tap="goBack()">
        <image class="navbar__back-icon" :src="ICON_BACK" mode="aspectFit" />
      </view>
      <view class="navbar__spacer" />
      <slot name="right" />
    </view>

    <view v-if="title" class="navbar__titles">
      <text class="navbar__title">{{ title }}</text>
      <text v-if="subtitle" class="navbar__subtitle">{{ subtitle }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.navbar {
  width: 100%;
  padding-bottom: 8rpx;
}

.navbar--transparent {
  background: transparent;
}

.navbar__bar {
  display: flex;
  align-items: center;
  height: 76rpx;
  padding: 0 20rpx;
}

.navbar__spacer {
  flex: 1;
}

.navbar__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  margin-left: -8rpx;
  border-radius: 50%;
}

.navbar__back:active {
  background: rgba(27, 36, 29, 0.05);
}

.navbar__back-icon {
  width: 36rpx;
  height: 36rpx;
}

.navbar__titles {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 4rpx 40rpx 20rpx;
}

.navbar__title {
  font-family: $font-serif;
  font-size: 56rpx;
  font-weight: 500;
  line-height: 1.25;
  letter-spacing: 0.03em;
  color: $text-main;
}

.navbar__subtitle {
  font-size: 21rpx;
  line-height: 1.5;
  letter-spacing: 0.04em;
  color: $text-mute;
}
</style>
