<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { ref } from "vue";
import { tc, tr } from "@/utils/i18n";
import { onLoad } from "@dcloudio/uni-app";
import { useRequest } from "@/composables/useRequest";
import { getHomestayDetail, getHomestayReviews, type HomestayReview } from "@/api/homestay";
import type { HomestayItem } from "@/types/business";
import { useUserStore } from "@/stores/user";
import { requireLogin, go } from "@/utils/navigation";

import Rating from "@/components/Rating.vue";
import Price from "@/components/Price.vue";
import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";
import ContactCard from "@/components/ContactCard.vue";

const homestayId = ref("");
const detail = ref<HomestayItem | null>(null);
const reviews = ref<HomestayReview[]>([]);
const userStore = useUserStore();

const { loading, error, run } = useRequest(async () => {
  const [res, reviewRes] = await Promise.all([
    getHomestayDetail(homestayId.value),
    getHomestayReviews(homestayId.value).catch(() => null),
  ]);
  detail.value = res.data;
  reviews.value = reviewRes?.data ?? [];
});

onLoad((options) => {
  homestayId.value = (options?.id as string) || "";
  run();
});

const isFav = () => userStore.favoriteIds.includes(`fav-homestay-${homestayId.value}`);

async function toggleFavorite() {
  if (!detail.value) return;
  if (!userStore.isLogin) {
    requireLogin(`pages/travel/homestay-detail?id=${homestayId.value}`);
    return;
  }
  try {
    const added = await userStore.toggleFavorite({
      id: `fav-homestay-${homestayId.value}`,
      targetId: homestayId.value,
      type: "homestay",
      title: detail.value.name,
      subtitle: detail.value.summary,
      image: detail.value.image,
    });
    uni.showToast({ title: added ? tr("已收藏") : tr("已取消收藏"), icon: "none" });
  } catch {
    // store 已回滚乐观更新，失败原因由请求拦截器统一提示，这里不再重复弹
  }
}

/** 房间是否已订满 */
function isRoomFull(remain: number) {
  return remain <= 0;
}

function onBook(roomTypeId: string, remain: number) {
  if (isRoomFull(remain)) {
    uni.showToast({ title: tr("该房型已订满，请选择其他房型"), icon: "none" });
    return;
  }
  go(`pages/order/homestay-order?homestayId=${homestayId.value}&roomTypeId=${roomTypeId}`);
}
</script>

<template>
  <view class="page">
    <NavBar :title="tr('民宿详情')" />
    <template v-if="loading">
      <LoadingState :rows="4" />
    </template>
    <template v-else-if="error || !detail">
      <EmptyState :title="tr('加载失败')" :description="error" :action-text="tr('重新加载')" @action="run" />
    </template>
    <template v-else>
      <image class="hd__hero" :src="detail.image" mode="aspectFill" />

      <view class="hd__body">
        <view class="hd__title-row">
          <text class="hd__name">{{ tc(detail.name, detail.nameEn) }}</text>
          <view class="hd__fav" :class="{ active: isFav() }" @tap="toggleFavorite">
            <text>{{ isFav() ? "★" : "☆" }} {{ tr("收藏") }}</text>
          </view>
        </view>
        <view class="hd__meta">
          <Rating :value="detail.rating" :size="26" />
          <text>{{ detail.rating }} {{ tr("分") }}</text>
          <text class="hd__dot">·</text>
          <text>{{ detail.address }}</text>
        </view>
        <view class="hd__tags">
          <text v-for="t in detail.tags" :key="t" class="hd__tag">{{ t }}</text>
        </view>
        <text class="hd__summary">{{ tc(detail.summary, detail.summaryEn) }}</text>

        <view class="hd__section">
          <text class="hd__h">{{ tr("在线选房") }}</text>
          <view
            v-for="r in detail.roomTypes"
            :key="r.id"
            class="room card"
            :class="{ 'room--full': isRoomFull(r.remain) }"
          >
            <image class="room__img" :src="r.image" mode="aspectFill" />
            <view class="room__info">
              <text class="room__name">{{ r.name }}</text>
              <text class="room__spec">{{ r.bedType }} · {{ tr("可住") }} {{ r.capacity }} {{ tr("人") }} · {{ r.breakfast }}</text>
              <text class="room__remain" :class="{ 'room__remain--full': isRoomFull(r.remain) }">
                {{ isRoomFull(r.remain) ? tr("已订满") : tr("仅剩 {n} 间可订").replace("{n}", String(r.remain)) }}
              </text>
              <view class="room__foot">
                <Price :value="r.price" :size="34" />
                <view
                  class="room__book"
                  :class="{ 'room__book--off': isRoomFull(r.remain) }"
                  @tap="onBook(r.id, r.remain)"
                >
                  {{ isRoomFull(r.remain) ? tr("已订满") : tr("立即预订") }}
                </view>
              </view>
            </view>
          </view>
        </view>

        <view class="hd__section">
          <text class="hd__h">{{ tr("设施与服务") }}</text>
          <view class="hd__facilities">
            <text v-for="f in detail.facilities" :key="f" class="hd__facility">{{ f }}</text>
          </view>
        </view>

        <view class="hd__section">
          <text class="hd__h">{{ tr("预订须知") }}</text>
          <text class="hd__p">{{ tr("各家民宿的入住时间、取消政策与加床规则略有差异，下单前请以订单页的商家说明为准；需要接站、加床或延住可联系平台客服代为确认。") }}</text>
        </view>

        <view class="hd__section">
          <text class="hd__h">{{ tr("住客评价") }}</text>
          <view v-if="reviews.length" class="hd__reviews">
            <view v-for="r in reviews" :key="r.id" class="hd__review card">
              <view class="hd__review-top">
                <view class="hd__avatar">
                  <text>{{ r.user.slice(0, 1) }}</text>
                </view>
                <view class="hd__review-meta">
                  <text class="hd__review-user">{{ r.user }}</text>
                  <text class="hd__review-date">{{ r.date }}</text>
                </view>
                <Rating :value="r.score" :size="24" />
              </view>
              <text class="hd__review-text">{{ r.content }}</text>
            </view>
          </view>
          <text v-else class="hd__p">{{ tr("该民宿还没有真实住客评价，入住后可在「我的订单」里评价。") }}</text>
        </view>

        <!-- 平台客服电话：可代联商家 -->
        <ContactCard :label="tr('平台客服电话（可代联民宿）')" :tip="tr('房态、加床、接站与延住可致电平台客服，由客服代为联系民宿管家')" />
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.hd__hero {
  width: 100%;
  aspect-ratio: 16 / 9;
}

