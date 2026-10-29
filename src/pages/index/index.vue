<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { i18n, tr, tc } from "@/utils/i18n";
import { useTravelStore } from "@/stores/travel";
import { useAppStore } from "@/stores/app";
import { onShareAppMessage } from "@dcloudio/uni-app";
import { useRequest } from "@/composables/useRequest";
import { getProductList } from "@/api/product";
import { getHomeConfig, resolveBannerPath, type HomeBanner, type HomeConfig } from "@/api/home";
import { getNotices, NOTICE_CATEGORY_LABEL, type NoticeItem } from "@/api/notice";
import type { ProductItem } from "@/types/business";
import { go } from "@/utils/navigation";
import { FALLBACK_IMAGE } from "@/utils/backend";

import AppTabBar from "@/components/AppTabBar.vue";
import SearchBar from "@/components/SearchBar.vue";
import SectionTitle from "@/components/SectionTitle.vue";
import RouteCard from "@/components/RouteCard.vue";
import PickingCard from "@/components/PickingCard.vue";
import HomestayCard from "@/components/HomestayCard.vue";
import ProductCard from "@/components/ProductCard.vue";
import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";

const travelStore = useTravelStore();
const appStore = useAppStore();
const products = ref<ProductItem[]>([]);
const notices = ref<NoticeItem[]>([]);

/** 首页内容配置全部由接口下发，页面只负责渲染 */
const home = ref<HomeConfig>({
  heroImage: "",
  features: [],
  sections: {
    routes: { title: "", subtitle: "", more: "" },
    picking: { title: "", subtitle: "", more: "" },
    homestay: { title: "", subtitle: "", more: "" },
    season: { title: "", subtitle: "", more: "" },
    product: { title: "", subtitle: "", more: "" },
  },
  season: { image: "", title: "", desc: "", path: "" },
  aiEntry: { title: "", desc: "", path: "" },
});

const banners = computed(() => home.value.banners ?? []);
const guides = computed(() => home.value.guides ?? []);
const heroImage = computed(() => home.value.heroImage || FALLBACK_IMAGE);

const topNotice = computed(() => notices.value[0]);
const noticeCategory = computed(
  () => tr(NOTICE_CATEGORY_LABEL[topNotice.value?.category ?? ""] ?? "村务提醒"),
);

/* 小程序不渲染内联 <svg>，图标一律走 data URI 的 <image> */
const ICON_LEAF =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQzhERTg0IiBzdHJva2Utd2lkdGg9IjEuNiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMjBjLTQuNCAwLTgtMy42LTgtOCA0LjQgMCA4IDMuNiA4IDh6Ii8+PHBhdGggZD0iTTEyIDIwYzAtNC40IDMuNi04IDgtOCAwIDQuNC0zLjYgOC04IDh6Ii8+PHBhdGggZD0iTTEyIDIwVjkiLz48L3N2Zz4=";
const ICON_PERSON =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjgiIHI9IjQiLz48cGF0aCBkPSJNNCAyMWMwLTQgMy42LTYgOC02czggMiA4IDYiLz48L3N2Zz4=";

/** 四个入口图标按跳转路径取，后台换顺序也不会串图 */
const FEATURE_ICONS: Record<string, string> = {
  "pages/travel/map":
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMkY1RDQzIiBzdHJva2Utd2lkdGg9IjEuNiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMjFhOSA5IDAgMSAwIDAtMTggOSA5IDAgMCAwIDAgMTh6TTE1LjUgOWwtMiA0LTQgMiAyLTQgNC0yeiIvPjwvc3ZnPg==",
  "pages/travel/picking":
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMkY1RDQzIiBzdHJva2Utd2lkdGg9IjEuNiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNNCAyMGMwLTkgNC0xNSAxNC0xNSAwIDktNCAxNS0xNCAxNXpNNCAyMGMzLTYgNy0xMSAxMi0xNCIvPjwvc3ZnPg==",
  "pages/travel/homestay":
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMkY1RDQzIiBzdHJva2Utd2lkdGg9IjEuNiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMyAxMC41TDEyIDNsOSA3LjVWMjFoLTZ2LTZIOXY2SDN6Ii8+PC9zdmc+",
  "pages/mall/index":
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMkY1RDQzIiBzdHJva2Utd2lkdGg9IjEuNiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNNiA3aDEybDEuMiAxM0g0LjhMNiA3ek05IDdhMyAzIDAgMCAxIDYgMCIvPjwvc3ZnPg==",
};
const iconOf = (path: string) => FEATURE_ICONS[path] ?? FEATURE_ICONS["pages/travel/map"];

