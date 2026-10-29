/**
 * 青梅里山野导览图 · 手绘矢量地图
 *
 * 整张图由同一套画法生成：地形用三层明度做分层晕渲（光从西北来，东南留暗边），
 * 等高线只画贴向谷地的一侧弧段（画成全圈就是靶心），林用成片树冠簇而不是散点，
 * 路是软边渐变带（不画虚线中线），房子不描黑边、甩暖色落地影。
 * 输出 750x980 SVG，与 content/guide.json 的点位/路网坐标共用同一套坐标。
 * H5 用 v-html 内联渲染（路线描边动画生效），小程序把同一份 SVG 转 data URI 交给 <image>（静态）。
 * 全程只用 SVG 1.1 基础图元，不上滤镜——光栅化滤镜在高 DPR 下会拖垮渲染进程。
 */

export const MAP_W = 750;
export const MAP_H = 980;

export interface SceneRoute {
  points: string;
  color: string;
}

const P = {
  paper: "#F3EFDF",
  meadow: "#D3E2B6",
  meadowLit: "#E4EFCB",
  meadowDeep: "#BFD49C",
  rim: "#8FAF74",
  field: "#DFE8BC",
  fieldAlt: "#CCDCA8",
  paddy: "#A9CDBB",
  paddyAlt: "#BDDCC9",
  terraceWall: "#9DB08C",
  hill1: "#8FB478",
  hill2: "#6E9A5E",
  hill3: "#527A49",
  hill4: "#40653C",
  far1: "#B4CBAF",
  far2: "#98B694",
  canopy: "#3F6B44",
  canopyMid: "#557F4E",
  canopyLit: "#77A269",
  orchard: "#6E9A64",
  orchardLit: "#8CB87C",
  blossom: "#F0D5DE",
  ink: "#3E4E38",
  contour: "#4E7550",
  water: "#7FB6D6",
  waterLit: "#ADD8EA",
  waterDeep: "#5E9CC2",
  bank: "#BFD4AE",
  roadFace: "#FBF6E7",
  roadVerge: "#EADDBD",
  roadShade: "#7C7355",
  trailFace: "#F0E3C2",
  wood: "#B4854F",
  woodDark: "#8A6234",
};

/* ===== 几何 ===== */
type Pt = [number, number];
const n = (v: number) => Math.round(v * 10) / 10;

function parsePoints(str: string): Pt[] {
  return str
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(",").map(Number) as Pt)
    .filter((p) => p.length === 2 && !Number.isNaN(p[0]) && !Number.isNaN(p[1]));
}

interface Seg { p1: Pt; c1: Pt; c2: Pt; p2: Pt }

/**
 * Catmull-Rom 平滑：后端路网是沿格点走的直角折线，直接画像地铁图；
 * 张力 0.82 把折点揉圆，才有手绘山路的味道。
 */
function smoothSegs(pts: Pt[], closed: boolean, tension = 0.82): Seg[] {
  const len = pts.length;
  if (len < 3) return [];
  const at = (i: number): Pt => (closed ? pts[((i % len) + len) % len] : pts[Math.min(Math.max(i, 0), len - 1)]);
  const last = closed ? len : len - 1;
  const out: Seg[] = [];
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    out.push({
      p1,
      c1: [p1[0] + ((p2[0] - p0[0]) / 6) * tension, p1[1] + ((p2[1] - p0[1]) / 6) * tension],
      c2: [p2[0] - ((p3[0] - p1[0]) / 6) * tension, p2[1] - ((p3[1] - p1[1]) / 6) * tension],
      p2,
    });
  }
  return out;
}

function pathFrom(segs: Seg[], closed: boolean): string {
  if (!segs.length) return "";
  const [x0, y0] = segs[0].p1;
  const body = segs
    .map((s) => `C${n(s.c1[0])},${n(s.c1[1])} ${n(s.c2[0])},${n(s.c2[1])} ${n(s.p2[0])},${n(s.p2[1])}`)
    .join(" ");
  return `M${n(x0)},${n(y0)} ${body}${closed ? " Z" : ""}`;
}

const closedPath = (pts: Pt[]) => pathFrom(smoothSegs(pts, true), true);
const openPath = (pts: Pt[], t = 0.7) => pathFrom(smoothSegs(pts, false, t), false);

function bezierAt(s: Seg, t: number) {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  const x = a * s.p1[0] + b * s.c1[0] + c * s.c2[0] + d * s.p2[0];
  const y = a * s.p1[1] + b * s.c1[1] + c * s.c2[1] + d * s.p2[1];
  const dx = 3 * u * u * (s.c1[0] - s.p1[0]) + 6 * u * t * (s.c2[0] - s.c1[0]) + 3 * t * t * (s.p2[0] - s.c2[0]);
  const dy = 3 * u * u * (s.c1[1] - s.p1[1]) + 6 * u * t * (s.c2[1] - s.c1[1]) + 3 * t * t * (s.p2[1] - s.c2[1]);
  return { x, y, ang: (Math.atan2(dy, dx) * 180) / Math.PI };
}

function isClosed(pts: Pt[]) {
  if (pts.length < 4) return false;
  const a = pts[0], b = pts[pts.length - 1];
  return Math.abs(a[0] - b[0]) < 2 && Math.abs(a[1] - b[1]) < 2;
}

/** 确定性伪随机：同一份代码每次渲染出同一张图，小程序端 image src 才不会一直变 */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 有机闭合轮廓：椭圆周抖动后平滑，草地/水塘/山头的边都不该是正圆 */
function blobPts(cx: number, cy: number, rx: number, ry: number, seed: number, wob = 0.14, steps = 12): Pt[] {
  const rand = rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const k = 1 + (rand() - 0.5) * 2 * wob;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return pts;
}

const blob = (cx: number, cy: number, rx: number, ry: number, seed: number, wob = 0.14, steps = 12) =>
  closedPath(blobPts(cx, cy, rx, ry, seed, wob, steps));

/** 变宽河道：沿法向按每点宽度偏出左右岸，各自平滑后闭合成面 */
function ribbonPath(pts: Pt[], half: number[]): string {
  const L: Pt[] = [];
  const R: Pt[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(i - 1, 0)];
    const b = pts[Math.min(i + 1, pts.length - 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    L.push([p[0] - (dy / len) * half[i], p[1] + (dx / len) * half[i]]);
    R.push([p[0] + (dy / len) * half[i], p[1] - (dx / len) * half[i]]);
  });
  const rev = R.slice().reverse();
  const dR = pathFrom(smoothSegs(rev, false, 0.7), false).replace(/^M[\d.,-]+\s*/, "");
  return `${openPath(L, 0.7)} L${n(rev[0][0])},${n(rev[0][1])} ${dR} Z`;
}

