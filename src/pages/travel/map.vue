<script setup lang="ts">
import NavBar from "@/components/NavBar.vue";
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useRequest } from "@/composables/useRequest";
import { getGuideData } from "@/api/travel";
import type { GuideData, GuideFacility, GuideRoute, GuideSpot, MapCategory } from "@/types/business";
import { go } from "@/utils/navigation";
import { tr } from "@/utils/i18n";
import { buildGuideScene, MAP_W, MAP_H } from "@/utils/guideScene";

import SearchBar from "@/components/SearchBar.vue";
import EmptyState from "@/components/EmptyState.vue";
import LoadingState from "@/components/LoadingState.vue";

/** 导览图坐标系（750×980）常量与后端 content/guide.json 的点位坐标一一对应，定义见 utils/guideScene.ts */

const categories: { label: string; value: MapCategory | "all" }[] = [
  { label: "全部", value: "all" },
  { label: "景点", value: "scenic" },
  { label: "采摘园", value: "picking" },
  { label: "民宿", value: "homestay" },
  { label: "手工作坊", value: "craft" },
  { label: "餐饮", value: "food" },
];

const categoryColors: Record<string, string> = {
  scenic: "#2f5d43",
  picking: "#b4552f",
  homestay: "#6e8f74",
  craft: "#7a6a55",
  food: "#a97a2c",
};

const facilityGlyph: Record<string, string> = {
  center: "i",
  parking: "P",
  toilet: "WC",
  medical: "+",
  rest: "歇",
  shop: "购",
};

const guide = ref<GuideData | null>(null);

/** 分类 / 设施展示文案：随导览数据由接口下发，避免在前端写死 */
const categoryLabels = computed<Record<string, string>>(
  () => guide.value?.labels?.category ?? {},
);
const facilityLabels = computed<Record<string, string>>(
  () => guide.value?.labels?.facility ?? {},
);

const activeCat = ref<MapCategory | "all">("all");
const activeRoute = ref<string>("all");
const selected = ref<GuideSpot | null>(null);
const selectedFacility = ref<GuideFacility | null>(null);

/* ===== 视口：缩放 / 平移 =====
 * 底图与标记同处一个 transform 图层，标记用 1/scale 反向缩放，
 * 所以放大后针脚与文字仍是固定像素大小，不会跟着糊成一团。
 */
const MIN_K = 1;
const MAX_K = 3.6;
/** 选中点位时把目标放在画布高度 38% 处，下方留给信息卡 */
const FOCUS_Y = 0.38;

const scale = ref(1);
const tx = ref(0);
const ty = ref(0);
/** gliding=true 时走 CSS 过渡（点选、按钮缩放、复位），拖拽期间必须关掉 */
const gliding = ref(false);
const showHint = ref(true);
const canvasEl = ref<any>(null);
const vp = { w: 0, h: 0 };

const invScale = computed(() => 1 / scale.value);

/** 头部倍率读数：未放大时不占位 */
const scaleLabel = computed(() => (scale.value > 1.01 ? `×${scale.value.toFixed(1)}` : ""));

const worldStyle = computed(() => ({
  transform: `translate3d(${tx.value}px, ${ty.value}px, 0) scale(${scale.value})`,
  transition: gliding.value ? "transform 460ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
}));

/** 图例里的分类色块（不含「全部」） */
const legendCats = categories
  .filter((c) => c.value !== "all")
  .map((c) => ({ label: c.label, color: categoryColors[c.value] ?? "#4F8F52" }));

/** 图例里的设施项 */
const legendFacilities = computed(() =>
  Object.keys(facilityLabels.value).map((key) => ({
    key,
    label: facilityLabels.value[key],
    glyph: facilityGlyph[key],
  })),
);

const { loading, error, run } = useRequest(async () => {
  const res = await getGuideData();
  guide.value = res.data;
});

onMounted(run);

const spots = computed(() => guide.value?.spots ?? []);
const facilities = computed(() => guide.value?.facilities ?? []);
const routes = computed(() => guide.value?.routes ?? []);

/** 依据分类筛选后仍在图上高亮的点位 */
const visibleSpots = computed(() =>
  activeCat.value === "all" ? spots.value : spots.value.filter((s) => s.category === activeCat.value),
);

/** 当前选中的路线（用于图上只画一条线） */
const activeRouteObj = computed<GuideRoute | null>(() => {
  if (activeRoute.value === "all") return null;
  return routes.value.find((r) => r.id === activeRoute.value) ?? null;
});

const drawnRoutes = computed(() =>
  activeRouteObj.value ? [activeRouteObj.value] : routes.value,
);

/** 当前路线上的点位顺序，用于在标记上显示「第几站」 */
const routeOrder = computed<Record<string, number>>(() => {
  const map: Record<string, number> = {};
  if (!activeRouteObj.value) return map;
  activeRouteObj.value.viaCodes.forEach((code, i) => {
    map[code] = i + 1;
  });
  return map;
});

/** 选中单条路线时，非途经点位压暗 */
const routeCodes = computed<Set<string> | null>(() =>
  activeRouteObj.value ? new Set(activeRouteObj.value.viaCodes) : null,
);

/**
 * 底图路网：环乡道（主路网）与溪谷支路。
 * 坐标串由接口随导览数据下发（后端 content/guide.json 的 roads）。
 */
const roadPoints = computed(() => guide.value?.roads?.ring ?? "");
const trailPoints = computed(() => guide.value?.roads?.trail ?? "");

/**
 * 手绘插画底图：地形、梯田、2.5D 建筑与路线几何都在 utils/guideScene.ts 里按接口坐标生成，
 * 页面只负责把路网 / 路线点串喂进去并决定画一条还是三条。
 * 同一份 SVG：H5 内联渲染（路线流动动画生效），小程序转 data URI 交给 <image>（静态），
 * 避免小程序不渲染内联 <svg> 时只剩空白画布；点位标记始终是 view，两端都能点。
 */
/** 小程序 <image> 的 SVG 子集不保证支持 <pattern>，森林纹理只在 H5 内联渲染时开 */
const SCENE_TEX = import.meta.env.UNI_PLATFORM === "h5";

const sceneSvg = computed(() =>
  buildGuideScene({
    ring: roadPoints.value,
    trail: trailPoints.value,
    routes: drawnRoutes.value.map((r) => ({ points: r.points, color: r.color })),
    single: !!activeRouteObj.value,
    tex: SCENE_TEX,
  }),
);

