<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { tr } from "@/utils/i18n";

const props = withDefaults(
  defineProps<{
    src: string;
    title?: string;
  }>(),
  { title: "语音讲解" },
);

const playing = ref(false);
const currentTime = ref(0);
const duration = ref(0);
let audio: UniApp.InnerAudioContext | null = null;

const percent = computed(() => {
  if (!duration.value) return 0;
  return Math.min(100, (currentTime.value / duration.value) * 100);
});

function fmt(sec: number) {
  if (!sec || !Number.isFinite(sec)) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

onMounted(() => {
  if (!props.src) return;
  // TODO: MP-WEIXIN 使用 uni.createInnerAudioContext 保持一致；小程序自动播放需用户手势触发
  audio = uni.createInnerAudioContext();
  audio.src = props.src;
  audio.onTimeUpdate(() => {
    if (audio) currentTime.value = audio.currentTime;
  });
  audio.onCanplay(() => {
    if (audio) duration.value = audio.duration;
  });
  audio.onEnded(() => {
    playing.value = false;
    currentTime.value = 0;
  });
  audio.onError(() => {
    playing.value = false;
    uni.showToast({ title: tr("音频加载失败"), icon: "none" });
  });
});

onBeforeUnmount(() => {
  if (audio) {
    audio.destroy();
    audio = null;
  }
});

function toggle() {
  if (!audio) return;
  if (playing.value) {
    audio.pause();
    playing.value = false;
  } else {
    audio.play();
    playing.value = true;
  }
}
</script>

<template>
  <view class="audio">
    <view class="audio__play" @tap="toggle">
      <text class="audio__glyph">{{ playing ? "Ⅱ" : "▶" }}</text>
    </view>
    <view class="audio__body">
      <text class="audio__title">{{ tr(title) }}</text>
      <view class="audio__bar">
        <view class="audio__bar-fill" :style="{ width: percent + '%' }" />
      </view>
      <view class="audio__time">
        <text>{{ fmt(currentTime) }}</text>
        <text>{{ fmt(duration) }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.audio {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 24rpx;
  border-radius: $radius-md;
  background: $green-bg;
}

.audio__play {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: $green;
  color: #f7f3e6;
  flex-shrink: 0;
}

.audio__glyph {
  font-size: 30rpx;
  line-height: 1;
  letter-spacing: 0;
}

.audio__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.audio__title {
  font-size: 26rpx;
  font-weight: 600;
}

.audio__bar {
  height: 8rpx;
  border-radius: 4rpx;
  background: rgba(79, 143, 82, 0.2);
  overflow: hidden;
}

.audio__bar-fill {
  height: 100%;
  background: $green;
  border-radius: 4rpx;
  transition: width 0.2s linear;
}

.audio__time {
  display: flex;
  justify-content: space-between;
  font-size: 20rpx;
  color: $text-sub;
}
</style>
