"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flower2, Menu, X } from "lucide-react";
import UserMenu from "@/components/auth/UserMenu";
import { NAV } from "./nav";

/** 手機選單開啟時鎖住背景捲動 */
function lockScroll(locked: boolean) {
  document.body.style.overflow = locked ? "hidden" : "";
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-serif text-xl font-bold tracking-wide">
      <Flower2 className="size-5 text-rose" aria-hidden />
      AuraFlora
    </Link>
  );
}

/** 靜態外框：在讀取路徑前先顯示，避免版面跳動 */
export function HeaderShell() {
  return (
    <header className="sticky top-0 z-40 h-16 border-b border-transparent">
      <div className="mx-auto flex h-full max-w-6xl items-center px-4 sm:px-6">
        <Logo />
      </div>
    </header>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  const home = pathname === "/";

  // 換頁時自動關閉手機選單
  if (open && openedAt !== pathname) setOpen(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    lockScroll(open);
    return () => lockScroll(false);
  }, [open]);

  // 首頁在最上方時透明，捲動後變成霧面底色
  const solid = scrolled || !home || open;
  return (
    <header
      className={`sticky top-0 z-40 h-16 transition-colors duration-500 ${
        solid ? "border-b border-line bg-background/85 backdrop-blur-md" : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm md:flex" aria-label="主要選單">
          {NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(`${n.href}/`);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`relative py-1 transition-colors ${active ? "text-foreground" : "text-muted hover:text-foreground"}`}
              >
                {n.label}
                <span
                  className={`absolute inset-x-0 -bottom-0.5 h-px origin-left bg-rose transition-transform duration-300 ${active ? "scale-x-100" : "scale-x-0"}`}
                />
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <UserMenu />
          <button
            onClick={() => {
              setOpen((v) => !v);
              setOpenedAt(pathname);
            }}
            className="rounded-full p-2 text-foreground md:hidden"
            aria-label={open ? "關閉選單" : "開啟選單"}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* 手機版全螢幕選單 */}
      <div
        className={`fixed inset-x-0 top-16 bottom-0 bg-background transition-all duration-500 md:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <nav className="flex h-full flex-col px-6 pt-10 pb-12" aria-label="手機選單">
          {NAV.map((n, i) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={`border-b border-line py-5 font-serif text-3xl font-bold transition-all duration-500 ${
                open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              } ${pathname.startsWith(n.href) ? "text-rose" : ""}`}
              style={{ transitionDelay: open ? `${80 + i * 60}ms` : "0ms" }}
            >
              {n.label}
            </Link>
          ))}
          <p className="mt-auto text-xs tracking-[0.3em] text-muted uppercase">AuraFlora・把花，好好帶回生活裡</p>
        </nav>
      </div>
    </header>
  );
}
