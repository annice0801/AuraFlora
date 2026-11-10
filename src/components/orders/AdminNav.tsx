import Link from "next/link";

export default function AdminNav({ active }: { active: "orders" | "users" }) {
  const tab = (id: string, href: string, label: string) => (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 text-sm ${active === id ? "bg-foreground text-background" : "text-muted hover:text-foreground"}`}
    >
      {label}
    </Link>
  );
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="font-serif text-3xl font-bold">管理後台</h1>
      <nav className="flex gap-1 rounded-full border border-line bg-surface p-1">
        {tab("orders", "/admin", "訂單與派單")}
        {tab("users", "/admin/users", "會員與權限")}
      </nav>
    </div>
  );
}
