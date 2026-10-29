<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { onMounted } from "vue";
import { useRequest } from "@/composables/useRequest";
import { getHomestayList } from "@/api/homestay";
import type { HomestayItem } from "@/types/business";
import { go } from "@/utils/navigation";
import { tr } from "@/utils/i18n";

import HomestayCard from "@/components/HomestayCard.vue";
import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";

const { loading, error, data, run } = useRequest<HomestayItem[]>(() =>
  getHomestayList().then((r) => r.data),
);

onMounted(run);
</script>

<template>
  <view class="page homestay-list">
    <NavBar :title="tr('特色民宿')" />
    <template v-if="loading">
      <LoadingState :rows="3" />
    </template>
    <template v-else-if="error">
      <EmptyState :title="tr('加载失败')" :description="error" :action-text="tr('重新加载')" @action="run" />
    </template>
    <template v-else-if="data && !data.length">
      <EmptyState :title="tr('暂无民宿')" :description="tr('去发现一些好玩的地方吧')" :action-text="tr('去旅行')" @action="go('pages/travel/index')" />
    </template>
    <template v-else>
      <view class="homestay-list__grid">
        <HomestayCard
          v-for="h in data"
          :key="h.id"
          :item="h"
          @click="go('pages/travel/homestay-detail?id=' + h.id)"
        />
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.homestay-list__grid {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
</style>
