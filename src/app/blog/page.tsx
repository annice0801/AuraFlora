import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { posts } from "@/lib/posts";
import { photos } from "@/lib/photos";
import { PostMeta } from "@/components/PostMeta";
import Parallax from "@/components/motion/Parallax";

export const metadata: Metadata = {
  title: "部落格",
  description: "插花視覺技巧、花藝風格、作品類型、保鮮照護與四季花材。",
};

export default function BlogPage() {
  const [featured, ...rest] = posts;

  return (
    <main className="flex-1">
      <section className="relative isolate overflow-hidden">
        <Parallax speed={0.3} className="absolute inset-x-0 -top-[20%] -bottom-[20%] -z-10" innerClassName="relative h-full w-full">
          <Image src={photos.blogHero.src} alt={photos.blogHero.alt} fill priority sizes="100vw" className="object-cover" />
        </Parallax>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/60 via-black/30 to-black/10" />
        <div className="mx-auto max-w-5xl px-4 py-24 text-white sm:px-6 sm:py-32">
          <p className="text-sm tracking-[0.3em] uppercase opacity-90">
            AuraFlora Journal
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold sm:text-5xl">
            花藝部落格
          </h1>
          <p className="mt-4 max-w-xl text-lg opacity-90">
            從插花的視覺技巧到四季花材，陪你把花好好帶回生活裡。
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <Link
          href={`/blog/${featured.slug}`}
          className="group grid overflow-hidden rounded-2xl border border-line bg-surface md:grid-cols-2"
        >
          <div className="relative aspect-[4/3] md:aspect-auto">
            <Image
              src={featured.cover.src}
              alt={featured.cover.alt}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          </div>
          <div className="flex flex-col justify-center gap-4 p-6 sm:p-10">
            <span className="text-xs font-semibold tracking-widest text-rose">
              精選文章
            </span>
            <h2 className="font-serif text-2xl font-bold leading-snug sm:text-3xl">
              {featured.title}
            </h2>
            <p className="text-muted leading-relaxed">{featured.excerpt}</p>
            <PostMeta post={featured} />
            <span className="mt-2 flex items-center gap-1 text-sm font-medium text-rose">
              閱讀全文
              <ArrowRight
                className="size-4 transition group-hover:translate-x-1"
                aria-hidden
              />
            </span>
          </div>
        </Link>

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface"
            >
              <div className="relative aspect-[3/2] overflow-hidden">
                <Image
                  src={post.cover.src}
                  alt={post.cover.alt}
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-6">
                <h2 className="font-serif text-xl font-bold leading-snug group-hover:text-rose">
                  {post.title}
                </h2>
                <p className="flex-1 text-sm leading-relaxed text-muted">
                  {post.excerpt}
                </p>
                <PostMeta post={post} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
