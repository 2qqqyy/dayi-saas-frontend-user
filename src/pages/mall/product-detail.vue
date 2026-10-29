<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { ref, computed } from "vue";
import { tc, tr } from "@/utils/i18n";
import { onLoad, onShow, onShareAppMessage } from "@dcloudio/uni-app";
import { useRequest } from "@/composables/useRequest";
import { getProductDetail, getProductList } from "@/api/product";
import { pushFootprint } from "@/utils/footprint";
import type { ProductItem, ProductSku } from "@/types/business";
import { useCartStore } from "@/stores/cart";
import { useUserStore } from "@/stores/user";
import { requireLogin, go } from "@/utils/navigation";

import Price from "@/components/Price.vue";
import Rating from "@/components/Rating.vue";
import BottomPopup from "@/components/BottomPopup.vue";
import QuantitySelector from "@/components/QuantitySelector.vue";
import ProductCard from "@/components/ProductCard.vue";
import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";
import ContactCard from "@/components/ContactCard.vue";

const productId = ref("");
const detail = ref<ProductItem | null>(null);
const recommend = ref<ProductItem[]>([]);
const selectedSku = ref<ProductSku | null>(null);
const quantity = ref(1);
const showPopup = ref(false);
const mode = ref<"add" | "buy">("add");

const cartStore = useCartStore();
const userStore = useUserStore();

const { loading, error, run } = useRequest(async () => {
  const [res, listRes] = await Promise.all([
    getProductDetail(productId.value),
    getProductList(),
  ]);
  detail.value = res.data;
  if (res.data) {
    pushFootprint({
      type: "product",
      id: String(res.data.id),
      name: res.data.name,
      nameEn: res.data.nameEn,
      image: res.data.image,
    });
  }
  // 回页面会重新拉一次数据，保留用户已选的规格，别让选中态被刷掉
  const keep = selectedSku.value?.id;
  selectedSku.value =
    res.data.skus.find((s) => s.id === keep) ?? res.data.skus[0] ?? null;
  recommend.value = listRes.data.filter((p) => p.id !== res.data.id).slice(0, 2);
});

onLoad((options) => {
  productId.value = (options?.id as string) || "";
  // 足迹在数据返回后记录，见 loadDetail
});

// onLoad 早于首次 onShow，统一在这里拉取：首次进入和从购物车/结算返回都会重新校验价格与库存
onShow(() => {
  if (productId.value) run();
});

/** 轮播图统一取自商品自身的实拍图，避免出现与商品无关的图片 */
const images = computed(() => {
  if (!detail.value) return [];
  return detail.value.gallery?.length ? detail.value.gallery : [detail.value.image];
});

function selectSku(sku: ProductSku) {
  selectedSku.value = sku;
}

function openPopup(m: "add" | "buy") {
  mode.value = m;
  showPopup.value = true;
}

async function onConfirm() {
  if (!detail.value) return;
  if (!selectedSku.value) {
    uni.showToast({ title: tr("该商品暂无可选规格"), icon: "none" });
    return;
  }
  const sku = selectedSku.value;
  if (mode.value === "add") {
    // 已登录时加购会写 cart_item 表；失败时 store 已回滚，提示由请求拦截器统一弹出
    const ok = await cartStore.addCart({
      productId: detail.value.id,
      skuId: sku.id,
      name: detail.value.name,
      image: detail.value.image,
      summary: `${sku.name}`,
      price: sku.price,
      quantity: quantity.value,
      stock: sku.stock,
    });
    showPopup.value = false;
    if (ok) uni.showToast({ title: tr("已加入购物车"), icon: "success" });
  } else {
    if (!userStore.isLogin) {
      showPopup.value = false;
      requireLogin(`pages/mall/product-detail?id=${productId.value}`);
      return;
    }
    showPopup.value = false;
    go(`pages/order/product-order?productId=${detail.value.id}&skuId=${sku.id}&quantity=${quantity.value}`);
  }
}

const isFav = computed(() =>
  userStore.favoriteIds.includes(`fav-product-${productId.value}`),
);