function poly(pts: Pt[], fill: string, extra = "") {
  return `<polygon points="${pts.map((p) => p.join(",")).join(" ")}" fill="${fill}" ${extra}/>`;
}

/* ===== 地形：分层晕渲 ===== */

/**
 * 等高线只画朝谷地那一侧的弧段：整圈缩放的同心闭合线一定会长成靶心。
 * from/to 是取样的顶点区间，shrink 控制往内收多少。
 */
function contourArc(pts: Pt[], shrink: number, from: number, to: number, seed: number) {
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const rand = rng(seed);
  const sub: Pt[] = [];
  for (let i = from; i <= to; i++) {
    const p = pts[i % pts.length];
    const k = shrink + (rand() - 0.5) * 0.05;
    sub.push([cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]);
  }
  return `<path d="${openPath(sub, 0.6)}" fill="none" stroke="${P.contour}" stroke-width="1.3" stroke-linecap="round" opacity=".5"/>`;
}

/* ===== 植被：把树冠长进轮廓里 ===== */

const TAU = Math.PI * 2;
const ellR = (rx: number, ry: number, a: number) => 1 / Math.hypot(Math.cos(a) / rx, Math.sin(a) / ry);

/**
 * 山的边线本身就该是树冠线：沿椭圆每跨一步往外鼓一道弧，剪影天生带毛边。
 * 这样一座山只要三条 path（同一串 d 做三次错位）就"长满林"——
 * 真去撒几百个独立树冠，节点数和字节数都会爆，小程序端那份 data URI 首当其冲。
 * bulge 直接给"树冠鼓出轮廓多少像素"，要按瓣间距调：鼓出/间距 ≈ 0.3 才像树，
 * 到 0.5 就成了西兰花。
 */
function crown(cx: number, cy: number, rx: number, ry: number, bulge: number, seed: number, lobes: number): string {
  const rand = rng(seed);
  const at = (a: number, rad: number) => `${Math.round(cx + Math.cos(a) * rad)},${Math.round(cy + Math.sin(a) * rad)}`;
  let d = "";
  for (let i = 0; i < lobes; i++) {
    const a0 = (i / lobes) * TAU;
    const a1 = ((i + 1) / lobes) * TAU;
    const am = (a0 + a1) / 2;
    const r0 = ellR(rx, ry, a0) * (1 + (rand() - 0.5) * 0.1);
    const r1 = ellR(rx, ry, a1) * (1 + (rand() - 0.5) * 0.1);
    const rm = ellR(rx, ry, am) + bulge * (1.7 + rand() * 0.7);
    if (!i) d += `M${at(a0, r0)}`;
    d += `Q${at(am, rm)} ${at(a1, r1)}`;
  }
  return d + "Z";
}

/** 同一串轮廓刷三遍、每遍朝西北挪一点：三层明度就是这么来的 */
function layered(d: string, tones: [string, string, string], step: number) {
  return (
    `<path d="${d}" fill="${tones[2]}"/>` +
    `<path d="${d}" fill="${tones[1]}" transform="translate(${-step},${-step * 1.4})"/>` +
    `<path d="${d}" fill="${tones[0]}" transform="translate(${-step * 2},${-step * 2.7})"/>`
  );
}

/**
 * 森林纹理：山体内部不能是死色，但一棵棵画树冠字节吃不消，稀疏撒又变成纸屑。
 * 平铺一块 96×84 的"树冠碎块" tile 是最省的解法：暗碎块定密度、亮碎块定受光，
 * 所有冠都收在 tile 内不跨边，接缝就看不见；矢量平铺放大也不糊。
 */
function forestTex() {
  const dark = new Bag();
  const lit = new Bag();
  const D: Array<[number, number, number]> = [
    [24, 22, 9], [52, 18, 7], [76, 30, 10], [30, 48, 8], [60, 54, 9], [22, 66, 7], [46, 70, 8], [74, 64, 8],
  ];
  const L: Array<[number, number, number]> = [[34, 26, 5], [64, 40, 6], [24, 56, 5], [70, 20, 5], [48, 62, 4], [80, 50, 5]];
  D.forEach(([x, y, r], i) => dark.add(x, y, r, 31 + i * 7));
  L.forEach(([x, y, r], i) => lit.add(x, y, r, 131 + i * 7));
  return (
    `<pattern id="qmlFor" width="96" height="84" patternUnits="userSpaceOnUse">` +
    dark.to(P.canopy, ' opacity=".34"') +
    lit.to(P.canopyLit, ' opacity=".22"') +
    `</pattern>`
  );
}

/** 一棵独立小树：同一套鼓弧画法，只是半径小、瓣数少 */
const tree = (x: number, y: number, r: number, seed: number) => crown(x, y, r, r * 0.88, r * 0.22, seed, 5);

/**
 * 同色调的树全塞进一个 path。几百棵树只占几个 DOM 节点，
 * 放大 3.6 倍时浏览器只需重算一次填充。
 */
class Bag {
  private d = "";
  add(x: number, y: number, r: number, seed: number) { this.d += tree(x, y, r, seed); }
  to(fill: string, extra = "") { return this.d ? `<path d="${this.d}" fill="${fill}"${extra}/>` : ""; }
}

/** 果园：成行栽植的小树，暗底+中间调两层就够读出树冠 */
function orchard(cx: number, cy: number, cols: number, rows: number, gx: number, gy: number, seed: number) {
  const dark = new Bag();
  const mid = new Bag();
  const lit = new Bag();
  const rand = rng(seed);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = cx + c * gx + (r % 2 ? gx * 0.5 : 0) + (rand() - 0.5) * 4;
      const y = cy + r * gy + (rand() - 0.5) * 3;
      const s = seed + r * 31 + c * 7;
      dark.add(x + 1.6, y + 2.6, 8.4, s);
      mid.add(x, y, 8, s + 3);
      if (rand() > 0.6) lit.add(x - 2.4, y - 3, 3.6, s + 5);
    }
  }
  const shadow = new Bag();
  let blossoms = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = cx + c * gx + (r % 2 ? gx * 0.5 : 0);
      const y = cy + r * gy;
      shadow.add(x + 2, y + 8, 7, seed + r + c);
      if (rand() > 0.74) blossoms += `<circle cx="${Math.round(x + 4)}" cy="${Math.round(y - 4)}" r="1.8" fill="${P.blossom}"/>`;
    }
  }
  return shadow.to(P.ink, ' opacity=".12"') + dark.to(P.canopy) + mid.to(P.canopyMid) + lit.to(P.canopyLit) + blossoms;
}

