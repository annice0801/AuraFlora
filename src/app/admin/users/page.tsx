import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Loader2, Search } from "lucide-react";
import { requireRole } from "@/lib/session";
import { listUsers, recentAudit } from "@/lib/users";
import AdminNav from "@/components/orders/AdminNav";
import UsersTable from "@/components/admin/UsersTable";

export const metadata: Metadata = { title: "會員與權限", robots: { index: false } };

const ROLE_FILTERS = [
  { id: "", label: "全部" },
  { id: "admin", label: "管理員" },
  { id: "florist", label: "合作花店" },
  { id: "member", label: "一般會員" },
  { id: "banned", label: "已停權" },
];

async function Users({ searchParams }: PageProps<"/admin/users">) {
  const me = await requireRole(["admin"], "/admin/users");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : "";
  const role = typeof sp.role === "string" ? sp.role : "";
  const [users, audit] = await Promise.all([listUsers({ q, role }), recentAudit()]);
  const qs = (r: string) => `/admin/users?${new URLSearchParams({ ...(q ? { q } : {}), ...(r ? { role: r } : {}) })}`;

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {ROLE_FILTERS.map((f) => (
            <Link
              key={f.id}
              href={qs(f.id)}
              className={`rounded-full border px-3 py-1 text-sm ${role === f.id ? "border-rose bg-rose text-white" : "border-line text-muted hover:text-foreground"}`}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <form action="/admin/users" className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-1.5">
          <Search className="size-4 text-muted" aria-hidden />
          {role && <input type="hidden" name="role" value={role} />}
          <input name="q" defaultValue={q} placeholder="搜尋姓名或 Email" className="w-48 bg-transparent text-sm outline-none" />
        </form>
      </div>
      <p className="mt-4 mb-2 text-xs text-muted">
        共 {users.length} 位。擁有者（皇冠標記）由 .env.local 的 OWNER_EMAILS 決定，無法在後台修改；變更角色後該會員需要重新登入。
      </p>
      <UsersTable users={users} selfId={me.id} />

      <section className="mt-10">
        <h2 className="font-medium">權限操作紀錄</h2>
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface text-sm">
          {audit.map((a, i) => (
            <li key={`${a.at}-${i}`} className="flex flex-wrap items-baseline gap-x-3 px-4 py-2.5">
              <span className="text-xs text-muted">{new Date(a.at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false })}</span>
              <span>
                <strong className="font-medium">{a.actor}</strong> {a.action} {a.target}
              </span>
              {a.detail && <span className="text-xs text-muted">{a.detail}</span>}
            </li>
          ))}
          {!audit.length && <li className="px-4 py-6 text-center text-muted">還沒有操作紀錄</li>}
        </ul>
      </section>
    </>
  );
}

export default function AdminUsersPage(props: PageProps<"/admin/users">) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <AdminNav active="users" />
      <Suspense fallback={<Loader2 className="mx-auto mt-10 size-5 animate-spin text-muted" />}>
        <Users {...props} />
      </Suspense>
    </main>
  );
}
