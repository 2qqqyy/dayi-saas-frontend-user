import type {
  AddressItem,
  CartItem,
  FavoriteItem,
  FavoriteType,
  HomestayItem,
  OrderItem,
  OrderStatus,
  OrderType,
  PickingItem,
  PickingSession,
  ProductItem,
  RoomType,
  UserInfo,
} from "@/types/business";

/** 后端分页结构 { list, total, page, pageSize } */
export interface BackendPage<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function toStr(v: unknown): string {
  return v == null ? "" : String(v);
}

/** 图片地址为空时回退到内置占位图，避免 <image> 渲染成空白块 */
export const FALLBACK_IMAGE =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA0MDAgMzAwJz48cmVjdCB3aWR0aD0nNDAwJyBoZWlnaHQ9JzMwMCcgZmlsbD0nI2VlZjFlYycvPjxnIGZpbGw9JyM4ZDljODgnIHRleHQtYW5jaG9yPSdtaWRkbGUnIGZvbnQtZmFtaWx5PSdNaWNyb3NvZnQgWWFIZWksQXJpYWwsc2Fucy1zZXJpZic+PHRleHQgeD0nMjAwJyB5PScxNDInIGZvbnQtc2l6ZT0nMzAnIGZvbnQtd2VpZ2h0PSdib2xkJz7pnZLmooXph4w8L3RleHQ+PHRleHQgeD0nMjAwJyB5PScxODAnIGZvbnQtc2l6ZT0nMTknPuaaguaXoOWbvueJhzwvdGV4dD48L2c+PC9zdmc+";

export function toImg(v: unknown): string {
  return toStr(v) || FALLBACK_IMAGE;
}

export function fmtDate(v: unknown): string {
  const s = toStr(v);
  // 后端 ISO 串带 T，直接截断会显示成 2026-10-21T09:22
  return s ? s.slice(0, 16).replace("T", " ") : "";
}

