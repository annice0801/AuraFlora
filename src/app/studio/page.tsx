import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import Studio from "@/components/studio/Studio";
import { getFlowers } from "@/lib/flora/getFlowers";
import { getDemos } from "@/lib/flora/getDemos";
import { requireUser } from "@/lib/session";
import FloraCutout from "@/components/motion/FloraCutout";

export const metadata: Metadata = {
  title: "互動花室",
  description: "在瀏覽器裡用 3D 模擬插花：挑選花器、四層花材、配角提示，生成你的美學配方卡。",
};

// 互動花室僅限會員：未登入會導向登入頁，登入後回到這裡
async function StudioWithData() {
  await requireUser("/studio");
  const [flowers, demos] = await Promise.all([getFlowers(), getDemos()]);
  return <Studio flowers={flowers} demos={demos} />;
}

export default function StudioPage() {
  return (
    <main className="flex-1 overflow-x-clip">
      <div className="relative mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <FloraCutout name="tulip" width="min(46vw, 380px)" speed={-0.15} rotate={-6} tilt={-12} className="-top-[30%] -right-[18%] hidden opacity-90 sm:block md:right-0" />
        <p className="relative z-10 text-xs tracking-[0.3em] text-rose uppercase">Interactive Flower Room</p>
        <h1 className="relative z-10 mt-1 font-serif text-3xl font-bold">互動花室</h1>
        <p className="relative z-10 mt-1 text-sm text-muted">
          選一個花器，依「骨架 → 主花 → 配花 → 填充」的順序把花插進瓶口，完成後生成專屬的美學配方卡。
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex h-[60vh] items-center justify-center text-sm text-muted">
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            載入花材中…
          </div>
        }
      >
        <StudioWithData />
      </Suspense>
    </main>
  );
}
