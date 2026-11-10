// 花器與插花的物理擺放邏輯（不依賴 three.js，純數學）
// - 花莖會穿過瓶口的插入點，並依瓶口邊緣與瓶身內徑計算出自然傾斜角（Slant Angle）
// - Magnetic Snap：拖曳時吸附到最近的插花點
// - 碰撞遮罩：花頭以球體近似，迭代推開互相穿模的花朵

import type { Flower, Layer } from "@/data/flowers";

export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export type VaseId = "dish" | "terrazzo" | "glass";

export type VaseSpec = {
  id: VaseId;
  name: string;
  description: string;
  /** 插入點所在高度（瓶口或花泥頂面） */
  mouthY: number;
  floorY: number;
  /** foam：插在花泥上；vase：插在瓶中，受瓶身限制傾斜角 */
  kind: "foam" | "vase";
  innerRadius: number;
  /** 花泥尺寸（僅 foam） */
  foam?: { width: number; depth: number };
  maxTilt: number;
  anchors: Vec2[];
  transparent: boolean;
  /** 比例基準：花材高出瓶口的長度以它的倍數計算（瓶身高度；低盤則以盤寬換算的視覺高度） */
  refHeight: number;
  swatch: { color: string; name: string };
  care: string;
};

const STEM_RADIUS = 0.004;

function ring(radius: number, count: number, offset = 0): Vec2[] {
  return Array.from({ length: count }, (_, i) => {
    const a = offset + (i / count) * Math.PI * 2;
    return [Math.sin(a) * radius, Math.cos(a) * radius] as Vec2;
  });
}

function grid(xs: number[], zs: number[]): Vec2[] {
  return xs.flatMap((x) => zs.map((z) => [x, z] as Vec2));
}

export const VASES: VaseSpec[] = [
  {
    id: "dish",
    name: "啞光白盤＋花泥",
    description: "低矮寬盤搭配吸水花泥，花莖可自由斜插",
    mouthY: 0.078,
    floorY: 0.01,
    kind: "foam",
    innerRadius: 0.065,
    foam: { width: 0.13, depth: 0.09 },
    maxTilt: 1.15,
    anchors: grid([-0.05, -0.025, 0, 0.025, 0.05], [-0.03, 0, 0.03]),
    transparent: false,
    refHeight: 0.24,
    swatch: { color: "#f2f0ec", name: "啞光白" },
    care: "花泥要先完全浸濕（自然下沉，不要按壓），之後每天從縫隙補水。",
  },
  {
    id: "terrazzo",
    name: "粗陶水磨石寬口瓶",
    description: "寬口讓花莖可以大角度向外傾斜",
    mouthY: 0.2,
    floorY: 0.018,
    kind: "vase",
    innerRadius: 0.072,
    maxTilt: 1.0,
    anchors: [[0, 0], ...ring(0.03, 6), ...ring(0.058, 10, 0.3)],
    transparent: false,
    refHeight: 0.2,
    swatch: { color: "#d9cfc2", name: "水磨石米" },
    care: "不透明花瓶看不到水位，記得每兩天換水並清洗瓶內。",
  },
  {
    id: "glass",
    name: "極簡柱狀窄口瓶",
    description: "透明玻璃與水的折射，花莖靠在瓶口自然傾斜",
    mouthY: 0.26,
    floorY: 0.012,
    kind: "vase",
    innerRadius: 0.041,
    maxTilt: 0.6,
    anchors: [[0, 0], ...ring(0.019, 6), ...ring(0.033, 8, 0.2)],
    transparent: true,
    refHeight: 0.26,
    swatch: { color: "#dfe9e8", name: "透明玻璃" },
    care: "透明瓶容易長藻，每天換水並刷洗瓶身，水位約瓶高三分之一即可。",
  },
];

export const WATER_LEVEL = 0.15;

export const SCALE_MIN = 0.45;
export const SCALE_MAX = 1.45;

/**
 * 比例原則：最高的骨架約為花器高度的 1.5 倍，主花約 1 倍，配花與填充依序降低，
 * 讓作品有高低層次，也不會頭重腳輕。
 */
export const LAYER_HEIGHT: Record<Layer, number> = {
  skeleton: 1.45,
  focal: 1.0,
  secondary: 0.85,
  filler: 0.72,
};

export function scaleForHeight(flower: Flower, vase: VaseSpec, ratio: number) {
  return Math.min(Math.max((ratio * vase.refHeight) / flower.height, SCALE_MIN), SCALE_MAX);
}

/** 依層級與花器給一個合乎比例的預設花莖長度 */
export function defaultScale(flower: Flower, vase: VaseSpec, jitter = 0) {
  return scaleForHeight(flower, vase, LAYER_HEIGHT[flower.layer] * (1 + jitter));
}

export function getVase(id: VaseId) {
  return VASES.find((v) => v.id === id)!;
}