/**
 * 水田：先当"一整块挂在坡上的水面"来画，田埂只是块内的细线。
 * 一格一格独立描边会画成梯子——真实航拍里田埂是浅脊不是暗墙，所以顺埂留淡色，
 * 只在埂的迎光侧压一道深色，反光随机给几处，不给每一格。
 */
let clipSeq = 0;
function paddyBlock(pts: Pt[], seed: number) {
  const d = closedPath(pts);
  const rand = rng(seed);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs) - 30;
  const x1 = Math.max(...xs) + 30;
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const gap = 25 + rand() * 6;
  const cx = (x0 + x1) / 2;
  let bands = "";
  let dyke = "";
  let glint = "";
  for (let y = y0 - gap, i = 0; y < y1 + gap; y += gap, i++) {
    const bow = (15 + rand() * 8) * (0.85 + rand() * 0.4);
    const top = `M${n(x0)},${n(y)} Q${n(cx)},${n(y - bow)} ${n(x1)},${n(y - bow * 0.4)}`;
    if (i % 2) bands += `<path d="${top} L${n(x1)},${n(y + gap - bow * 0.4)} Q${n(cx)},${n(y + gap - bow)} ${n(x0)},${n(y + gap)} Z" fill="${P.paddyAlt}"/>`;
    dyke += `<path d="${top}" fill="none" stroke="${P.terraceWall}" stroke-width="2.2" opacity=".8"/>`;
    dyke += `<path d="${top}" fill="none" stroke="#FFFFFF" stroke-width=".9" opacity=".35" transform="translate(0,-1.6)"/>`;
    if (rand() > 0.66) {
      const gx = x0 + 24 + rand() * (x1 - x0 - 70);
      glint += `<path d="M${n(gx)},${n(y - bow * 0.5)} q13,-3.2 27,1" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity=".3"/>`;
    }
  }
  const id = `pb${++clipSeq}`;
  return (
    `<defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs>` +
    `<path d="${d}" fill="${P.paddy}"/>` +
    `<g clip-path="url(#${id})">${bands}<g fill="none" stroke-linecap="round">${dyke}${glint}</g></g>` +
    `<path d="${d}" fill="none" stroke="${P.terraceWall}" stroke-width="1.3" opacity=".45"/>`
  );
}

/** 田块：不规则四边形 + 顺茬细线。clip 必须跟着这块田自己的轮廓走 */
let fieldSeq = 0;
function field(pts: Pt[], fill: string, seed: number) {
  const d = closedPath(pts);
  const rand = rng(seed);
  const ys = pts.map((p) => p[1]);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const id = `fc${++fieldSeq}`;
  let lines = "";
  for (let y = y0 + 6; y < y1 - 3; y += 7) lines += `<path d="M${n(pts[0][0] - 20)},${n(y)} L${n(pts[0][0] + 260)},${n(y + (rand() - 0.5) * 4)}"/>`;
  return (
    `<defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs>` +
    `<path d="${d}" fill="${fill}"/>` +
    `<g clip-path="url(#${id})" stroke="${P.terraceWall}" stroke-width=".9" opacity=".34" fill="none">${lines}</g>` +
    `<path d="${d}" fill="none" stroke="${P.ink}" stroke-width="1.2" opacity=".18"/>`
  );
}

/* ===== 水系 ===== */
function stream(pts: Pt[], half: number[], seed: number) {
  const d = ribbonPath(pts, half);
  const lit = ribbonPath(pts, half.map((v) => v * 0.42));
  const rand = rng(seed);
  let ripples = "";
  for (let i = 2; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    const a = pts[i - 1];
    const b = pts[i + 1];
    const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
    if (rand() > 0.45) ripples += `<path d="M${n(x - 5)},${n(y)} q5,3.4 10,0" transform="rotate(${n(ang)},${n(x)},${n(y)})"/>`;
  }
  return (
    `<path d="${d}" fill="${P.bank}" opacity=".85" transform="translate(1.6,2.4)"/>` +
    `<path d="${d}" fill="${P.water}"/>` +
    `<path d="${lit}" fill="${P.waterLit}" opacity=".7"/>` +
    `<g fill="none" stroke="${P.waterDeep}" stroke-width="1.2" stroke-linecap="round" opacity=".45">${ripples}</g>`
  );
}

/** 芦苇：一簇弧线挑穗，只长在水边 */
function reeds(x: number, y: number, s: number) {
  let out = `<g fill="none" stroke="#93AF82" stroke-width="1.5" stroke-linecap="round">`;
  for (let i = -1; i <= 1; i++) out += `<path d="M${n(x)},${n(y)} Q${n(x + i * s * 0.9)},${n(y - s * 1.5)} ${n(x + i * s * 1.5)},${n(y - s * 2.3)}"/>`;
  return out + `</g>` + `<g fill="#C6AE78">${[-1, 0, 1].map((i) => `<ellipse cx="${n(x + i * s * 1.5)}" cy="${n(y - s * 2.5)}" rx="${n(s * 0.24)}" ry="${n(s * 0.6)}"/>`).join("")}</g>`;
}

/* ===== 路网 ===== */

/**
 * 软边靠"宽而淡的底 + 窄而实的面"叠出来，不画虚线中线——
 * 那是公路图标语言的标志，落在手绘图上就是贴纸。
 */
