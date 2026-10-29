<script setup lang="ts">
import { go } from "@/utils/navigation";
import { loadPrefs } from "@/utils/appearance";

const props = defineProps<{ current: string }>();

interface TabItem {
  key: string;
  label: string;
  path: string;
  icon: string;
  iconActive: string;
}

const tabs: TabItem[] = [
  {
    key: "index",
    label: "首页",
    path: "pages/index/index",
    icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOEE5Mjk2IiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMyAxMC41TDEyIDNsOSA3LjVWMjFoLTZ2LTZIOXY2SDN6Ii8+PC9zdmc+",
    iconActive: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTQxODFBIiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMyAxMC41TDEyIDNsOSA3LjVWMjFoLTZ2LTZIOXY2SDN6Ii8+PC9zdmc+",
  },
  {
    key: "travel",
    label: "旅行",
    path: "pages/travel/index",
    icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOEE5Mjk2IiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMjFhOSA5IDAgMSAwIDAtMTggOSA5IDAgMCAwIDAgMTh6TTE1LjUgOWwtMiA0LTQgMiAyLTQgNC0yeiIvPjwvc3ZnPg==",
    iconActive: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTQxODFBIiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMjFhOSA5IDAgMSAwIDAtMTggOSA5IDAgMCAwIDAgMTh6TTE1LjUgOWwtMiA0LTQgMiAyLTQgNC0yeiIvPjwvc3ZnPg==",
  },
  {
    key: "mall",
    label: "商城",
    path: "pages/mall/index",
    icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOEE5Mjk2IiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNNiA3aDEybDEuMiAxM0g0LjhMNiA3ek05IDdhMyAzIDAgMCAxIDYgMCIvPjwvc3ZnPg==",
    iconActive: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTQxODFBIiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNNiA3aDEybDEuMiAxM0g0LjhMNiA3ek05IDdhMyAzIDAgMCAxIDYgMCIvPjwvc3ZnPg==",
  },
  {
    key: "ai",
    label: "助手",
    path: "pages/ai/index",
    icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOEE5Mjk2IiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjEgMTEuNWE4LjQgOC40IDAgMCAxLTExLjkgNy42TDMgMjFsMS45LTZBOC40IDguNCAwIDEgMSAyMSAxMS41eiIvPjwvc3ZnPg==",
    iconActive: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTQxODFBIiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjEgMTEuNWE4LjQgOC40IDAgMCAxLTExLjkgNy42TDMgMjFsMS45LTZBOC40IDguNCAwIDEgMSAyMSAxMS41eiIvPjwvc3ZnPg==",
  },
  {
    key: "user",
    label: "我的",
    path: "pages/user/index",
    icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOEE5Mjk2IiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMTJhNCA0IDAgMSAwIDAtOCA0IDQgMCAwIDAgMCA4ek00IDIxYzAtNCAzLjYtNiA4LTZzOCAyIDggNiIvPjwvc3ZnPg==",
    iconActive: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTQxODFBIiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMTJhNCA0IDAgMSAwIDAtOCA0IDQgMCAwIDAgMCA4ek00IDIxYzAtNCAzLjYtNiA4LTZzOCAyIDggNiIvPjwvc3ZnPg==",
  },
];

const EN_LABEL: Record<string, string> = {
  index: "Home",
  travel: "Travel",
  mall: "Shop",
  ai: "Assistant",
  user: "Me",
};

function onTap(tab: TabItem) {
  if (tab.key === props.current) return;
  go(tab.path);
}
</script>

<template>
  <view class="tabbar">
    <view
      v-for="tab in tabs"
      :key="tab.key"
      class="tabbar__item"
      @tap="onTap(tab)"
    >
      <view class="tabbar__icon" :class="{ active: tab.key === current }">
        <image
          class="tabbar__img"
          :src="tab.key === current ? tab.iconActive : tab.icon"
          mode="aspectFit"
        />
      </view>
      <text class="tabbar__label" :class="{ active: tab.key === current }">{{ loadPrefs().lang === "en" ? EN_LABEL[tab.key] : tab.label }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.tabbar {
  position: fixed;
  left: 50%;
  bottom: calc(18rpx + env(safe-area-inset-bottom));
  z-index: 100;
  display: flex;
  align-items: center;
  width: calc(100% - 40rpx);
  max-width: 460px;
  height: 112rpx;
  padding: 8rpx;
  transform: translateX(-50%);
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.5);
  border: 1rpx solid rgba(255, 255, 255, 0.72);
  box-shadow: 0 30rpx 70rpx -30rpx rgba(16, 36, 26, 0.55), inset 0 2rpx 0 rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .tabbar { background: rgba(255, 255, 255, 0.9); }
}

.tabbar__item {
  position: relative;
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  border-radius: 24rpx;
  transition: background 0.28s $ease, box-shadow 0.28s $ease;
}

.tabbar__item.active {
  background: rgba(255, 255, 255, 0.58);
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.95), 0 8rpx 20rpx -14rpx rgba(16, 36, 26, 0.45);
}

.tabbar__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44rpx;
  opacity: 0.45;
  transition: opacity 0.24s $ease;
}

.tabbar__icon.active {
  opacity: 1;
}

.tabbar__img {
  width: 44rpx;
  height: 44rpx;
}

.tabbar__label {
  font-size: 20rpx;
  line-height: 1.2;
  color: $text-sub;
  transition: color 0.24s $ease;
}

.tabbar__label.active {
  color: $ink;
  font-weight: 600;
}

.tabbar__badge {
  position: absolute;
  top: -8rpx;
  right: -16rpx;
  min-width: 28rpx;
  height: 28rpx;
  padding: 0 8rpx;
  border-radius: 14rpx;
  background: $price;
  color: #fff;
  font-size: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
