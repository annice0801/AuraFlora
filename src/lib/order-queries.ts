import "server-only";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { ordersCol, releaseExpiredKits, serializeOrder, type OrderStatus } from "@/lib/orders";
import type { CurrentUser } from "@/lib/session";

export async function getMyOrders(user: CurrentUser) {
  const db = await getDb();
  await releaseExpiredKits(db);
  const list = await ordersCol(db).find({ userId: user.id }).sort({ createdAt: -1 }).limit(50).toArray();
  return list.map(serializeOrder);
}

/** 訂單本人、管理員、或被派單的花店才能看到 */
export async function getOrderForViewer(id: string, user: CurrentUser) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  await releaseExpiredKits(db);
  const o = await ordersCol(db).findOne({ _id: new ObjectId(id) });
  if (!o) return null;
  const allowed = o.userId === user.id || user.role === "admin" || (user.role === "florist" && o.workOrder?.floristId === user.id);
  return allowed ? serializeOrder(o) : null;
}

export async function getAdminOrders(status?: OrderStatus | "active") {
  const db = await getDb();
  await releaseExpiredKits(db);
  const filter =
    status === "active"
      ? { status: { $nin: ["delivered", "cancelled", "expired", "pending_payment"] as OrderStatus[] } }
      : status
        ? { status }
        : {};
  const list = await ordersCol(db).find(filter).sort({ createdAt: -1 }).limit(100).toArray();
  return list.map(serializeOrder);
}

export async function getFloristOrders(user: CurrentUser) {
  const db = await getDb();
  const list = await ordersCol(db).find({ "workOrder.floristId": user.id }).sort({ "delivery.date": 1 }).limit(100).toArray();
  return list.map(serializeOrder);
}

export async function listFlorists() {
  const db = await getDb();
  const users = await db
    .collection("user")
    .find({ role: "florist" }, { projection: { name: 1, email: 1 } })
    .sort({ name: 1 })
    .toArray();
  return users.map((u) => ({ id: u._id.toHexString(), name: String(u.name), email: String(u.email) }));
}
