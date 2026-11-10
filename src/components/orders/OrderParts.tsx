import { CheckCircle2, Circle, MapPin, Phone, Truck } from "lucide-react";
import { CUSTOMER_STEPS, STATUS_LABEL, type OrderStatus } from "@/lib/order-status";
import type { SerializedOrder } from "@/lib/orders";
import type { FloralRecipe } from "@/data/gifts";

export const twd = (n: number) => `NT$ ${n.toLocaleString()}`;

/** 綠界付款方式代碼轉成中文 */
export function paymentLabel(code?: string) {
  if (!code) return "";
  if (code.startsWith("Credit")) return "信用卡";
  if (code.startsWith("ATM")) return "ATM 轉帳";
  if (code.startsWith("CVS")) return "超商代碼";
  if (code.startsWith("ApplePay")) return "Apple Pay";
  if (code.startsWith("TWQR")) return "行動支付";
  return code;
}

export function fmtTime(iso: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

const TONE: Partial<Record<OrderStatus, string>> = {
  pending_payment: "bg-amber-100 text-amber-800",
  paid: "bg-sky-100 text-sky-800",
  photo_submitted: "bg-violet-100 text-violet-800",
  photo_rejected: "bg-rose-soft text-rose",
  approved: "bg-sage-soft text-sage",
  out_for_delivery: "bg-sage-soft text-sage",
  delivered: "bg-sage text-white",
  cancelled: "bg-line text-muted",
  expired: "bg-line text-muted",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE[status] ?? "bg-background text-muted"}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

/** 顧客看到的進度條 */
export function ProgressSteps({ status }: { status: OrderStatus }) {
  const idx = CUSTOMER_STEPS.findIndex((s) => s.status.includes(status));
  return (
    <ol className="grid grid-cols-5 gap-1">
      {CUSTOMER_STEPS.map((s, i) => {
        const done = idx >= i;
        return (
          <li key={s.label} className="text-center">
            <div className={`h-1.5 rounded-full ${done ? "bg-rose" : "bg-line"}`} />
            <p className={`mt-2 text-[11px] leading-tight ${done ? "text-foreground" : "text-muted"}`}>{s.label}</p>
          </li>
        );
      })}
    </ol>
  );
}

export function Timeline({ items }: { items: SerializedOrder["timeline"] }) {
  return (
    <ol className="space-y-3">
      {[...items].reverse().map((t, i) => (
        <li key={`${t.at}-${i}`} className="flex gap-3 text-sm">
          {i === 0 ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-rose" /> : <Circle className="mt-0.5 size-4 shrink-0 text-line" />}
          <div>
            <p className={i === 0 ? "font-medium" : "text-muted"}>
              {t.status === "note" ? "備註" : STATUS_LABEL[t.status as OrderStatus]}
              <span className="ml-2 text-xs font-normal text-muted">{fmtTime(t.at)}</span>
            </p>
            {t.note && <p className="text-xs text-muted">{t.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function DeliveryBlock({ order }: { order: SerializedOrder }) {
  const r = order.recipient;
  return (
    <div className="space-y-1.5 text-sm">
      <p className="flex items-start gap-2">
        <MapPin className="mt-0.5 size-4 shrink-0 text-muted" />
        <span>
          {r.name}・{r.city}
          {r.district}
          {r.address}
        </span>
      </p>
      <p className="flex items-center gap-2">
        <Phone className="size-4 shrink-0 text-muted" />
        {r.phone}
      </p>
      <p className="flex items-center gap-2">
        <Truck className="size-4 shrink-0 text-muted" />
        {order.delivery.date}　{order.delivery.slot}
      </p>
    </div>
  );
}

/** 手寫感卡片預覽（字型由頁面載入的 --font-handwriting 提供） */
export function CardPreview({ to, message, from }: { to: string; message: string; from: string }) {
  return (
    <div
      className="relative rounded-md border border-[#e6dccd] bg-[#fbf7ef] px-6 py-5 text-[#3b3128] shadow-sm"
      style={{ fontFamily: "var(--font-handwriting), serif" }}
    >
      <p className="text-lg">{to ? `給 ${to}：` : "給 ＿＿＿："}</p>
      <p className="mt-2 min-h-[3.5rem] text-lg leading-relaxed whitespace-pre-wrap">{message || "在這裡寫下你想說的話…"}</p>
      <p className="mt-3 text-right text-lg">{from ? `—— ${from}` : "—— ＿＿＿"}</p>
    </div>
  );
}

/** 給花店的規格化花藝配方卡 */
export function RecipeCardView({ recipe }: { recipe: FloralRecipe }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-xs tracking-widest text-rose">FLORAL RECIPE</p>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted">花器</dt>
          <dd>{recipe.vessel}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">尺寸</dt>
          <dd>{recipe.dimensions}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">包裝</dt>
          <dd>{recipe.wrapping}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">色票</dt>
          <dd className="flex flex-wrap gap-2">
            {recipe.colors.map((c) => (
              <span key={c.hex} className="flex items-center gap-1 text-xs">
                <span className="size-3.5 rounded-full border border-line" style={{ background: c.hex }} />
                {c.name} {c.hex}
              </span>
            ))}
          </dd>
        </div>
      </dl>
      <table className="mt-4 w-full text-sm">
        <thead className="text-left text-xs text-muted">
          <tr>
            <th className="pb-1 font-normal">層級</th>
            <th className="pb-1 font-normal">花材</th>
            <th className="pb-1 text-right font-normal">數量</th>
            <th className="pb-1 text-right font-normal">長度</th>
          </tr>
        </thead>
        <tbody>
          {recipe.stems.map((s) => (
            <tr key={`${s.layer}-${s.name}`} className="border-t border-line align-top">
              <td className="py-1.5 pr-2 whitespace-nowrap text-muted">{s.layer}</td>
              <td className="py-1.5 pr-2">
                {s.name}
                {s.note && <span className="block text-xs text-muted">{s.note}</span>}
              </td>
              <td className="py-1.5 text-right font-medium">× {s.count}</td>
              <td className="py-1.5 pl-2 text-right">{s.lengthCm ? `${s.lengthCm} cm` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {recipe.notes.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted">
          {recipe.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PhotoGrid({ photos }: { photos: { url: string; kind: string; uploadedAt: string }[] }) {
  if (!photos.length) return <p className="text-sm text-muted">尚未上傳</p>;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {photos.map((p) => (
        <a key={p.url} href={p.url} target="_blank" rel="noopener noreferrer" className="group relative block overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element -- 花店上傳的實拍照，尺寸不固定 */}
          <img src={p.url} alt="實拍照片" className="aspect-square w-full object-cover transition group-hover:scale-105" />
          <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 text-[10px] text-white">{fmtTime(p.uploadedAt)}</span>
        </a>
      ))}
    </div>
  );
}
