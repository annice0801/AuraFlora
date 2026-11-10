"use server";

import { refresh } from "next/cache";
import { ObjectId } from "mongodb";
import { put } from "@vercel/blob";
import { getDb } from "@/lib/mongodb";
import { getCurrentUser, type CurrentUser } from "@/lib/session";
import { getGiftProduct } from "@/lib/flora/getGifts";
import {
  giftRecipeFor,
  kitRecipe,
  newWorkOrder,
  ordersCol,
  type OrderDoc,
  type OrderStatus,
} from "@/lib/orders";

type Result = { ok: true } | { ok: false; error: string };

const fail = (error: string): Result => ({ ok: false, error });

async function load(orderId: string) {
  if (!ObjectId.isValid(orderId)) return null;
  const db = await getDb();
  return ordersCol(db).findOne({ _id: new ObjectId(orderId) });
}

async function transition(
  order: OrderDoc,
  from: OrderStatus[],
  to: OrderStatus,
  by: CurrentUser,
  set: Record<string, unknown> = {},
  note?: string,
) {
  const db = await getDb();
  const now = new Date();
  const res = await ordersCol(db).updateOne(
    { _id: order._id, status: { $in: from } },
    {
      $set: { status: to, updatedAt: now, ...set },
      $push: { timeline: { status: to, at: now, by: by.name, ...(note ? { note } : {}) } },
    },
  );
  return res.modifiedCount === 1;
}

const isAdmin = (u: CurrentUser | null): u is CurrentUser => u?.role === "admin";
const ownsWork = (u: CurrentUser | null, o: OrderDoc): u is CurrentUser =>
  !!u && (u.role === "admin" || (u.role === "florist" && o.workOrder?.floristId === u.id));

// ───────────── 管理員 ─────────────

/** 派單給合作花店（花材包可派給工作室，也就是管理員自己） */
export async function assignOrder(orderId: string, floristId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return fail("沒有權限");
  const order = await load(orderId);
  if (!order) return fail("找不到訂單");
  const db = await getDb();
  const florist = await db.collection("user").findOne({ _id: new ObjectId(floristId) });
  if (!florist || (florist.role !== "florist" && floristId !== user.id)) return fail("請選擇合作花店");
  let recipe;
  if (order.kind === "gift") {
    const product = await getGiftProduct(order.item.slug);
    if (!product) return fail("商品資料不存在");
    recipe = giftRecipeFor(product, order.item.tierId ?? "");
  } else {
    recipe = kitRecipe();
  }
  const ok = await transition(
    order,
    ["paid", "assigned"],
    "assigned",
    user,
    { workOrder: newWorkOrder(floristId, String(florist.name), recipe) },
    `派單給 ${florist.name}`,
  );
  if (!ok) return fail("訂單狀態已變更，請重新整理");
  refresh();
  return { ok: true };
}

/** 審核出貨前實拍（Photo-Check） */
export async function reviewPhotoCheck(orderId: string, approved: boolean, note: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return fail("沒有權限");
  const order = await load(orderId);
  if (!order?.workOrder) return fail("找不到工單");
  if (!approved && !note.trim()) return fail("退回時請寫下需要修正的地方");
  const ok = await transition(
    order,
    ["photo_submitted"],
    approved ? "approved" : "photo_rejected",
    user,
    { "workOrder.review": { approved, note: note.trim() || undefined, at: new Date(), by: user.name } },
    approved ? "出貨前實拍核對通過" : `實拍退回：${note.trim()}`,
  );
  if (!ok) return fail("訂單狀態已變更，請重新整理");
  refresh();
  return { ok: true };
}

export async function cancelOrder(orderId: string, reason: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return fail("沒有權限");
  const order = await load(orderId);
  if (!order) return fail("找不到訂單");
  const ok = await transition(
    order,
    ["pending_payment", "paid", "assigned", "accepted", "photo_rejected", "photo_submitted", "approved"],
    "cancelled",
    user,
    {},
    reason.trim() || "管理員取消",
  );
  if (!ok) return fail("這個狀態無法取消");
  refresh();
  return { ok: true };
}

// ───────────── 合作花店（管理員也可代為操作） ─────────────

export async function acceptOrder(orderId: string): Promise<Result> {
  const user = await getCurrentUser();
  const order = await load(orderId);
  if (!order || !ownsWork(user, order)) return fail("沒有權限");
  const ok = await transition(order, ["assigned"], "accepted", user, { "workOrder.acceptedAt": new Date() }, "花店已接單");
  if (!ok) return fail("訂單狀態已變更，請重新整理");
  refresh();
  return { ok: true };
}