export type Placement = {
  id: string;
  slug: string;
  /** 插入點（瓶口平面上的 x, z） */
  anchor: Vec2;
  /** 想要的傾斜方向與幅度（花莖單位向量的水平分量） */
  lean: Vec2;
  /** 花莖長度倍率 */
  scale: number;
  /** 花頭繞花莖自轉角度 */
  spin: number;
};

export type Resolved = Placement & {
  pivot: Vec3;
  dir: Vec3;
  head: Vec3;
  /** 實際傾斜角 */
  theta: number;
  /** 是否因瓶口邊緣限制而被扶正 */
  restingOnRim: boolean;
  /** 瓶口以下的花莖長度 */
  below: number;
  headRadius: number;
};

const len2 = ([x, z]: Vec2) => Math.hypot(x, z);

/** 依瓶口與瓶身內徑，計算花莖不穿出瓶壁的最大傾斜角 */
function maxTiltFor(vase: VaseSpec, anchor: Vec2, u: Vec2) {
  if (vase.kind === "foam") return vase.maxTilt;
  const h = vase.mouthY - vase.floorY;
  const R = vase.innerRadius - STEM_RADIUS;
  const pu = anchor[0] * u[0] + anchor[1] * u[1];
  const disc = pu * pu - (anchor[0] ** 2 + anchor[1] ** 2) + R * R;
  if (disc <= 0) return 0;
  const t = (pu + Math.sqrt(disc)) / h;
  return Math.min(Math.atan(t), vase.maxTilt);
}

export function resolvePlacement(
  p: Placement,
  flower: Flower,
  vase: VaseSpec,
): Resolved {
  const L = flower.height * p.scale;
  const m = Math.min(len2(p.lean), 0.97);
  const u: Vec2 = m > 1e-4 ? [p.lean[0] / len2(p.lean), p.lean[1] / len2(p.lean)] : [0, 1];
  const thetaWanted = Math.asin(m);
  const thetaMax = maxTiltFor(vase, p.anchor, u);
  const theta = Math.min(thetaWanted, thetaMax);
  const s = Math.sin(theta);
  const dir: Vec3 = [u[0] * s, Math.cos(theta), u[1] * s];
  const pivot: Vec3 = [p.anchor[0], vase.mouthY, p.anchor[1]];
  const head: Vec3 = [pivot[0] + dir[0] * L, pivot[1] + dir[1] * L, pivot[2] + dir[2] * L];
  const below =
    vase.kind === "foam"
      ? 0.035
      : (vase.mouthY - vase.floorY - 0.004) / Math.max(Math.cos(theta), 0.2);
  return {
    ...p,
    pivot,
    dir,
    head,
    theta,
    restingOnRim: thetaWanted > thetaMax + 0.01,
    below,
    headRadius: flower.headRadius * Math.min(p.scale, 1.1),
  };
}

const PRIORITY: Record<Layer, number> = {
  skeleton: 0,
  filler: 1,
  secondary: 2,
  focal: 3,
};

/** 由新的花頭位置反推傾斜與長度 */
function retarget(r: Resolved, flower: Flower, head: Vec3): Placement {
  const v: Vec3 = [head[0] - r.pivot[0], head[1] - r.pivot[1], head[2] - r.pivot[2]];
  const L = Math.hypot(...v);
  return {
    id: r.id,
    slug: r.slug,
    anchor: r.anchor,
    spin: r.spin,
    scale: Math.min(Math.max(L / flower.height, SCALE_MIN), SCALE_MAX),
    lean: [v[0] / L, v[2] / L],
  };
}

/**
 * 碰撞遮罩：把互相穿模的花頭推開。
 * 低優先度（填充 < 配花 < 主花）的花會讓位，正在拖曳的花（fixedId）不會被推動。
 * 骨架枝葉是穿插在花間的線條，不參與碰撞。
 */
