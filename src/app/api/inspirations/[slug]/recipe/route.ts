import { getCurrentUser } from "@/lib/session";
import { getGoldenRecipe } from "@/lib/flora/getInspirations";

/** 會員限定的花材黃金比例清單；未登入回傳 401，內容不會出現在公開頁面的 HTML 中 */
export async function GET(_req: Request, ctx: RouteContext<"/api/inspirations/[slug]/recipe">) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "請先登入會員" }, { status: 401 });
  const { slug } = await ctx.params;
  if (!/^[a-z0-9-]{1,64}$/.test(slug)) return Response.json({ error: "格式錯誤" }, { status: 400 });
  const recipe = await getGoldenRecipe(slug);
  if (!recipe) return Response.json({ error: "找不到這份清單" }, { status: 404 });
  return Response.json(recipe, { headers: { "Cache-Control": "private, no-store" } });
}
