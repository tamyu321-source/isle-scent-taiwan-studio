import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ScrollSequence } from "@/components/scroll-sequence";

export const dynamic = "force-static";

export default function Home() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <main>
      <SiteHeader theme="dark" />

      <section className="hero relative flex min-h-[100svh] items-end overflow-hidden bg-ink px-5 pb-12 text-chalk md:px-12 md:pb-16">
        <div className="hero-haze" aria-hidden="true" />
        <div className="relative z-10 grid w-full gap-10 border-t border-white/20 pt-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="eyebrow text-white/55">O-01 · EAU DE PARFUM</p>
            <h1 className="mt-4 max-w-[12ch] text-[clamp(3.2rem,9.3vw,9.8rem)] font-medium leading-[.84] tracking-[-.075em]">
              島嶼留下的，<br />從不是氣味。
            </h1>
          </div>
          <div className="max-w-xs md:pb-2">
            <p className="text-base leading-7 text-white/70">
              黑潮穿過岩岸，檜木與茶煙停在皮膚上。沿著滾動，讓氣味慢慢顯影。
            </p>
            <a className="link-arrow mt-6 inline-flex text-sm" href="#sequence">
              探索 O-01 <span>↓</span>
            </a>
          </div>
        </div>
      </section>

      <ScrollSequence />

      <section className="bg-chalk px-5 py-24 text-ink md:px-12 md:py-36">
        <div className="mx-auto grid max-w-[1500px] gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-24">
          <div className="flex flex-col justify-between">
            <div>
              <p className="eyebrow text-ink/45">FROM THE ISLAND</p>
              <h2 className="mt-5 text-[clamp(2.8rem,6vw,6.8rem)] font-medium leading-[.91] tracking-[-.06em]">
                每一道氣味，<br />都有地形。
              </h2>
            </div>
            <a className="link-arrow mt-12 w-fit" href={`${basePath}/ingredients/`}>
              查看島嶼原料 <ArrowUpRight size={17} />
            </a>
          </div>
          <figure className="image-frame aspect-[16/10] overflow-hidden bg-stone-900">
            <Image src={`${basePath}/images/island-botanicals.png`} alt="雨後岩石上的檜木、茶葉與蘭花" fill className="object-cover transition-transform duration-1000 hover:scale-[1.02]" sizes="(max-width: 1024px) 100vw, 60vw" />
          </figure>
        </div>
      </section>

      <section className="grid min-h-[90svh] bg-stone-950 text-chalk lg:grid-cols-2">
        <figure className="relative min-h-[62svh] overflow-hidden">
          <Image src={`${basePath}/images/coast-bottle.png`} alt="海霧岩岸上的 O-01 香水瓶" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
        </figure>
        <div className="flex flex-col justify-between px-5 py-14 md:px-12 md:py-16 lg:px-16 lg:py-20">
          <p className="eyebrow text-white/45">SIGNATURE / O-01</p>
          <div className="py-20">
            <p className="mb-8 text-lg text-white/50">潮汐・木質調</p>
            <h2 className="text-[clamp(3.8rem,8vw,8.5rem)] font-medium leading-[.8] tracking-[-.08em]">深 潮</h2>
            <p className="mt-10 max-w-md text-base leading-8 text-white/65">前調是海鹽與冷杉，中央浮現烏龍茶的焙火，最後沉入台灣檜木與岩蘭草。不是海的味道，是靠近海時，身體記住的溫度。</p>
          </div>
          <a className="link-arrow w-fit" href={`${basePath}/collections/o-01/`}>進入香氣檔案 <ArrowUpRight size={17} /></a>
        </div>
      </section>

      <section className="bg-ember px-5 py-24 text-ink md:px-12 md:py-36">
        <div className="mx-auto max-w-[1500px]">
          <p className="eyebrow text-ink/45">THE FIELD NOTES</p>
          <div className="mt-8 grid items-end gap-12 lg:grid-cols-[1fr_.5fr]">
            <h2 className="max-w-5xl text-[clamp(3rem,7vw,7.6rem)] font-medium leading-[.88] tracking-[-.065em]">香氣不是裝飾，<br />是另一種抵達。</h2>
            <div>
              <p className="text-base leading-8 text-ink/65">我們與採集者、調香師和玻璃工匠一起工作，讓每一批作品保留季節差異，也保留人的手感。</p>
              <a className="link-arrow mt-8 w-fit" href={`${basePath}/story/`}>閱讀品牌故事 <ArrowUpRight size={17} /></a>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
