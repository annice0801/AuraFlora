import { put } from "@vercel/blob";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/session";
import { getFlowers } from "@/lib/flora/getFlowers";
import { STYLES } from "@/data/flowers";
import { VASES, type Placement } from "@/lib/flora/physics";

const MAX_BYTES = 3 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = { "image/webp": "webp", "image/png": "png" };

const bad = (error: string, status = 400) => Response.json({ error }, { status });
const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
const isHex = (s: unknown): s is string => typeof s === "string" && /^#[0-9a-f]{6}$/i.test(s);

/** 儲存配方卡：圖片存 Vercel Blob，配方資料存 MongoDB */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return bad("請先登入", 401);
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad("請以 multipart/form-data 上傳");
  }
  const image = form.get("image");
  if (!(image instanceof File)) return bad("缺少配方卡圖片");
  const ext = IMAGE_TYPES[image.type];
  if (!ext) return bad("圖片格式只接受 WebP 或 PNG");
  if (image.size > MAX_BYTES) return bad("圖片太大（上限 3MB）");

  let data: {
    title?: unknown;
    style?: unknown;
    vase?: unknown;
    palette?: unknown;
    placements?: unknown;
  };
  try {
    data = JSON.parse(String(form.get("data") ?? ""));
  } catch {
    return bad("配方資料格式錯誤");
  }

  const flowers = await getFlowers();
  const slugs = new Set(flowers.map((f) => f.slug));
  const vase = VASES.find((v) => v.id === data.vase);
  if (!vase) return bad("未知的花器");
  if (!STYLES.some((s) => s.id === data.style)) return bad("未知的風格");
  if (typeof data.title !== "string" || data.title.length > 60) return bad("標題格式錯誤");
  if (!Array.isArray(data.placements) || data.placements.length === 0 || data.placements.length > 80)
    return bad("花材數量需介於 1 到 80 枝");
  const placements: Placement[] = [];
  for (const raw of data.placements as Placement[]) {
    if (
      !raw ||
      !slugs.has(raw.slug) ||
      !Array.isArray(raw.anchor) ||
      !Array.isArray(raw.lean) ||
      ![...raw.anchor, ...raw.lean, raw.scale, raw.spin].every(finite)
    )
      return bad("花材擺放資料錯誤");
    placements.push({
      id: String(raw.id).slice(0, 64),
      slug: raw.slug,
      anchor: [raw.anchor[0], raw.anchor[1]],
      lean: [raw.lean[0], raw.lean[1]],
      scale: raw.scale,
      spin: raw.spin,
    });
  }
  const palette = Array.isArray(data.palette)
    ? (data.palette as { color: unknown; name: unknown }[])
        .filter((p) => isHex(p?.color) && typeof p?.name === "string")
        .slice(0, 8)
        .map((p) => ({ color: p.color as string, name: (p.name as string).slice(0, 20) }))
    : [];

  const _id = new ObjectId();
  const blob = await put(`recipes/${_id.toHexString()}.${ext}`, image, {
    access: "public",
    contentType: image.type,
    addRandomSuffix: false,
  });

  const db = await getDb();
  await db.collection("recipes").insertOne({
    _id,
    userId: user.id,
    title: data.title,
    style: data.style,
    vase: vase.id,
    palette,
    placements,
    flowerCounts: placements.reduce<Record<string, number>>((acc, p) => {
      acc[p.slug] = (acc[p.slug] ?? 0) + 1;
      return acc;
    }, {}),
    imageUrl: blob.url,
    createdAt: new Date(),
  });

  return Response.json({ id: _id.toHexString(), imageUrl: blob.url }, { status: 201 });
}
