import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { posts } from "@/lib/posts";
import { getInspirations } from "@/lib/flora/getInspirations";
import { getGiftProducts } from "@/lib/flora/getGifts";
import LimitedKitCard from "@/components/kits/LimitedKitCard";
import Parallax from "@/components/motion/Parallax";
import ParallaxImage from "@/components/motion/ParallaxImage";
import FloraCutout from "@/components/motion/FloraCutout";
import Reveal from "@/components/motion/Reveal";

function Eyebrow({ no, children, light = false }: { no: string; children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`flex items-center gap-3 text-xs tracking-[0.3em] uppercase ${light ? "text-white/80" : "text-muted"}`}>
      <span className="font-serif text-sm tracking-normal text-rose">{no}</span>
      <span className={`h-px w-10 ${light ? "bg-white/50" : "bg-line"}`} />
      {children}
    </p>
  );
}

export default async function Home() {
  const [inspirations, gifts] = await Promise.all([getInspirations(), getGiftProducts()]);
  const photo = (slug: string) => inspirations.find((i) => i.slug === slug)?.image;
  const giftPhoto = gifts.find((g) => g.slug === "birthday-vintage-garden")?.image;
  const dining = photo("dining-white-roses-french");
  const peonies = photo("spring-peony-abundance");

  const services = [
    {
      no: "01",
      title: "自用送禮",
      text: "每天限量的時令花材包，週末一小時完成一瓶；需要送禮時，交給配送管家，特約花店製作、出貨前實拍核對。",
      href: "/gifts",
      cta: "看看自用與送禮",
      image: giftPhoto && { src: giftPhoto.url!, alt: giftPhoto.alt },
    },
    {
      no: "02",
      title: "風格策展",
      text: "玄關、長餐桌、床頭與手拿捧花，依風格與季節整理的實景靈感；會員可解鎖每件作品的花材黃金比例清單。",
      href: "/curation",
      cta: "瀏覽靈感庫",
      image: dining && { src: dining.url!, alt: dining.alt },
    },
    {
      no: "03",
      title: "互動花室",
      text: "在瀏覽器裡用 3D 插花：花莖靠著瓶口自然傾斜、透過水看見折射。完成後生成美學配方卡，一鍵買下同款花材。",
      href: "/studio",
      cta: "進入花室",
      image: null,
    },
  ];

  return (
    <main className="flex-1 overflow-x-clip">
      {/* ── 01 主視覺：大字在後、花材在前，三層不同速度的視差 ── */}
      <section className="relative -mt-16 h-[100svh] min-h-[620px] overflow-hidden bg-[radial-gradient(120%_80%_at_20%_10%,#fbf9f5_0%,#efe9e1_55%,#e4ddd2_100%)]">
        <FloraCutout name="eucalyptus" width="min(62vw, 820px)" speed={0.35} rotate={-6} tilt={-14} shadow={false} className="top-[6%] -left-[14%] opacity-70 blur-[1.5px] md:-left-[6%]" priority />
        <Parallax speed={0.28} className="absolute inset-x-0 top-[24%] md:top-[18%]">
          <p
            aria-hidden
            className="text-center font-serif text-[clamp(7.5rem,27vw,25rem)] leading-none font-bold tracking-tight text-[#fffdf9] select-none"
            style={{ textShadow: "0 30px 80px rgba(110,85,60,.16)" }}
          >
            Flora.
          </p>
        </Parallax>
        <FloraCutout name="lisianthus" width="min(108vw, 900px)" speed={-0.16} rotate={5} tilt={-4} className="top-[38%] left-1/2 -translate-x-[42%] md:top-[31%]" priority />
        <FloraCutout name="chamomile" width="min(44vw, 340px)" speed={-0.42} rotate={-10} tilt={-150} className="top-[62%] -right-[16%] md:top-[60%] md:-right-[4%]" />

        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-between px-4 pt-24 pb-10 sm:px-6">
          <div className="flex justify-between text-[11px] tracking-[0.3em] text-muted uppercase">
            <span>N°01 — Seasonal Flowers</span>
            <span className="hidden sm:block">Fresh・Crafted・Delivered</span>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Reveal>
              <h1 className="font-serif text-3xl leading-tight font-bold sm:text-5xl">把花，好好帶回生活裡</h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
                時令花材、禮贈配送與 3D 互動花室。從一枝花開始，讓日常多一點溫柔的儀式感。
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#limited" className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:opacity-90">
                  今日限量花盒
                </a>
                <Link href="/gifts" className="rounded-full border border-foreground/30 bg-white/40 px-6 py-3 text-sm font-medium backdrop-blur transition hover:bg-white/70">
                  自用送禮
                </Link>
              </div>
            </Reveal>
            <a href="#philosophy" className="hidden items-center gap-3 text-xs tracking-[0.3em] text-muted uppercase sm:flex">
              Scroll
              <span className="flex size-10 items-center justify-center rounded-full border border-line">
                <ArrowDown className="size-4 animate-bounce" aria-hidden />
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* ── 理念：文字置中，兩側花材以相反方向漂浮 ── */}
      <section id="philosophy" className="relative py-28 sm:py-40">
        <FloraCutout name="tulip" width="min(70vw, 620px)" speed={-0.3} rotate={-12} tilt={-28} className="top-[8%] -left-[30%] md:-left-[12%]" />
        <FloraCutout name="peony" width="min(64vw, 560px)" speed={0.22} rotate={10} tilt={152} className="-right-[28%] bottom-[2%] md:-right-[10%]" />
        <Reveal className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <Eyebrow no="—">Philosophy</Eyebrow>
          <p className="mt-8 font-serif text-3xl leading-snug font-bold sm:text-5xl sm:leading-tight">
            每一枝花，
            <br />
            都有它該在的位置。
          </p>
          <p className="mx-auto mt-6 max-w-xl leading-relaxed text-muted">
            比例、留白與季節，是我們看待花的方式。不追求多，而是讓每一枝都被好好看見——無論是插給自己，還是送給重要的人。
          </p>
        </Reveal>
      </section>

      {/* ── 本週時令（限量庫存計數器） ── */}
      <section id="limited" className="relative scroll-mt-20 px-4 pb-24 sm:px-6 sm:pb-32">
        <FloraCutout name="snowWillow" width="min(90vw, 900px)" speed={0.18} rotate={-4} tilt={-6} shadow={false} className="-top-[18%] left-[30%] opacity-60" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <Reveal>
            <Eyebrow no="02">This Week</Eyebrow>
            <h2 className="mt-4 mb-8 font-serif text-3xl font-bold sm:text-4xl">本週時令・每日限量</h2>
            <LimitedKitCard />
          </Reveal>
        </div>
      </section>

      {/* ── 服務：圖文交錯，照片在框內視差移動 ── */}
      <section className="border-t border-line bg-surface py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <Eyebrow no="03">Services</Eyebrow>
            <h2 className="mt-4 font-serif text-3xl font-bold sm:text-4xl">為生活與心意而設計</h2>
          </Reveal>
          <div className="mt-16 space-y-20 sm:space-y-28">
            {services.map((s, i) => (
              <div key={s.no} className={`grid items-center gap-8 md:grid-cols-2 md:gap-16 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
                {s.image ? (
                  <ParallaxImage src={s.image.src} alt={s.image.alt} sizes="(min-width: 768px) 560px, 100vw" className="aspect-[4/5] rounded-[2rem] sm:aspect-[5/4]" />
                ) : (
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-[radial-gradient(90%_70%_at_30%_20%,#eef1e7,#cfd8c4)] sm:aspect-[5/4]">
                    <FloraCutout name="peony" width="115%" speed={-0.12} rotate={8} tilt={-12} className="top-[22%] -left-[8%]" />
                    <FloraCutout name="eucalyptus" width="90%" speed={0.1} rotate={-6} tilt={18} shadow={false} className="top-[6%] left-[18%] opacity-80" />
                    <span className="absolute bottom-5 left-5 rounded-full bg-white/70 px-3 py-1 text-xs backdrop-blur">3D 程序化花材</span>
                  </div>
                )}
                <Reveal delay={120}>
                  <p className="font-serif text-5xl text-rose/30 sm:text-7xl">{s.no}</p>
                  <h3 className="mt-2 font-serif text-2xl font-bold sm:text-3xl">{s.title}</h3>
                  <p className="mt-4 max-w-md leading-relaxed text-muted">{s.text}</p>
                  <Link href={s.href} className="group mt-6 inline-flex items-center gap-2 border-b border-foreground pb-1 text-sm font-medium">
                    {s.cta}
                    <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden />
                  </Link>
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 滿版視差照片與引言 ── */}
      {peonies && (
        <section className="relative">
          <ParallaxImage src={peonies.url!} alt={peonies.alt} sizes="100vw" speed={0.22} className="h-[80svh] min-h-[480px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-black/10" />
          <div className="absolute inset-0 flex items-end">
            <Reveal className="mx-auto w-full max-w-6xl px-4 pb-14 text-white sm:px-6 sm:pb-20">
              <Eyebrow no="—" light>
                From the Florist
              </Eyebrow>
              <p className="mt-6 max-w-2xl font-serif text-3xl leading-snug font-bold sm:text-5xl">讓盛開的花，成為日常的主角。</p>
              <p className="mt-4 text-sm text-white/75">芍藥滿盆・春日餐桌｜照片：{peonies.author}（{peonies.license}）</p>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── 花藝筆記 ── */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <Reveal>
              <Eyebrow no="04">Journal</Eyebrow>
              <h2 className="mt-4 font-serif text-3xl font-bold sm:text-4xl">花藝筆記</h2>
            </Reveal>
            <Link href="/blog" className="group inline-flex items-center gap-2 text-sm text-muted hover:text-foreground">
              全部文章
              <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.slice(0, 3).map((p, i) => (
              <Reveal key={p.slug} delay={i * 120}>
                <Link href={`/blog/${p.slug}`} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem]">
                    <Image src={p.cover.src} alt={p.cover.alt} fill sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
                  </div>
                  <p className="mt-4 text-xs tracking-wider text-muted">{p.category}</p>
                  <h3 className="mt-1 font-serif text-lg leading-snug font-bold group-hover:text-rose">{p.title}</h3>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 收尾 ── */}
      <section className="relative overflow-hidden border-t border-line bg-[linear-gradient(180deg,#f3eee6,#ebe4da)] py-28 text-center sm:py-36">
        <FloraCutout name="curlyWillow" width="min(130vw, 1200px)" speed={-0.2} rotate={-6} tilt={-8} className="top-[12%] left-1/2 -translate-x-1/2 opacity-80" />
        <Reveal className="relative px-6">
          <p className="font-serif text-4xl font-bold sm:text-6xl">從一枝花開始。</p>
          <p className="mx-auto mt-4 max-w-md text-muted">今天就為自己挑一束時令花，或替重要的人預約一份心意。</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/gifts" className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90">
              自用送禮
            </Link>
            <Link href="/studio" className="rounded-full border border-foreground/30 px-6 py-3 text-sm font-medium hover:bg-white/60">
              進入互動花室
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
