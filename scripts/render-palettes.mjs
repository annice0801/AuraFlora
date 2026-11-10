// 配色花譜：把各色版花材渲染成去背圖（花頭特寫，裁掉透明邊緣）上傳到 Vercel Blob，
// 並把配色資料寫入 MongoDB 的 palettes 集合（每份配色附上用到的花材名稱、圖片與一束枝數）。
// 需求：開發伺服器正在執行（npm run dev）
// 執行：npm run render:palettes [-- 輸出資料夾]
import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";
import { put } from "@vercel/blob";
import { MongoClient } from "mongodb";
import { flowerCatalog } from "../src/data/flowers.ts";
import { BUNCH_SIZE, PALETTES, VARIANTS } from "../src/data/palettes.ts";

const BASE = process.env.STUDIO_URL ?? "http://localhost:3000";
const outDir = process.argv[2];
if (outDir) await fs.mkdir(outDir, { recursive: true });

// 檢查配色資料引用的色版都存在
const variantIds = new Set(VARIANTS.map((v) => v.id));
for (const p of PALETTES)
  for (const id of [...p.lineup, ...p.arrangements.flatMap((a) => a.items.map((i) => i.variant))])
    if (!variantIds.has(id)) throw new Error(`配色「${p.name}」用到不存在的色版：${id}`);

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--ignore-gpu-blocklist", "--use-angle=metal"],
});
const client = new MongoClient(process.env.MONGODB_URI);
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 700, height: 700 });
  await page.goto(`${BASE}/studio/asset-render`, { waitUntil: "networkidle0", timeout: 120_000 });
  await page.waitForFunction(() => window.__auraReady === true);
  const version = Date.now();
  const images = {};
  for (const v of VARIANTS) {
    const base = flowerCatalog.find((f) => f.slug === v.base);
    const flower = { ...base, slug: v.id, name: v.name, color: v.color ?? base.color, accent: v.accent ?? base.accent };
    const raw = await page.evaluate((f) => window.__auraRenderFlower(f, "head"), flower);
    const trimmed = await page.evaluate(async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, c.width, c.height);
      let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
      for (let y = 0; y < c.height; y++)
        for (let x = 0; x < c.width; x++)
          if (data[(y * c.width + x) * 4 + 3] > 8) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
      const out = document.createElement("canvas");
      out.width = x1 - x0 + 1;
      out.height = y1 - y0 + 1;
      out.getContext("2d").drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
      return { url: out.toDataURL("image/png"), width: out.width, height: out.height };
    }, raw);
    const png = Buffer.from(trimmed.url.split(",")[1], "base64");
    if (outDir) await fs.writeFile(path.join(outDir, `${v.id}.png`), png);
    const blob = await put(`flora/palette/${v.id}.png`, png, { access: "public", contentType: "image/png", addRandomSuffix: false, allowOverwrite: true });
    images[v.id] = { src: `${blob.url}?v=${version}`, width: trimmed.width, height: trimmed.height };
    console.log(`✓ ${v.name}（${trimmed.width}×${trimmed.height}）`);
  }

  await client.connect();
  const col = client.db().collection("palettes");
  await col.createIndex({ slug: 1 }, { unique: true });
  const now = new Date();
  for (const [order, p] of PALETTES.entries()) {
    const used = new Set([...p.lineup, ...p.arrangements.flatMap((a) => a.items.map((i) => i.variant))]);
    const flowers = Object.fromEntries(
      [...used].map((id) => {
        const v = VARIANTS.find((x) => x.id === id);
        return [id, { name: v.name, bunch: BUNCH_SIZE[v.base] ?? 10, image: images[id] }];
      }),
    );
    await col.updateOne({ slug: p.slug }, { $set: { ...p, flowers, order, updatedAt: now }, $setOnInsert: { createdAt: now } }, { upsert: true });
  }
  console.log(`palettes：${PALETTES.length} 組配色`);
} finally {
  await browser.close();
  await client.close();
}
