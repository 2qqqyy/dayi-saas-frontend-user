<script setup lang="ts">
import { computed } from "vue";
import { formatPrice } from "@/utils/format";

const props = withDefaults(
  defineProps<{
    value: number;
    size?: number;
    color?: string;
  }>(),
  { size: 34, color: "#D96A3B" },
);

const parts = computed(() => {
  const str = formatPrice(props.value).split(".");
  return { integer: str[0], decimal: str[1] };
});
</script>

<template>
  <view class="price" :style="{ color }">
    <text class="price__symbol" :style="{ fontSize: size * 0.6 + 'rpx' }">¥</text>
    <text class="price__integer" :style="{ fontSize: size + 'rpx' }">{{ parts.integer }}</text>
    <text v-if="parts.decimal" class="price__decimal" :style="{ fontSize: size * 0.6 + 'rpx' }">
      .{{ parts.decimal }}
    </text>
  </view>
</template>

<style lang="scss" scoped>
.price {
  display: inline-flex;
  align-items: baseline;
  font-weight: 700;
  line-height: 1;
}

.price__symbol {
  margin-right: 2rpx;
}

.price__decimal {
  font-weight: 600;
}
</style>
