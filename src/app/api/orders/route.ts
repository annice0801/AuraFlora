import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/session";
import { getGiftProduct } from "@/lib/flora/getGifts";
import { buildCheckout } from "@/lib/ecpay";
import { RECIPE_KIT_PRICE, SERVICE_AREAS, TIME_SLOTS, WEEKLY_KIT } from "@/data/gifts";
import {
  holdUntil,
  newMerchantTradeNo,
  ordersCol,
  releaseExpiredKits,
  reserveDrop,
  taipeiDate,
  type OrderDoc,
} from "@/lib/orders";

const phone = z.string().trim().regex(/^(09\d{8}|0\d{1,2}-?\d{6,8}(#\d{1,6})?)$/, "電話格式不正確");
const text = (max: number) => z.string().trim().min(1).max(max);

const recipient = z
  .object({
    name: text(30),
    phone,
    city: z.string(),
    district: z.string(),
    address: text(120),
  })
  .refine((r) => SERVICE_AREAS[r.city]?.includes(r.district), { message: "目前不在配送範圍內", path: ["district"] });

const buyer = z.object({
  name: text(30),
  phone,
  email: z.email().max(120),
  company: z.string().trim().max(60).optional(),
  taxId: z
    .string()
    .trim()
    .regex(/^(\d{8})?$/, "統一編號為 8 碼數字")
    .optional(),
});

const giftSchema = z.object({
  kind: z.literal("gift"),
  productSlug: z.string().regex(/^[a-z0-9-]{1,64}$/),
  tierId: z.string().max(20),
  buyer,
  recipient,
  delivery: z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), slot: z.enum(TIME_SLOTS) }),
  card: z
    .object({ to: z.string().trim().max(20), message: z.string().trim().max(120), from: z.string().trim().max(20) })
    .optional(),
  note: z.string().trim().max(300).optional(),
});

const kitSchema = z.object({
  kind: z.literal("kit"),
  source: z.enum(["weekly", "recipe"]),
  recipeId: z.string().optional(),
  /** weekly：0 = 今天的份額，1 = 預訂明天 */
  dropOffset: z.union([z.literal(0), z.literal(1)]).optional(),
  buyer,
  recipient,
  note: z.string().trim().max(300).optional(),
});

const schema = z.discriminatedUnion("kind", [giftSchema, kitSchema]);

const err = (error: string, status = 400) => Response.json({ error }, { status });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return err("請先登入", 401);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "資料格式錯誤");
  const input = parsed.data;
  const db = await getDb();
  const now = new Date();
  const _id = new ObjectId();
  const merchantTradeNo = newMerchantTradeNo();
  let doc: OrderDoc;

  if (input.kind === "gift") {
    const product = await getGiftProduct(input.productSlug);
    if (!product) return err("找不到這個商品", 404);
    const tier = product.tiers.find((t) => t.id === input.tierId);
    if (!tier) return err("請選擇方案");
    const earliest = taipeiDate(product.leadDays);
    if (input.delivery.date < earliest || input.delivery.date > taipeiDate(60))
      return err(`最早可配送日期為 ${earliest}`);
    doc = {
      _id,
      orderNo: merchantTradeNo,
      userId: user.id,
      kind: "gift",
      title: `${product.name}（${tier.name}）`,
      item: {
        slug: product.slug,
        name: product.name,
        tierId: tier.id,
        tierName: tier.name,
        spec: tier.spec,
        occasion: product.occasion,
        imageUrl: product.image.url,
      },
      amountTwd: tier.priceTwd,
      buyer: input.buyer,
      recipient: input.recipient,
      delivery: input.delivery,
      card: input.card && (input.card.message || input.card.to) ? input.card : undefined,
      note: input.note || undefined,
      status: "pending_payment",
      payment: { provider: "ecpay", merchantTradeNos: [merchantTradeNo] },
      timeline: [{ status: "pending_payment", at: now, by: user.id }],
      createdAt: now,
      updatedAt: now,
    };
  } else {
    let recipeTitle = WEEKLY_KIT.title;
    let dropDate: string | undefined;
    if (input.source === "weekly") {
      await releaseExpiredKits(db);
      dropDate = taipeiDate(input.dropOffset ?? 0);
      if (!(await reserveDrop(db, dropDate)))
        return err(input.dropOffset ? "明天的份額也已售罄" : "今日份額已售罄，請預訂明天的時令花盒", 409);
    } else {
      if (!input.recipeId || !ObjectId.isValid(input.recipeId)) return err("缺少配方卡");
      const recipe = await db
        .collection("recipes")
        .findOne({ _id: new ObjectId(input.recipeId), userId: user.id }, { projection: { title: 1 } });
      if (!recipe) return err("找不到你的配方卡", 404);
      recipeTitle = recipe.title as string;
    }
    // 冷鏈宅配：出貨日隔天送達
    const shipDate = dropDate ?? taipeiDate(1);
    const deliveryDate = taipeiDate(1, new Date(`${shipDate}T12:00:00+08:00`));
    doc = {
      _id,
      orderNo: merchantTradeNo,
      userId: user.id,
      kind: "kit",
      title: `${input.source === "weekly" ? "時令花材包" : "配方花材包"}・${recipeTitle}`,
      item: {
        slug: input.source === "weekly" ? WEEKLY_KIT.slug : "recipe-kit",
        name: recipeTitle,
        source: input.source,
        recipeId: input.recipeId,
        dropDate,
        stems: input.source === "weekly" ? WEEKLY_KIT.stems : undefined,
      },
      amountTwd: input.source === "weekly" ? WEEKLY_KIT.priceTwd : RECIPE_KIT_PRICE,
      buyer: input.buyer,
      recipient: input.recipient,
      delivery: { date: deliveryDate, slot: "冷鏈宅配 09:00–18:00" },
      note: input.note || undefined,
      status: "pending_payment",
      reservedUntil: input.source === "weekly" ? holdUntil() : undefined,
      payment: { provider: "ecpay", merchantTradeNos: [merchantTradeNo] },
      timeline: [{ status: "pending_payment", at: now, by: user.id }],
      createdAt: now,
      updatedAt: now,
    };
  }

  await ordersCol(db).insertOne(doc);
  // 記住聯絡資料，下次一鍵結帳時自動帶入
  await db
    .collection("user_profiles")
    .updateOne({ userId: user.id }, { $set: { buyer: input.buyer, recipient: input.recipient, updatedAt: now } }, { upsert: true });

  const checkout = buildCheckout({
    merchantTradeNo,
    amount: doc.amountTwd,
    itemName: `AuraFlora ${doc.title} x1`,
    tradeDesc: doc.kind === "gift" ? "AuraFlora 禮贈花禮" : "AuraFlora 花材包",
    origin: new URL(req.url).origin,
    orderId: _id.toHexString(),
  });
  return Response.json({ orderId: _id.toHexString(), orderNo: merchantTradeNo, checkout }, { status: 201 });
}
