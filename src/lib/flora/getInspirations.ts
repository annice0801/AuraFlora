import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getDb } from "@/lib/mongodb";
import type { GoldenRecipe, Inspiration } from "@/data/inspirations";

/** 公開的場景靈感（不含會員限定的黃金比例清單） */
export async function getInspirations(): Promise<Inspiration[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("inspirations");
  const db = await getDb();
  return db
    .collection<Inspiration & { order: number }>("inspirations")
    .find({}, { projection: { _id: 0, createdAt: 0, updatedAt: 0, order: 0 } })
    .sort({ order: 1 })
    .toArray();
}

/** 會員限定：花材黃金比例清單。呼叫端必須先確認已登入 */
export async function getGoldenRecipe(slug: string): Promise<GoldenRecipe | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("inspiration-recipes");
  const db = await getDb();
  return db
    .collection<GoldenRecipe>("inspiration_recipes")
    .findOne({ slug }, { projection: { _id: 0, createdAt: 0, updatedAt: 0 } });
}
