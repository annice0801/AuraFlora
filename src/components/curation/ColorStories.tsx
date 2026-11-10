"use client";

import { useState } from "react";
import Image from "next/image";
import type { PaletteDoc } from "@/lib/flora/getPalettes";
import Parallax from "@/components/motion/Parallax";

type Slot = { top: number; left: number; width: number; rotate: number; speed: number; flip?: boolean };

/** 花團的擺位（由後到前，共 9 個位置）：後排葉材、中排配花、前排主花 */
const SLOTS: Slot[] = [
  { top: -2, left: 28, width: 62, rotate: -16, speed: 0.08 },
  { top: 4, left: -2, width: 56, rotate: 18, speed: -0.04, flip: true },
  { top: 16, left: 46, width: 50, rotate: -10, speed: 0.06 },
  { top: 22, left: -4, width: 50, rotate: 14, speed: -0.05, flip: true },
  { top: 28, left: 28, width: 48, rotate: 4, speed: 0.04 },
  { top: 32, left: 56, width: 44, rotate: -18, speed: -0.06, flip: true },
  { top: 40, left: 2, width: 52, rotate: 8, speed: -0.08 },
  { top: 42, left: 46, width: 52, rotate: -10, speed: 0.07, flip: true },
  { top: 50, left: 22, width: 58, rotate: 2, speed: -0.1 },
];

/**
 * 把色系的花材排成飽滿的花團：
 * 前兩種（葉材、填充）放後排各 1 枝，中間的配花各 2 枝，最後的主花 3 枝放最前面。
 */
function bouquetOf(lineup: string[]) {
  const back = lineup.slice(0, 2);
  const focal = lineup[lineup.length - 1];
  const mid = lineup.slice(2, -1);
  const midSeq = mid.length ? [...mid, ...mid, ...mid].slice(0, 4) : [];
  return [...back, ...midSeq, focal, focal, focal].slice(-SLOTS.length);
}

/** 依真實花頭大小調整比例（芍藥、向日葵為 1） */
const SIZE: [string, number][] = [
  ["tulip", 0.62],
  ["lisianthus", 0.82],
  ["freesia", 0.85],
  ["trachelium", 0.8],
  ["chamomile", 0.92],
  ["gypsophila", 0.95],
  ["eucalyptus", 1.08],
  ["willow", 1.1],
];
const sizeOf = (id: string) => SIZE.find(([k]) => id.includes(k))?.[1] ?? 1;

function Composition({ palette }: { palette: PaletteDoc }) {
  const seq = bouquetOf(palette.lineup);
  const slots = SLOTS.slice(SLOTS.length - seq.length);
  return (
    <div className="relative aspect-[5/6]">
      {seq.map((id, i) => {
        const f = palette.flowers[id];
        const s = slots[i];
        if (!f) return null;
        return (
          <Parallax
            key={`${id}-${i}`}
            speed={s.speed}
            className="absolute"
            style={{ top: `${s.top}%`, left: `${s.left + (s.width * (1 - sizeOf(id))) / 2}%`, width: `${s.width * sizeOf(id)}%`, zIndex: i + 1 }}
          >
            <Image
              src={f.image.src}
              alt={i === seq.length - 1 ? f.name : ""}
              width={f.image.width}
              height={f.image.height}
              sizes="(min-width: 1024px) 220px, 55vw"
              className="h-auto w-full"
              style={{
                transform: `rotate(${s.rotate}deg)${s.flip ? " scaleX(-1)" : ""}`,
                filter: "drop-shadow(0 18px 18px rgba(60,45,30,.18))",
              }}
            />
          </Parallax>
        );
      })}
    </div>
  );
}