const sceneImageSrc = computed(() => `data:image/svg+xml,${encodeURIComponent(sceneSvg.value)}`);

/* ===== 坐标换算与标记样式 ===== */
function posX(x: number) {
  return `${(x / MAP_W) * 100}%`;
}

function posY(y: number) {
  return `${(y / MAP_H) * 100}%`;
}

function colorOf(spot: GuideSpot) {
  return categoryColors[spot.category] ?? "#4F8F52";
}

/** 分类或路线过滤时，不在范围内的点位压暗而不是消失，保留空间记忆 */
function isDim(spot: GuideSpot) {
  if (activeCat.value !== "all" && spot.category !== activeCat.value) return true;
  const codes = routeCodes.value;
  return !!codes && !codes.has(spot.code);
}

/** 标记盒本身是 0×0 的锚点，针脚与文字用负偏移挂上去，缩放围绕锚点做 */
function spotStyle(spot: GuideSpot) {
  return {
    left: posX(spot.x),
    top: posY(spot.y),
    transform: `scale(${invScale.value})`,
    zIndex: selected.value?.id === spot.id ? 40 : isDim(spot) ? 12 : 20,
  };
}

/* ===== 标记避让 =====
 * 编号圆点正中压在锚点上（点位坐标就是它该在的位置，不许偏移），
 * 名称按 右→左→上→下 贪心挑第一个不打架的方向挂出去。
 * 底图坐标由后端下发，写死偏移量换个数据就失效，所以按盒子求交自己找落点。
 */
const BADGE_HALF = 15;
const FAC_HALF = 20;
const LABEL_H = 26;

type Box = { x0: number; x1: number; y0: number; y1: number };
type Dir = "r" | "l" | "t" | "b";
const DIRS: Dir[] = ["r", "l", "t", "b"];

function hit(a: Box, b: Box) {
  return Math.min(a.x1, b.x1) > Math.max(a.x0, b.x0) && Math.min(a.y1, b.y1) > Math.max(a.y0, b.y0);
}

function badgeBox(s: GuideSpot): Box {
  return { x0: s.x - BADGE_HALF, x1: s.x + BADGE_HALF, y0: s.y - BADGE_HALF, y1: s.y + BADGE_HALF };
}

/** 名称宽度按字数估：CJK 一字 20rpx + 左右留白，够包围盒用即可 */
const labelWidth = (s: GuideSpot) => 14 + s.name.length * 20;

function labelBox(s: GuideSpot, dir: Dir): Box {
  const w = labelWidth(s);
  const g = BADGE_HALF + 3;
  const hy = LABEL_H / 2;
  if (dir === "r") return { x0: s.x + g, x1: s.x + g + w, y0: s.y - hy, y1: s.y + hy };
  if (dir === "l") return { x0: s.x - g - w, x1: s.x - g, y0: s.y - hy, y1: s.y + hy };
  if (dir === "t") return { x0: s.x - w / 2, x1: s.x + w / 2, y0: s.y - g - LABEL_H, y1: s.y - g };
  return { x0: s.x - w / 2, x1: s.x + w / 2, y0: s.y + g, y1: s.y + g + LABEL_H };
}

const inCanvas = (b: Box) => b.x0 > 6 && b.x1 < MAP_W - 6 && b.y0 > 6 && b.y1 < MAP_H - 6;

/** 贪心：按点位顺序依次落标签，已落下的标签/圆点/设施图标都当障碍 */
const labelDirs = computed<Record<string, Dir>>(() => {
  const placed: Box[] = facilities.value.map((f) => ({
    x0: f.x - FAC_HALF,
    x1: f.x + FAC_HALF,
    y0: f.y - FAC_HALF,
    y1: f.y + FAC_HALF,
  }));
  const out: Record<string, Dir> = {};
  spots.value.forEach((s) => {
    placed.push(badgeBox(s));
    const clash = (b: Box) => placed.some((p) => hit(p, b)) || spots.value.some((o) => o.id !== s.id && hit(badgeBox(o), b));
    const dir = DIRS.find((d) => {
      const b = labelBox(s, d);
      return inCanvas(b) && !clash(b);
    });
    out[s.id] = dir ?? "r";
    placed.push(labelBox(s, out[s.id]));
  });
  return out;
});

/** 贴边点位的设施名称朝画布内单侧展开，否则会被 overflow:hidden 裁掉 */
function edgeAlign(x: number) {
  const r = x / MAP_W;
  if (r > 0.78) return "translateX(-100%)";
  if (r < 0.22) return "translateX(0%)";
  return "translateX(-50%)";
}

const spotBoxes = (s: GuideSpot): Box[] => [badgeBox(s), labelBox(s, labelDirs.value[s.id] ?? "r")];

/** 设施图标当前该落在哪：默认原位，被压住则沿连线方向朝外扩圈找空位 */
const facilityShifts = computed<Record<string, { dx: number; dy: number }>>(() => {
  const facBox = (x: number, y: number): Box => ({
    x0: x - FAC_HALF,
    x1: x + FAC_HALF,
    y0: y - FAC_HALF,
    y1: y + FAC_HALF,
  });
  const blocked = (f: GuideFacility, x: number, y: number) => {
    if (x < FAC_HALF || x > MAP_W - FAC_HALF || y < FAC_HALF || y > MAP_H - FAC_HALF) return true;
    const box = facBox(x, y);
    if (facilities.value.some((o) => o.id !== f.id && hit(box, facBox(o.x, o.y)))) return true;
    return spots.value.some((s) => spotBoxes(s).some((b) => hit(box, b)));
  };
  const map: Record<string, { dx: number; dy: number }> = {};
  facilities.value.forEach((f) => {
    if (!blocked(f, f.x, f.y)) return;
    const box = facBox(f.x, f.y);
    const clash = spots.value.find((s) => spotBoxes(s).some((b) => hit(box, b)));
    const len = clash ? Math.hypot(f.x - clash.x, f.y - clash.y) : 0;
    const away: [number, number] =
      clash && len > 1 ? [(f.x - clash.x) / len, (f.y - clash.y) / len] : [-0.71, -0.71];
    const dirs: [number, number][] = [away];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      dirs.push([Math.round(Math.cos(a) * 100) / 100, Math.round(Math.sin(a) * 100) / 100]);
    }
    for (const r of [52, 70, 88, 108, 128, 150]) {
      const found = dirs
        .map(([ux, uy]) => ({ dx: Math.round(ux * r), dy: Math.round(uy * r) }))
        .find((d) => !blocked(f, f.x + d.dx, f.y + d.dy));
      if (found) {
        map[f.id] = found;
        break;
      }
    }
  });
  return map;
});

