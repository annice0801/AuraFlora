import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { requireRole } from "@/lib/session";
import { getFloristOrders } from "@/lib/order-queries";
import { StatusBadge } from "@/components/orders/OrderParts";

export const metadata: Metadata = { title: "花店工單", robots: { index: false } };

async function WorkOrders() {
  const user = await requireRole(["florist", "admin"], "/florist");
  const orders = await getFloristOrders(user);
  const open = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const done = orders.filter((o) => ["delivered", "cancelled"].includes(o.status));
  const list = (items: typeof orders) => (
    <ul className="space-y-3">
      {items.map((o) => (
        <li key={o.id}>
          <Link href={`/florist/orders/${o.id}`} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-rose/40">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{o.title}</p>
              <p className="text-xs text-muted">
                {o.delivery.date} {o.delivery.slot}・{o.recipient.city}
                {o.recipient.district}
              </p>
            </div>
            <StatusBadge status={o.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
  return (
    <>
      <p className="mt-1 text-sm text-muted">{user.name}，你好。以下是派給你的工單，依送達日期排序。</p>
      <h2 className="mt-8 mb-3 font-medium">進行中（{open.length}）</h2>
      {open.length ? list(open) : <p className="text-sm text-muted">目前沒有進行中的工單</p>}
      {done.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 font-medium text-muted">已完成</h2>
          {list(done)}
        </>
      )}
    </>
  );
}

export default function FloristPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl font-bold">花店工單</h1>
      <Suspense fallback={<Loader2 className="mx-auto mt-10 size-5 animate-spin text-muted" />}>
        <WorkOrders />
      </Suspense>
    </main>
  );
}
