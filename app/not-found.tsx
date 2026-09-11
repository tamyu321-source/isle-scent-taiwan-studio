import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <main className="grid min-h-[100svh] place-items-center bg-ink px-5 text-chalk">
      <div className="text-center">
        <p className="eyebrow text-white/40">404 / OUT OF SCENT</p>
        <h1 className="mt-7 text-[clamp(4rem,12vw,11rem)] font-medium leading-none tracking-[-.08em]">氣味走遠了。</h1>
        <p className="mx-auto mt-7 max-w-md text-base leading-8 text-white/55">這個頁面不存在，回到島嶼的起點，再沿著氣味前進。</p>
        <a href={`${basePath}/`} className="link-arrow mt-10"><ArrowLeft size={17} /> 回到首頁</a>
      </div>
    </main>
  );
}
