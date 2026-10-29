<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { ref, onUnmounted } from "vue";
import { useUserStore } from "@/stores/user";
import { sendSmsCode } from "@/api/user";
import { go } from "@/utils/navigation";
import { tr } from "@/utils/i18n";

const userStore = useUserStore();

const mobile = ref("");
const code = ref("");
const nickname = ref("");
const agree = ref(false);
const countdown = ref(0);
const submitting = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

function sendCode() {
  if (countdown.value > 0) return;
  if (!/^1\d{10}$/.test(mobile.value)) {
    uni.showToast({ title: tr("请输入正确的手机号"), icon: "none" });
    return;
  }
  sendSmsCode(mobile.value)
    .then(() => {
      uni.showToast({ title: tr("验证码已发送（演示：123456）"), icon: "none" });
      countdown.value = 60;
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        countdown.value -= 1;
        if (countdown.value <= 0 && timer) {
          clearInterval(timer);
          timer = null;
        }
      }, 1000);
    })
    .catch(() => {
      uni.showToast({ title: tr("验证码发送失败，请重试"), icon: "none" });
    });
}

async function onRegister() {
  if (submitting.value) return;
  if (!/^1\d{10}$/.test(mobile.value)) {
    uni.showToast({ title: tr("请输入正确的手机号"), icon: "none" });
    return;
  }
  if (!code.value.trim()) {
    uni.showToast({ title: tr("请输入验证码"), icon: "none" });
    return;
  }
  if (!nickname.value.trim()) {
    uni.showToast({ title: tr("请输入昵称"), icon: "none" });
    return;
  }
  if (!agree.value) {
    uni.showToast({ title: tr("请先同意用户协议与隐私政策"), icon: "none" });
    return;
  }
  submitting.value = true;
  try {
    // 走 /api/auth/register：手机号已注册、验证码错误、后台关闭注册都会被真实拦下
    await userStore.register(mobile.value, code.value, nickname.value.trim());
    uni.showToast({ title: tr("注册成功"), icon: "success" });
    setTimeout(() => go("pages/user/index"), 600);
  } catch {
    // 手机号已注册 / 验证码错误 / 后台关闭注册等原因由请求拦截器统一提示
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <view class="page register">
    <NavBar :title="tr('注册')" />
    <view class="register__brand">
      <text class="register__title">{{ tr("注册青梅里") }}</text>
      <text class="register__subtitle">{{ tr("创建账号，收藏你的山野记忆") }}</text>
    </view>

    <view class="register__form">
      <view class="register__field">
        <input v-model="mobile" type="tel" maxlength="11" :placeholder="tr('请输入手机号')" class="register__input" />
      </view>
      <view class="register__field register__field--code">
        <input v-model="code" type="tel" maxlength="6" :placeholder="tr('请输入验证码')" class="register__input" />
        <view class="register__send" :class="{ 'register__send--disabled': countdown > 0 }" @tap="sendCode">
          <text>{{ countdown > 0 ? countdown + 's' : tr('获取验证码') }}</text>
        </view>
      </view>
      <view class="register__field">
        <input v-model="nickname" :placeholder="tr('请输入昵称')" class="register__input" />
      </view>

      <view class="register__agree" @tap="agree = !agree">
        <view class="register__check" :class="{ active: agree }">
          <text>{{ agree ? '✓' : '' }}</text>
        </view>
        <text class="register__agree-text">{{ tr("我已阅读并同意") }}<text class="register__link" @tap.stop="go('pages/user/policy?type=agreement')">{{ tr("《用户协议》") }}</text>{{ tr("和") }}<text class="register__link" @tap.stop="go('pages/user/policy?type=privacy')">{{ tr("《隐私政策》") }}</text></text>
      </view>

      <view class="register__submit" @tap="onRegister">
        <text>{{ tr("注册") }}</text>
      </view>
      <view class="register__login" @tap="go('pages/user/login')">
        <text>{{ tr("已有账号？去登录") }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.register {
  padding: 40rpx 48rpx;
}

.register__brand {
  margin: 60rpx 0 48rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.register__title {
  font-size: 44rpx;
  font-weight: 800;
}

.register__subtitle {
  font-size: 26rpx;
  color: $text-sub;
}

.register__form {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.register__field {
  display: flex;
  align-items: center;
  height: 88rpx;
  padding: 0 24rpx;
  border: 1rpx solid $line-2;
  border-radius: $radius-lg;
  background: $green-soft;
}

.register__field--code {
  gap: 16rpx;
}

.register__input {
  flex: 1;
  font-size: 30rpx;
  color: $text-main;
}

.register__send {
  flex-shrink: 0;
  font-size: 26rpx;
  color: $green;

  &--disabled {
    color: $text-sub;
  }
}

.register__agree {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 8rpx 0;
}

.register__check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 2rpx solid #d8ddd6;
  color: #fff;
  font-size: 24rpx;
  flex-shrink: 0;

  &.active {
    background: $green;
    border-color: $green;
  }
}

.register__agree-text {
  font-size: 24rpx;
  color: $text-sub;
}

.register__submit {
  margin-top: 16rpx;
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

.register__login {
  text-align: center;
  color: $text-sub;
  font-size: 26rpx;
}
.register__link {
  color: $green;
}

</style>
