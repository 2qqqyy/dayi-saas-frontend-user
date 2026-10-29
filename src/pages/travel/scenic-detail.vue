<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { ref, computed } from "vue";
import { tc, tr, i18n } from "@/utils/i18n";
import { onLoad, onShareAppMessage } from "@dcloudio/uni-app";
import { useRequest } from "@/composables/useRequest";
import { getScenicDetail } from "@/api/travel";
import { getPublicConfigs } from "@/api/common";
import type { ScenicItem } from "@/types/business";
import { useUserStore } from "@/stores/user";
import { useTravelStore } from "@/stores/travel";
import { requireLogin } from "@/utils/navigation";
import { pushFootprint } from "@/utils/footprint";

import Rating from "@/components/Rating.vue";
import AudioPlayer from "@/components/AudioPlayer.vue";
import ScenicCard from "@/components/ScenicCard.vue";
import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";
import { go } from "@/utils/navigation";

const scenicId = ref("");
const detail = ref<ScenicItem | null>(null);
const userStore = useUserStore();
const travelStore = useTravelStore();

const { loading, error, run } = useRequest(async () => {
  const res = await getScenicDetail(scenicId.value);
  detail.value = res.data;
  if (res.data) {
    pushFootprint({ type: "scenic", id: String(res.data.id), name: res.data.name, nameEn: res.data.nameEn, image: res.data.image });
  }
  travelStore.fetchAll();
});

onLoad((options) => {
  scenicId.value = (options?.id as string) || "";
  run();
});

/** 对外 id 可能是 scenic-1 这类编码，收藏表和地图都要用数字主键 */
const targetId = computed(() => String(detail.value?.dbId ?? scenicId.value));

/** 讲解音频与文稿按当前语言取，英文缺失时回退中文 */
const audioSrc = computed(() => {
  const d = detail.value;
  if (!d) return "";
  return i18n.lang === "en" ? d.audioUrlEn || d.audioUrl : d.audioUrl;
});
const audioScript = computed(() => {
  const d = detail.value;
  if (!d) return "";
  return i18n.lang === "en" ? d.audioTextEn || d.audioText || "" : d.audioText || "";
});

const isFav = () => userStore.favoriteIds.includes(`fav-scenic-${targetId.value}`);

const nearby = computed(() => {
  const current = detail.value;
  if (!current) return [];
  return travelStore.scenicList.filter((x) => x.id !== current.id).slice(0, 2);
});

async function toggleFavorite() {
  if (!detail.value) return;
  if (!userStore.isLogin) {
    requireLogin(`pages/travel/scenic-detail?id=${scenicId.value}`);
    return;
  }
  try {
    const added = await userStore.toggleFavorite({
      id: `fav-scenic-${targetId.value}`,
      targetId: targetId.value,
      type: "scenic",
      title: detail.value.name,
      subtitle: detail.value.summary,
      image: detail.value.image,
    });
    uni.showToast({ title: added ? tr("已收藏") : tr("已取消收藏"), icon: "none" });
  } catch {
    // store 已回滚乐观更新，失败原因由请求拦截器统一提示，这里不再重复弹
  }
}

/** 有坐标走系统地图导航，没坐标退化为复制地址 */
function onNavigate() {
  const lat = Number(detail.value?.lat ?? 0);
  const lng = Number(detail.value?.lng ?? 0);
  if (!lat || !lng) {
    uni.showModal({
      title: tr("暂未配置坐标"),
      content: detail.value?.location || tr("该景点还没有配置坐标"),
      showCancel: false,
    });
    return;
  }
  uni.openLocation({
    latitude: lat,
    longitude: lng,
    name: detail.value?.name ?? "",
    address: detail.value?.location ?? "",
    fail: () => uni.showToast({ title: tr("当前环境不支持打开地图"), icon: "none" }),
  });
}

/** 咨询电话取自后台「景点管理」，未配置时回落平台客服电话 */
async function onConsult() {
  const phone = (detail.value?.phone || "").trim();
  if (phone) {
    uni.makePhoneCall({
      phoneNumber: phone,
      fail: () => uni.showToast({ title: tr("拨号已取消"), icon: "none" }),
    });
    return;
  }
  const config = await getPublicConfigs(["contact_phone"]).catch(() => null);
  const fallback = (config?.data?.contact_phone || "").trim();
  if (!fallback) {
    uni.showModal({ title: tr("暂无咨询电话"), content: tr("可留言给客服，或在「意见反馈」里描述你的问题"), showCancel: false });
    return;
  }
  uni.showModal({
    title: tr("该景点未留电话"),
    content: tr("拨打平台客服电话 {phone}？").replace("{phone}", fallback),
    confirmText: tr("拨打"),
    success: (r) => {
      if (r.confirm) uni.makePhoneCall({ phoneNumber: fallback });
    },
  });
}
</script>

