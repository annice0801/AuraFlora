import { handwriting } from "@/lib/fonts";

export default function OrdersLayout({ children }: LayoutProps<"/orders">) {
  return <div className={`${handwriting.variable} flex flex-1 flex-col`}>{children}</div>;
}
