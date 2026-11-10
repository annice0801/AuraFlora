import { FileText, Receipt } from "lucide-react";
import type { SerializedOrder } from "@/lib/orders";
import { CardPreview, DeliveryBlock, paymentLabel, RecipeCardView, StatusBadge, Timeline, twd } from "./OrderParts";
import WorkOrderPanel from "./WorkOrderPanel";

/** 後台訂單詳情（管理員與合作花店共用） */
export default function OrderBackofficeView({
  order,
  role,
  florists,
  selfId,
}: {
  order: SerializedOrder;
  role: "admin" | "florist";
  florists?: { id: string; name: string; email: string }[];
  selfId?: string;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted">{order.orderNo}</p>
            <h1 className="mt-1 font-serif text-2xl font-bold">{order.title}</h1>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-medium">配送</h2>
          <div className="mt-3">
            <DeliveryBlock order={order} />
          </div>
          {order.note && <p className="mt-3 rounded-lg bg-background px-3 py-2 text-sm">備註：{order.note}</p>}
        </section>
        {order.card && (
          <section>
            <h2 className="mb-3 flex items-center gap-1.5 font-medium">
              <FileText className="size-4 text-rose" />
              代印卡片（請以手寫感字型印製）
            </h2>
            <CardPreview {...order.card} />
          </section>
        )}
        {order.workOrder ? (
          <section>
            <h2 className="mb-3 font-medium">規格化花藝配方卡</h2>
            <RecipeCardView recipe={order.workOrder.recipe} />
          </section>
        ) : (
          <p className="text-sm text-muted">派單後會依方案產生規格化配方卡。</p>
        )}
      </div>
      <div className="space-y-6">
        <WorkOrderPanel order={order} role={role} florists={florists} selfId={selfId} />
        {role === "admin" && (
          <section className="rounded-2xl border border-line bg-surface p-5 text-sm">
            <h2 className="flex items-center gap-1.5 font-medium">
              <Receipt className="size-4 text-muted" />
              訂購人與付款
            </h2>
            <p className="mt-2">
              {order.buyer.name}・{order.buyer.phone}・{order.buyer.email}
            </p>
            {(order.buyer.company || order.buyer.taxId) && (
              <p className="text-muted">
                {order.buyer.company} {order.buyer.taxId && `統編 ${order.buyer.taxId}`}
              </p>
            )}
            <p className="mt-2">
              {twd(order.amountTwd)}
              {order.payment.paidAt ? `・已付款（${paymentLabel(order.payment.method)}，綠界交易 ${order.payment.tradeNo}）` : "・未付款"}
            </p>
          </section>
        )}
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-4 font-medium">接單與出貨紀錄</h2>
          <Timeline items={order.timeline} />
        </section>
      </div>
    </div>
  );
}
