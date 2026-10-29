<script setup lang="ts">
import { tr } from "@/utils/i18n";

function goHome() {
  uni.reLaunch({ url: "/pages/index/index" });
}

function retry() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
  } else {
    goHome();
  }
}
</script>

<template>
  <view class="err">
    <text class="err__code">404</text>
    <text class="err__title">{{ tr("页面走丢了") }}</text>
    <text class="err__desc">{{ tr("链接可能已失效，或者网络开小差了。回首页继续逛吧。") }}</text>
    <view class="err__btn" @tap="goHome">{{ tr("返回首页") }}</view>
    <text class="err__retry" @tap="retry">{{ tr("重新加载") }}</text>
  </view>
</template>

<style lang="scss" scoped>
.err {
  min-height: 100vh;
  padding: 0 64rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: $bg;
}

.err__code {
  font-family: $font-serif;
  font-size: 120rpx;
  font-weight: 700;
  color: $green;
  opacity: 0.35;
}

.err__title {
  margin-top: 16rpx;
  font-size: 34rpx;
  font-weight: 700;
  color: $text-main;
}

.err__desc {
  margin-top: 16rpx;
  font-size: 26rpx;
  color: $text-sub;
  line-height: 1.7;
  text-align: center;
}

.err__btn {
  margin-top: 48rpx;
  width: 100%;
  height: 88rpx;
  border-radius: 999rpx;
  background: $green;
  color: #f7f3e6;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.err__retry {
  margin-top: 24rpx;
  font-size: 25rpx;
  color: $text-mute;
}
</style>
