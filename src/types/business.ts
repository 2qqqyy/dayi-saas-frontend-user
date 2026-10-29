export type OrderType = "picking" | "homestay" | "product";
export type OrderStatus =
  | "all"
  | "pending_payment"
  | "pending_use"
  | "pending_delivery"
  | "pending_receive"
  | "completed"
  | "after_sale";

export type FavoriteType = "scenic" | "homestay" | "product" | "route";
export type MapCategory = "scenic" | "picking" | "homestay" | "craft" | "food";
export type PaymentMethod = "wechat" | "alipay" | "balance";

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface UserInfo {
  id: string;
  nickname: string;
  mobile: string;
  avatar: string;
  level: string;
}

export interface FavoriteItem {
  /** 组合键 `fav-{type}-{targetId}`，详情页据此判断是否已收藏 */
  id: string;
  type: FavoriteType;
  title: string;
  subtitle: string;
  image: string;
  /** favorite.target_id，收藏对象在业务表里的数字主键 */
  targetId?: string;
  /** favorite.id，取消收藏要按它删库；本地新增成功前为空 */
  rowId?: string;
}

export interface AddressItem {
  id: string;
  name: string;
  mobile: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault: boolean;
}

export interface ScenicItem {
  nameEn?: string;
  summaryEn?: string;
  id: string;
  /** scenic 表主键：对外 id 可能是 scenic-1 这类编码，写收藏/导航要用数字主键 */
  dbId?: number;
  name: string;
  image: string;
  location: string;
  distance: string;
  rating: number;
  tags: string[];
  summary: string;
  /** 景点详细介绍，后台维护；为空时详情页不展示 */
  intro?: string;
  openTime: string;
  audioUrl: string;
  audioUrlEn?: string;
  audioText?: string;
  audioTextEn?: string;
  /** 联系电话，后台「景点管理」维护，空表示未提供 */
  phone?: string;
  lat?: number;
  lng?: number;
}

export interface RouteStop {
  id: string;
  /** 建议到达时间 */
  time: string;
  title: string;
  /** 该站点图片 */
  image: string;
  desc: string;
  /** 建议停留时长 */
  stay: string;
  /** 距上一站距离 */
  distance: string;
  /** 站点类型标签，如「自然课堂」「午餐」 */
  tag: string;
}

export interface TravelRoute {
  titleEn?: string;
  summaryEn?: string;
  id: string;
  /** travel_route 表主键，收藏与后台联动用 */
  dbId?: number;
  title: string;
  /** 路线副标题，用于卡片与详情页头部 */
  subtitle: string;
  image: string;
  /**
   * 配图的嵌入方式：
   * - 缺省 / "cover"：按相框比例放大铺满（aspectFill），普通横版实拍图用这个；
   * - "contain"：整图完整嵌入相框、不裁切不拉伸（aspectFit），配 imageRatio 使用，
   *   相框会按图片自身比例生成，框即相框，适合竖版插画 / 海报。
   */
  imageFit?: "cover" | "contain";
  /** 选择 "contain" 时图片自身的宽高比（宽 / 高），用于生成与之等比例的相框 */
  imageRatio?: number;
  duration: string;
  distance: string;
  /** 体力强度 */
  difficulty: string;
  /** 最佳出行时段 */
  bestTime: string;
  /** 一句话主题，说明这条路线到底玩什么 */
  summary: string;
  /** 适合人群 */
  suits: string[];
  /** 路线亮点 */
  highlights: string[];
  /** 费用包含 / 服务包含 */
  includes: string[];
  /** 出行提示 */
  tips: string[];
  /** 途经站点名称（卡片摘要用） */
  stops: string[];
  /** 完整行程 */
  itinerary: RouteStop[];
}

export interface PickingSession {
  id: string;
  /** 档期日期（如 09-22），无数据时为空串 */
  date: string;
  /** 档期完整日期（YYYY-MM-DD），下单时要与后端 slotDate 对齐 */
  fullDate: string;
  time: string;
  price: number;
  remain: number;
  booked: number;
}

export interface PickingItem {
  id: string;
  orchardName: string;
  orchardNameEn?: string;
  image: string;
  address: string;
  addressEn?: string;
  distance: string;
  rating: number;
  summary: string;
  summaryEn?: string;
  notices: string[];
  noticesEn?: string[];
  refundRule: string;
  refundRuleEn?: string;
  sessions: PickingSession[];
}

export interface RoomType {
  id: string;
  name: string;
  image: string;
  capacity: number;
  bedType: string;
  breakfast: string;
  price: number;
  remain: number;
}

export interface HomestayItem {
  nameEn?: string;
  summaryEn?: string;
  id: string;
  name: string;
  image: string;
  address: string;
  rating: number;
  tags: string[];
  summary: string;
  facilities: string[];
  roomTypes: RoomType[];
}

