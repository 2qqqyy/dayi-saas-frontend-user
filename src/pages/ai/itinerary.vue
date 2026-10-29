<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { ref } from "vue";
import dayjs from "dayjs";
import { generateItinerary, saveItinerary } from "@/api/ai";
import type { ItineraryPlan } from "@/types/business";
import { go } from "@/utils/navigation";
import { tr } from "@/utils/i18n";

import QuantitySelector from "@/components/QuantitySelector.vue";

const TRAVEL_TYPES = ["亲子", "情侣", "朋友", "家庭", "独自旅行"];

const date = ref(dayjs().add(1, "day").format("YYYY-MM-DD"));
const people = ref(2);
const type = ref("亲子");
const plan = ref<ItineraryPlan | null>(null);
const generating = ref(false);
const saved = ref(false);

function onDate(e: { detail: { value: string } }) {
  date.value = e.detail.value;
}

async function generate() {
  if (generating.value) return;
  generating.value = true;
  saved.value = false;
  try {
    const res = await generateItinerary({ date: date.value, people: people.value, type: type.value });
    plan.value = res.data;
    uni.showToast({ title: tr("行程已生成"), icon: "success" });
  } catch {
    uni.showToast({ title: tr("生成失败，请稍后重试"), icon: "none" });
  } finally {
    generating.value = false;
  }
}

async function savePlan() {
  const recordId = plan.value?.recordId;
  if (!recordId || saved.value) return;
  try {
    await saveItinerary(recordId);
    saved.value = true;
    uni.showToast({ title: tr("行程已保存"), icon: "success" });
  } catch {
    uni.showToast({ title: tr("保存失败，请稍后重试"), icon: "none" });
  }
}

function goRoute() {
  const path = plan.value?.routePath;
  if (path) go(path);
}
</script>