function roadLayer(ring: string, trail: string) {
  const ringPts = parsePoints(ring);
  const trailPts = parsePoints(trail);
  const rc = isClosed(ringPts);
  const dRing = pathFrom(smoothSegs(ringPts, rc, 0.7), rc);
  const dTrail = openPath(trailPts, 0.7);
  const stroke = (d: string, color: string, w: number, op = 1) =>
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`;
  return (
    `<g>` +
    stroke(dRing, P.roadShade, 16, 0.26).replace("<path", '<path transform="translate(1.2,2.6)"') +
    stroke(dTrail, P.roadShade, 9.5, 0.22).replace("<path", '<path transform="translate(1.2,2.6)"') +
    stroke(dRing, P.roadVerge, 15) +
    stroke(dTrail, P.roadVerge, 8.6) +
    stroke(dRing, P.roadFace, 10.4) +
    stroke(dTrail, P.trailFace, 4.8) +
    stroke(dRing, "#FFFFFF", 2.4, 0.5) +
    stroke(dTrail, "#FFFFFF", 1.3, 0.34) +
    `</g>`
  );
}

/** 木桥：跨在水面上，桥板垂直于走向 */
function bridge(cx: number, cy: number, rot: number, span = 36) {
  const planks = [-12, -4, 4, 12].map((px) => `<path d="M${px},-10 L${px},10"/>`).join("");
  return `<g transform="translate(${cx},${cy}) rotate(${rot})">
    <rect x="${-span / 2 - 1}" y="-12" width="${span + 2}" height="24" rx="3" fill="${P.ink}" opacity=".2" transform="translate(1.6,3)"/>
    <rect x="${-span / 2}" y="-10" width="${span}" height="20" rx="2" fill="${P.wood}"/>
    <g stroke="${P.woodDark}" stroke-width="1.4" opacity=".6">${planks}</g>
    <path d="M${-span / 2 - 2},-12 L${span / 2 + 2},-12 M${-span / 2 - 2},12 L${span / 2 + 2},12" stroke="${P.woodDark}" stroke-width="2.6" stroke-linecap="round"/>
    <g stroke="#DFC295" stroke-width="1.5" stroke-linecap="round">${[-14, -5, 5, 14].map((px) => `<path d="M${px},-12 L${px},-15.4"/>`).join("")}</g>
  </g>`;
}

/* ===== 2.5D 地标 ===== */
function iso(x: number, y: number, s: number, u: number, v: number, h: number): Pt {
  return [n(x + (u - v) * 0.866 * s), n(y + (u + v) * 0.5 * s - h * s)];
}

interface IsoOpts {
  a?: number; b?: number; h?: number;
  wall?: string; roof?: string; roofDark?: string;
  roofOver?: number; deck?: boolean; gazebo?: boolean;
  steps?: boolean; lift?: number;
}

/**
 * 不描黑边：明暗全靠顶面最亮、右面中间、左面最暗三个色阶，
 * 加一个椭圆暖色落地影把房子"坐"进地里，否则就是浮在图上的磁贴。
 * (cx, cy) 是地图落点，与点位坐标同一套。
 */
function isoBuilding(cx: number, cy: number, s: number, o: IsoOpts = {}) {
  const a = o.a ?? 15;
  const b = o.b ?? 11;
  const h = o.h ?? 9;
  const wall = o.wall ?? "#F2E7D0";
  const roof = o.roof ?? "#BC6A4C";
  const roofDark = o.roofDark ?? "#94492F";
  const ov = o.roofOver ?? 2.6;
  const lift = o.lift ?? 6;

  const x = cx - (a - b) * 0.433 * s;
  const y = cy + lift - (a + b) * 0.25 * s;
  const shade = (c: string, k = 0.82) => {
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const bch = parseInt(c.slice(5, 7), 16);
    return `#${[r, g, bch].map((v) => Math.round(v * k).toString(16).padStart(2, "0")).join("")}`;
  };
  const wallDark = shade(wall, 0.86);
  const wallDeep = shade(wall, 0.72);

  let out = `<ellipse cx="${n(cx + 4)}" cy="${n(cy + lift + 2)}" rx="${n((a + b) * 0.6 * s)}" ry="${n((a + b) * 0.29 * s)}" fill="${P.ink}" opacity=".12"/>`;
  out += poly([iso(x, y, s, -1, b + 1, 1.4), iso(x, y, s, a + 1, b + 1, 1.4), iso(x, y, s, a + 1, b + 1, 0), iso(x, y, s, -1, b + 1, 0)], "#E0D6B8");
  out += poly([iso(x, y, s, a + 1, -1, 1.4), iso(x, y, s, a + 1, b + 1, 1.4), iso(x, y, s, a + 1, b + 1, 0), iso(x, y, s, a + 1, -1, 0)], "#CBBE9E");

  out += poly([iso(x, y, s, 0, b, h), iso(x, y, s, a, b, h), iso(x, y, s, a, b, 1.4), iso(x, y, s, 0, b, 1.4)], wallDeep);
  out += poly([iso(x, y, s, a, 0, h), iso(x, y, s, a, b, h), iso(x, y, s, a, b, 1.4), iso(x, y, s, a, 0, 1.4)], wallDark);
  out += poly([iso(x, y, s, 0, 0, h), iso(x, y, s, a, 0, h), iso(x, y, s, a, b, h), iso(x, y, s, 0, b, h)], wall);
  out += poly([iso(x, y, s, a * 0.3, b, 1.4), iso(x, y, s, a * 0.54, b, 1.4), iso(x, y, s, a * 0.54, b, h * 0.6), iso(x, y, s, a * 0.3, b, h * 0.6)], "#8B6B45");
  out += poly([iso(x, y, s, a, b * 0.26, h * 0.42), iso(x, y, s, a, b * 0.52, h * 0.42), iso(x, y, s, a, b * 0.52, h * 0.78), iso(x, y, s, a, b * 0.26, h * 0.78)], "#C7DCE2");

  if (o.steps) {
    for (let i = 0; i < 3; i++) {
      const t = 1.4 + i * 1.6;
      out += poly(
        [
          iso(x, y, s, a * 0.26 - t * 0.5, b + t, 0),
          iso(x, y, s, a * 0.6 + t * 0.5, b + t, 0),
          iso(x, y, s, a * 0.6 + t * 0.5, b + t, 1.5 - i * 0.45),
          iso(x, y, s, a * 0.26 - t * 0.5, b + t, 1.5 - i * 0.45),
        ],
        "#DED3B8",
      );
    }
  }

  if (o.deck) {
    const posts: string[] = [];
    for (let i = 0; i <= 5; i++) {
      posts.push(`<path d="M${iso(x, y, s, (a * i) / 5, b, h).join(",")} L${iso(x, y, s, (a * i) / 5, b, h + 5.6).join(",")}"/>`);
      posts.push(`<path d="M${iso(x, y, s, a, (b * i) / 5, h).join(",")} L${iso(x, y, s, a, (b * i) / 5, h + 5.6).join(",")}"/>`);
    }
    const rA = iso(x, y, s, 0, b, h + 5.6);
    const rB = iso(x, y, s, a, b, h + 5.6);
    const rC = iso(x, y, s, a, 0, h + 5.6);
    out += `<g stroke="${P.woodDark}" stroke-width="1.6" stroke-linecap="round" fill="none">${posts.join("")}<path d="M${rA.join(",")} L${rB.join(",")} L${rC.join(",")}"/></g>`;
  }

  if (o.gazebo) {
    // 攒尖顶：四片三角瓦面收进一个顶心，观景亭和方亭共用
    const k = a * 0.62;
    const p0 = iso(x, y, s, -1.4, -1.4, h);
    const p1 = iso(x, y, s, a + 1.4, -1.4, h);
    const p2 = iso(x, y, s, a + 1.4, b + 1.4, h);
    const p3 = iso(x, y, s, -1.4, b + 1.4, h);
    const apex = iso(x, y, s, a / 2, b / 2, h + k);
    out += poly([p3, p2, apex], roofDark);
    out += poly([p0, p1, apex], roof);
    out += poly([p1, p2, apex], shade(roof, 0.8));
    out += poly([p0, p3, apex], shade(roofDark, 0.86));
    out += `<circle cx="${apex[0]}" cy="${apex[1]}" r="${n(1.9)}" fill="${P.woodDark}"/>`;
    return out;
  }

  const r = ov;
  const ridgeL = iso(x, y, s, -r, b / 2, h + 5.4);
  const ridgeR = iso(x, y, s, a + r, b / 2, h + 5.4);
  const e1 = iso(x, y, s, -r, -r, h);
  const e2 = iso(x, y, s, a + r, -r, h);
  const e3 = iso(x, y, s, a + r, b + r, h);
  const e4 = iso(x, y, s, -r, b + r, h);
  out += poly([e4, e3, ridgeR, ridgeL], roofDark);
  out += poly([e1, e2, ridgeR, ridgeL], roof);
  out += `<path d="M${ridgeL.join(",")} L${ridgeR.join(",")}" stroke="#F7F0DE" stroke-width="1.6" opacity=".7"/>`;
  return out;
}

