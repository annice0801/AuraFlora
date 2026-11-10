// 首頁主視覺：把 3D 花材渲染成橫躺的高解析去背圖（2400×1200 渲染後裁掉透明邊緣），上傳到 Vercel Blob 的 flora/hero/
// 需求：開發伺服器正在執行（npm run dev）
// 執行：npm run render:hero [-- 輸出資料夾]
import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";
import { put } from "@vercel/blob";

const SLUGS = ["eucalyptus", "snow-willow", "peony-coral", "tulip-white", "lisianthus-white", "chamomile", "curly-willow"];
const BASE = process.env.STUDIO_URL ?? "http://localhost:3000";
const outDir = process.argv[2];
if (outDir) await fs.mkdir(outDir, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--ignore-gpu-blocklist", "--use-angle=metal"],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1300, height: 700 });
  await page.goto(`${BASE}/studio/asset-render`, { waitUntil: "networkidle0", timeout: 120_000 });
  await page.waitForFunction(() => window.__auraReady === true);
  const urls = {};
  for (const slug of SLUGS) {
    const raw = await page.evaluate((s) => window.__auraRender(s, "hero"), slug);
    // 裁掉透明邊緣，只留 4% 內距，讓花材填滿圖片
    const dataUrl = await page.evaluate(async (src) => {
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
      const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.04);
      x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
      x1 = Math.min(c.width - 1, x1 + pad); y1 = Math.min(c.height - 1, y1 + pad);
      const out = document.createElement("canvas");
      out.width = x1 - x0 + 1;
      out.height = y1 - y0 + 1;
      out.getContext("2d").drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
      return out.toDataURL("image/png");
    }, raw);
    const png = Buffer.from(dataUrl.split(",")[1], "base64");
    if (outDir) await fs.writeFile(path.join(outDir, `${slug}.png`), png);
    const blob = await put(`flora/hero/${slug}.png`, png, { access: "public", contentType: "image/png", addRandomSuffix: false, allowOverwrite: true });
    const dims = await page.evaluate(async (src) => { const i = new Image(); i.src = src; await i.decode(); return [i.width, i.height]; }, dataUrl);
    urls[slug] = { url: blob.url, width: dims[0], height: dims[1] };
    console.log(`✓ ${slug}（${Math.round(png.length / 1024)} KB）`);
  }
  console.log(JSON.stringify(urls));
} finally {
  await browser.close();
}