.hd__body {
  padding: 24rpx 24rpx 48rpx;
}

.hd__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hd__name {
  font-size: 40rpx;
  font-weight: 800;
}

.hd__fav {
  font-size: 26rpx;
  color: $text-sub;
  padding: 8rpx 20rpx;
  border-radius: 28rpx;
  background: $cream;

  &.active {
    color: #d96a3b;
  }
}

.hd__meta {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: $brown;
}

.hd__dot {
  color: $text-sub;
}

.hd__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin: 16rpx 0;
}

.hd__tag {
  padding: 6rpx 20rpx;
  border-radius: 24rpx;
  background: #f6edda;
  color: $brown;
  font-size: 24rpx;
}

.hd__summary {
  font-size: 28rpx;
  color: $text-main;
  line-height: 1.7;
}

.hd__section {
  margin-top: 36rpx;
}

.hd__h {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  margin-bottom: 20rpx;
}

.room {
  display: flex;
  gap: 20rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;

  /* 已订满：灰化，预订按钮置灰 */
  &--full {
    opacity: 0.65;
  }
}

.room__img {
  width: 200rpx;
  height: 200rpx;
  border-radius: $radius-sm;
  flex-shrink: 0;
}

.room__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.room__name {
  font-size: 28rpx;
  font-weight: 700;
}

.room__spec {
  font-size: 22rpx;
  color: $text-sub;
}

.room__remain {
  font-size: 22rpx;
  color: $green;

  &--full {
    color: $danger;
  }
}

.room__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.room__book {
  padding: 12rpx 32rpx;
  border-radius: 32rpx;
  background: $green;
  color: #f7f3e6;
  font-size: 26rpx;

  &--off {
    background: #ccd2cb;
  }
}

.hd__facilities {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.hd__facility {
  padding: 10rpx 24rpx;
  border-radius: 28rpx;
  background: $green-bg;
  color: $green;
  font-size: 24rpx;
}

.hd__p {
  font-size: 26rpx;
  color: $text-sub;
  line-height: 1.7;
}

.hd__reviews {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.hd__review {
  padding: 24rpx;
}

.hd__review-top {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 14rpx;
}

.hd__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: $green-bg;
  color: $green;
  font-size: 28rpx;
  font-weight: 600;
  flex-shrink: 0;
}

.hd__review-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.hd__review-user {
  font-size: 26rpx;
  font-weight: 600;
}

.hd__review-date {
  font-size: 22rpx;
  color: $text-sub;
}

.hd__review-text {
  display: block;
  font-size: 26rpx;
  line-height: 1.7;
  color: $text-main;
}
</style>
