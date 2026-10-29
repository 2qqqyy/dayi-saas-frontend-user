<script setup lang="ts">
import { ref, onMounted } from "vue";
import { tc, tr } from "@/utils/i18n";
import { useAppStore } from "@/stores/app";
import { useRequest } from "@/composables/useRequest";
import { getProductList, getTopCategories, type CategoryNode } from "@/api/product";
import type { ProductItem } from "@/types/business";
import { go } from "@/utils/navigation";
import { assetUrl } from "@/utils/request";

import AppTabBar from "@/components/AppTabBar.vue";
import AppNavbar from "@/components/AppNavbar.vue";
import SearchBar from "@/components/SearchBar.vue";
import SectionTitle from "@/components/SectionTitle.vue";
import ProductCard from "@/components/ProductCard.vue";
import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";

const appStore = useAppStore();
const categories = ref<CategoryNode[]>([]);
const products = ref<ProductItem[]>([]);

const { loading, error, run } = useRequest(async () => {
  const [catRes, prodRes] = await Promise.all([getTopCategories(), getProductList()]);
  categories.value = catRes.data;
  products.value = prodRes.data;
});

onMounted(run);

const bannerImg = assetUrl("/static/images/orchard-plum-eco-w169.jpg");

function toCategory(c: CategoryNode) {
  go(`pages/mall/category?id=${c.id}&name=${encodeURIComponent(c.name)}`);
}

function toRecommend() {
  const first = products.value[0];
  if (first) go(`pages/mall/product-detail?id=${first.id}`);
}
</script>

<template>
  <view class="mall">
    <view :style="{ paddingTop: appStore.safeAreaTop + 'px' }">
      <AppNavbar :title="tr('商城')" :subtitle="tr('把乡村的味道带回家')" />
      <view class="mall__search">
        <SearchBar :placeholder="tr('搜索青梅好物')" @select="go('pages/mall/search')" />
      </view>
    </view>

    <view class="mall__body">
      <template v-if="loading">
        <LoadingState :rows="3" type="grid" />
      </template>
      <template v-else-if="error">
        <EmptyState :title="tr('加载失败')" :description="error" :action-text="tr('重新加载')" @action="run" />
      </template>
      <template v-else>
        <!-- 分类 -->
        <view class="cats">
          <view class="cats__item" v-for="c in categories" :key="c.id" @tap="toCategory(c)">
            <text>{{ tc(c.name, c.nameEn) }}</text>
          </view>
        </view>

        <!-- 今日推荐 -->
        <view class="banner" @tap="toRecommend">
          <image class="banner__img" :src="bannerImg" mode="aspectFill" />
          <view class="banner__mask" />
          <view class="banner__text">
            <text class="banner__tag">{{ tr("今日推荐") }}</text>
            <text class="banner__title">{{ tr("青梅成熟季 · 现摘现发") }}</text>
            <text class="banner__desc">{{ tr("新鲜青梅 · 青梅干 · 青梅酒，果园直发") }}</text>
          </view>
        </view>

        <!-- 农家好物 -->
        <SectionTitle :title="tr('农家好物')" :subtitle="tr('产地直供 · 品质溯源')" />
        <view class="grid">
          <view v-for="p in products" :key="p.id" class="grid__item">
            <ProductCard
              :item="p"
              @click="go('pages/mall/product-detail?id=' + p.id)"
              @add="go('pages/mall/product-detail?id=' + p.id)"
            />
          </view>
        </view>

        <!-- 乡村礼盒 -->
        <view class="gift" @tap="go('pages/mall/category?name=' + encodeURIComponent('青梅制品'))">
          <view class="gift__text">
            <text class="gift__title">{{ tr("乡村礼盒") }}</text>
            <text class="gift__desc">{{ tr("把青梅味道打包送人") }}</text>
          </view>
          <text class="gift__arrow">›</text>
        </view>
      </template>
    </view>

    <AppTabBar current="mall" />
  </view>
</template>

<style lang="scss" scoped>
.mall {
  min-height: 100vh;
}

.mall__search {
  padding: 0 24rpx 8rpx;
}

.mall__body {
  padding: 16rpx 24rpx calc(140rpx + env(safe-area-inset-bottom));
}

.cats {
  display: flex;
  gap: 16rpx;
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  margin-bottom: 24rpx;
  padding-bottom: 4rpx;
}

.cats__item {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  flex-shrink: 0;
  padding: 10rpx 22rpx;
  border-radius: 6rpx;
  border: 1rpx solid $line-strong;
  background: transparent;
  color: $text-sub;
  font-size: 22rpx;
  font-weight: 400;
}

.cats__icon {
  font-size: 26rpx;
}

.cats__item:active {
  opacity: 0.7;
}

.banner {
  position: relative;
  height: 280rpx;
  border-radius: 12rpx;
  overflow: hidden;
  margin-bottom: 8rpx;
}

.banner__img {
  width: 100%;
  height: 100%;
}

.banner__mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(38, 53, 42, 0.5), rgba(38, 53, 42, 0.05));
}

.banner__text {
  position: absolute;
  left: 28rpx;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.banner__tag {
  align-self: flex-start;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  background: $yellow;
  color: $text-main;
  font-size: 22rpx;
}

.banner__title {
  font-size: 34rpx;
  font-weight: 700;
  color: #fff;
}

.banner__desc {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20rpx;
}

.gift {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 40rpx;
  padding: 32rpx 28rpx;
  border-radius: 12rpx;
  background: $paper;
  border: 1rpx solid $line;
  background: #f6edda;
}

.gift__text {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.gift__title {
  font-size: 30rpx;
  font-weight: 700;
  color: $brown;
}

.gift__desc {
  font-size: 24rpx;
  color: $text-sub;
}

.gift__arrow {
  font-size: 44rpx;
  color: $brown;
}
</style>
