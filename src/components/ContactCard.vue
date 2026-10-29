<script setup lang="ts">
/**
 * 平台客服电话卡片。
 *
 * 号码统一取自后台「系统配置」contact_phone（取不到时回退 utils/contact.ts 的兜底值），
 * 全站只此一个对外客服号，不再按页面冒充果园 / 民宿 / 商家各自的电话。
 * 点击「拨打」在手机上直接调起拨号，桌面浏览器不支持拨号时可点号码复制。
 */
import { onMounted, ref } from "vue";
import { getPublicConfigs } from "@/api/common";
import {
  MERCHANT_NAME,
  MERCHANT_PHONE,
  MERCHANT_SERVICE_TIME,
  callMerchant,
  copyMerchantPhone,
  copyWechat,
  formatPhone,
} from "@/utils/contact";
import { tr } from "@/utils/i18n";

withDefaults(
  defineProps<{
    /** 卡片标题，可按页面语义微调 */
    label?: string;
    /** 标题下的一句说明 */
    tip?: string;
    /** 紧凑模式：用于下单页，去掉上下留白 */
    compact?: boolean;
  }>(),
  {
    label: "平台客服电话",
    tip: "预订、改期、退订与现场问题都可以打这个电话，由平台客服代为联系对应商家",
    compact: false,
  },
);

const PHONE_ICON =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMmY1ZDQzIiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNNi41IDMuNWgzbDEuNSA0LTIgMS41YTEyIDEyIDAgMCAwIDYgNmwxLjUtMiA0IDEuNXYzYTIgMiAwIDAgMS0yLjIgMkExNi41IDE2LjUgMCAwIDEgNC41IDUuNyAyIDIgMCAwIDEgNi41IDMuNXoiLz48L3N2Zz4=";

const phone = ref(MERCHANT_PHONE);
const phoneText = ref(formatPhone(MERCHANT_PHONE));
const owner = ref(MERCHANT_NAME);
/** 后台未配置 contact_wechat 时整行不展示，避免出现空的微信位 */
const wechat = ref("");

onMounted(async () => {
  const config = await getPublicConfigs(["contact_phone", "site_name", "contact_wechat"]).catch(() => null);
  const raw = (config?.data?.contact_phone || "").trim();
  if (raw) {
    phone.value = raw;
    phoneText.value = formatPhone(raw);
  }
  const site = (config?.data?.site_name || "").trim();
  if (site) owner.value = `${site}平台客服`;
  wechat.value = (config?.data?.contact_wechat || "").trim();
});
</script>

<template>
  <view class="contact" :class="{ 'contact--compact': compact }">
    <view class="contact__icon">
      <image class="contact__icon-img" :src="PHONE_ICON" mode="aspectFit" />
    </view>

    <view class="contact__info">
      <text class="contact__label">{{ tr(label) }}</text>
      <text class="contact__phone" @tap="copyMerchantPhone(phone)">{{ phoneText }}</text>
      <text class="contact__meta">{{ tr(owner) }} · {{ tr(MERCHANT_SERVICE_TIME) }}</text>
      <text v-if="wechat" class="contact__wechat" @tap="copyWechat(wechat)">{{ tr("客服微信") }} {{ wechat }}{{ tr("（点击复制）") }}</text>
      <text class="contact__tip">{{ tr(tip) }}</text>
    </view>

    <view class="contact__btn" @tap="callMerchant(phone)">
      <text>{{ tr("拨打") }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.contact {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-top: 28rpx;
  padding: 24rpx;
  border-radius: $radius-xl;
  background: $glass-1;
  border: 1rpx solid $glass-edge;
  box-shadow: $glass-shadow;
  backdrop-filter: blur(20px) saturate(168%);
  -webkit-backdrop-filter: blur(20px) saturate(168%);
}

.contact--compact {
  margin-top: 20rpx;
}

.contact__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76rpx;
  height: 76rpx;
  border-radius: 24rpx;
  background: $green-bg;
  color: $green;
}

.contact__icon-img {
  width: 40rpx;
  height: 40rpx;
}

.contact__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.contact__label {
  font-size: 24rpx;
  color: $text-sub;
}

.contact__phone {
  font-size: 32rpx;
  font-weight: 700;
  color: $text-main;
  letter-spacing: 1rpx;
  font-variant-numeric: tabular-nums;
}

.contact__meta {
  font-size: 22rpx;
  color: $brown;
}

.contact__wechat {
  font-size: 22rpx;
  color: $green;
}

.contact__tip {
  font-size: 22rpx;
  color: $text-sub;
  line-height: 1.5;
}

.contact__btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 72rpx;
  padding: 0 32rpx;
  border-radius: $radius-lg;
  background: $green;
  color: #f7f3e6;
  font-size: 28rpx;
  font-weight: 600;
}

.contact__btn:active {
  opacity: 0.86;
}
</style>