/* ===== 导览路线 ===== */

/**
 * 后端给的路线是一串途经点，而相邻两个途经点往往在路网上并不相连
 * （A 线里 430,565 直接跳到 660,565）。照点连线就是三条横切山谷的直线，
 * 看着像高压线。所以先把环乡道+溪谷步道建成图，再最短路展开成真正沿路走的折线。
 */
interface Network {
  nodes: Pt[];
  adj: Map<number, number[]>;
  dist: Map<string, number>;
  idOf: (p: Pt) => number;
}

function buildNetwork(ring: string, trail: string): Network {
  const nodes: Pt[] = [];
  const adj = new Map<number, number[]>();
  const dist = new Map<string, number>();
  const idOf = (p: Pt) => {
    const hit = nodes.findIndex((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 9);
    if (hit >= 0) return hit;
    nodes.push(p);
    return nodes.length - 1;
  };
  const link = (a: number, b: number) => {
    if (a === b) return;
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
    const k = a < b ? `${a}:${b}` : `${b}:${a}`;
    const d = Math.hypot(nodes[a][0] - nodes[b][0], nodes[a][1] - nodes[b][1]);
    if (d < (dist.get(k) ?? Infinity)) dist.set(k, d);
  };
  [ring, trail].forEach((s) => {
    const pts = parsePoints(s);
    for (let i = 0; i < pts.length - 1; i++) link(idOf(pts[i]), idOf(pts[i + 1]));
  });
  return { nodes, adj, dist, idOf };
}

const edgeKey = (a: number, b: number) => (a < b ? `${a}:${b}` : `${b}:${a}`);

function shortestPath(g: Network, from: number, to: number): number[] | null {
  if (from === to) return [from];
  const cost = new Map<number, number>([[from, 0]]);
  const prev = new Map<number, number>();
  const done = new Set<number>();
  for (;;) {
    let cur = -1;
    let best = Infinity;
    cost.forEach((c, id) => {
      if (!done.has(id) && c < best) { best = c; cur = id; }
    });
    if (cur < 0) return null;
    if (cur === to) break;
    done.add(cur);
    (g.adj.get(cur) ?? []).forEach((nb) => {
      if (done.has(nb)) return;
      const c = best + (g.dist.get(edgeKey(cur, nb)) ?? Infinity);
      if (c < (cost.get(nb) ?? Infinity)) { cost.set(nb, c); prev.set(nb, cur); }
    });
  }
  const path = [to];
  let at = to;
  while (at !== from) { at = prev.get(at)!; path.unshift(at); }
  return path;
}

/** 沿路网展开；某段在图上不连通时退回直线，至少不会把行程画断 */
function alongNetwork(g: Network, pts: Pt[]): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = g.idOf(pts[i]);
    const b = g.idOf(pts[i + 1]);
    const path = shortestPath(g, a, b);
    const hop = path ? path.map((id) => g.nodes[id]) : [pts[i], pts[i + 1]];
    hop.forEach((p, k) => {
      if (i > 0 && k === 0) return;
      const last = out[out.length - 1];
      if (last && Math.hypot(last[0] - p[0], last[1] - p[1]) < 1) return;
      out.push(p);
    });
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/**
 * 多路线态只当淡色线索引（三条一起画必然成意面），选中单条才给足重量：
 * 先做一次描边生长交代路径，再放一段高光沿路径巡游表方向。
 * 不用匀速平移的虚线——那是蚂蚁线，看着像传送带不像走路。
 */
function routeLayer(routes: SceneRoute[], single: boolean, g: Network) {
  let bands = "";
  let cores = "";
  let marks = "";
  routes.forEach((r) => {
    const raw = parsePoints(r.points);
    if (raw.length < 3) return;
    const pts = alongNetwork(g, raw);
    const closed = isClosed(pts);
    const segs = smoothSegs(pts, closed, 0.7);
    const d = pathFrom(segs, closed);
    bands += `<path d="${d}" fill="none" stroke="${r.color}" stroke-width="${single ? 15 : 8}" stroke-linecap="round" stroke-linejoin="round" opacity="${single ? 0.24 : 0.16}"/>`;
    if (single) {
      cores += `<path class="qml-core" pathLength="1" d="${d}" fill="none" stroke="${r.color}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`;
      cores += `<path class="qml-run" pathLength="1" d="${d}" fill="none" stroke="#FFFFFF" stroke-width="3.6" stroke-linecap="round" opacity=".95"/>`;
    } else {
      cores += `<path d="${d}" fill="none" stroke="${r.color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>`;
    }
    if (!single) {
      const [sx0, sy0] = pts[0];
      marks += `<circle cx="${n(sx0)}" cy="${n(sy0)}" r="5.4" fill="${r.color}" opacity=".8"/>`;
      return;
    }
    segs.forEach((s) => {
      const len = Math.hypot(s.p2[0] - s.p1[0], s.p2[1] - s.p1[1]);
      if (len < 72) return;
      const { x, y, ang } = bezierAt(s, 0.5);
      marks += `<g transform="translate(${n(x)},${n(y)}) rotate(${n(ang)})">
        <path d="M-4.6,-4.4 L4.6,0 L-4.6,4.4 L-1.9,0 Z" fill="#FFFDF4" opacity=".95"/>
        <path d="M-3.3,-3.3 L3.5,0 L-3.3,3.3 L-1.5,0 Z" fill="${r.color}"/></g>`;
    });
    const [sx, sy] = raw[0];
    marks += `<g transform="translate(${n(sx)},${n(sy)})">
      <circle r="11" fill="#FFFDF4" stroke="${r.color}" stroke-width="2.4"/>
      <text y="4.6" text-anchor="middle" font-size="11.5" font-weight="700" fill="${r.color}" font-family="serif">起</text>
    </g>`;
  });
  return bands + cores + marks;
}

/* ===== 图面元素 ===== */

/** 指北针：罗盘玫瑰，北针甩长影 */
function compass() {
  return `<g transform="translate(692,900)">
    <circle cx="1.6" cy="3" r="25" fill="${P.ink}" opacity=".16"/>
    <circle r="25" fill="#FBF7E9" stroke="${P.ink}" stroke-width="1.5" stroke-opacity=".5"/>
    <circle r="20" fill="none" stroke="${P.ink}" stroke-width=".9" stroke-opacity=".26"/>
    <g fill="${P.ink}" stroke="none">
      <path d="M0,-17 L5.2,-2.4 L0,-5.4 L-5.2,-2.4 Z"/>
      <path d="M0,15 L4.2,2.2 L0,5 L-4.2,2.2 Z" opacity=".28"/>
      <path d="M-15,0 L-2.2,-4 L-5,0 L-2.2,4 Z" opacity=".28"/>
      <path d="M15,0 L2.2,-4 L5,0 L2.2,4 Z" opacity=".28"/>
    </g>
    <text y="-28" text-anchor="middle" font-size="11.5" font-weight="700" fill="${P.ink}" font-family="serif">N</text>
  </g>`;
}

/** 图廓：双线压角，让它像一张印出来的图而不是一个 div */
function keyline() {
  return `<g fill="none" stroke="${P.ink}">
    <rect x="6" y="6" width="${MAP_W - 12}" height="${MAP_H - 12}" stroke-width="2.6" stroke-opacity=".38"/>
    <rect x="13" y="13" width="${MAP_W - 26}" height="${MAP_H - 26}" stroke-width="1" stroke-opacity=".26"/>
    <g stroke-opacity=".5" stroke-width="2.6" stroke-linecap="butt">
      <path d="M6,40 L6,6 L40,6 M${MAP_W - 40},6 L${MAP_W - 6},6 L${MAP_W - 6},40"/>
      <path d="M${MAP_W - 6},${MAP_H - 40} L${MAP_W - 6},${MAP_H - 6} L${MAP_W - 40},${MAP_H - 6} M40,${MAP_H - 6} L6,${MAP_H - 6} L6,${MAP_H - 40}"/>
    </g>
  </g>`;
}

/* ===== 地形编排 =====
 * 这份数据把谷地讲得很清楚：环乡道围出一块椭圆坝子，点位名各自标了坡向用途——
 * 北口梅岭果园、东坡稻田观景台、南口竹海小筑、中间一条溪（溪谷步道/溪畔人家/江畔芦苇滩）。
 * 所以山只画在环线外侧，环内一律留白成坝子；山在外、田在内、水居中，一读就懂。
 */

type Mass = [number, number, number, number];

/** 北侧远山：推远用冷而淡的调子，树冠线也收小，避免和近山糊成一片 */
const NORTH_PEAKS: Mass[] = [[30, 46, 132, 78], [200, 12, 148, 86], [400, 40, 140, 78], [600, 8, 148, 88], [742, 48, 118, 76]];
/** 西岭 / 东岭：谷地两侧的近山，树冠线放最大，压得住画面 */
const WEST_PEAKS: Mass[] = [[-34, 210, 120, 96], [16, 396, 116, 92], [-26, 590, 124, 98], [22, 786, 118, 94]];
const EAST_PEAKS: Mass[] = [[778, 232, 120, 98], [726, 420, 112, 92], [784, 616, 124, 98], [724, 810, 116, 94]];
/** 南口：收住下缘，中间留缺口让溪水流出去 */
const SOUTH_PEAKS: Mass[] = [[96, 966, 146, 88], [330, 1000, 156, 90], [610, 978, 150, 88]];

/**
 * bulge 定树冠线的咬合深度，瓣数按山头周长短出来——写死瓣数会把大山撒成几个大包子。
 * 内部质感交给 FOREST_TEX 平铺，再在东南侧压一团软暗斑当背光坡。
 */
function ridgeGroup(masses: Mass[], tones: [string, string, string], bulge: number, seed: number, facing: 0 | 3 | 6, step: number, tex: boolean) {
  let out = "";
  masses.forEach(([cx, cy, rx, ry], i) => {
    const s = seed + i * 23;
    const lobes = Math.max(16, Math.round((Math.PI * (rx + ry)) / (bulge * 3.2)));
    const d = crown(cx, cy, rx, ry, bulge, s, lobes);
    out += layered(d, tones, step);
    if (tex) out += `<path d="${d}" fill="url(#qmlFor)"/>`;
    out += `<path d="${blob(cx + rx * 0.2, cy + ry * 0.24, rx * 0.52, ry * 0.44, s + 29, 0.2)}" fill="${P.canopy}" opacity=".15"/>`;
    const outline = blobPts(cx, cy, rx * 0.72, ry * 0.72, s + 7, 0.1, 12);
    out += contourArc(outline, 0.9, facing, facing + 3, s + 11);
    out += contourArc(outline, 0.74, facing + 1, facing + 4, s + 13);
  });
  return out;
}

function terrainLayer(tex: boolean) {
  let out = "";
  out += `<rect width="${MAP_W}" height="${MAP_H}" fill="${P.hill4}"/>`;
  if (tex) {
    out += `<rect width="${MAP_W}" height="${MAP_H}" fill="url(#qmlFor)" opacity=".5"/>`;
    out += `<rect x="-60" y="-60" width="${MAP_W + 120}" height="${MAP_H + 120}" fill="url(#qmlFor)" opacity=".32" transform="rotate(4 375 490) translate(41,57)"/>`;
  }

  // 北首两道远脊：只用折线起伏定层次，不抢树冠线
  out += `<path d="${closedPath([[-30, 148], [60, 82], [150, 114], [236, 50], [322, 94], [398, 38], [476, 82], [552, 32], [636, 76], [706, 44], [780, 102], [780, -20], [-30, -20]])}" fill="${P.far1}"/>`;
  out += `<path d="${closedPath([[-30, 178], [70, 122], [162, 152], [248, 96], [336, 138], [420, 92], [502, 130], [586, 88], [668, 124], [780, 96], [780, -20], [-30, -20]])}" fill="${P.far2}"/>`;

  out += ridgeGroup(NORTH_PEAKS, [P.far2, P.far1, P.hill2], 8, 501, 3, 18, tex);
  out += ridgeGroup(WEST_PEAKS, [P.hill2, P.hill1, P.hill3], 11, 601, 0, 30, tex);
  out += ridgeGroup(EAST_PEAKS, [P.hill2, P.hill1, P.hill3], 11, 701, 6, 30, tex);
  out += ridgeGroup(SOUTH_PEAKS, [P.hill2, P.hill1, P.hill3], 10, 801, 3, 26, tex);

  // 坝子：外圈一道深草收边，内圈才是受光的谷底，山脚于是有了重量
  out += `<path d="${crown(388, 508, 302, 380, 9, 901, 72)}" fill="${P.rim}"/>`;
  out += `<path d="${crown(392, 512, 286, 362, 9, 907, 68)}" fill="${P.meadow}"/>`;
  out += `<path d="${blob(340, 330, 168, 118, 911, 0.14)}" fill="${P.meadowLit}" opacity=".35"/>`;
  out += `<path d="${blob(452, 660, 158, 140, 917, 0.16)}" fill="${P.meadowLit}" opacity=".3"/>`;
  out += `<path d="${blob(238, 560, 96, 128, 923, 0.18)}" fill="${P.meadowDeep}" opacity=".75"/>`;
  out += `<path d="${blob(560, 806, 116, 74, 929, 0.18)}" fill="${P.meadowDeep}" opacity=".65"/>`;

  // 梅岭：谷地里唯一一座独立丘陵，2 号观景台立在它的顶上
  const ml = crown(556, 452, 74, 58, 12, 935, 11);
  out += layered(ml, [P.hill2, P.hill1, P.hill3], 14);
  if (tex) out += `<path d="${ml}" fill="url(#qmlFor)"/>`;
  return out;
}

/** 一行树篱/林带：沿给定坐标串撒小冠，暗底+中间调两层 */
function treeline(pts: Pt[], r: number, seed: number) {
  const dark = new Bag();
  const mid = new Bag();
  const rand = rng(seed);
  pts.forEach(([x, y], i) => {
    const jx = x + (rand() - 0.5) * r * 0.7;
    const jy = y + (rand() - 0.5) * r * 0.7;
    const rr = r * (0.82 + rand() * 0.4);
    dark.add(jx + 1.4, jy + 2.2, rr, seed + i * 11);
    mid.add(jx, jy, rr * 0.94, seed + i * 11 + 5);
  });
  return dark.to(P.canopy) + mid.to(P.canopyMid);
}

/**
 * 河岸林带：沿每段法向左右各偏 15px 撒小冠。
 * 等距密排会画成刻度尺，所以位置抖动、密度抽掉一半——树只长在该长的地方。
 */
function riparian(pts: Pt[], seed: number) {
  const rand = rng(seed);
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / len;
    const ny = (bx - ax) / len;
    for (let t = 12; t < len; t += 24) {
      if (rand() > 0.52) continue;
      const x = ax + ((bx - ax) * t) / len + (rand() - 0.5) * 7;
      const y = ay + ((by - ay) * t) / len + (rand() - 0.5) * 7;
      left.push([x + nx * 15, y + ny * 15]);
      right.push([x - nx * 15, y - ny * 15]);
    }
  }
  return treeline(left, 7.5, seed + 3) + treeline(right, 7.5, seed + 5);
}

