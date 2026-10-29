<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { getProductList } from "@/api/product";
import type { ProductItem } from "@/types/business";
import { go } from "@/utils/navigation";
import { tr } from "@/utils/i18n";

import SearchBar from "@/components/SearchBar.vue";
import ProductCard from "@/components/ProductCard.vue";
import EmptyState from "@/components/EmptyState.vue";

const keyword = ref("");
const results = ref<ProductItem[]>([]);
const searched = ref(false);
const searching = ref(false);

async function onSearch() {
  const kw = keyword.value.trim();
  if (!kw) {
    uni.showToast({ title: tr("请输入关键词"), icon: "none" });
    return;
  }
  searching.value = true;
  try {
    const res = await getProductList({ keyword: kw });
    results.value = res.data;
    searched.value = true;
  } finally {
    searching.value = false;
  }
}

onLoad((options) => {
  const kw = decodeURIComponent((options?.keyword as string) || "");
  if (kw) {
    keyword.value = kw;
    onSearch();
  }
});
</script>

<template>
  <view class="page">
    <NavBar :title="tr('搜索好物')" />
    <view class="search">
      <SearchBar v-model="keyword" :placeholder="tr('搜索青梅酒 / 青梅干 / 农家蜂蜜')" @search="onSearch" />
      <view class="search__btn" @tap="onSearch">{{ tr("搜索") }}</view>
    </view>

    <view v-if="searching" class="search__hint">
      <text>{{ tr("搜索中…") }}</text>
    </view>
    <template v-else-if="searched && !results.length">
      <EmptyState :title="tr('没有找到相关好物')" :description="tr('换个关键词试试吧')" :action-text="tr('去商城逛逛')" @action="go('pages/mall/index')" />
    </template>
    <template v-else>
      <view class="grid">
        <view v-for="p in results" :key="p.id" class="grid__item">
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
.search {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.search__btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 72rpx;
  padding: 0 32rpx;
  border-radius: 36rpx;
  background: $green;
  color: #f7f3e6;
  font-size: 26rpx;
}

.search__hint {
  padding: 80rpx 0;
  text-align: center;
  color: $text-sub;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20rpx;
}
</style>
