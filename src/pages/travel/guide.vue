<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { onShow } from "@dcloudio/uni-app";
import { useRequest } from "@/composables/useRequest";
import { getGuideList } from "@/api/guide";
import type { HomeGuide } from "@/api/home";
import { FALLBACK_IMAGE } from "@/utils/backend";
import { go } from "@/utils/navigation";
import { tr } from "@/utils/i18n";

import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";

const { loading, error, data, run } = useRequest<HomeGuide[]>(() =>
  getGuideList().then((r) => r.data),
);

// 后台「内容管理-攻略」发布或下架后，回到本页就能看到，不必整页刷新
onShow(run);
</script>

<template>
  <view class="page guide-list">
    <NavBar :title="tr('山野攻略')" />
    <template v-if="loading">
      <LoadingState :rows="3" />
    </template>
    <template v-else-if="error">
      <EmptyState :title="tr('加载失败')" :description="error" :action-text="tr('重新加载')" @action="run" />
    </template>
    <template v-else-if="data && !data.length">
      <EmptyState :title="tr('暂无攻略')" :description="tr('后台还没有发布攻略内容')" :action-text="tr('去逛逛')" @action="go('pages/index/index')" />
    </template>
    <template v-else>
      <view
        v-for="g in data"
        :key="g.id"
        class="guide-list__item card"
        @tap="go(`pages/travel/guide-detail?id=${g.id}`)"
      >
        <image class="guide-list__cover" :src="g.cover || FALLBACK_IMAGE" mode="aspectFill" />
        <view class="guide-list__body">
          <text class="guide-list__title">{{ g.title }}</text>
          <text class="guide-list__meta">{{ g.author || tr("青梅里") }}</text>
          <text class="guide-list__foot">{{ g.viewCount }} {{ tr("阅读") }} · {{ g.publishTime }}</text>
        </view>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.guide-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.guide-list__item {
  display: flex;
  gap: 24rpx;
  padding: 24rpx;
}

.guide-list__cover {
  width: 200rpx;
  height: 140rpx;
  border-radius: $radius-md;
  background: $green-bg;
  flex-shrink: 0;
}

.guide-list__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.guide-list__title {
  font-size: 30rpx;
  font-weight: 700;
  color: $text-main;
  line-height: 1.4;
}

.guide-list__meta {
  font-size: 24rpx;
  color: $text-sub;
}

.guide-list__foot {
  font-size: 22rpx;
  color: $text-sub;
}
</style>
