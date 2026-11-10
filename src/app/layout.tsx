import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Noto_Serif_TC } from "next/font/google";
import SiteHeader, { HeaderShell } from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSerifTC = Noto_Serif_TC({
  variable: "--font-noto-serif-tc",
  weight: ["500", "700"],
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "AuraFlora",
    template: "%s｜AuraFlora",
  },
  description: "AuraFlora：每日限量時令花材包、代客送花與禮贈配送、風格策展靈感與 3D 互動花室。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-Hant-TW"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSerifTC.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense fallback={<HeaderShell />}>
          <SiteHeader />
        </Suspense>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
