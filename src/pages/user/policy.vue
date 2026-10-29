<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import NavBar from "@/components/NavBar.vue";
import { i18n, tr } from "@/utils/i18n";

type PolicyType = "agreement" | "privacy" | "refund";

const type = ref<PolicyType>("agreement");

onLoad((options) => {
  const t = (options?.type as string) || "agreement";
  type.value = t === "privacy" || t === "refund" ? t : "agreement";
});

const TITLE: Record<PolicyType, [string, string]> = {
  agreement: ["用户协议", "Terms of Service"],
  privacy: ["隐私政策", "Privacy Policy"],
  refund: ["退款与取消说明", "Refund & Cancellation Policy"],
};

const SECTIONS: Record<PolicyType, { h: [string, string]; p: [string, string] }[]> = {
  agreement: [
    {
      h: ["一、服务主体与范围", "1. Who we are"],
      p: [
        "青梅里平台由青梅里乡村旅游合作社运营，为游客提供景点资讯、采摘预约、民宿预订与农产品购买服务。你在平台下单即视为同意本协议。",
        "The Qingmei platform is operated by the Qingmei Rural Tourism Cooperative and provides sight information, picking reservations, homestay booking and farm produce sales. Placing an order means you accept these terms.",
      ],
    },
    {
      h: ["二、账号与下单", "2. Account and orders"],
      p: [
        "账号以手机号为唯一标识，请妥善保管验证码与密码。下单时请核对日期、人数与收货信息；因填写错误导致的损失由下单人承担。",
        "Your account is identified by your mobile number. Keep your verification code and password safe. Check dates, headcount and delivery details before paying; mistakes in these fields are the buyer's responsibility.",
      ],
    },
    {
      h: ["三、行为规范", "3. Acceptable use"],
      p: [
        "不得利用平台发布违法信息、恶意刷单、囤积名额或干扰商家正常经营。违反者平台有权封禁账号并取消未核销订单。",
        "You may not post illegal content, place fake orders, hoard quotas or disrupt merchants. Violators may be banned and their unverified orders cancelled.",
      ],
    },
    {
      h: ["四、协议变更", "4. Changes"],
      p: ["协议更新将在平台公告公示，继续使用即视为接受新版本。", "Updates are published via platform notices; continued use means acceptance."],
    },
  ],
  privacy: [
    {
      h: ["一、我们收集什么", "1. What we collect"],
      p: [
        "仅收集提供服务所必需的信息：手机号（登录与订单联系）、收货地址（商品配送）、预约联系人信息（核销与接待）、订单与浏览记录（售后与推荐）。",
        "We collect only what the service needs: mobile number (sign-in and order contact), delivery address, booking contact (check-in and reception), and order history (after-sales and recommendations).",
      ],
    },
    {
      h: ["二、我们如何使用与保护", "2. How we use and protect it"],
      p: [
        "信息仅用于履约与售后，不出售给第三方。身份证、银行卡等资质信息仅商家与平台审核可见，接口返回一律脱敏。",
        "Data is used only for fulfilment and after-sales, never sold. IDs and bank accounts are visible only to the merchant and platform reviewers, and are masked in all API responses.",
      ],
    },
    {
      h: ["三、你的权利", "3. Your rights"],
      p: [
        "可在「个人资料」修改昵称头像，在「收货地址」删除地址；注销账号与导出数据请联系客服 400-888-8888，我们将在 15 个工作日内处理。",
        "You can edit your profile, delete addresses, and request account deletion or a data export via customer service at 400-888-8888; we respond within 15 working days.",
      ],
    },
  ],
  refund: [
    {
      h: ["一、采摘预约", "1. Picking reservations"],
      p: [
        "未核销前可全额退款；距开场不足商家设定小时数（默认不限制）时需与商家协商。到场后因个人原因取消的，按 80% 退款。",
        "Full refund before check-in. Inside the merchant's cut-off window (none by default) please negotiate with the merchant. No-show cancellations are refunded at 80%.",
      ],
    },
    {
      h: ["二、民宿预订", "2. Homestay bookings"],
      p: [
        "入住前 3 天以上取消全额退；3 天内取消扣首晚房费；入住后按未住晚数比例退款。",
        "Free cancellation up to 3 days before check-in; inside 3 days the first night is charged; after check-in, unused nights are refunded pro rata.",
      ],
    },
    {
      h: ["三、商品订单", "3. Goods orders"],
      p: [
        "发货前可全额取消；发货后支持 7 天无理由（生鲜除外），退货运费由买家承担；质量问题由商家承担运费并全额退款。",
        "Full cancellation before shipping; 7-day no-reason return after shipping (excluding fresh goods) with return postage on the buyer; quality issues are fully refunded with postage on the merchant.",
      ],
    },
    {
      h: ["四、退款时效", "4. Timing"],
      p: ["商家或平台同意后，款项 1-7 个工作日原路退回。", "Once approved, refunds return via the original payment channel within 1-7 working days."],
    },
  ],
};

const title = computed(() => (i18n.lang === "en" ? TITLE[type.value][1] : TITLE[type.value][0]));
const sections = computed(() =>
  SECTIONS[type.value].map((s) => ({ h: i18n.lang === "en" ? s.h[1] : s.h[0], p: i18n.lang === "en" ? s.p[1] : s.p[0] })),
);
</script>

<template>
  <view class="policy">
    <NavBar :title="tr('协议与说明')" show-back />
    <view class="policy__body">
      <text class="policy__title">{{ title }}</text>
      <view v-for="(s, i) in sections" :key="i" class="policy__section">
        <text class="policy__h">{{ s.h }}</text>
        <text class="policy__p">{{ s.p }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.policy {
  min-height: 100vh;
  background: $bg;
}

.policy__body {
  padding: 32rpx 32rpx 80rpx;
}

.policy__title {
  display: block;
  font-family: $font-serif;
  font-size: 44rpx;
  font-weight: 700;
  color: $text-main;
  margin-bottom: 24rpx;
}

.policy__section {
  margin-bottom: 32rpx;
}

.policy__h {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: $text-main;
  margin-bottom: 12rpx;
}

.policy__p {
  display: block;
  font-size: 26rpx;
  color: $text-sub;
  line-height: 1.8;
}
</style>
