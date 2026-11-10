"use server";

import { refresh } from "next/cache";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getCurrentUser, owners, type Role } from "@/lib/session";
import { writeAudit } from "@/lib/users";

type Result = { ok: true } | { ok: false; error: string };
const ROLE_NAME: Record<Role, string> = { member: "一般會員", florist: "合作花店", admin: "管理員" };

/** 共用檢查：只有管理員能操作；擁有者（OWNER_EMAILS）與自己不能被修改 */
async function guard(userId: string) {
  const actor = await getCurrentUser();
  if (actor?.role !== "admin") return { error: "沒有權限" } as const;
  if (!ObjectId.isValid(userId)) return { error: "會員編號錯誤" } as const;
  if (userId === actor.id) return { error: "不能修改自己的帳號" } as const;
  const db = await getDb();
  const target = await db.collection("user").findOne({ _id: new ObjectId(userId) });
  if (!target) return { error: "找不到這位會員" } as const;
  if (owners().includes(String(target.email).toLowerCase())) return { error: "擁有者帳號由 OWNER_EMAILS 設定，無法在後台修改" } as const;
  return { actor, db, target } as const;
}

export async function setUserRole(userId: string, role: Role): Promise<Result> {
  if (!["member", "florist", "admin"].includes(role)) return { ok: false, error: "未知的角色" };
  const g = await guard(userId);
  if ("error" in g) return { ok: false, error: g.error! };
  const { actor, db, target } = g;
  const before = (target.role as Role) ?? "member";
  if (before === role) return { ok: true };
  await db.collection("user").updateOne({ _id: target._id }, { $set: { role, updatedAt: new Date() } });
  // 角色存在 session 快取中，強制重新登入讓新權限立即生效
  await db.collection("session").deleteMany({ userId: target._id });
  await writeAudit(db, {
    at: new Date(),
    actor: actor.name,
    target: `${target.name}（${target.email}）`,
    action: "變更角色",
    detail: `${ROLE_NAME[before] ?? before} → ${ROLE_NAME[role]}`,
  });
  refresh();
  return { ok: true };
}

export async function setBanned(userId: string, banned: boolean, reason = ""): Promise<Result> {
  const g = await guard(userId);
  if ("error" in g) return { ok: false, error: g.error! };
  const { actor, db, target } = g;
  await db
    .collection("user")
    .updateOne({ _id: target._id }, { $set: { banned, banReason: banned ? reason.trim() || null : null, updatedAt: new Date() } });
  if (banned) await db.collection("session").deleteMany({ userId: target._id });
  await writeAudit(db, {
    at: new Date(),
    actor: actor.name,
    target: `${target.name}（${target.email}）`,
    action: banned ? "停權" : "解除停權",
    detail: reason.trim() || undefined,
  });
  refresh();
  return { ok: true };
}

export async function revokeSessions(userId: string): Promise<Result> {
  const g = await guard(userId);
  if ("error" in g) return { ok: false, error: g.error! };
  const { actor, db, target } = g;
  const res = await db.collection("session").deleteMany({ userId: target._id });
  await writeAudit(db, {
    at: new Date(),
    actor: actor.name,
    target: `${target.name}（${target.email}）`,
    action: "強制登出",
    detail: `${res.deletedCount} 個裝置`,
  });
  refresh();
  return { ok: true };
}
