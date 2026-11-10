import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Loader2, Package } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getMyOrders } from "@/lib/order-queries";
import { StatusBadge, twd } from "@/components/orders/OrderParts";

export const metadata: Metadata = { title: "我的訂單" };

async function OrderList() {
  const user = await requireUser("/orders");
  const orders = await getMyOrders(user);
  if (!orders.length)
    return (
      <div className="rounded-2xl border border-line bg-surface p-10 text-center">
        <Package className="mx-auto size-6 text-muted" aria-hidden />
        <p className="mt-3 text-muted">還沒有訂單</p>
        <div className="mt-4 flex justify-center gap-2">
          <Link href="/gifts#gift" className="rounded-xl bg-rose px-4 py-2 text-sm text-white">
            送禮預約
          </Link>
          <Link href="/gifts#self" className="rounded-xl border border-line px-4 py-2 text-sm">
            限量花材包
          </Link>
        </div>
      </div>
    );
  return (
    <ul className="space-y-3">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/orders/${o.id}`} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-4 hover:border-rose/40">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{o.title}</p>
              <p className="text-xs text-muted">
                {o.orderNo}・送達 {o.delivery.date}
              </p>
            </div>
            <StatusBadge status={o.status} />
            <span className="w-24 text-right font-medium">{twd(o.amountTwd)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function OrdersPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl font-bold">我的訂單</h1>
      <div className="mt-6">
        <Suspense fallback={<Loader2 className="mx-auto mt-10 size-5 animate-spin text-muted" />}>
          <OrderList />
        </Suspense>
      </div>
    </main>
  );
}
