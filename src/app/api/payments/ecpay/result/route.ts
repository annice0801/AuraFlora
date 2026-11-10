import { handleEcpay } from "../shared";

/** 付款完成後，綠界讓使用者瀏覽器 POST 回來（OrderResultURL），驗證後導向訂單頁 */
export async function POST(req: Request) {
  const { ok, order, rtnCode } = await handleEcpay(req);
  const origin = new URL(req.url).origin;
  if (!ok || !order) return Response.redirect(`${origin}/orders?payment=error`, 303);
  const flag = rtnCode === "1" ? "success" : "failed";
  return Response.redirect(`${origin}/orders/${order._id.toHexString()}?payment=${flag}`, 303);
}
