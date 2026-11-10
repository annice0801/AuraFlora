// 程序化 3D 花材資產：每種花都由花瓣、葉片、花莖等幾何體在程式中組合而成，
// 不需要下載任何模型檔。每個頂點帶有 aSway（隨花莖擺動的程度）與 aFlutter（花瓣尖端顫動的程度），
// 由 wind shader 在 GPU 上產生「呼吸感」微動。

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Flower, ModelKind } from "@/data/flowers";

export type MatKey = "stem" | "leaf" | "petal" | "petal2" | "center" | "floret" | "bud";

type FlutterSpec = { origin: THREE.Vector3; size: number } | null;

const UP = new THREE.Vector3(0, 1, 0);

// ───────────────────────── 亂數與數學工具 ─────────────────────────

function seeded(str: string) {
  let h = 1779033703;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** 讓幾何體的 +Y 軸指向 dir，並移到 pos */
function orient(pos: THREE.Vector3, dir: THREE.Vector3, spin = 0) {
  const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize());
  const qs = new THREE.Quaternion().setFromAxisAngle(UP, spin);
  return new THREE.Matrix4().compose(pos, q.multiply(qs), v3(1, 1, 1));
}

// ───────────────────────── 基本幾何 ─────────────────────────

/** 由粗到細的花莖 */
function taperedTube(
  curve: THREE.Curve<THREE.Vector3>,
  segments: number,
  radial: number,
  r0: number,
  r1: number,
) {
  const frames = curve.computeFrenetFrames(segments, false);
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = curve.getPointAt(t);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const r = r0 + (r1 - r0) * t;
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const n = N.clone().multiplyScalar(Math.cos(a)).add(B.clone().multiplyScalar(Math.sin(a)));
      pos.push(p.x + n.x * r, p.y + n.y * r, p.z + n.z * r);
      nor.push(n.x, n.y, n.z);
      uv.push(j / radial, t);
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = a + radial + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

type PetalOpts = {
  length: number;
  width: number;
  /** 橫向內凹程度 */
  cup?: number;
  /** 沿長度方向的翻捲（正值往內、負值向外翻） */
  curl?: number;
  /** 邊緣波浪 */
  ruffle?: number;
  /** 0 = 尖頭，1 = 圓頭 */
  round?: number;
  segU?: number;
  segV?: number;
};

/** 花瓣／葉片曲面：基部在原點，沿 +Y 延伸，凹面朝 +Z */
function petal({
  length,
  width,
  cup = 0.6,
  curl = 0,
  ruffle = 0,
  round = 0.4,
  segU = 12,
  segV = 8,
}: PetalOpts) {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const end = 1 - round * 0.12;
  for (let i = 0; i <= segU; i++) {
    const u = i / segU;
    const w = width * Math.pow(Math.sin(Math.PI * Math.pow(0.04 + u * (end - 0.04), 0.72)), 0.85);
    for (let j = 0; j <= segV; j++) {
      const v = (j / segV) * 2 - 1;
      const x = (v * w) / 2;
      const y = length * u;
      const z =
        cup * v * v * w * 0.5 +
        curl * length * u * u +
        ruffle * Math.sin(v * Math.PI * 3 + u * 6) * u;
      pos.push(x, y, z);
      uv.push((v + 1) / 2, u);
    }
  }
  for (let i = 0; i < segU; i++) {
    for (let j = 0; j < segV; j++) {
      const a = i * (segV + 1) + j;
      const b = a + segV + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** 將花瓣放在花頭上：azimuth 方位角、open 張開角度、r0 離中心距離 */
function petalMatrix(azimuth: number, open: number, r0: number, y0: number) {
  const out = v3(Math.sin(azimuth) * r0, y0, Math.cos(azimuth) * r0);
  return new THREE.Matrix4()
    .makeTranslation(out.x, out.y, out.z)
    .multiply(new THREE.Matrix4().makeRotationY(azimuth + Math.PI))
    .multiply(new THREE.Matrix4().makeRotationX(-open));
}

/** 喇叭形小花（小蒼蘭） */
function funnel(size: number, lobes: number) {
  const segU = 10;
  const segV = 24;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= segU; i++) {
    const u = i / segU;
    const r = size * (0.08 + 0.55 * Math.pow(u, 1.6));
    for (let j = 0; j <= segV; j++) {
      const a = (j / segV) * Math.PI * 2;
      const rr = r * (1 + 0.28 * Math.pow(u, 3) * Math.cos(lobes * a));
      pos.push(Math.cos(a) * rr, size * 1.1 * u - 0.15 * size * Math.pow(u, 4), Math.sin(a) * rr);
      uv.push(((j / segV) * lobes) % 1, u);
    }
  }
  for (let i = 0; i < segU; i++) {
    for (let j = 0; j < segV; j++) {
      const a = i * (segV + 1) + j;
      const b = a + segV + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// ───────────────────────── 組裝器 ─────────────────────────

/** 頂點顏色由「基部色」漸變到「尖端色」，模擬真花瓣的色彩層次 */
export type Gradient = { base: THREE.Color; tip: THREE.Color };
type Palette = Partial<Record<MatKey, Gradient>>;

const WHITE = new THREE.Color(1, 1, 1);
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
};

class Builder {
  parts: Partial<Record<MatKey, THREE.BufferGeometry[]>> = {};
  constructor(
    public height: number,
    private palette: Palette,
    private rnd: () => number,
  ) {}

  add(geo: THREE.BufferGeometry, mat: MatKey, matrix?: THREE.Matrix4, flutter: FlutterSpec = null) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (!g.getAttribute("normal")) g.computeVertexNormals();
    if (!g.getAttribute("uv")) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.getAttribute("position").count * 2), 2));
    if (matrix) g.applyMatrix4(matrix);
    const p = g.getAttribute("position");
    const sway = new Float32Array(p.count);
    const flut = new Float32Array(p.count);
    const color = new Float32Array(p.count * 3);
    const tmp = new THREE.Vector3();
    const c = new THREE.Color();
    const origin = flutter ? flutter.origin.clone().applyMatrix4(matrix ?? new THREE.Matrix4()) : null;
    const grad = this.palette[mat];
    // 每片花瓣／葉片的亮度與色相都有些微差異，避免整朵花像塑膠
    const k = 0.92 + this.rnd() * 0.12;
    const jr = 1 + (this.rnd() - 0.5) * 0.05;
    const jb = 1 + (this.rnd() - 0.5) * 0.05;
    const isLeaf = mat === "leaf";
    for (let i = 0; i < p.count; i++) {
      tmp.fromBufferAttribute(p, i);
      sway[i] = Math.pow(Math.min(tmp.length() / this.height, 1.15), 1.5);
      const d = origin && flutter ? Math.min(tmp.distanceTo(origin) / flutter.size, 1) : 0;
      flut[i] = d;
      if (grad) c.copy(grad.base).lerp(grad.tip, smooth(0, 0.85, d));
      else c.copy(WHITE);
      // 花瓣基部被其他花瓣遮住，比較暗（簡易環境光遮蔽）
      const ao = origin ? (isLeaf ? 0.74 + 0.26 * smooth(0, 0.5, d) : 0.5 + 0.5 * smooth(0, 0.6, d)) : 1;
      color[i * 3] = c.r * ao * k * jr;
      color[i * 3 + 1] = c.g * ao * k;
      color[i * 3 + 2] = c.b * ao * k * jb;
    }
    g.setAttribute("aSway", new THREE.BufferAttribute(sway, 1));
    g.setAttribute("aFlutter", new THREE.BufferAttribute(flut, 1));
    g.setAttribute("color", new THREE.BufferAttribute(color, 3));
    g = g.index ? g.toNonIndexed() : g;
    (this.parts[mat] ??= []).push(g);
  }

  /** 在 matrix 座標系中加入一片花瓣（flutter 以花瓣基部為原點） */
  addPetal(opts: PetalOpts, mat: MatKey, matrix: THREE.Matrix4) {
    this.add(petal(opts), mat, matrix, { origin: v3(0, 0, 0), size: opts.length });
  }

  stem(points: THREE.Vector3[], r0: number, r1: number, mat: MatKey = "stem", segs = 20, radial = 7) {
    const curve = new THREE.CatmullRomCurve3(points);
    this.add(taperedTube(curve, segs, radial, r0, r1), mat);
    return curve;
  }

  build() {
    const out: { key: MatKey; geometry: THREE.BufferGeometry }[] = [];
    for (const [key, list] of Object.entries(this.parts) as [MatKey, THREE.BufferGeometry[]][]) {
      const merged = mergeGeometries(list, false);
      if (!merged) continue;
      merged.computeBoundingSphere();
      out.push({ key, geometry: merged });
      list.forEach((g) => g.dispose());
    }
    return out;
  }
}

/** 一朵「花頭」的座標系：放在 pos，朝向 dir */
function headFrame(pos: THREE.Vector3, dir: THREE.Vector3, spin = 0) {
  return orient(pos, dir, spin);
}

function leafPair(b: Builder, curve: THREE.Curve<THREE.Vector3>, t: number, opts: PetalOpts, open: number, rot: number) {
  const p = curve.getPointAt(t);
  const tan = curve.getTangentAt(t);
  for (const side of [0, Math.PI]) {
    const m = orient(p, tan, rot + side).multiply(petalMatrix(0, open, 0.002, 0));
    b.addPetal(opts, "leaf", m);
  }
}

// ───────────────────────── 各花材模型 ─────────────────────────

type ModelFn = (b: Builder, H: number, rnd: () => number) => void;

const tulip: ModelFn = (b, H, rnd) => {
  const lean = (rnd() - 0.5) * 0.012;
  b.stem([v3(0, 0, 0), v3(lean, H * 0.45, 0.003), v3(lean * 0.6, H * 0.8, 0), v3(0, H - 0.026, 0)], 0.0036, 0.003);
  const y0 = H - 0.03;
  b.add(new THREE.SphereGeometry(0.007, 10, 8), "stem", new THREE.Matrix4().makeTranslation(0, y0, 0));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + rnd() * 0.2;
    b.addPetal({ length: 0.058, width: 0.044, cup: 1.15, curl: -0.03, round: 0.9 }, "petal", petalMatrix(a, 0.17, 0.004, y0));
    const a2 = a + Math.PI / 3;
    b.addPetal({ length: 0.054, width: 0.04, cup: 1.2, curl: 0.02, round: 0.9 }, "petal2", petalMatrix(a2, 0.08, 0.002, y0 + 0.001));
  }
  const leafOpts = { length: 0.15, width: 0.034, cup: 0.9, curl: 0.06, round: 0.1 };
  b.addPetal(leafOpts, "leaf", petalMatrix(rnd() * 6, 0.32, 0.003, 0.015));
  b.addPetal({ ...leafOpts, length: 0.12 }, "leaf", petalMatrix(rnd() * 6 + 2.5, 0.42, 0.003, 0.06));
};

