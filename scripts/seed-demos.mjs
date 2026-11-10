// 將 src/data/demos.ts 的花藝師示範腳本寫入 MongoDB（以 slug 為鍵 upsert）
// 執行：npm run seed:demos
import { MongoClient } from "mongodb";
import { demoCatalog } from "../src/data/demos.ts";
import { flowerCatalog } from "../src/data/flowers.ts";

const known = new Set(flowerCatalog.map((f) => f.slug));
for (const demo of demoCatalog)
  for (const step of demo.steps)
    for (const stem of step.stems)
      if (!known.has(stem.slug)) throw new Error(`示範「${demo.title}」使用了不存在的花材：${stem.slug}`);

const client = new MongoClient(process.env.MONGODB_URI);
try {
  await client.connect();
  const col = client.db().collection("demos");
  await col.createIndex({ slug: 1 }, { unique: true });
  const now = new Date();
  const res = await col.bulkWrite(
    demoCatalog.map((demo, order) => ({
      updateOne: {
        filter: { slug: demo.slug },
        update: { $set: { ...demo, order, updatedAt: now }, $setOnInsert: { createdAt: now } },
        upsert: true,
      },
    })),
  );
  console.log(`demos：新增 ${res.upsertedCount} 筆，更新 ${res.modifiedCount} 筆，共 ${demoCatalog.length} 套示範`);
} finally {
  await client.close();
}
