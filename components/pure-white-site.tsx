"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ArrowDown, Menu, Plus, X } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const photo = (name: string) => `${base}/images/pure-white-${name}.webp`;
const links = [["我們的堅持", "#philosophy"], ["慢工製法", "#craft"], ["日常滋養", "#ritual"], ["品嚐純粹", "#yogurt"]];
const sizes = [
  { id: "cup", name: "日常杯", weight: "150g", english: "A MOMENT FOR YOURSELF", text: "剛剛好的份量，留一點時間給自己。從早餐到午後，一杯純粹，慢慢享用。" },
  { id: "jar", name: "分享罐", weight: "450g", english: "GOOD THINGS, SHARED", text: "把喜歡的放進冰箱，和家人分著吃。多一點份量，讓每個人的餐桌都有自己的搭配。" },
];
const rituals = [
  { id: "morning", tab: "好好吃早餐", title: "讓早晨，慢一點開始。", intro: "優格的濃厚，水果的清爽，再添一點穀物的口感。不趕時間的一碗，就是照顧自己的開始。", items: ["原味希臘優格", "當季水果", "燕麥與堅果"], note: "先鋪優格，再放上喜歡的水果，最後撒上燕麥。留住各自的口感，也留住每個早晨的小小期待。" },
  { id: "afternoon", tab: "留一點午後", title: "把休息，也排進日常。", intro: "忙碌之間，替自己留一個小小的空檔。用一杯冰涼的原味優格，搭配喜歡的莓果，享受清爽的酸香。", items: ["原味希臘優格", "新鮮莓果", "一點自己的時間"], note: "不一定要加很多配料。先嚐一口原味，感受鮮乳與發酵交織的風味，再慢慢搭配。" },
  { id: "table", tab: "一起上餐桌", title: "甜的之外，也有新發現。", intro: "原味優格，不只適合水果。拌入香草、橄欖油與少許鹽，讓柔滑的酸香，成為餐桌上的另一種風景。", items: ["原味希臘優格", "橄欖油與香草", "麵包或烤蔬菜"], note: "將優格拌成簡單的沾醬，搭配麵包與烤蔬菜。濃厚的口感，也可以用清爽的方式上桌。" },
];
const questions = [
  ["希臘優格，為什麼這麼濃厚？", "希臘優格在發酵後，多了一道過濾程序，分離部分乳清，留下更濃厚、細緻的質地。對 PURE WHITE 來說，好口感來自製程的耐心。"],
  ["「無加糖」和「無糖」一樣嗎？", "不一樣。無加糖指配方沒有額外添加糖，乳品本身仍可能含有天然乳糖，不代表完全無糖。實際成分與糖含量，請以商品包裝的營養標示為準。"],
  ["原味優格可以怎麼搭配？", "喜歡清爽，可以加當季水果；喜歡口感，可以搭配燕麥或堅果。也能拌入香草與少許鹽，當作麵包或烤蔬菜的沾醬。先嚐原味，再找到你喜歡的搭配。"],
  ["如何保存，才能好好享用？", "請依實際包裝標示保持冷藏，避免長時間放在室溫下，並使用乾淨的湯匙取用。開封後的保存期限、過敏原與營養資訊，皆以實際商品標示為準。"],
];

function Wordmark({ footer = false }: { footer?: boolean }) {
  return <a className={`bb-logo ${footer ? "bb-logo-footer" : ""}`} href="#pure-white-top" aria-label="PURE WHITE 首頁"><strong>PURE<br />WHITE</strong><span>手作<br />希臘優格</span></a>;
}

