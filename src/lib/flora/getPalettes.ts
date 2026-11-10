import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getDb } from "@/lib/mongodb";
import type { Palette } from "@/data/palettes";

export type PaletteFlower = { name: string; bunch: number; image: { src: string; width: number; height: number } };
export type PaletteDoc = Palette & { flowers: Record<string, PaletteFlower> };

/** 配色花譜（花材去背圖在 Vercel Blob，資料在 MongoDB 的 palettes 集合） */
export async function getPalettes(): Promise<PaletteDoc[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("palettes");
  const db = await getDb();
  return db
    .collection<PaletteDoc & { order: number }>("palettes")
    .find({}, { projection: { _id: 0, createdAt: 0, updatedAt: 0, order: 0 } })
    .sort({ order: 1 })
    .toArray();
}
