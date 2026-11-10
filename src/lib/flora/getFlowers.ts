import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getDb } from "@/lib/mongodb";
import type { Flower } from "@/data/flowers";

/** 從 MongoDB 讀取花材目錄（快取一小時，可用 revalidateTag("flowers") 立即更新） */
export async function getFlowers(): Promise<Flower[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("flowers");

  const db = await getDb();
  const docs = await db
    .collection<Flower & { order: number }>("flowers")
    .find({}, { projection: { _id: 0, createdAt: 0, updatedAt: 0, order: 0 } })
    .sort({ order: 1 })
    .toArray();
  return docs;
}
