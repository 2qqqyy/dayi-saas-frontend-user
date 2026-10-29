<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { ref, onMounted } from "vue";
import { useUserStore } from "@/stores/user";
import { requireLogin } from "@/utils/navigation";
import { tr } from "@/utils/i18n";
import {
  getFeedbackTypes,
  getMyFeedback,
  submitFeedback,
  type FeedbackRecord,
} from "@/api/user";

const userStore = useUserStore();

const TYPES = ["功能建议", "订单问题", "内容纠错", "其他"];
const types = ref<string[]>([...TYPES]);
const type = ref(TYPES[0]);
const content = ref("");
const contact = ref("");
const submitting = ref(false);
const list = ref<FeedbackRecord[]>([]);
const PAGE = "pages/user/feedback";

onMounted(() => {
  if (!userStore.isLogin) {
    requireLogin(PAGE);
    return;
  }
  loadTypes();
  loadList();
});

async function loadTypes() {
  try {
    const res = await getFeedbackTypes();
    if (res.data?.length) types.value = res.data;
  } catch {
    // 接口不可用时使用本地分类
  }
}

async function loadList() {
  try {
    const res = await getMyFeedback();
    list.value = res.data ?? [];
  } catch {
    list.value = [];
  }
}

async function submit() {
  if (!userStore.isLogin) {
    requireLogin(PAGE);
    return;
  }
  const text = content.value.trim();
  if (text.length < 5) {
    uni.showToast({ title: tr("请至少写 5 个字"), icon: "none" });
    return;
  }
  if (submitting.value) return;
  submitting.value = true;
  try {
    await submitFeedback({ type: type.value, content: text, contact: contact.value.trim() });
    content.value = "";
    contact.value = "";
    uni.showToast({ title: tr("反馈已提交"), icon: "success" });
    await loadList();
  } catch {
    // 请求层已提示具体原因
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <view class="page feedback">
    <NavBar :title="tr('意见反馈')" />
    <view class="card">
      <text class="block-title">{{ tr("反馈类型") }}</text>
      <view class="types">
        <view
          v-for="t in types"
          :key="t"
          class="types__item"
          :class="{ 'types__item--on': type === t }"
          @tap="type = t"
        >
          <text>{{ tr(t) }}</text>
        </view>
      </view>

      <text class="block-title block-title--gap">{{ tr("具体意见") }}</text>
      <textarea
        class="textarea"
        v-model="content"
        maxlength="500"
        :placeholder="tr('描述你遇到的问题或建议，运营会在后台回复')"
      />
      <text class="counter">{{ content.length }}/500</text>

      <input class="input" v-model="contact" :placeholder="tr('联系方式（选填，方便回访）')" />

      <view class="submit" :class="{ 'submit--disabled': submitting }" @tap="submit">
        <text>{{ submitting ? tr("提交中…") : tr("提交反馈") }}</text>
      </view>
    </view>

    <view class="card history">
      <text class="block-title">{{ tr("我的反馈") }}</text>
      <view v-if="!list.length" class="history__empty">
        <text>{{ tr("还没有提交过反馈") }}</text>
      </view>
      <view v-for="f in list" :key="f.id" class="item">
        <view class="item__head">
          <text class="item__type">{{ tr(f.type) }}</text>
          <text class="item__tag" :class="{ 'item__tag--done': f.status === 1 }">
            {{ f.status === 1 ? tr("已处理") : tr("待处理") }}
          </text>
        </view>
        <text class="item__content">{{ f.content }}</text>
        <text class="item__time">{{ f.time }}</text>
        <view v-if="f.reply" class="item__reply">
          <text class="item__reply-label">{{ tr("官方回复（{n}）").replace("{n}", f.handler) }}</text>
          <text class="item__reply-text">{{ f.reply }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.feedback {
  padding: 24rpx;
}

.block-title {
  font-size: 28rpx;
  font-weight: 700;

  &--gap {
    display: block;
    margin-top: 28rpx;
  }
}

.types {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 16rpx;
}

.types__item {
  padding: 12rpx 28rpx;
  border-radius: 32rpx;
  background: #f5f6f3;
  color: $text-sub;
  font-size: 26rpx;

  &--on {
    background: $green-bg;
    color: $green;
    font-weight: 600;
  }
}

.textarea {
  width: 100%;
  height: 200rpx;
  margin-top: 16rpx;
  padding: 20rpx;
  box-sizing: border-box;
  border-radius: $radius-sm;
  background: #f7f8f6;
  font-size: 26rpx;
  line-height: 1.6;
}

.counter {
  display: block;
  text-align: right;
  font-size: 22rpx;
  color: $text-sub;
  margin-top: 8rpx;
}

.input {
  width: 100%;
  height: 88rpx;
  margin-top: 16rpx;
  padding: 0 20rpx;
  box-sizing: border-box;
  border: 1rpx solid $line-2;
  border-radius: $radius-lg;
  background: $green-soft;
  font-size: 26rpx;
}

.submit {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  margin-top: 32rpx;
  border-radius: $radius-lg;
  background: $green;
  color: #f7f3e6;
  font-size: 30rpx;
  font-weight: 600;

  &--disabled {
    opacity: 0.6;
  }
}

.history {
  margin-top: 24rpx;
}

.history__empty {
  padding: 40rpx 0;
  text-align: center;
  font-size: 26rpx;
  color: $text-sub;
}

.item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f1ee;

  &:last-child {
    border-bottom: none;
  }
}

.item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item__type {
  font-size: 26rpx;
  font-weight: 600;
}

.item__tag {
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  background: #fdf3e2;
  color: $brown;
  font-size: 22rpx;

  &--done {
    background: $green-bg;
    color: $green;
  }
}

.item__content {
  font-size: 26rpx;
  line-height: 1.6;
  color: $text-main;
}

.item__time {
  font-size: 22rpx;
  color: $text-sub;
}

.item__reply {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  margin-top: 8rpx;
  padding: 20rpx;
  border-radius: $radius-sm;
  background: #f7f8f6;
}

.item__reply-label {
  font-size: 22rpx;
  color: $green;
}

.item__reply-text {
  font-size: 26rpx;
  line-height: 1.6;
  color: $text-main;
}
</style>
