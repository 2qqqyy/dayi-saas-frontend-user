<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: number;
    max?: number;
    min?: number;
  }>(),
  { max: 99, min: 1 },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: number): void;
  (e: "limit"): void;
}>();

function decrease() {
  if (props.modelValue <= props.min) return;
  emit("update:modelValue", props.modelValue - 1);
}

function increase() {
  if (props.modelValue >= props.max) {
    emit("limit");
    return;
  }
  emit("update:modelValue", props.modelValue + 1);
}
</script>

<template>
  <view class="qty">
    <view class="qty__btn" :class="{ 'qty__btn--disabled': modelValue <= min }" @tap="decrease">
      <text>−</text>
    </view>
    <text class="qty__value">{{ modelValue }}</text>
    <view class="qty__btn" :class="{ 'qty__btn--disabled': modelValue >= max }" @tap="increase">
      <text>+</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.qty {
  display: inline-flex;
  align-items: center;
  gap: 4rpx;
}

.qty__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  border-radius: 12rpx;
  background: $green-bg;
  color: $green;
  font-size: 34rpx;

  &--disabled {
    opacity: 0.4;
  }
}

.qty__value {
  min-width: 64rpx;
  text-align: center;
  font-size: 28rpx;
  color: $text-main;
}
</style>
