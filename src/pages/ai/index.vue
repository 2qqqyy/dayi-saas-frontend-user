<script setup lang="ts">
import { ref, nextTick, onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import { QUICK_QUESTIONS } from "@/utils/constants";
import { chatWithAI, getAISuggestions, submitAiFeedback } from "@/api/ai";
import type { AIMessage, AIRecommendationCard } from "@/types/business";
import { go } from "@/utils/navigation";
import { tr } from "@/utils/i18n";

import AppTabBar from "@/components/AppTabBar.vue";
import AppNavbar from "@/components/AppNavbar.vue";

const appStore = useAppStore();

const messages = ref<AIMessage[]>([
  {
    id: "ai-welcome",
    role: "assistant",
    content: tr("你好，我是山野向导。今天想怎么玩？"),
  },
]);
const input = ref("");
const sending = ref(false);
/** 聊天区滚动位置，发送后自动滚到底部 */
const scrollTop = ref(0);
/** 推荐问题来自后台知识库，运营新增知识即在此出现 */
const quickQuestions = ref<string[]>([...QUICK_QUESTIONS]);
/** 一次页面会话共用一个 sessionId，便于后台按会话聚合查看问答 */
const sessionId = ref(`sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

onMounted(async () => {
  try {
    const res = await getAISuggestions();
    if (res.data?.length) quickQuestions.value = res.data;
  } catch {
    // 接口不可用时保留本地兜底问题
  }
});

function cardPath(card: AIRecommendationCard) {
  if (card.path) return card.path;
  const map: Record<string, string> = {
    scenic: "pages/travel/index",
    route: "pages/travel/index",
    homestay: "pages/travel/homestay",
    product: "pages/mall/index",
    picking: "pages/travel/picking",
  };
  return map[card.type] ?? "pages/travel/index";
}

async function send(text?: string) {
  const question = (text ?? input.value).trim();
  if (!question || sending.value) return;
  input.value = "";
  messages.value.push({ id: `u-${Date.now()}`, role: "user", content: question });
  sending.value = true;
  scrollToBottom();
  try {
    const res = await chatWithAI({ message: question, sessionId: sessionId.value });
    if (res.data?.sessionId) sessionId.value = res.data.sessionId;
    messages.value.push(res.data);
  } catch {
    messages.value.push({
      id: `ai-${Date.now()}`,
      role: "assistant",
      content: tr("抱歉，我暂时没有理解你的问题，换个说法试试？"),
    });
  } finally {
    sending.value = false;
    scrollToBottom();
  }
}

/** 每条回答的反馈状态：1 有用 / 0 没用，undefined 表示还没评 */
const fbState = ref<Record<string, number>>({});
const fbBusy = ref(false);

async function onFeedback(m: AIMessage, resolved: boolean) {
  if (fbBusy.value || fbState.value[m.id] !== undefined) return;
  fbBusy.value = true;
  try {
    // 评「没用」同时申请转人工，后台「AI 客服-待跟进」立刻出现这条
    await submitAiFeedback({
      sessionId: m.sessionId || sessionId.value,
      resolved,
      transferred: !resolved,
    });
    fbState.value[m.id] = resolved ? 1 : 0;
    uni.showToast({
      title: resolved ? tr("感谢反馈") : tr("已转人工，稍后为你跟进"),
      icon: "none",
    });
  } catch {
    // 会话不存在等原因由请求拦截器统一提示，按钮保持可点
  } finally {
    fbBusy.value = false;
  }
}

function scrollToBottom() {  nextTick(() => {
    // 按消息数量估算滚动高度，配合 scroll-view 一起生效
    scrollTop.value = messages.value.length * 400;
    uni.pageScrollTo({ scrollTop: 99999, duration: 200 });
  });
}

function ask(q: string) {
  send(q);
}

function goItinerary() {
  go("pages/ai/itinerary");
}
</script>

<template>
  <view class="ai">
    <view class="ai__head" :style="{ paddingTop: appStore.safeAreaTop + 'px' }">
      <AppNavbar :title="tr('山野向导')" :subtitle="tr('今天想怎么玩？')" />
      <view class="ai__toolbar">
        <view class="ai__gen" @tap="go('pages/ai/history')">
          <text>{{ tr("我的问答记录") }}</text>
        </view>
        <view class="ai__gen" @tap="goItinerary">
          <text>{{ tr("生成我的行程") }}</text>
        </view>
      </view>
    </view>

    <!-- 快捷问题 -->
    <view class="ai__quick">
      <view v-for="q in quickQuestions" :key="q" class="ai__chip" @tap="ask(q)">
        <text>{{ tr(q) }}</text>
      </view>
    </view>

    <!-- 聊天区 -->
    <view class="ai__chat">
      <view
        v-for="m in messages"
        :key="m.id"
        class="msg"
        :class="m.role === 'user' ? 'msg--user' : 'msg--ai'"
      >
        <view v-if="m.role === 'assistant'" class="msg__avatar">
          <text class="msg__avatar-mark">青</text>
        </view>
        <view class="msg__bubble">
          <text class="msg__content">{{ m.content }}</text>
          <view v-if="m.cards && m.cards.length" class="msg__cards">
            <view v-for="c in m.cards" :key="c.id" class="rcard" @tap="go(cardPath(c))">
              <image class="rcard__img" :src="c.image" mode="aspectFill" />
              <view class="rcard__info">
                <text class="rcard__title">{{ c.title }}</text>
                <text class="rcard__desc">{{ c.description }}</text>
              </view>
              <view class="rcard__arrow">
                <text class="rcard__arrow-glyph">›</text>
              </view>
            </view>
          </view>
          <text v-if="m.source === 'KB'" class="msg__src">{{ tr("已依据知识库《{n}》作答").replace("{n}", m.category || "") }}</text>
          <text v-else-if="m.resolved === 0" class="msg__src msg__src--pending">{{ tr("未解决 · 已转人工跟进") }}</text>

          <!-- 问答反馈：写 ai_conversation 的 resolved/transferred，后台「AI 客服」解决率与待跟进列表据此统计 -->
          <view v-if="m.role === 'assistant' && m.sessionId" class="msg__fb">
            <text v-if="fbState[m.id] !== undefined" class="msg__fb-done">
              {{ fbState[m.id] ? tr("感谢反馈，已记入服务统计") : tr("已转人工，稍后为你跟进") }}
            </text>
            <view v-else class="msg__fb-row">
              <view class="msg__fb-btn" @tap="onFeedback(m, true)">
                <text>{{ tr("有用") }}</text>
              </view>
              <view class="msg__fb-btn" @tap="onFeedback(m, false)">
                <text>{{ tr("没用") }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 正在思考 -->
      <view v-if="sending" class="msg msg--ai">
        <view class="msg__avatar">
          <text class="msg__avatar-mark">青</text>
        </view>
        <view class="msg__bubble msg__bubble--typing">
          <view class="typing"><i /><i /><i /></view>
        </view>
      </view>
    </view>

    <!-- 输入区 -->
    <view class="ai__input">
      <input
        class="ai__field"
        v-model="input"
        :placeholder="tr('输入你的旅行问题…')"
        confirm-type="send"
        @confirm="send()"
      />
      <view class="ai__send" :class="{ 'ai__send--disabled': !input.trim() }" @tap="send()">
        <text>{{ tr("发送") }}</text>
      </view>
    </view>

    <AppTabBar current="ai" />
  </view>
</template>

<style lang="scss" scoped>
.ai {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.ai__toolbar {
  padding: 0 24rpx 8rpx;
}

.ai__gen {
  display: inline-flex;
  align-items: center;
  padding: 12rpx 24rpx;
  border-radius: 32rpx;
  background: $green-bg;
  color: $green;
  font-size: 26rpx;
}

.ai__quick {
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 16rpx 0;
}

.ai__chip {
  display: inline-flex;
  align-items: center;
  padding: 12rpx 28rpx;
  margin-left: 24rpx;
  border-radius: 32rpx;
  background: #fff;
  color: $text-main;
  font-size: 26rpx;
  border: 1rpx solid #eef1ec;
}

.ai__chip:active {
  background: $green-bg;
  color: $green;
}

.ai__chat {
  flex: 1;
  padding: 24rpx 24rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.msg {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}

.msg--user {
  justify-content: flex-end;
}

.msg--ai {
  justify-content: flex-start;
}

.msg__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: $green-bg;
  flex-shrink: 0;

  .msg__avatar-mark {
    font-family: $font-serif;
    font-size: 32rpx;
    line-height: 1;
    color: $green;
  }
}

.msg__bubble {
  max-width: 78%;
  padding: 20rpx 24rpx;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 2rpx 12rpx rgba(38, 53, 42, 0.04);
}

.msg--ai .msg__bubble {
  border-top-left-radius: 8rpx;
}

.msg--user .msg__bubble {
  background: $green;
  color: #f7f3e6;
  border-top-right-radius: 8rpx;
}

.msg__bubble--typing {
  padding: 24rpx 28rpx;
}

.typing {
  display: flex;
  align-items: center;
  gap: 8rpx;

  i {
    display: block;
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: $green-light;
    animation: typing-bounce 1.2s infinite ease-in-out;

    &:nth-child(2) {
      animation-delay: 0.16s;
    }

    &:nth-child(3) {
      animation-delay: 0.32s;
    }
  }
}

@keyframes typing-bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.45;
  }
  30% {
    transform: translateY(-8rpx);
    opacity: 1;
  }
}

.msg__content {
  font-size: 28rpx;
  line-height: 1.6;
  word-break: break-word;
}

.msg__src {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: $text-sub;
}

.msg__src--pending {
  color: $brown;
}

/* ---- 问答反馈 ---- */
.msg__fb {
  margin-top: 14rpx;
  padding-top: 14rpx;
  border-top: 1rpx solid #f0f1ee;
}

.msg__fb-row {
  display: flex;
  gap: 16rpx;
}

.msg__fb-btn {
  padding: 8rpx 26rpx;
  border-radius: 28rpx;
  background: $green-soft;
  color: $green;
  font-size: 22rpx;
}

.msg__fb-btn:active {
  opacity: 0.7;
}

.msg__fb-done {
  font-size: 22rpx;
  color: $green;
}

.msg__cards {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 16rpx;
}

.rcard {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 12rpx;
  border-radius: $radius-sm;
  background: $cream;
}

.rcard:active {
  background: $green-bg;
}

.rcard__img {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}

.rcard__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  justify-content: center;
  min-width: 0;
}

.rcard__title {
  font-size: 26rpx;
  font-weight: 600;
  color: $text-main;
}

.rcard__desc {
  font-size: 22rpx;
  color: $text-sub;
}

.rcard__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36rpx;
  height: 36rpx;
  flex-shrink: 0;
  color: $text-sub;
}

.rcard__arrow-glyph {
  font-size: 34rpx;
  line-height: 1;
}

.ai__input {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 24rpx;
  padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
  background: #fff;
}

.ai__field {
  flex: 1;
  height: 72rpx;
  padding: 0 28rpx;
  border-radius: 36rpx;
  background: $cream;
  font-size: 28rpx;
}

.ai__send {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 72rpx;
  padding: 0 32rpx;
  border-radius: 36rpx;
  background: $green;
  color: #f7f3e6;
  font-size: 28rpx;

  &--disabled {
    opacity: 0.5;
  }
}
</style>