const peony: ModelFn = (b, H, rnd) => {
  b.stem([v3(0, 0, 0), v3(0.004, H * 0.5, -0.003), v3(0, H - 0.03, 0)], 0.0046, 0.0038);
  const y0 = H - 0.03;
  // 由內而外 7 圈花瓣：內圈小而捲、堆成圓丘；外圈大而向上包覆，整體是飽滿的碗狀球形
  const rings = [6, 8, 10, 12, 13, 11, 9];
  rings.forEach((count, k) => {
    const t = k / (rings.length - 1);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + k * 0.55 + rnd() * 0.3;
      b.addPetal(
        {
          length: 0.024 + t * 0.03,
          width: 0.024 + t * 0.032,
          cup: 1.5 - t * 0.4,
          curl: 0.035 * (1 - t) - 0.008,
          ruffle: 0.0015 + t * 0.002,
          round: 1,
        },
        k < 3 ? "petal2" : "petal",
        petalMatrix(a, 0.12 + Math.pow(t, 1.4) * 0.62 + rnd() * 0.08, 0.002 + t * 0.012, y0 + Math.pow(1 - t, 0.9) * 0.042),
      );
    }
  });
  for (let i = 0; i < 5; i++)
    b.addPetal({ length: 0.024, width: 0.016, cup: 0.7 }, "leaf", petalMatrix((i / 5) * 6.28, 1.25, 0.01, y0 - 0.002));
  for (const [y, rot] of [[0.05, 0.3], [0.12, 2.6]] as const) {
    for (let k = -1; k <= 1; k++) {
      b.addPetal(
        { length: 0.06, width: 0.022, cup: 0.5, curl: 0.04, round: 0.1 },
        "leaf",
        petalMatrix(rot + k * 0.45, 0.9 + Math.abs(k) * 0.25, 0.004, y),
      );
    }
  }
};

