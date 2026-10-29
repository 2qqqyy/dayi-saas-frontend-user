<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import NavBar from "@/components/NavBar.vue";
import LoadingState from "@/components/LoadingState.vue";
import {
  closeTicket,
  getTicketDetail,
  replyTicket,
  TICKET_CATEGORY,
  TICKET_STATUS,
  type TicketMessage,
  type TicketRow,
} from "@/api/ticket";
import { tr } from "@/utils/i18n";

const id = ref("");
const loading = ref(true);
const ticket = ref<TicketRow | null>(null);
const messages = ref<TicketMessage[]>([]);
const merchantName = ref("");
const text = ref("");
const sending = ref(false);

const canReply = computed(() => !!ticket.value && ticket.value.status !== 3);

async function load() {
  loading.value = true;
  try {
    const res = await getTicketDetail(id.value);
    if (!res.data) {
      uni.showToast({ title: res.message || tr("加载失败"), icon: "none" });
      return;
    }
    ticket.value = res.data.ticket;
    messages.value = res.data.messages ?? [];
    merchantName.value = res.data.merchantName || "";
  } catch {
    uni.showToast({ title: tr("加载失败"), icon: "none" });
  } finally {
    loading.value = false;
  }
}

async function onSend() {
  if (!text.value.trim() || sending.value) return;
  sending.value = true;
  try {
    const res = await replyTicket(id.value, text.value.trim());
    if (!res.data) {
      uni.showToast({ title: res.message || tr("发送失败"), icon: "none" });
      return;
    }
    text.value = "";
    load();
  } catch {
    uni.showToast({ title: tr("发送失败"), icon: "none" });
  } finally {
    sending.value = false;
  }
}

async function onClose() {
  uni.showModal({
    title: tr("关闭工单"),
    content: tr("确认问题已经解决？关闭后仍可查看记录。"),
    success: async (r) => {
      if (!r.confirm) return;
      await closeTicket(id.value);
      load();
    },
  });
}

onLoad(async (options) => {
  id.value = (options?.id as string) || "";
  if (id.value) await load();
});
// H5 直链时 onShow 可能先于 onLoad，补一次兜底加载（load 幂等）
onShow(() => {
  if (id.value) load();
});
</script>

<template>
  <view class="td">
    <NavBar :title="tr('工单详情')" show-back>
      <template #right>
        <text v-if="ticket && ticket.status !== 3" class="td__close" @tap="onClose">{{ tr("关闭工单") }}</text>
      </template>
    </NavBar>

    <LoadingState v-if="loading" :rows="4" />

    <view v-else-if="!ticket" class="td__empty">
      <text>{{ tr("工单不存在或无权查看") }}</text>
    </view>

    <template v-else-if="ticket">
      <view class="td__head card">
        <view class="td__row">
          <text class="td__title">{{ ticket.title }}</text>
          <text class="td__status">{{ tr(TICKET_STATUS[ticket.status]) }}</text>
        </view>
        <text class="td__meta">
          {{ ticket.ticketNo }} · {{ tr(TICKET_CATEGORY[ticket.category] || "其他咨询") }}
          <template v-if="merchantName"> · {{ merchantName }}</template>
        </text>
      </view>

      <view class="td__messages">
        <view
          v-for="m in messages"
          :key="m.id"
          class="td__msg"
          :class="{ 'td__msg--mine': m.senderType === 'USER' }"
        >
          <text class="td__sender">{{ m.senderType === "USER" ? tr("我") : m.senderName || tr("客服") }}</text>
          <view class="td__bubble" :class="{ 'td__bubble--mine': m.senderType === 'USER' }">
            <text>{{ m.content }}</text>
          </view>
          <text class="td__time">{{ (m.createTime || "").slice(5, 16).replace("T", " ") }}</text>
        </view>
      </view>

      <view v-if="canReply" class="td__composer">
        <textarea v-model="text" class="td__input" :maxlength="500" :placeholder="tr('补充说明或回复…')" />
        <view class="td__send" @tap="onSend">{{ sending ? tr("发送中…") : tr("发送") }}</view>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.td {
  min-height: 100vh;
  padding-bottom: 200rpx;
  background: $bg;
}

.td__close {
  font-size: 25rpx;
  color: $text-mute;
}

.td__head {
  margin: 24rpx;
  padding: 24rpx;
}

.td__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.td__title {
  font-size: 30rpx;
  font-weight: 700;
  color: $text-main;
}

.td__status {
  flex-shrink: 0;
  font-size: 21rpx;
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  background: $green-bg;
  color: $green;
}

.td__meta {
  display: block;
  margin-top: 10rpx;
  font-size: 21rpx;
  color: $text-mute;
}

.td__messages {
  padding: 0 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.td__msg {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6rpx;
}

.td__msg--mine {
  align-items: flex-end;
}

.td__sender {
  font-size: 21rpx;
  color: $text-mute;
}

.td__bubble {
  max-width: 78%;
  padding: 16rpx 20rpx;
  border-radius: 20rpx 20rpx 20rpx 4rpx;
  background: $surface;
  font-size: 26rpx;
  color: $text-main;
  line-height: 1.6;
}

.td__bubble--mine {
  background: $green;
  color: #f7f3e6;
  border-radius: 20rpx 20rpx 4rpx 20rpx;
}

.td__time {
  font-size: 20rpx;
  color: $text-mute;
}

.td__composer {
  position: fixed;
  left: 50%;
  right: auto;
  bottom: 0;
  width: 100%;
  max-width: $app-max-width;
  transform: translateX(-50%);
  display: flex;
  align-items: flex-end;
  gap: 16rpx;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: $surface;
  border-top: 1rpx solid $line-2;
}

.td__input {
  flex: 1;
  height: 88rpx;
  max-height: 180rpx;
  padding: 12rpx 16rpx;
  border-radius: $radius-sm;
  background: $green-soft;
  font-size: 25rpx;
}

.td__send {
  flex-shrink: 0;
  height: 88rpx;
  padding: 0 32rpx;
  border-radius: 999rpx;
  background: $green;
  color: #f7f3e6;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.td__empty {
  padding: 120rpx 0;
  text-align: center;
  font-size: 26rpx;
  color: $text-mute;
}

</style>
