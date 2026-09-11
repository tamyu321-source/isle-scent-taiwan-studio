"use client";

import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 16;
const chapters = [
  { at: 0, no: "01", kicker: "OPENING", title: "海霧先抵達", body: "佛手柑、海鹽與冷杉。像清晨第一口帶著礦物感的風。" },
  { at: .27, no: "02", kicker: "HEART", title: "茶火慢慢浮現", body: "焙火烏龍與冷煙，在體溫裡留下一道明暗交界。" },
  { at: .54, no: "03", kicker: "DEPTH", title: "沉入林線", body: "檜木、岩蘭草與濕苔。深、靜，卻仍有呼吸。" },
  { at: .81, no: "04", kicker: "AFTERGLOW", title: "最後，只剩你", body: "氣味貼近肌膚，成為沒有名字的一段地景。" },
];

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function ScrollSequence() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const image = new Image();
    image.decoding = "async";
    image.src = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/obsidian-sequence.webp`;

    let cancelled = false;
    image.onload = () => {
      if (!cancelled) {
        imageRef.current = image;
        setReady(true);
      }
    };

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    const image = imageRef.current;
    if (!canvas || !section || !image || !ready) return;

    let animationFrame = 0;
    let targetProgress = 0;
    let renderedProgress = -1;
    let lastActiveIndex = -1;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        renderedProgress = -1;
      }
    };

    const drawFrame = (progress: number) => {
      resizeCanvas();
      const sourceWidth = image.naturalWidth / 4;
      const sourceHeight = image.naturalHeight / 4;
      const framePosition = progress * (FRAME_COUNT - 1);
      const firstFrame = Math.floor(framePosition);
      const secondFrame = Math.min(FRAME_COUNT - 1, firstFrame + 1);
      const blend = framePosition - firstFrame;
      const portrait = canvas.height > canvas.width;
      const baseScale = Math.min(canvas.width / sourceWidth, canvas.height / sourceHeight);
      const scale = baseScale * (portrait ? 1.12 : .88 + progress * .06);
      const destinationWidth = sourceWidth * scale;
      const destinationHeight = sourceHeight * scale;
      const destinationX = (canvas.width - destinationWidth) / 2;
      const destinationY = (canvas.height - destinationHeight) / 2 + canvas.height * (portrait ? .035 : .015);

      context.globalAlpha = 1;
      context.fillStyle = "#050505";
      context.fillRect(0, 0, canvas.width, canvas.height);

      const draw = (frame: number, alpha: number) => {
        context.globalAlpha = alpha;
        context.drawImage(
          image,
          (frame % 4) * sourceWidth,
          Math.floor(frame / 4) * sourceHeight,
          sourceWidth,
          sourceHeight,
          destinationX,
          destinationY,
          destinationWidth,
          destinationHeight,
        );
      };

      draw(firstFrame, 1);
      if (secondFrame !== firstFrame && blend > .02) draw(secondFrame, blend);
      context.globalAlpha = 1;
    };

    const updateInterface = (progress: number) => {
      if (progressRef.current) progressRef.current.textContent = `${String(Math.round(progress * 100)).padStart(3, "0")}%`;
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
      section.style.setProperty("--sequence-progress", String(progress));

      const nextIndex = chapters.reduce((latest, chapter, index) => progress >= chapter.at ? index : latest, 0);
      if (nextIndex !== lastActiveIndex) {
        lastActiveIndex = nextIndex;
        setActiveIndex(nextIndex);
      }
    };

    const readTarget = () => {
      const rect = section.getBoundingClientRect();
      const travel = Math.max(section.offsetHeight - window.innerHeight, 1);
      targetProgress = clamp(-rect.top / travel);
    };

    const render = () => {
      if (renderedProgress < 0) renderedProgress = targetProgress;
      const distance = targetProgress - renderedProgress;
      renderedProgress = Math.abs(distance) < .0005 ? targetProgress : renderedProgress + distance * .105;

      drawFrame(renderedProgress);
      updateInterface(renderedProgress);

      if (renderedProgress !== targetProgress) animationFrame = requestAnimationFrame(render);
      else animationFrame = 0;
    };

    const requestRender = () => {
      readTarget();
      if (!animationFrame) animationFrame = requestAnimationFrame(render);
    };

    const start = () => {
      readTarget();
      renderedProgress = targetProgress;
      drawFrame(renderedProgress);
      updateInterface(renderedProgress);
    };

    start();

    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", requestRender);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", requestRender);
      window.removeEventListener("resize", requestRender);
    };
  }, [ready]);

  return (
    <section ref={sectionRef} id="sequence" className="sequence-section relative h-[620svh] bg-black text-white">
      <div className="sequence-sticky sticky top-0 h-[100svh] overflow-hidden bg-black">
        <canvas ref={canvasRef} className={`sequence-canvas h-full w-full transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`} aria-label="O-01 香水瓶隨捲動旋轉展示" role="img" />
        <div className="sequence-vignette pointer-events-none absolute inset-0" aria-hidden="true" />

        {!ready && <div className="absolute inset-0 grid place-items-center text-xs tracking-[.22em] text-white/42">PREPARING O-01</div>}

        <div className="absolute inset-x-5 top-[74px] flex items-center justify-between text-[.68rem] tracking-[.18em] text-white/42 md:inset-x-12">
          <span>OLFACTIVE STUDY / O-01</span>
          <span ref={progressRef}>000%</span>
        </div>

        <div className="absolute inset-x-5 bottom-[11vh] md:inset-x-12 md:bottom-[12vh]">
          {chapters.map((chapter, index) => (
            <div key={chapter.no} className="sequence-copy absolute bottom-0 w-full max-w-md" data-active={index === activeIndex} data-align={index % 2 === 0 ? "left" : "right"}>
              <p className="eyebrow text-white/42">{chapter.no} / 04 · {chapter.kicker}</p>
              <h2 className="mt-4 text-[clamp(2.7rem,5.4vw,5.8rem)] font-semibold leading-[.92] tracking-[-.055em]">{chapter.title}</h2>
              <p className="mt-5 max-w-sm text-base leading-8 text-white/58">{chapter.body}</p>
            </div>
          ))}
        </div>

        <div className="absolute inset-x-0 bottom-0 h-px bg-white/10">
          <div ref={barRef} className="h-full origin-left scale-x-0 bg-ember will-change-transform" />
        </div>
      </div>
    </section>
  );
}