const sunflower: ModelFn = (b, H, rnd) => {
  b.stem([v3(0, 0, 0), v3(0.003, H * 0.5, 0), v3(0, H - 0.01, 0.006)], 0.0062, 0.005);
  const head = headFrame(v3(0, H - 0.004, 0.008), v3(0, 0.6, 0.8).normalize(), rnd() * 6);
  const disc = new THREE.SphereGeometry(0.03, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const p = disc.getAttribute("position");
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    p.setY(i, p.getY(i) * 0.28 + Math.sin(x * 900) * Math.sin(z * 900) * 0.0008);
  }
  disc.computeVertexNormals();
  b.add(disc, "center", head);
  const back = new THREE.SphereGeometry(0.029, 24, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  back.scale(1, 0.35, 1);
  b.add(back, "leaf", head);
  for (let ring = 0; ring < 2; ring++) {
    const n = 21;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ring * (Math.PI / n);
      const m = head.clone().multiply(petalMatrix(a, 1.42 - ring * 0.12 + rnd() * 0.08, 0.026 - ring * 0.002, 0.001 + ring * 0.002));
      b.addPetal({ length: 0.036 - ring * 0.003, width: 0.012, cup: 0.45, curl: -0.04, round: 0.3 }, ring ? "petal2" : "petal", m);
    }
  }
  for (let i = 0; i < 16; i++) {
    const m = head.clone().multiply(petalMatrix((i / 16) * 6.28, 1.85, 0.022, -0.004));
    b.addPetal({ length: 0.018, width: 0.009, cup: 0.4 }, "leaf", m);
  }
  b.addPetal({ length: 0.09, width: 0.07, cup: 0.5, curl: 0.05, round: 0.6 }, "leaf", petalMatrix(rnd() * 6, 1.0, 0.005, 0.06));
  b.addPetal({ length: 0.075, width: 0.058, cup: 0.5, curl: 0.05, round: 0.6 }, "leaf", petalMatrix(rnd() * 6 + 3, 0.95, 0.005, 0.15));
};

function lisianthusBloom(b: Builder, frame: THREE.Matrix4, scale: number, rnd: () => number) {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + rnd() * 0.2;
    b.addPetal(
      { length: 0.036 * scale, width: 0.034 * scale, cup: 0.9, ruffle: 0.0025 * scale, curl: -0.01, round: 1 },
      "petal",
      frame.clone().multiply(petalMatrix(a, 0.62, 0.003, 0)),
    );
    b.addPetal(
      { length: 0.028 * scale, width: 0.026 * scale, cup: 1.1, ruffle: 0.002 * scale, round: 1 },
      "petal2",
      frame.clone().multiply(petalMatrix(a + 0.6, 0.28, 0.002, 0.002)),
    );
  }
  b.add(new THREE.CylinderGeometry(0.0012, 0.0015, 0.012 * scale, 6), "center", frame.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.008, 0)));
}

function lisianthusBud(b: Builder, frame: THREE.Matrix4) {
  for (let i = 0; i < 5; i++) {
    const m = frame.clone().multiply(new THREE.Matrix4().makeRotationY((i / 5) * 6.28 + 0.4)).multiply(petalMatrix(0, 0.02, 0.001, 0));
    b.addPetal({ length: 0.03, width: 0.016, cup: 1.7, curl: 0.04, round: 0 }, "bud", m);
  }
}

