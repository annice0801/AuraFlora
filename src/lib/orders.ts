import "server-only";
import crypto from "node:crypto";
import { ObjectId, type Db } from "mongodb";
import {
  PRESHIP_CHECKLIST,
  WEEKLY_KIT,
  type FloralRecipe,
  type GiftProduct,
  type RecipeStem,
} from "@/data/gifts";

// ───────────── 型別與狀態 ─────────────

export { STATUS_LABEL, CUSTOMER_STEPS, type OrderStatus } from "./order-status";
import type { OrderStatus } from "./order-status";

export type Contact = { name: string; phone: string; email?: string; company?: string; taxId?: string };
export type Recipient = { name: string; phone: string; city: string; district: string; address: string };

export type OrderPhoto = { url: string; kind: "pre_ship" | "delivery"; uploadedAt: Date; by: string };

export type WorkOrder = {
  floristId: string;
  floristName: string;
  assignedAt: Date;
  acceptedAt?: Date;
  recipe: FloralRecipe;
  checklist: { id: string; label: string; done: boolean; doneAt?: Date }[];
  photos: OrderPhoto[];
  review?: { approved: boolean; note?: string; at: Date; by: string };
};

export type OrderDoc = {
  _id: ObjectId;
  orderNo: string;
  userId: string;
  kind: "gift" | "kit";
  title: string;
  item: {
    slug: string;
    name: string;
    tierId?: string;
    tierName?: string;
    spec?: string;
    occasion?: string;
    imageUrl?: string;
    source?: "weekly" | "recipe";
    recipeId?: string;
    dropDate?: string;
    stems?: RecipeStem[];
  };
  amountTwd: number;
  buyer: Contact;
  recipient: Recipient;
  delivery: { date: string; slot: string };
  card?: { to: string; message: string; from: string };
  note?: string;
  status: OrderStatus;
  reservedUntil?: Date;
  payment: { provider: "ecpay"; merchantTradeNos: string[]; paidAt?: Date; tradeNo?: string; method?: string; amount?: number };
  workOrder?: WorkOrder;
  timeline: { status: OrderStatus | "note"; at: Date; by: string; note?: string }[];
  createdAt: Date;
  updatedAt: Date;
};

export const ordersCol = (db: Db) => db.collection<OrderDoc>("orders");

// ───────────── 台北時間工具 ─────────────

