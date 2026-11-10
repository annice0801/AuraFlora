import { handwriting } from "@/lib/fonts";

export default function Layout({ children }: LayoutProps<"/florist">) {
  return <div className={`${handwriting.variable} flex flex-1 flex-col`}>{children}</div>;
}
