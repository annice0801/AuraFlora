import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Camera, Check } from "lucide-react";
import { giftCatalog, OCCASIONS } from "@/data/gifts";
import { getGiftProduct } from "@/lib/flora/getGifts";
import QualityBadges from "@/components/gifts/QualityBadges";
import GiftOrderForm from "@/components/gifts/GiftOrderFormLoader";

export function generateStaticParams() {
  return giftCatalog.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/gifts/[slug]">): Promise<Metadata> {
  const product = await getGiftProduct((await params).slug);
  return product ? { title: product.name, description: product.tagline } : {};
}

// 讀取網址參數放在 Suspense 內：已知商品在建置時預先產生
export default function GiftProductPage({ params }: PageProps<"/gifts/[slug]">) {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: { params: PageProps<"/gifts/[slug]">["params"] }) {
  const { slug } = await params;
  const product = await getGiftProduct(slug);
  if (!product) notFound();
  const occasion = OCCASIONS.find((o) => o.id === product.occasion);

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link href={`/gifts#${product.occasion}`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-rose">
          <ArrowLeft className="size-4" aria-hidden />
          {occasion?.name}
        </Link>
        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_1.15fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative overflow-hidden rounded-3xl">
              <Image
                src={product.image.url!}
                alt={product.image.alt}
                width={product.image.width}
                height={product.image.height}
                sizes="(min-width: 1024px) 520px, 100vw"
                priority
                className="h-auto w-full"
              />
            </div>
            <p className="mt-2 flex items-center gap-1 text-[11px] text-muted">
              <Camera className="size-3.5" aria-hidden />
              情境示意照片：
              <a href={product.image.source} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                {product.image.author}
              </a>
              ，{product.image.license}。實際花材依季節與配方卡製作，出貨前會拍照讓你核對。
            </p>
            <h1 className="mt-6 font-serif text-3xl leading-snug font-bold">{product.name}</h1>
            <p className="mt-2 text-muted">{product.tagline}</p>
            <p className="mt-4 leading-relaxed">{product.description}</p>
            <ul className="mt-4 space-y-1.5">
              {product.includes.map((i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="size-4 text-sage" aria-hidden />
                  {i}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <QualityBadges compact />
            </div>
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold">配送管家・預約表單</h2>
            <p className="mt-1 mb-6 text-sm text-muted">填寫一次就好，付款後由特約花店接手製作。</p>
            <GiftOrderForm product={product} />
          </div>
        </div>
      </div>
    </main>
  );
}
