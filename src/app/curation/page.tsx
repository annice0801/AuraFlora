import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import Curation from "@/components/curation/Curation";
import FloraCutout from "@/components/motion/FloraCutout";
import { getInspirations } from "@/lib/flora/getInspirations";
import { getPalettes } from "@/lib/flora/getPalettes";
import ColorStories from "@/components/curation/ColorStories";

export const metadata: Metadata = {
  title: "風格策展",
  description: "依風格流派、生活場景與季節活動瀏覽花藝實景靈感；會員可解鎖每件作品的花材黃金比例清單。",
};

async function CurationWithData() {
  const [items, palettes] = await Promise.all([getInspirations(), getPalettes()]);
  return (
    <>
      <ColorStories palettes={palettes} />
      <div className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
        <p className="text-xs tracking-[0.3em] text-muted uppercase">Inspiration Library</p>
        <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">場景靈感庫</h2>
      </div>
      <Curation items={items} />
    </>
  );
}

export default function CurationPage() {
  return (
    <main className="flex-1 overflow-x-clip">
      <section className="relative mx-auto max-w-6xl px-4 pt-12 pb-8 sm:px-6 sm:pt-16">
        <FloraCutout name="eucalyptus" width="min(70vw, 620px)" speed={-0.2} rotate={-6} tilt={-24} shadow={false} className="top-[4%] -right-[30%] opacity-80 md:-right-[8%]" priority />
        <p className="relative z-10 text-xs tracking-[0.3em] text-rose uppercase">Style Curation</p>
        <h1 className="relative z-10 mt-2 font-serif text-4xl font-bold sm:text-5xl">風格策展</h1>
        <p className="relative z-10 mt-3 max-w-2xl leading-relaxed text-muted">
          同樣是花，放在玄關、餐桌或床頭，要的高度與份量完全不同。從風格、場景或節慶出發，找到適合你生活的那一瓶。
        </p>
      </section>
      <Suspense
        fallback={
          <div className="flex h-60 items-center justify-center text-sm text-muted">
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            載入靈感中…
          </div>
        }
      >
        <CurationWithData />
      </Suspense>
    </main>
  );
}
