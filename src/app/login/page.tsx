import type { Metadata } from "next";
import { Suspense } from "react";
import { Flower2, Lock, Sparkles, Wand2 } from "lucide-react";
import { enabledProviders } from "@/lib/auth";
import LoginButtons from "@/components/auth/LoginButtons";
import FloraCutout from "@/components/motion/FloraCutout";

export const metadata: Metadata = { title: "會員登入" };

const PERKS = [
  { icon: Wand2, text: "使用 3D 互動花室，生成專屬美學配方卡" },
  { icon: Lock, text: "解鎖風格策展的「花材黃金比例清單」" },
  { icon: Sparkles, text: "觀看花藝師示範，一步一步跟著插" },
];

export default function LoginPage() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-x-clip px-4 py-16">
      <FloraCutout name="peony" width="min(90vw, 720px)" speed={-0.12} rotate={6} tilt={-18} className="top-[8%] -left-[30%] opacity-90 md:-left-[6%]" priority />
      <FloraCutout name="snowWillow" width="min(80vw, 640px)" speed={0.15} rotate={-6} tilt={160} shadow={false} className="-right-[30%] bottom-[6%] opacity-70 md:-right-[4%]" />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-line bg-surface/90 p-8 shadow-sm backdrop-blur">
        <Flower2 className="size-8 text-rose" aria-hidden />
        <h1 className="mt-4 font-serif text-2xl font-bold">登入 AuraFlora</h1>
        <p className="mt-1 text-sm text-muted">不需要另外註冊，使用常用的帳號即可。</p>
        <ul className="mt-6 space-y-2.5">
          {PERKS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-2 text-sm">
              <Icon className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden />
              {text}
            </li>
          ))}
        </ul>
        <Suspense fallback={<div className="mt-8 h-28" />}>
          <LoginButtons providers={enabledProviders} />
        </Suspense>
        <p className="mt-6 text-xs leading-relaxed text-muted">
          登入即表示你同意我們以你的姓名、Email 與頭像建立會員資料，僅用於登入與保存你的作品。
        </p>
      </div>
    </main>
  );
}
