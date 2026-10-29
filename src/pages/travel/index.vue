<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useTravelStore } from "@/stores/travel";
import { useAppStore } from "@/stores/app";
import { useRequest } from "@/composables/useRequest";
import { getGuideData } from "@/api/travel";
import { go } from "@/utils/navigation";
import { assetUrl } from "@/utils/request";
import { tr } from "@/utils/i18n";

import AppTabBar from "@/components/AppTabBar.vue";
import AppNavbar from "@/components/AppNavbar.vue";
import SearchBar from "@/components/SearchBar.vue";
import SectionTitle from "@/components/SectionTitle.vue";
import ScenicCard from "@/components/ScenicCard.vue";
import RouteCard from "@/components/RouteCard.vue";
import PickingCard from "@/components/PickingCard.vue";
import HomestayCard from "@/components/HomestayCard.vue";
import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";

const travelStore = useTravelStore();
const appStore = useAppStore();

/** 导览图概况，用于地图入口的副标题文案，避免与导览数据脱节 */
const guideSummary = ref(tr("导览点位 · 主题路线 · 服务设施"));

const { loading, error, run } = useRequest(async () => {
  const [, guideRes] = await Promise.all([travelStore.fetchAll(), getGuideData()]);
  const g = guideRes.data;
  if (g) {
    guideSummary.value = tr("{s} 个点位分布 · {r} 条导览路线 · {f} 处设施")
      .replace("{s}", String(g.spots?.length ?? 0))
      .replace("{r}", String(g.routes?.length ?? 0))
      .replace("{f}", String(g.facilities?.length ?? 0));
  }
});

onMounted(run);

const mapImg = assetUrl("/static/images/travel-map-aerial.jpg");
</script>

<template>
  <view class="travel">
    <view :style="{ paddingTop: appStore.safeAreaTop + 'px' }">
      <AppNavbar :title="tr('旅行')" :subtitle="tr('发现山野与青梅')" />
      <view class="travel__search">
        <SearchBar :placeholder="tr('搜索景点 / 路线 / 体验')" @select="go('pages/travel/map')" />
      </view>
    </view>

    <view class="travel__body">
      <template v-if="loading">
        <LoadingState :rows="3" />
      </template>
      <template v-else-if="error">
        <EmptyState :title="tr('加载失败')" :description="error" :action-text="tr('重新加载')" @action="run" />
      </template>
      <template v-else>
        <!-- 地图入口 -->
        <view class="map-entry" @tap="go('pages/travel/map')">
          <image class="map-entry__img" :src="mapImg" mode="aspectFill" />
          <view class="map-entry__mask" />
          <view class="map-entry__text">
            <text class="map-entry__title">{{ tr("山野导览地图") }}</text>
            <text class="map-entry__desc">{{ guideSummary }}</text>
          </view>
          <view class="map-entry__go">
            <text>{{ tr("查看导览图") }}</text>
            <text class="map-entry__go-arrow">›</text>
          </view>
        </view>

        <!-- 热门景点 -->
        <SectionTitle :title="tr('热门景点')" :subtitle="tr('值得一去的山野去处')" />
        <view class="stack">
          <ScenicCard
            v-for="s in travelStore.scenicList"
            :key="s.id"
            :item="s"
            @click="go('pages/travel/scenic-detail?id=' + s.id)"
          />
        </view>

        <!-- 推荐路线 -->
        <SectionTitle
          :title="tr('推荐路线')"
          :subtitle="tr('{n} 条主题路线，玩法各不一样').replace('{n}', String(travelStore.routeList.length))"
        />
        <view class="stack">
          <RouteCard
            v-for="r in travelStore.routeList"
            :key="r.id"
            :item="r"
            @click="go('pages/travel/route-detail?id=' + r.id)"
          />
        </view>

        <!-- 采摘体验 -->
        <SectionTitle :title="tr('采摘体验')" :subtitle="tr('亲手摘下青梅')" show-more @more="go('pages/travel/picking')" />
        <view class="stack">
          <PickingCard
            v-for="p in travelStore.pickingList"
            :key="p.id"
            :item="p"
            @click="go('pages/travel/picking-detail?id=' + p.id)"
          />
        </view>

        <!-- 民宿 -->
        <SectionTitle :title="tr('特色民宿')" :subtitle="tr('在山野住一晚')" show-more @more="go('pages/travel/homestay')" />
        <view class="stack">
          <HomestayCard
            v-for="h in travelStore.homestayList"
            :key="h.id"
            :item="h"
            @click="go('pages/travel/homestay-detail?id=' + h.id)"
          />
        </view>
      </template>
    </view>

    <AppTabBar current="travel" />
  </view>
</template>

<style lang="scss" scoped>
.travel {
  min-height: 100vh;
}

.travel__search {
  padding: 0 24rpx 8rpx;
}

.travel__body {
  padding: 16rpx 24rpx calc(140rpx + env(safe-area-inset-bottom));
}

.map-entry {
  position: relative;
  height: 240rpx;
  border-radius: $radius-md;
  overflow: hidden;
  box-shadow: 0 8rpx 28rpx rgba(38, 53, 42, 0.08);
}

.map-entry__img {
  width: 100%;
  height: 100%;
}

.map-entry__mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(38, 53, 42, 0.68) 0%, rgba(38, 53, 42, 0.12) 78%);
}

.map-entry__text {
  position: absolute;
  left: 28rpx;
  top: 50%;
  transform: translateY(-50%);
  right: 180rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.map-entry__title {
  font-size: 34rpx;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 2rpx 12rpx rgba(18, 28, 20, 0.5);
}

.map-entry__desc {
  font-size: 23rpx;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 2rpx 10rpx rgba(18, 28, 20, 0.5);
}

.map-entry__go {
  position: absolute;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 2rpx;
  padding: 10rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.22);
  border: 1rpx solid rgba(255, 255, 255, 0.32);
  color: #fff;
  font-size: 22rpx;
  backdrop-filter: blur(8rpx);
}

.map-entry__go-arrow {
  font-size: 28rpx;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
</style>
