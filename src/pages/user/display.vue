<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import NavBar from "@/components/NavBar.vue";
import {
  DEFAULT_PREFS,
  applyPrefs,
  cacheThemes,
  fetchRemotePrefs,
  fetchThemes,
  loadPrefs,
  pushRemotePrefs,
  savePrefs,
  type AppearancePrefs,
  type ThemeOption,
} from "@/utils/appearance";
import { setLang, tr } from "@/utils/i18n";

const prefs = ref<AppearancePrefs>(loadPrefs());
const themes = ref<ThemeOption[]>([]);

const ZH = {
  title: "外观",
  care: "关怀模式",
  careDesc: "{{ L.careDesc }}",
  theme: "主题",
  mode: "明暗模式",
  font: "字体风格",
  text: "文字大小",
  scale: "界面缩放",
  width: "内容宽度",
  lang: "语言",
  light: "浅色", dark: "深色", auto: "跟随系统",
  serif: "宋体标题", sans: "全无衬线",
  sm: "小", md: "标准", lg: "大", xl: "特大",
  compact: "紧凑", loose: "宽松",
  narrow: "窄", wide: "宽",
  reset: "{{ L.reset }}",
  note: "{{ L.note }}",
};
const EN = {
  title: "Appearance",
  care: "Care mode",
  careDesc: "Larger type, higher contrast and easier taps — comfortable for elders.",
  theme: "Theme",
  mode: "Light / Dark",
  font: "Font style",
  text: "Text size",
  scale: "UI scale",
  width: "Content width",
  lang: "Language",
  light: "Light", dark: "Dark", auto: "System",
  serif: "Serif titles", sans: "All sans",
  sm: "S", md: "M", lg: "L", xl: "XL",
  compact: "Compact", loose: "Relaxed",
  narrow: "Narrow", wide: "Wide",
  reset: "Reset appearance",
  note: "Preferences are saved on this device. Theme and care mode sync to your account and apply immediately.",
};
const L = computed(() => (prefs.value.lang === "en" ? EN : ZH));

const THEME_EN: Record<string, string> = {
  forest: "Pine Green",
  spring: "Spring Teal",
  clay: "Warm Clay",
  plum: "Dusk Plum",
  indigo: "Night Indigo",
  gold: "Harvest Gold",
  rose: "Camellia",
};
const themeName = (t: ThemeOption) => (prefs.value.lang === "en" ? THEME_EN[t.code] || t.name : t.name);

const modes = computed<{ v: AppearancePrefs["mode"]; label: string }[]>(() => [
  { v: "light", label: L.value.light },
  { v: "dark", label: L.value.dark },
  { v: "auto", label: L.value.auto },
]);
const fonts = computed<{ v: AppearancePrefs["fontStyle"]; label: string }[]>(() => [
  { v: "serif", label: L.value.serif },
  { v: "sans", label: L.value.sans },
]);
const texts = computed<{ v: AppearancePrefs["textSize"]; label: string }[]>(() => [
  { v: "sm", label: L.value.sm },
  { v: "md", label: L.value.md },
  { v: "lg", label: L.value.lg },
  { v: "xl", label: L.value.xl },
]);
const scales = computed<{ v: AppearancePrefs["uiScale"]; label: string }[]>(() => [
  { v: "sm", label: L.value.compact },
  { v: "md", label: L.value.md },
  { v: "lg", label: L.value.loose },
]);
const widths = computed<{ v: AppearancePrefs["contentWidth"]; label: string }[]>(() => [
  { v: "narrow", label: L.value.narrow },
  { v: "standard", label: L.value.md },
  { v: "wide", label: L.value.wide },
]);
const langs = computed<{ v: AppearancePrefs["lang"]; label: string }[]>(() => [
  { v: "zh", label: "简体中文" },
  { v: "en", label: "English" },
]);

onMounted(async () => {
  applyPrefs(prefs.value);
  try {
    const remote = await fetchRemotePrefs();
    if (remote) {
      prefs.value = {
        ...prefs.value,
        themeCode: remote.themeCode || prefs.value.themeCode,
        elder: typeof remote.elder === "boolean" ? remote.elder : prefs.value.elder,
      };
      savePrefs(prefs.value);
    }
  } catch {
    /* 未登录时只保留本地偏好 */
  }
  try {
    themes.value = await fetchThemes();
    cacheThemes(themes.value);
    applyPrefs(prefs.value);
  } catch {
    /* 主题接口异常时用本地缓存 */
  }
});

