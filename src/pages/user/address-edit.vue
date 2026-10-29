<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useUserStore } from "@/stores/user";
import type { AddressItem } from "@/types/business";
import { saveAddress } from "@/api/user";
import { goBack } from "@/utils/navigation";
import { tr } from "@/utils/i18n";
import RegionPicker from "@/components/RegionPicker.vue";

const userStore = useUserStore();

const id = ref("");
const name = ref("");
const mobile = ref("");
const province = ref("四川省");
const city = ref("成都市");
const district = ref("都江堰市");
const detail = ref("");
const isDefault = ref(false);
const regionOpen = ref(false);

onLoad((options) => {
  id.value = (options?.id as string) || "";
  if (id.value) {
    const addr = userStore.addresses.find((a) => a.id === id.value);
    if (addr) {
      name.value = addr.name;
      mobile.value = addr.mobile;
      province.value = addr.province;
      city.value = addr.city;
      district.value = addr.district;
      detail.value = addr.detail;
      isDefault.value = addr.isDefault;
    }
  }
});

function onRegionConfirm(v: string[]) {
  province.value = v[0];
  city.value = v[1];
  district.value = v[2];
  regionOpen.value = false;
}

function onSwitch(e: Event) {
  isDefault.value = (e as unknown as { detail: { value: boolean } }).detail.value;
}

function save() {
  if (!name.value.trim()) {
    uni.showToast({ title: tr("请填写收货人"), icon: "none" });
    return;
  }
  if (!/^1\d{10}$/.test(mobile.value)) {
    uni.showToast({ title: tr("请填写正确的手机号"), icon: "none" });
    return;
  }
  if (!detail.value.trim()) {
    uni.showToast({ title: tr("请填写详细地址"), icon: "none" });
    return;
  }
  const address: AddressItem = {
    id: id.value || `addr-${Date.now()}`,
    name: name.value.trim(),
    mobile: mobile.value,
    province: province.value,
    city: city.value,
    district: district.value,
    detail: detail.value.trim(),
    isDefault: isDefault.value,
  };
  saveAddress(address)
    .then((res) => {
      userStore.saveAddress(res.data);
      uni.showToast({ title: tr("已保存"), icon: "success" });
      setTimeout(goBack, 500);
    })
    .catch(() => {
      // 拦截器已提示错误
    });
}
</script>

<template>
  <view class="page">
    <NavBar :title="tr('编辑地址')" />
    <view class="form card">
      <view class="form__item">
        <text class="form__label">{{ tr("收货人") }}</text>
        <input class="form__input" v-model="name" :placeholder="tr('请输入姓名')" />
      </view>
      <view class="form__item">
        <text class="form__label">{{ tr("手机号") }}</text>
        <input class="form__input" v-model="mobile" type="tel" maxlength="11" :placeholder="tr('请输入手机号')" />
      </view>
      <view class="form__item form__item--column">
        <view class="form__regionrow" @tap="regionOpen = !regionOpen">
          <text class="form__label">{{ tr("所在地区") }}</text>
          <view class="form__region">
            <text class="form__value">{{ province }} {{ city }} {{ district }}</text>
            <text class="form__arrow">{{ regionOpen ? "︿" : "›" }}</text>
          </view>
        </view>
        <RegionPicker
          mode="inline"
          :show="regionOpen"
          :value="[province, city, district]"
          @close="regionOpen = false"
          @confirm="onRegionConfirm"
        />
      </view>
      <view class="form__item form__item--column">
        <text class="form__label">{{ tr("详细地址") }}</text>
        <textarea class="form__textarea" v-model="detail" :placeholder="tr('街道、门牌号等')" />
      </view>
      <view class="form__item">
        <text class="form__label">{{ tr("设为默认地址") }}</text>
        <switch :checked="isDefault" color="#4F8F52" @change="onSwitch" />
      </view>
    </view>

    <view class="save" @tap="save">
      <text>{{ tr("保存地址") }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.form {
  padding: 8rpx 24rpx;
}

.form__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1rpx solid $line-2;

  &--column {
    flex-direction: column;
    align-items: flex-start;
    gap: 16rpx;
  }
}

.form__item:last-child {
  border-bottom: none;
}

.form__regionrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.form__label {
  font-size: 28rpx;
  flex-shrink: 0;
}

.form__input {
  flex: 1;
  text-align: right;
  font-size: 28rpx;
}

.form__value {
  font-size: 28rpx;
  color: $green;
}

.form__region {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.form__arrow {
  font-size: 32rpx;
  line-height: 1;
  color: $text-sub;
}

.form__textarea {
  width: 100%;
  height: 120rpx;
  font-size: 28rpx;
}

.save {
  margin-top: 40rpx;
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
