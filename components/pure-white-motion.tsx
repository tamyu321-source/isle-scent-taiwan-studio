"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { ArrowDown } from "lucide-react";
import { craftSteps, yogurtImage } from "./pure-white-content";

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const amount = clamp(value);
  return amount * amount * (3 - 2 * amount);
};

const scenes = [
  {
    label: "原味",
    title: "簡單，\n也有層次。",
    description: "鮮乳與乳酸菌。從第一口的柔和乳香，到慢慢浮現的酸香。",
    image: "cup",
  },
  {
    label: "質地",
    title: "靠近一點。\n濃厚，看得見。",
    description:
      "細心過濾後，留下濃厚細緻的質地。湯匙劃過，柔滑的紋路清楚可見。",
    image: "spoon",
  },
  {
    label: "日常",
    title: "一個人，\n或一起享用。",
    description: "150g 留給自己，450g 放上餐桌。同一份原味，依照日常選擇。",
    image: "pair",
  },
];

export function ProductStory() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const panels = Array.from(
      section.querySelectorAll<HTMLElement>(".pw-scene"),
    );
    const markers = Array.from(
      section.querySelectorAll<HTMLElement>(".pw-story-marker"),
    );
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const shortScreen = window.matchMedia("(max-height: 560px)");
    let frame = 0;
    let nearby = false;
    let observer: IntersectionObserver | undefined;

    const render = () => {
      frame = 0;
      if (section.dataset.enhanced !== "true") return;
      const stage = section.querySelector<HTMLElement>(".pw-story-stage")!;
      const bounds = section.getBoundingClientRect();
      const distance = Math.max(1, bounds.height - stage.offsetHeight);
      const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
      const progress = clamp((stickyTop - bounds.top) / distance);
      const position = progress * scenes.length;
      const active = Math.min(scenes.length - 1, Math.floor(position));
      const local = position - active;
      const blend =
        active < scenes.length - 1 ? smooth((local - 0.66) / 0.34) : 0;
      const mobile = window.innerWidth <= 760;

      panels.forEach((panel, index) => {
        const opacity =
          index === active ? 1 - blend : index === active + 1 ? blend : 0;
        const movement = clamp(position - index);
        panel.style.setProperty("--scene-opacity", String(opacity));
        panel.style.setProperty(
          "--scene-scale",
          String(1 + movement * (mobile ? 0.045 : 0.12)),
        );
        panel.style.setProperty(
          "--scene-y",
          `${movement * (mobile ? -8 : -24)}px`,
        );
        panel.style.setProperty("--copy-y", `${(1 - opacity) * 18}px`);
      });
      markers.forEach((marker, index) => {
        marker.dataset.active = String(
          index === (blend > 0.5 ? active + 1 : active),
        );
      });
      section.style.setProperty("--story-progress", String(progress));
    };

    const schedule = () => {
      if (nearby && !frame) frame = requestAnimationFrame(render);
    };

    const configure = () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      frame = 0;
      const enabled =
        !reducedMotion.matches &&
        !shortScreen.matches &&
        "IntersectionObserver" in window;
      section.dataset.enhanced = String(enabled);
      if (!enabled) return;
      // Keep the static story readable until the enhanced layout is measured.
      render();
      observer = new IntersectionObserver(
        ([entry]) => {
          nearby = entry.isIntersecting;
          if (nearby) schedule();
        },
        { rootMargin: "240px" },
      );
      observer.observe(section);
    };

    configure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reducedMotion.addEventListener("change", configure);
    shortScreen.addEventListener("change", configure);
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reducedMotion.removeEventListener("change", configure);
      shortScreen.removeEventListener("change", configure);
      delete section.dataset.enhanced;
    };
  }, []);

  return (
    <section
      id="details"
      ref={sectionRef}
      className="pw-story"
      aria-label="原味優格產品細節"
    >
      <div className="pw-story-stage">
        {scenes.map((scene, index) => (
          <article
            key={scene.label}
            className={`pw-scene pw-scene-${scene.image}`}
          >
            <div className="pw-scene-copy">
              <p className="pw-eyebrow">
                0{index + 1} / {scene.label}
              </p>
              <h2>{scene.title}</h2>
              <p>{scene.description}</p>
            </div>
            <div className="pw-scene-visual">
              {scene.image === "pair" ? (
                <div className="pw-product-pair">
                  <Image
                    src={yogurtImage("cup")}
                    alt="150g 日常杯"
                    width={1254}
                    height={1254}
                    sizes="(max-width: 760px) 42vw, 28vw"
                  />
                  <Image
                    src={yogurtImage("jar")}
                    alt="450g 分享罐"
                    width={1254}
                    height={1254}
                    sizes="(max-width: 760px) 55vw, 34vw"
                  />
                </div>
              ) : (
                <Image
                  src={yogurtImage(scene.image)}
                  alt={
                    scene.image === "cup"
                      ? "打開藍色杯蓋的 PURE WHITE 原味優格"
                      : "湯匙上濃厚的原味優格特寫"
                  }
                  width={scene.image === "cup" ? 1254 : 1536}
                  height={scene.image === "cup" ? 1254 : 1024}
                  sizes="(max-width: 760px) 100vw, 65vw"
                />
              )}
            </div>
          </article>
        ))}
        <div className="pw-story-footer" aria-hidden="true">
          <div>
            {scenes.map((scene) => (
              <span className="pw-story-marker" key={scene.label}>
                {scene.label}
              </span>
            ))}
          </div>
          <span>
            向下，細看每一口 <ArrowDown size={16} />
          </span>
        </div>
        <div className="pw-story-progress" aria-hidden="true" />
      </div>
    </section>
  );
}

