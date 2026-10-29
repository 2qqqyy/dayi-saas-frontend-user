<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { ref, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useRequest } from "@/composables/useRequest";
import { getPickingDetail } from "@/api/picking";
import type { PickingItem, PickingSession } from "@/types/business";
import { go } from "@/utils/navigation";
import { i18n, tc, tr } from "@/utils/i18n";

import Rating from "@/components/Rating.vue";
import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";
import ContactCard from "@/components/ContactCard.vue";

const orchardId = ref("");
const detail = ref<PickingItem | null>(null);
const selected = ref<PickingSession | null>(null);
const activeDate = ref("");

const notices = computed(() => {
  const en = detail.value?.noticesEn;
  return i18n.lang === "en" && en && en.length ? en : detail.value?.notices ?? [];
});

const { loading, error, run } = useRequest(async () => {
  const res = await getPickingDetail(orchardId.value);
  detail.value = res.data;
  const first = dateOptions.value.find((d) => d.sessions.some((s) => s.remain > 0));
  activeDate.value = first?.fullDate ?? "";
  selected.value = first?.sessions.find((s) => s.remain > 0) ?? null;
});

onLoad((options) => {
  orchardId.value = (options?.id as string) || "";
  run();
});

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function weekdayOf(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}

function weekdayLabel(iso: string) {
  return tr(weekdayOf(iso));
}

/** 按档期日期聚合，页面只展示当前选中日期下的场次 */
const dateOptions = computed(() => {
  const groups = new Map<string, PickingSession[]>();
  for (const s of detail.value?.sessions ?? []) {
    const key = s.fullDate || s.date;
    const arr = groups.get(key);
    if (arr) arr.push(s);
    else groups.set(key, [s]);
  }
  return [...groups.entries()].map(([fullDate, sessions]) => ({
    fullDate,
    label: `${sessions[0]?.date || fullDate.slice(5)} ${weekdayLabel(fullDate)}`,
    sessions,
  }));
});

const dateIndex = computed(() => {
  const i = dateOptions.value.findIndex((d) => d.fullDate === activeDate.value);
  return i < 0 ? 0 : i;
});

const visibleSessions = computed(
  () => dateOptions.value[dateIndex.value]?.sessions ?? [],
);

/** 下拉框选项：当前日期下的全部场次，约满的在文案中标出 */
const sessionOptions = computed(() =>
  visibleSessions.value.map((s) => ({
    id: s.id,
    label: `${s.time}　${isFull(s) ? tr("已约满") : tr("余 {n} 名").replace("{n}", String(s.remain))}　¥${s.price}/${tr("人")}`,
  })),
);

const sessionIndex = computed(() => {
  const i = visibleSessions.value.findIndex((s) => s.id === selected.value?.id);
  return i < 0 ? 0 : i;
});

function onDateChange(e: { detail: { value: number } }) {
  const group = dateOptions.value[Number(e.detail.value)];
  if (!group) return;
  activeDate.value = group.fullDate;
  selected.value = group.sessions.find((s) => s.remain > 0) ?? null;
}

/** 场次是否已约满 */
function isFull(s: PickingSession) {
  return s.remain <= 0;
}

function onSessionChange(e: { detail: { value: number } }) {
  const s = visibleSessions.value[Number(e.detail.value)];
  if (!s) return;
  if (isFull(s)) {
    uni.showToast({ title: tr("该场次已约满，请选择其他时间"), icon: "none" });
    return;
  }
  selected.value = s;
}

function onBook() {
  if (!selected.value) {
    uni.showToast({ title: tr("请先选择可预约的场次"), icon: "none" });
    return;
  }
  go(
    `pages/order/picking-order?orchardId=${orchardId.value}&sessionId=${selected.value.id}&date=${encodeURIComponent(selected.value.fullDate)}&time=${encodeURIComponent(selected.value.time)}&price=${selected.value.price}`,
  );
}
</script>