function update(patch: Partial<AppearancePrefs>) {
  prefs.value = { ...prefs.value, ...patch };
  savePrefs(prefs.value);
  if ("themeCode" in patch || "elder" in patch) pushRemotePrefs(prefs.value);
  if ("lang" in patch && patch.lang) setLang(patch.lang);
}

function onElder(e: any) {
  update({ elder: !!e.detail.value });
}

function reset() {
  prefs.value = { ...DEFAULT_PREFS };
  savePrefs(prefs.value);
  pushRemotePrefs(prefs.value);
}
</script>

<template>
  <view class="page">
    <NavBar :title="L.title" />

    <view class="wrap">
      <!-- 关怀模式 -->
      <view class="hero-card">
        <view class="hero-card__text">
          <text class="hero-card__title">{{ L.care }}</text>
          <text class="hero-card__desc">{{ tr("更大的字、更高的对比度、更好点按，给长辈也能顺手用") }}</text>
        </view>
        <switch :checked="prefs.elder" color="#2f5d43" @change="onElder" />
      </view>

      <!-- 主题 -->
      <text class="group-label">{{ L.theme }}</text>
      <scroll-view class="themes" scroll-x :show-scrollbar="false">
        <view class="themes__inner">
          <view
            v-for="t in themes"
            :key="t.code"
            class="theme"
            :class="{ 'theme--on': prefs.themeCode === t.code }"
            @tap="update({ themeCode: t.code })"
          >
            <view
              class="theme__swatch"
              :style="{ background: `linear-gradient(135deg, ${t.primaryColor}, ${t.accentColor})` }"
            >
              <text v-if="prefs.themeCode === t.code" class="theme__check">✓</text>
            </view>
            <text class="theme__name">{{ themeName(t) }}</text>
          </view>
        </view>
      </scroll-view>
      <text v-if="themes.length" class="theme-hint">
        {{ themes.find((t) => t.code === prefs.themeCode)?.description || "" }}
      </text>

      <!-- 其余外观项 -->
      <view class="panel">
        <view class="row">
          <text class="row__label">{{ L.mode }}</text>
          <view class="seg">
            <text
              v-for="o in modes"
              :key="o.v"
              class="seg__item"
              :class="{ 'seg__item--on': prefs.mode === o.v }"
              @tap="update({ mode: o.v })"
            >{{ o.label }}</text>
          </view>
        </view>

        <view class="row">
          <text class="row__label">{{ L.font }}</text>
          <view class="seg">
            <text
              v-for="o in fonts"
              :key="o.v"
              class="seg__item"
              :class="{ 'seg__item--on': prefs.fontStyle === o.v }"
              @tap="update({ fontStyle: o.v })"
            >{{ o.label }}</text>
          </view>
        </view>

        <view class="row">
          <text class="row__label">{{ L.text }}</text>
          <view class="seg">
            <text
              v-for="o in texts"
              :key="o.v"
              class="seg__item"
              :class="{ 'seg__item--on': prefs.textSize === o.v }"
              @tap="update({ textSize: o.v })"
            >{{ o.label }}</text>
          </view>
        </view>

        <view class="row">
          <text class="row__label">{{ L.scale }}</text>
          <view class="seg">
            <text
              v-for="o in scales"
              :key="o.v"
              class="seg__item"
              :class="{ 'seg__item--on': prefs.uiScale === o.v }"
              @tap="update({ uiScale: o.v })"
            >{{ o.label }}</text>
          </view>
        </view>

        <view class="row">
          <text class="row__label">{{ L.width }}</text>
          <view class="seg">
            <text
              v-for="o in widths"
              :key="o.v"
              class="seg__item"
              :class="{ 'seg__item--on': prefs.contentWidth === o.v }"
              @tap="update({ contentWidth: o.v })"
            >{{ o.label }}</text>
          </view>
        </view>

        <view class="row">
          <text class="row__label">{{ L.lang }}</text>
          <view class="seg">
            <text
              v-for="o in langs"
              :key="o.v"
              class="seg__item"
              :class="{ 'seg__item--on': prefs.lang === o.v }"
              @tap="update({ lang: o.v })"
            >{{ o.label }}</text>
          </view>
        </view>
      </view>

      <text class="note">{{ tr("外观偏好保存在本机；主题与关怀模式会同步到你的账号。修改后立即生效。") }}</text>
      <view class="reset" @tap="reset"><text>{{ tr("恢复默认外观") }}</text></view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.wrap {
  padding: 8rpx 40rpx calc(80rpx + env(safe-area-inset-bottom));
}

