import { handleEcpay } from "../shared";

/** 綠界伺服器對伺服器的付款通知（ReturnURL），必須回應 1|OK */
export async function POST(req: Request) {
  const { ok } = await handleEcpay(req);
  return new Response(ok ? "1|OK" : "0|CheckMacValue Error", { headers: { "Content-Type": "text/plain" } });
}
