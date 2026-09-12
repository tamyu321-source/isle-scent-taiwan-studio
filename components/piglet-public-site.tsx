"use client";

import Image from "next/image";
import { ArrowLeft, ArrowUpRight, Clock3, Heart, ImagePlus, Menu, MessageCircle, PawPrint, Sparkles, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { newPigletId, readPigletImage, usePigletStore } from "@/lib/piglet-store";

export function PigletPublicSite() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const { data, setData, ready } = usePigletStore(basePath);
  const [menuOpen, setMenuOpen] = useState(false);
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const selectedAlbum = data.albums.find((album) => album.id === albumId);

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const file = values.get("photo");
    let photo: string | undefined;
    if (file instanceof File && file.size) photo = await readPigletImage(file, 900);
    setData((current) => ({
      ...current,
      messages: [{ id: newPigletId(), name: String(values.get("name")), message: String(values.get("message")), date: new Date().toISOString().slice(0, 10), photo }, ...current.messages],
    }));
    form.reset();
    setSent(true);
    window.setTimeout(() => setSent(false), 3000);
  }

  return (
    <main id="top" className="piglet-site">
      <header className="piglet-header">
        <a className="piglet-logo" href="#top"><span>豬仔仔</span><small>幼兒園</small></a>
        <nav className={menuOpen ? "is-open" : ""} aria-label="主要導覽">
          <a href="#about" onClick={() => setMenuOpen(false)}>安心照顧</a>
          <a href="#plans" onClick={() => setMenuOpen(false)}>住宿方案</a>
          <a href="#daily" onClick={() => setMenuOpen(false)}>日常記錄</a>
          <a href="#messages" onClick={() => setMenuOpen(false)}>歡迎留言</a>
        </nav>
        <div className="piglet-header-actions">
          <a className="piglet-admin-link" href={`${basePath}/piglet-daycare/admin/`}>管理後台</a>
          <a className="piglet-line-mini" href={data.lineUrl} target="_blank" rel="noreferrer">加 LINE <ArrowUpRight size={15} /></a>
          <button type="button" className="piglet-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "關閉選單" : "開啟選單"}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
      </header>

      <section className="piglet-hero" aria-labelledby="piglet-title">
        <div className="piglet-hero-image" role="img" aria-label="在豬仔仔幼兒園開心相聚的狗狗與貓貓">
          {ready && <Image src={data.heroImage} alt="在豬仔仔幼兒園開心相聚的狗狗與貓貓" fill priority unoptimized={data.heroImage.startsWith("data:")} className="object-cover" sizes="100vw" />}
        </div>
        <div className="piglet-hero-copy">
          <p className="piglet-kicker"><PawPrint size={17} /> DOGS &amp; CATS DAYCARE</p>
          <h1 id="piglet-title"><span>豬仔仔</span><small>幼兒園</small></h1>
          <p>放心去忙、安心出遊。<br />今天也交給我們陪牠好好玩。</p>
          <a className="piglet-primary-button" href={data.lineUrl} target="_blank" rel="noreferrer">加入 LINE 預約 <ArrowUpRight size={19} /></a>
        </div>
        <div className="piglet-hero-sticker">
          <Image src={`${basePath}/images/daycare-cheese-closeup.webp`} alt="明星學員乳酪" fill className="object-cover" sizes="160px" />
          <span><Heart fill="currentColor" size={14} /> 明星學員 · 乳酪</span>
        </div>
      </section>

      <section id="about" className="piglet-promises" aria-label="品牌特色">
        <article><span>01</span><Sparkles /><h2>爸媽放心出遊</h2><p>即時近況與照片回報，想念的時候隨時看看。</p></article>
        <article><span>02</span><PawPrint /><h2>足夠玩耍空間</h2><p>狗貓分區、動靜分流，每個孩子都有舒服的節奏。</p></article>
        <article><span>03</span><Heart /><h2>別羨慕豬仔<br />圓圓胖胖</h2><p>吃飽、玩夠、睡得香，回家只帶走滿滿好心情。</p></article>
      </section>

      <section id="plans" className="piglet-plans" aria-labelledby="plans-title">
        <div className="piglet-section-title"><p>STAY &amp; PLAY</p><h2 id="plans-title">每一種陪伴，<br />都有剛好的方案。</h2><span>價格與方案由後台即時更新</span></div>
        <div className="piglet-plan-grid">
          {data.plans.map((plan, index) => (
            <article className={plan.recommended ? "is-recommended" : ""} key={plan.id}>
              <div className="piglet-plan-top"><span>0{index + 1}</span>{plan.recommended && <b>最受歡迎</b>}</div>
              <h3>{plan.name}</h3>
              <p>{plan.description}</p>
              <div className="piglet-plan-price"><small>NT$</small><strong>{plan.price.toLocaleString()}</strong><span>/ {plan.unit}</span></div>
            </article>
          ))}
        </div>
      </section>

      <section id="daily" className="piglet-daily" aria-labelledby="daily-title">
        <div className="piglet-section-title piglet-section-title-light"><p>DAILY DIARY</p><h2 id="daily-title">今天過得<br />超・開・心。</h2><span>點開每一本相簿，看孩子們今天在忙什麼</span></div>
        <div className="piglet-album-grid">
          {data.albums.map((album, index) => (
            <button type="button" className="piglet-album" key={album.id} onClick={() => setAlbumId(album.id)} style={{ "--tilt": `${index % 2 ? 2 : -2}deg` } as React.CSSProperties}>
              <span className="piglet-album-tab">ALBUM 0{index + 1}</span>
              <span className="piglet-album-image"><Image src={album.cover} alt={`${album.title}相簿封面`} fill unoptimized={album.cover.startsWith("data:")} className="object-cover" sizes="(max-width: 700px) 90vw, 30vw" /></span>
              <span className="piglet-album-info"><b>{album.title}</b><small>{album.date} · {album.photos.length} PHOTOS</small></span>
            </button>
          ))}
        </div>
      </section>

      <section id="messages" className="piglet-guestbook" aria-labelledby="guestbook-title">
        <div className="piglet-guestbook-heading"><MessageCircle size={34} /><p>WELCOME BOARD</p><h2 id="guestbook-title">來留言吧！</h2><span>告訴我們孩子回家後有沒有秒睡，或留下想說的話。</span></div>
        <form className="piglet-message-form" onSubmit={submitMessage}>
          <label>你的稱呼<input name="name" required placeholder="例如：麻糬媽媽" /></label>
          <label>想說的話<textarea name="message" required rows={4} placeholder="今天玩得開心嗎？" /></label>
          <label className="piglet-file-field"><ImagePlus size={20} /><span>加一張照片（選填）</span><input name="photo" type="file" accept="image/*" /></label>
          <button type="submit">送出留言 <ArrowUpRight size={18} /></button>
          {sent && <p className="piglet-form-success">收到！留言已經貼上去了。</p>}
        </form>
        <div className="piglet-message-list">
          {data.messages.map((message) => <article key={message.id}>{message.photo && <span className="piglet-message-photo"><Image src={message.photo} alt={`${message.name}上傳的照片`} fill unoptimized className="object-cover" /></span>}<MessageCircle size={20} /><p>{message.message}</p><div><b>{message.name}</b><time>{message.date}</time></div></article>)}
        </div>
      </section>

      <section className="piglet-booking" aria-labelledby="booking-title">
        <div className="piglet-booking-copy"><p>READY FOR A HAPPY STAY?</p><h2 id="booking-title">這次換我們，<br />陪牠玩到累。</h2><a href={data.lineUrl} target="_blank" rel="noreferrer">加 LINE 預約 <ArrowUpRight /></a></div>
        <div className="piglet-hours"><Clock3 size={29} /><h3>營業時間</h3><dl><div><dt>週一至週五</dt><dd>09:00—21:00</dd></div><div><dt>週六</dt><dd>10:00—16:00</dd></div><div><dt>週日</dt><dd>預約制</dd></div></dl><small>接送時間可於 LINE 另行確認</small></div>
      </section>

      <footer className="piglet-footer"><a href={`${basePath}/`}><ArrowLeft size={16} /> 返回 Yorke 作品集</a><p>豬仔仔幼兒園 · DOGS &amp; CATS DAYCARE</p><a href="#top">回到最上面 ↑</a></footer>

      {selectedAlbum && <div className="piglet-lightbox" role="dialog" aria-modal="true" aria-label={`${selectedAlbum.title}相簿`}><button type="button" onClick={() => setAlbumId(null)} aria-label="關閉相簿"><X /></button><div className="piglet-lightbox-title"><p>{selectedAlbum.date}</p><h2>{selectedAlbum.title}</h2></div><div className="piglet-lightbox-grid">{selectedAlbum.photos.map((photo, index) => <figure key={`${photo}-${index}`}><Image src={photo} alt={`${selectedAlbum.title}第 ${index + 1} 張照片`} fill unoptimized={photo.startsWith("data:")} className="object-cover" /></figure>)}</div></div>}
    </main>
  );
}
