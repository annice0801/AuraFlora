"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Snowflake, X, Zap } from "lucide-react";
import { SERVICE_AREAS } from "@/data/gifts";
import { authClient } from "@/lib/auth-client";
import { submitCheckout } from "@/components/orders/checkout";

type Recipient = { name: string; phone: string; city: string; district: string; address: string };
type Buyer = { name: string; phone: string; email: string };

const cities = Object.keys(SERVICE_AREAS);
const emptyRecipient: Recipient = { name: "", phone: "", city: cities[0], district: SERVICE_AREAS[cities[0]][0], address: "" };
const input = "w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-rose/60";

/** 「配方即商品」一鍵結帳：有上次的收件資料就直接付款 */
export default function KitCheckout({
  open,
  onClose,
  title,
  priceTwd,
  source,
  recipeId,
  dropOffset,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  priceTwd: number;
  source: "weekly" | "recipe";
  recipeId?: string;
  dropOffset?: 0 | 1;
}) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(true);
  const [recipient, setRecipient] = useState<Recipient>(emptyRecipient);
  const [buyer, setBuyer] = useState<Buyer>({ name: "", phone: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || isPending) return;
    if (!session) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (loaded) return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        const last = d.lastContact;
        if (last?.recipient) {
          setRecipient(last.recipient);
          setEditing(false);
        }
        setBuyer({
          name: last?.buyer?.name ?? d.user?.name ?? "",
          phone: last?.buyer?.phone ?? "",
          email: last?.buyer?.email ?? d.user?.email ?? "",
        });
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [open, isPending, session, loaded, router, pathname]);

  if (!open || !session) return null;

  const pay = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "kit",
          source,
          recipeId,
          dropOffset,
          recipient,
          buyer: { name: buyer.name || recipient.name, phone: buyer.phone || recipient.phone, email: buyer.email },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "結帳失敗");
      submitCheckout(json.checkout);
    } catch (err) {
      setError(err instanceof Error ? err.message : "結帳失敗");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-surface p-6 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted">{source === "weekly" ? (dropOffset ? "預訂明天的時令花盒" : "今日限量時令花盒") : "配方即商品"}</p>
            <h3 className="mt-1 font-serif text-lg font-bold">{title}</h3>
          </div>
          <button onClick={onClose} aria-label="關閉" className="text-muted hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
          <Snowflake className="size-3.5 text-sage" />
          工作室冷鏈統一出貨，{source === "weekly" ? "出貨日" : "下單後"}隔天送達・附花藝配方卡與步驟卡
        </p>

        {!loaded ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted" />
          </div>
        ) : editing ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <input className={input} placeholder="收件人" value={recipient.name} onChange={(e) => setRecipient({ ...recipient, name: e.target.value })} />
            <input className={input} placeholder="手機" type="tel" value={recipient.phone} onChange={(e) => setRecipient({ ...recipient, phone: e.target.value })} />
            <select className={input} value={recipient.city} onChange={(e) => setRecipient({ ...recipient, city: e.target.value, district: SERVICE_AREAS[e.target.value][0] })}>
              {cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select className={input} value={recipient.district} onChange={(e) => setRecipient({ ...recipient, district: e.target.value })}>
              {SERVICE_AREAS[recipient.city].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <input className={`${input} col-span-2`} placeholder="詳細地址" value={recipient.address} onChange={(e) => setRecipient({ ...recipient, address: e.target.value })} />
            <input className={`${input} col-span-2`} placeholder="Email（訂單通知）" type="email" value={buyer.email} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} />
          </div>
        ) : (
          <div className="mt-4 rounded-xl bg-background p-3 text-sm">
            <p>
              {recipient.name}・{recipient.phone}
            </p>
            <p className="text-muted">
              {recipient.city}
              {recipient.district}
              {recipient.address}
            </p>
            <button onClick={() => setEditing(true)} className="mt-1 text-xs text-rose underline underline-offset-2">
              修改收件資料
            </button>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-rose">{error}</p>}
        <button
          onClick={pay}
          disabled={busy || !loaded}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-rose py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
          {editing ? "確認並付款" : "一鍵結帳"} NT$ {priceTwd.toLocaleString()}
        </button>
        {source === "weekly" && <p className="mt-2 text-center text-[11px] text-muted">名額保留 20 分鐘，逾時未付款會自動釋出</p>}
      </div>
    </div>
  );
}
