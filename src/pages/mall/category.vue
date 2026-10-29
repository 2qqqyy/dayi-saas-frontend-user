<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { ref } from "vue";
import { tc, tr } from "@/utils/i18n";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { useRequest } from "@/composables/useRequest";
import { getProductList, getSubCategories, resolveCategoryId, type CategoryNode } from "@/api/product";
import type { ProductItem } from "@/types/business";
import { go } from "@/utils/navigation";

import ProductCard from "@/components/ProductCard.vue";
import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";

const categoryId = ref("");
const categoryName = ref("");
const subs = ref<CategoryNode[]>([]);

const { loading, error, data, run } = useRequest<ProductItem[]>(() =>
  getProductList({ category: categoryId.value }).then((r) => r.data),
);

/** onLoad 里要先解析分类 id（异步），首次 onShow 不能抢跑 */
let resolved = false;

onLoad(async (options) => {
  categoryName.value = decodeURIComponent((options?.name as string) || "");
  categoryId.value = await resolveCategoryId((options?.id as string) || categoryName.value);
  uni.setNavigationBarTitle({ title: categoryName.value || "商品分类" });
  subs.value = (await getSubCategories(categoryId.value)).data;
  resolved = true;
  run();
});

// 从商品详情返回时重拉一次：商家改价、下架商品都能及时体现
onShow(() => {
  if (resolved) run();
});

function selectSub(c: CategoryNode) {
  categoryId.value = c.id;
  categoryName.value = c.name;
  uni.setNavigationBarTitle({ title: c.name });
  run();
}
</script>

<template>
  <view class="page">
    <NavBar :title="tr('商品分类')" />
    <view v-if="subs.length" class="subs">
      <view
        v-for="c in subs"
        :key="c.id"
        class="subs__item"
        :class="{ 'subs__item--on': c.id === categoryId }"
        @tap="selectSub(c)"
      >
        <text>{{ tc(c.name, c.nameEn) }}</text>
      </view>
    </view>

    <template v-if="loading">
      <LoadingState :rows="4" type="grid" />
    </template>
    <template v-else-if="error">
      <EmptyState :title="tr('加载失败')" :description="error" :action-text="tr('重新加载')" @action="run" />
    </template>
    <template v-else-if="data && !data.length">
      <EmptyState :title="tr('该分类暂无商品')" :description="tr('去看看其他好物吧')" :action-text="tr('去商城')" @action="go('pages/mall/index')" />
    </template>
    <template v-else>
      <view class="grid">
        <view v-for="p in data" :key="p.id" class="grid__item">
          <ProductCard
            :item="p"
            @click="go('pages/mall/product-detail?id=' + p.id)"
            @add="go('pages/mall/product-detail?id=' + p.id)"
          />
        </view>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.page {
  padding: 16rpx 24rpx calc(40rpx + env(safe-area-inset-bottom));
}

.subs {
  display: flex;
  gap: 16rpx;
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  margin-bottom: 20rpx;
}

.subs__item {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: 10rpx 26rpx;
  border-radius: 30rpx;
  background: #fff;
  border: 1rpx solid rgba(38, 53, 42, 0.08);
  color: $text-sub;
  font-size: 26rpx;

  &--on {
    background: $green-bg;
    border-color: $green;
    color: $green;
    font-weight: 600;
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20rpx;
}
</style>