function vegetationLayer() {
  let out = "";

  // 梅岭果园：北口成行栽植，行距固定才读得出是"种出来的"
  out += `<path d="${blob(398, 232, 122, 84, 941, 0.12)}" fill="${P.field}" opacity=".9"/>`;
  out += orchard(330, 196, 6, 4, 27, 23, 51);
  out += orchard(206, 302, 4, 3, 26, 22, 57);

  // 稻田：东坡两片，块面交给 paddyBlock 的田埂细线，别再画成一格一格
  out += paddyBlock([[546, 214], [684, 236], [676, 404], [540, 386]], 83);
  out += paddyBlock([[548, 470], [672, 486], [660, 604], [542, 580]], 87);
  out += field([[196, 636], [300, 620], [318, 690], [206, 712]], P.fieldAlt, 91);
  out += field([[232, 424], [318, 416], [330, 470], [240, 482]], P.field, 93);
  out += field([[356, 700], [452, 692], [466, 748], [366, 760]], P.paddyAlt, 95);
  out += field([[182, 470], [268, 462], [280, 522], [190, 534]], P.fieldAlt, 97);
  out += field([[352, 560], [448, 552], [460, 612], [362, 624]], P.field, 99);

  // 竹海：南口 12 号一带，细竿挑节，和阔叶林必须是两种笔触
  out += `<path d="${blob(286, 762, 96, 66, 947, 0.16)}" fill="${P.meadowDeep}" opacity=".9"/>`;
  out += `<g stroke="#4F7B4E" stroke-width="2.2" stroke-linecap="round" fill="none">`;
  const rand = rng(73);
  for (let i = 0; i < 26; i++) {
    const x = 226 + rand() * 116;
    const y = 742 + rand() * 62;
    out += `<path d="M${n(x)},${n(y)} C${n(x - 3)},${n(y - 16)} ${n(x + 4)},${n(y - 26)} ${n(x + 1)},${n(y - 36)}"/>`;
    out += `<path d="M${n(x - 4)},${n(y - 18)} l8,-2 M${n(x - 3)},${n(y - 29)} l8,-1.6" stroke-width="1.4" opacity=".7"/>`;
  }
  out += `</g>`;

  // 溪岸林带：三支水都咬上绿，溪才像是从山里流出来的
  out += riparian(CREEK, 1101) + riparian(FORK_W, 1151) + riparian(FORK_E, 1181);

  // 几棵独立大树：只留少数，多了就是噪点
  const lone = new Bag();
  const loneLit = new Bag();
  const loneShadow = new Bag();
  [[338, 528], [246, 214], [184, 812], [404, 640], [596, 700]].forEach(([x, y], i) => {
    lone.add(x, y, 11, 1401 + i * 13);
    loneLit.add(x - 3.4, y - 3.6, 5.4, 1411 + i * 13);
    loneShadow.add(x + 2.6, y + 6, 8, 1421 + i * 13);
  });
  out += loneShadow.to(P.ink, ' opacity=".14"') + lone.to(P.orchard) + loneLit.to(P.canopyLit);
  return out;
}

