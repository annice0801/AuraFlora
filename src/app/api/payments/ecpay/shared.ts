import { verifyCallback } from "@/lib/ecpay";
import { getDb } from "@/lib/mongodb";
import { confirmPayment } from "@/lib/orders";

/** 解析並驗證綠界回傳，成功時把訂單標記為已付款 */
export async function handleEcpay(req: Request) {
  const form = await req.formData();
  const params = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
  if (!verifyCallback(params)) return { ok: false as const, order: null };
  const db = await getDb();
  const order = await confirmPayment(db, {
    merchantTradeNo: params.MerchantTradeNo,
    rtnCode: params.RtnCode,
    tradeNo: params.TradeNo,
    amount: params.TradeAmt ? Number(params.TradeAmt) : undefined,
    method: params.PaymentType,
  });
  return { ok: true as const, order, rtnCode: params.RtnCode, message: params.RtnMsg };
}
