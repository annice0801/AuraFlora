export type HSL = { h: number; s: number; l: number };

export function hexToHsl(hex: string): HSL {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h * 60, s, l };
}

export function hueDistance(a: number, b: number) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/** 低彩度或接近白色的顏色視為中性色 */
export function isNeutral({ s, l }: HSL) {
  return s < 0.18 || l > 0.9;
}

// 花藝與繪畫常用的 RYB 色環（紅黃藍）：黃與紫、紅與綠、藍與橙互為補色。
// 把 RGB 色相換算到 RYB 色相，配色判斷會更接近花藝師的直覺。
const RGB_TO_RYB: [number, number][] = [
  [0, 0],
  [30, 60],
  [60, 120],
  [120, 180],
  [240, 240],
  [280, 300],
  [360, 360],
];

export function toRybHue(rgbHue: number) {
  const h = ((rgbHue % 360) + 360) % 360;
  for (let i = 1; i < RGB_TO_RYB.length; i++) {
    const [x0, y0] = RGB_TO_RYB[i - 1];
    const [x1, y1] = RGB_TO_RYB[i];
    if (h <= x1) return y0 + ((h - x0) / (x1 - x0)) * (y1 - y0);
  }
  return h;
}
