<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    value: number;
    size?: number;
  }>(),
  { size: 26 },
);

/**
 * 逐星按比例填充。此前按 0.5 取整，4.9 分与 5.0 分都渲染成满星，
 * 和详情页的「4.9 分」自相矛盾，故改为真实比例。
 */
const stars = computed(() => {
  const v = Math.max(0, Math.min(5, Number(props.value) || 0));
  return [0, 1, 2, 3, 4].map((i) => `${Math.round(Math.max(0, Math.min(1, v - i)) * 100)}%`);
});
</script>

<template>
  <view class="rating">
    <view v-for="(fill, i) in stars" :key="i" class="rating__star" :style="{ fontSize: size + 'rpx' }">
      <text class="rating__base">☆</text>
      <text class="rating__fill" :style="{ width: fill }">★</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.rating {
  display: inline-flex;
  align-items: center;
  gap: 2rpx;
}

.rating__star {
  position: relative;
  display: inline-block;
  line-height: 1;
  color: rgba(180, 180, 180, 0.45);
}

.rating__fill {
  position: absolute;
  left: 0;
  top: 0;
  display: block;
  overflow: hidden;
  white-space: nowrap;
  color: $yellow;
}
</style>