function PaletteCard({ palette, index }: { palette: PaletteDoc; index: number }) {
  const [tab, setTab] = useState(0);
  const a = palette.arrangements[tab];
  const totalStems = a.items.reduce((n, i) => n + i.stems, 0);
  const bunches = a.items.map((i) => ({ ...i, f: palette.flowers[i.variant], b: Math.ceil(i.stems / (palette.flowers[i.variant]?.bunch ?? 10)) }));
  const totalBunches = bunches.reduce((n, i) => n + i.b, 0);

  return (
    <article
      className="flex w-[82vw] shrink-0 snap-center flex-col overflow-hidden rounded-[2rem] border border-white/60 shadow-[0_30px_60px_-30px_rgba(80,60,40,.35)] sm:w-[360px] lg:w-auto"
      style={{ background: `linear-gradient(170deg, ${palette.tint[0]}, ${palette.tint[1]})` }}
    >
      <header className="px-6 pt-6">
        <div className="flex items-center justify-between text-[11px] tracking-[0.25em] text-muted uppercase">
          <span>N°{String(index + 1).padStart(2, "0")}</span>
          <span>{palette.nameEn}</span>
        </div>
        <h3 className="mt-3 font-serif text-2xl font-bold">{palette.name}</h3>
        <p className="mt-1 text-xs text-muted">{palette.mood}</p>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
          {palette.colors.map((c) => (
            <span key={c.hex} className="flex items-center gap-1.5 text-[11px] text-muted">
              <span className="size-3.5 rounded-full border border-black/10" style={{ background: c.hex }} />
              {c.name}
            </span>
          ))}
        </div>
      </header>

      <div className="flex-1 px-4">
        <Composition palette={palette} />
      </div>

      <div className="relative z-20 -mt-10 rounded-t-[1.5rem] bg-white/80 px-5 pt-4 pb-5 shadow-[0_-12px_30px_-20px_rgba(60,45,30,.25)] backdrop-blur-md">
        <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label={`${palette.name}的花型`}>
          {palette.arrangements.map((x, i) => (
            <button
              key={x.label}
              role="tab"
              aria-selected={tab === i}
              onClick={() => setTab(i)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs whitespace-nowrap ${tab === i ? "bg-foreground text-background" : "text-muted hover:text-foreground"}`}
            >
              {x.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs font-medium">{a.scope}</p>
        <ul className="mt-2 divide-y divide-line/70">
          {bunches.map(({ variant, stems, f, b }) => (
            <li key={variant} className="flex items-center gap-2 py-1.5 text-sm">
              {f && (
                <span className="relative size-7 shrink-0">
                  <Image src={f.image.src} alt="" fill sizes="28px" className="object-contain" />
                </span>
              )}
              <span className="flex-1">{f?.name ?? variant}</span>
              <span className="w-14 text-right font-medium">× {stems} 枝</span>
              <span className="w-12 text-right text-xs text-muted">{b} 束</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">{a.note}</p>
        <p className="mt-2 border-t border-line/70 pt-2 text-xs">
          合計 <strong>{totalStems}</strong> 枝・花市採購約 <strong>{totalBunches}</strong> 束
        </p>
      </div>
    </article>
  );
}

const CATEGORIES = [
  { id: "wedding", name: "婚禮配色" },
  { id: "season", name: "季節節慶" },
] as const;

/** 配色花譜：不同色系分別搭配哪些花、捧花／桌花各幾枝、要買幾束 */
export default function ColorStories({ palettes }: { palettes: PaletteDoc[] }) {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]["id"]>("wedding");
  const list = palettes.filter((p) => p.category === cat);
  return (
    <section className="relative py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.3em] text-muted uppercase">Color Stories</p>
            <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">配色花譜</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              選一個色系，看看它搭配哪些花：捧花、桌花分別用幾枝、到花市要買幾束，一張卡片就清楚。
            </p>
          </div>
          <div className="inline-flex rounded-full border border-line bg-surface p-1 text-sm">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`rounded-full px-4 py-1.5 ${cat === c.id ? "bg-rose text-white" : "text-muted hover:text-foreground"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* 手機與平板：橫向滑動；電腦：三欄 */}
      <div className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-6 sm:px-6 lg:mx-auto lg:grid lg:max-w-6xl lg:grid-cols-3 lg:overflow-visible">
        {list.map((p, i) => (
          <PaletteCard key={p.slug} palette={p} index={i} />
        ))}
      </div>
      <p className="mx-auto max-w-6xl px-4 text-[11px] text-muted sm:px-6">
        卡片上的花材為 3D 程序化花材依色系上色渲染；束數依台灣花市常見的一束 10 枝（洋甘菊約 15 枝）估算。
      </p>
    </section>
  );
}
