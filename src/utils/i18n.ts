import { reactive } from "vue";
import { loadPrefs, savePrefs } from "@/utils/appearance";

export const i18n = reactive({ lang: (loadPrefs().lang === "en" ? "en" : "zh") as "zh" | "en" });

/**
 * 以中文原文为 key 的界面词条：页面里直接 tr("我的收藏")。
 * 只翻界面固定文案，接口下发的景点/商品名称保持原文。
 */
const EN: Record<string, string> = {
  "我的": "Me",
  "登录 / 注册": "Sign in / Sign up",
  "保存你的路线与山居订单": "Save your routes and stays",
  "青梅里用户": "Qingmei traveler",
  "山野旅行家": "Trail traveler",
  "我的订单": "My orders",
  "全部": "All",
  "待付款": "To pay",
  "待使用": "To use",
  "待收货": "To receive",
  "售后": "After-sales",
  "我的收藏": "Favorites",
  "景点 / 民宿 / 商品 / 路线": "Sights, stays, goods, routes",
  "收货地址": "Addresses",
  "管理常用地址": "Manage delivery addresses",
  "个人资料": "Profile",
  "头像与昵称": "Avatar and nickname",
  "山野攻略": "Field guides",
  "游玩路线与体验分享": "Routes and stories",
  "外观": "Appearance",
  "关怀模式 · 主题 · 字体与字号": "Care mode, theme, type",
  "设置": "Settings",
  "退出登录": "Sign out",
  "青梅里 · 成都邛崃䢺江镇": "Qingmei Valley · Chujiang, Chengdu",
  "回到山野，": "Back to the valley,",
  "慢一点。": "slow down.",
  "登录后保存路线、采摘预约与山居订单": "Sign in to keep routes, picking bookings and stays",
  "手机号": "Phone",
  "请输入手机号": "Enter your phone number",
  "验证码": "Code",
  "请输入验证码": "Enter the code",
  "获取验证码": "Get code",
  "登录": "Sign in",
  "登录中…": "Signing in…",
  "还没有账号？去注册": "No account? Sign up",
  "我已阅读并同意": "I have read and agree to the",
  "《用户协议》": "Terms of Service",
  "与": "and",
  "《隐私政策》": "Privacy Policy",
};


