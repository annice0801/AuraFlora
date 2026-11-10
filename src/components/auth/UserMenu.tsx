"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardList, LayoutDashboard, LogOut, Package } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function UserMenu() {
  const { data, isPending } = authClient.useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const userId = data?.user.id;

  // 角色（管理員由伺服器端 OWNER_EMAILS 判斷），決定選單顯示哪些後台入口
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => alive && setRole(d.user?.role ?? null))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  if (isPending) return <span className="inline-block size-8" aria-hidden />;

  if (!data) {
    const next = pathname === "/login" ? "/" : pathname;
    return (
      <Link
        href={`/login?next=${encodeURIComponent(next)}`}
        className="rounded-full border border-line px-3 py-1.5 text-sm text-foreground hover:border-rose/50"
      >
        登入
      </Link>
    );
  }

  const { user } = data;
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-rose-soft text-sm font-medium text-rose"
        aria-label="會員選單"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- 來自 Google／LINE 的頭像網址
          <img src={user.image} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          user.name.slice(0, 1)
        )}
      </button>
      {open && (
        <div className="absolute top-10 right-0 z-30 w-56 rounded-xl border border-line bg-surface p-2 shadow-lg">
          <p className="truncate px-2 pt-1 text-sm font-medium">{user.name}</p>
          <p className="truncate px-2 pb-2 text-xs text-muted">{user.email}</p>
          <Link href="/orders" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-background">
            <Package className="size-4" aria-hidden />
            我的訂單
          </Link>
          {role === "admin" && (
            <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-background">
              <LayoutDashboard className="size-4" aria-hidden />
              管理後台
            </Link>
          )}
          {(role === "florist" || role === "admin") && (
            <Link href="/florist" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-background">
              <ClipboardList className="size-4" aria-hidden />
              花店工單
            </Link>
          )}
          <button
            onClick={async () => {
              await authClient.signOut();
              setOpen(false);
              router.push("/");
              router.refresh();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-background"
          >
            <LogOut className="size-4" aria-hidden />
            登出
          </button>
        </div>
      )}
    </div>
  );
}