const lisianthus: ModelFn = (b, H, rnd) => {
  const main = b.stem([v3(0, 0, 0), v3(0.003, H * 0.5, 0), v3(0, H - 0.008, 0)], 0.0028, 0.0022);
  const top = main.getPointAt(1);
  lisianthusBloom(b, headFrame(top, main.getTangentAt(1)), 1, rnd);
  const branches = [
    [v3(0, H * 0.62, 0), v3(0.025, H * 0.78, 0.008), v3(0.042, H * 0.88, 0.014)],
    [v3(0, H * 0.5, 0), v3(-0.02, H * 0.66, -0.016), v3(-0.032, H * 0.8, -0.024)],
  ];
  branches.forEach((pts, k) => {
    const c = b.stem(pts, 0.0018, 0.0014, "stem", 10, 5);
    const end = c.getPointAt(1);
    const frame = headFrame(end, c.getTangentAt(1));
    if (k === 0) lisianthusBloom(b, frame, 0.82, rnd);
    else lisianthusBud(b, frame);
  });
  [0.18, 0.38, 0.56].forEach((t, i) =>
    leafPair(b, main, t, { length: 0.045, width: 0.02, cup: 0.6, curl: 0.03, round: 0.2 }, 0.85, i * 1.57),
  );
};

const freesia: ModelFn = (b, H, rnd) => {
  const pts = [v3(0, 0, 0), v3(0, H * 0.5, 0), v3(0.003, H * 0.84, 0), v3(0.02, H * 0.97, 0), v3(0.05, H * 1.0, 0), v3(0.075, H * 0.97, 0)];
  const c = b.stem(pts, 0.0026, 0.0012, "stem", 28, 6);
  const count = 7;
  for (let i = 0; i < count; i++) {
    const t = 0.66 + (i / (count - 1)) * 0.34;
    const p = c.getPointAt(t);
    const tan = c.getTangentAt(t);
    const up = v3(-tan.y, tan.x, 0).normalize();
    if (up.y < 0) up.negate();
    const dir = up.clone().multiplyScalar(0.85).add(tan.clone().multiplyScalar(0.35)).normalize();
    const size = 0.026 * (1 - i * 0.09);
    if (i < 4) {
      b.add(funnel(size, 6), i % 2 ? "petal2" : "petal", orient(p, dir, rnd() * 6), { origin: v3(0, 0, 0), size: size * 1.1 });
    } else {
      const bud = new THREE.SphereGeometry(0.004, 8, 6).scale(1, 2.4, 1).translate(0, 0.008, 0);
      b.add(bud, "bud", orient(p, dir), { origin: v3(0, 0, 0), size: 0.02 });
    }
  }
  b.addPetal({ length: 0.13, width: 0.012, cup: 0.6, curl: 0.03, round: 0 }, "leaf", petalMatrix(rnd() * 6, 0.22, 0.003, 0.01));
  b.addPetal({ length: 0.1, width: 0.011, cup: 0.6, curl: 0.04, round: 0 }, "leaf", petalMatrix(rnd() * 6 + 3, 0.3, 0.003, 0.02));
};

const gypsophila: ModelFn = (b, H, rnd) => {
  const fork = v3(0, H * 0.55, 0);
  b.stem([v3(0, 0, 0), v3(0.002, H * 0.3, 0), fork], 0.0019, 0.0014, "stem", 10, 5);
  const floret = new THREE.IcosahedronGeometry(0.0026, 0);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + rnd() * 0.6;
    const spread = 0.025 + rnd() * 0.035;
    const end = v3(Math.sin(a) * spread, H * (0.84 + rnd() * 0.2), Math.cos(a) * spread);
    const mid = fork.clone().lerp(end, 0.5).add(v3(0, 0.01, 0));
    b.stem([fork, mid, end], 0.0011, 0.0007, "stem", 6, 4);
    for (let k = 0; k < 4; k++) {
      const twig = end.clone().add(v3((rnd() - 0.5) * 0.03, rnd() * 0.016, (rnd() - 0.5) * 0.03));
      b.stem([end, end.clone().lerp(twig, 0.5).add(v3(0, 0.003, 0)), twig], 0.0006, 0.0004, "stem", 4, 3);
      const n = 4 + Math.floor(rnd() * 4);
      for (let f = 0; f < n; f++) {
        const off = v3((rnd() - 0.5) * 0.009, rnd() * 0.006, (rnd() - 0.5) * 0.009);
        const s = 0.75 + rnd() * 0.5;
        const m = new THREE.Matrix4().compose(twig.clone().add(off), new THREE.Quaternion(), v3(s, s, s));
        b.add(floret, "floret", m, { origin: v3(0, -0.006, 0), size: 0.01 });
      }
    }
  }
};

