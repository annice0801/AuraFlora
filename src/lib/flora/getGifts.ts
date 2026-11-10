import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getDb } from "@/lib/mongodb";
import type { GiftProduct } from "@/data/gifts";

export async function getGiftProducts(): Promise<GiftProduct[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("gift-products");
  const db = await getDb();
  return db
    .collection<GiftProduct & { order: number }>("gift_products")
    .find({}, { projection: { _id: 0, createdAt: 0, updatedAt: 0, order: 0 } })
    .sort({ order: 1 })
    .toArray();
}

export async function getGiftProduct(slug: string) {
  return (await getGiftProducts()).find((p) => p.slug === slug) ?? null;
}
