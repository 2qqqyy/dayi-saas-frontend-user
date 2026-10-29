<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { onMounted } from "vue";
import { useRequest } from "@/composables/useRequest";
import { getPickingList } from "@/api/picking";
import type { PickingItem } from "@/types/business";
import { go } from "@/utils/navigation";
import { tr } from "@/utils/i18n";

import PickingCard from "@/components/PickingCard.vue";
import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";

const { loading, error, data, run } = useRequest<PickingItem[]>(() =>
  getPickingList().then((r) => r.data),
);

onMounted(run);
</script>

<template>
  <view class="page picking-list">
    <NavBar :title="tr('青梅采摘')" />
    <template v-if="loading">
      <LoadingState :rows="3" />
    </template>
    <template v-else-if="error">
      <EmptyState :title="tr('加载失败')" :description="error" :action-text="tr('重新加载')" @action="run" />
    </template>
    <template v-else-if="data && !data.length">
      <EmptyState :title="tr('暂无采摘园')" :description="tr('去发现一些好玩的地方吧')" :action-text="tr('去旅行')" @action="go('pages/travel/index')" />
    </template>
    <template v-else>
      <view class="picking-list__grid">
        <PickingCard
          v-for="p in data"
          :key="p.id"
          :item="p"
          @click="go('pages/travel/picking-detail?id=' + p.id)"
        />
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.picking-list__grid {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
</style>
