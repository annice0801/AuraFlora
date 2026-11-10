// 配角提示演算法：根據主花的「色彩」與「形態」，從配花與填充花材中挑出最搭的 3 款
import type { Flower, Form, StyleTag } from "@/data/flowers";
import { hexToHsl, hueDistance, isNeutral, toRybHue } from "./color";

export type Suggestion = { flower: Flower; score: number; reasons: string[] };

// 形態對比表：主花形態 × 襯花形態 → 適配度（越高代表越能互補）
const FORM_MATRIX: Partial<Record<Form, Partial<Record<Form, number>>>> = {
  cup: { spray: 1, ruffle: 0.85, daisy: 0.8, cluster: 0.75, spike: 0.7 },
  round: { spike: 1, spray: 1, daisy: 0.8, cluster: 0.7, ruffle: 0.5 },
  disc: { cluster: 1, spray: 0.9, ruffle: 0.7, spike: 0.6, daisy: 0.5 },
};

const FORM_LABEL: Record<Form, string> = {
  line: "線條",
  cup: "杯形",
  round: "圓球形",
  disc: "圓盤形",
  ruffle: "波浪瓣",
  spike: "花穗",
  spray: "霧狀小花",
  daisy: "小雛菊形",
  cluster: "繡球狀花簇",
};

function colorScore(focal: Flower, c: Flower): [number, string] {
  const a = hexToHsl(focal.color);
  const b = hexToHsl(c.color);
  if (isNeutral(b)) return [0.78, `中性${c.colorName}襯托主花`];
  if (isNeutral(a)) return [0.8, `${c.colorName}為白色主花增添色彩`];
  // 以 RYB 色環計算色相差
  const d = hueDistance(toRybHue(a.h), toRybHue(b.h));
  if (d <= 75) return [1, "類比色・和諧漸層"];
  if (d >= 150) return [0.92, "互補色・彼此點亮"];
  if (d >= 105) return [0.62, "三分色・活潑跳色"];
  return [0.5, "鄰近對比色"];
}

export function suggestCompanions(
  focal: Flower,
  flowers: Flower[],
  opts: { month?: number; style?: StyleTag } = {},
): Suggestion[] {
  const candidates = flowers.filter(
    (f) =>
      (f.layer === "secondary" || f.layer === "filler") &&
      (!opts.month || f.months.includes(opts.month)) &&
      (!opts.style || f.styles.includes(opts.style)),
  );

  const scored = candidates.map((c) => {
    const reasons: string[] = [];
    const [cs, colorReason] = colorScore(focal, c);
    reasons.push(colorReason);

    const fs = FORM_MATRIX[focal.form]?.[c.form] ?? 0.6;
    if (fs >= 0.85)
      reasons.push(`${FORM_LABEL[c.form]}對比${FORM_LABEL[focal.form]}`);

    let bonus = 0;
    const lightGap = Math.abs(hexToHsl(focal.color).l - hexToHsl(c.color).l);
    if (lightGap > 0.15) bonus += 0.08;
    if (c.styles.some((s) => focal.styles.includes(s))) bonus += 0.08;
    const shared = c.months.filter((m) => focal.months.includes(m)).length;
    if (shared >= 3) {
      bonus += 0.08;
      reasons.push("同季盛產");
    } else if (shared === 0) {
      bonus -= 0.15;
    }

    return { flower: c, score: cs * 0.55 + fs * 0.45 + bonus, reasons };
  });

  scored.sort((a, b) => b.score - a.score);

  // 多樣性：同一種模型（例如紫/白桔梗）只取分數最高的一個，且至少各有一款配花與填充
  const picked: Suggestion[] = [];
  const usedModels = new Set<string>();
  const take = (s: Suggestion) => {
    picked.push(s);
    usedModels.add(s.flower.model);
  };
  const bestOf = (layer: Flower["layer"]) =>
    scored.find((s) => s.flower.layer === layer && !usedModels.has(s.flower.model));
  for (const layer of ["secondary", "filler"] as const) {
    const s = bestOf(layer);
    if (s) take(s);
  }
  for (const s of scored) {
    if (picked.length >= 3) break;
    if (!usedModels.has(s.flower.model)) take(s);
  }
  return picked.sort((a, b) => b.score - a.score).slice(0, 3);
}
