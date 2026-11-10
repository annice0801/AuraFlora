import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { requireRole } from "@/lib/session";
import { getOrderForViewer } from "@/lib/order-queries";
import OrderBackofficeView from "@/components/orders/OrderBackofficeView";

async function Detail({ params }: PageProps<"/florist/orders/[id]">) {
  const { id } = await params;
  const user = await requireRole(["florist", "admin"], `/florist/orders/${id}`);
  const order = await getOrderForViewer(id, user);
  if (!order || !order.workOrder) notFound();
  return <OrderBackofficeView order={order} role={user.role === "admin" ? "admin" : "florist"} />;
}

export default function FloristOrderPage(props: PageProps<"/florist/orders/[id]">) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <Link href="/florist" className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-rose">
        <ArrowLeft className="size-4" />
        花店工單
      </Link>
      <Suspense fallback={<Loader2 className="mx-auto mt-10 size-5 animate-spin text-muted" />}>
        <Detail {...props} />
      </Suspense>
    </main>
  );
}
