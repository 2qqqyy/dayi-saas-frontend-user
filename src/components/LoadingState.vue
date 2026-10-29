<script setup lang="ts">
withDefaults(
  defineProps<{
    rows?: number;
    type?: "list" | "grid";
    text?: string;
  }>(),
  { rows: 3, type: "list", text: "" },
);
</script>

<template>
  <view class="loading">
    <view v-for="i in rows" :key="i" class="loading__card">
      <view class="loading__thumb skeleton" />
      <view class="loading__body">
        <view class="skeleton loading__line" style="width: 70%" />
        <view class="skeleton loading__line" style="width: 45%" />
      </view>
    </view>
    <text v-if="text" class="loading__text">{{ text }}</text>
  </view>
</template>

<style lang="scss" scoped>
.loading {
  display: flex;
  flex-direction: column;
  gap: $space-md;
}

.loading__card {
  display: flex;
  gap: 24rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: $radius-md;
}

.loading__thumb {
  width: 180rpx;
  height: 180rpx;
  border-radius: $radius-sm;
  flex-shrink: 0;
}

.loading__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20rpx;
}

.loading__line {
  height: 28rpx;
  border-radius: 8rpx;
}

.loading__text {
  padding: 8rpx 0;
  text-align: center;
  font-size: 22rpx;
  color: $text-sub;
}

.skeleton {
  background: linear-gradient(90deg, #eef1ec 25%, #f6f8f4 50%, #eef1ec 75%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}

@keyframes shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0 0;
  }
}
</style>
