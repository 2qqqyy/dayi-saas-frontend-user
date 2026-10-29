<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useUserStore } from "@/stores/user";
import { goBack } from "@/utils/navigation";
import { getStorage } from "@/utils/storage";
import { apiPath } from "@/utils/request";
import { STORAGE_KEYS } from "@/utils/constants";
import { tr } from "@/utils/i18n";

const userStore = useUserStore();
const nickname = ref(userStore.userInfo?.nickname ?? "");
const mobile = ref(userStore.userInfo?.mobile ?? "");
const saving = ref(false);
const uploading = ref(false);

// 以服务端为准回填：其它端或后台改过资料时，进入本页不会看到旧值
onShow(() => {
  if (!userStore.isLogin) return;
  userStore
    .fetchUserInfo()
    .then(() => {
      nickname.value = userStore.userInfo?.nickname ?? "";
      mobile.value = userStore.userInfo?.mobile ?? "";
    })
    .catch(() => {});
});

function chooseAvatar() {
  if (uploading.value || saving.value) return;
  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: (res) => {
      const filePath = res.tempFilePaths[0];
      uploading.value = true;
      uni.showLoading({ title: tr("上传中…"), mask: true });
      uni.uploadFile({
        url: apiPath("/common/upload?biz=avatar"),
        filePath,
        name: "file",
        header: { Authorization: `Bearer ${getStorage<string>(STORAGE_KEYS.token, "")}` },
        success: (up) => {
          uploadAvatarUrl(up.data);
        },
        fail: () => {
          uni.showToast({ title: tr("上传失败，请重试"), icon: "none" });
        },
        complete: () => {
          uploading.value = false;
          uni.hideLoading();
        },
      });
    },
  });
}

async function uploadAvatarUrl(raw: string) {
  try {
    const body = JSON.parse(raw) as { code: number; msg?: string; data?: { url: string } };
    if (body.code !== 200 || !body.data?.url) {
      uni.showToast({ title: body.msg || tr("上传失败"), icon: "none" });
      return;
    }
    await userStore.updateProfile({ avatar: body.data.url });
    uni.showToast({ title: tr("头像已更新"), icon: "success" });
  } catch {
    uni.showToast({ title: tr("上传失败，请重试"), icon: "none" });
  }
}

async function save() {
  if (saving.value) return;
  const name = nickname.value.trim();
  if (!name) {
    uni.showToast({ title: tr("请输入昵称"), icon: "none" });
    return;
  }
  if (name.length > 20) {
    uni.showToast({ title: tr("昵称最长 20 个字符"), icon: "none" });
    return;
  }
  saving.value = true;
  try {
    await userStore.updateProfile({ nickname: name });
    uni.showToast({ title: tr("已保存"), icon: "success" });
    setTimeout(goBack, 500);
  } catch {
    // 昵称超长/为空等具体原因由请求拦截器统一提示，这里不重复弹
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <view class="page">
    <NavBar :title="tr('个人资料')" />
    <view class="profile-card card">
      <view class="profile-card__avatar-wrap" @tap="chooseAvatar">
        <image
          v-if="userStore.userInfo?.avatar"
          class="profile-card__avatar"
          :src="userStore.userInfo?.avatar"
          mode="aspectFill"
        />
        <view v-else class="profile-card__avatar profile-card__avatar--text">
          <text>{{ (userStore.userInfo?.nickname || tr("青"))[0] }}</text>
        </view>
        <view class="profile-card__camera">
          <text class="profile-card__camera-glyph">＋</text>
        </view>
      </view>
      <view class="profile-card__info">
        <text class="profile-card__name">{{ userStore.userInfo?.nickname }}</text>
        <text class="profile-card__level">{{ tr(userStore.userInfo?.level || "") }}</text>
        <text class="profile-card__hint">{{ uploading ? tr("头像上传中…") : tr("点击头像更换") }}</text>
      </view>
    </view>

    <view class="form card">
      <view class="form__item">
        <text class="form__label">{{ tr("昵称") }}</text>
        <input class="form__input" v-model="nickname" maxlength="20" :placeholder="tr('请输入昵称')" />
      </view>
      <view class="form__item">
        <text class="form__label">{{ tr("手机号") }}</text>
        <input class="form__input form__input--muted" :value="mobile" disabled />
      </view>
    </view>
    <text class="tip">{{ tr("手机号是登录账号，暂不支持在此修改；如需更换请联系客服。") }}</text>

    <view class="save" :class="{ 'save--disabled': saving }" @tap="save">
      <text>{{ saving ? tr("保存中…") : tr("保存") }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.profile-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 32rpx;
}

.profile-card__avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: $green-bg;
}

.profile-card__avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.profile-card__camera {
  position: absolute;
  right: -4rpx;
  bottom: -4rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: $green;
  color: #f7f3e6;
  border: 3rpx solid $surface;
}

.profile-card__camera-glyph {
  font-size: 30rpx;
  line-height: 1;
}

.profile-card__hint {
  font-size: 22rpx;
  color: $text-sub;
}

.profile-card__info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.profile-card__name {
  font-size: 32rpx;
  font-weight: 700;
}

.profile-card__level {
  font-size: 24rpx;
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
}

.form__input {
  flex: 1;
  text-align: right;
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

  &--disabled {
    opacity: 0.6;
  }
}

.profile-card__avatar--text {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  font-weight: 700;
  color: $green-dark;
}

.form__input--muted {
  color: $text-sub;
}

.tip {
  display: block;
  margin-top: 16rpx;
  padding: 0 8rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: $text-sub;
}
</style>
