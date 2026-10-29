<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { REGION_DATA } from "@/utils/region-data";
import { tr } from "@/utils/i18n";

const props = defineProps<{
  show: boolean;
  /** 当前值 [省, 市, 县区]，打开时滚动到对应位置 */
  value: string[];
  /** sheet=底部全屏弹层；inline=嵌入触发位置的小选择框 */
  mode?: "sheet" | "inline";
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "confirm", value: string[]): void;
}>();

const provinces = Object.keys(REGION_DATA);
const pIdx = ref(0);
const cIdx = ref(0);
const dIdx = ref(0);

const cities = computed(() => Object.keys(REGION_DATA[provinces[pIdx.value]] ?? {}));
const districts = computed(
  () => REGION_DATA[provinces[pIdx.value]]?.[cities.value[cIdx.value]] ?? [],
);
const indices = computed(() => [pIdx.value, cIdx.value, dIdx.value]);

watch(
  () => props.show,
  (open) => {
    if (!open) return;
    const [p, c, d] = props.value;
    const pi = Math.max(0, provinces.indexOf(p));
    pIdx.value = pi;
    const cs = Object.keys(REGION_DATA[provinces[pi]] ?? {});
    const ci = Math.max(0, cs.indexOf(c));
    cIdx.value = ci;
    dIdx.value = Math.max(0, (REGION_DATA[provinces[pi]]?.[cs[ci]] ?? []).indexOf(d));
  },
);

function onChange(e: { detail: { value: number[] } }) {
  const [p, c, d] = e.detail.value;
  if (p !== pIdx.value) {
    pIdx.value = p;
    cIdx.value = 0;
    dIdx.value = 0;
  } else if (c !== cIdx.value) {
    cIdx.value = c;
    dIdx.value = 0;
  } else {
    dIdx.value = d;
  }
}

function confirm() {
  emit("confirm", [
    provinces[pIdx.value],
    cities.value[cIdx.value] ?? "",
    districts.value[dIdx.value] ?? "",
  ]);
}
</script>

<template>
  <view v-if="show" class="rp" :class="{ 'rp--inline': props.mode === 'inline' }">
    <view v-if="props.mode !== 'inline'" class="rp__mask" @tap="emit('close')" />
    <view class="rp__sheet">
      <view class="rp__head">
        <text class="rp__btn" @tap="emit('close')">{{ tr("取消") }}</text>
        <text class="rp__title">{{ tr("选择地区") }}</text>
        <text class="rp__btn rp__btn--ok" @tap="confirm">{{ tr("完成") }}</text>
      </view>
      <picker-view
        class="rp__view"
        :value="indices"
        :indicator-style="props.mode === 'inline' ? 'height: 36px;' : 'height: 44px;'"
        @change="onChange"
      >
        <picker-view-column>
          <view class="rp__opt" v-for="p in provinces" :key="p">{{ p }}</view>
        </picker-view-column>
        <picker-view-column>
          <view class="rp__opt" v-for="c in cities" :key="c">{{ c }}</view>
        </picker-view-column>
        <picker-view-column>
          <view class="rp__opt" v-for="d in districts" :key="d">{{ d }}</view>
        </picker-view-column>
      </picker-view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.rp__mask {
  position: fixed;
  inset: 0;
  z-index: 900;
  background: rgba(0, 0, 0, 0.45);
}

.rp__sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 901;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding-bottom: env(safe-area-inset-bottom);
}

.rp__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #f0f1ee;
}

.rp__btn {
  font-size: 28rpx;
  color: $text-sub;
  padding: 4rpx 8rpx;

  &--ok {
    color: $green;
    font-weight: 600;
  }
}

.rp__title {
  font-size: 28rpx;
  font-weight: 600;
  color: $text-main;
}

.rp__view {
  width: 100%;
  height: 440rpx;
}

.rp__opt {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  font-size: 28rpx;
  color: $text-main;
}

/* 内联小选择框：跟随触发位置就地展开，不遮挡整屏 */
.rp--inline {
  width: 100%;
}

.rp--inline .rp__sheet {
  position: static;
  margin-top: 16rpx;
  border: 1rpx solid #f0f1ee;
  border-radius: 16rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  padding-bottom: 0;
}

.rp--inline .rp__head {
  padding: 12rpx 24rpx;
}

.rp--inline .rp__btn,
.rp--inline .rp__title {
  font-size: 24rpx;
}

.rp--inline .rp__view {
  height: 300rpx;
}

.rp--inline .rp__opt {
  height: 36px;
  font-size: 24rpx;
}
</style>
