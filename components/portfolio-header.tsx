"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const links = [["WORK", "#work"], ["ABOUT", "#about"], ["CONTACT", "#contact"]];

export function PortfolioHeader() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const href = (hash: string) => `${basePath}/${hash}`;

  return (
    <header className="portfolio-header">
      <a className="portfolio-monogram" href={`${basePath}/`} aria-label="Yorke Hsu 作品集首頁">Y/H</a>
      <nav className="portfolio-nav" aria-label="作品集導覽">
        {links.map(([label, hash]) => <a key={hash} href={href(hash)}>{label}</a>)}
      </nav>
      <a className="portfolio-header-github" href="https://github.com/tamyu321-source" target="_blank" rel="noreferrer">GITHUB <ArrowUpRight size={15} /></a>
      <button className="portfolio-menu-button" type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "關閉選單" : "開啟選單"}>{open ? <X /> : <Menu />}</button>
      {open && (
        <nav className="portfolio-mobile-nav" aria-label="行動版作品集導覽">
          {links.map(([label, hash], index) => <a key={hash} href={href(hash)} onClick={() => setOpen(false)}><span>0{index + 1}</span>{label}</a>)}
          <a href="https://github.com/tamyu321-source" target="_blank" rel="noreferrer">GITHUB <ArrowUpRight /></a>
        </nav>
      )}
    </header>
  );
}
