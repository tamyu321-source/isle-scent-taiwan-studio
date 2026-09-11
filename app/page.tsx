import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ScrollSequence } from "@/components/scroll-sequence";

export const dynamic = "force-static";

export default function Home() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  return (
    <main className="overflow-clip bg-black">
      <SiteHeader theme="dark" />

      <section className="cinematic-hero relative min-h-[100svh] overflow-hidden bg-black text-white">
        <Image
          src={`${basePath}/images/coast-bottle.webp`}
          alt="海霧岩岸上的 O-01 深潮香水"
          fill
          priority
          className="cinematic-hero-image object-cover"
          sizes="100vw"
        />
        <div className="cinematic-hero-shade absolute inset-0" aria-hidden="true" />

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1200px] flex-col items-center px-5 pb-10 pt-24 text-center md:pb-14 md:pt-28">
          <div className="hero-copy-enter">
            <p className="eyebrow text-white/60">O-01 · EAU DE PARFUM</p>
            <h1 className="mt-3 text-[clamp(4.6rem,11vw,10rem)] font-semibold leading-[.88] tracking-[-.075em]">深 潮</h1>
            <p className="mx-auto mt-5 max-w-xl text-[clamp(1.05rem,2vw,1.45rem)] leading-relaxed text-white/78">島嶼的黑潮，落在肌膚上。</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a className="button-primary" href="#sequence">進入氣味</a>
              <a className="button-secondary" href={`${basePath}/collections/o-01/`}>進一步了解 <ArrowUpRight size={15} /></a>
            </div>
          </div>

          <a href="#sequence" className="hero-scroll-cue mt-auto" aria-label="向下探索逐幀動畫">
            <span>SCROLL TO DISCOVER</span>
            <ArrowDown size={16} />
          </a>
        </div>
      </section>

      <ScrollSequence />

      <section className="view-stage bg-chalk px-5 py-24 text-ink md:px-12 md:py-36">
        <div className="reveal-block mx-auto max-w-5xl text-center">
          <p className="eyebrow text-ink/45">FROM THE ISLAND</p>
          <h2 className="mt-6 text-[clamp(3rem,7.2vw,7.5rem)] font-semibold leading-[.94] tracking-[-.055em]">每一道氣味，<br />都有地形。</h2>
          <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-ink/60 md:text-lg">檜木、焙火烏龍與海霧，不是香調清單，而是島嶼在身體裡留下的距離。</p>
          <a className="button-dark mt-9" href={`${basePath}/ingredients/`}>查看島嶼原料 <ArrowUpRight size={16} /></a>
        </div>

        <figure className="landscape-window reveal-image mx-auto mt-16 aspect-[16/9] max-w-[1500px] overflow-hidden md:mt-24">
          <Image src={`${basePath}/images/island-botanicals.webp`} alt="雨後岩石上的檜木、茶葉與蘭花" fill className="object-cover" sizes="(max-width: 768px) 100vw, 90vw" />
        </figure>
      </section>

      <section className="product-stage grid min-h-[100svh] bg-black text-chalk lg:grid-cols-2">
        <figure className="reveal-image relative min-h-[66svh] overflow-hidden lg:min-h-screen">
          <Image src={`${basePath}/images/coast-bottle.webp`} alt="海岸晨光裡的 O-01 香水瓶" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
        </figure>
        <div className="reveal-block flex flex-col justify-center px-5 py-20 md:px-12 lg:px-[10vw]">
          <p className="eyebrow text-white/42">SIGNATURE / O-01</p>
          <h2 className="mt-7 text-[clamp(4rem,8vw,8.5rem)] font-semibold leading-[.86] tracking-[-.07em]">深 潮</h2>
          <p className="mt-7 text-xl text-white/55">潮汐・木質調</p>
          <p className="mt-7 max-w-md text-base leading-8 text-white/62">海鹽與冷杉先打開空氣，焙火烏龍在中央留下暖意，最後沉入台灣檜木與濕苔。</p>
          <a className="button-light mt-10" href={`${basePath}/collections/o-01/`}>查看 O-01 <ArrowUpRight size={16} /></a>
        </div>
      </section>

      <section className="closing-stage bg-ember px-5 py-28 text-ink md:px-12 md:py-44">
        <div className="reveal-block mx-auto max-w-[1200px] text-center">
          <p className="eyebrow text-ink/45">ISLE / SCENT</p>
          <h2 className="mx-auto mt-7 max-w-[12ch] text-[clamp(3.5rem,8.5vw,9rem)] font-semibold leading-[.9] tracking-[-.065em]">香氣不是裝飾，<br />是另一種抵達。</h2>
          <p className="mx-auto mt-8 max-w-xl text-base leading-8 text-ink/65">從採集、熟成到裝瓶，讓一座島慢慢靠近。</p>
          <a className="button-dark mt-10" href={`${basePath}/story/`}>閱讀品牌故事 <ArrowUpRight size={16} /></a>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