/** 收藏直接落 favorite 表，「我的收藏-商品」标签下可见 */
async function toggleFavorite() {
  if (!detail.value) return;
  if (!userStore.isLogin) {
    requireLogin(`pages/mall/product-detail?id=${productId.value}`);
    return;
  }
  try {
    const added = await userStore.toggleFavorite({
      id: `fav-product-${productId.value}`,
      targetId: productId.value,
      type: "product",
      title: detail.value.name,
      subtitle: detail.value.summary,
      image: detail.value.image,
    });
    uni.showToast({ title: added ? tr("已收藏") : tr("已取消收藏"), icon: "none" });
  } catch {
    // store 已回滚乐观更新，失败原因由请求拦截器统一提示，这里不再重复弹
  }
}
</script>

<template>
  <view class="page">
    <NavBar :title="tr('商品详情')" />
    <template v-if="loading">
      <LoadingState :rows="4" />
    </template>
    <template v-else-if="error || !detail">
      <EmptyState :title="tr('加载失败')" :description="error" :action-text="tr('重新加载')" @action="run" />
    </template>
    <template v-else>
      <swiper class="pd__swiper" circular :indicator-dots="true" indicator-active-color="#4F8F52">
        <swiper-item v-for="img in images" :key="img">
          <image class="pd__img" :src="img" mode="aspectFill" />
        </swiper-item>
      </swiper>

      <view class="pd__body">
        <view class="pd__price-row">
          <Price :value="selectedSku?.price ?? detail.price" :size="44" />
          <text class="pd__sales">{{ tr("已售") }} {{ detail.sales }}</text>
        </view>
        <text class="pd__name">{{ tc(detail.name, detail.nameEn) }}</text>
        <text class="pd__summary">{{ tc(detail.summary, detail.summaryEn) }}</text>

        <view class="pd__selling">
          <text v-for="p in detail.sellingPoints" :key="p" class="pd__selling-item">{{ p }}</text>
        </view>

        <!-- 没有配置产地时整条不展示，避免写出「满99包邮 / 坏果包赔」这类无来源的承诺 -->
        <view v-if="detail.origin" class="pd__promo">
          <text>{{ tr("产地") }} {{ detail.origin }} · {{ tr("发货与物流进度可致电平台客服跟进") }}</text>
        </view>

        <view class="pd__sku" @tap="openPopup('add')">
          <text class="pd__sku-label">{{ tr("已选规格") }}</text>
          <text class="pd__sku-value">{{ selectedSku?.name }} · {{ quantity }} {{ tr("件") }}</text>
          <text class="pd__sku-arrow">›</text>
        </view>

        <view class="pd__section">
          <text class="pd__h">{{ tr("商品介绍") }}</text>
          <text v-for="(para, i) in detail.description" :key="i" class="pd__p">{{ para }}</text>
        </view>

        <view class="pd__section">
          <text class="pd__h">{{ tr("规格参数") }}</text>
          <view class="pd__table card">
            <view v-for="s in detail.specs" :key="s.label" class="pd__table-row">
              <text class="pd__table-label">{{ s.label }}</text>
              <text class="pd__table-value">{{ s.value }}</text>
            </view>
          </view>
        </view>

        <view class="pd__section">
          <text class="pd__h">{{ tr("产地") }}</text>
          <text class="pd__p">{{ detail.origin }} · {{ detail.category }}</text>
        </view>

        <view v-if="detail.merchantName" class="pd__section">
          <text class="pd__h">{{ tr("所属商家") }}</text>
          <view class="pd__shop card">
            <view class="pd__shop-head">
              <text class="pd__shop-name">{{ detail.merchantName }}</text>
              <text v-if="detail.merchant && detail.merchant.rating > 0" class="pd__shop-rating">
                ★ {{ detail.merchant.rating.toFixed(1) }}
              </text>
            </view>
            <text v-if="detail.merchant && detail.merchant.openTime" class="pd__shop-meta">
              {{ tr("营业时间") }} {{ detail.merchant.openTime }}
            </text>
            <text v-if="detail.merchant && detail.merchant.shopNotice" class="pd__shop-notice">
              {{ detail.merchant.shopNotice }}
            </text>
            <text v-if="detail.merchant && detail.merchant.intro" class="pd__shop-intro">
              {{ detail.merchant.intro }}
            </text>
            <text v-if="detail.merchant && detail.merchant.address" class="pd__shop-addr">
              {{ detail.merchant.address }}
            </text>
          </view>
        </view>

        <view class="pd__section">
          <text class="pd__h">{{ tr("购买须知") }}</text>
          <view class="pd__table card">
            <view v-for="n in detail.notices" :key="n" class="pd__notice-row">
              <text class="pd__notice-dot">·</text>
              <text class="pd__notice-text">{{ n }}</text>
            </view>
          </view>
        </view>

        <!-- 平台客服电话：可代联商家 -->
        <ContactCard
          :label="tr('平台客服电话（可代联商家）')"
          :tip="tr('发货、改地址、退换与批量采购可致电平台客服，由客服代为联系商家')"
        />

        <view v-if="detail.reviewCount" class="pd__section">
          <view class="pd__review-head">
            <text class="pd__h pd__h--inline">{{ tr("用户评价") }}（{{ detail.reviewCount }}）</text>
            <text class="pd__good">{{ tr("好评率") }} {{ detail.goodRate }}</text>
          </view>
          <view class="pd__reviews">
            <view v-for="r in detail.reviews" :key="r.id" class="pd__review card">
              <view class="pd__review-top">
                <view class="pd__avatar" :style="{ background: r.avatarColor }">
                  <text>{{ r.user.slice(0, 1) }}</text>
                </view>
                <view class="pd__review-meta">
                  <text class="pd__review-user">{{ r.user }}</text>
                  <text class="pd__review-date">{{ r.date }}<text v-if="r.spec"> · {{ r.spec }}</text></text>
                </view>
                <Rating :value="r.rating" :size="24" />
              </view>
              <text class="pd__review-text">{{ r.content }}</text>
              <view v-if="r.tags.length" class="pd__review-tags">
                <text v-for="t in r.tags" :key="t" class="pd__review-tag">{{ t }}</text>
              </view>
              <text v-if="r.likes" class="pd__review-likes">{{ tr("有用") }} {{ r.likes }}</text>
            </view>
          </view>
        </view>

        <view class="pd__section" v-if="recommend.length">
          <text class="pd__h">{{ tr("相关推荐") }}</text>
          <view class="pd__grid">
            <ProductCard
              v-for="p in recommend"
              :key="p.id"
              :item="p"
              @click="go('pages/mall/product-detail?id=' + p.id)"
              @add="go('pages/mall/product-detail?id=' + p.id)"
            />
          </view>
        </view>
      </view>

      <!-- 底部操作栏 -->
      <view class="pd__bar">
        <view class="pd__bar-cart" @tap="go('pages/mall/cart')">
          <view class="pd__bag-icon" />
          <text>{{ tr("购物车") }}</text>
          <text v-if="cartStore.totalCount" class="pd__bar-badge">{{ cartStore.totalCount }}</text>
        </view>
        <view class="pd__bar-fav" :class="{ active: isFav }" @tap="toggleFavorite">
          <text class="pd__bar-fav-star">{{ isFav ? "★" : "☆" }}</text>
          <text>{{ tr("收藏") }}</text>
        </view>
        <view class="pd__bar-add" @tap="openPopup('add')">{{ tr("加入购物车") }}</view>
        <view class="pd__bar-buy" @tap="openPopup('buy')">{{ tr("立即购买") }}</view>
      </view>

      <!-- SKU 选择弹层 -->
      <BottomPopup v-model:show="showPopup" :title="tr('选择规格')">
        <view class="sku">
          <view class="sku__head">
            <image class="sku__img" :src="detail.image" mode="aspectFill" />
            <view class="sku__info">
              <Price :value="selectedSku?.price ?? detail.price" :size="40" />
              <text class="sku__stock">{{ tr("库存") }} {{ selectedSku?.stock ?? "—" }} {{ tr("件") }}</text>
            </view>
          </view>
          <text class="sku__label">{{ tr("规格") }}</text>
          <view class="sku__list">
            <view
              v-for="s in detail.skus"
              :key="s.id"
              class="sku__item"
              :class="{ active: selectedSku?.id === s.id }"
              @tap="selectSku(s)"
            >
              <text>{{ s.name }}</text>
            </view>
          </view>
          <view class="sku__qty">
            <text class="sku__label">{{ tr("数量") }}</text>
            <QuantitySelector v-model="quantity" :max="selectedSku?.stock ?? 1" />
          </view>
        </view>
        <template #footer>
          <view class="sku__confirm" @tap="onConfirm">
            <text>{{ mode === 'add' ? tr('加入购物车') : tr('立即购买') }}</text>
          </view>
        </template>
      </BottomPopup>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.pd__swiper {
  width: 100%;
  aspect-ratio: 4 / 5;
  background: #f7f5ef;
}

