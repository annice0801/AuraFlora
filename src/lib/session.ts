import "server-only";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "./auth";

export type Role = "admin" | "florist" | "member";
export type CurrentUser = { id: string; name: string; email: string; image: string | null; role: Role };

export const owners = () =>
  (process.env.OWNER_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

/** 讀取目前登入的會員（未登入回傳 null）。會讀取 request header，請放在 Suspense 內或 API route 中呼叫 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const u = session.user as typeof session.user & { role?: string; banned?: boolean };
  const isOwner = owners().includes(u.email.toLowerCase());
  // 停權的會員即使還有快取的登入 cookie 也視為未登入
  if (u.banned && !isOwner) return null;
  const role: Role = isOwner || u.role === "admin" ? "admin" : u.role === "florist" ? "florist" : "member";
  return { id: u.id, name: u.name, email: u.email, image: u.image ?? null, role };
}

/** 只允許站內相對路徑，避免登入後被導向外部網站 */
export function safeNext(next: string | null | undefined, fallback = "/") {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

/** 頁面需要登入：未登入時導向登入頁，登入後回到原頁 */
export async function requireUser(next: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(safeNext(next))}`);
  return user;
}

/** 限定角色的頁面：未登入導向登入頁，角色不符回傳 404（不透露後台存在） */
export async function requireRole(roles: Role[], next: string): Promise<CurrentUser> {
  const user = await requireUser(next);
  if (!roles.includes(user.role)) notFound();
  return user;
}
