// 將 src/data/flowers.ts 的花材資料寫入 MongoDB（以 slug 為鍵 upsert，不會覆蓋已上傳的去背圖網址）
// 執行：npm run seed:flowers
import { MongoClient } from "mongodb";
import { flowerCatalog } from "../src/data/flowers.ts";

const client = new MongoClient(process.env.MONGODB_URI);
try {
  await client.connect();
  const col = client.db().collection("flowers");
  await col.createIndex({ slug: 1 }, { unique: true });
  const now = new Date();
  const ops = flowerCatalog.map((flower, order) => ({
    updateOne: {
      filter: { slug: flower.slug },
      update: {
        $set: { ...flower, order, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      upsert: true,
    },
  }));
  const res = await col.bulkWrite(ops);
  console.log(`flowers：新增 ${res.upsertedCount} 筆，更新 ${res.modifiedCount} 筆，共 ${flowerCatalog.length} 種花材`);
} finally {
  await client.close();
}