.pd__img {
  width: 100%;
  height: 100%;
}

.pd__body {
  padding: 24rpx 24rpx calc(160rpx + env(safe-area-inset-bottom));
}

.pd__price-row {
  display: flex;
  align-items: baseline;
  gap: 20rpx;
}

.pd__sales {
  font-size: 24rpx;
  color: $text-sub;
}

.pd__name {
  display: block;
  margin-top: 8rpx;
  font-size: 36rpx;
  font-weight: 800;
}

.pd__summary {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: $text-sub;
}

.pd__selling {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 18rpx;
}

.pd__selling-item {
  padding: 6rpx 18rpx;
  border-radius: 22rpx;
  background: $green-bg;
  color: $green;
  font-size: 22rpx;
}

.pd__promo {
  margin-top: 16rpx;
  padding: 16rpx 20rpx;
  border-radius: $radius-sm;
  background: #fff4e3;
  color: #d96a3b;
  font-size: 24rpx;
}

.pd__sku {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 20rpx;
  padding: 24rpx;
  border-radius: $radius-md;
  background: #fff;
}

.pd__sku-label {
  font-size: 26rpx;
  color: $text-sub;
}

.pd__sku-value {
  flex: 1;
  font-size: 26rpx;
  color: $text-main;
}

.pd__sku-arrow {
  font-size: 36rpx;
  color: $text-sub;
}