<template>
  <view class="page">
    <NavBar :title="tr('采摘详情')" />
    <template v-if="loading">
      <LoadingState :rows="4" />
    </template>
    <template v-else-if="error || !detail">
      <EmptyState :title="tr('加载失败')" :description="error" :action-text="tr('重新加载')" @action="run" />
    </template>
    <template v-else>
      <image class="pd__hero" :src="detail.image" mode="aspectFill" />

      <view class="pd__body">
        <text class="pd__name">{{ tc(detail.orchardName, detail.orchardNameEn) }}</text>
        <view class="pd__meta">
          <Rating :value="detail.rating" :size="26" />
          <text>{{ detail.rating }} {{ tr("分") }}</text>
        </view>
        <text class="pd__addr">{{ tc(detail.address, detail.addressEn) }}</text>

        <view class="pd__section">
          <text class="pd__h">{{ tr("选择场次") }}</text>
          <picker
            v-if="dateOptions.length"
            mode="selector"
            :range="dateOptions"
            range-key="label"
            :value="dateIndex"
            @change="onDateChange"
          >
            <view class="datepick">
              <text class="datepick__label">{{ tr("预约日期") }}</text>
              <view class="datepick__value">
                <text>{{ dateOptions[dateIndex]?.label }}</text>
                <text class="datepick__arrow">›</text>
              </view>
            </view>
          </picker>
          <picker
            v-if="sessionOptions.length"
            mode="selector"
            :range="sessionOptions"
            range-key="label"
            :value="sessionIndex"
            @change="onSessionChange"
          >
            <view class="datepick">
              <text class="datepick__label">{{ tr("预约场次") }}</text>
              <view class="datepick__value">
                <text>{{ sessionOptions[sessionIndex]?.label ?? tr("请选择场次") }}</text>
                <text class="datepick__arrow">›</text>
              </view>
            </view>
          </picker>
          <view class="session__hint">
            <text v-if="selected">
              {{ selected.date }} {{ selected.time }} ·
              {{ isFull(selected) ? tr("已约满") : tr("剩余 {n} 个名额").replace("{n}", String(selected.remain)) }} ·
              {{ tr("已约 {n} 人").replace("{n}", String(selected.booked)) }}
            </text>
            <text v-else>{{ tr("该日期暂无可预约场次，约满场次不在下拉列表中") }}</text>
          </view>
        </view>

        <view class="pd__section">
          <text class="pd__h">{{ tr("活动介绍") }}</text>
          <text class="pd__p">{{ tc(detail.summary, detail.summaryEn) }}</text>
        </view>

        <view class="pd__section">
          <text class="pd__h">{{ tr("注意事项") }}</text>
          <text v-for="n in notices" :key="n" class="pd__li">· {{ n }}</text>
        </view>

        <view v-if="detail.refundRule" class="pd__section">
          <text class="pd__h">{{ tr("退款规则") }}</text>
          <text class="pd__p">{{ tc(detail.refundRule, detail.refundRuleEn) }}</text>
        </view>

        <!-- 平台客服电话：可代联商家 -->
        <ContactCard :label="tr('平台客服电话（可代联果园）')" :tip="tr('档期查询、改约、团体包场与现场问题可致电平台客服，由客服代为联系果园')" />
      </view>

      <view class="pd__bar">
        <view class="pd__price">
          <template v-if="selected">
            <text class="pd__price-num">¥{{ selected.price }}</text>
            <text class="pd__price-unit">/{{ tr("人") }}</text>
          </template>
          <text v-else class="pd__price-none">{{ tr("暂无可预约场次") }}</text>
        </view>
        <view class="pd__book" :class="{ 'pd__book--off': !selected }" @tap="onBook">
          {{ selected ? tr("立即预约") : tr("已约满") }}
        </view>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.pd__hero {
  width: 100%;
  aspect-ratio: 16 / 9;
}

.pd__body {
  padding: 24rpx 24rpx calc(160rpx + env(safe-area-inset-bottom));
}

.pd__name {
  font-size: 40rpx;
  font-weight: 800;
}

.pd__meta {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: $brown;
}

.pd__addr {
  font-size: 24rpx;
  color: $text-sub;
}

.pd__section {
  margin-top: 32rpx;
}

.pd__h {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}

.pd__p {
  font-size: 28rpx;
  line-height: 1.7;
}

.pd__li {
  display: block;
  font-size: 28rpx;
  line-height: 1.8;
  color: $text-main;
}

.session__hint {
  padding: 0 8rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: $text-sub;
}

.datepick {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  margin-bottom: 16rpx;
  border-radius: $radius-md;
  background: #fff;
}

.datepick__label {
  font-size: 26rpx;
  color: $text-sub;
}

.datepick__value {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: $text-main;
}

.datepick__arrow {
  font-size: 32rpx;
  line-height: 1;
  color: $text-sub;
}

.pd__bar {
  position: fixed;
  left: 50%;
  right: auto;
  bottom: 0;
  width: 100%;
  max-width: $app-max-width;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1rpx solid #f0f1ee;
}

.pd__price {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.pd__price-num {
  font-size: 44rpx;
  font-weight: 800;
  color: #d96a3b;
}

.pd__price-unit {
  font-size: 24rpx;
  color: $text-sub;
}

.pd__price-none {
  font-size: 26rpx;
  color: $text-sub;
}

.pd__book {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: 44rpx;
  background: $green;
  color: #f7f3e6;
  font-size: 30rpx;
  font-weight: 600;

  &--off {
    background: #ccd2cb;
  }
}
</style>
