// 把程序化 3D 花材渲染成高解析去背 PNG（1024×1024，整枝與花頭特寫各一張），上傳到 Vercel Blob，並把網址寫回 MongoDB
// 需求：開發伺服器正在執行（npm run dev），本機有安裝 Google Chrome
// 執行：npm run render:cutouts [-- 輸出資料夾]
import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";
import { put } from "@vercel/blob";
import { MongoClient } from "mongodb";
import { flowerCatalog } from "../src/data/flowers.ts";

const BASE = process.env.STUDIO_URL ?? "http://localhost:3000";
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outDir = process.argv[2];
if (outDir) await fs.mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--ignore-gpu-blocklist", "--enable-webgl", "--use-angle=metal"],
});
const client = new MongoClient(process.env.MONGODB_URI);
try {
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("頁面錯誤：", e.message));
  await page.setViewport({ width: 600, height: 600, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/studio/asset-render`, { waitUntil: "networkidle0", timeout: 120_000 });
  await page.waitForFunction(() => window.__auraReady === true, { timeout: 60_000 });
  await client.connect();
  const col = client.db().collection("flowers");
  const version = Date.now();

  // full：整枝花（配方卡、大圖用）；head：花頭特寫（花材清單的小圖示用）
  const upload = async (flower, mode) => {
    const dataUrl = await page.evaluate((slug, m) => window.__auraRender(slug, m), flower.slug, mode);
    const png = Buffer.from(dataUrl.split(",")[1], "base64");
    if (outDir) await fs.writeFile(path.join(outDir, `${flower.slug}-${mode}.png`), png);
    const blob = await put(`flora/${mode === "full" ? "cutouts" : "thumbs"}/${flower.slug}.png`, png, {
      access: "public",
      contentType: "image/png",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return { url: `${blob.url}?v=${version}`, kb: Math.round(png.length / 1024) };
  };
  for (const flower of flowerCatalog) {
    const full = await upload(flower, "full");
    const head = await upload(flower, "head");
    await col.updateOne(
      { slug: flower.slug },
      { $set: { cutoutUrl: full.url, thumbUrl: head.url, updatedAt: new Date() } },
    );
    console.log(`✓ ${flower.name}（整枝 ${full.kb} KB、花頭 ${head.kb} KB）`);
  }
} finally {
  await browser.close();
  await client.close();
}
