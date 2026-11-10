import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/session";
import { buildCheckout } from "@/lib/ecpay";
import { holdUntil, newMerchantTradeNo, ordersCol, releaseExpiredKits } from "@/lib/orders";

/** 重新前往付款（綠界每次付款都需要新的 MerchantTradeNo） */
export async function POST(req: Request, ctx: RouteContext<"/api/orders/[id]/checkout">) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "請先登入" }, { status: 401 });
  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return Response.json({ error: "訂單編號錯誤" }, { status: 400 });
  const db = await getDb();
  await releaseExpiredKits(db);
  const order = await ordersCol(db).findOne({ _id: new ObjectId(id), userId: user.id });
  if (!order) return Response.json({ error: "找不到訂單" }, { status: 404 });
  if (order.status !== "pending_payment")
    return Response.json({ error: order.status === "expired" ? "付款期限已過，名額已釋出，請重新下單" : "這筆訂單不需要付款" }, { status: 409 });
  const merchantTradeNo = newMerchantTradeNo();
  await ordersCol(db).updateOne(
    { _id: order._id },
    {
      $push: { "payment.merchantTradeNos": merchantTradeNo },
      $set: { updatedAt: new Date(), ...(order.kind === "kit" && order.item.source === "weekly" ? { reservedUntil: holdUntil() } : {}) },
    },
  );
  const checkout = buildCheckout({
    merchantTradeNo,
    amount: order.amountTwd,
    itemName: `AuraFlora ${order.title} x1`,
    tradeDesc: order.kind === "gift" ? "AuraFlora 禮贈花禮" : "AuraFlora 花材包",
    origin: new URL(req.url).origin,
    orderId: id,
  });
  return Response.json({ checkout });
}
