import { getDb } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/session";

/** 目前會員的角色與上次的聯絡資料（一鍵結帳自動帶入） */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ user: null }, { headers: { "Cache-Control": "no-store" } });
  const db = await getDb();
  const profile = await db.collection("user_profiles").findOne({ userId: user.id }, { projection: { _id: 0, buyer: 1, recipient: 1 } });
  return Response.json(
    { user: { name: user.name, email: user.email, role: user.role }, lastContact: profile ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
