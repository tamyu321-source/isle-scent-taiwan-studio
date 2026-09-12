"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  isYogurtSize,
  portfolioHome,
  servingIdeas,
  yogurtHome,
  yogurtImage,
  yogurtProduct,
  yogurtQuestions,
  yogurtSizes,
  type YogurtSize,
} from "./pure-white-content";

export function PureWhiteHeader({ product = false }: { product?: boolean }) {
  const destination = useRef<string | null>(null);
  const links = product
    ? [
        ["產品細節", "#details"],
        ["規格與成分", "#specifications"],
        ["日常搭配", "#ritual"],
      ]
    : [
        ["原料與質地", "#ingredients"],
        ["慢工製法", "#craft"],
        ["日常搭配", "#ritual"],
      ];

  return (
    <>
      <a className="pw-skip" href={product ? "#details" : "#ingredients"}>
        跳至主要內容
      </a>
      <header className="pw-header">
        <a
          className="pw-wordmark"
          href={yogurtHome}
          aria-label="PURE WHITE 首頁"
        >
          PURE WHITE<span>手作希臘優格</span>
        </a>
        <nav aria-label="品牌導覽">
          {links.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <div className="pw-header-actions">
          <a
            className="pw-small-button"
            href={product ? "#specifications" : "#yogurt"}
          >
            選擇規格
          </a>
          <Sheet>
            <SheetTrigger className="pw-menu-trigger" aria-label="開啟導覽選單">
              <Menu size={22} />
            </SheetTrigger>
            <SheetContent
              className="pw-menu"
              showCloseButton={false}
              onCloseAutoFocus={(event) => {
                const hash = destination.current;
                destination.current = null;
                if (!hash) return;
                event.preventDefault();
                requestAnimationFrame(() => {
                  const target = document.getElementById(hash.slice(1));
                  target?.setAttribute("tabindex", "-1");
                  target?.focus({ preventScroll: true });
                  target?.scrollIntoView({
                    behavior: "instant",
                    block: "start",
                  });
                });
              }}
            >
              <SheetClose className="pw-menu-close" aria-label="關閉導覽選單">
                <X size={24} />
              </SheetClose>
              <SheetTitle>PURE WHITE</SheetTitle>
              <SheetDescription>原味希臘優格</SheetDescription>
              <nav aria-label="行動版品牌導覽">
                {links.map(([label, href]) => (
                  <SheetClose asChild key={href}>
                    <a
                      href={href}
                      onClick={() => {
                        destination.current = href;
                      }}
                    >
                      {label}
                      <ArrowUpRight size={20} />
                    </a>
                  </SheetClose>
                ))}
                <a href={product ? yogurtHome : yogurtProduct}>
                  {product ? "回到品牌首頁" : "認識原味優格"}
                  <ArrowUpRight size={20} />
                </a>
              </nav>
              <a className="pw-menu-portfolio" href={portfolioHome}>
                回到作品集 ↗
              </a>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  );
}

export function ProductSelection({ detail = false }: { detail?: boolean }) {
  const [size, setSize] = useState<YogurtSize>("cup");
  const selected = yogurtSizes.find((item) => item.id === size)!;

  useEffect(() => {
    if (!detail) return;
    const restoreSize = () => {
      const requested = new URLSearchParams(window.location.search).get("size");
      setSize(isYogurtSize(requested) ? requested : "cup");
    };
    restoreSize();
    window.addEventListener("popstate", restoreSize);
    return () => window.removeEventListener("popstate", restoreSize);
  }, [detail]);

  const selectSize = (value: string) => {
    if (!isYogurtSize(value)) return;
    setSize(value);
    if (detail) {
      const url = new URL(window.location.href);
      url.searchParams.set("size", value);
      window.history.replaceState(window.history.state, "", url);
    }
  };

  return (
    <section
      id={detail ? "specifications" : "yogurt"}
      className="pw-selection pw-shell"
      aria-labelledby="pw-size-title"
    >
      <div className="pw-selection-visual">
        {yogurtSizes.map((item) => (
          <Image
            key={item.id}
            src={yogurtImage(item.id)}
            alt={`${item.name} ${item.weight} 原味希臘優格`}
            width={1254}
            height={1254}
            sizes="(max-width: 760px) 100vw, 50vw"
            data-selected={item.id === size}
            aria-hidden={item.id !== size}
          />
        ))}
      </div>
      <div className="pw-selection-copy">
        <p className="pw-eyebrow">THE ORIGINAL</p>
        <h2 id="pw-size-title">
          同一份原味。
          <br />
          兩種日常。
        </h2>
        <p className="pw-selection-name">原味無加糖希臘優格</p>
        <Tabs value={size} onValueChange={selectSize} className="pw-size-tabs">
          <TabsList aria-label="選擇優格規格">
            {yogurtSizes.map((item) => (
              <TabsTrigger key={item.id} value={item.id}>
                {item.name}
                <span>{item.weight}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {yogurtSizes.map((item) => (
            <TabsContent key={item.id} value={item.id}>
              <h3>{item.occasion}</h3>
              <p>{item.description}</p>
            </TabsContent>
          ))}
        </Tabs>
        <p className="pw-size-summary">
          {selected.name} · {selected.weight} · 原味無加糖
        </p>
        {!detail && (
          <a className="pw-button" href={`${yogurtProduct}?size=${size}`}>
            探索產品細節 <ArrowUpRight size={18} />
          </a>
        )}
        {detail && (
          <a className="pw-text-link" href="#ingredients">
            查看成分與保存方式 <ArrowUpRight size={17} />
          </a>
        )}
      </div>
    </section>
  );
}

export function DailyRitual() {
  const [serving, setServing] = useState(servingIdeas[0].id);
  const selected = servingIdeas.find((item) => item.id === serving)!;

  return (
    <section
      id="ritual"
      className="pw-ritual pw-shell"
      aria-labelledby="pw-ritual-title"
    >
      <div className="pw-section-heading">
        <p className="pw-eyebrow">AT YOUR TABLE</p>
        <h2 id="pw-ritual-title">原味，好搭。</h2>
        <p>從早餐到餐桌，用你喜歡的方式。</p>
      </div>
      <div className="pw-ritual-layout">
        <figure>
          <Image
            src={yogurtImage(selected.image)}
            alt={
              serving === "afternoon"
                ? "湯匙舀起濃厚原味優格"
                : "原味優格搭配水果、穀物與麵包的餐桌提案"
            }
            width={1536}
            height={1024}
            sizes="(max-width: 760px) 100vw, 55vw"
          />
          <figcaption>FRESH FROM YOUR KITCHEN.</figcaption>
        </figure>
        <Tabs
          value={serving}
          onValueChange={setServing}
          className="pw-serving-tabs"
        >
          <TabsList aria-label="選擇品嚐情境">
            {servingIdeas.map((item) => (
              <TabsTrigger key={item.id} value={item.id}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {servingIdeas.map((item) => (
            <TabsContent key={item.id} value={item.id}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <p className="pw-ingredients-line">{item.ingredients}</p>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

export function YogurtQuestions() {
  return (
    <section
      className="pw-questions pw-shell"
      aria-labelledby="pw-questions-title"
    >
      <div>
        <p className="pw-eyebrow">GOOD TO KNOW</p>
        <h2 id="pw-questions-title">再多了解一點。</h2>
      </div>
      <Accordion type="single" collapsible className="pw-accordion">
        {yogurtQuestions.map(([question, answer], index) => (
          <AccordionItem key={question} value={String(index)}>
            <AccordionTrigger>{question}</AccordionTrigger>
            <AccordionContent>{answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

export function PureWhiteFooter() {
  return (
    <footer className="pw-footer">
      <div className="pw-footer-top">
        <a className="pw-wordmark" href={yogurtHome}>
          PURE WHITE<span>手作希臘優格</span>
        </a>
        <nav aria-label="頁尾導覽">
          <a href={yogurtProduct}>原味優格</a>
          <a href={`${yogurtHome}#craft`}>慢工製法</a>
          <a href={portfolioHome}>
            回到作品集 <ArrowUpRight size={16} />
          </a>
        </nav>
      </div>
      <p className="pw-footer-type" aria-hidden="true">
        PURE WHITE.
      </p>
      <div className="pw-footer-bottom">
        <span>© 2026 PURE WHITE</span>
        <p>
          品牌概念作品，產品與製程影像為示意，尚未開放販售。實際成分、營養及保存期限以商品標示為準。
        </p>
        <a href="#pure-white-top">回到頂端 ↑</a>
      </div>
    </footer>
  );
}
