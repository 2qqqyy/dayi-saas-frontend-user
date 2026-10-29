<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { ref, onUnmounted } from "vue";
import { tr } from "@/utils/i18n";
import { onLoad } from "@dcloudio/uni-app";
import { useUserStore } from "@/stores/user";
import { useCartStore } from "@/stores/cart";
import { sendSmsCode } from "@/api/user";
import { go } from "@/utils/navigation";
import { assetUrl } from "@/utils/request";

const userStore = useUserStore();
const cartStore = useCartStore();

const mobile = ref("");
const code = ref("");
const countdown = ref(0);
const redirect = ref("");
const heroImg = assetUrl("/static/images/orchard-plum-eco-w169.jpg");
const agreed = ref(false);
const submitting = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

onLoad((options) => {
  redirect.value = (options?.redirect as string) || "";
});

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
      uni.showToast({ title: tr("验证码发送失败，请稍后重试"), icon: "none" });
    });
}

/** 协议/政策入口：跳真实协议页 */
function showPolicy(title: string) {
  const type = title === "隐私政策" ? "privacy" : title === "退款说明" ? "refund" : "agreement";
  go(`pages/user/policy?type=${type}`);
}

async function onLogin() {
  if (!/^1\d{10}$/.test(mobile.value)) {
    uni.showToast({ title: tr("请输入正确的手机号"), icon: "none" });
    return;
  }
  if (!code.value.trim()) {
    uni.showToast({ title: tr("请输入验证码"), icon: "none" });
    return;
  }
  if (!agreed.value) {
    uni.showToast({ title: tr("请先阅读并同意用户协议"), icon: "none" });
    return;
  }
  if (submitting.value) return;
  submitting.value = true;
  try {
    await userStore.login(mobile.value, code.value);
    // 游客期间加购的本地条目补传到 cart_item 表，登录后看到的是同一份购物车
    await cartStore.mergeLocalIntoServer();
    uni.showToast({ title: tr("登录成功"), icon: "success" });
    setTimeout(() => {
      if (redirect.value) go(redirect.value.replace(/^\//, ""));
      else go("pages/user/index");
    }, 600);
  } catch {
    // 手机号未注册 / 验证码错误等原因由请求拦截器统一提示
  } finally {
    submitting.value = false;
  }
}


</script>

<template>
  <view class="login">
    <view class="login__hero">
      <image class="login__hero-bg" :src="heroImg" mode="aspectFill" />
      <view class="login__veil" />
      <view class="login__hero-content" :style="{ paddingTop: 'calc(var(--status-bar-height) + 24rpx)' }">
        <view class="login__wordmark">
          <text class="login__brand">{{ tr("青梅里") }}</text>
          <text class="login__en">QINGMEI VALLEY</text>
        </view>
        <view class="login__spacer" />
        <text class="login__headline">{{ tr("回到山野，") }}</text>
        <text class="login__headline">{{ tr("慢一点。") }}</text>
        <text class="login__sub">{{ tr("登录后保存路线、采摘预约与山居订单") }}</text>
      </view>
    </view>

    <view class="login__sheet">
      <view class="login__field">
        <text class="login__label">{{ tr("手机号") }}</text>
        <input v-model="mobile" type="tel" maxlength="11" :placeholder="tr('请输入手机号')" class="login__input" placeholder-class="login__placeholder" />
      </view>

      <view class="login__field">
        <text class="login__label">{{ tr("验证码") }}</text>
        <input v-model="code" type="tel" maxlength="6" :placeholder="tr('请输入验证码')" class="login__input" placeholder-class="login__placeholder" />
        <view class="login__send" :class="{ 'login__send--disabled': countdown > 0 }" @tap="sendCode">
          <text>{{ countdown > 0 ? countdown + 's' : tr('获取验证码') }}</text>
        </view>
      </view>

      <view class="login__submit" :class="{ 'login__submit--loading': submitting }" @tap="onLogin">
        <text>{{ submitting ? tr("登录中…") : tr("登录") }}</text>
      </view>

      <view class="login__register" @tap="go('pages/user/register')">
        <text>{{ tr("还没有账号？去注册") }}</text>
      </view>

      <!-- 用户协议勾选（合规必需） -->
      <text class="login__foot">{{ tr("成都 · 邛崃 · 䢺江镇") }}</text>

      <view class="login__agree" @tap="agreed = !agreed">
        <view class="login__checkbox" :class="{ active: agreed }">
          <text v-if="agreed">✓</text>
        </view>
        <text class="login__agree-text">
          {{ tr("我已阅读并同意") }}
          <text class="login__link" @tap.stop="showPolicy('用户协议')">{{ tr("《用户协议》") }}</text>
          {{ tr("与") }}
          <text class="login__link" @tap.stop="showPolicy('隐私政策')">{{ tr("《隐私政策》") }}</text>
        </text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.login {
  min-height: 100vh;
  background: $cream;
}

.login__hero {
  position: relative;
  height: 560rpx;
  overflow: hidden;
  background: $ink;
}

.login__hero-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.login__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(10, 12, 12, 0.28), rgba(10, 12, 12, 0.04) 42%, rgba(10, 12, 12, 0.7));
}