function facilityAt(f: GuideFacility) {
  const d = facilityShifts.value[f.id];
  return { x: f.x + (d?.dx ?? 0), y: f.y + (d?.dy ?? 0) };
}

function facilityStyle(f: GuideFacility) {
  const p = facilityAt(f);
  return {
    left: posX(p.x),
    top: posY(p.y),
    transform: `scale(${invScale.value})`,
    zIndex: selectedFacility.value?.id === f.id ? 38 : 10,
  };
}

/* ===== 视口控制 ===== */
function clampOffset() {
  const minX = vp.w * (1 - scale.value);
  const minY = vp.h * (1 - scale.value);
  tx.value = Math.min(0, Math.max(minX, tx.value));
  ty.value = Math.min(0, Math.max(minY, ty.value));
}

/** 以画布内一点 (fx, fy) 为锚缩放：锚点屏幕位置在缩放前后保持不变 */
function zoomTo(nextK: number, fx: number, fy: number) {
  const k1 = Math.min(MAX_K, Math.max(MIN_K, nextK));
  if (Math.abs(k1 - scale.value) < 0.0001) return;
  const ratio = k1 / scale.value;
  tx.value = fx - ratio * (fx - tx.value);
  ty.value = fy - ratio * (fy - ty.value);
  scale.value = k1;
  if (k1 <= MIN_K) {
    tx.value = 0;
    ty.value = 0;
  } else {
    clampOffset();
  }
}

function zoomBy(factor: number) {
  gliding.value = true;
  hideHint();
  zoomTo(scale.value * factor, vp.w / 2, vp.h / 2);
}

function resetView() {
  gliding.value = true;
  scale.value = 1;
  tx.value = 0;
  ty.value = 0;
}

/** 把某个地图坐标缓动到画布焦点处；当前倍率太小会先抬到 k */
function centerOn(x: number, y: number, k = 2.1) {
  gliding.value = true;
  scale.value = Math.min(MAX_K, Math.max(scale.value, k));
  tx.value = vp.w / 2 - (x / MAP_W) * vp.w * scale.value;
  ty.value = vp.h * FOCUS_Y - (y / MAP_H) * vp.h * scale.value;
  clampOffset();
}

/**
 * H5 下 <view> 的模板 ref 拿到的是组件实例，真正的 DOM 在 $el 上；
 * 直接对实例 addEventListener 会炸，所以统一走这个解析器。
 */
function canvasNode(): any {
  const el = canvasEl.value;
  if (!el) return null;
  return el.getBoundingClientRect ? el : el.$el ?? null;
}

function measure() {
  // #ifdef H5
  const el = canvasNode();
  if (el) {
    const r = el.getBoundingClientRect();
    vp.w = r.width;
    vp.h = r.height;
    return;
  }
  // #endif
  // #ifndef H5
  uni
    .createSelectorQuery()
    .select(".guide__canvas")
    .boundingClientRect((rect: any) => {
      if (rect && rect.width) {
        vp.w = rect.width;
        vp.h = rect.height;
      }
    })
    .exec();
  // #endif
}

/* ===== 手势核心：H5 走 pointer，小程序走 touch ===== */
type Pt = { x: number; y: number };

const live = new Map<number, Pt>();
let pinchDist = 0;
let movedPx = 0;
let dragEndAt = 0;

function gestureDown(id: number, x: number, y: number) {
  live.set(id, { x, y });
  gliding.value = false;
  movedPx = 0;
}

function gestureMove(id: number, x: number, y: number) {
  const prev = live.get(id);
  if (!prev) return;
  live.set(id, { x, y });
  const dx = x - prev.x;
  const dy = y - prev.y;
  movedPx += Math.abs(dx) + Math.abs(dy);
  tx.value += dx;
  ty.value += dy;
  clampOffset();
  if (movedPx > 6) hideHint();
}

function gestureUp(id: number) {
  live.delete(id);
  if (live.size < 2) pinchDist = 0;
  if (live.size === 0) {
    if (movedPx > 6) dragEndAt = Date.now();
    if (scale.value <= MIN_K) {
      tx.value = 0;
      ty.value = 0;
    }
  }
}

/** 拖拽抬手后端还会补一个 tap，移动过就把它判为无效点击 */
function dragged() {
  return Date.now() - dragEndAt < 250;
}

function hideHint() {
  showHint.value = false;
}

/**
 * 小程序端手势入口。H5 直接走下面的 pointer 事件（桌面要支持鼠标拖拽与滚轮），
 * 但模板上的 @touchstart 绑定两端共用，所以这几个函数必须始终存在，H5 下空转。
 */
function onTouchStart(e: any) {
  // #ifdef H5
  return;
  // #endif
  measure();
  const list = e.touches || [];
  for (let i = 0; i < list.length; i++) gestureDown(list[i].identifier, list[i].clientX, list[i].clientY);
}

function onTouchMove(e: any) {
  // #ifdef H5
  return;
  // #endif
  const list = e.touches || [];
  if (list.length >= 2) {
    // 小程序拿不到滚动后的画布偏移，缩放锚点退化为画布中心
    const d = Math.hypot(list[0].clientX - list[1].clientX, list[0].clientY - list[1].clientY);
    if (pinchDist > 0 && d > 0) {
      zoomTo(scale.value * (d / pinchDist), vp.w / 2, vp.h / 2);
      movedPx += 6;
      hideHint();
    }
    pinchDist = d;
    return;
  }
  const t = list[0];
  if (t) gestureMove(t.identifier, t.clientX, t.clientY);
}

function onTouchEnd(e: any) {
  // #ifdef H5
  return;
  // #endif
  const list = e.changedTouches || [];
  for (let i = 0; i < list.length; i++) gestureUp(list[i].identifier);
}

// #ifdef H5
let bound = false;