function onBanner(b: HomeBanner) {
  const path = resolveBannerPath(b);
  if (!path) return;
  if (/^https?:\/\//i.test(path)) {
    // #ifdef H5
    window.open(path, "_blank");
    // #endif
    // #ifndef H5
    uni.setClipboardData({ data: path });
    // #endif
    return;
  }
  go(path);
}

const { loading, error, run } = useRequest(async () => {
  const [prodRes, , homeRes, noticeRes] = await Promise.all([
    getProductList(),
    travelStore.fetchAll(),
    getHomeConfig(),
    getNotices(3),
  ]);
  products.value = prodRes.data;
  home.value = homeRes.data;
  notices.value = noticeRes.data ?? [];
});

onMounted(run);

/* ===== 推荐路线：原生 swiper，小程序里手指也能滑 ===== */
const activeRoute = ref(0);
const routeCount = computed(() => travelStore.routeList.length);

function onRouteChange(e: any) {
  activeRoute.value = Number(e.detail?.current ?? 0);
}

function slideRoute(delta: number) {
  const n = routeCount.value;
  if (n < 2) return;
  activeRoute.value = (activeRoute.value + delta + n) % n;
}

function goRoute(i: number) {
  activeRoute.value = i;
}
</script>

<template>
  <view class="home">
    <!-- 头图：整幅实拍 + 压暗，标题压在照片上 -->
    <view class="hero">
      <image class="hero__bg" :src="heroImage" mode="aspectFill" />
      <view class="hero__veil" />

      <view class="hero__content" :style="{ paddingTop: appStore.safeAreaTop + 12 + 'px' }">
        <view class="hero__top">
          <view class="hero__wordmark">
            <image class="hero__mark" :src="ICON_LEAF" mode="aspectFit" />
            <text class="hero__brandname">{{ tr("青梅里") }}</text>
          </view>
          <view class="hero__icon press" @tap="go('pages/user/index')">
            <image class="hero__icon-img" :src="ICON_PERSON" mode="aspectFit" />
          </view>
        </view>

        <view class="hero__spacer" />

        <view class="hero__copy">
          <view class="hero__city">
            <text class="hero__city-text">{{ i18n.lang === "en" ? tr(appStore.city) : appStore.city + " · 䢺江畔" }}</text>
            <view class="hero__city-rule" />
            <text class="hero__city-en">QINGMEI VALLEY</text>
          </view>
          <text class="hero__title">{{ tr("山野有时，") }}</text>
          <text class="hero__title">{{ tr("青梅正好。") }}</text>
          <text class="hero__slogan">{{ tr("住乡野 · 吃在地好物 · 把日子过慢一点") }}</text>
        </view>
      </view>
    </view>

    <view class="home__search">
      <SearchBar :placeholder="tr('搜索目的地 / 景点 / 青梅好物')" @select="go('pages/mall/search')" />
    </view>

    <view class="home__body">
      <template v-if="loading">
        <LoadingState :rows="3" />
      </template>
      <template v-else-if="error">
        <EmptyState :title="tr('加载失败')" :description="error" :action-text="tr('重新加载')" @action="run" />
      </template>
      <template v-else>
        <swiper
          v-if="banners.length"
          class="banners"
          circular
          autoplay
          :interval="4200"
          :duration="420"
          :indicator-dots="banners.length > 1"
          indicator-color="rgba(255, 255, 255, 0.36)"
          indicator-active-color="rgba(255, 255, 255, 0.95)"
        >
          <swiper-item v-for="b in banners" :key="b.id" @tap="onBanner(b)">
            <view class="banners__item">
              <image class="banners__img" :src="b.image || FALLBACK_IMAGE" mode="aspectFill" />
              <view class="banners__mask" />
              <text class="banners__title">{{ tc(b.title, b.titleEn) }}</text>
            </view>
          </swiper-item>
        </swiper>

        <view class="features">
          <view v-for="f in home.features" :key="f.title" class="features__item" @tap="go(f.path)">
            <view class="features__icon-wrap">
              <image class="features__icon" :src="iconOf(f.path)" mode="aspectFit" />
            </view>
            <text class="features__title">{{ f.title }}</text>
          </view>
        </view>

        <!-- 公告：后台「内容管理-公告」置顶优先 -->
        <view v-if="topNotice" class="bulletin press" @tap="go('pages/notice/index')">
          <view class="bulletin__top">
            <view class="bulletin__tags">
              <text v-if="topNotice.pinned" class="bulletin__pin">{{ tr("置顶") }}</text>
              <text class="bulletin__tag">{{ noticeCategory }}</text>
            </view>
            <text class="bulletin__time">{{ topNotice.publishTime }}</text>
          </view>
          <text class="bulletin__title">{{ tc(topNotice.title, topNotice.titleEn) }}</text>
          <text class="bulletin__summary">{{ tc(topNotice.summary, topNotice.summaryEn) }}</text>
          <view class="bulletin__foot">
            <view class="bulletin__read">
              <view v-if="topNotice.read === false" class="bulletin__dot" />
              <text>{{ tr("查看全部公告") }}</text>
            </view>
            <text class="bulletin__arrow">›</text>
          </view>
        </view>

        <SectionTitle
          :title="home.sections.routes.title"
          :subtitle="home.sections.routes.subtitle"
          show-more
          @more="go(home.sections.routes.more)"
        />
        <view v-if="routeCount" class="routes">
          <swiper
            class="routes__swiper"
            circular
            :current="activeRoute"
            :duration="420"
            @change="onRouteChange"
          >
            <swiper-item v-for="r in travelStore.routeList" :key="r.id">
              <view class="routes__slide">
                <RouteCard :item="r" compact @click="go('pages/travel/route-detail?id=' + r.id)" />
              </view>
            </swiper-item>
          </swiper>
          <view v-if="routeCount > 1" class="routes__nav">
            <view class="routes__arrow press" @tap="slideRoute(-1)"><text>‹</text></view>
            <view class="routes__dots">
              <view
                v-for="(r, i) in travelStore.routeList"
                :key="r.id"
                class="routes__dot"
                :class="{ 'routes__dot--on': i === activeRoute }"
                @tap="goRoute(i)"
              />
            </view>
            <view class="routes__arrow press" @tap="slideRoute(1)"><text>›</text></view>
          </view>
        </view>

        <SectionTitle
          :title="tr('山野住与玩')"
          :subtitle="tr('摘一篮青梅，住一晚山居')"
          show-more
          @more="go(home.sections.homestay.more)"
        />
        <view class="rail-grid">
          <view
            v-for="p in travelStore.pickingList.slice(0, 2)"
            :key="'p' + p.id"
            class="rail-grid__item"
          >
            <PickingCard :item="p" @click="go('pages/travel/picking-detail?id=' + p.id)" />
          </view>
          <view
            v-for="h in travelStore.homestayList.slice(0, 1)"
            :key="'h' + h.id"
            class="rail-grid__item"
          >
            <HomestayCard :item="h" @click="go('pages/travel/homestay-detail?id=' + h.id)" />
          </view>
        </view>

        <SectionTitle
          :title="home.sections.product.title"
          :subtitle="home.sections.product.subtitle"
          show-more
          @more="go(home.sections.product.more)"
        />
        <view class="products">
          <view class="products__item" v-for="p in products.slice(0, 4)" :key="p.id">
            <ProductCard
              :item="p"
              @click="go('pages/mall/product-detail?id=' + p.id)"
              @add="go('pages/mall/product-detail?id=' + p.id)"
            />
          </view>
        </view>

        <view class="more-goods press" @tap="go(home.sections.product.more)">
          <text>{{ tr("全部好物") }}</text>
          <text class="more-goods__arrow">›</text>
        </view>

        <view class="ai-entry press" @tap="go(home.aiEntry.path)">
          <view class="ai-entry__icon">
            <image class="ai-entry__spark-img" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQzhERTg0IiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjEgMTEuNWE4LjQgOC40IDAgMCAxLTExLjkgNy42TDMgMjFsMS45LTZBOC40IDguNCAwIDEgMSAyMSAxMS41eiIvPjwvc3ZnPg==" mode="aspectFit" />
          </view>
          <view class="ai-entry__text">
            <text class="ai-entry__eyebrow">在线咨询</text>
            <text class="ai-entry__title">{{ home.aiEntry.title.replace("AI ", "") }}</text>
            <text class="ai-entry__desc">{{ home.aiEntry.desc }}</text>
          </view>
          <text class="ai-entry__arrow">›</text>
        </view>
      </template>
    </view>

    <AppTabBar current="index" />
  </view>
