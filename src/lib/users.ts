import "server-only";
import type { Db } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { owners, type Role } from "@/lib/session";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: Role;
  isOwner: boolean;
  banned: boolean;
  providers: string[];
  createdAt: string;
  lastActiveAt: string | null;
  activeSessions: number;
  orderCount: number;
  paidTotal: number;
};

const PAID: string[] = ["paid", "assigned", "accepted", "photo_submitted", "photo_rejected", "approved", "out_for_delivery", "delivered"];

function latest(...dates: unknown[]) {
  const t = dates.filter(Boolean).map((d) => new Date(d as string).getTime());
  return t.length ? new Date(Math.max(...t)).toISOString() : null;
}

export async function listUsers(opts: { q?: string; role?: string } = {}): Promise<AdminUserRow[]> {
  const db = await getDb();
  const ownerList = owners();
  const filter: Record<string, unknown> = {};
  if (opts.q) {
    const rx = { $regex: opts.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const users = await db.collection("user").find(filter).sort({ createdAt: -1 }).limit(300).toArray();
  const ids = users.map((u) => u._id);
  const idStr = ids.map((i) => i.toHexString());
  const now = new Date();
  const [accounts, sessions, orders] = await Promise.all([
    db.collection("account").find({ userId: { $in: ids } }, { projection: { userId: 1, providerId: 1 } }).toArray(),
    db
      .collection("session")
      .aggregate<{ _id: unknown; last: Date; active: number }>([
        { $match: { userId: { $in: ids } } },
        {
          $group: {
            _id: "$userId",
            last: { $max: "$updatedAt" },
            active: { $sum: { $cond: [{ $gt: ["$expiresAt", now] }, 1, 0] } },
          },
        },
      ])
      .toArray(),
    db
      .collection("orders")
      .aggregate<{ _id: string; count: number; paid: number }>([
        { $match: { userId: { $in: idStr } } },
        {
          $group: {
            _id: "$userId",
            count: { $sum: 1 },
            paid: { $sum: { $cond: [{ $in: ["$status", PAID] }, "$amountTwd", 0] } },
          },
        },
      ])
      .toArray(),
  ]);
  const key = (v: unknown) => String(v);
  const prov = new Map<string, string[]>();
  for (const a of accounts) prov.set(key(a.userId), [...(prov.get(key(a.userId)) ?? []), String(a.providerId)]);
  const sess = new Map(sessions.map((s) => [key(s._id), s]));
  const ord = new Map(orders.map((o) => [o._id, o]));

  const rows = users.map((u) => {
    const id = u._id.toHexString();
    const isOwner = ownerList.includes(String(u.email).toLowerCase());
    const role: Role = isOwner || u.role === "admin" ? "admin" : u.role === "florist" ? "florist" : "member";
    const s = sess.get(id);
    return {
      id,
      name: String(u.name ?? ""),
      email: String(u.email ?? ""),
      image: (u.image as string) ?? null,
      role,
      isOwner,
      banned: Boolean(u.banned),
      providers: prov.get(id) ?? [],
      createdAt: new Date(u.createdAt).toISOString(),
      lastActiveAt: latest(s?.last, u.lastSeenAt),
      activeSessions: u.banned ? 0 : (s?.active ?? 0),
      orderCount: ord.get(id)?.count ?? 0,
      paidTotal: ord.get(id)?.paid ?? 0,
    };
  });
  return opts.role ? rows.filter((r) => (opts.role === "banned" ? r.banned : r.role === opts.role)) : rows;
}

export type AuditEntry = { at: Date; actor: string; target: string; action: string; detail?: string };

export async function writeAudit(db: Db, entry: AuditEntry) {
  await db.collection<AuditEntry>("admin_audit").insertOne(entry);
}

export async function recentAudit(limit = 20) {
  const db = await getDb();
  const list = await db.collection<AuditEntry>("admin_audit").find({}, { projection: { _id: 0 } }).sort({ at: -1 }).limit(limit).toArray();
  return list.map((a) => ({ ...a, at: a.at.toISOString() }));
}

export async function adminStats() {
  const db = await getDb();
  const since = new Date(Date.now() - 30 * 86400000);
  const [members, toDispatch, toReview, revenue] = await Promise.all([
    db.collection("user").countDocuments(),
    db.collection("orders").countDocuments({ status: "paid" }),
    db.collection("orders").countDocuments({ status: "photo_submitted" }),
    db
      .collection("orders")
      .aggregate<{ total: number; count: number }>([
        { $match: { status: { $in: PAID }, "payment.paidAt": { $gte: since } } },
        { $group: { _id: null, total: { $sum: "$amountTwd" }, count: { $sum: 1 } } },
      ])
      .toArray(),
  ]);
  return { members, toDispatch, toReview, revenue30d: revenue[0]?.total ?? 0, orders30d: revenue[0]?.count ?? 0 };
}
