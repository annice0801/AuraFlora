// 風格策展：上傳實景照片到 Vercel Blob，並把靈感資料寫入 MongoDB
// - inspirations：公開資料（照片、風格、場景、季節、描述）
// - inspiration_recipes：會員限定的花材黃金比例清單（分開存放，公開查詢不會帶出）
// 執行：npm run seed:inspirations -- <照片資料夾（檔名為 slug.jpg，可省略）>
import fs from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { MongoClient } from "mongodb";
import { inspirationCatalog, recipeCatalog } from "../src/data/inspirations.ts";

const photoDir = process.argv[2];
const slugs = new Set(inspirationCatalog.map((i) => i.slug));
for (const r of recipeCatalog) if (!slugs.has(r.slug)) throw new Error(`配方 ${r.slug} 沒有對應的靈感`);

const client = new MongoClient(process.env.MONGODB_URI);
try {
  await client.connect();
  const db = client.db();
  const col = db.collection("inspirations");
  const recipes = db.collection("inspiration_recipes");
  await col.createIndex({ slug: 1 }, { unique: true });
  await recipes.createIndex({ slug: 1 }, { unique: true });
  const existing = new Map((await col.find({}, { projection: { slug: 1, "image.url": 1 } }).toArray()).map((d) => [d.slug, d.image?.url]));
  const now = new Date();
  let uploaded = 0;

  for (const [order, item] of inspirationCatalog.entries()) {
    let url = existing.get(item.slug);
    if (photoDir) {
      const file = path.join(photoDir, `${item.slug}.jpg`);
      const data = await fs.readFile(file).catch(() => null);
      if (data) {
        const blob = await put(`curation/${item.slug}.jpg`, data, {
          access: "public",
          contentType: "image/jpeg",
          addRandomSuffix: false,
          allowOverwrite: true,
        });
        url = `${blob.url}?v=${now.getTime()}`;
        uploaded += 1;
      }
    }
    if (!url) throw new Error(`${item.slug} 沒有照片：請指定照片資料夾`);
    await col.updateOne(
      { slug: item.slug },
      { $set: { ...item, image: { ...item.image, url }, order, updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true },
    );
  }
  for (const r of recipeCatalog) {
    await recipes.updateOne({ slug: r.slug }, { $set: { ...r, updatedAt: now }, $setOnInsert: { createdAt: now } }, { upsert: true });
  }
  console.log(`inspirations：${inspirationCatalog.length} 筆（上傳照片 ${uploaded} 張），inspiration_recipes：${recipeCatalog.length} 筆`);
} finally {
  await client.close();
}