</template>

<style lang="scss" scoped>
.home {
  min-height: 100vh;
}

/* ---------- 头图 ---------- */
.hero {
  position: relative;
  width: 100%;
  height: 460rpx;
  overflow: hidden;
  border-radius: 0 0 44rpx 44rpx;
  background: $ink;
}

.hero__bg {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.hero__veil {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(
    180deg,
    rgba(10, 12, 12, 0.34) 0%,
    rgba(10, 12, 12, 0) 28%,
    rgba(10, 12, 12, 0.08) 52%,
    rgba(10, 12, 12, 0.66) 100%
  );
}

.hero__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 40rpx 44rpx;
}

.hero__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hero__wordmark {
  display: flex;
  align-items: center;
  gap: 12rpx;
  height: 56rpx;
}

.hero__mark {
  width: 36rpx;
  height: 36rpx;
}

.hero__brandname {
  font-size: 23rpx;
  font-weight: 600;
  letter-spacing: 0.2em;
  color: rgba(255, 255, 255, 0.94);
}

.hero__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  border: 1rpx solid rgba(255, 255, 255, 0.32);
}

.hero__icon-img {
  width: 38rpx;
  height: 38rpx;
}

.hero__spacer {
  flex: 1;
}

.hero__copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.hero__city {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 22rpx;
  color: rgba(255, 255, 255, 0.9);
}

