import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "嶼氣 ISLE / SCENT", template: "%s — 嶼氣 ISLE / SCENT" },
  description: "取自台灣山海地景的獨立香氛。讓氣味成為抵達一座島的方法。",
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/favicon.svg`,
    shortcut: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/favicon.svg`,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
