import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Camera, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getOrderForViewer } from "@/lib/order-queries";
import {
  CardPreview,
  DeliveryBlock,
  PhotoGrid,
  ProgressSteps,
  StatusBadge,
  Timeline,
  twd,
  paymentLabel,
} from "@/components/orders/OrderParts";
import PayButton from "@/components/orders/PayButton";

export const metadata: Metadata = { title: "訂單詳情" };

const SHOW_PRESHIP = ["approved", "out_for_delivery", "delivered"];

async function OrderDetail({ params, searchParams }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/orders/${id}`);
  const order = await getOrderForViewer(id, user);
  if (!order) notFound();
  const payment = (await searchParams).payment;
  const photos = order.workOrder?.photos ?? [];

  return (
    <>
      {payment === "success" && order.status !== "pending_payment" && (
        <p className="mb-5 flex items-center gap-2 rounded-xl bg-sage-soft px-4 py-3 text-sm text-sage">
          <CheckCircle2 className="size-4" aria-hidden />
          付款成功！我們已收到你的預約，特約花店接單後會開始製作。
        </p>
      )}
      {payment === "failed" && (
        <p className="mb-5 flex items-center gap-2 rounded-xl bg-rose-soft px-4 py-3 text-sm text-rose">
          <XCircle className="size-4" aria-hidden />
          付款沒有完成，可以再試一次。
        </p>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">訂單編號 {order.orderNo}</p>
          <h1 className="mt-1 font-serif text-2xl font-bold">{order.title}</h1>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {order.status === "pending_payment" ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm">
            訂單尚未付款
            {order.reservedUntil && "，限量名額保留到 " + new Date(order.reservedUntil).toLocaleTimeString("zh-TW", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit" })}
          </p>
          <div className="mt-3">
            <PayButton orderId={order.id} amount={order.amountTwd} />
          </div>
        </div>
      ) : (
        !["cancelled", "expired"].includes(order.status) && (
          <div className="mt-6">
            <ProgressSteps status={order.status} />
          </div>
        )
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-medium">配送資訊</h2>
          <div className="mt-3">
            <DeliveryBlock order={order} />
          </div>
          {order.note && <p className="mt-3 text-xs text-muted">備註：{order.note}</p>}
          <p className="mt-4 border-t border-line pt-3 text-sm">
            金額 <span className="float-right font-medium">{twd(order.amountTwd)}</span>
          </p>
          {order.payment.paidAt && <p className="text-xs text-muted">已付款・{paymentLabel(order.payment.method)}</p>}
        </section>
        {order.card ? (
          <section>
            <h2 className="mb-3 font-medium">代印卡片</h2>
            <CardPreview {...order.card} />
          </section>
        ) : (
          order.item.stems && (
            <section className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="font-medium">花材內容</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {order.item.stems.map((s) => (
                  <li key={s.name}>
                    {s.name} × {s.count}
                  </li>
                ))}
              </ul>
            </section>
          )
        )}
      </div>

      {SHOW_PRESHIP.includes(order.status) && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 font-medium">
            <Camera className="size-4 text-rose" aria-hidden />
            出貨前實拍核對（Photo-Check）
          </h2>
          <p className="mt-1 mb-3 text-xs text-muted">花店完成後拍攝、經 AuraFlora 審核通過的實拍照片。</p>
          <PhotoGrid photos={photos.filter((p) => p.kind === "pre_ship")} />
          {photos.some((p) => p.kind === "delivery") && (
            <>
              <h3 className="mt-5 mb-3 text-sm font-medium">送達照片</h3>
              <PhotoGrid photos={photos.filter((p) => p.kind === "delivery")} />
            </>
          )}
        </section>
      )}

      <section className="mt-8 rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-4 font-medium">訂單紀錄</h2>
        <Timeline items={order.timeline} />
      </section>
    </>
  );
}

export default function OrderPage(props: PageProps<"/orders/[id]">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <Link href="/orders" className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-rose">
        <ArrowLeft className="size-4" aria-hidden />
        我的訂單
      </Link>
      <Suspense fallback={<Loader2 className="mx-auto mt-10 size-5 animate-spin text-muted" />}>
        <OrderDetail {...props} />
      </Suspense>
    </main>
  );
}
