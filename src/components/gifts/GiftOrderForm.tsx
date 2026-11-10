"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Lock, PenLine } from "lucide-react";
import { SERVICE_AREAS, TIME_SLOTS, type GiftProduct } from "@/data/gifts";
import { authClient } from "@/lib/auth-client";
import { CardPreview } from "@/components/orders/OrderParts";
import { submitCheckout } from "@/components/orders/checkout";

const cities = Object.keys(SERVICE_AREAS);

function taipeiDate(offset: number) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(Date.now() + offset * 86400000),
  );
}

const input =
  "w-full rounded-xl border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-rose/60 focus:ring-2 focus:ring-rose/15";
const label = "mb-1 block text-xs text-muted";

function Field({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className={label}>{title}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

export default function GiftOrderForm({ product }: { product: GiftProduct }) {
  const { data: session, isPending } = authClient.useSession();
  const minDate = useMemo(() => taipeiDate(product.leadDays), [product.leadDays]);
  const maxDate = useMemo(() => taipeiDate(60), []);
  const [tierId, setTierId] = useState(product.tiers.find((t) => t.name.includes("推薦"))?.id ?? product.tiers[0].id);
  const [delivery, setDelivery] = useState({ date: minDate, slot: TIME_SLOTS[1] });
  const [recipient, setRecipient] = useState({ name: "", phone: "", city: cities[0], district: SERVICE_AREAS[cities[0]][0], address: "" });
  const [withCard, setWithCard] = useState(true);
  const [card, setCard] = useState({ to: "", message: "", from: "" });
  const [buyer, setBuyer] = useState({ name: "", phone: "", email: "", company: "", taxId: "" });
  const [note, setNote] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tier = product.tiers.find((t) => t.id === tierId)!;

  // 帶入上次的聯絡資料
  useEffect(() => {
    if (!session) return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        const last = d.lastContact;
        setBuyer((b) => ({
          name: b.name || last?.buyer?.name || d.user?.name || "",
          phone: b.phone || last?.buyer?.phone || "",
          email: b.email || last?.buyer?.email || d.user?.email || "",
          company: b.company || last?.buyer?.company || "",
          taxId: b.taxId || last?.buyer?.taxId || "",
        }));
      })
      .catch(() => undefined);
  }, [session]);

  if (isPending)
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted">
        <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
        載入中…
      </div>
    );

  if (!session)
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 text-center">
        <Lock className="mx-auto size-5 text-rose" aria-hidden />
        <p className="mt-2 font-medium">登入後即可預約配送</p>
        <p className="mt-1 text-sm text-muted">訂單進度、出貨前實拍都會保存在你的會員帳號中。</p>
        <Link
          href={`/login?next=${encodeURIComponent(`/gifts/${product.slug}`)}`}
          className="mt-4 inline-block rounded-xl bg-rose px-5 py-2.5 text-sm text-white hover:opacity-90"
        >
          登入預約
        </Link>
      </div>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!agree) return setError("請確認配送與品質履約規範");
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "gift",
          productSlug: product.slug,
          tierId,
          buyer: { ...buyer, company: buyer.company || undefined, taxId: buyer.taxId || undefined },
          recipient,
          delivery,
          card: withCard ? card : undefined,
          note: note || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "送出失敗");
      submitCheckout(json.checkout);
    } catch (err) {
      setError(err instanceof Error ? err.message : "送出失敗");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-8">
      <section>
        <h3 className="font-serif text-lg font-bold">1. 選擇方案</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {product.tiers.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => setTierId(t.id)}
              className={`rounded-xl border p-3 text-left transition ${tierId === t.id ? "border-rose bg-rose-soft" : "border-line hover:border-rose/40"}`}
            >
              <span className="block text-sm font-medium">{t.name}</span>
              <span className="block text-xs text-muted">{t.spec}</span>
              <span className="mt-1 block font-medium text-rose">NT$ {t.priceTwd.toLocaleString()}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-serif text-lg font-bold">2. 收件地區與希望送達時間</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field title="希望送達日期" hint={`最早可配送 ${minDate}（需 ${product.leadDays} 天備花）`}>
            <input
              type="date"
              required
              min={minDate}
              max={maxDate}
              value={delivery.date}
              onChange={(e) => setDelivery({ ...delivery, date: e.target.value })}
              className={input}
            />
          </Field>
          <Field title="送達時段">
            <select value={delivery.slot} onChange={(e) => setDelivery({ ...delivery, slot: e.target.value })} className={input}>
              {TIME_SLOTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field title="收件人姓名">
            <input required maxLength={30} value={recipient.name} onChange={(e) => setRecipient({ ...recipient, name: e.target.value })} className={input} />
          </Field>
          <Field title="收件人電話">
            <input required type="tel" placeholder="0912345678" value={recipient.phone} onChange={(e) => setRecipient({ ...recipient, phone: e.target.value })} className={input} />
          </Field>
          <Field title="縣市">
            <select
              value={recipient.city}
              onChange={(e) => setRecipient({ ...recipient, city: e.target.value, district: SERVICE_AREAS[e.target.value][0] })}
              className={input}
            >
              {cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field title="行政區">
            <select value={recipient.district} onChange={(e) => setRecipient({ ...recipient, district: e.target.value })} className={input}>
              {SERVICE_AREAS[recipient.city].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field title="詳細地址（含樓層、公司名稱）">
              <input required maxLength={120} value={recipient.address} onChange={(e) => setRecipient({ ...recipient, address: e.target.value })} className={input} />
            </Field>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted">目前服務：{cities.join("、")}（部分行政區）。其他地區請聯繫我們。</p>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-serif text-lg font-bold">
            <PenLine className="size-4 text-rose" aria-hidden />
            3. 代印手寫感卡片
          </h3>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={withCard} onChange={(e) => setWithCard(e.target.checked)} className="accent-[#b5525c]" />
            附上卡片（免費）
          </label>
        </div>
        {withCard && (
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <Field title="給">
                <input maxLength={20} value={card.to} onChange={(e) => setCard({ ...card, to: e.target.value })} className={input} placeholder="王經理" />
              </Field>
              <Field title={`想說的話（${card.message.length}/120）`}>
                <textarea
                  maxLength={120}
                  rows={4}
                  value={card.message}
                  onChange={(e) => setCard({ ...card, message: e.target.value })}
                  className={input}
                  placeholder="開幕大吉，生意興隆！"
                />
              </Field>
              <Field title="署名">
                <input maxLength={20} value={card.from} onChange={(e) => setCard({ ...card, from: e.target.value })} className={input} placeholder="AuraFlora 全體同仁" />
              </Field>
            </div>
            <div>
              <span className={label}>卡片預覽（以手寫感字型印製）</span>
              <CardPreview {...card} />
            </div>
          </div>
        )}
      </section>

      <section>
        <h3 className="font-serif text-lg font-bold">4. 訂購人資料</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field title="姓名">
            <input required maxLength={30} value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} className={input} />
          </Field>
          <Field title="手機">
            <input required type="tel" value={buyer.phone} onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })} className={input} />
          </Field>
          <Field title="Email（訂單通知）">
            <input required type="email" value={buyer.email} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} className={input} />
          </Field>
          <Field title="公司名稱（選填）">
            <input maxLength={60} value={buyer.company} onChange={(e) => setBuyer({ ...buyer, company: e.target.value })} className={input} />
          </Field>
          <Field title="統一編號（選填，開立公司發票）">
            <input inputMode="numeric" maxLength={8} value={buyer.taxId} onChange={(e) => setBuyer({ ...buyer, taxId: e.target.value })} className={input} />
          </Field>
          <Field title="備註（選填）">
            <input maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} className={input} placeholder="例如：請送到 3 樓櫃台" />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted">
            {product.name}・{tier.name}
          </span>
          <span className="font-serif text-2xl font-bold">NT$ {tier.priceTwd.toLocaleString()}</span>
        </div>
        <p className="mt-1 text-xs text-muted">含配送、代印卡片與出貨前實拍核對</p>
        <label className="mt-4 flex items-start gap-2 text-sm">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 accent-[#b5525c]" />
          我了解花材為天然植物，特約花店會依配方卡選用等值當季花材；出貨前實拍將於訂單頁提供核對。
        </label>
        {error && <p className="mt-3 text-sm text-rose">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
          前往付款（綠界 ECPay）
        </button>
        <p className="mt-2 text-center text-[11px] text-muted">支援信用卡、Apple Pay、ATM 轉帳、超商代碼等付款方式</p>
      </section>
    </form>
  );
}
