"use client";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const links = [["香氣", "/collections"], ["品牌", "/story"], ["工藝", "/craft"], ["誌記", "/journal"], ["據點", "/stockists"]];
export function SiteHeader({ theme = "dark" }: { theme?: "dark" | "light" }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const [open, setOpen] = useState(false);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  return (
    <header className="site-header fixed inset-x-0 top-0 z-50 text-chalk" data-theme={theme}>
      <div className="mx-auto grid h-[56px] max-w-[1500px] grid-cols-[1fr_auto_1fr] items-center px-5 md:px-12">
        <a href={`${basePath}/isle-scent/`} className="relative z-50 text-[.78rem] font-bold tracking-[.18em]" aria-label="嶼氣首頁">嶼 氣</a>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="主要導覽">{links.map(([label, href]) => <a key={href} href={`${basePath}${href}/`} className="text-sm opacity-70 transition-opacity hover:opacity-100">{label}</a>)}</nav>
        <div className="flex items-center justify-end gap-5">
          <a href={`${basePath}/contact/`} className="nav-contact hidden text-xs font-semibold md:block">聯絡合作</a>
          <button onClick={() => setOpen(!open)} className="relative z-50 grid h-10 w-10 place-items-center lg:hidden" aria-label={open ? "關閉選單" : "開啟選單"} aria-expanded={open}>{open ? <X /> : <Menu />}</button>
        </div>
      </div>
      {open && <nav className="fixed inset-0 z-40 flex flex-col justify-end bg-ember px-5 pb-14 pt-24 text-ink" aria-label="行動版導覽">
        {links.map(([label, href], index) => <a key={href} href={`${basePath}${href}/`} onClick={() => setOpen(false)} className="border-t border-black/20 py-4 text-4xl font-medium tracking-[-.05em]"><span className="mr-4 text-xs opacity-45">0{index + 1}</span>{label}</a>)}
        <a href={`${basePath}/contact/`} onClick={() => setOpen(false)} className="mt-10 text-sm font-semibold">聯絡合作 →</a>
      </nav>}
    </header>
  );
}
