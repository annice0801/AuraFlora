"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { submitCheckout } from "./checkout";

export default function PayButton({ orderId, amount }: { orderId: string; amount: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        onClick={async () => {
          setBusy(true);
          setError(null);
          const res = await fetch(`/api/orders/${orderId}/checkout`, { method: "POST" });
          const json = await res.json();
          if (!res.ok) {
            setError(json.error ?? "無法前往付款");
            setBusy(false);
            return;
          }
          submitCheckout(json.checkout);
        }}
        disabled={busy}
        className="flex items-center gap-2 rounded-xl bg-rose px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
        前往付款 NT$ {amount.toLocaleString()}
      </button>
      {error && <p className="mt-2 text-sm text-rose">{error}</p>}
    </div>
  );
}
