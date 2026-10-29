<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { ref, computed } from "vue";
import { tc, tr } from "@/utils/i18n";
import { onLoad } from "@dcloudio/uni-app";
import { useRequest } from "@/composables/useRequest";
import { getTravelRouteDetail, getGuideData } from "@/api/travel";
import { getPublicConfigs } from "@/api/common";
import type { GuideSpot, TravelRoute } from "@/types/business";
import { useUserStore } from "@/stores/user";
import { requireLogin, go } from "@/utils/navigation";

import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";
import ContactCard from "@/components/ContactCard.vue";

const routeId = ref("");
const detail = ref<TravelRoute | null>(null);
/** 导览点位由接口下发，用于匹配本路线途经的点位 */
const allSpots = ref<GuideSpot[]>([]);
const userStore = useUserStore();

/** 配图为竖版插画 / 海报时声明为 "contain"，头图整图完整嵌入、不裁切 */
const isPoster = computed(() => detail.value?.imageFit === "contain");

const { loading, error, run } = useRequest(async () => {
  const [routeRes, guideRes] = await Promise.all([
    getTravelRouteDetail(routeId.value),
    getGuideData(),
  ]);
  detail.value = routeRes.data;
  allSpots.value = guideRes.data.spots;
});

onLoad((options) => {
  routeId.value = (options?.id as string) || "";
  run();
});

/** 本路线途经的导览点位，按行程顺序排列，可跳转到景点 / 采摘 / 民宿详情 */
const relatedSpots = computed(() => {
  if (!detail.value) return [];
  const list: GuideSpot[] = [];
  for (const stop of detail.value.itinerary) {
    const name = stop.title.split(" · ")[0];
    const hit = allSpots.value.find(
      (spot) => spot.name === name || spot.name.includes(name) || name.includes(spot.name),
    );
    if (hit && !list.some((x) => x.id === hit.id)) list.push(hit);
  }
  return list;
});

const targetId = computed(() => String(detail.value?.dbId ?? routeId.value));

const isFav = computed(() =>
  userStore.favoriteIds.includes(`fav-route-${targetId.value}`),
);

async function toggleFavorite() {
  if (!detail.value) return;
  if (!userStore.isLogin) {
    requireLogin(`pages/travel/route-detail?id=${routeId.value}`);
    return;
  }
  try {
    const added = await userStore.toggleFavorite({
      id: `fav-route-${targetId.value}`,
      targetId: targetId.value,
      type: "route",
      title: detail.value.title,
      subtitle: detail.value.summary,
      image: detail.value.image,
    });
    uni.showToast({ title: added ? tr("已收藏") : tr("已取消收藏"), icon: "none" });
  } catch {
    // store 已回滚乐观更新，失败原因由请求拦截器统一提示，这里不再重复弹
  }
}

/** 客服电话取自后台「系统配置」contact_phone，不再写死 */
async function onConsult() {
  const config = await getPublicConfigs(["contact_phone"]).catch(() => null);
  const phone = (config?.data?.contact_phone || "").trim();
  if (!phone) {
    uni.showModal({
      title: tr("路线咨询与预约"),
      content: tr("客服电话暂未配置，可在「意见反馈」里留言，我们会尽快联系你。"),
      showCancel: false,
    });
    return;
  }
  uni.showModal({
    title: tr("路线咨询与预约"),
    content:
      tr("拨打客服电话 {phone}？").replace("{phone}", phone) +
      " " +
      tr("研学课堂与果园采摘需提前 1 天锁定场次，可在「采摘预约」里直接选日期与场次。"),
    confirmText: tr("拨打"),
    cancelText: tr("再看看"),
    success: (r) => {
      if (r.confirm) {
        uni.makePhoneCall({
          phoneNumber: phone,
          fail: () => uni.showToast({ title: tr("拨号已取消"), icon: "none" }),
        });
      }
    },
  });
}

function spotPath(id: string, category: string) {
  const map: Record<string, string> = {
    scenic: "pages/travel/scenic-detail",
    picking: "pages/travel/picking-detail",
    homestay: "pages/travel/homestay-detail",
  };
  return map[category] ? `${map[category]}?id=${id}` : "";
}

function onSpot(item: { id: string; category: string }) {
  const path = spotPath(item.id, item.category);
  if (path) go(path);
  else uni.showToast({ title: tr("该点位请在导览图中查看"), icon: "none" });
}
</script>