const chamomile: ModelFn = (b, H, rnd) => {
  const fork = v3(0, H * 0.5, 0);
  b.stem([v3(0, 0, 0), v3(0.001, H * 0.25, 0), fork], 0.0016, 0.0012, "stem", 10, 5);
  const center = new THREE.SphereGeometry(0.0055, 10, 8).scale(1, 0.85, 1);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + rnd() * 0.5;
    const spread = 0.015 + rnd() * 0.03;
    const end = v3(Math.sin(a) * spread, H * (0.82 + rnd() * 0.24), Math.cos(a) * spread);
    const c = b.stem([fork, fork.clone().lerp(end, 0.5).add(v3(Math.sin(a) * 0.004, 0, Math.cos(a) * 0.004)), end], 0.0009, 0.0007, "stem", 8, 4);
    const frame = headFrame(end, c.getTangentAt(1).add(v3(0, 0.6, 0)).normalize(), rnd() * 6);
    b.add(center, "center", frame.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.002, 0)));
    const n = 13;
    for (let k = 0; k < n; k++) {
      const m = frame.clone().multiply(petalMatrix((k / n) * 6.28, 1.62 + rnd() * 0.15, 0.0045, 0));
      b.addPetal({ length: 0.0095, width: 0.0034, cup: 0.25, curl: -0.03, round: 0.8, segU: 5, segV: 3 }, "petal", m);
    }
    const leafT = 0.3 + rnd() * 0.3;
    const lp = c.getPointAt(leafT);
    b.addPetal({ length: 0.02, width: 0.004, cup: 0.3, round: 0, segU: 5, segV: 2 }, "leaf", orient(lp, c.getTangentAt(leafT), rnd() * 6).multiply(petalMatrix(0, 0.7, 0.001, 0)));
  }
};

const trachelium: ModelFn = (b, H, rnd) => {
  const c = b.stem([v3(0, 0, 0), v3(0.002, H * 0.5, 0.002), v3(0, H - 0.022, 0)], 0.0028, 0.0022);
  const top = v3(0, H - 0.02, 0);
  const dome = new THREE.SphereGeometry(0.029, 20, 10, 0, Math.PI * 2, 0, 1.45).scale(1, 0.85, 1);
  b.add(dome, "petal2", new THREE.Matrix4().makeTranslation(top.x, top.y, top.z));
  // 數百朵大小不一、方向略為散亂的細小花朵，形成毛茸茸的霧感
  const floret = new THREE.IcosahedronGeometry(0.0019, 1).scale(1, 0.55, 1);
  const n = 520;
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 0.85;
    const r = Math.sqrt(1 - y * y);
    const phi = i * 2.399963;
    const nrm = v3(Math.cos(phi) * r, y, Math.sin(phi) * r);
    const jitter = 1 + (rnd() - 0.5) * 0.12;
    const p = top.clone().add(v3(nrm.x * 0.031 * jitter, nrm.y * 0.026 * jitter, nrm.z * 0.031 * jitter));
    const sc = 0.7 + rnd() * 0.6;
    const m = orient(p, nrm.clone().add(v3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.5)).normalize(), rnd() * 6);
    m.multiply(new THREE.Matrix4().makeScale(sc, sc, sc));
    b.add(floret, "petal", m, { origin: v3(0, -0.004, 0), size: 0.008 });
  }
  [0.25, 0.45, 0.62].forEach((t, i) => {
    const p = c.getPointAt(t);
    b.addPetal({ length: 0.05, width: 0.024, cup: 0.5, curl: 0.04, round: 0.2 }, "leaf", orient(p, c.getTangentAt(t), i * 2.2).multiply(petalMatrix(0, 0.9, 0.002, 0)));
  });
};

const willow: ModelFn = (b, H, rnd) => {
  const floret = new THREE.IcosahedronGeometry(0.0022, 0);
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + rnd() * 0.8;
    const dx = Math.sin(a);
    const dz = Math.cos(a);
    const reach = 0.12 + rnd() * 0.1;
    const hh = H * (0.82 + rnd() * 0.22);
    const c = b.stem(
      [v3(0, 0, 0), v3(dx * 0.01, hh * 0.45, dz * 0.01), v3(dx * reach * 0.35, hh * 0.86, dz * reach * 0.35), v3(dx * reach * 0.7, hh, dz * reach * 0.7), v3(dx * reach, hh * 0.9, dz * reach)],
      0.0022,
      0.0007,
      "stem",
      30,
      5,
    );
    const len = c.getLength();
    for (let s = 0.32 * len; s < len; s += 0.016) {
      const t = s / len;
      const p = c.getPointAt(t);
      const tan = c.getTangentAt(t);
      for (let f = 0; f < 4; f++) {
        const off = v3((rnd() - 0.5) * 0.008, rnd() * 0.006, (rnd() - 0.5) * 0.008);
        b.add(floret, "floret", new THREE.Matrix4().makeTranslation(p.x + off.x, p.y + off.y, p.z + off.z), { origin: v3(0, -0.004, 0), size: 0.008 });
      }
      if (rnd() < 0.6) {
        b.addPetal({ length: 0.014, width: 0.0035, cup: 0.3, round: 0, segU: 4, segV: 2 }, "leaf", orient(p, tan, rnd() * 6).multiply(petalMatrix(0, 0.8, 0.001, 0)));
      }
    }
  }
};

const eucalyptus: ModelFn = (b, H, rnd) => {
  const main = b.stem([v3(0, 0, 0), v3(0.006, H * 0.35, 0), v3(-0.004, H * 0.7, 0.003), v3(0.002, H, 0)], 0.0026, 0.0012, "stem", 24, 6);
  const side = b.stem([v3(0.004, H * 0.3, 0), v3(0.03, H * 0.5, 0.01), v3(0.05, H * 0.72, 0.02)], 0.0016, 0.0009, "stem", 12, 5);
  const coin = (curve: THREE.Curve<THREE.Vector3>, from: number, step: number, base: number) => {
    let i = 0;
    for (let t = from; t <= 1.0001; t += step, i++) {
      const size = base * (1 - t * 0.45);
      leafPair(b, curve, Math.min(t, 1), { length: size, width: size * 1.05, cup: 0.35, curl: 0.01, round: 1, segU: 7, segV: 6 }, 1.15 + rnd() * 0.2, i * 1.57);
    }
  };
  coin(main, 0.08, 0.085, 0.04);
  coin(side, 0.2, 0.16, 0.032);
};

