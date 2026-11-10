import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { requireRole } from "@/lib/session";
import { getOrderForViewer, listFlorists } from "@/lib/order-queries";
import OrderBackofficeView from "@/components/orders/OrderBackofficeView";

async function Detail({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const user = await requireRole(["admin"], `/admin/orders/${id}`);
  const [order, florists] = await Promise.all([getOrderForViewer(id, user), listFlorists()]);
  if (!order) notFound();
  return <OrderBackofficeView order={order} role="admin" florists={florists} selfId={user.id} />;
}

export default function AdminOrderPage(props: PageProps<"/admin/orders/[id]">) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <Link href="/admin" className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-rose">
        <ArrowLeft className="size-4" />
        訂單列表
      </Link>
      <Suspense fallback={<Loader2 className="mx-auto mt-10 size-5 animate-spin text-muted" />}>
        <Detail {...props} />
      </Suspense>
    </main>
  );
}
