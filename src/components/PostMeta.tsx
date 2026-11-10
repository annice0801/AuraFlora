import { CalendarDays, Clock } from "lucide-react";
import type { Post } from "@/lib/posts";

export function formatDate(date: string) {
  const [y, m, d] = date.split("-");
  return `${y} 年 ${Number(m)} 月 ${Number(d)} 日`;
}

export function PostMeta({ post }: { post: Post }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
      <span className="rounded-full bg-sage-soft px-3 py-0.5 text-sage">
        {post.category}
      </span>
      <span className="flex items-center gap-1">
        <CalendarDays className="size-4" aria-hidden />
        <time dateTime={post.date}>{formatDate(post.date)}</time>
      </span>
      <span className="flex items-center gap-1">
        <Clock className="size-4" aria-hidden />約 {post.readMinutes} 分鐘閱讀
      </span>
    </div>
  );
}
