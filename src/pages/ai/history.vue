<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import NavBar from "@/components/NavBar.vue";
import EmptyState from "@/components/EmptyState.vue";
import { tr, tc } from "@/utils/i18n";
import request from "@/utils/request";

interface ConvRow {
  id: number;
  sessionId: string;
  question: string;
  answer: string;
  createTime: string;
}
interface TripRow {
  id: number;
  title: string;
  travelDate: string;
  createTime: string;
  content?: string;
  spots?: string;
}

const tab = ref<"chat" | "trip">("chat");
const chats = ref<ConvRow[]>([]);
const trips = ref<TripRow[]>([]);
const loading = ref(true);
const failed = ref(false);

async function load() {
  loading.value = true;
  failed.value = false;
  try {
    const [c, t]: any[] = await Promise.all([
      request.get("/ai/conversations", { params: { limit: 50 } }),
      request.get("/ai/itineraries"),
    ]);
    chats.value = Array.isArray(c?.data) ? c.data : [];
    trips.value = Array.isArray(t?.data) ? t.data : [];
  } catch {
    failed.value = true;
  } finally {
    loading.value = false;
  }
}

const openTripId = ref(0);
function openTrip(t: TripRow) {
  openTripId.value = openTripId.value === t.id ? 0 : t.id;
}

onShow(() => {
  load();
});
</script>

<template>
  <view class="hist">
    <NavBar :title="tr('我的问答记录')" show-back />

    <view class="hist__tabs">
      <view class="hist__tab" :class="{ 'hist__tab--on': tab === 'chat' }" @tap="tab = 'chat'">
        {{ tr("问答历史") }}
      </view>
      <view class="hist__tab" :class="{ 'hist__tab--on': tab === 'trip' }" @tap="tab = 'trip'">
        {{ tr("保存的行程") }}
      </view>
    </view>

    <view v-if="failed" class="hist__empty" @tap="load">
      <EmptyState :title="tr('加载失败')" :description="tr('点此重试')" />
    </view>
    <view v-else-if="!loading && tab === 'chat' && !chats.length" class="hist__empty">
      <EmptyState :title="tr('还没有问答记录')" :description="tr('去向导问一句，记录会存在这里')" />
    </view>
    <view v-else-if="tab === 'chat'" class="hist__list">
      <view v-for="c in chats" :key="c.id" class="hist__item card">
        <text class="hist__q">{{ c.question }}</text>
        <text class="hist__a">{{ (c.answer || "").slice(0, 120) }}</text>
        <text class="hist__time">{{ (c.createTime || "").slice(0, 16) }}</text>
      </view>
    </view>

    <view v-if="!loading && tab === 'trip' && !trips.length" class="hist__empty">
      <EmptyState :title="tr('还没有保存的行程')" :description="tr('生成的行程点保存后会出现在这里')" />
    </view>
    <view v-else-if="tab === 'trip'" class="hist__list">
      <view v-for="t in trips" :key="t.id" class="hist__item card" @tap="openTrip(t)">
        <text class="hist__q">{{ t.title }}</text>
        <text class="hist__time">{{ t.travelDate || (t.createTime || "").slice(0, 10) }}</text>
        <text v-if="openTripId === t.id" class="hist__a">{{ t.content || t.spots || tr("暂无行程正文") }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.hist {
  min-height: 100vh;
  background: $bg;
}

.hist__tabs {
  display: flex;
  gap: 16rpx;
  padding: 16rpx 24rpx;
}

.hist__tab {
  flex: 1;
  height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  background: $surface;
  color: $text-sub;
  font-size: 26rpx;
}

.hist__tab--on {
  background: $green;
  color: #f7f3e6;
  font-weight: 600;
}

.hist__list {
  padding: 8rpx 24rpx 48rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.hist__item {
  padding: 24rpx;
}

.hist__q {
  display: block;
  font-size: 27rpx;
  font-weight: 700;
  color: $text-main;
}

.hist__a {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: $text-sub;
  line-height: 1.65;
}

.hist__time {
  display: block;
  margin-top: 10rpx;
  font-size: 21rpx;
  color: $text-mute;
}
</style>