export function CraftStory() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !("IntersectionObserver" in window)) return;
    const steps = Array.from(
      section.querySelectorAll<HTMLElement>(".pw-craft-step"),
    );
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let nearby = false;
    let frame = 0;

    const render = () => {
      frame = 0;
      const center = window.innerHeight * 0.56;
      let active = 0;
      steps.forEach((step, index) => {
        if (step.getBoundingClientRect().top < center) active = index;
      });
      section.dataset.step = String(active);
      steps.forEach((step, index) => {
        step.dataset.active = String(index === active);
      });
    };
    const schedule = () => {
      if (nearby && !frame && !reducedMotion.matches)
        frame = requestAnimationFrame(render);
    };
    const updatePreference = () => {
      section.dataset.motion = String(!reducedMotion.matches);
      schedule();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        nearby = entry.isIntersecting;
        schedule();
      },
      { rootMargin: "150px" },
    );

    observer.observe(section);
    updatePreference();
    render();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reducedMotion.addEventListener("change", updatePreference);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reducedMotion.removeEventListener("change", updatePreference);
    };
  }, []);

  return (
    <section
      id="craft"
      className="pw-craft"
      ref={sectionRef}
      aria-labelledby="pw-craft-title"
    >
      <div className="pw-shell pw-craft-layout">
        <div className="pw-craft-visual">
          <p className="pw-eyebrow">MADE WITH TIME</p>
          <h2 id="pw-craft-title">濃厚，有它的過程。</h2>
          <figure>
            <Image
              src={yogurtImage("craft")}
              alt="職人使用濾布細心過濾希臘優格"
              width={1448}
              height={1086}
              sizes="(max-width: 760px) 100vw, 52vw"
            />
          </figure>
          <div className="pw-craft-labels" aria-hidden="true">
            {craftSteps.map((step, index) => (
              <span key={step.label} data-step={index}>
                0{index + 1} {step.label}
              </span>
            ))}
          </div>
        </div>
        <ol className="pw-craft-steps">
          {craftSteps.map((step, index) => (
            <li key={step.label} className="pw-craft-step">
              <span className="pw-eyebrow">
                0{index + 1} / {step.label}
              </span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
