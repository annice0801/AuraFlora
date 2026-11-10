// 禮贈商品：上傳照片到 Vercel Blob，商品資料寫入 MongoDB 的 gift_products 集合
// 執行：npm run seed:gifts -- <照片資料夾（檔名為 slug.jpg，可省略）>
import fs from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { MongoClient } from "mongodb";
import { giftCatalog } from "../src/data/gifts.ts";

const photoDir = process.argv[2];
const client = new MongoClient(process.env.MONGODB_URI);
try {
  await client.connect();
  const db = client.db();
  const col = db.collection("gift_products");
  await col.createIndex({ slug: 1 }, { unique: true });
  // 訂單與限量庫存的索引
  await db.collection("orders").createIndex({ orderNo: 1 }, { unique: true });
  await db.collection("orders").createIndex({ userId: 1, createdAt: -1 });
  await db.collection("orders").createIndex({ "workOrder.floristId": 1, createdAt: -1 });
  await db.collection("orders").createIndex({ status: 1, createdAt: -1 });
  const existing = new Map((await col.find({}, { projection: { slug: 1, "image.url": 1 } }).toArray()).map((d) => [d.slug, d.image?.url]));
  const now = new Date();
  let uploaded = 0;
  for (const [order, item] of giftCatalog.entries()) {
    let url = existing.get(item.slug);
    if (photoDir) {
      const data = await fs.readFile(path.join(photoDir, `${item.slug}.jpg`)).catch(() => null);
      if (data) {
        const blob = await put(`gifts/${item.slug}.jpg`, data, {
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
  console.log(`gift_products：${giftCatalog.length} 筆（上傳照片 ${uploaded} 張）`);
} finally {
  await client.close();
}