<template>
  <view class="route-page">
    <NavBar :title="tr('路线详情')" />
    <template v-if="loading">
      <LoadingState :rows="4" />
    </template>
    <template v-else-if="error || !detail">
      <EmptyState :title="tr('加载失败')" :description="error" :action-text="tr('重新加载')" @action="run" />
    </template>
    <template v-else>
      <!-- 头部大图：横版实拍图铺满；竖版插画（imageFit = "contain"）整图完整嵌入，两侧用同图虚化底衬 -->
      <view class="rd__hero">
        <view
          v-if="isPoster"
          class="rd__hero-bg"
          :style="{ backgroundImage: 'url(' + detail.image + ')' }"
        />
        <image
          class="rd__hero-img"
          :src="detail.image"
          :mode="isPoster ? 'aspectFit' : 'aspectFill'"
        />
        <view class="rd__hero-mask" />
        <view class="rd__hero-text">
          <text class="rd__hero-badge">{{ detail.subtitle }}</text>
          <text class="rd__hero-title">{{ tc(detail.title, detail.titleEn) }}</text>
        </view>
      </view>

      <view class="rd__body">
        <text class="rd__summary">{{ tc(detail.summary, detail.summaryEn) }}</text>

        <!-- 关键信息 -->
        <view class="rd__meta card">
          <view class="rd__meta-item">
            <text class="rd__meta-label">{{ tr("建议时长") }}</text>
            <text class="rd__meta-value">{{ detail.duration }}</text>
          </view>
          <view class="rd__meta-item">
            <text class="rd__meta-label">{{ tr("全程距离") }}</text>
            <text class="rd__meta-value">{{ detail.distance }}</text>
          </view>
          <view class="rd__meta-item">
            <text class="rd__meta-label">{{ tr("体力强度") }}</text>
            <text class="rd__meta-value">{{ detail.difficulty }}</text>
          </view>
          <view class="rd__meta-item">
            <text class="rd__meta-label">{{ tr("最佳时段") }}</text>
            <text class="rd__meta-value">{{ detail.bestTime }}</text>
          </view>
        </view>

        <!-- 适合人群 -->
        <view class="rd__section">
          <text class="rd__h">{{ tr("适合谁") }}</text>
          <view class="rd__tags">
            <text v-for="s in detail.suits" :key="s" class="rd__tag">{{ s }}</text>
          </view>
        </view>

        <!-- 路线亮点 -->
        <view class="rd__section">
          <text class="rd__h">{{ tr("路线亮点") }}</text>
          <view class="rd__highlights">
            <view v-for="(h, i) in detail.highlights" :key="h" class="rd__highlight">
              <text class="rd__highlight-no">{{ i + 1 }}</text>
              <text class="rd__highlight-text">{{ h }}</text>
            </view>
          </view>
        </view>

        <!-- 完整行程 -->
        <view class="rd__section">
          <text class="rd__h">{{ tr("完整行程") }}</text>
          <view class="timeline">
            <view v-for="(stop, i) in detail.itinerary" :key="stop.id" class="timeline__item">
              <view class="timeline__rail">
                <text class="timeline__time">{{ stop.time }}</text>
                <view class="timeline__dot" :class="{ 'timeline__dot--last': i === detail.itinerary.length - 1 }" />
              </view>
              <view class="timeline__card card">
                <view class="timeline__figure">
                  <view class="timeline__figure-bg" :style="{ backgroundImage: 'url(' + stop.image + ')' }" />
                  <image class="timeline__img" :src="stop.image" mode="aspectFit" />
                </view>
                <view class="timeline__info">
                  <view class="timeline__head">
                    <text class="timeline__title">{{ stop.title }}</text>
                    <text class="timeline__tag">{{ stop.tag }}</text>
                  </view>
                  <text class="timeline__desc">{{ stop.desc }}</text>
                  <view class="timeline__foot">
                    <text>{{ tr("停留") }} {{ stop.stay }}</text>
                    <text>{{ stop.distance }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 费用包含 -->
        <view class="rd__section">
          <text class="rd__h">{{ tr("费用包含") }}</text>
          <view class="rd__list card">
            <view v-for="item in detail.includes" :key="item" class="rd__list-row">
              <text class="rd__check">✓</text>
              <text class="rd__list-text">{{ item }}</text>
            </view>
          </view>
        </view>

        <!-- 出行提示 -->
        <view class="rd__section">
          <text class="rd__h">{{ tr("出行提示") }}</text>
          <view class="rd__list card">
            <view v-for="tip in detail.tips" :key="tip" class="rd__list-row">
              <text class="rd__bullet">·</text>
              <text class="rd__list-text">{{ tip }}</text>
            </view>
          </view>
        </view>

        <!-- 平台客服电话：可代联商家 -->
        <ContactCard :label="tr('平台客服电话（可代联向导）')" :tip="tr('成团、包团、研学排期与天气顺延可致电平台客服，由客服代为联系带队向导')" />

        <!-- 关联点位 -->
        <view class="rd__section" v-if="relatedSpots.length">
          <text class="rd__h">{{ tr("途经点位") }}</text>
          <view class="rd__spots">
            <view
              v-for="spot in relatedSpots"
              :key="spot.id"
              class="rd__spot card"
              @tap="onSpot(spot)"
            >
              <image class="rd__spot-img" :src="spot.image" mode="aspectFill" />
              <view class="rd__spot-info">
                <text class="rd__spot-name">{{ spot.name }}</text>
                <text class="rd__spot-desc">{{ spot.summary }}</text>
              </view>
              <view class="rd__spot-arrow">
                <text class="rd__spot-arrow-glyph">›</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部操作栏 -->
      <view class="rd__bar">
        <view class="rd__bar-btn" :class="{ 'rd__bar-btn--active': isFav }" @tap="toggleFavorite">
          <text class="rd__bar-glyph">{{ isFav ? "★" : "☆" }}</text>
          <text>{{ tr("收藏") }}</text>
        </view>
        <view class="rd__bar-btn" @tap="go('pages/travel/map')">
          <text class="rd__bar-glyph">◎</text>
          <text>{{ tr("导览图") }}</text>
        </view>
        <view class="rd__bar-main" @tap="onConsult">
          <text>{{ tr("咨询与预约") }}</text>
        </view>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.rd__hero {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.rd__hero-img {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
}

/*
 * 底衬：竖版插画等比放入 16:9 头图后会左右留白，
 * 用同一张图放大虚化铺满，避免出现生硬色块（与行程配图同一套处理方式）。
 */
.rd__hero-bg {
  position: absolute;
  z-index: 0;
  inset: -12%;
  background-size: cover;
  background-position: center;
  filter: blur(18px);
  opacity: 0.7;
}

.rd__hero-mask {
  position: absolute;
  z-index: 2;
  inset: 0;
  background: linear-gradient(180deg, rgba(38, 53, 42, 0.1) 0%, rgba(38, 53, 42, 0.75) 100%);
}

.rd__hero-text {
  position: absolute;
  z-index: 3;
  left: 28rpx;
  right: 28rpx;
  bottom: 28rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.rd__hero-badge {
  align-self: flex-start;
  padding: 6rpx 20rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  font-size: 22rpx;
}

.rd__hero-title {
  font-size: 42rpx;
  font-weight: 800;
  color: #fff;
  line-height: 1.25;
}

.rd__body {
  padding: 24rpx 24rpx calc(160rpx + env(safe-area-inset-bottom));
}

.rd__summary {
  display: block;
  font-size: 28rpx;
  line-height: 1.75;
  color: $text-main;
}

.rd__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24rpx;
  margin-top: 24rpx;
  padding: 28rpx;
}

.rd__meta-item {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.rd__meta-label {
  font-size: 22rpx;
  color: $text-sub;
}

.rd__meta-value {
  font-size: 26rpx;
  font-weight: 600;
  color: $text-main;
  line-height: 1.4;
}

.rd__section {
  margin-top: 36rpx;
}

.rd__h {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  margin-bottom: 18rpx;
}

.rd__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}

.rd__tag {
  padding: 8rpx 22rpx;
  border-radius: 26rpx;
  background: $green-bg;
  color: $green;
  font-size: 24rpx;
}

.rd__highlights {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.rd__highlight {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}

.rd__highlight-no {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40rpx;
  height: 40rpx;
  margin-top: 4rpx;
  border-radius: 50%;
  background: $yellow;
  color: #6b4d16;
  font-size: 22rpx;
  font-weight: 700;
}

.rd__highlight-text {
  flex: 1;
  font-size: 27rpx;
  line-height: 1.65;
  color: $text-main;
}

/* 行程时间轴 */
.timeline {
  position: relative;
}

.timeline__item {
  display: flex;
  gap: 16rpx;
}

.timeline__rail {
  position: relative;
  flex-shrink: 0;
  width: 96rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 24rpx;
}

/* 竖向连线，最后一个节点不画下半段 */
.timeline__rail::after {
  content: "";
  position: absolute;
  top: 24rpx;
  bottom: 0;
  left: 50%;
  width: 2rpx;
  background: rgba(79, 143, 82, 0.25);
  transform: translateX(-50%);
}

.timeline__item:last-child .timeline__rail::after {
  display: none;
}

.timeline__time {
  position: relative;
  z-index: 1;
  font-size: 22rpx;
  font-weight: 700;
  color: $green;
  background: $cream;
  padding: 0 6rpx;
}

.timeline__dot {
  position: relative;
  z-index: 1;
  width: 18rpx;
  height: 18rpx;
  margin-top: 10rpx;
  border-radius: 50%;
  background: $green;
  border: 4rpx solid #fff;
  box-shadow: 0 2rpx 8rpx rgba(38, 53, 42, 0.25);
}

.timeline__card {
  flex: 1;
  /* 允许卡片在窄屏下被压缩，防止内部图片把整页撑宽 */
  min-width: 0;
  margin-bottom: 24rpx;
  padding: 20rpx;
}

/*
 * 行程配图容器：宽度跟随卡片，高度由 3:4 比例推导（height 交给 auto），
 * 因此图片会随网页尺寸等比缩放，不会再出现固定 240px 高度撑破布局的情况。
 */
.timeline__figure {
  position: relative;
  width: 100%;
  height: auto;
  aspect-ratio: 3 / 4;
  border-radius: $radius-sm;
  overflow: hidden;
  margin-bottom: 16rpx;
  background: #eef0ea;
}

/* 底衬：同一张图放大虚化后铺满，填补等比留白，避免出现生硬色块 */
.timeline__figure-bg {
  position: absolute;
  inset: -14%;
  background-size: cover;
  background-position: center;
  filter: blur(18px);
  opacity: 0.55;
}

/* 图片等比完整放入容器：宽度随卡片，高度随容器，永不超出边框 */
.timeline__img {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  height: 100%;
}

.timeline__info {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.timeline__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.timeline__title {
  flex: 1;
  font-size: 29rpx;
  font-weight: 700;
  color: $text-main;
}

.timeline__tag {
  flex-shrink: 0;
  padding: 4rpx 14rpx;
  border-radius: 18rpx;
  background: #fff4e3;
  color: #d96a3b;
  font-size: 20rpx;
}

.timeline__desc {
  font-size: 25rpx;
  line-height: 1.7;
  color: $text-sub;
}

.timeline__foot {
  display: flex;
  justify-content: space-between;
  font-size: 22rpx;
  color: $text-sub;
}

.rd__list {
  padding: 8rpx 24rpx;
}

.rd__list-row {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
  padding: 18rpx 0;
}

.rd__list-row + .rd__list-row {
  border-top: 1rpx solid #f2f3f0;
}

.rd__check {
  flex-shrink: 0;
  color: $green;
  font-size: 26rpx;
  font-weight: 700;
  line-height: 1.6;
}

.rd__bullet {
  flex-shrink: 0;
  color: $text-sub;
  font-size: 26rpx;
  line-height: 1.6;
}

.rd__list-text {
  flex: 1;
  font-size: 26rpx;
  line-height: 1.65;
  color: $text-main;
}

.rd__spots {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.rd__spot {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 18rpx;
}

.rd__spot-img {
  flex-shrink: 0;
  width: 120rpx;
  height: 120rpx;
  border-radius: $radius-sm;
}

.rd__spot-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.rd__spot-name {
  font-size: 28rpx;
  font-weight: 700;
  color: $text-main;
}

.rd__spot-desc {
  font-size: 23rpx;
  color: $text-sub;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.rd__spot-arrow {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36rpx;
  height: 36rpx;
  color: $text-sub;
}

.rd__spot-arrow-glyph {
  font-size: 34rpx;
  line-height: 1;
}

.rd__bar {
  position: fixed;
  z-index: 100;
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

.rd__bar-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  font-size: 22rpx;
  color: $text-sub;
  padding: 0 16rpx;

  &--active {
    color: $yellow-deep;
  }
}

.rd__bar-glyph {
  font-size: 36rpx;
  line-height: 40rpx;
}

.rd__bar-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: $radius-lg;
  background: $green;
  color: #f7f3e6;
  font-size: 30rpx;
  font-weight: 600;
}
</style>
