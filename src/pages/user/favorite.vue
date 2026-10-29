<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { ref, computed } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useUserStore } from "@/stores/user";
import type { FavoriteItem, FavoriteType } from "@/types/business";
import { go } from "@/utils/navigation";
import { FALLBACK_IMAGE } from "@/utils/backend";
import { tr } from "@/utils/i18n";

import EmptyState from "@/components/EmptyState.vue";

const userStore = useUserStore();

// 每次进入都以服务端收藏为准：在详情页收藏或取消后回到本页不用刷新
onShow(() => {
  userStore.ensureSeeded(true).catch(() => {});
});

const tabs: { label: string; value: FavoriteType }[] = [
  { label: "景点", value: "scenic" },
  { label: "民宿", value: "homestay" },
  { label: "商品", value: "product" },
  { label: "路线", value: "route" },
];

const active = ref<FavoriteType>("scenic");

const list = computed(() => userStore.favorites.filter((f) => f.type === active.value));

/** 各收藏类型对应的详情页 */
const DETAIL_PATH: Record<FavoriteType, string> = {
  scenic: "pages/travel/scenic-detail",
  homestay: "pages/travel/homestay-detail",
  product: "pages/mall/product-detail",
  route: "pages/travel/route-detail",
};

/**
 * 收藏项自带业务主键 targetId（景点/路线详情可能用 scenic-1 这类编码，
 * 但收藏表存的是数字主键）；本地新增还没落库的退回从组合键里解析。
 */
function detailId(item: FavoriteItem) {
  if (item.targetId) return item.targetId;
  const parts = String(item.id ?? "").split("-");
  return parts.length >= 3 ? parts[parts.length - 1] : "";
}

function openDetail(item: FavoriteItem) {
  const id = detailId(item);
  const base = DETAIL_PATH[item.type];
  if (!id || !base) {
    go(cardPath(item.type));
    return;
  }
  go(`${base}?id=${encodeURIComponent(id)}`);
}

/** 兜底列表页（详情页缺失或 id 解析失败时使用） */
function cardPath(type: FavoriteType) {
  const map: Record<FavoriteType, string> = {
    scenic: "pages/travel/index",
    homestay: "pages/travel/homestay",
    product: "pages/mall/index",
    route: "pages/travel/index",
  };
  return map[type];
}

/** 各分类收藏数量，展示在标签后 */
function countOf(type: FavoriteType) {
  return userStore.favorites.filter((f) => f.type === type).length;
}

async function onRemove(id: string) {
  try {
    await userStore.removeFavorite(id);
    uni.showToast({ title: tr("已取消收藏"), icon: "none" });
  } catch {
    // store 已回滚，失败原因由请求拦截器统一提示
  }
}
</script>

<template>
  <view class="page">
    <NavBar :title="tr('我的收藏')" />
    <view class="tabs">
      <view
        v-for="t in tabs"
        :key="t.value"
        class="tabs__item"
        :class="{ active: active === t.value }"
        @tap="active = t.value"
      >
        <text>{{ tr(t.label) }}</text>
        <text v-if="countOf(t.value)" class="tabs__count">{{ countOf(t.value) }}</text>
      </view>
    </view>

    <template v-if="!list.length">
      <EmptyState :title="tr('还没有收藏内容')" :description="tr('去发现一些好玩的地方吧')" :action-text="tr('去逛逛')" @action="go('pages/index/index')" />
    </template>
    <template v-else>
      <view class="fav-list">
        <view v-for="f in list" :key="f.id" class="fav card" @tap="openDetail(f)">
          <image class="fav__img" :src="f.image || FALLBACK_IMAGE" mode="aspectFill" />
          <view class="fav__info">
            <text class="fav__title">{{ f.title }}</text>
            <text class="fav__subtitle">{{ f.subtitle }}</text>
          </view>
          <view class="fav__remove" @tap.stop="onRemove(f.id)">
            <text>{{ tr("移除") }}</text>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.tabs {
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 16rpx 24rpx;
  position: sticky;
  top: 0;
  background: $cream;
  z-index: 10;
}

.tabs__item {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 30rpx;
  margin-right: 16rpx;
  border-radius: 32rpx;
  background: #fff;
  color: $text-main;
  font-size: 26rpx;

  &.active {
    background: $green;
    color: #f7f3e6;
  }
}

.tabs__count {
  font-size: 20rpx;
  opacity: 0.7;
}

.fav-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.fav {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx;
}

.fav__img {
  width: 140rpx;
  height: 140rpx;
  border-radius: $radius-sm;
  flex-shrink: 0;
}

.fav__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.fav__title {
  font-size: 28rpx;
  font-weight: 600;
}

.fav__subtitle {
  font-size: 24rpx;
  color: $text-sub;
}

.fav__remove {
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  background: $cream;
  color: $text-sub;
  font-size: 22rpx;
}
</style>