.login__hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 40rpx 96rpx;
}

.login__wordmark {
  display: flex;
  align-items: baseline;
  gap: 14rpx;
}

.login__brand {
  font-size: 22rpx;
  font-weight: 600;
  letter-spacing: 0.22em;
  color: rgba(255, 255, 255, 0.94);
}

.login__en {
  font-size: 15rpx;
  letter-spacing: 0.26em;
  color: rgba(201, 219, 154, 0.78);
}

.login__spacer {
  flex: 1;
}

.login__headline {
  font-family: $font-serif;
  font-size: 62rpx;
  font-weight: 500;
  line-height: 1.45;
  letter-spacing: 0.04em;
  color: #fff;
}

.login__sub {
  margin-top: 14rpx;
  font-size: 21rpx;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.74);
}

.login__sheet {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  margin-top: -44rpx;
  min-height: calc(100vh - 516rpx);
  padding: 40rpx 40rpx calc(40rpx + env(safe-area-inset-bottom));
  background: $cream;
  border-radius: 28rpx 28rpx 0 0;
}

.login__field {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 28rpx 0 22rpx;
  border-bottom: 1rpx solid $line;
}

.login__label {
  font-size: 20rpx;
  letter-spacing: 0.06em;
  color: $text-mute;
}

.login__input {
  height: 60rpx;
  font-size: 32rpx;
  color: $text-main;
}

.login__placeholder {
  color: $text-mute;
}

.login__send {
  position: absolute;
  right: 0;
  bottom: 26rpx;
  font-size: 24rpx;
  color: $green;
}

.login__send--disabled {
  color: $text-mute;
}

.login__submit {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  margin-top: 52rpx;
  border-radius: 20rpx;
  background: $green;
  color: #f7f3e6;
  font-size: 30rpx;
  font-weight: 600;
  letter-spacing: 0.04em;
  transition: transform 0.16s $ease, opacity 0.16s $ease;
}

.login__submit:active {
  transform: scale(0.99);
  opacity: 0.92;
}

.login__submit--loading {
  opacity: 0.6;
}

.login__register {
  margin-top: 26rpx;
  text-align: center;
  font-size: 23rpx;
  color: $text-sub;
}

.login__foot {
  margin-top: auto;
  padding-top: 56rpx;
  text-align: center;
  font-size: 18rpx;
  letter-spacing: 0.22em;
  color: $text-mute;
}

.login__agree {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  margin-top: 20rpx;
}

.login__checkbox {
  width: 28rpx;
  height: 28rpx;
  margin-top: 4rpx;
  border-radius: 50%;
  border: 1rpx solid $line-strong;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18rpx;
  color: #fff;
  flex-shrink: 0;
}

.login__checkbox.active {
  background: $green;
  border-color: $green;
}

.login__agree-text {
  font-size: 20rpx;
  line-height: 1.6;
  color: $text-mute;
}

.login__link {
  color: $green;
}
</style>
