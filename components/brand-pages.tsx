import Image from "next/image";
import { ArrowLeft, ArrowUpRight, MapPin } from "lucide-react";
import { ScrollSequence } from "@/components/scroll-sequence";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type PageData = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: { label: string; title: string; body: string }[];
  tone?: "chalk" | "ember" | "mist";
};

const pages: Record<string, PageData> = {
  story: {
    eyebrow: "ABOUT ISLE / SCENT",
    title: "我們收集的，\n是地景的餘韻。",
    intro: "嶼氣誕生於一次沿著台灣東岸的緩慢旅行。我們不複製一座山或一片海，而是把人在其中感受到的溫度、濕度與距離，重新譯成氣味。",
    sections: [
      { label: "01 / ORIGIN", title: "從島嶼開始", body: "2019 年，兩位調香師與一位玻璃工匠在台北成立嶼氣。第一支香不是從公式開始，而是從一塊在南澳海邊撿到、曬過午後太陽的黑石開始。" },
      { label: "02 / PRACTICE", title: "讓季節留下差異", body: "我們保留天然原料在不同批次裡的微小變化。氣味不需要永遠相同，它可以像雨季與旱季，維持輪廓，也保留當下。" },
      { label: "03 / PROMISE", title: "少一點，久一點", body: "小批次製作、可回收玻璃與無塑外包裝。每一項選擇都指向同一件事：讓作品被長久使用，而非快速被替換。" },
    ],
  },
  craft: {
    eyebrow: "THE CRAFT",
    title: "時間，才是\n最後一種原料。",
    intro: "從萃取、熟成到裝瓶，一支嶼氣需要經過 112 天。我們刻意讓製程慢下來，讓尖銳的部分沉澱，留下清楚而有空間的輪廓。",
    sections: [
      { label: "DAY 01—21", title: "低溫萃取", body: "以較低溫度保留檜木、茶葉與花材的細緻層次，避免高溫造成的焦苦與單一。" },
      { label: "DAY 22—91", title: "靜置熟成", body: "在恆溫避光環境中等待原料彼此靠近。這段時間無法被加速，也是每一批作品最安靜的階段。" },
      { label: "DAY 92—112", title: "手工裝瓶", body: "逐瓶檢視玻璃、色澤與噴霧量，再由工匠完成封裝。瓶身的不規則切面，取自海岸岩石被長年沖刷的輪廓。" },
    ],
    tone: "mist",
  },
  ingredients: {
    eyebrow: "ISLAND MATERIALS",
    title: "嗅覺裡的\n島嶼標本。",
    intro: "原料不是產地清單，而是一段長期關係。我們走進林場、茶園與沿海聚落，理解每一種材料如何生長，也理解什麼時候不該採集。",
    sections: [
      { label: "MOUNTAIN / 1,800M", title: "台灣檜木", body: "乾淨、冷冽，帶著近似鉛筆木與薄荷的細線條。只使用合法林業的修枝與回收木料蒸餾。" },
      { label: "FOOTHILLS / 600M", title: "焙火烏龍", body: "茶梗、煙與微甜果香，為木質結構帶來溫度。我們與南投的小型茶廠共同調整焙火程度。" },
      { label: "EAST COAST / 0M", title: "海鹽分子", body: "不是鹹味，而是濕潤空氣停在皮膚上的礦物感。以分子香材重建，避免直接採取脆弱海岸資源。" },
    ],
  },
  spaces: {
    eyebrow: "SCENT FOR SPACES",
    title: "為空間，留下\n一段看不見的光。",
    intro: "我們為旅宿、藝廊、餐飲與私人住宅設計專屬氣味。從空間材質、光線與人的動線開始，讓香氣成為建築的一部分。",
    sections: [
      { label: "01 / LISTEN", title: "空間閱讀", body: "現場理解尺度、通風、材質與使用節奏，確認氣味真正需要出現的位置。" },
      { label: "02 / FORM", title: "氣味設計", body: "建立三組方向，透過現地測試調整擴散、濃度與停留時間，直到嗅覺與空間彼此吻合。" },
      { label: "03 / LIVE", title: "長期維護", body: "提供擴香設備、季節微調與定期補充，讓氣味隨空間生長，而不是一次性的裝飾。" },
    ],
    tone: "ember",
  },
};