/* 溪：从北口顺谷地中线一路写到南口，三支汇流，桥只架在环乡道真正跨水的地方 */
const CREEK: Pt[] = [
  [392, 92], [410, 190], [432, 290], [458, 388], [478, 478], [498, 580],
  [520, 690], [566, 762], [622, 802], [668, 862], [700, 980],
];
const CREEK_HALF = [3, 3.6, 4.2, 4.9, 5.8, 6.6, 7.5, 8.4, 9.1, 9.9, 10.8];
const FORK_W: Pt[] = [[-10, 268], [60, 285], [140, 318], [230, 348], [330, 372], [420, 385], [458, 388]];
const FORK_W_HALF = [3.3, 3.6, 3.9, 4.2, 4.5, 4.8, 5];
const FORK_E: Pt[] = [[790, 392], [740, 410], [690, 428], [620, 452], [550, 468], [490, 477]];
const FORK_E_HALF = [3.2, 3.5, 3.8, 4.2, 4.6, 5];

function waterLayer() {
  let out = stream(FORK_E, FORK_E_HALF, 131) + stream(FORK_W, FORK_W_HALF, 133) + stream(CREEK, CREEK_HALF, 137);
  // 溪潭：汇流处冲出来的一汪，给水面一个呼吸
  out += `<path d="${blob(506, 632, 30, 19, 141, 0.14)}" fill="${P.bank}" opacity=".9" transform="translate(1.4,2.2)"/>`;
  out += `<path d="${blob(506, 632, 26, 15, 143, 0.14)}" fill="${P.water}"/>`;
  out += `<path d="${blob(503, 628, 12, 6, 147, 0.22)}" fill="${P.waterLit}" opacity=".8"/>`;
  // 芦苇只长在水边：江畔芦苇滩（620,800）密度最高
  out += reeds(596, 786, 5.4) + reeds(648, 826, 5.8) + reeds(574, 812, 5) + reeds(676, 852, 5.4) + reeds(624, 856, 4.8);
  out += reeds(478, 402, 4.6) + reeds(444, 372, 4.4) + reeds(532, 662, 4.8);
  return out;
}

