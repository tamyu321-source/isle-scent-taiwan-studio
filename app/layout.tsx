import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Yorke Hsu — Creative Developer", template: "%s — Yorke Hsu" },
  description: "Yorke Hsu 的前端作品集：互動品牌網站、產品系統與流程自動化。",
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/favicon.svg`,
    shortcut: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/favicon.svg`,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