.hero__city-text {
  font-size: 18rpx;
  letter-spacing: 0.16em;
}

.hero__city-rule {
  width: 28rpx;
  height: 1rpx;
  background: rgba(255, 255, 255, 0.34);
}

.hero__city-en {
  font-size: 15rpx;
  letter-spacing: 0.26em;
  color: rgba(255, 255, 255, 0.46);
}

.hero__title {
  font-family: $font-serif;
  font-size: 64rpx;
  font-weight: 500;
  color: #fff;
  letter-spacing: 0.04em;
  line-height: 1.5;
}

.hero__slogan {
  margin-top: 18rpx;
  font-size: 21rpx;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.78);
}

/* ---------- 搜索与正文 ---------- */
.home__search {
  position: relative;
  z-index: 2;
  margin: 28rpx 40rpx 0;
}

.home__body {
  padding: 24rpx 40rpx calc(150rpx + env(safe-area-inset-bottom));
}

/* ---------- 轮播 ---------- */
.banners {
  height: 220rpx;
  margin-top: 26rpx;
  border-radius: 26rpx;
  overflow: hidden;
  border: 1rpx solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 24rpx 60rpx -34rpx rgba(16, 36, 26, 0.5);
}

.banners__item {
  position: relative;
  width: 100%;
  height: 100%;
}

