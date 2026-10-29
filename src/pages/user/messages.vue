<script setup lang="ts">
import { ref, computed } from "vue";
import { onShow } from "@dcloudio/uni-app";
import NavBar from "@/components/NavBar.vue";
import EmptyState from "@/components/EmptyState.vue";
import LoadingState from "@/components/LoadingState.vue";
import { getMessages, markAllRead, markRead, type UserMessageItem } from "@/api/userMessage";
import { tc, tr } from "@/utils/i18n";
import { go } from "@/utils/navigation";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const loading = ref(true);
const list = ref<UserMessageItem[]>([]);

const unread = computed(() => list.value.filter((m) => !m.readFlag).length);

async function load() {
  if (!userStore.isLogin) {
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const res = await getMessages();
    list.value = res.data ?? [];
  } catch {
    list.value = [];
  } finally {
    loading.value = false;
  }
}

async function onTap(m: UserMessageItem) {
  // 标记已读失败不能挡住查看订单，失败下次再补
  if (!m.readFlag) {
    markRead(m.id)
      .then(() => (m.readFlag = 1))
      .catch(() => {});
  }
  if (m.orderId) {
    go(`pages/order/detail?id=${m.orderId}`);
  }
}

async function onReadAll() {
  if (!unread.value) return;
  await markAllRead();
  list.value.forEach((m) => (m.readFlag = 1));
}

onShow(() => {
  load();
});
</script>

<template>
  <view class="msg-page">
    <NavBar :title="tr('消息中心')">
      <template #right>
        <text v-if="unread" class="msg-page__all" @tap="onReadAll">{{ tr("全部已读") }}</text>
      </template>
    </NavBar>

    <LoadingState v-if="loading" :rows="4" />
    <EmptyState v-else-if="!list.length" :title="tr('暂无消息')" :description="tr('发货、退款、核销的进展会在这里通知你')" />

    <view v-else class="msg-page__list">
      <view
        v-for="m in list"
        :key="m.id"
        class="msg-page__item"
        :class="{ 'msg-page__item--unread': !m.readFlag }"
        @tap="onTap(m)"
      >
        <view class="msg-page__head">
          <view class="msg-page__title-row">
            <view v-if="!m.readFlag" class="msg-page__dot" />
            <text class="msg-page__title">{{ tc(m.title, m.titleEn) }}</text>
          </view>
          <text class="msg-page__time">{{ (m.createTime || "").slice(5, 16).replace("T", " ") }}</text>
        </view>
        <text class="msg-page__content">{{ tc(m.content, m.contentEn) }}</text>
        <text v-if="m.orderId" class="msg-page__more">{{ tr("查看订单 ›") }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.msg-page {
  min-height: 100vh;
  background: $bg;
}

.msg-page__all {
  font-size: 26rpx;
  color: $green;
}

.msg-page__list {
  padding: 16rpx 24rpx 48rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.msg-page__item {
  padding: 24rpx;
  border-radius: $radius-md;
  background: $surface;
  box-shadow: $shadow-card;
}

.msg-page__item--unread {
  border-left: 6rpx solid $green;
}

.msg-page__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.msg-page__title-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  min-width: 0;
}

.msg-page__dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: $price;
  flex-shrink: 0;
}

.msg-page__title {
  font-size: 28rpx;
  font-weight: 700;
  color: $text-main;
}

.msg-page__time {
  font-size: 22rpx;
  color: $text-mute;
  flex-shrink: 0;
}

.msg-page__content {
  display: block;
  margin-top: 10rpx;
  font-size: 25rpx;
  color: $text-sub;
  line-height: 1.6;
}

.msg-page__more {
  display: block;
  margin-top: 12rpx;
  font-size: 23rpx;
  color: $green;
}
</style>