const curlyWillow: ModelFn = (b, H, rnd) => {
  for (let k = 0; k < 2; k++) {
    const ph = rnd() * 6;
    const lean = (k - 0.5) * 0.06;
    const pts = Array.from({ length: 12 }, (_, i) => {
      const t = i / 11;
      return v3(lean * t + Math.sin(t * 9 + ph) * 0.018 * t, H * (0.85 + k * 0.15) * t, Math.cos(t * 7 + ph) * 0.016 * t);
    });
    const c = b.stem(pts, 0.0032, 0.0009, "stem", 48, 6);
    for (let s = 0; s < 3; s++) {
      const t = 0.35 + s * 0.2 + rnd() * 0.05;
      const p = c.getPointAt(t);
      const dir = v3(Math.sin(ph + s * 2), 0.8, Math.cos(ph + s * 2)).normalize();
      const twig = [p, p.clone().add(dir.clone().multiplyScalar(0.03)).add(v3(0.01, 0, 0)), p.clone().add(dir.clone().multiplyScalar(0.06))];
      b.stem(twig, 0.0012, 0.0005, "stem", 8, 4);
    }
    for (let i = 0; i < 9; i++) {
      const t = 0.25 + rnd() * 0.75;
      const p = c.getPointAt(t);
      const bud = new THREE.SphereGeometry(0.0022, 6, 5).scale(1, 2, 1);
      b.add(bud, "bud", orient(p, c.getTangentAt(t).add(v3(rnd() - 0.5, 0, rnd() - 0.5)).normalize()).multiply(new THREE.Matrix4().makeTranslation(0, 0.003, 0)));
    }
  }
};

const MODELS: Record<ModelKind, ModelFn> = {
  tulip,
  peony,
  sunflower,
  lisianthus,
  freesia,
  gypsophila,
  chamomile,
  trachelium,
  willow,
  eucalyptus,
  curlyWillow,
};

// ───────────────────────── 材質與風的 shader ─────────────────────────

export const windUniforms = {
  uTime: { value: 0 },
  /** 全域風力倍率（滑鼠互動時可調高） */
  uWind: { value: 1 },
};

export function setWindTime(t: number) {
  windUniforms.uTime.value = t;
}

/** 各模型的擺動幅度（公尺）：越纖細的枝條擺得越明顯 */
const SWAY: Record<ModelKind, number> = {
  willow: 0.011,
  curlyWillow: 0.004,
  eucalyptus: 0.006,
  tulip: 0.004,
  peony: 0.0025,
  sunflower: 0.002,
  lisianthus: 0.005,
  freesia: 0.005,
  gypsophila: 0.006,
  chamomile: 0.008,
  trachelium: 0.0035,
};

/** 主光源方向（觀察空間），用來計算花瓣背光時的透光 */
export const lightUniforms = { uKeyDirView: { value: new THREE.Vector3(0, 1, 0) } };
const KEY_LIGHT_DIR = new THREE.Vector3(0.55, 1.25, 0.6).normalize();

export function updateLightView(camera: THREE.Camera) {
  lightUniforms.uKeyDirView.value.copy(KEY_LIGHT_DIR).transformDirection(camera.matrixWorldInverse);
}

