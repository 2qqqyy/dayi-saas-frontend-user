<script setup lang="ts">
import { ref, onMounted } from "vue";
import { tc, tr } from "@/utils/i18n";
import NavBar from "@/components/NavBar.vue";
import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";
import { getNotices, NOTICE_CATEGORY_LABEL, type NoticeItem } from "@/api/notice";
import { go } from "@/utils/navigation";

const list = ref<NoticeItem[]>([]);
const loading = ref(true);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const res = await getNotices(50);
    list.value = res.data ?? [];
  } catch (e: any) {
    error.value = e?.message || "加载失败，请稍后重试";
  } finally {
    loading.value = false;
  }
}

onMounted(load);

const labelOf = (c: string) => NOTICE_CATEGORY_LABEL[c] ?? "公告";
</script>

<template>
  <view class="page">
    <NavBar :title="tr('村务公告')" />

    <view class="wrap">
      <text class="lede">{{ tr("山里的安排、节令与提醒，都在这里。") }}</text>

      <LoadingState v-if="loading" :rows="4" />
      <EmptyState
        v-else-if="error"
        :title="tr('加载失败')"
        :description="error"
        :action-text="tr('重试')"
        @action="load"
      />
      <EmptyState v-else-if="!list.length" :title="tr('暂时没有公告')" :description="tr('有新消息会第一时间放在这里')" />
      <view v-else class="list">
        <view
          v-for="n in list"
          :key="n.id"
          class="item"
          @tap="go('pages/notice/detail?id=' + n.id)"
        >
          <view class="item__top">
            <view class="item__tags">
              <text v-if="n.pinned" class="pin">{{ tr("置顶") }}</text>
              <text class="tag">{{ tr(labelOf(n.category)) }}</text>
            </view>
            <text class="time">{{ n.publishTime }}</text>
          </view>
          <text class="item__title">{{ tc(n.title, n.titleEn) }}</text>
          <text class="item__summary">{{ tc(n.summary, n.summaryEn) }}</text>
          <text class="item__more">{{ tr("查看详情") }} ›</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.wrap {
  padding: 8rpx 40rpx 80rpx;
}

.lede {
  display: block;
  margin: 20rpx 0 12rpx;
  font-size: 23rpx;
  line-height: 1.6;
  color: $text-mute;
}

.list {
  margin-top: 8rpx;
}

.item {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 32rpx 0;
  border-bottom: 1rpx solid $line;
  transition: opacity 0.16s $ease;
}

.item:active {
  opacity: 0.6;
}

.item__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.item__tags {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.pin {
  padding: 2rpx 10rpx;
  border-radius: 4rpx;
  background: $ink;
  color: $lime;
  font-size: 17rpx;
  font-weight: 600;
}

.tag {
  font-size: 19rpx;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: $green;
}

.time {
  font-size: 19rpx;
  color: $text-mute;
}

.item__title {
  font-size: 33rpx;
  font-weight: 650;
  line-height: 1.38;
  letter-spacing: -0.01em;
  color: $text-main;
}

.item__summary {
  font-size: 23rpx;
  line-height: 1.65;
  color: $text-sub;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.item__more {
  margin-top: 4rpx;
  font-size: 20rpx;
  color: $text-mute;
}
</style>
