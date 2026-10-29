<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { ref, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useRequest } from "@/composables/useRequest";
import { getPickingDetail, createPickingOrder } from "@/api/picking";
import type { PickingItem } from "@/types/business";
import { useOrderStore } from "@/stores/order";
import { go } from "@/utils/navigation";
import { i18n, tc, tr } from "@/utils/i18n";

import QuantitySelector from "@/components/QuantitySelector.vue";
import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";
import ContactCard from "@/components/ContactCard.vue";

const orderStore = useOrderStore();

const orchardId = ref("");
const sessionId = ref("");
const sessionTime = ref("");
const sessionPrice = ref(0);
const detail = ref<PickingItem | null>(null);

/** 预约日期由所选场次决定，不允许另选，否则订单日期与商家档期对不上 */
const date = ref("");
const people = ref(1);
const contactName = ref("");
const contactMobile = ref("");

const { loading, error, run } = useRequest(async () => {
  const res = await getPickingDetail(orchardId.value);
  detail.value = res.data;
  const session = res.data.sessions.find((s) => s.id === sessionId.value);
  if (session) {
    sessionTime.value = session.time;
    sessionPrice.value = session.price;
    date.value = session.fullDate;
  }
});

onLoad((options) => {
  orchardId.value = (options?.orchardId as string) || "";
  sessionId.value = (options?.sessionId as string) || "";
  sessionTime.value = (options?.time as string) || "";
  sessionPrice.value = Number(options?.price) || 0;
  run();
});

const total = computed(() => sessionPrice.value * people.value);
const sessionRemain = computed(() => {
  if (!detail.value) return 0;
  return detail.value.sessions.find((s) => s.id === sessionId.value)?.remain ?? 0;
});

const submitting = ref(false);

const notices = computed(() => {
  const en = detail.value?.noticesEn;
  return i18n.lang === "en" && en && en.length ? en : detail.value?.notices ?? [];
});

function submit() {
  if (submitting.value) return;
  if (!contactName.value.trim()) {
    uni.showToast({ title: tr("请填写联系人"), icon: "none" });
    return;
  }
  if (!/^1\d{10}$/.test(contactMobile.value)) {
    uni.showToast({ title: tr("请填写正确的手机号"), icon: "none" });
    return;
  }
  if (people.value > sessionRemain.value) {
    uni.showToast({ title: tr("超出剩余名额"), icon: "none" });
    return;
  }
  submitting.value = true;
  createPickingOrder({
    orchardId: orchardId.value,
    sessionId: sessionId.value,
    sessionTime: sessionTime.value,
    price: sessionPrice.value,
    date: date.value,
    people: people.value,
    contactName: contactName.value.trim(),
    contactMobile: contactMobile.value,
  })
    .then((res) => {
      orderStore.addOrder(res.data);
      go(`pages/payment/index?orderId=${res.data.id}&amount=${res.data.amount}`);
    })
    .catch(() => {
      uni.showToast({ title: tr("下单失败，请重试"), icon: "none" });
    })
    .finally(() => {
      submitting.value = false;
    });
}
</script>

<template>
  <view class="page">
    <NavBar :title="tr('采摘预约')" />
    <template v-if="loading">
      <LoadingState :rows="4" />
    </template>
    <template v-else-if="error || !detail">
      <EmptyState :title="tr('加载失败')" :description="error" :action-text="tr('重新加载')" @action="run" />
    </template>
    <template v-else>
      <view class="order card">
        <view class="order__head">
          <text class="order__name">{{ tc(detail.orchardName, detail.orchardNameEn) }}</text>
          <text class="order__remain">{{ tr("剩余 {n} 个名额").replace("{n}", String(sessionRemain)) }}</text>
        </view>
        <view class="order__session">{{ sessionTime }} · ¥{{ sessionPrice }}/{{ tr("人") }}</view>
      </view>

      <view class="form card">
        <view class="form__item">
          <text class="form__label">{{ tr("预约日期") }}</text>
          <text class="form__value">{{ date || tr("加载中…") }}</text>
        </view>
        <view class="form__item">
          <text class="form__label">{{ tr("预约人数") }}</text>
          <QuantitySelector v-model="people" :max="sessionRemain || 1" :min="1" />
        </view>
        <view class="form__item">
          <text class="form__label">{{ tr("联系人") }}</text>
          <input class="form__input" v-model="contactName" :placeholder="tr('请输入姓名')" />
        </view>
        <view class="form__item">
          <text class="form__label">{{ tr("手机号") }}</text>
          <input class="form__input" v-model="contactMobile" type="tel" maxlength="11" :placeholder="tr('请输入手机号')" />
        </view>
      </view>

      <view class="notice card">
        <text class="notice__title">{{ tr("注意事项") }}</text>
        <text v-for="n in notices" :key="n" class="notice__li">· {{ n }}</text>
        <text v-if="detail.refundRule" class="notice__rule">{{ tc(detail.refundRule, detail.refundRuleEn) }}</text>
      </view>

      <!-- 平台客服电话：可代联果园 -->
      <ContactCard
        compact
        :label="tr('平台客服电话（可代联果园）')"
        :tip="tr('提交前想改场次或人数，可致电平台客服，由客服代为同步给果园')"
      />

      <view class="submit-bar">
        <view class="submit-bar__total">
          <text>{{ tr("合计") }}</text>
          <text class="submit-bar__amount">¥{{ total }}</text>
        </view>
        <view
          class="submit-bar__btn"
          :class="{ 'submit-bar__btn--disabled': submitting }"
          @tap="submit"
          >{{ submitting ? tr("提交中…") : tr("提交订单") }}</view
        >
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.order {
  padding: 24rpx;
}

.order__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.order__name {
  font-size: 30rpx;
  font-weight: 700;
}

.order__remain {
  font-size: 24rpx;
  color: $green;
}

.order__session {
  margin-top: 12rpx;
  font-size: 26rpx;
  color: $text-sub;
}

.form {
  margin-top: 24rpx;
  padding: 8rpx 24rpx;
}

.form__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f1ee;
}

.form__item:last-child {
  border-bottom: none;
}

.form__label {
  font-size: 28rpx;
  color: $text-main;
}

.form__value {
  font-size: 28rpx;
  color: $green;
}

.form__input {
  flex: 1;
  text-align: right;
  font-size: 28rpx;
  color: $text-main;
}

.notice {
  margin-top: 24rpx;
  padding: 24rpx;
}

.notice__title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  margin-bottom: 12rpx;
}

.notice__li {
  display: block;
  font-size: 26rpx;
  color: $text-sub;
  line-height: 1.8;
}

.notice__rule {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: $brown;
}

.submit-bar {
  position: fixed;
  left: 50%;
  right: auto;
  bottom: 0;
  width: 100%;
  max-width: $app-max-width;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1rpx solid #f0f1ee;
}

.submit-bar__total {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.submit-bar__amount {
  font-size: 40rpx;
  font-weight: 800;
  color: #d96a3b;
}

.submit-bar__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  padding: 0 48rpx;
  border-radius: 44rpx;
  background: $green;
  color: #f7f3e6;
  font-size: 30rpx;
  font-weight: 600;
}

.submit-bar__btn--disabled {
  opacity: 0.6;
}
</style>
