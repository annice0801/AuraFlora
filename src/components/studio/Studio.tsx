"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  GraduationCap,
  Hand,
  Loader2,
  MousePointerClick,
  Pause,
  Play,
  RotateCw,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { Demo } from "@/data/demos";
import { RECIPE_KIT_PRICE } from "@/data/gifts";
import KitCheckout from "@/components/kits/KitCheckout";
import { LAYERS, STYLES, type Flower, type Layer, type StyleTag } from "@/data/flowers";
import {
  autoPlacement,
  defaultScale,
  getVase,
  scaleForHeight,
  SCALE_MAX,
  SCALE_MIN,
  relax,
  resolvePlacement,
  VASES,
  type Placement,
  type VaseId,
} from "@/lib/flora/physics";
import { suggestCompanions } from "@/lib/flora/pairing";
import { drawRecipeCard, summarizeRecipe, type RecipeSummary } from "./recipeCard";
import type { DragState } from "./three/StudioCanvas";

const StudioCanvas = dynamic(() => import("./three/StudioCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted">
      <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
      正在準備花室…
    </div>
  ),
});

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const newId = () => crypto.randomUUID();

function FlowerThumb({ flower, size = 56 }: { flower: Flower; size?: number }) {
  const src = flower.thumbUrl ?? flower.cutoutUrl;
  if (src)
    return (
      <Image
        src={src}
        alt={flower.name}
        width={size}
        height={size}
        className="pointer-events-none object-contain select-none"
        draggable={false}
      />
    );
  return (
    <span
      className="inline-block rounded-full border border-line"
      style={{ width: size * 0.6, height: size * 0.6, background: flower.color }}
    />
  );
}

type CardState =
  | { status: "drawing" }
  | {
      status: "ready" | "saving" | "saved" | "error";
      url: string;
      blob: Blob;
      summary: RecipeSummary;
      recipeId?: string;
      remoteUrl?: string;
      error?: string;
    };

type DemoState = { demo: Demo; step: number; playing: boolean };

const demoStemId = (demo: Demo, step: number, k: number) => `demo-${demo.slug}-${step}-${k}`;

function demoPlacements(demo: Demo, step: number, bySlug: Map<string, Flower>): Placement[] {
  const vase = getVase(demo.vase);
  return demo.steps.slice(0, step + 1).flatMap((s, i) =>
    s.stems.flatMap((st, k) => {
      const flower = bySlug.get(st.slug);
      if (!flower) return [];
      return [
        {
          id: demoStemId(demo, i, k),
          slug: st.slug,
          anchor: st.anchor,
          lean: st.lean,
          // 腳本的高度以「花器高度的倍數」描述，換算成花莖長度倍率
          scale: scaleForHeight(flower, vase, st.h),
          spin: st.spin,
        },
      ];
    }),
  );
}

/** 每一步停留時間：依解說字數與插入枝數調整，讓字幕讀得完、花也落定 */
const stepDuration = (step: Demo["steps"][number]) => 2400 + step.narration.length * 55 + step.stems.length * 350;