.pd__section {
  margin-top: 32rpx;
}

.pd__h {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}

.pd__h--inline {
  display: inline-block;
  margin-bottom: 0;
}

.pd__p {
  display: block;
  font-size: 28rpx;
  line-height: 1.75;
  color: $text-main;
}

.pd__shop {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.pd__shop-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pd__shop-name {
  font-size: 28rpx;
  font-weight: 600;
  color: $text-main;
}

.pd__shop-rating {
  font-size: 24rpx;
  color: $price;
}

.pd__shop-intro {
  font-size: 24rpx;
  line-height: 1.6;
  color: $text-sub;
}

.pd__shop-addr {
  font-size: 22rpx;
  color: $text-sub;
}

.pd__p + .pd__p {
  margin-top: 18rpx;
}

.pd__table {
  padding: 8rpx 24rpx;
}

.pd__table-row {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  padding: 18rpx 0;
}

.pd__table-row + .pd__table-row,
.pd__table-row + .pd__notice-row {
  border-top: 1rpx solid #f2f3f0;
}

.pd__table-label {
  flex-shrink: 0;
  width: 150rpx;
  font-size: 26rpx;
  color: $text-sub;
}

.pd__table-value {
  flex: 1;
  font-size: 26rpx;
  color: $text-main;
  line-height: 1.6;
}

.pd__notice-row {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  padding: 18rpx 0;
}

.pd__notice-row + .pd__notice-row {
  border-top: 1rpx solid #f2f3f0;
}

.pd__notice-dot {
  flex-shrink: 0;
  color: $text-sub;
  line-height: 1.6;
}

.pd__notice-text {
  flex: 1;
  font-size: 26rpx;
  color: $text-main;
  line-height: 1.65;
}

.pd__review-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.pd__good {
  font-size: 24rpx;
  color: $green;
}

.pd__reviews {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.pd__review {
  padding: 24rpx;
}

.pd__review-top {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.pd__avatar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  color: #fff;
  font-size: 28rpx;
  font-weight: 700;
}

.pd__review-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.pd__review-user {
  font-size: 26rpx;
  font-weight: 600;
  color: $text-main;
}

.pd__review-date {
  font-size: 21rpx;
  color: $text-sub;
}

.pd__review-text {
  display: block;
  margin-top: 16rpx;
  font-size: 26rpx;
  line-height: 1.7;
  color: $text-main;
}

.pd__review-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 14rpx;
}

.pd__review-tag {
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  background: $green-bg;
  color: $green;
  font-size: 21rpx;
}

.pd__review-likes {
  display: block;
  margin-top: 12rpx;
  font-size: 21rpx;
  color: $text-sub;
}

.pd__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20rpx;
}

