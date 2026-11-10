import Link from "next/link";
import { Flower2 } from "lucide-react";

const COLUMNS = [
  {
    title: "自用送禮",
    links: [
      { href: "/gifts#self", label: "每日限量花材包" },
      { href: "/gifts#gift", label: "代客送花預約" },
      { href: "/gifts#quality", label: "品質履約承諾" },
    ],
  },
  {
    title: "探索",
    links: [
      { href: "/curation", label: "風格策展" },
      { href: "/studio", label: "互動花室" },
      { href: "/blog", label: "花藝部落格" },
    ],
  },
  {
    title: "會員",
    links: [
      { href: "/login", label: "登入／註冊" },
      { href: "/orders", label: "我的訂單" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="mt-auto bg-[#24201c] text-[#e9e2d8]">
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-10 sm:px-6">
        <div className="grid gap-12 md:grid-cols-[1.4fr_2fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 font-serif text-2xl font-bold">
              <Flower2 className="size-6 text-[#e08a92]" aria-hidden />
              AuraFlora
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#b8ada0]">
              每天限量的時令花材，給自己的療癒時光；講究質感的禮贈配送，替你把心意準時送到。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((c) => (
              <div key={c.title}>
                <p className="text-xs tracking-[0.25em] text-[#8f8478]">{c.title}</p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-[#e9e2d8] transition-colors hover:text-[#e08a92]">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p
          aria-hidden
          className="mt-16 overflow-hidden font-serif text-[clamp(3.5rem,15vw,11rem)] leading-none font-bold tracking-tight whitespace-nowrap text-[#2f2a25] select-none"
        >
          AuraFlora
        </p>
        <div className="mt-6 flex flex-col gap-2 border-t border-[#3a332d] pt-6 text-xs text-[#8f8478] sm:flex-row sm:justify-between">
          <p>© {2026} AuraFlora. 付款服務由綠界科技 ECPay 提供。</p>
          <p>實景照片來自 Wikimedia Commons（CC0／CC BY-SA，各頁附作者）・3D 花材為程式生成</p>
        </div>
      </div>
    </footer>
  );
}