/** 桥的落点/朝向 = 环乡道与溪线的交点，不是凭手感放的 */
const BRIDGES: Array<[number, number, number, number]> = [
  [122, 311, -80, 34], // 西支 × 环乡道西段
  [660, 440, -90, 32], // 东支 × 环乡道东段
  [622, 802, -45, 38], // 主溪 × 环乡道东南转角
];

/* ===== 主场景 ===== */
export function buildGuideScene(o: { ring: string; trail: string; routes: SceneRoute[]; single: boolean; tex?: boolean }): string {
  const net = buildNetwork(o.ring, o.trail);
  // 小程序 <image> 的 SVG 子集不保证支持 <pattern>，纹理只在 H5 内联渲染时开
  const tex = o.tex !== false;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MAP_W} ${MAP_H}" preserveAspectRatio="none">
  <defs>
    ${tex ? forestTex() : ""}
    <style>
      .qml-core{stroke-dasharray:1;stroke-dashoffset:1;animation:qml-draw 1.5s cubic-bezier(.32,.02,.2,1) forwards}
      .qml-run{stroke-dasharray:.055 .945;stroke-dashoffset:0;animation:qml-run 5.4s linear 1.5s infinite}
      @keyframes qml-draw{to{stroke-dashoffset:0}}
      @keyframes qml-run{to{stroke-dashoffset:-1}}
      @media (prefers-reduced-motion: reduce){.qml-core,.qml-run{animation:none;stroke-dasharray:none;stroke-dashoffset:0}}
    </style>
  </defs>

  ${terrainLayer(tex)}
  ${vegetationLayer()}
  ${waterLayer()}
  ${roadLayer(o.ring, o.trail)}
  ${BRIDGES.map(([x, y, r, s]) => bridge(x, y, r, s)).join("")}

  ${isoBuilding(320, 872, 2.1, { a: 24, b: 17, h: 15, roof: "#4E7357", roofDark: "#3A5A44", steps: true, lift: 9 })}
  ${isoBuilding(400, 152, 1.9, { a: 17, b: 12, h: 12, lift: 7 })}
  ${isoBuilding(145, 572, 1.8, { a: 15, b: 11, h: 11, roof: "#6E8794", roofDark: "#546975", steps: true, lift: 7 })}
  ${isoBuilding(300, 762, 1.75, { a: 14, b: 10, h: 11, roof: "#6E8794", roofDark: "#546975", lift: 7 })}
  ${isoBuilding(520, 702, 1.75, { a: 14, b: 10, h: 11, roof: "#8B7A55", roofDark: "#6E5F42", lift: 7 })}
  ${isoBuilding(120, 352, 1.8, { a: 15, b: 11, h: 11, roof: "#A9784A", roofDark: "#875D36", lift: 7 })}
  ${isoBuilding(115, 782, 1.75, { a: 13, b: 10, h: 10, roof: "#BC6A4C", roofDark: "#94492F", lift: 7 })}
  ${isoBuilding(660, 567, 1.8, { a: 14, b: 11, h: 9, roof: "#7E9A6E", roofDark: "#637C57", lift: 7 })}
  ${isoBuilding(300, 252, 1.65, { a: 12, b: 9, h: 9, roof: "#A9784A", roofDark: "#875D36", lift: 6 })}
  ${isoBuilding(220, 642, 1.85, { a: 18, b: 13, h: 13, roof: "#8F6A4A", roofDark: "#6E5038", steps: true, lift: 7 })}
  ${isoBuilding(130, 158, 2.1, { a: 12, b: 12, h: 5, roof: "#8A6A45", roofDark: "#6E5436", deck: true, lift: 5 })}
  ${isoBuilding(556, 452, 2.1, { a: 12, b: 12, h: 5, roof: "#8A6A45", roofDark: "#6E5436", gazebo: true, lift: 5 })}
  ${isoBuilding(660, 368, 2, { a: 11, b: 11, h: 4.6, roof: "#6E8794", roofDark: "#546975", gazebo: true, lift: 5 })}
  ${isoBuilding(450, 356, 2, { a: 12, b: 12, h: 5, roof: "#8A6A45", roofDark: "#6E5436", deck: true, lift: 5 })}

  ${routeLayer(o.routes, o.single, net)}
  ${compass()}
  ${keyline()}
</svg>`;
}
