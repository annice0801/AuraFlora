// 美學配方卡：把 3D 截圖、色票、花材名錄與照護指南排版成一張圖片
import { LAYERS, STYLES, type Flower, type StyleTag } from "@/data/flowers";
import type { Placement, VaseSpec } from "@/lib/flora/physics";

export type RecipeSummary = {
  title: string;
  style: StyleTag;
  palette: { color: string; name: string }[];
  items: { flower: Flower; count: number }[];
  care: string[];
  vaseLifeDays: number;
};

const shortName = (name: string) => name.replace(/（.*?）/g, "");

export function summarizeRecipe(
  placements: Placement[],
  bySlug: Map<string, Flower>,
  vase: VaseSpec,
  chosenStyle: StyleTag | null,
): RecipeSummary {
  const counts = new Map<string, number>();
  for (const p of placements) counts.set(p.slug, (counts.get(p.slug) ?? 0) + 1);
  const order = LAYERS.map((l) => l.id);
  const items = [...counts.entries()]
    .map(([slug, count]) => ({ flower: bySlug.get(slug)!, count }))
    .filter((i) => i.flower)
    .sort((a, b) => order.indexOf(a.flower.layer) - order.indexOf(b.flower.layer));

  // 風格：使用者選的，否則取花材最常出現的風格標籤
  let style = chosenStyle;
  if (!style) {
    const tally = new Map<StyleTag, number>();
    for (const { flower, count } of items)
      for (const s of flower.styles) tally.set(s, (tally.get(s) ?? 0) + count);
    style = [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "korean";
  }
  const styleName = STYLES.find((s) => s.id === style)!.name;

  const heroes = items.filter((i) => i.flower.layer === "focal");
  const named = (heroes.length ? heroes : items).slice(0, 2).map((i) => shortName(i.flower.name));
  const title = `${styleName}・${[...new Set(named)].join("與") || "自由創作"}`;

  const palette: { color: string; name: string }[] = [];
  const seen = new Set<string>();
  const push = (color: string, name: string) => {
    if (seen.has(color.toLowerCase()) || palette.length >= 6) return;
    seen.add(color.toLowerCase());
    palette.push({ color, name });
  };
  for (const { flower } of items) push(flower.color, flower.colorName);
  for (const { flower } of items) if (flower.layer === "focal") push(flower.accent, `${shortName(flower.name)}花心`);
  push(vase.swatch.color, vase.swatch.name);

  const care: string[] = [vase.care];
  const usedModels = new Set<string>();
  for (const { flower } of items) {
    if (care.length >= 4) break;
    if (usedModels.has(flower.model) || flower.layer === "skeleton") continue;
    usedModels.add(flower.model);
    care.push(`${shortName(flower.name)}：${flower.care}`);
  }
  const shortest = items.reduce((a, b) => (b.flower.vaseLifeDays < a.flower.vaseLifeDays ? b : a), items[0]);
  const vaseLifeDays = shortest?.flower.vaseLifeDays ?? 0;
  if (shortest)
    care.push(`預估觀賞期約 ${vaseLifeDays} 天；${shortName(shortest.flower.name)}最先凋謝，先挑出來，其他花材還能繼續欣賞。`);

  return { title, style, palette, items, care, vaseLifeDays };
}

// 避頭點：這些標點不能出現在行首
const NO_LINE_START = "，。、；：！？）」』》〉%";

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxWidth && line && !NO_LINE_START.includes(ch)) {
      lines.push(line);
      line = ch;
    } else line += ch;
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const W = 1080;
const PAD = 64;
const LAYER_NAME = Object.fromEntries(LAYERS.map((l) => [l.id, l.name]));