export function taipeiDate(offsetDays = 0, from = new Date()) {
  const d = new Date(from.getTime() + offsetDays * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** 距離台北時間下一個午夜的毫秒數 */
export function msUntilTaipeiMidnight(now = new Date()) {
  const [y, m, d] = taipeiDate(1, now).split("-").map(Number);
  const midnightUtc = Date.UTC(y, m - 1, d) - 8 * 3600 * 1000;
  return midnightUtc - now.getTime();
}

/** 綠界 MerchantTradeNo：英數 20 字內、不可重複 */
export function newMerchantTradeNo() {
  const t = taipeiDate().replace(/-/g, "").slice(2);
  return `AF${t}${crypto.randomBytes(5).toString("hex").toUpperCase()}`.slice(0, 20);
}

// ───────────── 模式 B：每日限量庫存 ─────────────

const HOLD_MINUTES = 20;

type DropDoc = { _id: string; limit: number; reserved: number };

/** 逾時未付款的花材包訂單自動釋出庫存 */
export async function releaseExpiredKits(db: Db) {
  const expired = await ordersCol(db)
    .find({ kind: "kit", status: "pending_payment", reservedUntil: { $lt: new Date() } }, { projection: { _id: 1, item: 1 } })
    .toArray();
  for (const o of expired) {
    const res = await ordersCol(db).updateOne(
      { _id: o._id, status: "pending_payment" },
      {
        $set: { status: "expired", updatedAt: new Date() },
        $push: { timeline: { status: "expired", at: new Date(), by: "system", note: "超過付款期限，名額已釋出" } },
      },
    );
    if (res.modifiedCount && o.item.source === "weekly" && o.item.dropDate)
      await db.collection<DropDoc>("kit_drops").updateOne({ _id: o.item.dropDate }, { $inc: { reserved: -1 } });
  }
}

export async function getDrop(db: Db, date: string) {
  await db
    .collection<DropDoc>("kit_drops")
    .updateOne({ _id: date }, { $setOnInsert: { limit: WEEKLY_KIT.dailyLimit, reserved: 0 } }, { upsert: true });
  const d = (await db.collection<DropDoc>("kit_drops").findOne({ _id: date }))!;
  return { date, limit: d.limit, remaining: Math.max(d.limit - d.reserved, 0) };
}

/** 原子性地預留一份名額；售罄回傳 false */
export async function reserveDrop(db: Db, date: string) {
  await getDrop(db, date);
  const res = await db
    .collection<DropDoc>("kit_drops")
    .updateOne({ _id: date, $expr: { $lt: ["$reserved", "$limit"] } }, { $inc: { reserved: 1 } });
  return res.modifiedCount === 1;
}

export const holdUntil = () => new Date(Date.now() + HOLD_MINUTES * 60000);

// ───────────── 付款確認（ECPay 回傳） ─────────────

export async function confirmPayment(
  db: Db,
  p: { merchantTradeNo: string; rtnCode: string; tradeNo?: string; amount?: number; method?: string },
) {
  const order = await ordersCol(db).findOne({ "payment.merchantTradeNos": p.merchantTradeNo });
  if (!order) return null;
  if (p.rtnCode !== "1" || (order.status !== "pending_payment" && order.status !== "expired")) return order;
  if (p.amount !== undefined && p.amount !== order.amountTwd) return order;
  const now = new Date();
  // 若花材包預留已逾時被釋出，付款成功時重新占回名額（允許超賣 1 份，避免付了錢卻沒有商品）
  if (order.status === "expired" && order.item.source === "weekly" && order.item.dropDate)
    await db.collection<DropDoc>("kit_drops").updateOne({ _id: order.item.dropDate }, { $inc: { reserved: 1 } });
  await ordersCol(db).updateOne(
    { _id: order._id, status: { $in: ["pending_payment", "expired"] } },
    {
      $set: {
        status: "paid",
        updatedAt: now,
        "payment.paidAt": now,
        "payment.tradeNo": p.tradeNo,
        "payment.method": p.method,
        "payment.amount": p.amount,
      },
      $unset: { reservedUntil: "" },
      $push: { timeline: { status: "paid", at: now, by: "ecpay", note: "綠界付款完成" } },
    },
  );
  return ordersCol(db).findOne({ _id: order._id });
}

// ───────────── 工單（給花店的規格化配方） ─────────────

/** 依方案倍率放大配方枝數 */
export function scaleRecipe(recipe: FloralRecipe, factor: number): FloralRecipe {
  return {
    ...recipe,
    stems: recipe.stems.map((s) => ({ ...s, count: Math.max(1, Math.round(s.count * factor)) })),
  };
}

export function kitRecipe(): FloralRecipe {
  return {
    vessel: "冷鏈花材盒（不含花器）",
    dimensions: "附花器尺寸建議卡",
    colors: [
      { name: "霧白", hex: "#f5f2ee" },
      { name: "洋甘菊黃", hex: "#f2c94c" },
      { name: "銀灰綠", hex: "#8fa59a" },
    ],
    stems: WEEKLY_KIT.stems,
    wrapping: "保冷盒＋保水管",
    notes: ["每枝花材加保水管", "附插花步驟卡與花藝配方卡"],
  };
}

export function newWorkOrder(floristId: string, floristName: string, recipe: FloralRecipe): WorkOrder {
  return {
    floristId,
    floristName,
    assignedAt: new Date(),
    recipe,
    checklist: PRESHIP_CHECKLIST.map((c) => ({ ...c, done: false })),
    photos: [],
  };
}

export function giftRecipeFor(product: GiftProduct, tierId: string) {
  const tier = product.tiers.find((t) => t.id === tierId) ?? product.tiers[0];
  return scaleRecipe({ ...product.recipe, dimensions: `${tier.name}・${tier.spec}` }, tier.factor);
}

/** 給前端的安全序列化（ObjectId、Date 轉字串） */
export function serializeOrder(o: OrderDoc) {
  return JSON.parse(JSON.stringify({ ...o, id: o._id.toHexString() })) as SerializedOrder;
}

type Jsonify<T> = T extends Date
  ? string
  : T extends ObjectId
    ? string
    : T extends (infer U)[]
      ? Jsonify<U>[]
      : T extends object
        ? { [K in keyof T]: Jsonify<T[K]> }
        : T;
export type SerializedOrder = Jsonify<OrderDoc> & { id: string };