export interface ProductSku {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface ProductReview {
  id: string;
  user: string;
  /** 头像底色，用首字做头像 */
  avatarColor: string;
  rating: number;
  date: string;
  /** 该用户购买的具体规格 */
  spec: string;
  content: string;
  /** 评价关键词 */
  tags: string[];
  likes: number;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface MerchantBrief {
  id: string;
  name: string;
  rating: number;
  intro: string;
  address: string;
  openTime?: string;
  shopNotice?: string;
}

export interface ProductItem {
  nameEn?: string;
  summaryEn?: string;
  id: string;
  name: string;
  image: string;
  summary: string;
  price: number;
  sales: number;
  stock: number;
  origin: string;
  category: string;
  /** 所属商家名称 */
  merchantName?: string;
  /** 商家详情，仅商品详情接口返回 */
  merchant?: MerchantBrief | null;
  skus: ProductSku[];
  /** 详情页轮播图，全部为与该商品真实对应的图片 */
  gallery: string[];
  /** 卖点标签 */
  sellingPoints: string[];
  /** 商品介绍，逐段展示 */
  description: string[];
  /** 规格参数 */
  specs: ProductSpec[];
  /** 保存方式与购买须知 */
  notices: string[];
  /** 用户评价 */
  reviews: ProductReview[];
  /** 评价总数（含未展示的短评） */
  reviewCount: number;
  /** 好评率 */
  goodRate: string;
}

export interface CartItem {
  id: string;
  productId: string;
  skuId: string;
  name: string;
  image: string;
  summary: string;
  price: number;
  quantity: number;
  stock: number;
  selected: boolean;
  invalid?: boolean;
}

export interface OrderItem {
  id: string;
  type: OrderType;
  status: OrderStatus;
  /** 后端原始状态（refunding / shipped / cancelled 等）；status 是收敛后的展示态 */
  rawStatus?: string;
  title: string;
  subtitle: string;
  amount: number;
  image: string;
  createdAt: string;
  extra: Record<string, any>;
  /** 商家拒绝退款等原因备注 */
  remark?: string;
}

/** AI 推荐卡片类型：在收藏类型基础上补充采摘园 */
export type AIRecommendationType = FavoriteType | "picking";

export interface AIRecommendationCard {
  id: string;
  type: AIRecommendationType;
  title: string;
  description: string;
  image: string;
  /** 后端下发的落地页路径（带真实 id），优先于按类型推断 */
  path?: string;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  cards?: AIRecommendationCard[];
  /** 会话 id，多轮问答共用，后台按会话聚合 */
  sessionId?: string;
  /** 命中的问题分类，如「行程规划」 */
  category?: string;
  /** KB 命中知识库 / RULE 规则兜底 */
  source?: string;
  resolved?: number;
}

export interface ItineraryStop {
  id: string;
  time: string;
  title: string;
  image: string;
  description: string;
  distance: string;
  /** 建议停留时长 */
  stay?: string;
  /** 站点标签，如「午餐」「观景」 */
  tag?: string;
}

export interface ItineraryPlan {
  id: string;
  title: string;
  date: string;
  type: string;
  people: number;
  stops: ItineraryStop[];
  /** ai_itinerary 主键，保存行程时回传 */
  recordId?: number;
  routeId?: string;
  routePath?: string;
  summary?: string;
  difficulty?: string;
  bestTime?: string;
  tips?: string[];
}

/** ===== 山野导览图 ===== */

/** 导览点位（景点 / 采摘园 / 民宿 / 手工作坊 / 餐饮） */
export interface GuideSpot {
  /** 与业务数据一致的 id，可直接跳详情 */
  id: string;
  /** 导览图编号，如「1」「2」 */
  code: string;
  name: string;
  category: MapCategory;
  /** 在导览图坐标系（0-750 × 0-980）中的位置 */
  x: number;
  y: number;
  image: string;
  summary: string;
  distance: string;
  open: boolean;
  bookable: boolean;
  /** 该点位可用的服务设施，如「卫生间 / 休息点」 */
  service: string;
}

export type FacilityType =
  | "center"
  | "parking"
  | "toilet"
  | "medical"
  | "rest"
  | "shop";

/** 导览图上的公共服务设施 */
export interface GuideFacility {
  id: string;
  type: FacilityType;
  name: string;
  /** 设施说明 */
  desc: string;
  x: number;
  y: number;
}

/** 导览路线（导览图上的彩色线路） */
export interface GuideRoute {
  id: string;
  /** 关联的路线详情 id，可跳转 */
  routeId: string;
  name: string;
  color: string;
  /** 线路说明 */
  desc: string;
  /** 折线坐标串，直接用于 svg polyline */
  points: string;
  /** 途经点位编号 */
  viaCodes: string[];
  length: string;
  duration: string;
  /** 建议步行强度 */
  level: string;
}

export interface GuideData {
  spots: GuideSpot[];
  facilities: GuideFacility[];
  routes: GuideRoute[];
  /** 分类与设施的展示文案，随导览数据一起由接口下发 */
  labels?: {
    category: Record<string, string>;
    facility: Record<string, string>;
  };
  /** 底图路网折线坐标串（环乡道 / 溪谷支路） */
  roads?: {
    ring: string;
    trail: string;
  };
}