export default function Studio({ flowers, demos }: { flowers: Flower[]; demos: Demo[] }) {
  const bySlug = useMemo(() => new Map(flowers.map((f) => [f.slug, f])), [flowers]);
  const [vaseId, setVaseId] = useState<VaseId>("terrazzo");
  const vase = getVase(vaseId);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [layer, setLayer] = useState<Layer>("skeleton");
  const [month, setMonth] = useState(0);
  const [style, setStyle] = useState<StyleTag | null>(null);
  const [dragging, setDragging] = useState(false);
  const [card, setCard] = useState<CardState | null>(null);
  const [demoState, setDemoState] = useState<DemoState | null>(null);
  /** 同一步插入多枝時，依序延遲落下 */
  const [enterDelays, setEnterDelays] = useState<Record<string, number>>({});

  const dragRef = useRef<DragState | null>(null);
  const captureRef = useRef<(() => string) | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [previewFlower, setPreviewFlower] = useState<Flower | null>(null);
  const downAt = useRef<{ x: number; y: number; slug: string } | null>(null);

  const resolved = useMemo(
    () => placements.map((p) => resolvePlacement(p, bySlug.get(p.slug)!, vase)),
    [placements, bySlug, vase],
  );
  const selected = resolved.find((r) => r.id === selectedId) ?? null;
  const selectedFlower = selected ? bySlug.get(selected.slug) : undefined;

  const matchesFilter = useCallback(
    (f: Flower) => (!month || f.months.includes(month)) && (!style || f.styles.includes(style)),
    [month, style],
  );
  const palette = flowers.filter((f) => f.layer === layer);
  const visibleCount = palette.filter(matchesFilter).length;

  // 配角提示：以最近一枝（或選取中的）主花為基準
  const focal = useMemo(() => {
    const sel = selectedFlower?.layer === "focal" ? selectedFlower : null;
    if (sel) return sel;
    for (let i = placements.length - 1; i >= 0; i--) {
      const f = bySlug.get(placements[i].slug);
      if (f?.layer === "focal") return f;
    }
    return null;
  }, [selectedFlower, placements, bySlug]);
  const suggestions = useMemo(
    () => (focal ? suggestCompanions(focal, flowers, { month: month || undefined, style: style ?? undefined }) : []),
    [focal, flowers, month, style],
  );

  const commit = useCallback(
    (next: Placement[], fixedId?: string) => setPlacements(relax(next, bySlug, vase, fixedId)),
    [bySlug, vase],
  );

  const addFlower = useCallback(
    (slug: string, placement?: Placement) => {
      const flower = bySlug.get(slug);
      if (!flower) return;
      const id = placement?.id ?? newId();
      setPlacements((prev) => {
        const p = placement ?? autoPlacement(flower, vase, prev, id);
        return relax([...prev, p], bySlug, vase, p.id);
      });
      setSelectedId(id);
    },
    [bySlug, vase],
  );

  const updateSelected = (patch: Partial<Placement>) => {
    if (!selectedId) return;
    commit(
      placements.map((p) => (p.id === selectedId ? { ...p, ...patch } : p)),
      selectedId,
    );
  };

  const changeVase = (id: VaseId) => {
    const next = getVase(id);
    const extent = (v: typeof vase) => Math.max(...v.anchors.map(([x, z]) => Math.hypot(x, z)));
    const ratio = extent(next) / extent(vase);
    // 換花器時，把每枝花移到新花器最接近的插花點
    const moved = placements.map((p) => {
      const want = [p.anchor[0] * ratio, p.anchor[1] * ratio];
      const anchor = next.anchors.reduce((best, a) =>
        Math.hypot(a[0] - want[0], a[1] - want[1]) < Math.hypot(best[0] - want[0], best[1] - want[1]) ? a : best,
      );
      return { ...p, anchor };
    });
    setVaseId(id);
    setPlacements(relax(moved, bySlug, next));
  };

  // ── 花藝師示範 ──
  const goToStep = useCallback(
    (demo: Demo, step: number, playing: boolean) => {
      const v = getVase(demo.vase);
      setVaseId(demo.vase);
      setPlacements(relax(demoPlacements(demo, step, bySlug), bySlug, v));
      setSelectedId(null);
      setEnterDelays(Object.fromEntries(demo.steps[step].stems.map((_, k) => [demoStemId(demo, step, k), k * 0.35])));
      setDemoState({ demo, step, playing });
    },
    [bySlug],
  );

  const startDemo = (demo: Demo) => {
    setCard(null);
    goToStep(demo, 0, true);
    stageRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  /** 結束示範，保留作品讓使用者接手調整 */
  const exitDemo = () => {
    setDemoState(null);
    setSelectedId(null);
  };

  useEffect(() => {
    if (!demoState?.playing) return;
    const { demo, step } = demoState;
    if (step >= demo.steps.length - 1) return;
    const t = setTimeout(() => goToStep(demo, step + 1, true), stepDuration(demo.steps[step]));
    return () => clearTimeout(t);
  }, [demoState, goToStep]);

  // ── 全域拖曳事件（從花材區拖進 3D 場景，或在場景中移動花朵） ──
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const down = downAt.current;
      if (down && !dragRef.current && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) {
        const f = bySlug.get(down.slug)!;
        const scale = defaultScale(f, vase);
        dragRef.current = {
          mode: "new",
          slug: down.slug,
          id: newId(),
          clientX: e.clientX,
          clientY: e.clientY,
          planeY: vase.mouthY + f.height * scale * 0.7,
          scale,
          spin: Math.random() * Math.PI * 2,
          snap: null,
        };
        setPreviewFlower(f);
        setDragging(true);
      }
      const d = dragRef.current;
      if (!d) return;
      d.clientX = e.clientX;
      d.clientY = e.clientY;
      if (previewRef.current) {
        previewRef.current.style.transform = `translate(${e.clientX - 36}px, ${e.clientY - 36}px)`;
        previewRef.current.style.opacity = d.snap ? "0" : "1";
      }
    };
    const up = () => {
      const down = downAt.current;
      downAt.current = null;
      const d = dragRef.current;
      if (!d) {
        if (down) addFlower(down.slug); // 單擊：自動找位置插入
        return;
      }
      dragRef.current = null;
      setDragging(false);
      setPreviewFlower(null);
      if (d.mode === "new" && d.snap) addFlower(d.slug, d.snap);
      if (d.mode === "move") setPlacements((prev) => relax(prev, bySlug, vase));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [addFlower, bySlug, vase]);

  const onStartMove = useCallback((state: DragState) => {
    dragRef.current = state;
    setDragging(true);
  }, []);

  const onMove = useCallback(
    (p: Placement) => setPlacements((prev) => relax(prev.map((x) => (x.id === p.id ? p : x)), bySlug, vase, p.id)),
    [bySlug, vase],
  );

  const removeSelected = () => {
    if (!selectedId) return;
    setPlacements((prev) => prev.filter((p) => p.id !== selectedId));
    setSelectedId(null);
  };

  // ── 配方卡 ──
  const generateCard = async () => {
    const capture = captureRef.current;
    if (!capture || placements.length === 0) return;
    setSelectedId(null);
    setCard({ status: "drawing" });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      const summary = summarizeRecipe(placements, bySlug, vase, style ?? demoState?.demo.style ?? null);
      const blob = await drawRecipeCard(capture(), summary, vase);
      const url = URL.createObjectURL(blob);
      setCard({ status: "saving", url, blob, summary });
      const form = new FormData();
      form.append("image", blob, `recipe.${blob.type === "image/webp" ? "webp" : "png"}`);
      form.append(
        "data",
        JSON.stringify({
          title: summary.title,
          style: summary.style,
          vase: vase.id,
          palette: summary.palette,
          placements,
        }),
      );
      const res = await fetch("/api/recipes", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "儲存失敗");
      setCard({ status: "saved", url, blob, summary, recipeId: json.id, remoteUrl: json.imageUrl });
    } catch (err) {
      setCard((c) =>
        c && c.status !== "drawing"
          ? { ...c, status: "error", error: err instanceof Error ? err.message : "發生錯誤" }
          : null,
      );
    }
  };

  const closeCard = () => {
    if (card && card.status !== "drawing") URL.revokeObjectURL(card.url);
    setCard(null);
  };

  // 「配方即商品」：配方卡存好後即可一鍵結帳購買同款真實花材
  const [kitOpen, setKitOpen] = useState(false);

  const counts = useMemo(() => {
    const m = new Map<Layer, number>();
    for (const p of placements) {
      const l = bySlug.get(p.slug)?.layer;
      if (l) m.set(l, (m.get(l) ?? 0) + 1);
    }
    return m;
  }, [placements, bySlug]);

  return (
    <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[300px_1fr_300px]">
      {/* ── 左：花材 ── */}
      <aside className={`order-2 space-y-4 lg:order-1 ${demoState ? "pointer-events-none opacity-50" : ""}`}>
        <section className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="font-serif text-lg font-bold">四大層級花材</h2>
          <div className="mt-3 grid grid-cols-4 gap-1 rounded-xl bg-background p-1 text-xs">
            {LAYERS.map((l) => (
              <button
                key={l.id}
                onClick={() => setLayer(l.id)}
                className={`rounded-lg px-1 py-2 leading-tight ${
                  layer === l.id ? "bg-surface font-semibold text-rose shadow-sm" : "text-muted hover:text-foreground"
                }`}
              >
                {l.name}
                {counts.get(l.id) ? <span className="ml-0.5 text-[10px]">({counts.get(l.id)})</span> : null}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">{LAYERS.find((l) => l.id === layer)!.hint}</p>
          <ul className="mt-3 space-y-2">
            {palette.map((f) => {
              const ok = matchesFilter(f);
              return (
                <li key={f.slug}>
                  <button
                    disabled={!ok}
                    onPointerDown={(e) => {
                      if (!ok) return;
                      e.preventDefault();
                      downAt.current = { x: e.clientX, y: e.clientY, slug: f.slug };
                    }}
                    className="flex w-full touch-none items-center gap-3 rounded-xl border border-line bg-background p-2 text-left transition hover:border-rose/40 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-surface">
                      <FlowerThumb flower={f} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium">{f.name}</span>
                      <span className="block truncate text-xs text-muted italic">{f.latin}</span>
                      <span className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                        <span className="inline-block size-2.5 rounded-full border border-line" style={{ background: f.color }} />
                        {f.colorName}・瓶插 {f.vaseLifeDays} 天
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {visibleCount < palette.length && (
            <p className="mt-2 text-xs text-muted">有 {palette.length - visibleCount} 種不符合目前的月份或風格</p>
          )}
          <p className="mt-3 flex items-center gap-1 text-xs text-muted">
            <Hand className="size-3.5" aria-hidden />
            拖曳到瓶口會自動吸附；單擊則自動找位置
          </p>
        </section>
      </aside>

      {/* ── 中：3D 場景 ── */}
      <section className="order-1 lg:order-2">
        <div ref={stageRef}
          className={`relative scroll-mt-20 overflow-hidden rounded-2xl border border-line bg-[#f3eee6] ${
            demoState
              ? "h-[52vh] min-h-[380px] lg:h-[max(480px,calc(100vh-330px))]"
              : "h-[60vh] max-h-[640px] min-h-[420px] lg:h-[max(560px,calc(100vh-120px))] lg:max-h-none"
          }`}>
          <StudioCanvas
            vase={vase}
            bySlug={bySlug}
            resolved={resolved}
            selectedId={selectedId}
            dragging={dragging}
            interactive={!demoState}
            enterDelays={enterDelays}
            autoRotate={demoState?.playing ?? false}
            dragRef={dragRef}
            captureRef={captureRef}
            onSelect={setSelectedId}
            onStartMove={onStartMove}
            onMove={onMove}
          />
          {placements.length === 0 && !demoState && (
            <div className="pointer-events-none absolute inset-x-0 top-16 text-center text-sm text-muted">
              <MousePointerClick className="mx-auto mb-1 size-5" aria-hidden />
              拖曳或點選花材，插進瓶口開始插花
            </div>
          )}
          <div className="absolute inset-x-3 top-3 flex gap-1.5 overflow-x-auto">
            {VASES.map((v) => (
              <button
                key={v.id}
                onClick={() => changeVase(v.id)}
                title={v.description}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap backdrop-blur ${
                  vaseId === v.id
                    ? "border-rose bg-rose text-white"
                    : "border-line bg-surface/80 text-foreground hover:border-rose/50"
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>


          {!demoState && selected && selectedFlower && (
            <div className="absolute right-3 bottom-3 left-3 rounded-2xl border border-line bg-surface/95 p-4 shadow-lg backdrop-blur sm:left-auto sm:w-80">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{selectedFlower.name}</p>
                  <p className="text-xs text-muted">
                    傾斜 {Math.round((selected.theta * 180) / Math.PI)}°
                    {selected.restingOnRim && <span className="ml-1 text-rose">・已靠在瓶口邊緣</span>}
                  </p>
                </div>
                <button onClick={() => setSelectedId(null)} className="text-muted hover:text-foreground" aria-label="關閉">
                  <X className="size-4" />
                </button>
              </div>
              <label className="mt-3 block text-xs text-muted">
                花莖長度 {Math.round(selectedFlower.height * selected.scale * 100)} 公分
                <input
                  type="range"
                  min={SCALE_MIN}
                  max={SCALE_MAX}
                  step={0.01}
                  value={selected.scale}
                  onChange={(e) => updateSelected({ scale: Number(e.target.value) })}
                  className="mt-1 w-full accent-[#b5525c]"
                />
              </label>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => updateSelected({ spin: (selected.spin + Math.PI / 4) % (Math.PI * 2) })}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-line py-1.5 text-xs hover:border-rose/50"
                >
                  <RotateCw className="size-3.5" aria-hidden />
                  轉向
                </button>
                <button
                  onClick={removeSelected}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-line py-1.5 text-xs text-rose hover:border-rose/50"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  移除
                </button>
              </div>
              <p className="mt-2 text-[11px] text-muted">在場景中拖曳花朵可以改變插入點與傾斜方向</p>
            </div>
          )}
        </div>
        {demoState && (
          <DemoOverlay
            state={demoState}
            bySlug={bySlug}
            onStep={(step) => goToStep(demoState.demo, step, false)}
            onTogglePlay={() =>
              demoState.step >= demoState.demo.steps.length - 1
                ? goToStep(demoState.demo, 0, true)
                : setDemoState({ ...demoState, playing: !demoState.playing })
            }
            onTakeOver={exitDemo}
            onCard={generateCard}
          />
        )}
      </section>

      {/* ── 右：篩選、配角提示、配方卡 ── */}
      <aside className="order-3 space-y-4">
        <section className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="flex items-center gap-1.5 font-serif text-lg font-bold">
            <GraduationCap className="size-4 text-rose" aria-hidden />
            花藝師示範
          </h2>
          <p className="mt-1 text-xs text-muted">看花藝師一枝一枝插完一件作品，每一步都有解說。</p>
          <ul className="mt-3 space-y-2">
            {demos.map((d) => {
              const active = demoState?.demo.slug === d.slug;
              return (
                <li key={d.slug}>
                  <button
                    onClick={() => startDemo(d)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      active ? "border-rose bg-rose-soft" : "border-line bg-background hover:border-rose/40"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-medium">{d.title}</span>
                      <Play className="size-3.5 shrink-0 text-rose" aria-hidden />
                    </span>
                    <span className="mt-1 block text-[11px] text-muted">
                      #{STYLES.find((s) => s.id === d.style)?.name}・{getVase(d.vase).name}・{d.steps.length} 步
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted">{d.summary}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="font-serif text-lg font-bold">當季花期</h2>
          <div className="mt-3 grid grid-cols-6 gap-1 text-xs">
            <button
              onClick={() => setMonth(0)}
              className={`col-span-6 rounded-lg py-1.5 ${month === 0 ? "bg-sage text-white" : "bg-background text-muted hover:text-foreground"}`}
            >
              全年
            </button>
            {MONTHS.map((m) => (
              <button
                key={m}
                onClick={() => setMonth(m)}
                className={`rounded-lg py-1.5 ${month === m ? "bg-sage text-white" : "bg-background text-muted hover:text-foreground"}`}
              >
                {m}月
              </button>
            ))}
          </div>
          <h2 className="mt-5 font-serif text-lg font-bold">風格</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(style === s.id ? null : s.id)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  style === s.id ? "border-rose bg-rose-soft text-rose" : "border-line text-muted hover:text-foreground"
                }`}
              >
                #{s.name}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="flex items-center gap-1.5 font-serif text-lg font-bold">
            <Sparkles className="size-4 text-rose" aria-hidden />
            配角提示
          </h2>
          {!focal ? (
            <p className="mt-2 text-sm text-muted">插入一枝焦點主花，會依它的色彩與形態推薦 3 款最搭的襯花。</p>
          ) : (
            <>
              <p className="mt-1 text-xs text-muted">依「{focal.name}」推薦</p>
              <ul className="mt-3 space-y-2">
                {suggestions.map((s) => (
                  <li key={s.flower.slug} className="flex items-center gap-3 rounded-xl bg-background p-2">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface">
                      <FlowerThumb flower={s.flower} size={44} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{s.flower.name}</p>
                      <p className="text-[11px] leading-snug text-muted">{s.reasons.join("・")}</p>
                    </div>
                    <button
                      onClick={() => addFlower(s.flower.slug)}
                      className="shrink-0 rounded-lg bg-rose px-2.5 py-1 text-xs text-white hover:opacity-90"
                    >
                      加入
                    </button>
                  </li>
                ))}
                {suggestions.length === 0 && <li className="text-sm text-muted">目前的篩選條件下沒有合適的襯花</li>}
              </ul>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-sm text-muted">已插 {placements.length} 枝</p>
          <button
            onClick={generateCard}
            disabled={placements.length === 0 || card?.status === "drawing"}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
          >
            <Sparkles className="size-4" aria-hidden />
            生成美學配方卡
          </button>
          {placements.length > 0 && (
            <button
              onClick={() => {
                setPlacements([]);
                setSelectedId(null);
              }}
              className="mt-2 w-full py-1 text-xs text-muted hover:text-rose"
            >
              清空重來
            </button>
          )}
        </section>
      </aside>

      {/* 拖曳中的花材預覽 */}
      {previewFlower && (
        <div
          ref={previewRef}
          className="pointer-events-none fixed top-0 left-0 z-50 flex size-[72px] items-center justify-center rounded-full bg-surface/90 shadow-lg"
        >
          <FlowerThumb flower={previewFlower} size={64} />
        </div>
      )}

      {/* 配方卡 */}
      {card && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeCard}>
          <div
            className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="font-serif font-bold">美學配方卡</p>
              <button onClick={closeCard} aria-label="關閉" className="text-muted hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-background p-4">
              {card.status === "drawing" ? (
                <div className="flex h-60 items-center justify-center text-sm text-muted">
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  正在生成配方卡…
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- 本機產生的 blob: 預覽圖
                <img src={card.url} alt={card.summary.title} className="w-full rounded-xl shadow" />
              )}
            </div>
            {card.status !== "drawing" && (
              <div className="space-y-2 border-t border-line p-4">
                <p className="text-xs text-muted">
                  {card.status === "saving" && "正在儲存到雲端…"}
                  {card.status === "saved" && "已儲存到你的配方庫"}
                  {card.status === "error" && <span className="text-rose">儲存失敗：{card.error}（仍可下載圖片）</span>}
                </p>
                <a
                  href={card.url}
                  download={`AuraFlora-${card.summary.title}.${card.blob.type === "image/webp" ? "webp" : "png"}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-sm hover:border-rose/50"
                >
                  <Download className="size-4" aria-hidden />
                  下載配方卡
                </a>
                <button
                  onClick={() => setKitOpen(true)}
                  disabled={card.status !== "saved"}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                  <ShoppingBag className="size-4" aria-hidden />
                  [ 購買同款真實花材體驗包 (NT$ {RECIPE_KIT_PRICE}) ]
                </button>
                {card.status === "saved" && (
                  <KitCheckout
                    open={kitOpen}
                    onClose={() => setKitOpen(false)}
                    title={card.summary.title}
                    priceTwd={RECIPE_KIT_PRICE}
                    source="recipe"
                    recipeId={card.recipeId}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DemoOverlay({
  state,
  bySlug,
  onStep,
  onTogglePlay,
  onTakeOver,
  onCard,
}: {
  state: DemoState;
  bySlug: Map<string, Flower>;
  onStep: (step: number) => void;
  onTogglePlay: () => void;
  onTakeOver: () => void;
  onCard: () => void;
}) {
  const { demo, step, playing } = state;
  const s = demo.steps[step];
  const total = demo.steps.length;
  const last = step === total - 1;
  const counts = new Map<string, number>();
  for (const st of s.stems) counts.set(st.slug, (counts.get(st.slug) ?? 0) + 1);
  const names = [...counts.entries()]
    .map(([slug, n]) => `${bySlug.get(slug)?.name ?? slug}${n > 1 ? ` × ${n}` : ""}`)
    .join("、");
  const placed = demo.steps.slice(0, step + 1).reduce((n, x) => n + x.stems.length, 0);
  const totalStems = demo.steps.reduce((n, x) => n + x.stems.length, 0);
  return (
    <div className="mt-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="rounded-full bg-rose px-2 py-0.5 font-medium text-white">{s.phase}</span>
        <span>
          步驟 {step + 1} / {total}・已插 {placed} / {totalStems} 枝
        </span>
        <span className="ml-auto truncate">{demo.florist}</span>
      </div>
      <p className="mt-2 font-serif text-lg font-bold">
        {s.title}
        <span className="ml-2 text-sm font-normal text-muted">{names}</span>
      </p>
      <p key={`${demo.slug}-${step}`} className="mt-1 animate-[fadeIn_0.5s_ease] text-sm leading-relaxed">
        {s.narration}
      </p>
      <div className="mt-3 flex gap-1" aria-hidden>
        {demo.steps.map((_, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-rose" : "bg-line"}`} />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => onStep(step - 1)}
          disabled={step === 0}
          aria-label="上一步"
          className="rounded-lg border border-line p-1.5 hover:border-rose/50 disabled:opacity-30"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={onTogglePlay}
          aria-label={last ? "重新播放" : playing ? "暫停" : "播放"}
          className="rounded-lg border border-line p-1.5 hover:border-rose/50"
        >
          {last ? <RotateCw className="size-4" /> : playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <button
          onClick={() => onStep(step + 1)}
          disabled={last}
          aria-label="下一步"
          className="rounded-lg border border-line p-1.5 hover:border-rose/50 disabled:opacity-30"
        >
          <ChevronRight className="size-4" />
        </button>
        <div className="ml-auto flex gap-2">
          {last && (
            <button onClick={onCard} className="rounded-lg bg-foreground px-3 py-1.5 text-xs text-background hover:opacity-90">
              生成配方卡
            </button>
          )}
          <button onClick={onTakeOver} className="rounded-lg bg-rose px-3 py-1.5 text-xs text-white hover:opacity-90">
            接手自己改
          </button>
        </div>
      </div>
    </div>
  );
}
