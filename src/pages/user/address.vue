<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { useUserStore } from "@/stores/user";
import { deleteAddress, setDefaultAddress } from "@/api/user";
import { go } from "@/utils/navigation";
import { tr } from "@/utils/i18n";

import EmptyState from "@/components/EmptyState.vue";

const userStore = useUserStore();

function onAdd() {
  go("pages/user/address-edit");
}

function onEdit(id: string) {
  go(`pages/user/address-edit?id=${id}`);
}

function onDelete(id: string) {
  uni.showModal({
    title: tr("提示"),
    content: tr("确定删除该地址吗？"),
    success: (res) => {
      if (res.confirm) {
        if (/^\d+$/.test(id)) {
          deleteAddress(id).catch(() => {});
        }
        userStore.removeAddress(id);
        uni.showToast({ title: tr("已删除"), icon: "none" });
      }
    },
  });
}

function onSetDefault(id: string) {
  if (/^\d+$/.test(id)) {
    setDefaultAddress(id).catch(() => {});
  }
  userStore.setDefaultAddress(id);
  uni.showToast({ title: tr("已设为默认"), icon: "none" });
}
</script>

<template>
  <view class="page">
    <NavBar :title="tr('收货地址')" />
    <template v-if="!userStore.addresses.length">
      <EmptyState :title="tr('还没有收货地址')" :description="tr('添加一个常用地址吧')" :action-text="tr('新增地址')" @action="onAdd" />
    </template>
    <template v-else>
      <view class="addr-list">
        <view v-for="a in userStore.addresses" :key="a.id" class="addr card">
          <view class="addr__body" @tap="onEdit(a.id)">
            <view class="addr__name-row">
              <text class="addr__name">{{ a.name }}</text>
              <text class="addr__mobile">{{ a.mobile }}</text>
              <text v-if="a.isDefault" class="addr__default">{{ tr("默认") }}</text>
            </view>
            <text class="addr__detail">{{ a.province }}{{ a.city }}{{ a.district }}{{ a.detail }}</text>
          </view>
          <view class="addr__actions">
            <view class="addr__action" @tap="onSetDefault(a.id)">
              <text>{{ a.isDefault ? tr('已默认') : tr('设为默认') }}</text>
            </view>
            <view class="addr__action" @tap="onEdit(a.id)">
              <text>{{ tr("编辑") }}</text>
            </view>
            <view class="addr__action addr__action--danger" @tap="onDelete(a.id)">
              <text>{{ tr("删除") }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="addr-add" @tap="onAdd">
        <text>+ {{ tr("新增地址") }}</text>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.addr-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.addr {
  padding: 24rpx;
}

.addr__body {
  padding-bottom: 16rpx;
}

.addr__name-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 8rpx;
}

.addr__name {
  font-size: 30rpx;
  font-weight: 700;
}

.addr__mobile {
  font-size: 26rpx;
  color: $text-sub;
}

.addr__default {
  padding: 4rpx 14rpx;
  border-radius: 16rpx;
  background: $green-bg;
  color: $green;
  font-size: 20rpx;
}

.addr__detail {
  font-size: 26rpx;
  color: $text-main;
  line-height: 1.5;
}

.addr__actions {
  display: flex;
  justify-content: flex-end;
  gap: 28rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f1ee;
}

.addr__action {
  font-size: 24rpx;
  color: $text-sub;

  &--danger {
    color: #d96a3b;
  }
}

.addr-add {
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