/** 全站界面文案（中文原文 → 英文）；接口内容不在此列 */
const EN_ALL: Record<string, string> = {
  "首页": "Home", "旅行": "Travel", "商城": "Shop", "我的": "Me",
  "搜索目的地 / 景点 / 青梅好物": "Search places, sights and goods",
  "搜索景点 / 路线 / 体验": "Search sights, routes, experiences",
  "搜索青梅好物": "Search goods",
  "推荐路线": "Featured routes", "山野住与玩": "Stay & play", "农产品商城": "Farm shop",
  "村务公告": "Notices", "查看全部公告": "All notices", "置顶": "Pinned",
  "山野导览": "Valley guide", "采摘预约": "Picking", "民宿预订": "Stays", "乡村好物": "Farm goods",
  "热门景点": "Popular sights", "山野导览地图": "Valley map", "查看导览图": "Open map",
  "更多": "More", "全部": "All", "全部好物": "All goods", "全部订单": "All orders",
  "今日推荐": "Today's pick", "农家好物": "Farm picks", "乡村礼盒": "Gift box",
  "商品详情": "Product", "已选": "Selected", "件": "pcs", "商品介绍": "About",
  "规格参数": "Specs", "产地": "Origin", "所属商家": "Merchant", "购买须知": "Before you buy",
  "相关推荐": "You may also like", "加入购物车": "Add to cart", "立即购买": "Buy now",
  "购物车": "Cart", "收藏": "Save", "已售": "Sold", "已售罄": "Sold out", "缺货": "Out of stock",
  "去结算": "Checkout", "合计": "Total", "运费": "Shipping", "实付": "Paid", "总计": "Total",
  "订单": "Orders", "订单详情": "Order detail", "我的订单": "My orders",
  "待付款": "To pay", "待发货": "To ship", "待收货": "To receive", "待使用": "To use",
  "已完成": "Completed", "售后": "After-sales", "退款": "Refund", "退款中": "Refunding",
  "已退款": "Refunded", "已取消": "Cancelled", "申请退款": "Request refund",
  "取消订单": "Cancel order", "确认收货": "Confirm receipt", "去支付": "Pay now",
  "数量": "Qty", "库存": "Stock", "价格": "Price", "小计": "Subtotal",
  "收货地址": "Address", "新增地址": "Add address", "默认": "Default", "编辑": "Edit",
  "删除": "Delete", "保存": "Save", "取消": "Cancel", "确定": "OK", "返回": "Back",
  "个人资料": "Profile", "昵称": "Nickname", "头像": "Avatar", "手机号": "Phone",
  "设置": "Settings", "退出登录": "Sign out", "登录": "Sign in", "注册": "Sign up",
  "我的收藏": "Favorites", "山野攻略": "Guides", "外观": "Appearance",
  "加载中": "Loading", "暂无数据": "No data", "加载失败": "Failed to load", "重新加载": "Retry",
  "空": "Empty", "山野向导": "Valley guide", "发送": "Send", "开始规划": "Plan a trip",
  "工作台": "Workbench", "今日经营数据": "Today", "待处理事项": "To-dos", "快捷功能": "Shortcuts",
  "今日订单": "Today's orders", "近 7 日营业额": "Last 7 days", "经营": "Business",
  "消息": "Messages", "发货": "Ship", "核销": "Verify", "结算": "Settlement",
  "结算提现": "Withdraw", "商品管理": "Products", "新增场次": "New session",
  "订单核销": "Verify order", "经营数据": "Analytics",
  "采摘详情": "Picking details", "青梅采摘": "Plum picking", "选择场次": "Choose a session",
  "预约日期": "Date", "预约场次": "Session", "请选择场次": "Select a session",
  "已约满": "Fully booked", "活动介绍": "About", "注意事项": "Good to know", "退款规则": "Refund policy",
  "暂无可预约场次": "No sessions available", "立即预约": "Book now", "人起": "per person",
  "暂无采摘园": "No orchards yet", "去发现一些好玩的地方吧": "Go find something fun nearby",
  "去旅行": "Explore",
  "该日期暂无可预约场次，约满场次不在下拉列表中": "No sessions on this date. Fully booked sessions are hidden.",
  "平台客服电话（可代联果园）": "Platform support (orchard contact)",
  "档期查询、改约、团体包场与现场问题可致电平台客服，由客服代为联系果园":
    "Call us for availability, rescheduling, group bookings or on-site help — we'll contact the orchard for you.",
  "该场次已约满，请选择其他时间": "This session is full. Please choose another time.",
  "请先选择可预约的场次": "Please choose an available session first.",
  "剩余 {n} 个名额": "{n} spots left", "已约 {n} 人": "{n} booked", "余 {n} 名": "{n} left",
  "周日": "Sun", "周一": "Mon", "周二": "Tue", "周三": "Wed", "周四": "Thu", "周五": "Fri", "周六": "Sat",
  "分": "pts", "人": "people",
  "预约人数": "Guests", "联系人": "Contact", "请输入姓名": "Enter a name",
  "提交订单": "Place order", "提交中…": "Submitting…", "加载中…": "Loading…",
  "请填写联系人": "Please enter a contact name", "请填写正确的手机号": "Please enter a valid phone number",
  "超出剩余名额": "Exceeds the remaining spots", "下单失败，请重试": "Order failed. Please try again.",
  "提交前想改场次或人数，可致电平台客服，由客服代为同步给果园":
    "Need to change the session or party size? Call platform support and we'll update the orchard for you.",
  "平台客服电话": "Platform support", "青梅里平台客服": "Qingmei Support",
  "预订、改期、退订与现场问题都可以打这个电话，由平台客服代为联系对应商家":
    "Call us for bookings, changes, refunds or on-site help — we'll contact the merchant for you.",
  "每日 08:30 - 20:00": "Daily 08:30 - 20:00",
  "客服微信": "WeChat", "（点击复制）": " (tap to copy)", "拨打": "Call",
  "已选规格": "Selected", "用户评价": "Reviews", "好评率": "Positive", "有用": "Helpful",
  "选择规格": "Choose options", "规格": "Option",
  "该商品暂无可选规格": "No options are available for this product.",
  "已加入购物车": "Added to cart", "已收藏": "Saved", "已取消收藏": "Removed from favorites",
  "发货与物流进度可致电平台客服跟进": "Call support for shipping and tracking updates",
  "平台客服电话（可代联商家）": "Platform support (merchant contact)",
  "发货、改地址、退换与批量采购可致电平台客服，由客服代为联系商家":
    "Call us for shipping, address changes, returns or bulk orders — we'll contact the merchant for you.",
  "搜索景点 / 采摘园 / 民宿 / 路线": "Search sights, orchards, stays and routes",
  "导览图加载中…": "Loading the valley map…", "导览图加载失败": "Failed to load the map",
  "青梅里山野导览图": "Qingmei Valley map", "景点分布 · 导览路线 · 公共设施": "Sights · routes · facilities",
  "可住": "Sleeps", "晚": "night", "入住日期": "Check-in", "退房日期": "Check-out",
  "入住人": "Guest name", "请填写入住人": "Please enter the guest name",
  "退房日期需晚于入住日期": "Check-out must be after check-in",
  "路线详情": "Route details", "建议时长": "Suggested time", "全程距离": "Distance",
  "体力强度": "Effort", "最佳时段": "Best season", "适合谁": "Who it's for",
  "路线亮点": "Highlights", "完整行程": "Itinerary", "费用包含": "What's included",
  "出行提示": "Good to know", "途经点位": "Stops along the way", "停留": "Stay",
  "导览图": "Map", "咨询与预约": "Ask & book", "路线咨询与预约": "Route enquiries & booking",
  "客服电话暂未配置，可在「意见反馈」里留言，我们会尽快联系你。":
    "Support phone is not configured yet. Leave a message in Feedback and we'll get back to you.",
  "拨打客服电话 {phone}？": "Call support at {phone}?",
  "研学课堂与果园采摘需提前 1 天锁定场次，可在「采摘预约」里直接选日期与场次。":
    "Workshops and orchard picking need to be booked one day ahead — choose a date and session under Picking.",
  "再看看": "Not now", "拨号已取消": "Call cancelled",
  "该点位请在导览图中查看": "Open this spot on the valley map",
  "平台客服电话（可代联向导）": "Platform support (guide contact)",
  "成团、包团、研学排期与天气顺延可致电平台客服，由客服代为联系带队向导":
    "Call us for group bookings, workshop dates or weather changes — we'll contact the guide for you.",
  "订单不存在": "Order not found", "可能已被删除": "It may have been removed",
  "返回订单": "Back to orders", "下单时间": "Placed at", "实付金额": "Amount paid",
  "确认订单": "Confirm order", "没有待结算商品": "Nothing to check out",
  "去逛逛": "Browse", "添加收货地址": "Add a delivery address", "配送方式": "Delivery",
  "顺丰速运（乡村直发）": "SF Express (shipped from the village)",
  "景点详情": "Sight details", "景点介绍": "About", "开放时间": "Opening hours",
  "地址": "Address", "咨询电话": "Phone", "导航": "Directions",
  "民宿详情": "Stay details", "在线选房": "Choose a room", "该房型已订满，请选择其他房型":
    "This room type is fully booked. Please choose another.",
  "行程规划": "Trip planner", "旅行日期": "Travel date", "出行人数": "Travelers",
  "旅行类型": "Trip type", "生成中…": "Generating…", "生成我的行程": "Plan my trip",
  "注册青梅里": "Join Qingmei", "创建账号，收藏你的山野记忆": "Create an account and keep your valley memories",
  "注册成功": "Welcome aboard",
  "意见反馈": "Feedback", "反馈类型": "Type", "具体意见": "Your feedback",
  "描述你遇到的问题或建议，运营会在后台回复": "Describe the issue or idea — our team will reply",
  "联系方式（选填，方便回访）": "Contact details (optional, for follow-up)",
  "提交反馈": "Submit feedback", "请至少写 5 个字": "Please write at least 5 characters",
  "反馈已提交": "Feedback submitted",
  "编辑地址": "Edit address", "收货人": "Recipient", "所在地区": "Region",
  "详细地址": "Street address",
  "发现山野与青梅": "Discover the valley and its plums",
  "值得一去的山野去处": "Places worth the walk",
  "把乡村的味道带回家": "Bring the countryside home",
  "青梅成熟季 · 现摘现发": "Plum season · picked and shipped fresh",
  "新鲜青梅 · 青梅干 · 青梅酒，果园直发": "Fresh plums, dried plums and plum wine, straight from the orchard",
  "今天想怎么玩？": "What shall we do today?",
  "已依据知识库《{n}》作答": "Answered from the knowledge base “{n}”",
  "未解决 · 已转人工跟进": "Unresolved · passed to our team",
  "感谢反馈，已记入服务统计": "Thanks — feedback recorded",
  "已转人工，稍后为你跟进": "Passed to our team — we'll follow up",
  "没用": "Not helpful",
  "点击头像更换": "Tap to change", "头像上传中…": "Uploading…",  "青": "Q", "青梅里": "Qingmei",
  "䢺江畔": "by the Chujiang River",
  "山野有时，": "The valley has its seasons,",
  "青梅正好。": "and the plums are just right.",
  "住乡野 · 吃在地好物 · 把日子过慢一点": "Stay in the country · eat local · slow down a little",
  "还没有收货地址": "No delivery address yet", "添加一个常用地址吧": "Add your usual address",
  "已默认": "Default", "设为默认": "Set as default",
  "购物车还是空的": "Your cart is empty", "商品已失效": "This item is no longer available",
  "全选": "Select all",
  "攻略详情": "Guide", "攻略不存在": "Guide not found", "该攻略可能已被后台下架":
    "This guide may have been taken down", "看全部攻略": "All guides", "阅读": "reads",
  "支付": "Payment", "支付成功": "Payment successful",
  "订单创建成功，请等待商家确认": "Order placed — the merchant will confirm shortly",
  "查看订单": "View order", "支付金额": "Amount due",
  "本演示为模拟支付，不产生真实扣款。": "This is a demo payment. No real charge is made.",
  "山里的安排、节令与提醒，都在这里。": "Schedules, seasons and reminders from the valley.",
  "重试": "Retry", "暂时没有公告": "No notices yet", "有新消息会第一时间放在这里":
    "New updates will appear here first", "公告详情": "Notice", "换一条公告看看": "Read another notice",
  "搜索好物": "Search goods", "搜索青梅酒 / 青梅干 / 农家蜂蜜": "Search plum wine, dried plums, honey",
  "搜索": "Search", "搜索中…": "Searching…", "没有找到相关好物": "No matching goods",
  "换个关键词试试吧": "Try another keyword", "去商城逛逛": "Browse the shop",
  "暂无攻略": "No guides yet", "后台还没有发布攻略内容":
    "No guides have been published yet",
  "特色民宿": "Country stays", "暂无民宿": "No stays yet",
  "商品分类": "Categories", "该分类暂无商品": "No goods in this category", "去商城": "Go to shop",
  "选择地区": "Choose region", "完成": "Done",
  "暂无相关订单": "No orders yet",
  "还没有收藏内容": "Nothing saved yet", "移除": "Remove",
  "恢复默认外观": "Reset appearance",
  "更大的字、更高的对比度、更好点按，给长辈也能顺手用":
    "Larger type, stronger contrast and easier taps — comfortable for every generation",
  "外观偏好保存在本机；主题与关怀模式会同步到你的账号。修改后立即生效。":
    "Appearance is saved on this device; theme and care mode sync to your account. Changes apply instantly.",
  "成都 · 邛崃 · 䢺江镇": "Chengdu · Qionglai · Chujiang",
  "成都 · 䢺江": "Chengdu · Chujiang",
  "摘一篮青梅，住一晚山居": "Pick a basket of plums, stay a night in the valley",
  "全程": "Total",
  "暂未配置坐标": "No coordinates yet", "该景点还没有配置坐标": "This sight has no coordinates yet",
  "当前环境不支持打开地图": "Maps are not available in this environment",
  "暂无咨询电话": "No phone number",
  "可留言给客服，或在「意见反馈」里描述你的问题": "Message support or describe the issue in Feedback",
  "该景点未留电话": "No sight phone number",
  "拨打平台客服电话 {phone}？": "Call platform support at {phone}?",
  "详细介绍": "Details", "语音讲解": "Audio guide", "附近推荐": "Nearby",
  "查看更多点位": "See more places", "咨询": "Contact",
  "设施与服务": "Amenities", "预订须知": "Before you book", "住客评价": "Guest reviews",
  "仅剩 {n} 间可订": "{n} rooms left", "已订满": "Fully booked", "立即预订": "Book now",
  "该民宿还没有真实住客评价，入住后可在「我的订单」里评价。":
    "No guest reviews yet. You can review it after your stay under My orders.",
  "各家民宿的入住时间、取消政策与加床规则略有差异，下单前请以订单页的商家说明为准；需要接站、加床或延住可联系平台客服代为确认。":
    "Check-in times, cancellation policies and extra-bed rules vary by stay. Please follow the merchant notes at checkout; call support for pickups, extra beds or extensions.",
  "平台客服电话（可代联民宿）": "Platform support (stay contact)",
  "房态、加床、接站与延住可致电平台客服，由客服代为联系民宿管家":
    "Call us for room availability, extra beds, pickups or extensions — we'll contact the host for you.",
  "导览点位 · 主题路线 · 服务设施": "Spots · routes · facilities",
  "{s} 个点位分布 · {r} 条导览路线 · {f} 处设施": "{s} spots · {r} routes · {f} facilities",
  "采摘体验": "Picking experiences", "亲手摘下青梅": "Pick plums by hand",
  "在山野住一晚": "A night in the valley",
  "{n} 条主题路线，玩法各不一样": "{n} themed routes, each with its own pace",
  "示意图 · 非实际比例": "Schematic · not to scale", "导览路线": "Routes", "点位分类": "Categories",
  "复位": "Reset", "双指缩放 · 拖动平移 · 双击复位": "Pinch to zoom · drag to pan · double-tap to reset",
  "景点分布": "Sights", "共 {n} 个点位 · 点击可看详情": "{n} places · tap for details",
  "可预约": "Bookable", "{n} 条主题线路，可按体力自由选择": "{n} themed routes for every energy level",
  "途经": "Via", "在导览图上查看": "View on map",
  "设施说明": "Facilities", "共 {n} 处服务点": "{n} service points",
  "导览图为示意图，实际步行距离以现场指示牌为准；青梅季与节假日的观光车班次请以游客中心公告为主。":
    "The map is schematic; follow on-site signs for actual walking distances. Shuttle times during plum season and holidays are posted at the visitor centre.",
  "营业中": "Open", "休息中": "Closed", "可用服务": "Available services",
  "咨询预约": "Enquire", "查看详情": "View details", "知道了": "Got it",
  "该点位为服务点，暂无独立详情页": "This is a service point with no separate details page.",
  "导航到 {name}": "Directions to {name}",
  "距游客中心约 {distance}，园区内可换乘观光车或步行前往。":
    "About {distance} from the visitor centre; take the shuttle or walk within the park.",
  "园区内可换乘观光车或步行前往，具体距离以现场指示牌为准。":
    "Take the shuttle or walk within the park; follow on-site signs for distances.",
  "该点位暂无语音讲解": "No audio guide for this place yet.",
  "景点": "Sights", "采摘园": "Orchards", "手工作坊": "Craft workshops", "餐饮": "Food",
  "产地直供 · 品质溯源": "Direct from the source · traceable quality",
  "把青梅味道打包送人": "A gift box of Qingmei flavours",
  "请先登录": "Please sign in", "订单加载失败，请稍后重试": "Could not load orders. Please try again.",
  "核销码": "Redemption code", "物流信息": "Tracking", "订单状态": "Status",
  "返回订单列表": "Back to orders", "商品金额": "Items", "包邮": "Free shipping",
  "实付款": "Total paid", "订单备注": "Order note", "选填，给卖家留言": "Optional note for the merchant",
  "发货时间、改地址、开发票等需求可致电平台客服，由客服代为联系商家":
    "Call us for shipping times, address changes or invoices — we'll contact the merchant for you.",
  "入住人数": "Guests", "入住人姓名": "Guest name", "联系手机": "Phone",
  "入住晚数": "Nights", "房费": "Room rate", "应付总额": "Total", "应付": "Total",
  "提交预订": "Book now",
  "想加床、要接站或改期，可致电平台客服，由客服代为同步给民宿管家":
    "Need an extra bed, a pickup or a date change? Call support and we'll update the host for you.",
  "订单已取消": "Order cancelled", "取消失败，请稍后重试": "Could not cancel. Please try again.",
  "已确认收货": "Receipt confirmed", "操作失败，请稍后重试": "Something went wrong. Please try again.",
  "请填写退款原因": "Please give a reason for the refund",
  "退款申请已提交，请等待处理": "Refund request submitted — we'll process it shortly",
  "退款被拒": "Refund declined",
  "商品加载失败": "Could not load the product", "请先添加收货地址": "Please add a delivery address",
  "去挑选一些乡村好物吧": "Pick some countryside favourites",
  "确定删除该商品吗？": "Remove this item?", "请先选择商品": "Please select an item first",
  "提示": "Notice", "请输入关键词": "Enter a keyword", "去看看其他好物吧": "Browse other goods",
  "微信支付": "WeChat Pay", "推荐使用微信支付": "Recommended", "支付宝": "Alipay",
  "使用支付宝付款": "Pay with Alipay", "余额支付": "Balance", "使用青梅里余额": "Use your Qingmei balance",
  "支付中…": "Paying…",
  "查看全部攻略": "All guides",
  "请填写收货人": "Please enter the recipient", "请填写详细地址": "Please enter the street address",
  "已保存": "Saved", "确定删除该地址吗？": "Delete this address?", "已删除": "Deleted",
  "已设为默认": "Set as default", "街道、门牌号等": "Street, building, unit…",
  "设为默认地址": "Set as default address", "保存地址": "Save address",
  "请输入昵称": "Enter a nickname", "昵称最长 20 个字符": "Nickname must be 20 characters or fewer",
  "功能建议": "Feature idea", "订单问题": "Order issue", "内容纠错": "Content correction", "其他": "Other",
  "我的反馈": "My feedback", "还没有提交过反馈": "No feedback submitted yet",
  "已处理": "Resolved", "待处理": "Pending", "官方回复（{n}）": "Official reply ({n})",
  "商品": "Goods", "路线": "Routes",
  "查看全部订单": "View all orders", "管理常用地址": "Manage your addresses",
  "头像与昵称": "Avatar and nickname", "确定退出登录吗？": "Sign out?", "已退出登录": "Signed out",
  "请输入正确的手机号": "Enter a valid phone number",
  "验证码已发送（演示：123456）": "Code sent (demo: 123456)",
  "验证码发送失败，请稍后重试": "Could not send the code. Please try again.",
  "验证码发送失败，请重试": "Could not send the code. Please try again.",
  "《{title}》完整内容正在完善中，如有疑问请联系客服。":
    "The full {title} is being finalised. Contact support if you have questions.",
  "我知道了": "Got it", "请先阅读并同意用户协议": "Please read and accept the terms first",
  "登录成功": "Signed in", "上传中…": "Uploading…", "上传失败，请重试": "Upload failed. Please try again.",
  "上传失败": "Upload failed", "头像已更新": "Avatar updated", "保存中…": "Saving…",
  "手机号是登录账号，暂不支持在此修改；如需更换请联系客服。":
    "Your phone number is your sign-in ID and cannot be changed here. Contact support to update it.",
  "请先同意用户协议与隐私政策": "Please accept the Terms and Privacy Policy",
  "已有账号？去登录": "Already have an account? Sign in",
  "我已阅读并同意《用户协议》和《隐私政策》": "I have read and agree to the Terms of Service and Privacy Policy",
  "账号与安全": "Account & security", "手机号、登录密码": "Phone and password",
  "提交问题与建议，查看官方回复": "Send feedback and read official replies",
  "清除缓存": "Clear cache", "清理本地缓存数据": "Remove local cache", "关于青梅里": "About Qingmei",
  "版本信息": "Version", "缓存已清理": "Cache cleared",
  "将清理收藏、地址、购物车、订单的本地缓存（登录状态保留），并重新从服务器拉取。确定继续吗？":
    "This clears local favorites, addresses, cart and orders (you stay signed in) and reloads them from the server. Continue?",
  "青梅里 v1.0.0\n乡村旅游 · 青梅采摘 · 民宿体验 · 农产品商城 · 在线客服":
    "Qingmei v1.0.0\nCountry travel · Plum picking · Stays · Farm shop · Support",
  "用户协议": "Terms of Service", "隐私政策": "Privacy Policy",
  "输入你的旅行问题…": "Ask about your trip…",
  "你好，我是山野向导。今天想怎么玩？": "Hi, I'm your valley guide. What shall we do today?",
  "抱歉，我暂时没有理解你的问题，换个说法试试？":
    "Sorry, I didn't quite catch that. Could you rephrase?",
  "感谢反馈": "Thanks for the feedback", "保存行程": "Save trip", "查看完整路线": "View full route",
  "还没有生成行程": "No trip planned yet",
  "选好日期、人数和旅行类型，点上方按钮，向导会为你安排一天的路线":
    "Choose a date, party size and trip type, then tap the button — your guide will plan a day for you.",
  "亲子": "Family", "情侣": "Couple", "朋友": "Friends", "家庭": "Family group", "独自旅行": "Solo",
  "行程已生成": "Trip generated", "生成失败，请稍后重试": "Could not generate the trip. Please try again.",
  "行程已保存": "Trip saved", "保存失败，请稍后重试": "Could not save. Please try again.",
  "帮我规划一天青梅旅行": "Plan a day trip around the plums",
  "哪里适合带孩子？": "Where is good for kids?",
  "附近有什么民宿？": "What stays are nearby?",
  "想泡温泉放松一下": "I'd like to relax in a hot spring",
  "现在适合采摘吗？": "Is it picking season now?",
  "有什么特色农产品？": "What local farm produce do you have?",
  "晚起": "night from", "音频加载失败": "Could not load the audio",
  "加载失败，请稍后重试": "Failed to load. Please try again.", "公告": "Notices",
  "公告不存在": "Notice not found", "商品不存在": "Product not found",
  "村务提醒": "Village notice", "山野活动": "Valley events", "服务通知": "Service notice",
  "系统通知": "System notice",

  // 消息中心 / 足迹 / 评价 / 复购 / 协议
  "消息中心": "Messages",
  "发货 / 退款 / 核销进展": "Shipping, refund and check-in updates",
  "全部已读": "Mark all read",
  "暂无消息": "No messages yet",
  "发货、退款、核销的进展会在这里通知你": "Shipping, refund and check-in updates will appear here",
  "查看订单 ›": "View order ›",
  "我的足迹": "Footprint",
  "看过的景点与商品": "Sights and goods you viewed",
  "清空": "Clear",
  "清空足迹": "Clear footprint",
  "清空后不可恢复，确定吗？": "This cannot be undone. Continue?",
  "还没有足迹": "No footprint yet",
  "去景点或商城逛逛，看过的会记在这里": "Browse sights or the mall and your views will be saved here",
  "评价": "Review",
  "提交评价": "Submit review",
  "写点体验感受吧": "Share your experience",
  "评价成功": "Review submitted",
  "我的评价": "My review",
  "再次购买": "Buy again",
  "商品已下架": "This product is off shelf",
  "商家拒绝原因": "Reason from the merchant",
  "商家未填写具体原因": "No reason was given",
  "如有疑问可通过「我的-意见反馈」联系平台介入": "Contact the platform via Me - Feedback if you need help",
  "协议与说明": "Policies",
  "原因": "Reason",
  "如有疑问可通过「我的-工单」联系平台介入": "Contact the platform via Me - Support tickets if you need help",
  "工单不存在或无权查看": "Ticket not found or not yours",
  "提交失败": "Could not submit",
  "提交失败，请重试": "Could not submit. Please try again.",
  "点此重试": "Tap to retry",
  "立即支付": "Pay now",
  "退款已完成": "Refund completed",
  "营业时间": "Opening hours",
  "退款说明": "Refund policy",
  "我的问答记录": "My chat history",
  "问答历史": "Q&A history",
  "保存的行程": "Saved trips",
  "还没有问答记录": "No Q&A yet",
  "去向导问一句，记录会存在这里": "Ask the guide and your chats will be kept here",
  "还没有保存的行程": "No saved trips yet",
  "生成的行程点保存后会出现在这里": "Trips you save from the guide appear here",
  "暂无行程正文": "No trip content",
  "页面走丢了": "Page not found",
  "链接可能已失效，或者网络开小差了。回首页继续逛吧。": "This link may be broken or the network dropped. Head back home.",
  "返回首页": "Back to home",
  "客服与工单": "Support & tickets",
  "售后 · 退款纠纷 · 投诉建议": "After-sales, refund disputes, complaints",
  "售后咨询": "Contact support",
  "发起工单": "New ticket",
  "工单详情": "Ticket detail",
  "关闭工单": "Close ticket",
  "售后问题": "After-sales",
  "退款纠纷": "Refund dispute",
  "投诉商家": "Complaint",
  "其他咨询": "Other",
  "处理中": "In progress",
  "已解决": "Resolved",
  "已关闭": "Closed",
  "订单问题、售后协商、投诉建议都可以在这里发起": "Order issues, after-sales and complaints all start here",
  "暂无工单": "No tickets yet",
  "遇到问题可以点右上角发起工单": "Tap New ticket when something goes wrong",
  "标题（可不填）": "Title (optional)",
  "请描述具体情况，例如订单号、时间、遇到的问题": "Describe the issue: order number, time, what happened",
  "请描述遇到的问题": "Please describe the issue",
  "提交": "Submit",
  "已提交": "Submitted",
  "发送中…": "Sending…",
  "补充说明或回复…": "Add details or reply…",
  "发送失败": "Could not send",
  "我": "Me",
  "客服": "Support",
  "确认问题已经解决？关闭后仍可查看记录。": "Is the issue resolved? You can still read the record after closing.",
};
const RULES: [RegExp, string][] = [
  [/^已售\s*(\d+)/, "Sold $1"],
  [/^共\s*(\d+)\s*件/, "$1 items"],
  [/^(\d+)\s*阅读$/, "$1 reads"],
];

