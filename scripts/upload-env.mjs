// 上傳 3D 場景用的 HDRI 環境光到 Vercel Blob
// 來源：Poly Haven「Studio Small 08」（Sergej Majboroda，CC0）https://polyhaven.com/a/studio_small_08
// 執行：node --env-file=.env.local scripts/upload-env.mjs <hdr 檔案路徑>
import fs from "node:fs/promises";
import { put } from "@vercel/blob";

const file = process.argv[2];
if (!file) throw new Error("請指定 .hdr 檔案路徑");
const data = await fs.readFile(file);
if (!data.subarray(0, 10).toString().startsWith("#?RADIANCE")) throw new Error("不是 Radiance HDR 檔案");
const blob = await put("env/studio_small_08_1k.hdr", data, {
  access: "public",
  contentType: "application/octet-stream",
  addRandomSuffix: false,
  allowOverwrite: true,
});
console.log(blob.url);
