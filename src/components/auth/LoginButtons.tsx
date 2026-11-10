"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type Provider = "google" | "line";

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function LineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="currentColor"
        d="M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.3 7.9.3.1.8.2.9.5.1.3.1.7 0 1l-.1.9c0 .3-.2 1 .9.5s5.9-3.5 8.1-6C21.4 14.3 22 12.7 22 11c0-4.4-4.5-8-10-8zM8.1 13.4H6.2c-.3 0-.5-.2-.5-.5V9.1c0-.3.2-.5.5-.5s.5.2.5.5v3.3h1.4c.3 0 .5.2.5.5s-.2.5-.5.5zm2 -.5c0 .3-.2.5-.5.5s-.5-.2-.5-.5V9.1c0-.3.2-.5.5-.5s.5.2.5.5zm4.6 0c0 .2-.1.4-.3.5h-.2c-.2 0-.3-.1-.4-.2l-1.9-2.6v2.3c0 .3-.2.5-.5.5s-.5-.2-.5-.5V9.1c0-.2.1-.4.3-.5h.2c.2 0 .3.1.4.2l1.9 2.6V9.1c0-.3.2-.5.5-.5s.5.2.5.5zm3.1-2.4c.3 0 .5.2.5.5s-.2.5-.5.5h-1.4v.9h1.4c.3 0 .5.2.5.5s-.2.5-.5.5h-1.9c-.3 0-.5-.2-.5-.5V9.1c0-.3.2-.5.5-.5h1.9c.3 0 .5.2.5.5s-.2.5-.5.5h-1.4v.9z"
      />
    </svg>
  );
}

export default function LoginButtons({ providers }: { providers: Record<Provider, boolean> }) {
  const next = safeNext(useSearchParams().get("next"));
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (provider: Provider) => {
    setPending(provider);
    setError(null);
    const { error } = await authClient.signIn.social({ provider, callbackURL: next, errorCallbackURL: "/login" });
    if (error) {
      setError(error.message ?? "登入失敗，請再試一次");
      setPending(null);
    }
  };

  return (
    <div className="mt-8 space-y-3">
      <button
        onClick={() => signIn("google")}
        disabled={!providers.google || pending !== null}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-white py-3 text-sm font-medium text-[#1f1f1f] shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending === "google" ? <Loader2 className="size-5 animate-spin" /> : <GoogleIcon />}
        使用 Google 帳號登入
        {!providers.google && <span className="text-xs text-muted">（尚未開放）</span>}
      </button>
      <button
        onClick={() => signIn("line")}
        disabled={!providers.line || pending !== null}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#06C755] py-3 text-sm font-medium text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending === "line" ? <Loader2 className="size-5 animate-spin" /> : <LineIcon />}
        使用 LINE 登入
        {!providers.line && <span className="text-xs opacity-80">（尚未開放）</span>}
      </button>
      {error && <p className="text-center text-sm text-rose">{error}</p>}
    </div>
  );
}
