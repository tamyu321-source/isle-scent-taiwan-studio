"use client";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const links = [["香氣", "/collections"], ["品牌", "/story"], ["工藝", "/craft"], ["誌記", "/journal"], ["據點", "/stockists"]];
export function SiteHeader({ theme = "dark" }: { theme?: "dark" | "light" }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <>
      <header className="site-header fixed inset-x-0 top-0 z-50 text-chalk" data-theme={theme} data-open={open}>
        <div className="mx-auto grid h-[56px] max-w-[1500px] grid-cols-[1fr_auto_1fr] items-center px-5 md:px-12">
          <a href={`${basePath}/isle-scent/`} className="relative z-50 text-[.78rem] font-bold tracking-[.18em]" aria-label="嶼氣首頁">嶼 氣</a>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="主要導覽">{links.map(([label, href]) => <a key={href} href={`${basePath}${href}/`} className="text-sm opacity-70 transition-opacity hover:opacity-100">{label}</a>)}</nav>
          <div className="flex items-center justify-end gap-5">
            <a href={`${basePath}/contact/`} className="nav-contact hidden text-xs font-semibold md:inline-flex">聯絡合作</a>
            <button onClick={() => setOpen(!open)} className="relative z-50 grid h-11 w-11 place-items-center rounded-full outline-none focus-visible:ring-1 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent lg:hidden" aria-label={open ? "關閉選單" : "開啟選單"} aria-expanded={open} aria-controls="mobile-site-navigation">{open ? <X /> : <Menu />}</button>
          </div>
        </div>
      </header>

      {open && <nav id="mobile-site-navigation" className="mobile-site-nav fixed inset-0 z-[45] flex flex-col justify-end overflow-y-auto px-5 text-ink lg:hidden" aria-label="行動版導覽">
        <div className="mx-auto flex w-full max-w-3xl flex-col">
          {links.map(([label, href], index) => <a key={href} href={`${basePath}${href}/`} onClick={() => setOpen(false)} className="mobile-site-link border-t border-black/20 py-3 font-medium tracking-[-.05em]"><span className="mr-4 text-xs opacity-45">0{index + 1}</span>{label}</a>)}
          <a href={`${basePath}/contact/`} onClick={() => setOpen(false)} className="mobile-site-contact mt-6 inline-flex min-h-12 items-center justify-between border-t border-black/20 pt-5 text-sm font-semibold"><span>聯絡合作</span><span aria-hidden="true">→</span></a>
        </div>
      </nav>}
    </>
  );
}
