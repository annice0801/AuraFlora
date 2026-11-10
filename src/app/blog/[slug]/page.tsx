import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, Camera, Lightbulb } from "lucide-react";
import { getPost, posts, type Block } from "@/lib/posts";
import type { Photo } from "@/lib/photos";
import { PostMeta } from "@/components/PostMeta";

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
  };
}

function renderBlock(block: Block, index: number) {
  switch (block.type) {
    case "p":
      return (
        <p key={index} className="leading-loose">
          {block.text}
        </p>
      );
    case "h2":
      return (
        <h2 key={index} className="pt-6 font-serif text-2xl font-bold">
          {block.text}
        </h2>
      );
    case "list": {
      const ListTag = block.ordered ? "ol" : "ul";
      return (
        <ListTag
          key={index}
          className={`space-y-2 pl-6 leading-relaxed marker:text-rose ${
            block.ordered ? "list-decimal" : "list-disc"
          }`}
        >
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ListTag>
      );
    }
    case "image":
      return (
        <figure key={index} className="my-4">
          <Image
            src={block.photo.src}
            alt={block.photo.alt}
            width={block.photo.width}
            height={block.photo.height}
            sizes="(min-width: 768px) 720px, 100vw"
            className="max-h-[70vh] w-full rounded-xl object-cover"
          />
          <figcaption className="mt-2 text-center text-sm text-muted">
            {block.caption}
          </figcaption>
        </figure>
      );
    case "tip":
      return (
        <aside
          key={index}
          className="flex gap-3 rounded-xl border border-rose/20 bg-rose-soft p-5"
        >
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-rose" aria-hidden />
          <div>
            <p className="font-semibold text-rose">{block.title}</p>
            <p className="mt-1 leading-relaxed">{block.text}</p>
          </div>
        </aside>
      );
    case "table":
      return (
        <div key={index} className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-sage-soft text-sage">
              <tr>
                {block.head.map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row[0]} className="border-t border-line bg-surface">
                  {row.map((cell, i) => (
                    <td
                      key={i}
                      className={`px-4 py-3 ${i === 0 ? "font-medium" : "text-muted"}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

function photoCredits(post: { cover: Photo; body: Block[] }) {
  const all = [
    post.cover,
    ...post.body.flatMap((b) => (b.type === "image" ? [b.photo] : [])),
  ];
  return [...new Map(all.map((p) => [p.src, p])).values()];
}

// 參數放在 Suspense 裡讀取：已知文章會在建置時預先產生，未知網址則顯示 404
export default function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <PostContent params={params} />
    </Suspense>
  );
}

async function PostContent({
  params,
}: {
  params: PageProps<"/blog/[slug]">["params"];
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const others = posts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <main className="flex-1">
      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-rose"
        >
          <ArrowLeft className="size-4" aria-hidden />
          回到部落格
        </Link>

        <header className="mt-6 space-y-4">
          <h1 className="font-serif text-3xl font-bold leading-snug sm:text-4xl">
            {post.title}
          </h1>
          <PostMeta post={post} />
        </header>

        <Image
          src={post.cover.src}
          alt={post.cover.alt}
          width={post.cover.width}
          height={post.cover.height}
          priority
          sizes="(min-width: 768px) 720px, 100vw"
          className="mt-8 aspect-[16/10] w-full rounded-2xl object-cover"
        />

        <p className="mt-8 border-l-4 border-rose pl-4 text-lg leading-relaxed text-muted">
          {post.excerpt}
        </p>

        <div className="mt-8 space-y-5 text-[17px]">
          {post.body.map(renderBlock)}
        </div>

        <footer className="mt-14 border-t border-line pt-6 text-xs text-muted">
          <p className="flex items-center gap-1 font-medium">
            <Camera className="size-4" aria-hidden />
            圖片來源（Wikimedia Commons）
          </p>
          <ul className="mt-2 space-y-1">
            {photoCredits(post).map((photo) => (
              <li key={photo.src}>
                <a
                  href={photo.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-line underline-offset-2 hover:text-rose"
                >
                  {photo.alt}
                </a>
                ：{photo.author}，{photo.license}
              </li>
            ))}
          </ul>
        </footer>
      </article>

      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <h2 className="font-serif text-xl font-bold">繼續閱讀</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {others.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="group">
                <div className="relative aspect-[3/2] overflow-hidden rounded-xl">
                  <Image
                    src={p.cover.src}
                    alt={p.cover.alt}
                    fill
                    sizes="(min-width: 640px) 360px, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="mt-3 font-serif font-bold leading-snug group-hover:text-rose">
                  {p.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