.hero-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  margin-top: 12rpx;
  padding: 30rpx 28rpx;
  border-radius: 32rpx;
  background: $glass-1;
  border: 1rpx solid $glass-edge;
  box-shadow: $glass-shadow;
  backdrop-filter: blur(22px) saturate(175%);
  -webkit-backdrop-filter: blur(22px) saturate(175%);
}

.hero-card__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.hero-card__title {
  font-family: $font-serif;
  font-size: 38rpx;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: $text-main;
}

.hero-card__desc {
  font-size: 21rpx;
  line-height: 1.55;
  color: $text-mute;
}

.group-label {
  display: block;
  margin: 44rpx 2rpx 18rpx;
  font-size: 21rpx;
  letter-spacing: 0.12em;
  color: $text-mute;
}

.themes {
  margin: 0 -40rpx;
  white-space: nowrap;
}

.themes__inner {
  display: inline-flex;
  gap: 22rpx;
  padding: 4rpx 40rpx 8rpx;
}

.theme {
  width: 150rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.theme__swatch {
  width: 110rpx;
  height: 110rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 36rpx -18rpx rgba(16, 36, 26, 0.5), inset 0 2rpx 0 rgba(255, 255, 255, 0.5);
  border: 4rpx solid transparent;
  transition: transform 0.18s $ease;
}

.theme--on .theme__swatch {
  border-color: rgba(255, 255, 255, 0.85);
  transform: scale(1.04);
}

.theme__check {
  color: #fff;
  font-size: 34rpx;
  font-weight: 600;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
}

.theme__name {
  font-size: 21rpx;
  color: $text-sub;
}

.theme--on .theme__name {
  color: $text-main;
  font-weight: 600;
}

.theme-hint {
  display: block;
  margin-top: 8rpx;
  font-size: 19rpx;
  color: $text-mute;
}

.panel {
  margin-top: 40rpx;
  padding: 6rpx 26rpx;
  border-radius: 32rpx;
  background: $glass-1;
  border: 1rpx solid $glass-edge;
  box-shadow: $glass-shadow;
  backdrop-filter: blur(22px) saturate(175%);
  -webkit-backdrop-filter: blur(22px) saturate(175%);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 26rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.5);
}

.row:last-child {
  border-bottom: none;
}

.row__label {
  font-size: 25rpx;
  color: $text-main;
  flex-shrink: 0;
}

.seg {
  display: flex;
  align-items: center;
  padding: 4rpx;
  border-radius: 14rpx;
  background: rgba(255, 255, 255, 0.3);
  border: 1rpx solid rgba(255, 255, 255, 0.55);
}

.seg__item {
  padding: 8rpx 16rpx;
  border-radius: 10rpx;
  font-size: 19rpx;
  color: $text-sub;
  transition: background 0.2s $ease, color 0.2s $ease;
}

.seg__item--on {
  background: rgba(255, 255, 255, 0.9);
  color: $ink;
  font-weight: 600;
  box-shadow: 0 6rpx 14rpx -10rpx rgba(16, 36, 26, 0.45);
}

.note {
  display: block;
  margin: 36rpx 4rpx 0;
  font-size: 19rpx;
  line-height: 1.6;
  color: $text-mute;
}

.reset {
  margin-top: 24rpx;
  padding: 24rpx 0;
  text-align: center;
  border-top: 1rpx solid $line;
  font-size: 22rpx;
  color: $text-sub;
}
</style>