.banners__img {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.banners__mask {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(180deg, rgba(8, 18, 12, 0.02) 34%, rgba(8, 18, 12, 0.72) 100%);
}

.banners__title {
  position: absolute;
  left: 26rpx;
  right: 26rpx;
  bottom: 24rpx;
  color: #fff;
  font-size: 27rpx;
  font-weight: 600;
  letter-spacing: 0.02em;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-shadow: 0 2rpx 16rpx rgba(8, 18, 12, 0.5);
}

/* ---------- 四个入口 ---------- */
.features {
  display: flex;
  flex-direction: row;
  margin-top: 30rpx;
  padding: 26rpx 10rpx;
  border-radius: 30rpx;
  background: $glass-1;
  border: 1rpx solid $glass-edge;
  box-shadow: $glass-shadow;
  backdrop-filter: blur(20px) saturate(170%);
  -webkit-backdrop-filter: blur(20px) saturate(170%);
}

.features__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 8rpx 0;
  transition: opacity 0.16s $ease;
}

.features__item:active {
  opacity: 0.55;
}

.features__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76rpx;
  height: 76rpx;
  border-radius: 50%;
  border: 1rpx solid $line-strong;
}

.features__icon {
  width: 36rpx;
  height: 36rpx;
}

.features__title {
  font-size: 22rpx;
  font-weight: 400;
  color: $text-sub;
  line-height: 1.3;
}


/* ---------- 公告 ---------- */
.bulletin {
  position: relative;
  margin-top: 26rpx;
  padding: 26rpx 26rpx 22rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  border-radius: 30rpx;
  background: $glass-2;
  border: 1rpx solid $glass-edge-soft;
  box-shadow: 0 20rpx 54rpx -36rpx rgba(16, 36, 26, 0.42), inset 0 2rpx 0 rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
}

.bulletin__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.bulletin__tags {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.bulletin__pin {
  padding: 2rpx 10rpx;
  border-radius: 4rpx;
  background: $ink;
  color: $lime;
  font-size: 17rpx;
  font-weight: 600;
}

.bulletin__tag {
  color: $green;
  font-size: 19rpx;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.bulletin__time {
  font-size: 19rpx;
  color: $text-mute;
}

.bulletin__title {
  margin-top: 2rpx;
  font-size: 33rpx;
  line-height: 1.38;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: $text-main;
}

.bulletin__summary {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  font-size: 23rpx;
  line-height: 1.65;
  color: $text-sub;
}

.bulletin__foot {
  margin-top: 4rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bulletin__read {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 19rpx;
  color: $text-mute;
}

.bulletin__dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: $price;
}

.bulletin__arrow {
  font-size: 32rpx;
  color: $text-mute;
}

/* ---------- 路线轮播 ---------- */
.routes {
  margin: 0 -40rpx;
}

.routes__swiper {
  height: 680rpx;
}

.routes__slide {
  display: flex;
  padding: 2rpx 40rpx 10rpx;
  height: 100%;
}

.routes__nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  margin-top: 22rpx;
}

.routes__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  border: 1rpx solid $line-strong;
  color: $ink;
  font-size: 34rpx;
  line-height: 1;
}

.routes__dots {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.routes__dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: rgba(24, 39, 29, 0.16);
  transition: width 0.28s $ease, background 0.28s $ease;
}

.routes__dot--on {
  width: 32rpx;
  border-radius: 8rpx;
  background: $green;
}

/* ---------- 列表 ---------- */
.stack {
  display: flex;
  flex-direction: column;
}

.stack > * + * {
  border-top: 1rpx solid $line;
}

/* ---------- 季节 ---------- */
.season {
  position: relative;
  height: 420rpx;
  border-radius: 12rpx;
  overflow: hidden;
}

.season__img {
  width: 100%;
  height: 100%;
}

.season__mask {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(180deg, rgba(8, 18, 12, 0.02) 28%, rgba(8, 18, 12, 0.82) 100%);
}

.season__text {
  position: absolute;
  left: 32rpx;
  bottom: 30rpx;
  right: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.season__eyebrow {
  align-self: flex-start;
  margin-bottom: 2rpx;
  font-size: 18rpx;
  font-weight: 600;
  letter-spacing: 0.2em;
  color: $lime;
}

.season__title {
  font-size: 42rpx;
  line-height: 1.22;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #fff;
}

.season__desc {
  font-size: 23rpx;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.78);
  text-shadow: 0 2rpx 10rpx rgba(8, 18, 12, 0.45);
}

