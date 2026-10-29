<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { tc, tr } from "@/utils/i18n";
import NavBar from "@/components/NavBar.vue";
import LoadingState from "@/components/LoadingState.vue";
import { getNoticeDetail, NOTICE_CATEGORY_LABEL, type NoticeItem } from "@/api/notice";

const item = ref<NoticeItem | null>(null);
const loading = ref(true);
const error = ref("");
let noticeId = "";

async function load() {
  if (!noticeId) return;
  loading.value = true;
  try {
    const res = await getNoticeDetail(noticeId);
    item.value = res.data;
  } catch (e: any) {
    error.value = e?.message || "公告不存在";
  } finally {
    loading.value = false;
  }
}

onLoad((options) => {
  noticeId = String(options?.id ?? "");
  load();
});

const labelOf = (c?: string) => NOTICE_CATEGORY_LABEL[c ?? ""] ?? "公告";
</script>

<template>
  <view class="page">
    <NavBar :title="tr('公告详情')" />

    <view class="wrap">
      <LoadingState v-if="loading" :rows="4" />

      <view v-else-if="error" class="empty">
        <text class="empty__title">{{ error }}</text>
        <text class="empty__hint">{{ tr("换一条公告看看") }}</text>
      </view>

      <template v-else-if="item">
        <view class="meta">
          <text class="tag">{{ tr(labelOf(item.category)) }}</text>
          <text class="time">{{ item.publishTime }}</text>
        </view>
        <text class="title">{{ tc(item.title, item.titleEn) }}</text>
        <text v-if="item.summary" class="summary">{{ tc(item.summary, item.summaryEn) }}</text>
        <view class="rule" />
        <text class="content">{{ tc(item.content || "", item.contentEn) }}</text>
      </template>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.wrap {
  padding: 12rpx 40rpx 96rpx;
}

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 24rpx 0 18rpx;
}

.tag {
  font-size: 20rpx;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: $green;
}

.time {
  font-size: 20rpx;
  color: $text-mute;
}

.title {
  display: block;
  font-size: 50rpx;
  font-weight: 650;
  line-height: 1.24;
  letter-spacing: -0.02em;
  color: $text-main;
}

.summary {
  display: block;
  margin-top: 20rpx;
  font-size: 26rpx;
  line-height: 1.6;
  color: $text-sub;
}

.rule {
  height: 1rpx;
  margin: 32rpx 0;
  background: $line;
}

.content {
  display: block;
  font-size: 28rpx;
  line-height: 1.85;
  color: $text-main;
  white-space: pre-wrap;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  padding: 160rpx 0;
}

.empty__title {
  font-size: 30rpx;
  font-weight: 600;
  color: $text-main;
}

.empty__hint {
  font-size: 23rpx;
  color: $text-mute;
}
</style>
