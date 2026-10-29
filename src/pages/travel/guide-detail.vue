<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { ref, computed } from "vue";
import { tc, tr } from "@/utils/i18n";
const tEn = (o: any, k: string) => (o && o[k]) || "";
import { onLoad } from "@dcloudio/uni-app";
import { useRequest } from "@/composables/useRequest";
import { getGuideDetail } from "@/api/guide";
import type { GuideDetail } from "@/api/guide";
import { FALLBACK_IMAGE } from "@/utils/backend";
import { go } from "@/utils/navigation";

import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";

const guideId = ref("");
const detail = ref<GuideDetail | null>(null);

const { loading, error, run } = useRequest(async () => {
  const res = await getGuideDetail(guideId.value);
  detail.value = res.data;
});

onLoad((options) => {
  guideId.value = String(options?.id ?? "");
  run();
});

/** 正文是纯文本，按换行拆段渲染，避免整篇挤成一坨 */
const paragraphs = computed(() =>
  String(detail.value?.content ?? "")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean),
);
</script>

<template>
  <view class="page guide-detail">
    <NavBar :title="tr('攻略详情')" />
    <template v-if="loading">
      <LoadingState :rows="4" />
    </template>
    <template v-else-if="error || !detail">
      <EmptyState
        :title="error || tr('攻略不存在')"
        :description="tr('该攻略可能已被后台下架')"
        :action-text="tr('看全部攻略')"
        @action="go('pages/travel/guide')"
      />
    </template>
    <template v-else>
      <image class="guide-detail__hero" :src="detail.cover || FALLBACK_IMAGE" mode="aspectFill" />

      <view class="guide-detail__body">
        <text class="guide-detail__title">{{ tc(detail.title, tEn(detail, "titleEn")) }}</text>
        <view class="guide-detail__meta">
          <text>{{ detail.author || tr("青梅里") }}</text>
          <text>{{ detail.publishTime }}</text>
          <text>{{ detail.viewCount }} {{ tr("阅读") }}</text>
        </view>

        <view class="guide-detail__content">
          <text v-for="(p, i) in paragraphs" :key="i" class="guide-detail__p">{{ p }}</text>
        </view>

        <view class="guide-detail__more" @tap="go('pages/travel/guide')">
          <text>{{ tr("查看全部攻略") }}</text>
        </view>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.guide-detail__hero {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: $green-bg;
}

.guide-detail__body {
  padding: 32rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
}

.guide-detail__title {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  line-height: 1.4;
  color: $text-main;
}

.guide-detail__meta {
  margin-top: 16rpx;
  display: flex;
  gap: 20rpx;
  font-size: 24rpx;
  color: $text-sub;
}

.guide-detail__content {
  margin-top: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.guide-detail__p {
  font-size: 28rpx;
  line-height: 1.8;
  color: $text-main;
}

.guide-detail__more {
  margin-top: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: 44rpx;
  background: $green-soft;
  color: $green-dark;
  font-size: 28rpx;
  font-weight: 600;
}
</style>