export async function drawRecipeCard(
  screenshot: string,
  summary: RecipeSummary,
  vase: VaseSpec,
): Promise<Blob> {
  const root = getComputedStyle(document.documentElement);
  const serif = `${root.getPropertyValue("--font-noto-serif-tc").trim() || "serif"}, "Songti TC", serif`;
  const sans = `"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif`;
  await document.fonts.load(`700 40px ${serif}`, summary.title).catch(() => undefined);

  const shot = await loadImage(screenshot);

  // 先試算高度
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = `28px ${sans}`;
  const careLines = summary.care.map((c) => wrap(measure, c, W - PAD * 2 - 36));
  const careHeight = careLines.reduce((h, l) => h + l.length * 42 + 14, 0);
  const listHeight = summary.items.length * 64;
  const imgH = 760;
  const H = 210 + imgH + 70 + 150 + 70 + listHeight + 70 + careHeight + 140;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#faf7f2";
  ctx.fillRect(0, 0, W, H);

  // 標題
  ctx.fillStyle = "#b5525c";
  ctx.font = `600 24px ${sans}`;
  ctx.fillText("AURAFLORA ・ 美學配方卡", PAD, 84);
  ctx.fillStyle = "#2b2622";
  ctx.font = `700 52px ${serif}`;
  ctx.fillText(summary.title, PAD, 150);
  ctx.fillStyle = "#7a6f66";
  ctx.font = `26px ${sans}`;
  const date = new Date().toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" });
  ctx.fillText(`${vase.name}　｜　${date}`, PAD, 192);

  // 作品截圖（置中裁切）
  let y = 220;
  const boxW = W - PAD * 2;
  const scale = Math.max(boxW / shot.width, imgH / shot.height);
  const sw = boxW / scale;
  const sh = imgH / scale;
  ctx.save();
  roundRect(ctx, PAD, y, boxW, imgH, 28);
  ctx.clip();
  ctx.drawImage(shot, (shot.width - sw) / 2, (shot.height - sh) / 2, sw, sh, PAD, y, boxW, imgH);
  ctx.restore();
  y += imgH + 70;

  const heading = (text: string) => {
    ctx.fillStyle = "#6f7d5c";
    ctx.font = `700 30px ${serif}`;
    ctx.fillText(text, PAD, y);
    y += 30;
  };

  // 色票
  heading("色票");
  const sw2 = boxW / Math.max(summary.palette.length, 1);
  summary.palette.forEach((p, i) => {
    const cx = PAD + sw2 * i + sw2 / 2;
    ctx.beginPath();
    ctx.arc(cx, y + 42, 34, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(43,38,34,0.12)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#2b2622";
    ctx.font = `22px ${sans}`;
    ctx.fillText(p.name, cx, y + 106);
    ctx.fillStyle = "#7a6f66";
    ctx.font = `18px ${sans}`;
    ctx.fillText(p.color.toUpperCase(), cx, y + 132);
    ctx.textAlign = "left";
  });
  y += 150 + 40;

  // 花材名錄
  heading("花材名錄");
  y += 16;
  for (const { flower, count } of summary.items) {
    ctx.fillStyle = flower.color;
    ctx.beginPath();
    ctx.arc(PAD + 12, y + 18, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(43,38,34,0.15)";
    ctx.stroke();
    ctx.fillStyle = "#7a6f66";
    ctx.font = `22px ${sans}`;
    ctx.fillText(LAYER_NAME[flower.layer], PAD + 40, y + 26);
    ctx.fillStyle = "#2b2622";
    ctx.font = `600 28px ${sans}`;
    ctx.fillText(`${flower.name} × ${count}`, PAD + 190, y + 27);
    ctx.fillStyle = "#7a6f66";
    ctx.font = `italic 22px Georgia, serif`;
    ctx.textAlign = "right";
    ctx.fillText(flower.latin, W - PAD, y + 26);
    ctx.textAlign = "left";
    y += 64;
  }
  y += 40;

  // 照護指南
  heading("照護指南");
  y += 18;
  ctx.font = `28px ${sans}`;
  careLines.forEach((lines) => {
    ctx.fillStyle = "#b5525c";
    ctx.beginPath();
    ctx.arc(PAD + 10, y + 18, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2b2622";
    lines.forEach((l) => {
      ctx.fillText(l, PAD + 36, y + 28);
      y += 42;
    });
    y += 14;
  });

  // 頁尾
  ctx.fillStyle = "#e8e0d6";
  ctx.fillRect(PAD, H - 96, boxW, 2);
  ctx.fillStyle = "#7a6f66";
  ctx.font = `22px ${sans}`;
  ctx.fillText("在 AuraFlora 互動花室創作", PAD, H - 52);
  ctx.textAlign = "right";
  ctx.fillText(`預估觀賞期 ${summary.vaseLifeDays} 天`, W - PAD, H - 52);
  ctx.textAlign = "left";

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("配方卡輸出失敗"))), "image/webp", 0.9),
  );
}
