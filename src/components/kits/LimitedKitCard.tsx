"use client";

import { useEffect, useState } from "react";
import { Leaf, Loader2 } from "lucide-react";
import KitCheckout from "./KitCheckout";

type Drop = { date: string; limit: number; remaining: number };
type Data = { kit: { title: string; description: string; priceTwd: number }; today: Drop; tomorrow: Drop; msUntilTomorrow: number };

function countdown(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h} 小時 ${m} 分` : `${m} 分`;
}

/** 首頁的動態庫存計數器：每 15 秒更新剩餘份數，今日售罄後改為預訂明天並倒數 */
export default function LimitedKitCard() {
  const [data, setData] = useState<Data | null>(null);
  const [fetchedAt, setFetchedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/kits/today")
        .then((r) => r.json())
        .then((d: Data) => {
          if (!alive) return;
          setData(d);
          const t = Date.now();
          setFetchedAt(t);
          setNow(t);
        })
        .catch(() => undefined);
    load();
    const poll = setInterval(load, 15000);
    const tick = setInterval(() => setNow(Date.now()), 30000);
    return () => {
      alive = false;
      clearInterval(poll);
      clearInterval(tick);
    };
  }, []);

  if (!data)
    return (
      <div className="flex h-56 items-center justify-center rounded-3xl border border-line bg-surface">
        <Loader2 className="size-5 animate-spin text-muted" />
      </div>
    );

  const soldOut = data.today.remaining === 0;
  const tomorrowSoldOut = data.tomorrow.remaining === 0;
  const left = Math.max(data.msUntilTomorrow - (now - fetchedAt), 0);
  const ratio = soldOut ? 1 : 1 - data.today.remaining / data.today.limit;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-sage/30 bg-gradient-to-br from-sage-soft to-surface p-6 sm:p-8">
      <p className="flex items-center gap-1.5 text-sm text-sage">
        <Leaf className="size-4" aria-hidden />
        本週時令配方
      </p>
      <h2 className="mt-2 font-serif text-2xl font-bold sm:text-3xl">【{data.kit.title}】</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{data.kit.description}</p>

      <div className="mt-5 inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full border border-line bg-surface px-4 py-2 text-sm" aria-live="polite">
        <span>今日限量 {data.today.limit} 份</span>
        <span className="text-line">｜</span>
        {soldOut ? (
          <span className="font-medium text-muted">今日已售罄</span>
        ) : (
          <span className={`font-medium ${data.today.remaining <= 5 ? "text-rose" : "text-foreground"}`}>
            僅剩 {data.today.remaining} 份可預訂
          </span>
        )}
      </div>
      <div className="mt-3 h-1.5 max-w-sm overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-rose transition-all duration-700" style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {!soldOut ? (
          <button onClick={() => setOpen(true)} className="rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background hover:opacity-90">
            立即預訂 NT$ {data.kit.priceTwd}
          </button>
        ) : (
          <button
            onClick={() => setOpen(true)}
            disabled={tomorrowSoldOut}
            className="rounded-xl bg-rose px-5 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {tomorrowSoldOut ? "明天的份額也已預訂完畢" : `[ 預訂明天的時令花盒 (倒數 ${countdown(left)}) ]`}
          </button>
        )}
        <span className="text-xs text-muted">工作室冷鏈統一出貨・隔天送達</span>
      </div>

      <KitCheckout
        open={open}
        onClose={() => setOpen(false)}
        title={data.kit.title}
        priceTwd={data.kit.priceTwd}
        source="weekly"
        dropOffset={soldOut ? 1 : 0}
      />
    </div>
  );
}
