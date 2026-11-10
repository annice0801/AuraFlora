"use client";

import { useState, useTransition } from "react";
import { Ban, Crown, Loader2, LogOut, RotateCcw } from "lucide-react";
import { revokeSessions, setBanned, setUserRole } from "@/app/actions/users";
import type { AdminUserRow } from "@/lib/users";
import type { Role } from "@/lib/session";

const ROLE_OPTIONS: { id: Role; name: string }[] = [
  { id: "member", name: "一般會員" },
  { id: "florist", name: "合作花店" },
  { id: "admin", name: "管理員" },
];
const PROVIDER: Record<string, string> = { google: "Google", line: "LINE" };

function ago(iso: string | null) {
  if (!iso) return "從未";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "剛剛";
  if (mins < 60) return `${mins} 分鐘前`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} 小時前`;
  return `${Math.round(h / 24)} 天前`;
}

export default function UsersTable({ users, selfId }: { users: AdminUserRow[]; selfId: string }) {
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = (id: string, fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusyId(id);
    setError(null);
    start(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error ?? "操作失敗");
      setBusyId(null);
    });
  };

  return (
    <div>
      {error && <p className="mb-3 rounded-xl bg-rose-soft px-4 py-2 text-sm text-rose">{error}</p>}
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="bg-background text-left text-xs text-muted">
            <tr>
              <th className="px-4 py-2.5 font-normal">會員</th>
              <th className="px-4 py-2.5 font-normal">登入方式</th>
              <th className="px-4 py-2.5 font-normal">狀態</th>
              <th className="px-4 py-2.5 font-normal">最近活動</th>
              <th className="px-4 py-2.5 font-normal">訂單</th>
              <th className="px-4 py-2.5 font-normal">角色權限</th>
              <th className="px-4 py-2.5 text-right font-normal">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const locked = u.isOwner || u.id === selfId;
              const busy = pending && busyId === u.id;
              return (
                <tr key={u.id} className={`border-t border-line ${u.banned ? "bg-background/70 text-muted" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-rose-soft text-xs text-rose">
                        {u.image ? (
                          // eslint-disable-next-line @next/next/no-img-element -- Google／LINE 頭像
                          <img src={u.image} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          u.name.slice(0, 1)
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1 font-medium">
                          {u.name}
                          {u.isOwner && <Crown className="size-3.5 text-amber-500" aria-label="擁有者" />}
                          {u.id === selfId && <span className="text-[10px] text-muted">（你）</span>}
                        </p>
                        <p className="truncate text-xs text-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">{u.providers.map((p) => PROVIDER[p] ?? p).join("、") || "—"}</td>
                  <td className="px-4 py-3">
                    {u.banned ? (
                      <span className="rounded-full bg-rose-soft px-2 py-0.5 text-xs text-rose">已停權</span>
                    ) : u.activeSessions > 0 ? (
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        登入中・{u.activeSessions} 個裝置
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-muted">
                        <span className="size-2 rounded-full bg-line" />
                        未登入
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {ago(u.lastActiveAt)}
                    <p className="text-muted">加入 {new Date(u.createdAt).toLocaleDateString("zh-TW")}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {u.orderCount} 筆
                    {u.paidTotal > 0 && <p className="text-muted">NT$ {u.paidTotal.toLocaleString()}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      disabled={locked || busy || u.banned}
                      onChange={(e) => act(u.id, () => setUserRole(u.id, e.target.value as Role))}
                      className="rounded-lg border border-line bg-background px-2 py-1 text-xs disabled:opacity-60"
                      title={u.isOwner ? "擁有者由 OWNER_EMAILS 設定" : undefined}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {busy && <Loader2 className="size-4 animate-spin text-muted" />}
                      {!locked && u.activeSessions > 0 && (
                        <button
                          onClick={() => act(u.id, () => revokeSessions(u.id))}
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted hover:bg-background hover:text-foreground"
                          title="登出這位會員的所有裝置"
                        >
                          <LogOut className="size-3.5" />
                          強制登出
                        </button>
                      )}
                      {!locked &&
                        (u.banned ? (
                          <button
                            onClick={() => act(u.id, () => setBanned(u.id, false))}
                            disabled={busy}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-sage hover:bg-sage-soft"
                          >
                            <RotateCcw className="size-3.5" />
                            解除停權
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const reason = window.prompt(`停權「${u.name}」的原因（會記錄在操作紀錄）`);
                              if (reason !== null) act(u.id, () => setBanned(u.id, true, reason));
                            }}
                            disabled={busy}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-rose hover:bg-rose-soft"
                          >
                            <Ban className="size-3.5" />
                            停權
                          </button>
                        ))}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!users.length && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  沒有符合條件的會員
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