/* ---------- 攻略 ---------- */
.guides {
  margin: 0 -40rpx;
  white-space: nowrap;
}

.guides__inner {
  display: inline-flex;
  align-items: flex-start;
  padding: 2rpx 40rpx 6rpx;
}

.guides__item {
  display: inline-flex;
  flex-direction: column;
  gap: 10rpx;
  width: 300rpx;
  margin-right: 22rpx;
  white-space: normal;
  transition: transform 0.16s $ease;
}

.guides__item:active {
  transform: scale(0.985);
}

.guides__img {
  width: 300rpx;
  height: 188rpx;
  border-radius: 14rpx;
  background: $img-bg;
}

.guides__title {
  font-size: 25rpx;
  font-weight: 600;
  color: $text-main;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.guides__meta {
  font-size: 19rpx;
  color: $text-mute;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* ---------- 商品 ---------- */
.products {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 32rpx 22rpx;
}


/* ---------- 山野住与玩：固定三列紧凑网格 ---------- */
.rail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16rpx;
}

.rail-grid__item {
  min-width: 0;
}

/* 窄卡：收起长简介与标签，字号下调，保证三列不挤压 */
.rail-grid__item :deep(.picking__summary),
.rail-grid__item :deep(.homestay__summary),
.rail-grid__item :deep(.homestay__tags),
.rail-grid__item :deep(.picking__meta),
.rail-grid__item :deep(.homestay__meta) {
  display: none;
}

.rail-grid__item :deep(.picking),
.rail-grid__item :deep(.homestay) {
  padding: 10rpx 10rpx 14rpx;
  border-radius: 20rpx;
}

.rail-grid__item :deep(.picking__img),
.rail-grid__item :deep(.homestay__img) {
  margin-bottom: 12rpx;
  border-radius: 14rpx;
}

.rail-grid__item :deep(.picking__info),
.rail-grid__item :deep(.homestay__info) {
  gap: 4rpx;
}

.rail-grid__item :deep(.picking__name),
.rail-grid__item :deep(.homestay__name) {
  font-size: 24rpx;
  line-height: 1.3;
}

.rail-grid__item :deep(.picking__from),
.rail-grid__item :deep(.homestay__night) {
  font-size: 22rpx;
}

/* ---------- 全部好物 ---------- */
.more-goods {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  margin-top: 36rpx;
  padding: 26rpx 0;
  border-top: 1rpx solid $line;
  border-bottom: 1rpx solid $line;
  font-size: 22rpx;
  letter-spacing: 0.08em;
  color: $text-sub;
}

.more-goods__arrow {
  font-size: 24rpx;
  color: $text-mute;
}

/* ---------- AI ---------- */
.ai-entry {
  display: flex;
  align-items: center;
  gap: 22rpx;
  margin-top: 56rpx;
  padding: 34rpx 30rpx;
  border-radius: 32rpx;
  color: #fff;
  background: $glass-dark;
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 34rpx 76rpx -34rpx rgba(8, 18, 12, 0.65), inset 0 2rpx 0 rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
}

.ai-entry__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 56rpx;
  height: 56rpx;
}

.ai-entry__spark {
  font-size: 40rpx;
  line-height: 1;
  color: $lime;
}

.ai-entry__spark-img {
  width: 40rpx;
  height: 40rpx;
}

.ai-entry__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rpx;
  min-width: 0;
}

.ai-entry__eyebrow {
  font-size: 17rpx;
  font-weight: 600;
  letter-spacing: 0.22em;
  color: rgba(200, 222, 132, 0.7);
}

.ai-entry__title {
  font-size: 30rpx;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.ai-entry__desc {
  font-size: 21rpx;
  color: rgba(255, 255, 255, 0.62);
}

.ai-entry__arrow {
  flex-shrink: 0;
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.6);
}
</style>

// #ifdef MP-WEIXIN
onShareAppMessage(() => ({ title: tr("青梅里 · 发现一场山野旅行"), path: "/pages/index/index" }));
// #endif
