<script setup lang="ts">
import { ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import NavBar from "@/components/NavBar.vue";
import EmptyState from "@/components/EmptyState.vue";
import LoadingState from "@/components/LoadingState.vue";
import { createTicket, getTickets, TICKET_CATEGORY, TICKET_STATUS, type TicketListRow } from "@/api/ticket";
import { tr } from "@/utils/i18n";
import { go } from "@/utils/navigation";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const loading = ref(true);
const list = ref<TicketListRow[]>([]);
const orderId = ref<number | undefined>(undefined);
const showCreate = ref(false);
const category = ref("AFTER_SALE");
const title = ref("");
const content = ref("");
const submitting = ref(false);

const CATS = Object.keys(TICKET_CATEGORY);

onLoad((options) => {
  if (options?.orderId) {
    orderId.value = Number(options.orderId);
    showCreate.value = true;
  }
});

async function load() {
  if (!userStore.isLogin) {
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const res = await getTickets();
    list.value = res.data ?? [];
  } catch {
    list.value = [];
  } finally {
    loading.value = false;
  }
}

async function onSubmit() {
  if (submitting.value) return;
  if (!content.value.trim()) {
    uni.showToast({ title: tr("请描述遇到的问题"), icon: "none" });
    return;
  }
  submitting.value = true;
  let res: Awaited<ReturnType<typeof createTicket>>;
  try {
    res = await createTicket({
      orderId: orderId.value,
      category: category.value,
      title: title.value.trim() || TICKET_CATEGORY[category.value],
      content: content.value.trim(),
    });
  } catch {
    res = { code: -1, message: tr("提交失败"), data: null };
  } finally {
    submitting.value = false;
  }
  if (res.code !== 0) {
    uni.showToast({ title: res.message || tr("提交失败"), icon: "none" });
    return;
  }
  showCreate.value = false;
  title.value = "";
  content.value = "";
  uni.showToast({ title: tr("已提交"), icon: "success" });
  load();
}

onShow(load);
</script>

<template>
  <view class="tk">
    <NavBar :title="tr('客服与工单')" show-back />

    <view v-if="userStore.isLogin" class="tk__head">
      <text class="tk__tip">{{ tr("订单问题、售后协商、投诉建议都可以在这里发起") }}</text>
      <view class="tk__new" @tap="showCreate = true">{{ tr("发起工单") }}</view>
    </view>

    <LoadingState v-if="loading" :rows="3" />
    <EmptyState v-else-if="!list.length" :title="tr('暂无工单')" :description="tr('遇到问题可以点右上角发起工单')" />

    <view v-else class="tk__list">
      <view v-for="row in list" :key="row.ticket.id" class="tk__item card" @tap="go('pages/user/ticket-detail?id=' + row.ticket.id)">
        <view class="tk__row">
          <text class="tk__title">{{ row.ticket.title }}</text>
          <text class="tk__status" :class="'tk__status--' + row.ticket.status">{{ tr(TICKET_STATUS[row.ticket.status]) }}</text>
        </view>
        <text class="tk__last">{{ row.lastMessage }}</text>
        <view class="tk__meta">
          <text>{{ row.ticket.ticketNo }}</text>
          <text>{{ (row.ticket.updateTime || "").slice(0, 16).replace("T", " ") }}</text>
        </view>
      </view>
    </view>

    <view v-if="showCreate" class="tk__mask" @tap="showCreate = false">
      <view class="tk__sheet" @tap.stop>
        <text class="tk__sheet-title">{{ tr("发起工单") }}</text>
        <view class="tk__cats">
          <view
            v-for="c in CATS"
            :key="c"
            class="tk__cat"
            :class="{ 'tk__cat--on': category === c }"
            @tap="category = c"
          >{{ tr(TICKET_CATEGORY[c]) }}</view>
        </view>
        <input v-model="title" class="tk__input" :maxlength="40" :placeholder="tr('标题（可不填）')" />
        <textarea
          v-model="content"
          class="tk__textarea"
          :maxlength="500"
          :placeholder="tr('请描述具体情况，例如订单号、时间、遇到的问题')"
        />
        <view class="tk__actions">
          <view class="tk__cancel" @tap="showCreate = false">{{ tr("取消") }}</view>
          <view class="tk__submit" @tap="onSubmit">{{ submitting ? tr("提交中…") : tr("提交") }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.tk {
  min-height: 100vh;
  background: $bg;
}

.tk__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 20rpx 24rpx;
}

.tk__tip {
  flex: 1;
  font-size: 23rpx;
  color: $text-mute;
  line-height: 1.5;
}

.tk__new {
  flex-shrink: 0;
  padding: 14rpx 28rpx;
  border-radius: 999rpx;
  background: $green;
  color: #f7f3e6;
  font-size: 25rpx;
}

.tk__list {
  padding: 4rpx 24rpx 48rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.tk__item {
  padding: 24rpx;
}

.tk__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.tk__title {
  font-size: 28rpx;
  font-weight: 700;
  color: $text-main;
}

.tk__status {
  font-size: 21rpx;
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  background: $green-soft;
  color: $text-sub;
}

.tk__status--2 {
  background: $green-bg;
  color: $green;
}

.tk__status--3 {
  background: $line-2;
  color: $text-mute;
}

.tk__last {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: $text-sub;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.tk__meta {
  margin-top: 12rpx;
  display: flex;
  justify-content: space-between;
  font-size: 21rpx;
  color: $text-mute;
}

.tk__mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  z-index: 99;
  /* #ifdef H5 */
  left: 50%;
  right: auto;
  width: 100%;
  max-width: $app-max-width;
  transform: translateX(-50%);
  /* #endif */
}

.tk__sheet {
  width: 100%;
  padding: 32rpx 32rpx 48rpx;
  border-radius: 32rpx 32rpx 0 0;
  background: $surface;
}

.tk__sheet-title {
  font-size: 30rpx;
  font-weight: 700;
  color: $text-main;
}

.tk__cats {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 20rpx;
}

.tk__cat {
  padding: 10rpx 22rpx;
  border-radius: 999rpx;
  border: 1rpx solid $line-strong;
  font-size: 24rpx;
  color: $text-sub;
}

.tk__cat--on {
  background: $green;
  border-color: $green;
  color: #fff;
}

.tk__input,
.tk__textarea {
  width: 100%;
  margin-top: 20rpx;
  padding: 16rpx;
  border-radius: $radius-sm;
  background: $green-soft;
  font-size: 25rpx;
}

.tk__textarea {
  height: 200rpx;
}

.tk__actions {
  margin-top: 24rpx;
  display: flex;
  gap: 20rpx;
}

.tk__cancel,
.tk__submit {
  flex: 1;
  height: 80rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
}

.tk__cancel {
  border: 1rpx solid $line-strong;
  color: $text-sub;
}

.tk__submit {
  background: $green;
  color: #f7f3e6;
}
</style>