export function PureWhiteSite() {
  const root = useRef<HTMLElement>(null);
  const detailsTrigger = useRef<HTMLButtonElement>(null);
  const menuDestination = useRef<string | null>(null);
  const [size, setSize] = useState("cup");
  const [details, setDetails] = useState(false);
  const selected = sizes.find(item => item.id === size) ?? sizes[0];

  useEffect(() => {
    const elements = Array.from(root.current?.querySelectorAll<HTMLElement>(".bb-reveal") ?? []);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;
    const prepare = () => {
      observer?.disconnect();
      elements.forEach(el => el.removeAttribute("data-enter"));
      if (media.matches || !("IntersectionObserver" in window)) return;
      observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { (entry.target as HTMLElement).dataset.enter = "visible"; observer?.unobserve(entry.target); }
      }), { threshold: 0.08 });
      elements.forEach(el => { if (el.getBoundingClientRect().top > window.innerHeight * .95) { el.dataset.enter = "pending"; observer?.observe(el); } });
    };
    prepare(); media.addEventListener("change", prepare);
    return () => { observer?.disconnect(); media.removeEventListener("change", prepare); elements.forEach(el => el.removeAttribute("data-enter")); };
  }, []);

  return <main ref={root} className="pure-white-root" id="pure-white-top">
    <a className="bb-skip" href="#philosophy">跳至品牌內容</a>
    <header className="bb-header">
      <Wordmark />
      <nav aria-label="品牌導覽">{links.slice(0, 3).map(([label, href]) => <a href={href} key={href}>{label}</a>)}</nav>
      <div className="bb-header-actions"><a className="bb-nav-cta" href="#yogurt">品嚐純粹 <ArrowUpRight size={16} /></a>
        <Sheet><SheetTrigger className="bb-menu-button" aria-label="開啟導覽選單"><Menu size={23} /></SheetTrigger><SheetContent className="bb-menu bb-dialog" showCloseButton={false} onCloseAutoFocus={event => {
          const destination = menuDestination.current;
          menuDestination.current = null;
          if (!destination) return;
          event.preventDefault();
          // Navigate after the sheet releases its scroll lock; do not refocus the top menu button.
          requestAnimationFrame(() => {
            const section = root.current?.querySelector<HTMLElement>(destination);
            section?.setAttribute("tabindex", "-1");
            section?.focus({ preventScroll: true });
            section?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
          });
        }}>
          <SheetClose className="bb-menu-close" aria-label="關閉選單"><X /></SheetClose><SheetTitle>PURE WHITE</SheetTitle><SheetDescription>純粹，自有厚度。</SheetDescription>
          <nav aria-label="行動版品牌導覽">{links.map(([label, href], i) => <SheetClose asChild key={href}><a href={href} onClick={() => { menuDestination.current = href; }}><small>0{i + 1}</small>{label}<ArrowUpRight size={20} /></a></SheetClose>)}</nav>
          <a className="bb-back-link" href={`${base}/#work`}>回到作品集 ↗</a>
        </SheetContent></Sheet>
      </div>
    </header>

    <section className="bb-hero" aria-labelledby="bb-title">
      <div className="bb-hero-copy"><p className="bb-eyebrow">GREEK YOGURT. HONESTLY CRAFTED.</p><h1 id="bb-title"><span>純粹，</span><span>自有<em>厚度。</em></span></h1><p className="bb-hero-lead">把多餘的，留給時間。<br />把好的，留在每一口。</p><a className="bb-button" href="#philosophy">從一口純粹開始 <ArrowUpRight size={18} /></a><div className="bb-hero-bottom"><span>鮮乳・乳酸菌・手作的耐心</span><a href="#philosophy" aria-label="向下探索品牌"><ArrowDown size={20} /></a></div></div>
      <div className="bb-hero-photo"><Image src={photo("hero")} alt="藍色桌面上，湯匙舀起一口濃厚細緻的原味希臘優格" width={1122} height={1402} priority sizes="(max-width:650px) 100vw, 54vw" /><div className="bb-photo-seal"><span>MADE SLOWLY</span><strong>濃厚，<br />來自耐心。</strong><span>ENJOY SIMPLY</span></div><div className="bb-photo-caption"><span>PLAIN. PURE. BEAUTIFULLY THICK.</span><span>01 — ORIGINAL</span></div></div>
    </section>
    <div className="bb-promise-strip"><span>NOTHING EXTRA. EVERYTHING ESSENTIAL.</span><span>原味無加糖</span><i /><span>小批次手作</span><i /><span>慢慢過濾的濃厚</span></div>

    <section id="philosophy" className="bb-intro bb-reveal">
      <p className="bb-eyebrow">01 / THE BEAUTY OF LESS</p><h2>越單純，<br />越值得<em>好好製作。</em></h2>
      <p>鮮乳的香，發酵的酸，手工過濾後的濃厚。<br />我們相信，一杯好優格，不需要說得太多。<br />只要把每一件小事，認真做到剛剛好。</p>
      <div className="bb-values">
        <article><span>01</span><h3>純粹，從原料開始。</h3><p>鮮乳與乳酸菌，就是原味的起點。<br />把配方留白，讓食物自己說話。</p></article>
        <article><span>02</span><h3>濃厚，交給時間。</h3><p>慢慢發酵，細心過濾。<br />每一道工序，都是風味的一部分。</p></article>
        <article><span>03</span><h3>營養，回到日常。</h3><p>不追求複雜的吃法。<br />把一份乳品，放進好好吃飯的日常。</p></article>
      </div>
    </section>

    <section id="craft" className="bb-craft">
      <div className="bb-section-heading bb-reveal"><p className="bb-eyebrow">02 / CRAFTED, NEVER RUSHED.</p><h2>有些厚度，<br />只能<em>慢慢來。</em></h2><p>手作不是一個形容詞。<br />是每一次等待、每一道確認，<br />和每一批都不省略的細心。</p></div>
      <div className="bb-craft-layout">
        <figure className="bb-craft-photo bb-reveal"><Image src={photo("craft")} alt="手作職人以乾淨手套與濾布，細心過濾濃厚的希臘優格" width={1448} height={1086} sizes="(max-width:750px) 100vw, 58vw" /><figcaption><span>THE HANDS BEHIND EVERY SPOONFUL.</span><span>手作的溫度，藏在細節裡。</span></figcaption></figure>
        <ol className="bb-process">
          <li className="bb-reveal"><span>01 / BEGIN WITH MILK</span><h3>從鮮乳，開始。</h3><p>一切從簡單的原料開始。保留乳香的本質，是我們對原味的第一份堅持。</p></li>
          <li className="bb-reveal"><span>02 / GIVE IT TIME</span><h3>把風味，交給發酵。</h3><p>讓乳酸菌慢慢工作，等待酸香與乳香找到平衡。好的風味，不需要催促。</p></li>
          <li className="bb-reveal"><span>03 / STRAIN WITH CARE</span><h3>細心過濾，留下濃厚。</h3><p>透過濾布分離部分乳清，再用雙手照料每一批細節。讓一口的厚度，剛剛好。</p></li>
        </ol>
      </div>
      <div className="bb-craft-signature bb-reveal"><p>不多加一點什麼。<br />只多用一點心。</p><span>A LITTLE LESS.<br />A LITTLE MORE CARE.</span></div>
    </section>

    <section id="yogurt" className="bb-yogurt">
      <div className="bb-yogurt-copy bb-reveal"><p className="bb-eyebrow">03 / THE ORIGINAL</p><h2>原味，<br />就很<em>有味。</em></h2><p className="bb-yogurt-description">先感受細緻的酸，接著是鮮乳的香。<br />不靠甜味搶戲，把每一口留給純粹。</p><div className="bb-product-name"><h3>原味無加糖希臘優格</h3><span>PLAIN GREEK YOGURT</span></div>
        <Tabs value={size} onValueChange={setSize} className="bb-size-tabs"><TabsList aria-label="選擇優格規格">{sizes.map(item => <TabsTrigger value={item.id} key={item.id}>{item.name} <span>{item.weight}</span></TabsTrigger>)}</TabsList>{sizes.map(item => <TabsContent value={item.id} key={item.id}><p>{item.text}</p></TabsContent>)}</Tabs>
        <button ref={detailsTrigger} className="bb-button bb-button-white" onClick={() => setDetails(true)}>認識這一杯 <Plus size={18} /></button><p className="bb-product-note">概念商品展示 · 尚未開放購買</p>
      </div>
      <div className="bb-yogurt-visual bb-reveal"><div className="bb-yogurt-arch"><Image src={photo("hero")} alt="原味希臘優格細緻、濃厚的質地" width={1122} height={1402} sizes="(max-width:750px) 90vw, 45vw" /></div><p><span>鮮乳 × 乳酸菌</span><span>THE SIMPLEST THINGS, DONE WELL.</span></p></div>
    </section>

    <section id="ritual" className="bb-ritual">
      <div className="bb-section-heading bb-reveal"><p className="bb-eyebrow">04 / NOURISH THE EVERYDAY</p><h2>好好吃，<br />就是<em>好好生活。</em></h2><p>營養，不必複雜。<br />搭配當季水果與全穀食物，<br />把照顧自己，放進每一天。</p></div>
      <div className="bb-ritual-layout bb-reveal"><figure><Image src={photo("ritual")} alt="原味優格搭配藍莓、無花果與燕麥，旁邊放著麵包和藍色餐巾" width={1536} height={1024} sizes="(max-width:850px) 100vw, 60vw" /><figcaption>一碗日常，也可以很美。 / A SIMPLE DAILY RITUAL</figcaption></figure>
        <Tabs defaultValue="morning" className="bb-ritual-tabs"><TabsList aria-label="日常品嚐提案">{rituals.map(item => <TabsTrigger key={item.id} value={item.id}>{item.tab}</TabsTrigger>)}</TabsList>{rituals.map(item => <TabsContent key={item.id} value={item.id}><span className="bb-eyebrow">A SPOONFUL OF EVERYDAY</span><h3>{item.title}</h3><p>{item.intro}</p><ul>{item.items.map(ingredient => <li key={ingredient}>{ingredient}</li>)}</ul><p className="bb-recipe-note">{item.note}</p></TabsContent>)}</Tabs>
      </div>
    </section>

    <section id="questions" className="bb-questions bb-reveal"><div><p className="bb-eyebrow">A FEW GOOD QUESTIONS</p><h2>關於這一口，<br />你可能想知道。</h2><p>把想問的事，也說得單純一點。</p></div><Accordion type="single" collapsible className="bb-accordion">{questions.map(([title, answer], i) => <AccordionItem value={String(i)} key={title}><AccordionTrigger>{title}</AccordionTrigger><AccordionContent>{answer}</AccordionContent></AccordionItem>)}</Accordion></section>

    <footer className="bb-footer"><div className="bb-footer-top"><div><p className="bb-eyebrow">PURE FOOD. THOUGHTFULLY MADE.</p><h2>留白，是為了<br />裝進更好的日常。</h2></div><div className="bb-footer-links"><div><span>慢慢探索</span>{links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</div><div><span>保持聯繫</span><a href="mailto:tamyu321@gmail.com?subject=PURE%20WHITE%20品牌網站合作洽詢">品牌網站合作 ↗</a><a href="https://line.me/ti/p/um2wrmZxsN" target="_blank" rel="noreferrer">LINE 洽詢 ↗</a><a href={`${base}/#work`}>回到作品集 ↗</a></div></div></div>
      <p className="bb-footer-wordmark" aria-label="PURE WHITE">PURE WHITE</p><div className="bb-footer-bottom"><p>© 2026 PURE WHITE · 希臘優格品牌概念作品</p><p>產品、規格與製程影像為概念示意，非實際販售商品；營養與保存資訊以正式上市標示為準。</p><a href="#pure-white-top">回到頂端 ↑</a></div>
    </footer>

    <Dialog open={details} onOpenChange={setDetails}><DialogContent className="bb-dialog bb-product-dialog" showCloseButton={false} onCloseAutoFocus={event => { event.preventDefault(); detailsTrigger.current?.focus(); }}><DialogClose className="bb-menu-close" aria-label="關閉商品介紹"><X size={20} /></DialogClose><p className="bb-eyebrow">THE ORIGINAL / {selected.english}</p><DialogTitle>原味無加糖希臘優格</DialogTitle><DialogDescription>{selected.name} · {selected.weight} · 概念商品規格</DialogDescription><Image src={photo("hero")} alt="原味希臘優格質地示意" width={1122} height={1402} sizes="(max-width:600px) 90vw, 580px" /><p>{selected.text}</p><dl><div><dt>配方概念</dt><dd>鮮乳、乳酸菌</dd></div><div><dt>風味</dt><dd>柔和乳香、細緻酸香，濃厚滑順</dd></div><div><dt>過敏原</dt><dd>含乳製品；配料過敏原請依實際包裝確認</dd></div><div><dt>保存方式</dt><dd>依實際包裝標示冷藏，使用乾淨餐具取用</dd></div></dl><p className="bb-dialog-note">這是品牌網站概念作品，尚無上市商品或檢驗數據。此處不提供營養數值或健康功效宣稱，也不接受實際訂購。</p><button className="bb-button" onClick={() => setDetails(false)}>繼續探索 PURE WHITE <ArrowUpRight size={17} /></button></DialogContent></Dialog>
  </main>;
}