let observer: MutationObserver | null = null;
let translating = false;

function translateTextNode(node: Text) {
  const raw = node.nodeValue || "";
  const key = raw.trim();
  if (!key) return;
  const hit = EN_ALL[key] || (i18n.lang === "en" ? EN[key] : "");
  if (hit) {
    node.nodeValue = raw.replace(key, hit);
    return;
  }
  for (const [re, rep] of RULES) {
    if (re.test(key)) {
      node.nodeValue = raw.replace(key, key.replace(re, rep));
      return;
    }
  }
}

export function translateDom() {
  // #ifdef H5
  if (i18n.lang !== "en" || translating) return;
  translating = true;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  nodes.forEach(translateTextNode);
  translating = false;
  // #endif
}

export function startAutoTranslate() {
  // #ifdef H5
  if (i18n.lang !== "en") return;
  translateDom();
  if (observer) return;
  observer = new MutationObserver(() => translateDom());
  observer.observe(document.body, { childList: true, subtree: true });
  // #endif
}

export function tc(zh: string, en?: string): string {
  return i18n.lang === "en" && en ? en : zh;
}

export function tr(zh: string): string {
  return i18n.lang === "en" ? EN[zh] || EN_ALL[zh] || zh : zh;
}

export function setLang(lang: "zh" | "en") {
  const prev = i18n.lang;
  i18n.lang = lang;
  const p = loadPrefs();
  savePrefs({ ...p, lang });
  // #ifdef H5
  if (prev !== lang) location.reload();
  // #endif
}