function local(e: { clientX: number; clientY: number }) {
  const r = canvasNode().getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function onPointerDown(e: PointerEvent) {
  const p = local(e);
  gestureDown(e.pointerId, p.x, p.y);
  if (live.size === 2) {
    const [a, b] = [...live.values()];
    pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
  }
}

function onPointerMove(e: PointerEvent) {
  if (!live.has(e.pointerId)) return;
  const p = local(e);
  if (live.size >= 2) {
    live.set(e.pointerId, p);
    const [a, b] = [...live.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchDist > 0 && d > 0) {
      zoomTo(scale.value * (d / pinchDist), (a.x + b.x) / 2, (a.y + b.y) / 2);
      pinchDist = d;
      movedPx += 6;
      hideHint();
    }
    return;
  }
  gestureMove(e.pointerId, p.x, p.y);
}

function onPointerUp(e: PointerEvent) {
  gestureUp(e.pointerId);
}

function onWheel(e: WheelEvent) {
  e.preventDefault();
  const p = local(e);
  gliding.value = false;
  hideHint();
  zoomTo(scale.value * Math.exp(-e.deltaY * 0.0016), p.x, p.y);
}

function onDoubleClick(e: MouseEvent) {
  e.preventDefault();
  if (scale.value > MIN_K + 0.01) {
    resetView();
  } else {
    const p = local(e);
    gliding.value = true;
    hideHint();
    zoomTo(2.2, p.x, p.y);
  }
}

function onResize() {
  measure();
  if (scale.value <= MIN_K) {
    tx.value = 0;
    ty.value = 0;
  } else {
    clampOffset();
  }
}

function bindViewport() {
  const el = canvasNode();
  if (!el || bound) return;
  bound = true;
  el.addEventListener("pointerdown", onPointerDown);
  el.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  el.addEventListener("wheel", onWheel, { passive: false });
  el.addEventListener("dblclick", onDoubleClick);
  window.addEventListener("resize", onResize);
}

function unbindViewport() {
  const el = canvasNode();
  if (el && bound) {
    el.removeEventListener("pointerdown", onPointerDown);
    el.removeEventListener("pointermove", onPointerMove);
    el.removeEventListener("wheel", onWheel);
    el.removeEventListener("dblclick", onDoubleClick);
  }
  bound = false;
  window.removeEventListener("pointerup", onPointerUp);
  window.removeEventListener("pointercancel", onPointerUp);
  window.removeEventListener("resize", onResize);
}
// #endif

/* ===== 选中与信息卡 ===== */
/**
 * 画布在导览数据到位后才渲染，事件监听与尺寸测量都得等元素真的存在。
 * 测不到宽度就短间隔重试，避免首次进入时缩放/拖拽是半死状态。
 */
function armViewport(retry = 0) {
  // #ifdef H5
  bindViewport();
  // #endif
  measure();
  if (!vp.w && retry < 20) setTimeout(() => armViewport(retry + 1), 100);
}

function clearPick() {
  selected.value = null;
  selectedFacility.value = null;
}

/** 列表里点行：先把地图滚上来，再定位到点位 */
function scrollMapIntoView() {
  uni
    .createSelectorQuery()
    .select(".guide")
    .boundingClientRect((rect: any) => {
      if (!rect) return;
      uni
        .createSelectorQuery()
        .selectViewport()
        .scrollOffset((view: any) => {
          const top = Math.max(0, (view?.scrollTop || 0) + rect.top - 70);
          // #ifdef H5
          // 本项目 H5 的页面滚动发生在 window 上，uni.pageScrollTo 不生效；
          // 部分内嵌 webview 会忽略 smooth 动画，所以补一次直达兜底。
          window.scrollTo({ top, behavior: "smooth" });
          setTimeout(() => {
            if (Math.abs(window.scrollY - top) > 2) window.scrollTo(0, top);
          }, 280);
          // #endif
          // #ifndef H5
          uni.pageScrollTo({ scrollTop: top, duration: 260 });
          // #endif
        })
        .exec();
    })
    .exec();
}

function pickSpot(spot: GuideSpot, fromList = false) {
  if (dragged()) return;
  selected.value = spot;
  selectedFacility.value = null;
  hideHint();
  centerOn(spot.x, spot.y);
  if (fromList) scrollMapIntoView();
}

function pickFacility(f: GuideFacility, fromList = false) {
  if (dragged()) return;
  selectedFacility.value = f;
  selected.value = null;
  hideHint();
  const p = facilityAt(f);
  centerOn(p.x, p.y, 2.4);
  if (fromList) scrollMapIntoView();
}

function onCanvasTap() {
  if (dragged()) return;
  clearPick();
}

function switchCategory(value: MapCategory | "all") {
  activeCat.value = value;
  clearPick();
}

function switchRoute(id: string) {
  activeRoute.value = id;
  clearPick();
  resetView();
}

function detailPath(id: string, category: string) {
  const map: Record<string, string> = {
    scenic: "pages/travel/scenic-detail",
    picking: "pages/travel/picking-detail",
    homestay: "pages/travel/homestay-detail",
  };
  return map[category] ? `${map[category]}?id=${id}` : "";
}

function onDetail() {
  if (!selected.value) return;
  const path = detailPath(selected.value.id, selected.value.category);
  if (path) go(path);
  else uni.showToast({ title: tr("该点位为服务点，暂无独立详情页"), icon: "none" });
}

function onNavigate() {
  if (!selected.value) return;
  uni.showModal({
    title: tr("导航到 {name}").replace("{name}", selected.value.name),
    content: selected.value.distance
      ? tr("距游客中心约 {distance}，园区内可换乘观光车或步行前往。").replace("{distance}", selected.value.distance)
      : tr("园区内可换乘观光车或步行前往，具体距离以现场指示牌为准。"),
    showCancel: false,
    confirmText: tr("知道了"),
  });
}

function onAudio() {
  if (!selected.value) return;
  if (selected.value.category === "scenic") go(`pages/travel/scenic-detail?id=${selected.value.id}`);
  else uni.showToast({ title: tr("该点位暂无语音讲解"), icon: "none" });
}

watch(guide, async () => {
  await nextTick();
  armViewport();
  setTimeout(hideHint, 7000);
});

onMounted(() => {
  run();
});

onBeforeUnmount(() => {
  // #ifdef H5
  unbindViewport();
  // #endif
});
</script>

<template>
  <view class="map-page">
    <NavBar :title="tr('山野导览地图')" />
    <view class="map-page__search">
      <SearchBar :placeholder="tr('搜索景点 / 采摘园 / 民宿 / 路线')" @select="go('pages/mall/search')" />
    </view>

    <template v-if="loading">
      <LoadingState :text="tr('导览图加载中…')" />
    </template>
    <template v-else-if="error || !guide">
      <EmptyState :title="tr('导览图加载失败')" :description="error" :action-text="tr('重新加载')" @action="run" />
    </template>
    <template v-else>
      <!-- 导览图 -->
      <view class="guide">
        <view class="guide__head">
          <view class="guide__title-wrap">
            <text class="guide__title">{{ tr("青梅里山野导览图") }}</text>
            <text class="guide__sub">{{ tr("景点分布 · 导览路线 · 公共设施") }}</text>
          </view>
          <view class="guide__head-right">
            <text v-if="scaleLabel" class="guide__zoom">{{ scaleLabel }}</text>
            <text class="guide__scale">{{ tr("示意图 · 非实际比例") }}</text>
          </view>
        </view>

        <view
          ref="canvasEl"
          class="guide__canvas"
          @tap="onCanvasTap"
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
        >
          <!-- 底图与标记共用一个 transform 图层，标记按 1/scale 反缩放，放大后针脚不跟着变大 -->
          <view class="guide__world" :style="worldStyle">
            <!-- #ifdef H5 -->
            <view class="guide__svg" v-html="sceneSvg" />
            <!-- #endif -->
            <!-- #ifndef H5 -->
            <image class="guide__svg" :src="sceneImageSrc" mode="scaleToFill" />
            <!-- #endif -->

            <!-- 公共设施：默认只留图标，放大到 1.7 倍才展开文字，避免一屏糊字 -->
            <view
              v-for="f in facilities"
              :key="f.id"
              class="facility"
              :class="{ 'facility--on': selectedFacility?.id === f.id }"
              :style="facilityStyle(f)"
              @tap.stop="pickFacility(f)"
            >
              <view class="facility__icon" :class="`facility__icon--${f.type}`">
                <text>{{ facilityGlyph[f.type] }}</text>
              </view>
              <text
                v-if="scale >= 1.7"
                class="facility__name"
                :style="{ transform: edgeAlign(facilityAt(f).x) }"
              >
                {{ f.name }}
              </text>
            </view>

            <!-- 点位标记：水滴针脚 + 编号/站序 + 全名 -->
            <view
              v-for="spot in visibleSpots"
              :key="spot.id"
              class="spot"
              :class="{ 'spot--dim': isDim(spot), 'spot--on': selected?.id === spot.id }"
              :style="spotStyle(spot)"
              @tap.stop="pickSpot(spot)"
            >
              <view class="spot__halo" />
              <view class="spot__pin" :style="{ background: colorOf(spot) }">
                <text class="spot__num">{{ routeOrder[spot.code] || spot.code }}</text>
              </view>
              <text
                class="spot__label"
                :class="`spot__label--${labelDirs[spot.id] || 'r'}`"
                >{{ spot.name }}</text
              >
            </view>
          </view>

          <!-- 缩放控件 -->
          <view class="zoomctl">
            <view class="zoomctl__btn" @tap.stop="zoomBy(1.5)"><text>+</text></view>
            <view class="zoomctl__rule" />
            <view class="zoomctl__btn" @tap.stop="zoomBy(1 / 1.5)"><text>−</text></view>
            <view class="zoomctl__btn zoomctl__btn--text" @tap.stop="resetView">
              <text>{{ tr("复位") }}</text>
            </view>
          </view>

          <!-- 首次进入的手势提示，交互一次后淡出 -->
          <view class="map-hint" :class="{ 'map-hint--off': !showHint }">
            <text>{{ tr("双指缩放 · 拖动平移 · 双击复位") }}</text>
          </view>

          <!-- 点位信息卡 -->
          <view v-if="selected" class="mapcard" @tap.stop>
            <image class="mapcard__img" :src="selected.image" mode="aspectFill" />
            <view class="mapcard__main">
              <view class="mapcard__head">
                <text class="mapcard__name">{{ selected.name }}</text>
                <text class="mapcard__code" :style="{ background: colorOf(selected) }">{{ selected.code }}</text>
              </view>
              <view class="mapcard__meta">
                <text class="mapcard__tag" :style="{ color: colorOf(selected) }">
                  {{ tr(categoryLabels[selected.category]) }}
                </text>
                <template v-if="selected.distance">
                  <text class="mapcard__sep">/</text>
                  <text class="mapcard__dist">{{ selected.distance }}</text>
                </template>
                <text class="mapcard__sep">/</text>
                <text class="mapcard__open" :class="{ 'mapcard__open--off': !selected.open }">
                  {{ selected.open ? tr("营业中") : tr("休息中") }}
                </text>
              </view>
              <text class="mapcard__summary">{{ selected.summary }}</text>
            </view>
            <view class="mapcard__close" @tap.stop="clearPick"><text>×</text></view>
            <view class="mapcard__actions">
              <view class="mapcard__btn" @tap.stop="onNavigate"><text>{{ tr("导航") }}</text></view>
              <view class="mapcard__btn" @tap.stop="onAudio"><text>{{ tr("语音讲解") }}</text></view>
              <view class="mapcard__btn mapcard__btn--primary" @tap.stop="onDetail">
                <text>
                  {{ selected.category === "craft" || selected.category === "food" ? tr("咨询预约") : tr("查看详情") }}
                </text>
              </view>
            </view>
          </view>

          <!-- 设施信息卡 -->
          <view v-else-if="selectedFacility" class="mapcard mapcard--slim" @tap.stop>
            <view class="mapcard__icon" :class="`facility__icon--${selectedFacility.type}`">
              <text>{{ facilityGlyph[selectedFacility.type] }}</text>
            </view>
            <view class="mapcard__main">
              <text class="mapcard__name">{{ selectedFacility.name }}</text>
              <text class="mapcard__summary">{{ selectedFacility.desc }}</text>
            </view>
            <view class="mapcard__close" @tap.stop="clearPick"><text>×</text></view>
          </view>
        </view>

        <!-- 图例 -->
        <view class="legend">
          <view class="legend__group">
            <view v-for="c in legendCats" :key="c.label" class="legend__item">
              <view class="legend__dot" :style="{ background: c.color }" />
              <text>{{ tr(c.label) }}</text>
            </view>
          </view>
          <view class="legend__group">
            <view v-for="f in legendFacilities" :key="f.key" class="legend__item">
              <view class="legend__icon" :class="`legend__icon--${f.key}`">
                <text>{{ f.glyph }}</text>
              </view>
              <text>{{ tr(f.label) }}</text>
            </view>
          </view>
          <view class="legend__group">
            <view v-for="r in routes" :key="r.id" class="legend__item">
              <view class="legend__line" :style="{ background: r.color }" />
              <text>{{ r.name.split(" · ")[0] }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 路线切换 -->
      <view class="switcher">
        <view class="switcher__row">
          <view class="switcher__label"><text>{{ tr("导览路线") }}</text></view>
          <view class="chips">
            <view class="chips__item" :class="{ active: activeRoute === 'all' }" @tap="switchRoute('all')">
              <text>{{ tr("全部") }}</text>
            </view>
            <view
              v-for="r in routes"
              :key="r.id"
              class="chips__item"
              :class="{ active: activeRoute === r.id }"
              @tap="switchRoute(r.id)"
            >
              <text>{{ r.name.split(" · ")[0] }}</text>
            </view>
          </view>
        </view>
        <view class="switcher__row">
          <view class="switcher__label"><text>{{ tr("点位分类") }}</text></view>
          <view class="chips">
            <view
              v-for="c in categories"
              :key="c.value"
              class="chips__item"
              :class="{ active: activeCat === c.value }"
              @tap="switchCategory(c.value)"
            >
              <text>{{ tr(c.label) }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="map-page__body">
        <!-- 景点分布 -->
        <view class="section">
          <view class="section__head">
            <text class="section__title">{{ tr("景点分布") }}</text>
            <text class="section__sub">{{ tr("共 {n} 个点位 · 点击可看详情").replace("{n}", String(visibleSpots.length)) }}</text>
          </view>
          <view class="spot-list">
            <view v-for="spot in visibleSpots" :key="spot.id" class="spot-row card" :class="{ 'spot-row--on': selected?.id === spot.id }" @tap="pickSpot(spot, true)">
              <view class="spot-row__code" :style="{ background: categoryColors[spot.category] }">
                <text>{{ spot.code }}</text>
              </view>
              <image class="spot-row__img" :src="spot.image" mode="aspectFill" />
              <view class="spot-row__info">
                <view class="spot-row__head">
                  <text class="spot-row__name">{{ spot.name }}</text>
                  <text class="spot-row__cat">{{ tr(categoryLabels[spot.category]) }}</text>
                </view>
                <text class="spot-row__summary">{{ spot.summary }}</text>
                <view class="spot-row__foot">
                  <text>{{ spot.distance }}</text>
                  <text v-if="spot.bookable" class="spot-row__bookable">{{ tr("可预约") }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 导览路线 -->
        <view class="section">
          <view class="section__head">
            <text class="section__title">{{ tr("导览路线") }}</text>
            <text class="section__sub">{{ tr("{n} 条主题线路，可按体力自由选择").replace("{n}", String(routes.length)) }}</text>
          </view>
          <view class="route-list">
            <view v-for="r in routes" :key="r.id" class="route-card card">
              <view class="route-card__head">
                <view class="route-card__line" :style="{ background: r.color }" />
                <text class="route-card__name">{{ r.name }}</text>
              </view>
              <text class="route-card__desc">{{ r.desc }}</text>
              <view class="route-card__meta">
                <text>{{ r.length }}</text>
                <text>{{ r.duration }}</text>
                <text>{{ r.level }}</text>
              </view>
              <view class="route-card__via">
                <text class="route-card__via-label">{{ tr("途经") }}</text>
                <text v-for="code in r.viaCodes" :key="code" class="route-card__via-dot">{{ code }}</text>
              </view>
              <view class="route-card__actions">
                <view class="route-card__btn route-card__btn--ghost" @tap="switchRoute(r.id)">
                  <text>{{ tr("在导览图上查看") }}</text>
                </view>
                <view class="route-card__btn route-card__btn--primary" @tap="go('pages/travel/route-detail?id=' + r.routeId)">
                  <text>{{ tr("路线详情") }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 设施服务 -->
        <view class="section">
          <view class="section__head">
            <text class="section__title">{{ tr("设施说明") }}</text>
            <text class="section__sub">{{ tr("共 {n} 处服务点").replace("{n}", String(facilities.length)) }}</text>
          </view>
          <view class="facility-list card">
            <view v-for="f in facilities" :key="f.id" class="facility-row" :class="{ 'facility-row--on': selectedFacility?.id === f.id }" @tap="pickFacility(f, true)">
              <view class="facility-row__icon" :class="`facility__icon--${f.type}`">
                <text>{{ facilityGlyph[f.type] }}</text>
              </view>
              <view class="facility-row__info">
                <text class="facility-row__name">{{ f.name }}</text>
                <text class="facility-row__desc">{{ f.desc }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="map-page__tip">
          <text>{{ tr("导览图为示意图，实际步行距离以现场指示牌为准；青梅季与节假日的观光车班次请以游客中心公告为主。") }}</text>
        </view>
      </view>
    </template>

  </view>
</template>

<style lang="scss" scoped>
.map-page {
  min-height: 100vh;
}

.map-page__search {
  padding: 16rpx 24rpx;
}

.map-page__hint {
  padding: 120rpx 0;
  text-align: center;
  color: $text-sub;
}

.map-page__body {
  padding: 8rpx 24rpx calc(60rpx + env(safe-area-inset-bottom));
}

/* ===== 导览图 ===== */
.guide {
  margin: 0 24rpx;
  border-radius: $radius-md;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 8rpx 28rpx rgba(38, 53, 42, 0.06);
}

.guide__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 24rpx 24rpx 16rpx;
}

.guide__title-wrap {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.guide__title {
  font-size: 32rpx;
  font-weight: 800;
  color: $text-main;
}

.guide__sub {
  font-size: 22rpx;
  color: $text-sub;
}

.guide__scale {
  font-size: 20rpx;
  color: $text-sub;
}

.guide__head-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
}

.guide__zoom {
  padding: 2rpx 12rpx;
  border-radius: 999rpx;
  background: $green-bg;
  color: $green;
  font-size: 20rpx;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.guide__canvas {
  position: relative;
  width: 100%;
  aspect-ratio: 750 / 980;
  overflow: hidden;
  background: #eef5e6;
  /* 地图区域由手势接管：H5 上拖动/滚轮不再连带滚页 */
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.guide__world {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform-origin: 0 0;
  will-change: transform;
  backface-visibility: hidden;
}

.guide__svg {
  position: absolute;
  top: 0;
  left: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.guide__svg :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

/* ===== 点位注记 =====
 * .spot 本身是 0×0 的锚点，编号圆点正中压在这个坐标上，
 * scale(1/k) 围绕锚点做，放大后圆点仍精确压在点位上、字号不变。
 */
.spot {
  position: absolute;
  width: 0;
  height: 0;
  transform-origin: 50% 50%;
  transition: opacity 240ms linear;
}

.spot__pin {
  position: absolute;
  top: -15rpx;
  left: -15rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30rpx;
  height: 30rpx;
  border-radius: 50%;
  border: 3rpx solid #fffdf4;
  box-shadow: 0 3rpx 9rpx rgba(31, 48, 36, 0.34);
}

.spot__num {
  color: #fff;
  font-size: 18rpx;
  font-weight: 700;
  line-height: 1;
}

/* 名称直接"写"在底图上：不用白底药丸，改用多层白色描边把字从水彩里提出来。
   参考手绘景区全景图的注记做法，16 个标签也不会把地形糊掉。
   四个方向各一套偏移，跟 labelDirs 的贪心结果一一对应。 */
.spot__label {
  position: absolute;
  top: -13rpx;
  left: 21rpx;
  color: #22301d;
  font-size: 21rpx;
  font-weight: 700;
  letter-spacing: 0.5rpx;
  line-height: 1.25;
  white-space: nowrap;
  text-shadow:
    0 0 3rpx rgba(255, 253, 244, 0.99),
    0 0 8rpx rgba(255, 253, 244, 0.95),
    0 0 16rpx rgba(255, 253, 244, 0.8),
    1rpx 1rpx 0 rgba(255, 253, 244, 0.92);
}

.spot__label--l {
  left: auto;
  right: 21rpx;
}

.spot__label--t {
  top: auto;
  bottom: 21rpx;
  left: 0;
  transform: translateX(-50%);
}

.spot__label--b {
  top: 21rpx;
  left: 0;
  transform: translateX(-50%);
}

.spot__halo {
  position: absolute;
  top: -26rpx;
  left: -26rpx;
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  border: 3rpx solid rgba(47, 93, 67, 0.6);
  opacity: 0;
}

.spot--dim {
  opacity: 0.3;
}

.spot--on .spot__halo {
  opacity: 1;
  animation: spot-pulse 1.7s ease-out infinite;
}

.spot--on .spot__pin {
  box-shadow: 0 6rpx 18rpx rgba(31, 48, 36, 0.45);
}

.spot--on .spot__label {
  font-size: 23rpx;
  text-decoration: underline;
  text-decoration-thickness: 2rpx;
  text-underline-offset: 5rpx;
}

@keyframes spot-pulse {
  0% {
    transform: scale(0.7);
    opacity: 0.85;
  }
  72% {
    transform: scale(1.6);
    opacity: 0;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}

/* ===== 设施图标 ===== */
.facility {
  position: absolute;
  width: 0;
  height: 0;
  transform-origin: 50% 50%;
}

.facility__icon {
  position: absolute;
  top: -17rpx;
  left: -17rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34rpx;
  height: 34rpx;
  border-radius: 9rpx;
  border: 3rpx solid #fff;
  box-shadow: 0 3rpx 9rpx rgba(38, 53, 42, 0.22);
  color: #fff;
  font-size: 17rpx;
  font-weight: 700;
  background: #7b857c;
}

.facility__icon--center {
  background: #3f6f8f;
}

.facility__icon--parking {
  background: #4a5a6b;
}

.facility__icon--toilet {
  background: #6c7f8c;
  font-size: 15rpx;
}

.facility__icon--medical {
  background: #c0533f;
}

.facility__icon--rest {
  background: #8b6f47;
}

.facility__icon--shop {
  background: #b07a35;
}

.facility__name {
  position: absolute;
  top: 19rpx;
  left: 0;
  transform: translateX(-50%);
  color: #3d4a3a;
  font-size: 17rpx;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
  text-shadow:
    0 0 3rpx rgba(255, 253, 244, 0.99),
    0 0 8rpx rgba(255, 253, 244, 0.95),
    1rpx 1rpx 0 rgba(255, 253, 244, 0.9);
}

.facility--on .facility__icon {
  box-shadow: 0 0 0 5rpx rgba(47, 93, 67, 0.2), 0 5rpx 14rpx rgba(31, 48, 36, 0.3);
}

/* 图例 */
.legend {
  padding: 20rpx 24rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  background: #fbfaf6;
  border-top: 1rpx solid #f1f2ee;
}

.legend__group {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx 20rpx;
}

.legend__item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 21rpx;
  color: $text-sub;
}

.legend__dot {
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  border: 3rpx solid #fff;
}

.legend__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26rpx;
  height: 26rpx;
  border-radius: 6rpx;
  color: #fff;
  font-size: 14rpx;
  font-weight: 700;
  background: #7b857c;
}

.legend__line {
  width: 34rpx;
  height: 6rpx;
  border-radius: 3rpx;
}

.legend__icon--center {
  background: #3f6f8f;
}

.legend__icon--parking {
  background: #4a5a6b;
}

.legend__icon--toilet {
  background: #6c7f8c;
  font-size: 12rpx;
}

.legend__icon--medical {
  background: #c0533f;
}

.legend__icon--rest {
  background: #8b6f47;
}

.legend__icon--shop {
  background: #b07a35;
}

/* ===== 切换 ===== */
.switcher {
  position: sticky;
  top: 0;
  z-index: 20;
  margin: 24rpx 0 0;
  padding: 20rpx 24rpx 4rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  background: $cream;
  border-bottom: 1rpx solid #eceee9;
}

.switcher__row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.switcher__label {
  flex-shrink: 0;
  width: 110rpx;
  font-size: 23rpx;
  color: $text-sub;
}

.chips {
  flex: 1;
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
}

.chips__item {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 26rpx;
  margin-right: 14rpx;
  border-radius: 28rpx;
  background: #fff;
  color: $text-main;
  font-size: 24rpx;

  &.active {
    background: $green;
    color: #f7f3e6;
  }
}

/* ===== 内容区 ===== */
.section {
  margin-top: 36rpx;
}

.section__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 18rpx;
}

.section__title {
  font-size: 32rpx;
  font-weight: 700;
  color: $text-main;
}

.section__sub {
  font-size: 21rpx;
  color: $text-sub;
}

.spot-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.spot-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 18rpx;
}

.spot-row__code {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  color: #fff;
  font-size: 22rpx;
  font-weight: 700;
}

.spot-row__img {
  flex-shrink: 0;
  width: 120rpx;
  height: 120rpx;
  border-radius: $radius-sm;
}

.spot-row__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.spot-row__head {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.spot-row__name {
  font-size: 28rpx;
  font-weight: 700;
  color: $text-main;
}

.spot-row__cat {
  padding: 2rpx 12rpx;
  border-radius: 16rpx;
  background: $green-bg;
  color: $green;
  font-size: 19rpx;
}

.spot-row__summary {
  font-size: 23rpx;
  line-height: 1.55;
  color: $text-sub;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.spot-row__foot {
  display: flex;
  align-items: center;
  gap: 14rpx;
  font-size: 21rpx;
  color: $text-sub;
}

.spot-row__bookable {
  padding: 2rpx 12rpx;
  border-radius: 14rpx;
  background: $yellow;
  color: #6b4d16;
  font-size: 19rpx;
}

.route-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.route-card {
  padding: 24rpx;
}

.route-card__head {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.route-card__line {
  width: 40rpx;
  height: 8rpx;
  border-radius: 4rpx;
}

.route-card__name {
  font-size: 29rpx;
  font-weight: 700;
  color: $text-main;
}

.route-card__desc {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.65;
  color: $text-sub;
}

.route-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx 24rpx;
  margin-top: 14rpx;
  font-size: 22rpx;
  color: $text-main;
}

.route-card__via {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 16rpx;
}

.route-card__via-label {
  font-size: 21rpx;
  color: $text-sub;
}

.route-card__via-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34rpx;
  height: 34rpx;
  border-radius: 50%;
  background: $green-bg;
  color: $green;
  font-size: 19rpx;
  font-weight: 700;
}

.route-card__actions {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
}

.route-card__btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 72rpx;
  border-radius: 36rpx;
  font-size: 25rpx;

  &--ghost {
    background: $green-bg;
    color: $green;
  }

  &--primary {
    background: $green;
    color: #f7f3e6;
  }
}

.facility-list {
  padding: 8rpx 24rpx;
}

.facility-row {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 22rpx 0;
}

.facility-row + .facility-row {
  border-top: 1rpx solid #f2f3f0;
}

.facility-row__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52rpx;
  height: 52rpx;
  border-radius: 14rpx;
  color: #fff;
  font-size: 24rpx;
  font-weight: 700;
  background: #7b857c;
}

.facility-row__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.facility-row__name {
  font-size: 27rpx;
  font-weight: 700;
  color: $text-main;
}

.facility-row__desc {
  font-size: 23rpx;
  line-height: 1.6;
  color: $text-sub;
}

.map-page__tip {
  margin-top: 28rpx;
  padding: 20rpx 24rpx;
  border-radius: $radius-sm;
  background: #fbfaf6;
  font-size: 21rpx;
  line-height: 1.6;
  color: $text-sub;
}

/* ===== 图上控件：缩放按钮 / 手势提示 / 点位信息卡 ===== */
.zoomctl {
  position: absolute;
  top: 14rpx;
  right: 14rpx;
  z-index: 60;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 14rpx;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 6rpx 20rpx rgba(31, 48, 36, 0.16);
}

/* 控件压在图上，尺寸必须收到不会盖住右上角点位（4 号青梅古道） */
.zoomctl__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54rpx;
  height: 46rpx;
  color: $text-main;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1;

  &:active {
    background: $green-bg;
  }

  &--text {
    color: $text-sub;
    font-size: 19rpx;
    font-weight: 600;
  }
}

.zoomctl__rule {
  width: 30rpx;
  height: 1rpx;
  background: $line;
}

.map-hint {
  position: absolute;
  left: 18rpx;
  bottom: 18rpx;
  z-index: 55;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(27, 36, 29, 0.6);
  color: #fff;
  font-size: 20rpx;
  line-height: 1.5;
  transition: opacity 460ms linear;

  &--off {
    opacity: 0;
  }
}

.mapcard {
  position: absolute;
  right: 16rpx;
  bottom: 16rpx;
  left: 16rpx;
  z-index: 70;
  display: flex;
  flex-wrap: wrap;
  padding: 18rpx;
  border-radius: 18rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 16rpx 40rpx rgba(31, 48, 36, 0.22);
  animation: mapcard-in 300ms cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes mapcard-in {
  from {
    opacity: 0;
    transform: translateY(18rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.mapcard--slim {
  align-items: center;
}

.mapcard__img {
  flex: none;
  width: 132rpx;
  height: 132rpx;
  margin-right: 18rpx;
  border-radius: 12rpx;
  background: $img-bg;
}

.mapcard__icon {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 62rpx;
  height: 62rpx;
  margin-right: 18rpx;
  border-radius: 14rpx;
  color: #fff;
  font-size: 24rpx;
  font-weight: 700;
}

.mapcard__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.mapcard__head {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.mapcard__name {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  font-weight: 700;
  color: $text-main;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mapcard__code {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34rpx;
  height: 34rpx;
  border-radius: 50%;
  color: #fff;
  font-size: 19rpx;
  font-weight: 700;
}

.mapcard__meta {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 21rpx;
  color: $text-sub;
}

.mapcard__tag {
  font-weight: 600;
}

.mapcard__sep {
  color: rgba(27, 36, 29, 0.24);
}

.mapcard__open {
  color: $success;

  &--off {
    color: $text-mute;
  }
}

.mapcard__summary {
  font-size: 21rpx;
  line-height: 1.55;
  color: $text-sub;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.mapcard__close {
  position: absolute;
  top: 6rpx;
  right: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44rpx;
  height: 44rpx;
  color: $text-mute;
  font-size: 34rpx;
  line-height: 1;
}

.mapcard__actions {
  flex: none;
  width: 100%;
  display: flex;
  gap: 12rpx;
  margin-top: 16rpx;
}

.mapcard__btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 62rpx;
  border-radius: 12rpx;
  border: 1rpx solid $line-strong;
  font-size: 22rpx;
  color: $text-main;

  &:active {
    background: $green-soft;
  }

  &--primary {
    background: $green;
    border-color: $green;
    color: #fff;
  }
}

/* 列表与地图双向联动：列表选中态与图上高亮一致 */
.spot-row--on {
  border-color: rgba(47, 93, 67, 0.45);
  box-shadow: 0 10rpx 26rpx rgba(31, 48, 36, 0.1);
}

.facility-row--on {
  background: $green-soft;
}
</style>