<template>
  <view class="detail">
    <NavBar :title="tr('景点详情')" />
    <template v-if="loading">
      <LoadingState :rows="4" />
    </template>
    <template v-else-if="error || !detail">
      <EmptyState :title="tr('加载失败')" :description="error" :action-text="tr('重新加载')" @action="run" />
    </template>
    <template v-else>
      <image class="detail__hero" :src="detail.image" mode="aspectFill" />

      <view class="detail__body">
        <view class="detail__title-row">
          <text class="detail__name">{{ tc(detail.name, detail.nameEn) }}</text>
          <view class="detail__rating">
            <Rating :value="detail.rating" :size="26" />
            <text>{{ detail.rating }}</text>
          </view>
        </view>

        <view class="detail__tags">
          <text v-for="t in detail.tags" :key="t" class="detail__tag">{{ t }}</text>
        </view>

        <view class="detail__section">
          <text class="detail__h">{{ tr("景点介绍") }}</text>
          <text class="detail__p">{{ tc(detail.summary, detail.summaryEn) }}</text>
        </view>

        <view class="detail__info card">
          <view class="detail__info-item">
            <text class="detail__label">{{ tr("开放时间") }}</text>
            <text class="detail__value">{{ detail.openTime }}</text>
          </view>
          <view class="detail__info-item">
            <text class="detail__label">{{ tr("地址") }}</text>
            <text class="detail__value">{{ detail.location }}</text>
          </view>
          <view v-if="detail.phone" class="detail__info-item">
            <text class="detail__label">{{ tr("咨询电话") }}</text>
            <text class="detail__value">{{ detail.phone }}</text>
          </view>
        </view>

        <view v-if="detail.intro" class="detail__section">
          <text class="detail__h">{{ tr("详细介绍") }}</text>
          <text class="detail__p">{{ detail.intro }}</text>
        </view>

        <view v-if="audioSrc" class="detail__section">
          <text class="detail__h">{{ tr("语音讲解") }}</text>
          <AudioPlayer :src="audioSrc" :title="tc(detail.name + ' 讲解', (detail.nameEn || detail.name) + ' audio guide')" />
          <text v-if="audioScript" class="detail__audio-script">{{ audioScript }}</text>
        </view>

        <view class="detail__section">
          <text class="detail__h">{{ tr("附近推荐") }}</text>
          <view class="detail__nearby">
            <ScenicCard
              v-for="s in nearby"
              :key="s.id"
              :item="s"
              @click="go('pages/travel/scenic-detail?id=' + s.id)"
            />
          </view>
        </view>
      </view>

      <!-- 底部操作栏 -->
      <view class="detail__bar">
        <view class="detail__bar-btn" :class="{ 'detail__bar-btn--active': isFav() }" @tap="toggleFavorite">
          <text>{{ isFav() ? "★" : "☆" }}</text>
          <text>{{ tr("收藏") }}</text>
        </view>
        <view class="detail__bar-btn" @tap="onNavigate">
          <text>◎</text>
          <text>{{ tr("导航") }}</text>
        </view>
        <view class="detail__bar-btn" @tap="onConsult">
          <text>☎</text>
          <text>{{ tr("咨询") }}</text>
        </view>
        <view class="detail__bar-main" @tap="go('pages/travel/map')">
          <text>{{ tr("查看更多点位") }}</text>
        </view>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.detail {
  min-height: 100vh;
}

.detail__hero {
  width: 100%;
  aspect-ratio: 16 / 9;
}

.detail__body {
  padding: 24rpx 24rpx calc(160rpx + env(safe-area-inset-bottom));
}

.detail__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.detail__name {
  font-size: 40rpx;
  font-weight: 800;
}

.detail__rating {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 26rpx;
  color: $brown;
}

.detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin: 16rpx 0 24rpx;
}

.detail__tag {
  padding: 6rpx 20rpx;
  border-radius: 24rpx;
  background: $green-bg;
  color: $green;
  font-size: 24rpx;
}

.detail__section {
  margin-top: 32rpx;
}

.detail__h {
  font-size: 32rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
  display: block;
}

.detail__p {
  font-size: 28rpx;
  color: $text-main;
  line-height: 1.7;
}

/* 讲解文稿：听不清或不便外放时照着看 */
.detail__audio-script {
  display: block;
  margin-top: 16rpx;
  padding: 20rpx 24rpx;
  border-radius: $radius-md;
  background: $green-soft;
  font-size: 25rpx;
  color: $text-sub;
  line-height: 1.75;
}

.detail__info {
  margin-top: 24rpx;
  padding: 24rpx;
}

.detail__info-item {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
}

.detail__label {
  font-size: 26rpx;
  color: $text-sub;
}

.detail__value {
  font-size: 26rpx;
  color: $text-main;
}

.detail__nearby {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.detail__bar {
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
  background: #fff;
  border-top: 1rpx solid #f0f1ee;
}

.detail__bar-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  font-size: 22rpx;
  color: $text-sub;
  padding: 0 16rpx;

  &--active {
    color: $yellow;
  }
}

.detail__bar-main {
  flex: 1;
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
</style>

// #ifdef MP-WEIXIN
onShareAppMessage(() => ({ title: tc(detail.value?.name || "青梅里", (detail.value?.nameEn || detail.value?.name) || "Qingmei"), path: "/pages/travel/scenic-detail?id=" + scenicId.value }));
// #endif