.pd__bar {
  position: fixed;
  left: 50%;
  right: auto;
  bottom: 0;
  width: 100%;
  max-width: $app-max-width;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: rgba(251, 251, 249, 0.94);
  border-top: 1rpx solid $line-2;
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
}

.pd__bar-cart {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  font-size: 20rpx;
  color: $text-sub;
  padding: 0 12rpx;
}

.pd__bag-icon {
  position: relative;
  width: 28rpx;
  height: 24rpx;
  border: 2rpx solid currentColor;
  border-radius: 2rpx 2rpx 6rpx 6rpx;
}

.pd__bag-icon::before {
  content: "";
  position: absolute;
  left: 6rpx;
  top: -10rpx;
  width: 12rpx;
  height: 10rpx;
  border: 2rpx solid currentColor;
  border-bottom: none;
  border-radius: 8rpx 8rpx 0 0;
}

.pd__bar-fav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rpx;
  font-size: 20rpx;
  color: $text-sub;
  padding: 0 12rpx;

  &.active {
    color: $yellow;
  }
}

.pd__bar-fav-star {
  font-size: 32rpx;
  line-height: 1.1;
}

.pd__bar-cart-icon {
  width: 40rpx;
  height: 40rpx;
  color: $text-main;
}

.pd__bar-badge {
  position: absolute;
  top: -6rpx;
  right: 0;
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 8rpx;
  border-radius: 16rpx;
  background: #d96a3b;
  color: #fff;
  font-size: 20rpx;
  line-height: 32rpx;
  text-align: center;
}

.pd__bar-add,
.pd__bar-buy {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.pd__bar-add {
  background: $yellow;
  color: $text-main;
}

.pd__bar-buy {
  background: $green;
  color: #f7f3e6;
}

.sku__head {
  display: flex;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.sku__img {
  width: 160rpx;
  height: 160rpx;
  border-radius: $radius-sm;
}

.sku__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 8rpx;
}

.sku__stock {
  font-size: 24rpx;
  color: $text-sub;
}

.sku__label {
  display: block;
  font-size: 26rpx;
  color: $text-sub;
  margin-bottom: 16rpx;
}

.sku__list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.sku__item {
  padding: 12rpx 32rpx;
  border-radius: 32rpx;
  background: $cream;
  font-size: 26rpx;
  color: $text-main;

  &.active {
    background: $green-bg;
    color: $green;
    border: 2rpx solid $green;
  }
}

.sku__qty {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sku__qty .sku__label {
  margin-bottom: 0;
}

.sku__confirm {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: 44rpx;
  background: $green;
  color: #f7f3e6;
  font-size: 30rpx;
  font-weight: 600;
}
.pd__shop-meta {
  display: block;
  margin-top: 8rpx;
  font-size: 23rpx;
  color: $text-sub;
}

.pd__shop-notice {
  display: block;
  margin-top: 12rpx;
  padding: 12rpx 16rpx;
  border-radius: $radius-sm;
  background: $yellow-soft;
  font-size: 23rpx;
  color: $yellow-deep;
  line-height: 1.6;
}

</style>

// #ifdef MP-WEIXIN
onShareAppMessage(() => ({ title: tc(detail.value?.name || "青梅里好物", (detail.value?.nameEn || detail.value?.name) || "Qingmei goods"), path: "/pages/mall/product-detail?id=" + productId.value }));
// #endif