<template>
  <view class="page">
    <NavBar :title="tr('行程规划')" />
    <view class="form card">
      <view class="form__item">
        <text class="form__label">{{ tr("旅行日期") }}</text>
        <picker mode="date" :value="date" :start="dayjs().format('YYYY-MM-DD')" @change="onDate">
          <text class="form__value">{{ date }}</text>
        </picker>
      </view>
      <view class="form__item">
        <text class="form__label">{{ tr("出行人数") }}</text>
        <QuantitySelector v-model="people" :max="10" :min="1" />
      </view>
      <view class="form__item form__item--column">
        <text class="form__label">{{ tr("旅行类型") }}</text>
        <view class="form__types">
          <view
            v-for="t in TRAVEL_TYPES"
            :key="t"
            class="form__type"
            :class="{ active: type === t }"
            @tap="type = t"
          >
            <text>{{ tr(t) }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="generate" :class="{ 'generate--disabled': generating }" @tap="generate">
      <text>{{ generating ? tr('生成中…') : tr('生成我的行程') }}</text>
    </view>

    <view v-if="plan" class="plan">
      <view class="plan__head">
        <text class="plan__title">{{ plan.title }}</text>
        <text class="plan__meta">{{ plan.date }} · {{ plan.people }} {{ tr("人") }} · {{ tr(plan.type) }}</text>
      </view>

      <view v-if="plan.summary" class="plan__intro card">
        <text class="plan__summary">{{ plan.summary }}</text>
        <text v-if="plan.difficulty || plan.bestTime" class="plan__tags">
          {{ [plan.difficulty, plan.bestTime].filter(Boolean).join(" · ") }}
        </text>
      </view>

      <view class="plan__timeline">
        <view v-for="(s, i) in plan.stops" :key="s.id" class="stop card">
          <view class="stop__axis">
            <text class="stop__time">{{ s.time }}</text>
            <view class="stop__dot" :class="{ 'stop__dot--last': i === plan.stops.length - 1 }" />
          </view>
          <image class="stop__img" :src="s.image" mode="aspectFill" />
          <view class="stop__info">
            <text class="stop__name">{{ s.title }}</text>
            <text class="stop__desc">{{ s.description }}</text>
            <text class="stop__distance">{{ s.distance }}</text>
          </view>
        </view>
      </view>

      <view v-if="plan.tips && plan.tips.length" class="plan__tips card">
        <text class="plan__tips-title">{{ tr("出行提示") }}</text>
        <text v-for="(t, i) in plan.tips" :key="i" class="plan__tip">{{ t }}</text>
      </view>

      <view class="plan__actions">
        <view class="plan__save" :class="{ 'plan__save--done': saved }" @tap="savePlan">
          <text>{{ saved ? tr('已保存') : tr('保存行程') }}</text>
        </view>
        <view v-if="plan.routePath" class="plan__save" @tap="goRoute">
          <text>{{ tr("查看完整路线") }}</text>
        </view>
        <view class="plan__go" @tap="go('pages/travel/index')">
          <text>{{ tr("去旅行") }}</text>
        </view>
      </view>
    </view>

    <!-- 未生成时的引导 -->
    <view v-else-if="!generating" class="plan-empty">
      <view class="plan-empty__icon">
        <text class="plan-empty__mark">青</text>
      </view>
      <text class="plan-empty__title">{{ tr("还没有生成行程") }}</text>
      <text class="plan-empty__desc">{{ tr("选好日期、人数和旅行类型，点上方按钮，向导会为你安排一天的路线") }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.form {
  padding: 8rpx 24rpx;
}

.form__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f1ee;

  &--column {
    flex-direction: column;
    align-items: flex-start;
    gap: 20rpx;
  }
}

.form__item:last-child {
  border-bottom: none;
}

.form__label {
  font-size: 28rpx;
}

.form__value {
  font-size: 28rpx;
  color: $green;
}

.form__types {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.form__type {
  padding: 12rpx 32rpx;
  border-radius: 32rpx;
  background: $cream;
  color: $text-main;
  font-size: 26rpx;

  &.active {
    background: $green;
    color: #f7f3e6;
  }
}

.generate {
  margin-top: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: $radius-lg;
  background: $green;
  color: #f7f3e6;
  font-size: 32rpx;
  font-weight: 600;

  &--disabled {
    opacity: 0.7;
  }
}

.plan {
  margin-top: 40rpx;
}

.plan__head {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 24rpx;
}

.plan__title {
  font-size: 36rpx;
  font-weight: 800;
}

.plan__meta {
  font-size: 24rpx;
  color: $text-sub;
}

.plan__intro {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-bottom: 24rpx;
}

.plan__summary {
  font-size: 26rpx;
  line-height: 1.6;
  color: $text-sub;
}

.plan__tags {
  font-size: 22rpx;
  color: $green;
}

.plan__tips {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-top: 24rpx;
}

.plan__tips-title {
  font-size: 28rpx;
  font-weight: 700;
}

.plan__tip {
  font-size: 24rpx;
  line-height: 1.6;
  color: $text-sub;
}

.plan__timeline {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.stop {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx;
}

/* 左侧时间轴：时间 + 连接圆点，形成行程时间线观感 */
.stop__axis {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  height: 120rpx;
  flex-shrink: 0;
}

.stop__time {
  font-size: 26rpx;
  font-weight: 700;
  color: $green;
  flex-shrink: 0;
}

.stop__dot {
  position: relative;
  flex: 1;
  width: 4rpx;
  border-radius: 2rpx;
  background: $green-bg;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 50%;
    width: 16rpx;
    height: 16rpx;
    margin-left: -8rpx;
    border-radius: 50%;
    background: $green;
    border: 4rpx solid $green-bg;
  }

  &--last {
    background: transparent;

    &::before {
      background: $yellow;
      border-color: $yellow-soft;
    }
  }
}

.stop__img {
  width: 120rpx;
  height: 120rpx;
  border-radius: $radius-sm;
  flex-shrink: 0;
}

.stop__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.stop__name {
  font-size: 28rpx;
  font-weight: 600;
}

.stop__desc {
  font-size: 22rpx;
  color: $text-sub;
}

.stop__distance {
  font-size: 22rpx;
  color: $brown;
}

.plan__actions {
  display: flex;
  gap: 20rpx;
  margin-top: 32rpx;
}

.plan__save,
.plan__go {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: $radius-lg;
  font-size: 28rpx;
  font-weight: 600;
}

.plan__save {
  background: $green-bg;
  color: $green;

  &--done {
    background: #eef1ec;
    color: $text-sub;
  }
}

.plan__go {
  background: $green;
  color: #f7f3e6;
}

.plan-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  margin-top: 80rpx;
  padding: 0 80rpx;
  text-align: center;
}

.plan-empty__mark {
  font-family: $font-serif;
  font-size: 56rpx;
  line-height: 1;
  color: $green;
}

.plan-empty__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: $green-bg;
  margin-bottom: 8rpx;
}

.plan-empty__title {
  font-size: 30rpx;
  font-weight: 600;
  color: $text-main;
}

.plan-empty__desc {
  font-size: 24rpx;
  line-height: 1.6;
  color: $text-sub;
}
</style>
