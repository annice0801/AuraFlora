import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getDb } from "@/lib/mongodb";
import type { Demo } from "@/data/demos";

/** 從 MongoDB 讀取花藝師示範腳本 */
export async function getDemos(): Promise<Demo[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("demos");

  const db = await getDb();
  return db
    .collection<Demo & { order: number }>("demos")
    .find({}, { projection: { _id: 0, createdAt: 0, updatedAt: 0, order: 0 } })
    .sort({ order: 1 })
    .toArray();
}
