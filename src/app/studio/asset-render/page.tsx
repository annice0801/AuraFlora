import { notFound } from "next/navigation";
import AssetRenderer from "@/components/studio/AssetRenderer";

// 僅供開發時使用：scripts/render-cutouts.mjs 會用無頭 Chrome 開啟此頁，把 3D 花材渲染成去背 PNG
export default function AssetRenderPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <AssetRenderer />;
}
