<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { ref, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import dayjs from "dayjs";
import { useRequest } from "@/composables/useRequest";
import { getHomestayDetail, createHomestayOrder } from "@/api/homestay";
import type { HomestayItem, RoomType } from "@/types/business";
import { useOrderStore } from "@/stores/order";
import { calcStayDays } from "@/utils/format";
import { go } from "@/utils/navigation";
import { tc, tr } from "@/utils/i18n";

import QuantitySelector from "@/components/QuantitySelector.vue";
import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";
import ContactCard from "@/components/ContactCard.vue";

const orderStore = useOrderStore();

const homestayId = ref("");
const roomTypeId = ref("");
const detail = ref<HomestayItem | null>(null);
const roomType = ref<RoomType | null>(null);

const checkIn = ref(dayjs().add(1, "day").format("YYYY-MM-DD"));
const checkOut = ref(dayjs().add(3, "day").format("YYYY-MM-DD"));
const people = ref(2);
const guestName = ref("");
const guestMobile = ref("");

const { loading, error, run } = useRequest(async () => {
  const res = await getHomestayDetail(homestayId.value);
  detail.value = res.data;
  roomType.value = (res.data?.roomTypes ?? []).find((r) => r.id === roomTypeId.value) ?? null;
});

onLoad((options) => {
  homestayId.value = (options?.homestayId as string) || "";
  roomTypeId.value = (options?.roomTypeId as string) || "";
  run();
});

const nights = computed(() => calcStayDays(checkIn.value, checkOut.value));
const total = computed(() => Math.round((roomType.value?.price ?? 0) * nights.value * 100) / 100);

const submitting = ref(false);

function submit() {
  if (submitting.value) return;
  if (!guestName.value.trim()) {
    uni.showToast({ title: tr("请填写入住人"), icon: "none" });
    return;
  }
  if (!/^1\d{10}$/.test(guestMobile.value)) {
    uni.showToast({ title: tr("请填写正确的手机号"), icon: "none" });
    return;
  }
  if (!dayjs(checkOut.value).isAfter(dayjs(checkIn.value))) {
    uni.showToast({ title: tr("退房日期需晚于入住日期"), icon: "none" });
    return;
  }
  if (!roomType.value) return;
  submitting.value = true;
  createHomestayOrder({
    homestayId: homestayId.value,
    roomTypeId: roomType.value.id,
    roomTypeName: roomType.value.name,
    checkIn: checkIn.value,
    checkOut: checkOut.value,
    nights: nights.value,
    price: roomType.value.price,
    people: people.value,
    guestName: guestName.value.trim(),
    guestMobile: guestMobile.value,
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
    <NavBar :title="tr('民宿预订')" />
    <template v-if="loading">
      <LoadingState :rows="4" />
    </template>
    <template v-else-if="error || !detail || !roomType">
      <EmptyState :title="tr('加载失败')" :description="error" :action-text="tr('重新加载')" @action="run" />
    </template>
    <template v-else>
      <view class="order card">
        <text class="order__name">{{ tc(detail.name, detail.nameEn) }} · {{ roomType.name }}</text>
        <text class="order__spec">{{ roomType.bedType }} · {{ tr("可住") }} {{ roomType.capacity }} {{ tr("人") }} · {{ roomType.breakfast }}</text>
        <text class="order__price">¥{{ roomType.price }}/{{ tr("晚") }}</text>
      </view>

      <view class="form card">
        <view class="form__item">
          <text class="form__label">{{ tr("入住日期") }}</text>
          <picker mode="date" :value="checkIn" @change="checkIn = $event.detail.value">
            <text class="form__value">{{ checkIn }}</text>
          </picker>
        </view>
        <view class="form__item">
          <text class="form__label">{{ tr("退房日期") }}</text>
          <picker mode="date" :value="checkOut" :start="checkIn" @change="checkOut = $event.detail.value">
            <text class="form__value">{{ checkOut }}</text>
          </picker>
        </view>
        <view class="form__item">
          <text class="form__label">{{ tr("入住人数") }}</text>
          <QuantitySelector v-model="people" :max="roomType.capacity" :min="1" />
        </view>
        <view class="form__item">
          <text class="form__label">{{ tr("入住人姓名") }}</text>
          <input class="form__input" v-model="guestName" :placeholder="tr('请输入姓名')" />
        </view>
        <view class="form__item">
          <text class="form__label">{{ tr("联系手机") }}</text>
          <input class="form__input" v-model="guestMobile" type="tel" maxlength="11" :placeholder="tr('请输入手机号')" />
        </view>
      </view>

      <view class="calc card">
        <view class="calc__row">
          <text>{{ tr("入住晚数") }}</text>
          <text>{{ nights }} {{ tr("晚") }}</text>
        </view>
        <view class="calc__row">
          <text>{{ tr("房费") }}</text>
          <text>¥{{ roomType.price }} × {{ nights }}</text>
        </view>
        <view class="calc__row calc__row--total">
          <text>{{ tr("应付总额") }}</text>
          <text class="calc__amount">¥{{ total }}</text>
        </view>
      </view>

      <!-- 平台客服电话：可代联民宿 -->
      <ContactCard
        compact
        :label="tr('平台客服电话（可代联民宿）')"
        :tip="tr('想加床、要接站或改期，可致电平台客服，由客服代为同步给民宿管家')"
      />

      <view class="submit-bar">
        <view class="submit-bar__total">
          <text>{{ tr("应付") }}</text>
          <text class="submit-bar__amount">¥{{ total }}</text>
        </view>
        <view
          class="submit-bar__btn"
          :class="{ 'submit-bar__btn--disabled': submitting }"
          @tap="submit"
          >{{ submitting ? tr("提交中…") : tr("提交预订") }}</view
        >
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.order {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.order__name {
  font-size: 30rpx;
  font-weight: 700;
}

.order__spec {
  font-size: 24rpx;
  color: $text-sub;
}

.order__price {
  font-size: 32rpx;
  font-weight: 700;
  color: #d96a3b;
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
}

.form__value {
  font-size: 28rpx;
  color: $green;
}

.form__input {
  flex: 1;
  text-align: right;
  font-size: 28rpx;
}

.calc {
  margin-top: 24rpx;
  padding: 8rpx 24rpx;
}

.calc__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  font-size: 26rpx;
}

.calc__row--total {
  border-top: 1rpx solid #f0f1ee;
}

.calc__amount {
  font-size: 36rpx;
  font-weight: 800;
  color: #d96a3b;
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
