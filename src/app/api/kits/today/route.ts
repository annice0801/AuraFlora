import { getDb } from "@/lib/mongodb";
import { getDrop, msUntilTaipeiMidnight, releaseExpiredKits, taipeiDate } from "@/lib/orders";
import { WEEKLY_KIT } from "@/data/gifts";

/** 今日與明日的限量份額（首頁的動態庫存計數器每 15 秒查詢一次） */
export async function GET() {
  const db = await getDb();
  await releaseExpiredKits(db);
  const [today, tomorrow] = await Promise.all([getDrop(db, taipeiDate(0)), getDrop(db, taipeiDate(1))]);
  return Response.json(
    {
      kit: { title: WEEKLY_KIT.title, description: WEEKLY_KIT.description, priceTwd: WEEKLY_KIT.priceTwd },
      today,
      tomorrow,
      msUntilTomorrow: msUntilTaipeiMidnight(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
