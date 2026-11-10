"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Lightbulb, Loader2, Lock, Ruler, Sparkles, Wand2, X } from "lucide-react";
import {
  CURATION_SCENES,
  CURATION_SEASONS,
  CURATION_STYLES,
  CURATION_TYPES,
  type CurationType,
  type GoldenRecipe,
  type Inspiration,
} from "@/data/inspirations";
import { authClient } from "@/lib/auth-client";

type Dimension = "style" | "scene" | "season";

const DIMENSIONS: { id: Dimension; name: string; caption: string }[] = [
  { id: "style", name: "風格流派", caption: "從美學語彙找靈感" },
  { id: "scene", name: "生活場景", caption: "依擺放的位置挑選" },
  { id: "season", name: "季節活動", caption: "跟著節慶與時令佈置" },
];

const OPTIONS: Record<Dimension, { id: string; name: string; hint?: string }[]> = {
  style: CURATION_STYLES,
  scene: CURATION_SCENES,
  season: CURATION_SEASONS,
};

const nameOf = <T extends { id: string; name: string }>(list: T[], id: string | null) =>
  list.find((x) => x.id === id)?.name;

function Tag({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "rose" | "sage" }) {
  const cls =
    tone === "rose" ? "bg-rose-soft text-rose" : tone === "sage" ? "bg-sage-soft text-sage" : "bg-background text-muted";
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] ${cls}`}>{children}</span>;
}

function tagsOf(item: Inspiration) {
  return [
    { text: nameOf(CURATION_STYLES, item.style), tone: "sage" as const },
    item.scene ? { text: nameOf(CURATION_SCENES, item.scene), tone: "muted" as const } : null,
    item.season ? { text: nameOf(CURATION_SEASONS, item.season), tone: "rose" as const } : null,
  ].filter(Boolean) as { text: string; tone: "muted" | "rose" | "sage" }[];
}

export default function Curation({ items }: { items: Inspiration[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [dimension, setDimension] = useState<Dimension>("scene");
  const [value, setValue] = useState<string | null>(null);
  const [type, setType] = useState<CurationType | null>(null);
  const selectedSlug = params.get("item");
  const selected = items.find((i) => i.slug === selectedSlug) ?? null;

  const open = (slug: string | null) => {
    const q = new URLSearchParams(params.toString());
    if (slug) q.set("item", slug);
    else q.delete("item");
    router.replace(`/curation${q.size ? `?${q}` : ""}`, { scroll: false });
  };

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (!value || (dimension === "style" ? i.style : dimension === "scene" ? i.scene : i.season) === value) &&
          (!type || i.type === type),
      ),
    [items, dimension, value, type],
  );

  const option = OPTIONS[dimension].find((o) => o.id === value);

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-2 sm:grid-cols-3">
          {DIMENSIONS.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setDimension(d.id);
                setValue(null);
              }}
              className={`rounded-2xl border px-5 py-4 text-left transition ${
                dimension === d.id ? "border-foreground bg-foreground text-background" : "border-line bg-surface hover:border-rose/40"
              }`}
            >
              <span className="block font-serif text-lg font-bold">{d.name}</span>
              <span className={`text-xs ${dimension === d.id ? "opacity-70" : "text-muted"}`}>{d.caption}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => setValue(null)}
            className={`rounded-full border px-4 py-1.5 text-sm ${!value ? "border-rose bg-rose text-white" : "border-line text-muted hover:text-foreground"}`}
          >
            全部
          </button>
          {OPTIONS[dimension].map((o) => (
            <button
              key={o.id}
              onClick={() => setValue(value === o.id ? null : o.id)}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                value === o.id ? "border-rose bg-rose text-white" : "border-line text-muted hover:text-foreground"
              }`}
            >
              {o.name}
            </button>
          ))}
        </div>
        {option?.hint && <p className="mt-3 text-sm text-muted">「{option.name}」的重點：{option.hint}</p>}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <div className="inline-flex rounded-full border border-line bg-surface p-1 text-sm">
            {[{ id: null, name: "全部花型" }, ...CURATION_TYPES].map((t) => (
              <button
                key={t.id ?? "all"}
                onClick={() => setType(t.id as CurationType | null)}
                className={`rounded-full px-3.5 py-1 ${type === t.id ? "bg-sage text-white" : "text-muted hover:text-foreground"}`}
              >
                {t.name}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted">共 {filtered.length} 個靈感</p>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4 pb-20 sm:px-6">
        {filtered.length === 0 ? (
          <p className="py-20 text-center text-muted">這個組合還沒有靈感，換個花型看看。</p>
        ) : (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            {filtered.map((item, idx) => (
              <button
                key={item.slug}
                onClick={() => open(item.slug)}
                className="group mb-5 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-line bg-surface text-left"
              >
                <div className="relative overflow-hidden">
                  <Image
                    src={item.image.url!}
                    alt={item.image.alt}
                    width={item.image.width}
                    height={item.image.height}
                    sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                    priority={idx < 3}
                    className="h-auto w-full transition duration-700 group-hover:scale-[1.03]"
                  />
                  <span className="absolute top-3 left-3 rounded-full bg-black/45 px-2.5 py-0.5 text-[11px] text-white backdrop-blur">
                    {nameOf(CURATION_TYPES, item.type)}
                  </span>
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex flex-wrap gap-1.5">
                    {tagsOf(item).map((t) => (
                      <Tag key={t.text} tone={t.tone}>
                        {t.text}
                      </Tag>
                    ))}
                  </div>
                  <h2 className="font-serif text-lg leading-snug font-bold group-hover:text-rose">{item.title}</h2>
                  <p className="text-sm text-muted">{item.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {selected && <Detail item={selected} onClose={() => open(null)} />}
    </>
  );
}

// ───────────── 靈感詳情 ─────────────

function Detail({ item, onClose }: { item: Inspiration; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/60 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
        className="relative grid max-h-full w-full max-w-6xl overflow-hidden bg-surface sm:max-h-[90vh] sm:rounded-3xl lg:grid-cols-[1.15fr_1fr]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="關閉"
          className="absolute top-3 right-3 z-10 rounded-full bg-black/50 p-2 text-white backdrop-blur hover:bg-black/70"
        >
          <X className="size-4" />
        </button>
        <div className="relative min-h-[42vh] bg-[#1d1a17] lg:min-h-0">
          <Image
            src={item.image.url!}
            alt={item.image.alt}
            fill
            sizes="(min-width: 1024px) 640px, 100vw"
            className="object-contain"
            priority
          />
        </div>
        <div className="overflow-y-auto p-6 sm:p-8">
          <div className="flex flex-wrap gap-1.5">
            <Tag tone="sage">{nameOf(CURATION_TYPES, item.type)}</Tag>
            {tagsOf(item).map((t) => (
              <Tag key={t.text} tone={t.tone}>
                {t.text}
              </Tag>
            ))}
          </div>
          <h2 className="mt-3 font-serif text-2xl leading-snug font-bold sm:text-3xl">{item.title}</h2>
          <p className="mt-1 text-muted">{item.subtitle}</p>
          <p className="mt-5 leading-relaxed">{item.description}</p>

          <div className="mt-5 space-y-2">
            {item.tips.map((tip) => (
              <p key={tip} className="flex gap-2 text-sm">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-rose" aria-hidden />
                {tip}
              </p>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-2">
            <span className="text-xs text-muted">主要色彩</span>
            {item.palette.map((c) => (
              <span key={c} className="size-6 rounded-full border border-line" style={{ background: c }} title={c} />
            ))}
          </div>

          <GoldenSection slug={item.slug} />

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm text-background hover:opacity-90"
            >
              <Wand2 className="size-4" aria-hidden />
              到互動花室試插
            </Link>
          </div>

          <p className="mt-6 flex items-center gap-1 text-[11px] text-muted">
            <Camera className="size-3.5" aria-hidden />
            照片：
            <a href={item.image.source} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-rose">
              {item.image.author}
            </a>
            ，{item.image.license}（Wikimedia Commons）
          </p>
        </div>
      </div>
    </div>
  );
}

// ───────────── 會員限定：花材黃金比例清單 ─────────────

function GoldenSection({ slug }: { slug: string }) {
  const { data: session, isPending } = authClient.useSession();
  const [state, setState] = useState<{ slug: string; recipe?: GoldenRecipe; error?: string } | null>(null);

  useEffect(() => {
    if (!session) return;
    let alive = true;
    fetch(`/api/inspirations/${slug}/recipe`)
      .then(async (r) => {
        const json = await r.json();
        if (alive) setState(r.ok ? { slug, recipe: json } : { slug, error: json.error ?? "讀取失敗" });
      })
      .catch(() => alive && setState({ slug, error: "讀取失敗" }));
    return () => {
      alive = false;
    };
  }, [session, slug]);

  const heading = (
    <h3 className="flex items-center gap-2 font-serif text-lg font-bold">
      <Ruler className="size-4 text-rose" aria-hidden />
      花材黃金比例清單
      <span className="rounded-full bg-rose-soft px-2 py-0.5 text-[10px] font-normal text-rose">會員限定</span>
    </h3>
  );

  if (isPending || (session && state?.slug !== slug)) {
    return (
      <section className="mt-7 rounded-2xl border border-line p-5">
        {heading}
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          讀取中…
        </p>
      </section>
    );
  }

  if (!session) {
    const next = `/curation?item=${slug}`;
    return (
      <section className="relative mt-7 overflow-hidden rounded-2xl border border-line p-5">
        {heading}
        {/* 示意用的模糊佔位，不含真實資料 */}
        <div className="pointer-events-none mt-4 space-y-2 blur-[5px] select-none" aria-hidden>
          {["骨架　████ × 3　55 cm", "焦點　██████ × 5　38 cm", "配花　████ × 8　32 cm", "填充　█████ × 13　28 cm"].map((r) => (
            <p key={r} className="rounded-lg bg-background px-3 py-2 text-sm">
              {r}
            </p>
          ))}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/70 px-6 text-center backdrop-blur-[1px]">
          <Lock className="size-5 text-rose" aria-hidden />
          <p className="mt-2 font-medium">登入會員，解鎖完整配方</p>
          <p className="mt-1 text-xs text-muted">花器尺寸、φ 黃金比例高度、61.8／23.6／14.6 配色與每種花材的枝數</p>
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="mt-3 rounded-xl bg-rose px-4 py-2 text-sm text-white hover:opacity-90">
            登入解鎖
          </Link>
        </div>
      </section>
    );
  }

  if (state?.error || !state?.recipe) {
    return (
      <section className="mt-7 rounded-2xl border border-line p-5">
        {heading}
        <p className="mt-3 text-sm text-rose">{state?.error ?? "讀取失敗"}</p>
      </section>
    );
  }

  const r = state.recipe;
  const totalStems = r.stems.reduce((n, s) => n + s.count, 0);
  return (
    <section className="mt-7 rounded-2xl border border-rose/30 bg-rose-soft/40 p-5">
      {heading}
      <p className="mt-2 text-sm">
        <span className="text-muted">花器　</span>
        {r.vessel}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-2">
        {r.proportion.map((p) => (
          <div key={p.label} className="rounded-xl bg-surface px-3 py-2">
            <dt className="text-[11px] text-muted">{p.label}</dt>
            <dd className="font-medium">{p.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-5 text-xs text-muted">黃金比例配色（61.8％・23.6％・14.6％）</p>
      <div className="mt-1.5 flex h-3 overflow-hidden rounded-full">
        {r.colors.map((c) => (
          <span key={c.hex} style={{ width: `${c.percent}%`, background: c.hex }} title={`${c.name} ${c.percent}%`} />
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {r.colors.map((c) => (
          <span key={c.hex} className="flex items-center gap-1">
            <span className="size-2.5 rounded-full" style={{ background: c.hex }} />
            {c.name} {c.percent}%
          </span>
        ))}
      </div>

      <table className="mt-5 w-full text-sm">
        <thead className="text-left text-[11px] text-muted">
          <tr>
            <th className="pb-1 font-normal">層級</th>
            <th className="pb-1 font-normal">花材</th>
            <th className="pb-1 text-right font-normal">枝數</th>
            <th className="pb-1 text-right font-normal">剪裁長度</th>
          </tr>
        </thead>
        <tbody>
          {r.stems.map((s) => (
            <tr key={`${s.layer}-${s.name}`} className="border-t border-line/70 align-top">
              <td className="py-2 pr-2 whitespace-nowrap text-muted">{s.layer}</td>
              <td className="py-2 pr-2">
                {s.name}
                {s.note && <span className="block text-[11px] text-muted">{s.note}</span>}
              </td>
              <td className="py-2 text-right font-medium">× {s.count}</td>
              <td className="py-2 pl-2 text-right whitespace-nowrap">{s.lengthCm ? `${s.lengthCm} cm` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 flex items-start gap-1.5 text-xs text-muted">
        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-rose" aria-hidden />
        枝數取自費氏數列（1、2、3、5、8、13、21），相鄰兩數的比例逐漸接近 φ。共 {totalStems} 枝，花材預算約 NT$ {r.budgetTwd.toLocaleString()}。
      </p>
    </section>
  );
}
