export const APP_NAME = "青梅里";
export const APP_CITY = "成都 · 䢺江";
export const STORAGE_KEYS = {
  token: "user-h5-token",
  user: "user-h5-user",
  cart: "user-h5-cart",
  order: "user-h5-order",
  favorite: "user-h5-favorite",
  address: "user-h5-address",
};

export const TAB_PAGES = [
  "pages/index/index",
  "pages/travel/index",
  "pages/mall/index",
  "pages/ai/index",
  "pages/user/index",
];

export const QUICK_QUESTIONS = [
  "帮我规划一天青梅旅行",
  "哪里适合带孩子？",
  "附近有什么民宿？",
  "想泡温泉放松一下",
  "现在适合采摘吗？",
  "有什么特色农产品？",
];

export const ORDER_STATUS_TABS = [
  { label: "全部", value: "all" },
  { label: "待付款", value: "pending_payment" },
  { label: "待使用", value: "pending_use" },
  { label: "待发货", value: "pending_delivery" },
  { label: "待收货", value: "pending_receive" },
  { label: "已完成", value: "completed" },
  { label: "售后", value: "after_sale" },
] as const;
