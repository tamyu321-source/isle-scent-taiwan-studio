"use client";

import NextImage from "next/image";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 16;
const PLAYBACK_DURATION = 9_800;
const chapters = [
  { at: 0, no: "01", kicker: "THE COAST", word: "海", title: "從海霧開始。", body: "東岸清晨的冷光，成為 O—01 的第一個輪廓。" },
  { at: .24, no: "02", kicker: "THE GLASS", word: "光", title: "把流動，留在玻璃裡。", body: "不規則切面折射冷藍與琥珀色光，每一個角度都不相同。" },
  { at: .5, no: "03", kicker: "THE FORM", word: "形", title: "一只瓶，也是一段地形。", body: "十六個角度連續轉動，讓厚度、陰影與邊緣逐一浮現。" },
  { at: .76, no: "04", kicker: "THE SCENT", word: "餘", title: "最後，讓氣味接手。", body: "海鹽、茶火與檜木，從物件退到肌膚，只留下餘韻。" },
];

type PlaybackState = "idle" | "playing" | "paused" | "complete";
type PlaybackController = {
  pause: () => void;
  play: () => void;
  replay: () => void;
};

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function smoothstep(progress: number) {
  const value = clamp(progress);
  return value * value * (3 - 2 * value);
}

function cameraAt(progress: number) {
  if (progress < .2) {
    const phase = smoothstep(progress / .2);
    return { scale: lerp(.72, .92, phase), x: lerp(0, .08, phase), y: lerp(.04, 0, phase), focus: lerp(7, 0, phase) };
  }
  if (progress < .47) {
    const phase = smoothstep((progress - .2) / .27);
    return { scale: lerp(.92, 1.18, phase), x: lerp(.08, -.1, phase), y: lerp(0, -.015, phase), focus: 0 };
  }
  if (progress < .72) {
    const phase = smoothstep((progress - .47) / .25);
    return { scale: lerp(1.18, 1.42, phase), x: lerp(-.1, .12, phase), y: lerp(-.015, .02, phase), focus: 0 };
  }

  const phase = smoothstep((progress - .72) / .28);
  return { scale: lerp(1.42, .94, phase), x: lerp(.12, 0, phase), y: lerp(.02, 0, phase), focus: 0 };
}