const notes = [
  { date: "2026.08.17", category: "FIELD NOTE 07", title: "沿著立霧溪，記錄石頭的溫度", href: "/journal/field-note-07" },
  { date: "2026.06.03", category: "MATERIAL 04", title: "一批春季焙火烏龍的氣味剖面", href: "/ingredients" },
  { date: "2026.03.21", category: "CONVERSATION 02", title: "與玻璃工匠談不完美的輪廓", href: "/craft" },
];

const products = [
  { code: "O-01", name: "深 潮", family: "潮汐・木質調", color: "#202526" },
  { code: "M-02", name: "霧 林", family: "苔蘚・綠意調", color: "#5d6960" },
  { code: "T-03", name: "餘 火", family: "茶煙・琥珀調", color: "#9b5537" },
];

function internalHref(path: string) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${basePath}${path}${path.endsWith("/") ? "" : "/"}`;
}

function Intro({ page }: { page: PageData }) {
  return <><section className="page-intro"><div className="page-shell w-full"><p className="eyebrow text-white/45">{page.eyebrow}</p><h1 className="mt-6 whitespace-pre-line text-[clamp(3.4rem,8vw,8.8rem)] font-medium leading-[.87] tracking-[-.07em]">{page.title}</h1></div></section><section className={`px-5 py-20 md:px-12 md:py-28 ${page.tone === "ember" ? "bg-ember" : page.tone === "mist" ? "bg-mist" : "bg-chalk"}`}><div className="page-shell grid gap-8 md:grid-cols-[.65fr_1.35fr]"><p className="eyebrow opacity-45">IN BRIEF</p><p className="max-w-3xl text-[clamp(1.5rem,2.8vw,2.7rem)] leading-[1.35] tracking-[-.035em]">{page.intro}</p></div></section></>;
}

export function EditorialPage({ page }: { page: PageData }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return <main><SiteHeader /><Intro page={page} />{page === pages.ingredients && <figure className="relative aspect-[16/8] min-h-[360px]"><Image src={`${basePath}/images/island-botanicals.webp`} alt="雨後山林原料標本" fill className="object-cover" sizes="100vw" /></figure>}<section className="bg-chalk px-5 py-20 md:px-12 md:py-28"><div className="page-shell">{page.sections.map(section => <article key={section.label} className="detail-grid"><p className="eyebrow pt-2 opacity-45">{section.label}</p><div className="grid gap-6 md:grid-cols-[.85fr_1fr]"><h2 className="text-[clamp(2rem,4vw,4.3rem)] font-medium leading-none tracking-[-.055em]">{section.title}</h2><p className="max-w-xl text-base leading-8 text-ink/60">{section.body}</p></div></article>)}</div></section><SiteFooter /></main>;
}

export function CollectionsPage() {
  return <main className="bg-chalk"><SiteHeader /><section className="page-intro"><div className="page-shell w-full"><p className="eyebrow text-white/45">THE COLLECTION</p><h1 className="mt-6 text-[clamp(4rem,10vw,11rem)] font-medium leading-[.8] tracking-[-.08em]">三段地景，<br />三種靠近。</h1></div></section><section className="px-5 py-20 md:px-12 md:py-28"><div className="page-shell grid gap-px bg-black/15 md:grid-cols-3">{products.map((product, index) => <a href={internalHref(index === 0 ? "/collections/o-01" : "/contact")} key={product.code} className="group relative flex aspect-[3/4] flex-col justify-between overflow-hidden p-7 text-chalk md:p-9" style={{ background: product.color }}><div className="absolute inset-0 opacity-50 transition-transform duration-700 group-hover:scale-110" style={{ background: "radial-gradient(circle at 70% 35%, rgba(255,255,255,.2), transparent 28%), linear-gradient(155deg, transparent 50%, rgba(0,0,0,.5))" }} /><p className="eyebrow relative opacity-45">{product.code}</p><div className="relative"><p className="mb-3 text-sm opacity-55">{product.family}</p><h2 className="text-[clamp(3rem,5vw,5.8rem)] font-medium leading-none tracking-[-.07em]">{product.name}</h2><span className="mt-7 inline-flex items-center gap-2 text-sm">查看香氣 <ArrowUpRight size={16} /></span></div></a>)}</div></section><SiteFooter /></main>;
}

export function ProductPage() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <main className="overflow-clip bg-ink text-chalk">
      <SiteHeader />

      <section className="product-hero relative min-h-[100svh] overflow-hidden bg-black">
        <Image
          src={`${basePath}/images/coast-bottle.webp`}
          alt="海岸晨光中的 O-01 深潮香水"
          fill
          priority
          className="product-hero-image object-cover"
          sizes="100vw"
        />
        <div className="product-hero-shade absolute inset-0" aria-hidden="true" />

        <div className="product-hero-content relative z-10 mx-auto flex min-h-[100svh] max-w-[1500px] flex-col px-5 pb-8 pt-24 md:px-12 md:pb-12 md:pt-28">
          <div className="product-hero-kicker flex items-center justify-between border-b border-white/20 pb-4 text-[.7rem] font-semibold tracking-[.2em] text-white/60">
            <span>O—01 / EAU DE PARFUM</span>
            <span>50 ML · 2026</span>
          </div>

          <div className="product-hero-title my-auto text-center">
            <p className="mb-4 text-[clamp(1rem,1.8vw,1.35rem)] font-medium tracking-[.16em] text-white/65">潮汐・木質調</p>
            <h1 className="text-[clamp(6rem,18vw,17rem)] font-semibold leading-[.72] tracking-[-.095em]">深潮</h1>
            <p className="mx-auto mt-8 max-w-lg text-[clamp(1.05rem,2vw,1.45rem)] leading-relaxed text-white/75">島嶼的黑潮，穿過茶火與林線，最後落在肌膚上。</p>
          </div>

          <div className="product-hero-footer flex flex-col gap-5 border-t border-white/20 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-sm text-sm leading-6 text-white/55">海鹽 · 焙火烏龍 · 台灣檜木</p>
            <a href="#sequence" className="button-light">觀看氣味展開 <ArrowUpRight size={16} /></a>
          </div>
        </div>
      </section>

      <ScrollSequence />

      <section className="product-manifesto bg-chalk px-5 py-28 text-ink md:px-12 md:py-44">
        <div className="reveal-block mx-auto max-w-[1300px]">
          <p className="eyebrow text-ink/40">THE COMPOSITION</p>
          <h2 className="mt-8 max-w-[13ch] text-[clamp(3.6rem,8.6vw,9.2rem)] font-semibold leading-[.9] tracking-[-.07em]">不是海洋香，<br />是潮水退去後<br />留下的溫度。</h2>
          <div className="mt-16 grid gap-8 border-t border-black/18 pt-7 md:grid-cols-[1fr_1fr]">
            <p className="max-w-lg text-[clamp(1.25rem,2.2vw,2rem)] leading-relaxed tracking-[-.025em]">明亮只停留片刻。O—01 很快轉向茶煙、濕木與岩石，把乾淨的鹹味收進更深的輪廓。</p>
            <p className="max-w-xl text-base leading-8 text-ink/58 md:justify-self-end">我們以冷杉和礦物分子重建海風，再讓焙火烏龍帶出體溫。最後的台灣檜木不是厚重木頭，而是一道貼近皮膚的乾燥線條。</p>
          </div>
        </div>
      </section>

      <section className="product-landscape relative min-h-[100svh] overflow-hidden">
        <Image src={`${basePath}/images/island-botanicals.webp`} alt="雨後岩石上的檜木、茶葉與蘭花" fill className="product-landscape-image object-cover" sizes="100vw" />
        <div className="product-landscape-shade absolute inset-0" aria-hidden="true" />
        <div className="reveal-block relative z-10 mx-auto flex min-h-[100svh] max-w-[1500px] flex-col justify-between px-5 py-16 md:px-12 md:py-24">
          <p className="eyebrow text-white/55">THREE TEMPERATURES</p>
          <div>
            <p className="product-landscape-words text-[clamp(4.8rem,15vw,14rem)] font-semibold leading-[.72] tracking-[-.09em]">冷 · 火 · 木</p>
            <p className="mt-10 max-w-lg text-lg leading-8 text-white/68">不是依序出現的三種香調，而是同時存在的三種溫度。</p>
          </div>
        </div>
      </section>

      <section className="bg-black px-5 py-28 md:px-12 md:py-40">
        <div className="mx-auto max-w-[1500px]">
          <div className="reveal-block flex flex-col gap-8 border-b border-white/18 pb-14 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow text-white/40">SCENT ARCHITECTURE</p>
              <h2 className="mt-6 text-[clamp(3.4rem,7vw,7.5rem)] font-semibold leading-[.86] tracking-[-.07em]">從第一秒，<br />到第八小時。</h2>
            </div>
            <p className="max-w-md text-base leading-8 text-white/55">香氣不一次說完。每一層都在前一層退去時，留下自己的輪廓。</p>
          </div>

          <div className="product-note-grid grid md:grid-cols-3">
            {[
              ["00:00", "海鹽 / 冷杉", "一道冷光，帶著礦物與潮濕空氣。"],
              ["01:30", "焙火烏龍", "茶梗、薄煙與肌膚升起的暖意。"],
              ["08:00", "檜木 / 濕苔", "安靜、乾燥，最後貼近身體。"],
            ].map(([time, title, body], index) => (
              <article key={time} className="reveal-block border-b border-white/18 py-10 md:border-b-0 md:border-r md:px-8 md:py-14 first:md:pl-0 last:md:border-r-0 last:md:pr-0">
                <p className="text-sm tracking-[.16em] text-white/35">{String(index + 1).padStart(2, "0")} / {time}</p>
                <h3 className="mt-16 text-[clamp(2.2rem,4vw,4.2rem)] font-medium leading-none tracking-[-.055em]">{title}</h3>
                <p className="mt-6 max-w-sm text-base leading-8 text-white/52">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ember px-5 py-28 text-ink md:px-12 md:py-44">
        <div className="reveal-block mx-auto max-w-[1250px] text-center">
          <p className="eyebrow text-ink/45">O—01 / 深潮</p>
          <h2 className="mx-auto mt-7 max-w-[10ch] text-[clamp(4rem,10vw,10rem)] font-semibold leading-[.84] tracking-[-.08em]">讓地景，<br />留在身上。</h2>
          <a href={internalHref("/contact")} className="button-dark mt-12">預約試香 <ArrowUpRight size={16} /></a>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

export function JournalPage() {
  return <main><SiteHeader /><section className="page-intro"><div className="page-shell w-full"><p className="eyebrow text-white/45">FIELD NOTES</p><h1 className="mt-6 text-[clamp(5rem,12vw,13rem)] font-medium leading-[.75] tracking-[-.09em]">誌 記</h1></div></section><section className="bg-chalk px-5 py-20 md:px-12 md:py-28"><div className="page-shell">{notes.map((note) => <a href={internalHref(note.href)} key={note.title} className="group grid gap-5 border-t border-black/15 py-8 md:grid-cols-[.25fr_.35fr_1fr_auto] md:items-center"><span className="text-sm opacity-45">{note.date}</span><span className="eyebrow opacity-45">{note.category}</span><h2 className="text-[clamp(1.7rem,3vw,3.5rem)] font-medium tracking-[-.05em]">{note.title}</h2><ArrowUpRight className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></a>)}</div></section><SiteFooter /></main>;
}

export function ArticlePage() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return <main><SiteHeader /><article><section className="page-intro min-h-[88svh]"><div className="page-shell w-full"><a href={internalHref("/journal")} className="mb-10 inline-flex items-center gap-2 text-sm text-white/45"><ArrowLeft size={16} /> 返回誌記</a><p className="eyebrow text-white/45">FIELD NOTE 07 · 2026.08.17</p><h1 className="mt-6 max-w-6xl text-[clamp(3.3rem,8vw,8.6rem)] font-medium leading-[.86] tracking-[-.07em]">沿著立霧溪，<br />記錄石頭的溫度。</h1></div></section><figure className="relative aspect-[16/8] min-h-[380px]"><Image src={`${basePath}/images/island-botanicals.webp`} alt="雨霧中的溪谷與島嶼植物" fill className="object-cover" sizes="100vw" /></figure><div className="bg-chalk px-5 py-20 md:px-12 md:py-28"><div className="mx-auto max-w-3xl space-y-9 text-lg leading-9 text-ink/70"><p className="text-[clamp(1.8rem,3.4vw,3rem)] leading-[1.4] tracking-[-.035em] text-ink">雨停後的太魯閣，岩壁並不安靜。水沿著每一條裂隙移動，冷杉、苔蘚與石灰岩在空氣裡彼此重疊。</p><p>我們在清晨五點進入溪谷。不是為了採集，而是記錄：濕度、風向、石頭被陽光碰到前後的氣味差異。嗅覺有時比攝影更接近記憶，因為它保留了當時身體所在的位置。</p><p>這些筆記後來成為 O-01 的第三個版本。我們刪掉原先太明亮的柑橘，把礦物與檜木之間留出更多空氣。成品不像太魯閣，卻保存了那一天最重要的事——霧散去以前，石頭是有溫度的。</p></div></div></article><SiteFooter /></main>;
}

export function StockistsPage() {
  const stores = [["台北", "嶼氣研究室", "大安區新生南路一段 103 巷"], ["台中", "留白計畫", "西區中興街 247 號"], ["台南", "霧室", "中西區信義街 38 號"], ["高雄", "海線選物", "鹽埕區大勇路 11 號"]];
  return <main><SiteHeader /><section className="page-intro"><div className="page-shell w-full"><p className="eyebrow text-white/45">STOCKISTS</p><h1 className="mt-6 text-[clamp(4rem,9vw,9.5rem)] font-medium leading-[.82] tracking-[-.08em]">靠近氣味，<br />從一次試聞開始。</h1></div></section><section className="bg-mist px-5 py-20 md:px-12 md:py-28"><div className="page-shell"><p className="mb-16 max-w-2xl text-xl leading-9">以下合作空間備有全系列試香。氣味會因肌膚與環境改變，我們建議停留至少二十分鐘，再決定哪一道地景屬於你。</p>{stores.map(([city, name, address]) => <div key={name} className="grid gap-3 border-t border-black/20 py-6 md:grid-cols-[.35fr_1fr_1fr_auto] md:items-center"><p className="eyebrow opacity-45">{city}</p><h2 className="text-3xl font-medium tracking-[-.04em]">{name}</h2><p className="text-sm opacity-55">{address}</p><MapPin size={18} className="opacity-50" /></div>)}</div></section><SiteFooter /></main>;
}

export function ContactPage() {
  return <main><SiteHeader /><section className="flex min-h-[100svh] items-end bg-ember px-5 pb-14 pt-32 text-ink md:px-12 md:pb-20"><div className="page-shell w-full"><p className="eyebrow opacity-45">CONTACT / COLLABORATION</p><h1 className="mt-6 max-w-[11ch] text-[clamp(4rem,10vw,11rem)] font-medium leading-[.8] tracking-[-.085em]">一起，為空間留下氣味。</h1><div className="mt-16 grid gap-8 border-t border-black/20 pt-7 md:grid-cols-[1fr_1fr]"><p className="max-w-lg text-lg leading-8 opacity-65">品牌合作、空間氣味、媒體與試香預約，請告訴我們時間、地點與你正在想像的感受。</p><div className="md:text-right"><a href="mailto:studio@islescent.tw" className="text-[clamp(1.4rem,3vw,3rem)] font-medium tracking-[-.04em] underline decoration-1 underline-offset-8">studio@islescent.tw</a><p className="mt-4 text-sm opacity-50">通常於 2 個工作日內回覆</p></div></div></div></section><SiteFooter /></main>;
}

export function StoryPage() {
  return <EditorialPage page={pages.story} />;
}

export function CraftPage() {
  return <EditorialPage page={pages.craft} />;
}

export function IngredientsPage() {
  return <EditorialPage page={pages.ingredients} />;
}

export function SpacesPage() {
  return <EditorialPage page={pages.spaces} />;
}
