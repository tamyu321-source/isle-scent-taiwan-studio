"use client";
import { useEffect, useRef, useState } from "react";

const chapters = [
  { at: 0, no: "01", title: "海霧先抵達", body: "佛手柑、海鹽與冷杉。像清晨第一口帶著礦物感的風。" },
  { at: .28, no: "02", title: "茶火慢慢浮現", body: "焙火烏龍與冷煙，在體溫裡留下一道明暗交界。" },
  { at: .57, no: "03", title: "沉入林線", body: "檜木、岩蘭草與濕苔。深、靜，卻仍有呼吸。" },
  { at: .84, no: "04", title: "最後，只剩你", body: "氣味貼近肌膚，成為沒有名字的一段地景。" },
];

export function ScrollSequence() {
  const sectionRef = useRef<HTMLElement>(null); const canvasRef = useRef<HTMLCanvasElement>(null); const imageRef = useRef<HTMLImageElement | null>(null); const frameRef = useRef(-1);
  const [progress, setProgress] = useState(0); const [ready, setReady] = useState(false);
  useEffect(() => { const img = new Image(); img.src = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/obsidian-sequence.png`; img.onload = () => { imageRef.current = img; setReady(true); }; }, []);
  useEffect(() => {
    const canvas = canvasRef.current; const section = sectionRef.current; const image = imageRef.current;
    if (!canvas || !section || !image || !ready) return; const context = canvas.getContext("2d"); if (!context) return; let ticking = false;
    const draw = () => {
      const rect = section.getBoundingClientRect(); const travel = section.offsetHeight - window.innerHeight; const current = Math.max(0, Math.min(1, -rect.top / Math.max(travel, 1))); const frame = Math.min(15, Math.floor(current * 15.999));
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5); const width = canvas.clientWidth; const height = canvas.clientHeight;
      if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) { canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr); frameRef.current = -1; }
      if (frame !== frameRef.current) { frameRef.current = frame; const sourceW = image.naturalWidth / 4; const sourceH = image.naturalHeight / 4; const scale = Math.min(canvas.width / sourceW, canvas.height / sourceH) * .9; const destW = sourceW * scale; const destH = sourceH * scale; context.clearRect(0, 0, canvas.width, canvas.height); context.drawImage(image, (frame % 4) * sourceW, Math.floor(frame / 4) * sourceH, sourceW, sourceH, (canvas.width - destW) / 2, (canvas.height - destH) / 2, destW, destH); }
      setProgress(current); ticking = false;
    };
    const requestDraw = () => { if (!ticking) { ticking = true; requestAnimationFrame(draw); } }; draw(); window.addEventListener("scroll", requestDraw, { passive: true }); window.addEventListener("resize", requestDraw); return () => { window.removeEventListener("scroll", requestDraw); window.removeEventListener("resize", requestDraw); };
  }, [ready]);
  const activeIndex = chapters.map(item => progress >= item.at).lastIndexOf(true);
  return (
    <section ref={sectionRef} id="sequence" className="relative h-[500svh] bg-black text-white">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <canvas ref={canvasRef} className="h-full w-full" aria-label="O-01 香水瓶隨捲動旋轉展示" role="img" />
        {!ready && <div className="absolute inset-0 grid place-items-center text-xs tracking-[.2em] text-white/40">LOADING OBJECT</div>}
        <div className="absolute inset-x-5 top-8 flex items-center justify-between text-[.68rem] tracking-[.16em] text-white/45 md:inset-x-12"><span>SCROLL STUDY / O-01</span><span>{String(Math.round(progress * 100)).padStart(3, "0")}%</span></div>
        <div className="absolute bottom-0 left-0 h-[2px] bg-ember transition-[width] duration-75" style={{ width: `${progress * 100}%` }} />
        <div className="absolute inset-x-5 bottom-12 md:inset-x-12 md:bottom-16">{chapters.map((chapter, index) => <div key={chapter.no} className="sequence-copy absolute bottom-0 max-w-sm" data-active={index === activeIndex}><p className="eyebrow text-white/45">{chapter.no} / 04</p><h2 className="mt-3 text-[clamp(2.5rem,5vw,5rem)] font-medium leading-none tracking-[-.06em]">{chapter.title}</h2><p className="mt-5 max-w-xs text-sm leading-7 text-white/60">{chapter.body}</p></div>)}</div>
      </div>
    </section>
  );
}
