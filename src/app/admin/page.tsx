import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { requireRole } from "@/lib/session";
import { getAdminOrders } from "@/lib/order-queries";
import { STATUS_LABEL, type OrderStatus } from "@/lib/order-status";
import { StatusBadge, twd } from "@/components/orders/OrderParts";
import AdminNav from "@/components/orders/AdminNav";
import { adminStats } from "@/lib/users";

export const metadata: Metadata = { title: "管理後台", robots: { index: false } };

const FILTERS: { id: OrderStatus | "active" | "all"; label: string }[] = [
  { id: "active", label: "處理中" },
  { id: "paid", label: STATUS_LABEL.paid },
  { id: "photo_submitted", label: "待審實拍" },
  { id: "pending_payment", label: "待付款" },
  { id: "delivered", label: "已送達" },
  { id: "all", label: "全部" },
];

async function Orders({ searchParams }: PageProps<"/admin">) {
  await requireRole(["admin"], "/admin");
  const raw = (await searchParams).status;
  const current = (typeof raw === "string" ? raw : "active") as (typeof FILTERS)[number]["id"];
  const [orders, stats] = await Promise.all([getAdminOrders(current === "all" ? undefined : current), adminStats()]);
  const cards = [
    { label: "待派單", value: stats.toDispatch, href: "/admin?status=paid", alert: stats.toDispatch > 0 },
    { label: "待審實拍", value: stats.toReview, href: "/admin?status=photo_submitted", alert: stats.toReview > 0 },
    { label: "近 30 天營收", value: `NT$ ${stats.revenue30d.toLocaleString()}`, sub: `${stats.orders30d} 筆` },
    { label: "會員數", value: stats.members, href: "/admin/users" },
  ];
  return (
    <>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {cards.map((c) => {
          const body = (
            <>
              <p className="text-xs text-muted">{c.label}</p>
              <p className={`mt-1 font-serif text-2xl font-bold ${c.alert ? "text-rose" : ""}`}>{c.value}</p>
              {c.sub && <p className="text-xs text-muted">{c.sub}</p>}
            </>
          );
          return c.href ? (
            <Link key={c.label} href={c.href} className="rounded-2xl border border-line bg-surface p-4 hover:border-rose/40">
              {body}
            </Link>
          ) : (
            <div key={c.label} className="rounded-2xl border border-line bg-surface p-4">
              {body}
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.id}
            href={`/admin?status=${f.id}`}
            className={`rounded-full border px-3 py-1 text-sm ${current === f.id ? "border-rose bg-rose text-white" : "border-line text-muted hover:text-foreground"}`}
          >
            {f.label}
          </Link>
        ))}
      </div>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-background text-left text-xs text-muted">
            <tr>
              <th className="px-4 py-2.5 font-normal">訂單</th>
              <th className="px-4 py-2.5 font-normal">類型</th>
              <th className="px-4 py-2.5 font-normal">送達</th>
              <th className="px-4 py-2.5 font-normal">花店</th>
              <th className="px-4 py-2.5 font-normal">狀態</th>
              <th className="px-4 py-2.5 text-right font-normal">金額</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-line hover:bg-background/60">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium hover:text-rose">
                    {o.title}
                  </Link>
                  <p className="text-xs text-muted">
                    {o.orderNo}・{o.buyer.company || o.buyer.name}
                  </p>
                </td>
                <td className="px-4 py-3 text-muted">{o.kind === "gift" ? "禮贈" : "花材包"}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {o.delivery.date}
                  <p className="text-xs text-muted">
                    {o.recipient.city}
                    {o.recipient.district}
                  </p>
                </td>
                <td className="px-4 py-3 text-muted">{o.workOrder?.floristName ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3 text-right">{twd(o.amountTwd)}</td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  沒有符合的訂單
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function AdminPage(props: PageProps<"/admin">) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <AdminNav active="orders" />
      <Suspense fallback={<Loader2 className="mx-auto mt-10 size-5 animate-spin text-muted" />}>
        <Orders {...props} />
      </Suspense>
    </main>
  );
}