export async function toggleCheck(orderId: string, itemId: string, done: boolean): Promise<Result> {
  const user = await getCurrentUser();
  const order = await load(orderId);
  if (!order || !ownsWork(user, order)) return fail("沒有權限");
  if (!["accepted", "photo_rejected"].includes(order.status)) return fail("目前無法修改檢查表");
  const db = await getDb();
  await ordersCol(db).updateOne(
    { _id: order._id, "workOrder.checklist.id": itemId },
    { $set: { "workOrder.checklist.$.done": done, "workOrder.checklist.$.doneAt": done ? new Date() : null, updatedAt: new Date() } },
  );
  refresh();
  return { ok: true };
}

const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** 上傳實拍照片（出貨前或送達），檔案存到 Vercel Blob */
export async function uploadPhoto(formData: FormData): Promise<Result> {
  const user = await getCurrentUser();
  const orderId = String(formData.get("orderId") ?? "");
  const kind = formData.get("kind") === "delivery" ? "delivery" : "pre_ship";
  const file = formData.get("file");
  const order = await load(orderId);
  if (!order || !ownsWork(user, order)) return fail("沒有權限");
  if (!(file instanceof File) || !PHOTO_TYPES.has(file.type)) return fail("請上傳 JPG、PNG 或 WebP 照片");
  if (file.size > 2.5 * 1024 * 1024) return fail("照片太大，請重新拍攝");
  const allowed = kind === "pre_ship" ? ["accepted", "photo_rejected"] : ["out_for_delivery"];
  if (!allowed.includes(order.status)) return fail("目前無法上傳這類照片");
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const blob = await put(`orders/${order.orderNo}/${kind}-${Date.now()}.${ext}`, file, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: true,
  });
  const db = await getDb();
  await ordersCol(db).updateOne(
    { _id: order._id },
    {
      $push: { "workOrder.photos": { url: blob.url, kind, uploadedAt: new Date(), by: user.name } },
      $set: { updatedAt: new Date() },
    },
  );
  refresh();
  return { ok: true };
}

export async function removePhoto(orderId: string, url: string): Promise<Result> {
  const user = await getCurrentUser();
  const order = await load(orderId);
  if (!order || !ownsWork(user, order)) return fail("沒有權限");
  if (!["accepted", "photo_rejected", "out_for_delivery"].includes(order.status)) return fail("目前無法刪除照片");
  const db = await getDb();
  await ordersCol(db).updateOne({ _id: order._id }, { $pull: { "workOrder.photos": { url } } });
  refresh();
  return { ok: true };
}

/** 送出 Photo-Check：檢查表全部完成，且至少 2 張出貨前實拍 */
export async function submitPhotoCheck(orderId: string): Promise<Result> {
  const user = await getCurrentUser();
  const order = await load(orderId);
  if (!order?.workOrder || !ownsWork(user, order)) return fail("沒有權限");
  const w = order.workOrder;
  if (w.checklist.some((c) => !c.done)) return fail("出貨前檢查表尚未全部完成");
  if (w.photos.filter((p) => p.kind === "pre_ship").length < 2) return fail("請至少上傳 2 張出貨前實拍（正面、側面）");
  const ok = await transition(order, ["accepted", "photo_rejected"], "photo_submitted", user, {}, "已送出出貨前實拍，等待審核");
  if (!ok) return fail("訂單狀態已變更，請重新整理");
  refresh();
  return { ok: true };
}

export async function dispatchOrder(orderId: string): Promise<Result> {
  const user = await getCurrentUser();
  const order = await load(orderId);
  if (!order || !ownsWork(user, order)) return fail("沒有權限");
  const ok = await transition(order, ["approved"], "out_for_delivery", user, {}, order.kind === "gift" ? "專車出發" : "冷鏈宅配出貨");
  if (!ok) return fail("實拍核對通過後才能出貨");
  refresh();
  return { ok: true };
}

export async function markDelivered(orderId: string): Promise<Result> {
  const user = await getCurrentUser();
  const order = await load(orderId);
  if (!order?.workOrder || !ownsWork(user, order)) return fail("沒有權限");
  if (order.kind === "gift" && !order.workOrder.photos.some((p) => p.kind === "delivery"))
    return fail("請先上傳一張送達照片");
  const ok = await transition(order, ["out_for_delivery"], "delivered", user, {}, "已送達");
  if (!ok) return fail("訂單狀態已變更，請重新整理");
  refresh();
  return { ok: true };
}
