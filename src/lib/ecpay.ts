import "server-only";
import crypto from "node:crypto";

// 綠界 ECPay 全方位金流（AIO）
// 文件：https://developers.ecpay.com.tw/?p=2856
// 測試環境使用綠界公開的測試商店（3002607），上線前請把 .env.local 換成正式特約商店資料並設定 ECPAY_ENV=production

const env = () => {
  const merchantId = process.env.ECPAY_MERCHANT_ID;
  const hashKey = process.env.ECPAY_HASH_KEY;
  const hashIv = process.env.ECPAY_HASH_IV;
  if (!merchantId || !hashKey || !hashIv) throw new Error("缺少綠界 ECPay 環境變數");
  const production = process.env.ECPAY_ENV === "production";
  return {
    merchantId,
    hashKey,
    hashIv,
    action: production
      ? "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5"
      : "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5",
  };
};

/** 模擬 .NET HttpUtility.UrlEncode（綠界以此規則計算檢查碼） */
function dotnetUrlEncode(s: string) {
  return encodeURIComponent(s)
    .replace(/%20/g, "+")
    .replace(/~/g, "%7e")
    .replace(/'/g, "%27");
}

export function checkMacValue(params: Record<string, string>, hashKey: string, hashIv: string) {
  const sorted = Object.keys(params)
    .filter((k) => k !== "CheckMacValue")
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const raw = dotnetUrlEncode(`HashKey=${hashKey}&${sorted}&HashIV=${hashIv}`).toLowerCase();
  return crypto.createHash("sha256").update(raw).digest("hex").toUpperCase();
}

function taipeiDateTime(d = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}/${p.month}/${p.day} ${p.hour}:${p.minute}:${p.second}`;
}

export type CheckoutForm = { action: string; fields: Record<string, string> };

/** 產生要自動送出到綠界付款頁的表單欄位 */
export function buildCheckout(opts: {
  merchantTradeNo: string;
  amount: number;
  itemName: string;
  tradeDesc: string;
  origin: string;
  orderId: string;
}): CheckoutForm {
  const { merchantId, hashKey, hashIv, action } = env();
  const fields: Record<string, string> = {
    MerchantID: merchantId,
    MerchantTradeNo: opts.merchantTradeNo,
    MerchantTradeDate: taipeiDateTime(),
    PaymentType: "aio",
    TotalAmount: String(Math.round(opts.amount)),
    TradeDesc: opts.tradeDesc.slice(0, 200),
    ItemName: opts.itemName.slice(0, 200),
    // 伺服器對伺服器的付款通知（需公開網址；本機開發時綠界無法呼叫，改由 OrderResultURL 處理）
    ReturnURL: `${opts.origin}/api/payments/ecpay/notify`,
    // 付款完成後，綠界讓使用者的瀏覽器帶著結果回到這裡
    OrderResultURL: `${opts.origin}/api/payments/ecpay/result`,
    ClientBackURL: `${opts.origin}/orders/${opts.orderId}`,
    ChoosePayment: "ALL",
    IgnorePayment: "BARCODE#WebATM",
    EncryptType: "1",
    NeedExtraPaidInfo: "N",
  };
  fields.CheckMacValue = checkMacValue(fields, hashKey, hashIv);
  return { action, fields };
}

/** 驗證綠界回傳的資料是否被竄改 */
export function verifyCallback(params: Record<string, string>) {
  const { hashKey, hashIv, merchantId } = env();
  if (params.MerchantID !== merchantId) return false;
  const expected = checkMacValue(params, hashKey, hashIv);
  const got = params.CheckMacValue ?? "";
  return expected.length === got.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(got));
}