export function relax(
  placements: Placement[],
  bySlug: Map<string, Flower>,
  vase: VaseSpec,
  fixedId?: string,
): Placement[] {
  let current = placements.slice();
  for (let iter = 0; iter < 32; iter++) {
    const resolved = current.map((p) => resolvePlacement(p, bySlug.get(p.slug)!, vase));
    const push = resolved.map(() => [0, 0, 0] as Vec3);
    let moved = false;

    for (let i = 0; i < resolved.length; i++) {
      const a = resolved[i];
      const fa = bySlug.get(a.slug)!;
      if (fa.layer === "skeleton") continue;
      // 花頭不可沉入瓶口
      const minY = vase.mouthY + a.headRadius * 0.8;
      if (a.head[1] < minY && a.id !== fixedId) {
        push[i][1] += minY - a.head[1];
        moved = true;
      }
      for (let j = i + 1; j < resolved.length; j++) {
        const b = resolved[j];
        const fb = bySlug.get(b.slug)!;
        if (fb.layer === "skeleton") continue;
        const d: Vec3 = [b.head[0] - a.head[0], b.head[1] - a.head[1], b.head[2] - a.head[2]];
        let dist = Math.hypot(...d);
        const minDist = (a.headRadius + b.headRadius) * 0.9;
        if (dist >= minDist) continue;
        if (dist < 1e-5) {
          const angle = ((i * 7 + j * 13) % 360) * (Math.PI / 180);
          d[0] = Math.sin(angle);
          d[2] = Math.cos(angle);
          dist = 1;
        }
        const n: Vec3 = [d[0] / dist, d[1] / dist + 0.25, d[2] / dist];
        const pen = minDist - dist;
        let wa = PRIORITY[fb.layer] / (PRIORITY[fa.layer] + PRIORITY[fb.layer]);
        let wb = 1 - wa;
        if (a.id === fixedId) [wa, wb] = [0, 1];
        if (b.id === fixedId) [wa, wb] = [1, 0];
        for (let k = 0; k < 3; k++) {
          push[i][k] -= n[k] * pen * wa * 0.6;
          push[j][k] += n[k] * pen * wb * 0.6;
        }
        moved = true;
      }
    }
    if (!moved) break;
    current = resolved.map((r, i) => {
      const p = push[i];
      if (p[0] === 0 && p[1] === 0 && p[2] === 0) return current[i];
      const flower = bySlug.get(r.slug)!;
      return retarget(r, flower, [r.head[0] + p[0], r.head[1] + p[1], r.head[2] + p[2]]);
    });
  }
  return current;
}

/** 各層級偏好的插入位置（與瓶口中心的距離比例）與向外傾斜幅度 */
const LAYER_PREF: Record<Layer, { radius: number; lean: number; back: number }> = {
  skeleton: { radius: 0.9, lean: 0.42, back: 0.6 },
  focal: { radius: 0.1, lean: 0.12, back: 0 },
  secondary: { radius: 0.55, lean: 0.32, back: 0.1 },
  filler: { radius: 0.95, lean: 0.48, back: -0.3 },
};

function anchorExtent(vase: VaseSpec) {
  return Math.max(...vase.anchors.map(len2));
}

/** 點擊花材時自動挑一個合適的插花點 */
export function autoPlacement(
  flower: Flower,
  vase: VaseSpec,
  existing: Placement[],
  id: string,
): Placement {
  const pref = LAYER_PREF[flower.layer];
  const extent = anchorExtent(vase);
  const usage = new Map<string, number>();
  for (const p of existing) {
    const key = p.anchor.join(",");
    usage.set(key, (usage.get(key) ?? 0) + 1);
  }
  let best = vase.anchors[0];
  let bestScore = Infinity;
  vase.anchors.forEach((a, idx) => {
    const r = len2(a) / extent;
    const used = usage.get(a.join(",")) ?? 0;
    // back > 0 偏好後方（z < 0），讓高的枝葉在後、低的填充在前
    const backScore = pref.back * (a[1] / extent);
    const jitter = ((idx * 37 + existing.length * 11) % 10) / 100;
    const score = Math.abs(r - pref.radius) + used * 0.7 + backScore + jitter;
    if (score < bestScore) {
      bestScore = score;
      best = a;
    }
  });
  const r = len2(best);
  const angle = r > 1e-4 ? Math.atan2(best[0], best[1]) : existing.length * 2.4;
  return {
    id,
    slug: flower.slug,
    anchor: best,
    lean: [Math.sin(angle) * pref.lean, Math.cos(angle) * pref.lean],
    scale: defaultScale(flower, vase, (((existing.length * 7) % 5) - 2) * 0.05),
    spin: (existing.length * 1.7) % (Math.PI * 2),
  };
}

export const SNAP_RADIUS = 0.1;

/**
 * Magnetic Snap：滑鼠指向的花頭目標位置 target（水平面上的 x, z）
 * → 吸附到最近的插花點，並算出花莖傾斜。距離瓶口太遠則回傳 null（不吸附）。
 */
export function snapPlacement(
  flower: Flower,
  vase: VaseSpec,
  target: Vec2,
  base: Pick<Placement, "id" | "spin" | "scale">,
): Placement | null {
  const extent = anchorExtent(vase);
  if (len2(target) > extent + SNAP_RADIUS + flower.height * 0.9) return null;
  // 花頭往外，插入點也偏向同一側（靠在那一側的瓶口）
  const want: Vec2 = [target[0] * 0.55, target[1] * 0.55];
  let best = vase.anchors[0];
  let bestD = Infinity;
  for (const a of vase.anchors) {
    const d = Math.hypot(a[0] - want[0], a[1] - want[1]);
    if (d < bestD) {
      bestD = d;
      best = a;
    }
  }
  const L = flower.height * base.scale;
  const lean: Vec2 = [(target[0] - best[0]) / L, (target[1] - best[1]) / L];
  const m = len2(lean);
  if (m > 0.95) {
    lean[0] *= 0.95 / m;
    lean[1] *= 0.95 / m;
  }
  return { ...base, slug: flower.slug, anchor: best, lean };
}
