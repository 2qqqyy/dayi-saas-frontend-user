<script setup lang="ts">
import { tr } from "@/utils/i18n";

withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    actionText?: string;
  }>(),
  { title: "暂无内容", description: "", actionText: "" },
);

const emit = defineEmits<{ (e: "action"): void }>();
</script>

<template>
  <view class="empty">
    <view class="empty__icon">
      <text class="empty__mark">青</text>
    </view>
    <text class="empty__title">{{ tr(title) }}</text>
    <text v-if="description" class="empty__desc">{{ tr(description) }}</text>
    <view v-if="actionText" class="empty__action" @tap="emit('action')">
      <text>{{ tr(actionText) }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 40rpx;
}

.empty__icon {
  width: 96rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
  border: 1rpx solid $line-strong;
  border-radius: 50%;
  color: $green-light;
}

.empty__mark {
  font-family: $font-serif;
  font-size: 40rpx;
  line-height: 1;
}

.empty__title {
  font-size: 30rpx;
  font-weight: 600;
  color: $text-main;
}

.empty__desc {
  margin-top: 12rpx;
  font-size: 26rpx;
  color: $text-sub;
  text-align: center;
}

.empty__action {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 72rpx;
  margin-top: 32rpx;
  padding: 0 40rpx;
  border-radius: $radius-lg;
  background: $green;
  color: #f7f3e6;
  font-size: 26rpx;
  font-weight: 600;
}
</style>
