"use client";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const links = [["香氣", "/collections"], ["品牌", "/story"], ["工藝", "/craft"], ["誌記", "/journal"], ["據點", "/stockists"]];
export function SiteHeader({ theme = "dark" }: { theme?: "dark" | "light" }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  const colors = theme === "dark" ? "text-chalk border-white/15" : "text-ink border-black/15";
  return (
    <header className={`absolute inset-x-0 top-0 z-50 border-b ${colors}`}>
      <div className="grid h-[76px] grid-cols-[1fr_auto_1fr] items-center px-5 md:px-12">
        <Link href="/" className="relative z-50 text-sm font-bold tracking-[.16em]" aria-label="嶼氣首頁">嶼 氣</Link>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="主要導覽">{links.map(([label, href]) => <Link key={href} href={href} className="text-sm opacity-70 transition-opacity hover:opacity-100">{label}</Link>)}</nav>
        <div className="flex items-center justify-end gap-5">
          <Link href="/contact" className="hidden text-sm md:block">聯絡合作</Link>
          <button onClick={() => setOpen(!open)} className="relative z-50 grid h-10 w-10 place-items-center lg:hidden" aria-label={open ? "關閉選單" : "開啟選單"} aria-expanded={open}>{open ? <X /> : <Menu />}</button>
        </div>
      </div>
      {open && <nav className="fixed inset-0 z-40 flex flex-col justify-end bg-ember px-5 pb-14 pt-24 text-ink" aria-label="行動版導覽">
        {links.map(([label, href], index) => <Link key={href} href={href} onClick={() => setOpen(false)} className="border-t border-black/20 py-4 text-4xl font-medium tracking-[-.05em]"><span className="mr-4 text-xs opacity-45">0{index + 1}</span>{label}</Link>)}
        <Link href="/contact" onClick={() => setOpen(false)} className="mt-10 text-sm font-semibold">聯絡合作 →</Link>
      </nav>}
    </header>
  );
}