function patchWind(mat: THREE.Material, amp: number, flutter: number, translucency = 0) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniforms.uTime;
    shader.uniforms.uWind = windUniforms.uWind;
    shader.uniforms.uAmp = { value: amp };
    shader.uniforms.uFlutter = { value: flutter };
    shader.uniforms.uKeyDirView = lightUniforms.uKeyDirView;
    shader.uniforms.uTransl = { value: translucency };
    if (translucency > 0) {
      // 薄花瓣、葉片被光從背面照到時會透出顏色（簡易次表面散射）
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform vec3 uKeyDirView; uniform float uTransl;")
        .replace(
          "#include <lights_fragment_end>",
          `#include <lights_fragment_end>
          float backLit = max(dot(-normal, uKeyDirView), 0.0);
          reflectedLight.indirectDiffuse += diffuseColor.rgb * backLit * backLit * uTransl;`,
        );
    }
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uTime; uniform float uWind; uniform float uAmp; uniform float uFlutter;
        attribute float aSway; attribute float aFlutter;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vec3 wOrigin = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        float ph = dot(wOrigin.xz, vec2(37.1, 23.7));
        float s1 = sin(uTime * 1.25 + ph) + 0.45 * sin(uTime * 2.31 + ph * 1.7) + 0.2 * sin(uTime * 4.7 + ph * 0.3);
        float s2 = cos(uTime * 1.05 + ph * 0.7) + 0.4 * sin(uTime * 1.93 + ph * 2.1);
        float k = aSway * uAmp * uWind;
        transformed.x += s1 * k;
        transformed.z += s2 * k * 0.8;
        float fl = sin(uTime * 5.3 + position.x * 90.0 + position.y * 60.0 + position.z * 75.0 + ph);
        transformed += objectNormal * fl * aFlutter * uFlutter * uWind;`,
      );
  };
  mat.customProgramCacheKey = () => `wind-${amp}-${flutter}-${translucency}`;
}

const STEM_COLOR: Partial<Record<ModelKind, string>> = {
  willow: "#6b5a40",
  eucalyptus: "#8a6a5a",
};
const LEAF_COLOR: Record<ModelKind, string> = {
  tulip: "#7d9b78",
  peony: "#4f6f45",
  sunflower: "#5f8a3e",
  lisianthus: "#7d9a7a",
  freesia: "#7f9a5b",
  gypsophila: "#8aa07a",
  chamomile: "#7a9a56",
  trachelium: "#6f8a5e",
  willow: "#9bb06f",
  eucalyptus: "#8fa59a",
  curlyWillow: "#a7b37c",
};

const materialCache = new Map<string, Record<MatKey, THREE.Material>>();

const mix = (a: string | THREE.Color, b: string, t: number) => new THREE.Color(a).lerp(new THREE.Color(b), t);
const grad = (base: THREE.Color, tip: THREE.Color): Gradient => ({ base, tip });

/** 各花種的花瓣配色：基部 → 尖端。真實花瓣通常基部偏暖或偏綠、邊緣較淺 */
function paletteFor(flower: Flower): Palette {
  const c = flower.color;
  const a = flower.accent;
  const hsl = new THREE.Color(c).getHSL({ h: 0, s: 0, l: 0 });
  const neutral = hsl.l > 0.88;
  /** 深而飽和的顏色（酒紅、正紅）：不要再往淺色漸層，否則會褪成粉色 */
  const deep = hsl.l < 0.42 && hsl.s > 0.4;
  switch (flower.model) {
    case "tulip":
      // 深色（酒紅、正紅）保留飽和度：基部稍暗、尖端只微微提亮
      if (deep)
        return {
          petal: grad(mix(c, "#1a0508", 0.3), mix(c, "#ffffff", 0.04)),
          petal2: grad(mix(c, "#1a0508", 0.35), mix(c, "#ffffff", 0.08)),
        };
      return {
        petal: grad(mix(c, "#cdb54a", neutral ? 0.25 : 0.45), mix(c, "#ffffff", 0.12)),
        petal2: grad(mix(c, "#cdb54a", neutral ? 0.3 : 0.5), mix(c, "#ffffff", 0.22)),
      };
    case "peony":
      if (deep)
        return {
          petal: grad(mix(c, "#1a0508", 0.28), mix(c, "#ffffff", 0.03)),
          petal2: grad(mix(c, "#1a0508", 0.4), mix(c, "#ff6b6b", 0.05)),
          center: grad(new THREE.Color(a), mix(a, "#c98a2b", 0.4)),
        };
      return {
        petal: grad(mix(c, "#d9805a", 0.3), mix(c, "#ffe4dc", 0.18)),
        petal2: grad(mix(c, "#a9473f", 0.35), mix(c, "#ffd9cf", 0.12)),
        center: grad(new THREE.Color(a), mix(a, "#c98a2b", 0.4)),
      };
    case "sunflower":
      return {
        petal: grad(mix(c, "#b0600c", 0.5), mix(c, "#ffe27a", 0.25)),
        petal2: grad(mix(c, "#9c520a", 0.55), mix(c, "#f6c53c", 0.2)),
        center: grad(new THREE.Color(a), mix(a, "#1f1208", 0.5)),
      };
    case "lisianthus":
      return neutral
        ? {
            petal: grad(mix(c, "#c9dcae", 0.45), new THREE.Color(c)),
            petal2: grad(mix(c, "#c9dcae", 0.55), mix(c, "#f3f0e6", 0.3)),
            center: grad(new THREE.Color("#d8e3c0"), new THREE.Color("#d8e3c0")),
            bud: grad(new THREE.Color("#8fae78"), mix(c, "#cfe0b8", 0.4)),
          }
        : {
            petal: grad(mix(c, "#ffffff", 0.62), mix(c, "#4a2c6e", 0.1)),
            petal2: grad(mix(c, "#ffffff", 0.75), mix(c, "#ffffff", 0.2)),
            center: grad(new THREE.Color("#d8e3c0"), new THREE.Color("#d8e3c0")),
            bud: grad(mix(c, "#7d9a6a", 0.6), mix(c, "#ffffff", 0.05)),
          };
    case "freesia":
      return {
        petal: grad(mix(c, "#e0b53e", 0.5), mix(c, "#ffffff", 0.08)),
        petal2: grad(mix(c, "#d6a632", 0.55), mix(c, "#ffffff", 0.15)),
        bud: grad(new THREE.Color("#86a466"), mix(c, "#9fb873", 0.45)),
      };
    case "gypsophila":
      return { floret: grad(new THREE.Color("#c3cfab"), new THREE.Color("#ffffff")) };
    case "chamomile":
      return {
        petal: grad(new THREE.Color("#e7e2cf"), new THREE.Color("#ffffff")),
        center: grad(new THREE.Color(a), mix(a, "#c4921c", 0.5)),
      };
    case "trachelium":
      return {
        petal: grad(mix(c, "#24183a", 0.35), mix(c, "#d5c2f2", 0.35)),
        petal2: grad(mix(c, "#24183a", 0.5), mix(c, "#24183a", 0.3)),
      };
    case "willow":
      return { floret: grad(new THREE.Color("#d2dbb6"), new THREE.Color("#fbfaf3")) };
    case "curlyWillow":
      return { bud: grad(mix(a, "#5d6a3a", 0.3), new THREE.Color(a)) };
    default:
      return {
        petal: grad(mix(c, "#000000", 0.15), mix(c, "#ffffff", 0.1)),
        petal2: grad(mix(c, "#000000", 0.2), mix(c, "#ffffff", 0.15)),
      };
  }
}

// ── 程序化細節貼圖：花瓣脈紋、葉脈（灰階，與頂點顏色相乘） ──

let textures: { petal: THREE.Texture; leaf: THREE.Texture } | null = null;

function makeTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D, r: () => number) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext("2d")!, seeded(`tex-${w}-${h}`));
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function getTextures() {
  if (textures) return textures;
  const petalTex = makeTexture(256, 512, (ctx, r) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 256, 512);
    // 由基部放射到邊緣的細脈紋
    for (let k = 0; k < 46; k++) {
      const x1 = (k / 45) * 256;
      ctx.strokeStyle = `rgba(60,40,40,${0.05 + r() * 0.07})`;
      ctx.lineWidth = 0.8 + r() * 1.2;
      ctx.beginPath();
      ctx.moveTo(128 + (r() - 0.5) * 12, 512);
      ctx.quadraticCurveTo(128 + (x1 - 128) * 0.35, 300, x1 + (r() - 0.5) * 8, 0);
      ctx.stroke();
    }
    // 細微斑駁質感
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = `rgba(0,0,0,${r() * 0.035})`;
      ctx.fillRect(r() * 256, r() * 512, 2, 2);
    }
  });
  const leafTex = makeTexture(256, 512, (ctx, r) => {
    ctx.fillStyle = "#e9e9e9";
    ctx.fillRect(0, 0, 256, 512);
    for (let i = 0; i < 3000; i++) {
      ctx.fillStyle = r() > 0.5 ? `rgba(255,255,255,${r() * 0.12})` : `rgba(0,0,0,${r() * 0.06})`;
      ctx.fillRect(r() * 256, r() * 512, 2, 2);
    }
    // 主脈與側脈（較亮）
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(128, 512);
    ctx.lineTo(128, 0);
    ctx.stroke();
    ctx.lineWidth = 1.6;
    for (let y = 480; y > 20; y -= 34) {
      for (const side of [-1, 1]) {
        ctx.strokeStyle = `rgba(255,255,255,${0.45 + r() * 0.2})`;
        ctx.beginPath();
        ctx.moveTo(128, y);
        ctx.quadraticCurveTo(128 + side * 60, y - 30, 128 + side * 125, y - 70);
        ctx.stroke();
      }
    }
  });
  textures = { petal: petalTex, leaf: leafTex };
  return textures;
}

export function getMaterials(flower: Flower): Record<MatKey, THREE.Material> {
  const key = `${flower.model}:${flower.color}:${flower.accent}`;
  const hit = materialCache.get(key);
  if (hit) return hit;
  const amp = SWAY[flower.model];
  const tex = getTextures();
  const stemColor =
    flower.model === "curlyWillow" ? flower.color : STEM_COLOR[flower.model] ?? "#6a8a4f";
  const leafColor = flower.model === "eucalyptus" ? flower.color : LEAF_COLOR[flower.model];
  // 花瓣類材質用白色，顏色完全由頂點漸層決定
  const petal = () =>
    new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      vertexColors: true,
      map: tex.petal,
      bumpMap: tex.petal,
      bumpScale: 0.6,
      roughness: 0.62,
      sheen: 0.55,
      sheenRoughness: 0.5,
      sheenColor: new THREE.Color("#ffffff"),
      side: THREE.DoubleSide,
    });
  const mats: Record<MatKey, THREE.Material> = {
    stem: new THREE.MeshStandardMaterial({ color: stemColor, roughness: 0.55, vertexColors: true }),
    leaf: new THREE.MeshStandardMaterial({
      color: leafColor,
      vertexColors: true,
      map: tex.leaf,
      bumpMap: tex.leaf,
      bumpScale: 0.8,
      roughness: flower.model === "eucalyptus" ? 0.85 : 0.5,
      side: THREE.DoubleSide,
    }),
    petal: petal(),
    petal2: petal(),
    center: new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.92 }),
    floret: new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.75 }),
    bud: new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.6, map: tex.petal }),
  };
  for (const [k, m] of Object.entries(mats) as [MatKey, THREE.Material][]) {
    const transl = k === "petal" || k === "petal2" ? 0.45 : k === "leaf" ? 0.2 : k === "floret" ? 0.2 : 0;
    patchWind(m, amp, m instanceof THREE.MeshPhysicalMaterial ? 0.0012 : 0.0008, transl);
  }
  materialCache.set(key, mats);
  return mats;
}

// ───────────────────────── 對外 API ─────────────────────────

export type FlowerAsset = { key: MatKey; geometry: THREE.BufferGeometry }[];

const assetCache = new Map<string, FlowerAsset>();

/** 取得某花材在指定花莖長度下的 3D 資產（依長度快取，5mm 一級） */
export function getFlowerAsset(flower: Flower, height: number): FlowerAsset {
  const H = Math.round(height * 200) / 200;
  const key = `${flower.slug}:${H}`;
  const hit = assetCache.get(key);
  if (hit) return hit;
  const rnd = seeded(flower.slug);
  const b = new Builder(H, paletteFor(flower), seeded(`${flower.slug}-tint`));
  MODELS[flower.model](b, H, rnd);
  const asset = b.build();
  assetCache.set(key, asset);
  return asset;
}

const belowGeo = new THREE.CylinderGeometry(0.0032, 0.0034, 1, 7, 1).translate(0, -0.5, 0);
/** 瓶口以下的花莖（長度以 scale.y 控制） */
export function getBelowStemGeometry() {
  return belowGeo;
}
