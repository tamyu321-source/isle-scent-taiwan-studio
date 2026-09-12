import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { yogurtImage, yogurtProduct } from "./pure-white-content";
import { CraftStory } from "./pure-white-motion";
import {
  DailyRitual,
  ProductSelection,
  PureWhiteFooter,
  PureWhiteHeader,
  YogurtQuestions,
} from "./pure-white-shared";

export function PureWhiteSite() {
  return (
    <main className="pure-white-root" id="pure-white-top">
      <PureWhiteHeader />
      <section className="pw-hero" aria-labelledby="pw-title">
        <div className="pw-hero-heading">
          <p className="pw-eyebrow">PURE WHITE / ORIGINAL GREEK YOGURT</p>
          <h1 id="pw-title">
            原味。<span>值得細細品嚐。</span>
          </h1>
          <p>鮮乳、乳酸菌。還有讓口感濃厚的耐心。</p>
          <a className="pw-text-link" href={yogurtProduct}>
            探索原味優格 <ArrowUpRight size={18} />
          </a>
        </div>
        <div className="pw-hero-product">
          <span className="pw-hero-type" aria-hidden="true">
            PURE.
          </span>
          <Image
            src={yogurtImage("cup")}
            alt="PURE WHITE 日常杯，白色杯身搭配鈷藍杯蓋，盛裝原味希臘優格"
            width={1254}
            height={1254}
            priority
            sizes="(max-width: 760px) 100vw, 650px"
          />
          <span className="pw-hero-side">
            鮮乳 × 乳酸菌
            <br />
            PLAIN. BEAUTIFULLY THICK.
          </span>
        </div>
        <a className="pw-scroll-hint" href="#ingredients">
          從一口開始 <ArrowDown size={16} />
        </a>
      </section>

      <section
        id="ingredients"
        className="pw-intro pw-shell"
        aria-labelledby="pw-intro-title"
      >
        <p className="pw-eyebrow">JUST THE ESSENTIALS</p>
        <div className="pw-intro-layout">
          <h2 id="pw-intro-title">
            配方單純。
            <br />
            <span>口感，一點也不單薄。</span>
          </h2>
          <div>
            <p>
              鮮乳的香，發酵的酸。經過細心過濾，變成湯匙上濃厚的一口。原味不額外添加糖，讓這些細節自然留下來。
            </p>
            <dl className="pw-taste-notes">
              <div>
                <dt>乳香</dt>
                <dd>柔和、乾淨</dd>
              </div>
              <div>
                <dt>酸香</dt>
                <dd>清爽、細緻</dd>
              </div>
              <div>
                <dt>質地</dt>
                <dd>濃厚、滑順</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="pw-texture" aria-labelledby="pw-texture-title">
        <Image
          src={yogurtImage("spoon")}
          alt="一匙優格的濃厚紋理與柔滑表面"
          width={1536}
          height={1024}
          sizes="100vw"
        />
        <div className="pw-texture-copy">
          <p className="pw-eyebrow">A CLOSER LOOK</p>
          <h2 id="pw-texture-title">
            一匙，
            <br />
            就能感受。
          </h2>
          <a className="pw-text-link" href={`${yogurtProduct}#details`}>
            靠近看細節 <ArrowUpRight size={18} />
          </a>
        </div>
      </section>

      <CraftStory />
      <ProductSelection />
      <DailyRitual />
      <YogurtQuestions />
      <PureWhiteFooter />
    </main>
  );
}
