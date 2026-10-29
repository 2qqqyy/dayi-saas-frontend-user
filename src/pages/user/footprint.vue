<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import NavBar from "@/components/NavBar.vue";
import EmptyState from "@/components/EmptyState.vue";
import { clearFootprint, readFootprint, type FootprintItem } from "@/utils/footprint";
import { tc, tr } from "@/utils/i18n";
import { go } from "@/utils/navigation";

const list = ref<FootprintItem[]>([]);

onShow(() => {
  list.value = readFootprint();
});

function onTap(item: FootprintItem) {
  go(item.type === "scenic" ? `pages/travel/scenic-detail?id=${item.id}` : `pages/mall/product-detail?id=${item.id}`);
}

function onClear() {
  uni.showModal({
    title: tr("清空足迹"),
    content: tr("清空后不可恢复，确定吗？"),
    success: (r) => {
      if (r.confirm) {
        clearFootprint();
        list.value = [];
      }
    },
  });
}
</script>

<template>
  <view class="fp">
    <NavBar :title="tr('我的足迹')" show-back>
      <template #right>
        <text v-if="list.length" class="fp__clear" @tap="onClear">{{ tr("清空") }}</text>
      </template>
    </NavBar>

    <EmptyState v-if="!list.length" :title="tr('还没有足迹')" :description="tr('去景点或商城逛逛，看过的会记在这里')" />

    <view v-else class="fp__grid">
      <view v-for="item in list" :key="item.type + item.id" class="fp__cell" @tap="onTap(item)">
        <image class="fp__img" :src="item.image" mode="aspectFill" />
        <text class="fp__name">{{ tc(item.name, item.nameEn) }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.fp {
  min-height: 100vh;
  background: $bg;
}

.fp__clear {
  font-size: 26rpx;
  color: $price;
}

.fp__grid {
  padding: 24rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
}

.fp__cell {
  width: calc((100% - 48rpx) / 3);
}

.fp__img {
  width: 100%;
  height: 200rpx;
  border-radius: $radius-md;
  background: $img-bg;
}

.fp__name {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: $text-main;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