export function ScrollSequence() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coastIntroRef = useRef<HTMLDivElement>(null);
  const macroRef = useRef<HTMLDivElement>(null);
  const coastFinalRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<PlaybackController | null>(null);
  const [ready, setReady] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");

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

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    let animationFrame = 0;
    let elapsed = 0;
    let startedAt = 0;
    let state: PlaybackState = "idle";
    let lastActiveIndex = -1;
    let hasEntered = false;
    let manuallyPaused = false;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const drawFrame = (progress: number) => {
      resizeCanvas();
      const sourceWidth = image.naturalWidth / 4;
      const sourceHeight = image.naturalHeight / 4;
      const rotationProgress = smoothstep((progress - .4) / .43);
      const framePosition = rotationProgress * (FRAME_COUNT - 1);
      const firstFrame = Math.floor(framePosition);
      const secondFrame = Math.min(FRAME_COUNT - 1, firstFrame + 1);
      const blend = framePosition - firstFrame;
      const portrait = canvas.height > canvas.width;
      const baseScale = Math.min(canvas.width / sourceWidth, canvas.height / sourceHeight);
      const camera = cameraAt(rotationProgress);
      const scale = baseScale * camera.scale * (portrait ? 1.28 : 1);
      const destinationWidth = sourceWidth * scale;
      const destinationHeight = sourceHeight * scale;
      const destinationX = (canvas.width - destinationWidth) / 2 + canvas.width * camera.x * (portrait ? .32 : 1);
      const destinationY = (canvas.height - destinationHeight) / 2 + canvas.height * camera.y;

      context.globalAlpha = 1;
      context.filter = "none";
      context.fillStyle = "#020303";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      const draw = (frame: number, alpha: number, blur = 0) => {
        context.globalAlpha = alpha;
        context.filter = blur ? `blur(${blur}px)` : "none";
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

      const arrival = smoothstep((progress - .4) / .1);
      draw(firstFrame, arrival, camera.focus);
      if (secondFrame !== firstFrame && blend > .02) draw(secondFrame, blend * arrival, camera.focus);
      context.globalAlpha = 1;
      context.filter = "none";
    };

    const updateInterface = (progress: number) => {
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
      section.style.setProperty("--sequence-progress", String(progress));
      section.style.setProperty("--sequence-shift-x", `${Math.sin(progress * Math.PI * 2) * 8}%`);
      section.style.setProperty("--sequence-glass-x", `${progress * 190 - 95}%`);
      section.style.setProperty("--sequence-aurora-opacity", String(.38 + progress * .42));

      const introOpacity = 1 - smoothstep((progress - .14) / .13);
      const macroOpacity = smoothstep((progress - .17) / .1) * (1 - smoothstep((progress - .41) / .11));
      const canvasOpacity = smoothstep((progress - .4) / .1) * (1 - smoothstep((progress - .78) / .1));
      const finalOpacity = smoothstep((progress - .77) / .14);
      if (coastIntroRef.current) {
        coastIntroRef.current.style.opacity = String(introOpacity);
        coastIntroRef.current.style.transform = `scale(${1.04 + progress * .08})`;
      }
      if (macroRef.current) {
        macroRef.current.style.opacity = String(macroOpacity);
        macroRef.current.style.transform = `scale(${1.08 - progress * .06}) translate3d(${(progress - .3) * -3}%, 0, 0)`;
      }
      canvas.style.opacity = String(canvasOpacity);
      if (coastFinalRef.current) {
        coastFinalRef.current.style.opacity = String(finalOpacity);
        coastFinalRef.current.style.transform = `scale(${1.13 - finalOpacity * .09})`;
      }

      const nextIndex = chapters.reduce((latest, chapter, index) => progress >= chapter.at ? index : latest, 0);
      if (nextIndex !== lastActiveIndex) {
        lastActiveIndex = nextIndex;
        setActiveIndex(nextIndex);
      }
    };

    const setState = (nextState: PlaybackState) => {
      state = nextState;
      setPlaybackState(nextState);
    };

    const render = (time: number) => {
      if (!startedAt) startedAt = time - elapsed;
      elapsed = Math.min(PLAYBACK_DURATION, time - startedAt);
      const progress = elapsed / PLAYBACK_DURATION;
      drawFrame(progress);
      updateInterface(progress);

      if (progress < 1) animationFrame = requestAnimationFrame(render);
      else {
        animationFrame = 0;
        setState("complete");
      }
    };

    const resume = () => {
      if (state === "complete" || manuallyPaused) return;
      startedAt = performance.now() - elapsed;
      setState("playing");
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(render);
    };

    const suspend = () => {
      if (state !== "playing") return;
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      setState("paused");
    };

    const playByUser = () => {
      manuallyPaused = false;
      if (state === "complete") return;
      startedAt = performance.now() - elapsed;
      setState("playing");
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(render);
    };

    const pauseByUser = () => {
      manuallyPaused = true;
      suspend();
    };

    const replay = () => {
      manuallyPaused = false;
      cancelAnimationFrame(animationFrame);
      elapsed = 0;
      startedAt = performance.now();
      drawFrame(0);
      updateInterface(0);
      setState("playing");
      animationFrame = requestAnimationFrame(render);
    };

    controllerRef.current = { pause: pauseByUser, play: playByUser, replay };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      elapsed = PLAYBACK_DURATION;
      drawFrame(1);
      updateInterface(1);
      setState("complete");
    } else {
      drawFrame(0);
      updateInterface(0);
    }

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry || reducedMotion) return;

      if (entry.intersectionRatio >= .38) {
        hasEntered = true;
        if (state === "idle" || (state === "paused" && !manuallyPaused)) resume();
      } else if (hasEntered && entry.intersectionRatio < .06) {
        suspend();
      }
    }, { threshold: [0, .06, .38, .72] });

    observer.observe(section);

    const onResize = () => {
      drawFrame(clamp(elapsed / PLAYBACK_DURATION));
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      controllerRef.current = null;
    };
  }, [ready]);

  const handlePlayback = () => {
    const controller = controllerRef.current;
    if (!controller) return;
    if (playbackState === "playing") controller.pause();
    else if (playbackState === "complete") controller.replay();
    else controller.play();
  };

  const controlLabel = playbackState === "playing" ? "暫停動畫" : playbackState === "complete" ? "重新播放動畫" : "播放動畫";
  const ControlIcon = playbackState === "playing" ? Pause : playbackState === "complete" ? RotateCcw : Play;

  return (
    <section ref={sectionRef} id="sequence" className="sequence-section relative h-[132svh] bg-black text-white">
      <div className="sequence-stage sticky top-0 h-[100svh] overflow-hidden bg-black md:min-h-[620px]">
        <div ref={coastIntroRef} className="sequence-scene absolute inset-0 opacity-100" aria-hidden="true">
          <NextImage src={`${basePath}/images/coast-bottle.webp`} alt="" fill sizes="100vw" className="object-cover object-center" />
          <div className="sequence-scene-shade absolute inset-0" />
        </div>
        <div ref={macroRef} className="sequence-scene absolute inset-0 opacity-0" aria-hidden="true">
          <NextImage src={`${basePath}/images/o01-glass-macro.webp`} alt="" fill sizes="100vw" className="object-cover object-center" />
          <div className="sequence-scene-shade sequence-scene-shade-macro absolute inset-0" />
        </div>
        <div className="sequence-aurora pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="sequence-horizon pointer-events-none absolute inset-0" aria-hidden="true" />
        <div key={activeIndex} className="sequence-word pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
          {chapters[activeIndex].word}
        </div>

        <canvas ref={canvasRef} className={`sequence-canvas absolute inset-0 h-full w-full opacity-0 ${ready ? "is-ready" : ""}`} aria-label="O-01 深潮香水自動旋轉與鏡頭推進展示" role="img" />
        <div ref={coastFinalRef} className="sequence-scene sequence-scene-final absolute inset-0 opacity-0" aria-hidden="true">
          <NextImage src={`${basePath}/images/coast-bottle.webp`} alt="" fill sizes="100vw" className="object-cover object-center" />
          <div className="sequence-scene-shade sequence-scene-shade-final absolute inset-0" />
        </div>
        <div className="sequence-glass pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="sequence-vignette pointer-events-none absolute inset-0" aria-hidden="true" />

        {!ready && <div className="absolute inset-0 grid place-items-center text-xs font-semibold tracking-[.22em] text-white/40">LOADING O—01</div>}

        <div className="sequence-meta absolute inset-x-5 top-[76px] z-10 flex items-center justify-between gap-4 text-[.66rem] font-semibold tracking-[.16em] text-white/48 md:inset-x-12 md:top-[78px] md:text-[.7rem] md:tracking-[.2em]">
          <span>O—01 / 深潮</span>
          <span>A PRODUCT PORTRAIT</span>
        </div>

        <div className="sequence-copy-wrap absolute inset-x-5 bottom-[15vh] z-10 md:inset-x-12 md:bottom-[16vh]">
          {chapters.map((chapter, index) => (
            <article key={chapter.no} className="sequence-copy absolute bottom-0 w-full max-w-lg" data-active={index === activeIndex} data-align={index % 2 === 0 ? "left" : "right"}>
              <p className="eyebrow text-white/45">{chapter.no} / 04 · {chapter.kicker}</p>
              <h2 className="mt-4 text-[clamp(2.9rem,5.7vw,6.4rem)] font-semibold leading-[.9] tracking-[-.06em]">{chapter.title}</h2>
              <p className="mt-5 max-w-md text-base leading-8 text-white/62 md:text-lg">{chapter.body}</p>
            </article>
          ))}
        </div>

        <div className="absolute inset-x-5 bottom-6 z-20 flex items-center gap-4 md:inset-x-12 md:bottom-8">
          <div className="flex min-w-0 flex-1 items-center gap-2" aria-hidden="true">
            {chapters.map((chapter, index) => <span key={chapter.no} className="sequence-tick" data-active={index <= activeIndex} />)}
          </div>
          <span className="hidden text-[.66rem] font-semibold tracking-[.18em] text-white/40 sm:block">AUTO FILM · 10 SEC</span>
          <button type="button" onClick={handlePlayback} className="sequence-control grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/28 bg-black/30 text-white backdrop-blur-xl transition-colors hover:bg-white hover:text-black" aria-label={controlLabel} disabled={!ready}>
            <ControlIcon size={16} fill={playbackState === "playing" ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 h-[2px] bg-white/10">
          <div ref={barRef} className="h-full origin-left scale-x-0 bg-white will-change-transform" />
        </div>
      </div>
    </section>
  );
}
