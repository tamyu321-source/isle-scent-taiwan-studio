import Image from "next/image";
import { ArrowDown, ArrowLeft } from "lucide-react";
import { yogurtFacts, yogurtHome, yogurtImage } from "./pure-white-content";
import { ProductStory } from "./pure-white-motion";
import {
  DailyRitual,
  ProductSelection,
  PureWhiteFooter,
  PureWhiteHeader,
  YogurtQuestions,
} from "./pure-white-shared";

export function PureWhiteProduct() {
  return (
    <main className="pure-white-root" id="pure-white-top">
      <PureWhiteHeader product />
      <section
        className="pw-product-intro pw-shell"
        aria-labelledby="pw-product-title"
      >
        <a className="pw-back" href={yogurtHome}>
          <ArrowLeft size={16} /> PURE WHITE
        </a>
        <div className="pw-product-intro-layout">
          <div>
            <p className="pw-eyebrow">THE ORIGINAL</p>
            <h1 id="pw-product-title">
              原味。
              <br />
              <span>剛剛好的濃厚。</span>
            </h1>
            <p>
              原味無加糖希臘優格
              <br />
              150g 日常杯 / 450g 分享罐
            </p>
            <a className="pw-button" href="#details">
              細看每一口 <ArrowDown size={17} />
            </a>
          </div>
          <Image
            src={yogurtImage("jar")}
            alt="450g PURE WHITE 原味希臘優格分享罐"
            width={1254}
            height={1254}
            priority
            sizes="(max-width: 760px) 100vw, 50vw"
          />
        </div>
      </section>
      <ProductStory />
      <ProductSelection detail />
      <section
        id="ingredients"
        className="pw-facts pw-shell"
        aria-labelledby="pw-facts-title"
      >
        <div>
          <p className="pw-eyebrow">INSIDE EVERY CUP</p>
          <h2 id="pw-facts-title">關於這一杯。</h2>
          <p>從配方到取用，好好了解再享用。</p>
        </div>
        <dl>
          {yogurtFacts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <DailyRitual />
      <YogurtQuestions />
      <PureWhiteFooter />
    </main>
  );
}
