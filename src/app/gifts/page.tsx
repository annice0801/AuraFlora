import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Building2 } from "lucide-react";
import { OCCASIONS } from "@/data/gifts";
import { getGiftProducts } from "@/lib/flora/getGifts";
import QualityBadges from "@/components/gifts/QualityBadges";
import LimitedKitCard from "@/components/kits/LimitedKitCard";
import FloraCutout from "@/components/motion/FloraCutout";
import ParallaxImage from "@/components/motion/ParallaxImage";
import Reveal from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "自用送禮",
  description:
    "自用：每日限量的時令 DIY 花材包，工作室冷鏈出貨。送禮：生日、開幕、紀念日花禮，線上預約、代寫手寫感卡片，特約花店製作並經出貨前實拍核對。",
};

const FLOW = ["選擇情境與方案", "填寫預約表單並付款", "特約花店依配方卡製作", "出貨前實拍核對", "專車避震配送"];

export default async function GiftsPage() {
  const products = await getGiftProducts();
  const cover = products.find((p) => p.slug === "anniversary-noir-roses")?.image;

  const modes = [
    {
      id: "self",
      tag: "For Yourself",
      title: "自用・每日限量花材包",
      price: "NT$ 890",
      points: ["週末放鬆、居家佈置", "時令配方，每天限量供應", "工作室冷鏈統一出貨・隔天送達"],
      cta: "預訂今日花盒",
    },
    {
      id: "gift",
      tag: "For Someone",
      title: "送禮・代客送花",
      price: "NT$ 2,500 起",
      points: ["生日、開幕、情人節、紀念日", "代寫手寫感卡片，指定送達時段", "轉單在地特約花店，專車配送"],
      cta: "預約送花",
    },
  ];

  return (
    <main className="flex-1 overflow-x-clip">
      {/* ── 標題 ── */}
      <section className="relative">
        <FloraCutout name="peony" width="min(80vw, 640px)" speed={-0.18} rotate={8} tilt={-160} className="-top-[10%] -right-[30%] md:-right-[6%]" priority />
        <div className="relative z-10 mx-auto max-w-6xl px-4 pt-14 pb-12 sm:px-6 sm:pt-24 sm:pb-16">
          <Reveal>
            <p className="text-xs tracking-[0.3em] text-rose uppercase">Shop &amp; Gifting</p>
            <h1 className="mt-3 font-serif text-5xl font-bold sm:text-7xl">自用送禮</h1>
            <p className="mt-5 max-w-lg leading-relaxed text-muted">
              給自己的，是每天限量的一盒時令花材；給重要的人的，是準時送達、出貨前就能確認的一份心意。
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── 兩種方式（簡潔對照） ── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-5 md:grid-cols-2">
          {modes.map((m, i) => (
            <Reveal key={m.id} delay={i * 120}>
              <a href={`#${m.id}`} className="group block overflow-hidden rounded-[2rem] border border-line bg-surface">
                {m.id === "self" ? (
                  <div className="relative aspect-[16/10] overflow-hidden bg-[radial-gradient(90%_80%_at_30%_20%,#f3f5ee,#d6dfcb)]">
                    <FloraCutout name="chamomile" width="88%" speed={-0.1} rotate={6} tilt={-14} className="top-[16%] left-[6%]" />
                  </div>
                ) : cover ? (
                  <ParallaxImage src={cover.url!} alt={cover.alt} sizes="(min-width: 768px) 560px, 100vw" className="aspect-[16/10]" />
                ) : null}
                <div className="p-6 sm:p-8">
                  <p className="text-[11px] tracking-[0.3em] text-muted uppercase">{m.tag}</p>
                  <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-serif text-2xl font-bold sm:text-3xl">{m.title}</h2>
                    <span className="font-serif text-xl text-rose">{m.price}</span>
                  </div>
                  <ul className="mt-5 space-y-2 border-t border-line pt-5 text-sm text-muted">
                    {m.points.map((p) => (
                      <li key={p} className="flex items-center gap-3">
                        <span className="h-px w-4 bg-rose/60" />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-6 inline-flex items-center gap-2 border-b border-foreground pb-1 text-sm font-medium">
                    {m.cta}
                    <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden />
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 自用 ── */}
      <section id="self" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-24 sm:px-6 sm:pt-32">
        <Reveal>
          <p className="text-xs tracking-[0.3em] text-muted uppercase">For Yourself</p>
          <h2 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">自用・每日限量花材包</h2>
          <p className="mt-3 max-w-xl text-muted">每週一個時令配方，附花器尺寸建議與插花步驟卡。限量份數每天 00:00 重新開放。</p>
        </Reveal>
        <div className="mt-8">
          <LimitedKitCard />
        </div>
        <Link
          href="/studio"
          className="group mt-5 flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-6 py-5 transition hover:border-rose/40"
        >
          <span>
            <span className="block font-medium">想用自己的配方？</span>
            <span className="text-sm text-muted">在互動花室插完一瓶，生成配方卡後就能一鍵買下同款真實花材（NT$ 890）。</span>
          </span>
          <ArrowUpRight className="size-5 shrink-0 text-rose transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </section>

      {/* ── 送禮 ── */}
      <section id="gift" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-24 sm:px-6 sm:pt-32">
        <Reveal>
          <p className="text-xs tracking-[0.3em] text-muted uppercase">For Someone</p>
          <h2 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">送禮・代客送花</h2>
          <p className="mt-3 max-w-xl text-muted">告訴我們情境、時間與想說的話，其餘交給配送管家：在地特約花店依規格化配方製作，出貨前拍照讓你確認。</p>
        </Reveal>
        <nav className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="送花情境">
          {OCCASIONS.map((o) => (
            <a key={o.id} href={`#${o.id}`} className="group rounded-2xl border border-line bg-surface p-5 transition hover:border-rose/50">
              <p className="font-serif text-lg font-bold group-hover:text-rose">{o.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{o.caption}</p>
              <p className="mt-3 text-sm text-rose">NT$ {o.from.toLocaleString()} 起</p>
            </a>
          ))}
        </nav>
      </section>

      <section id="quality" className="mt-16 scroll-mt-20 border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h3 className="font-serif text-xl font-bold">品質履約承諾</h3>
          <div className="mt-5">
            <QualityBadges />
          </div>
          <ol className="mt-8 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
            {FLOW.map((f, i) => (
              <li key={f} className="flex items-center gap-2 rounded-xl bg-background px-3 py-2.5">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-rose text-xs text-white">{i + 1}</span>
                {f}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {OCCASIONS.map((o) => {
        const list = products.filter((p) => p.occasion === o.id);
        return (
          <section key={o.id} id={o.id} className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6">
            <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
              <div>
                <h3 className="font-serif text-2xl font-bold">{o.name}</h3>
                <p className="mt-1 text-sm text-muted">{o.caption}</p>
              </div>
              {o.id === "exhibition" && (
                <span className="hidden items-center gap-1 text-xs text-muted sm:flex">
                  <Building2 className="size-4" aria-hidden />
                  企業客戶可開立統一編號
                </span>
              )}
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {list.map((p) => (
                <Link key={p.slug} href={`/gifts/${p.slug}`} className="group grid overflow-hidden rounded-3xl border border-line bg-surface sm:grid-cols-2">
                  <div className="relative aspect-[4/3] overflow-hidden sm:aspect-auto sm:min-h-64">
                    <Image
                      src={p.image.url!}
                      alt={p.image.alt}
                      fill
                      sizes="(min-width: 768px) 300px, 100vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col p-5 sm:p-6">
                    <h4 className="font-serif text-lg leading-snug font-bold group-hover:text-rose">{p.name}</h4>
                    <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{p.tagline}</p>
                    <p className="mt-4 text-sm">
                      <span className="font-medium text-rose">NT$ {Math.min(...p.tiers.map((t) => t.priceTwd)).toLocaleString()}</span>
                      {p.tiers.length > 1 && <span className="text-muted"> 起</span>}
                    </p>
                    <span className="mt-2 flex items-center gap-1 text-sm font-medium">
                      預約配送
                      <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