/** 逗号/顿号分隔的字符串或数组 → 字符串数组 */
export function splitList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(toStr).filter(Boolean);
  const s = toStr(v);
  if (!s) return [];
  return s
    .split(/[,，、;；]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/* ==================== 订单 ==================== */

function mapStatus(s: string): OrderStatus {
  switch (s) {
    case "pending_payment":
    case "pending_use":
    case "pending_delivery":
    case "pending_receive":
    case "completed":
      return s;
    case "shipped":
    case "shipping":
      return "pending_receive";
    case "refunded":
    case "refund_rejected":
    case "refunding":
      return "after_sale";
    default:
      return "after_sale";
  }
}

function mapType(t: number): OrderType {
  if (t === 1) return "picking";
  if (t === 2) return "homestay";
  return "product";
}

export interface BackendOrderRow {
  order: {
    id: number;
    type: number;
    status: string;
    title: string;
    subtitle: string;
    coverImage: string;
    amount: number | string;
    createTime: string;
  };
  picking?: {
    pickDate?: string;
    contactName?: string;
    contactMobile?: string;
    verifyCode?: string;
  };
  homestay?: {
    checkIn?: string;
    checkOut?: string;
    guestName?: string;
    guestMobile?: string;
  };
  product?: {
    addressSnapshot?: string;
    logisticsNo?: string;
    logisticsCompany?: string;
  };
}

export function mapOrder(row: BackendOrderRow): OrderItem {
  const o = row.order;
  const extra: Record<string, string> = {};
  if (row.picking) {
    extra.date = toStr(row.picking.pickDate);
    extra.contactName = toStr(row.picking.contactName);
    extra.contactMobile = toStr(row.picking.contactMobile);
    extra.verifyCode = toStr(row.picking.verifyCode);
  }
  if (row.homestay) {
    extra.checkIn = toStr(row.homestay.checkIn);
    extra.checkOut = toStr(row.homestay.checkOut);
    extra.guestName = toStr(row.homestay.guestName);
    extra.guestMobile = toStr(row.homestay.guestMobile);
  }
  if (row.product) {
    extra.address = toStr(row.product.addressSnapshot);
    extra.logistics = row.product.logisticsNo
      ? `${toStr(row.product.logisticsCompany)} ${toStr(row.product.logisticsNo)}`
      : "";
  }
  if (Array.isArray((row as any).items)) {
    extra.items = (row as any).items;
  }
  return {
    id: toStr(o.id),
    type: mapType(o.type),
    status: mapStatus(o.status),
    rawStatus: toStr(o.status),
    remark: toStr((o as any).remark || (o as any).cancelReason),
    title: toStr(o.title),
    subtitle: toStr(o.subtitle),
    amount: toNum(o.amount),
    // 订单/收藏/购物车会被写入 localStorage，这里必须存后端原值，
    // 占位图交由渲染处兜底，否则占位用的 data URI 会被持久化甚至回传后端。
    image: toStr(o.coverImage),
    createdAt: fmtDate(o.createTime),
    extra,
  };
}

/** 下单接口直接返回订单实体，包装成行结构复用 mapOrder */
export function mapOrderEntity(o: BackendOrderRow["order"]): OrderItem {
  return mapOrder({ order: o });
}

/* ==================== 民宿 ==================== */

export function mapRoom(r: {
  id: number;
  name: string;
  image: string;
  capacity: number;
  bedType: string;
  breakfast: string;
  price: number | string;
  stock: number;
}): RoomType {
  return {
    id: toStr(r.id),
    name: toStr(r.name),
    image: toImg(r.image),
    capacity: toNum(r.capacity),
    bedType: toStr(r.bedType),
    breakfast: toStr(r.breakfast),
    price: toNum(r.price),
    remain: toNum(r.stock),
  };
}

export function mapHomestay(item: {
  homestay: {
    id: number;
    name: string;
    coverImage: string;
    address: string;
    rating: number | string;
    tags?: string;
    intro?: string;
    facilities?: string;
  };
  rooms?: Parameters<typeof mapRoom>[0][];
}): HomestayItem {
  const h = item.homestay;
  return {
    id: toStr(h.id),
    name: toStr(h.name),
    nameEn: toStr((h as any).nameEn),
    summaryEn: toStr((h as any).summaryEn),
    image: toImg(h.coverImage),
    address: toStr(h.address),
    rating: toNum(h.rating),
    tags: splitList(h.tags),
    summary: toStr(h.intro),
    facilities: splitList(h.facilities),
    roomTypes: (item.rooms || []).map(mapRoom),
  };
}

/* ==================== 采摘 ==================== */

export function mapSession(s: {
  id: number;
  slotDate?: string;
  timeRange: string;
  price: number | string;
  maxPeople: number;
  bookedCount: number;
}): PickingSession {
  // slotDate 形如 "2026-09-22"，截取 MM-DD 用于卡片展示
  const rawDate = toStr(s.slotDate);
  return {
    id: toStr(s.id),
    date: rawDate.length >= 10 ? rawDate.slice(5, 10) : rawDate,
    fullDate: rawDate,
    time: toStr(s.timeRange),
    price: toNum(s.price),
    remain: Math.max(0, toNum(s.maxPeople) - toNum(s.bookedCount)),
    booked: toNum(s.bookedCount),
  };
}

export function mapOrchard(item: {
  orchard: {
    id: number;
    name: string;
    nameEn?: string;
    coverImage: string;
    address: string;
    addressEn?: string;
    rating: number | string;
    intro?: string;
    summaryEn?: string;
    notices?: string;
    noticesEn?: string;
    refundRule?: string;
    refundRuleEn?: string;
  };
  sessions?: Parameters<typeof mapSession>[0][];
}): PickingItem {
  const o = item.orchard;
  return {
    id: toStr(o.id),
    orchardName: toStr(o.name),
    orchardNameEn: toStr(o.nameEn),
    image: toImg(o.coverImage),
    address: toStr(o.address),
    addressEn: toStr(o.addressEn),
    distance: "",
    rating: toNum(o.rating),
    summary: toStr(o.intro),
    summaryEn: toStr(o.summaryEn),
    notices: splitList(o.notices),
    noticesEn: splitList(o.noticesEn),
    refundRule: toStr(o.refundRule),
    refundRuleEn: toStr(o.refundRuleEn),
    sessions: (item.sessions || []).map(mapSession),
  };
}

/* ==================== 商品 ==================== */

export interface BackendProductRow {
  product: {
    id: number;
    name: string;
    coverImage: string;
    images?: string;
    summary?: string;
    detail?: string;
    price: number | string;
    origin?: string;
    sales: number;
    categoryId?: number;
  };
  skus?: {
    id: number;
    name: string;
    price: number | string;
    stock: number;
  }[];
  merchantName?: string;
  merchant?: {
    id: number;
    name: string;
    rating?: number | string;
    intro?: string;
    address?: string;
  };
}

export function mapProduct(item: BackendProductRow, categoryName?: string): ProductItem {
  const p = item.product;
  const skus = (item.skus || []).map((s) => ({
    id: toStr(s.id),
    name: toStr(s.name),
    nameEn: toStr((s as any).nameEn),
    summaryEn: toStr((s as any).summaryEn),
    price: toNum(s.price),
    stock: toNum(s.stock),
  }));
  const images = splitList(p.images);
  const gallery = images.length ? images : [toImg(p.coverImage)];
  const detailText = toStr(p.detail);
  const description = detailText
    ? detailText
        .split(/\n+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [toStr(p.summary)].filter(Boolean);
  const skuNames = skus.map((s) => s.name);
  const merchantName = toStr(item.merchantName);
  return {
    id: toStr(p.id),
    name: toStr(p.name),
    nameEn: toStr((p as any).nameEn),
    image: toImg(p.coverImage),
    summary: toStr(p.summary),
    summaryEn: toStr((p as any).summaryEn),
    price: skus.length ? skus[0].price : toNum(p.price),
    sales: toNum(p.sales),
    stock: skus.reduce((a, s) => a + s.stock, 0),
    origin: toStr(p.origin),
    category: categoryName || toStr(p.categoryId),
    merchantName,
    merchant: item.merchant
      ? {
          id: toStr(item.merchant.id),
          name: toStr(item.merchant.name),
          rating: toNum(item.merchant.rating),
          intro: toStr(item.merchant.intro),
          address: toStr(item.merchant.address),
        }
      : null,
    skus,
    gallery,
    sellingPoints: [toStr(p.summary)].filter(Boolean),
    description,
    specs: [
      { label: "产地", value: toStr(p.origin) },
      { label: "规格", value: skuNames.join(" / ") || "默认" },
      { label: "发货", value: toStr(p.origin) ? `${toStr(p.origin)} 直发` : "以商家发货地为准" },
    ],
    notices: [
      "发货时效以商家确认为准，山区物流可能略有延迟",
      "生鲜类商品签收时请当面验视外观与重量",
      "有质量问题可在「意见反馈」留言或致电平台客服处理",
    ],
    reviews: [],
    reviewCount: 0,
    goodRate: "—",
  };
}

/* ==================== 用户 ==================== */

export function mapUserInfo(u: {
  id: number;
  mobile: string;
  nickname: string;
  avatar: string;
  level?: string;
}): UserInfo {
  return {
    id: toStr(u.id),
    mobile: toStr(u.mobile),
    nickname: toStr(u.nickname),
    avatar: toStr(u.avatar),
    level: toStr(u.level) || "普通会员",
  };
}

export function mapAddress(a: {
  id: number;
  receiver: string;
  mobile: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault?: number | boolean;
}): AddressItem {
  return {
    id: toStr(a.id),
    name: toStr(a.receiver),
    mobile: toStr(a.mobile),
    province: toStr(a.province),
    city: toStr(a.city),
    district: toStr(a.district),
    detail: toStr(a.detail),
    isDefault: typeof a.isDefault === "boolean" ? a.isDefault : toNum(a.isDefault) === 1,
  };
}

/**
 * 服务端收藏行 → 前端收藏项。
 * id 统一成详情页写入时用的组合键 `fav-{type}-{targetId}`，
 * 否则本地新增的收藏和接口下发的收藏两套 id，重新进入页面时星标丢失。
 */
export function mapFavorite(f: {
  id: number;
  targetId: number;
  type: string;
  title: string;
  subtitle: string;
  image: string;
}): FavoriteItem {
  const type = toStr(f.type) as FavoriteType;
  const targetId = toStr(f.targetId);
  return {
    id: `fav-${type}-${targetId}`,
    targetId,
    rowId: toStr(f.id),
    type,
    title: toStr(f.title),
    subtitle: toStr(f.subtitle),
    image: toStr(f.image),
  };
}

export function mapCartItem(c: {
  id: number;
  productId: number;
  skuId: number;
  quantity: number;
  selected: number | boolean;
  productName: string;
  image: string;
  skuName: string;
  price: number | string;
  stock?: number;
}): CartItem {
  return {
    id: toStr(c.id),
    productId: toStr(c.productId),
    skuId: toStr(c.skuId),
    name: toStr(c.productName),
    image: toStr(c.image),
    summary: toStr(c.skuName),
    price: toNum(c.price),
    quantity: toNum(c.quantity),
    stock: toNum(c.stock) || 99,
    selected: typeof c.selected === "boolean" ? c.selected : toNum(c.selected) === 1,
  };
}
