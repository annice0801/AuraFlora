import { handwriting } from "@/lib/fonts";

export default function GiftsLayout({ children }: LayoutProps<"/gifts">) {
  return <div className={`${handwriting.variable} flex flex-1 flex-col`}>{children}</div>;
}
