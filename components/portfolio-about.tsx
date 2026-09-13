import { ArrowUpRight } from "lucide-react";

const capabilities = [
  {
    number: "01", title: "品牌網站與互動前端", english: "BRAND & INTERACTION",
    description: "把品牌的個性轉化為資訊架構、視覺節奏與互動細節。從響應式切版到影像敘事，讓桌機與手機上的瀏覽都清楚、自然，也讓動畫真正服務內容。",
    focus: "RWD 響應式設計 / 元件化開發 / 動態敘事",
    work: "從 Isle / Scent 看互動敘事", href: "#project-01",
  },
  {
    number: "02", title: "產品介面與管理流程", english: "PRODUCT & OPERATIONS",
    description: "先梳理資料與角色之間的關係，再設計表單、列表、月曆與操作流程。關注的不只是畫面是否完整，更是訂單、預約與費用狀態能否被正確理解。",
    focus: "資訊層級 / 表單與狀態設計 / 前後台流程規劃",
    work: "從 Order Flow 看訂單流程", href: "#project-03",
  },
  {
    number: "03", title: "既有系統與流程自動化", english: "SYSTEMS & AUTOMATION",
    description: "面對重複登記、跨頁操作與複雜資料流程，先找出可以簡化的環節。以狀態驗證、錯誤處理與操作紀錄建立可追溯的流程，並保留必要的人工確認。",
    focus: "既有流程梳理 / 例外狀態 / 人工確認與交接",
    work: "查看自動化流程說明", href: "/work/tax-flow/",
  },
  {
    number: "04", title: "開發整合與上線交付", english: "ENGINEERING & DELIVERY",
    description: "以 React、TypeScript 與 Tailwind CSS 建立可維護的介面，兼顧結構、載入與操作細節。依專案需求整理部署設定、版本管理與交付說明，讓後續修改有清楚的起點。",
    focus: "React / TypeScript / Git / 網站部署",
    work: "從 MORI 看多頁整合", href: "#project-04",
  },
];

const approach = [
  { step: "01 / UNDERSTAND", title: "先把問題說清楚", text: "從使用情境、現有素材與實際操作出發，釐清網站要服務誰、完成什麼任務，再確認範圍與優先順序。" },
  { step: "02 / MAKE", title: "讓想法可以被操作", text: "用可瀏覽、可互動的版本溝通。將版型、內容與流程逐步整合，讓每次調整都有具體依據。" },
  { step: "03 / REFINE", title: "把細節做到交付", text: "依約定範圍確認手機操作、表單狀態與異常情境，整理交付內容、使用方式，以及下一階段的擴充需求。" },
];

export function PortfolioAbout() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <section id="about" className="portfolio-about portfolio-about-designed" aria-labelledby="about-title">
      <div className="pa-profile pa-shell">
        <div className="pa-chapter"><p>ABOUT / YORKE HSU</p><span>DESIGN × ENGINEERING</span></div>
        <div className="pa-profile-grid">
          <aside className="pa-identity" aria-label="Yorke Hsu 個人識別">
            <div className="pa-identity-top"><span>CREATIVE DEVELOPER</span><span>Y/H</span></div>
            <div className="pa-monogram" aria-hidden="true"><span>Y</span><i>/</i><span>H</span></div>
            <div className="pa-identity-name"><p>Yorke Hsu</p><span>互動前端・產品介面・流程自動化</span></div>
            <div className="pa-identity-bottom"><span>台灣 / 遠端協作</span><a href="#work" aria-label="查看 Yorke Hsu 的精選作品"><ArrowUpRight size={23} aria-hidden="true" /></a></div>
          </aside>
          <div className="pa-introduction">
            <p className="pa-kicker">關於我 / 不只把畫面做好。</p>
            <h2 id="about-title">設計感，<br />不該犧牲<span className="pa-highlight">可靠性。</span></h2>
            <p className="pa-lead">我是 Yorke Hsu，一位專注於互動前端、產品介面與流程自動化的開發者。我希望做出的網站，既能傳達品牌，也能讓人順利完成手上的事。</p>
            <div className="pa-bio"><p>我習慣先理解需求背後的工作方式：訪客如何找到資訊、管理者如何處理資料，以及操作卡住時，系統該如何回應。再將這些需求轉化為清楚的資訊層級、合適的互動與可維護的程式結構。</p><p>這份作品集呈現我對品牌敘事、營運介面與互動流程的實作思考。每個專案選擇不同的視覺語言，但共同的方向始終是：讓內容被理解，讓操作有邏輯，讓細節有理由。</p></div>
            <a className="pa-text-link" href="#work">用作品認識我的做法 <ArrowUpRight size={18} aria-hidden="true" /></a>
          </div>
        </div>
        <div className="pa-principle">
          <div><p className="pa-kicker">THE WAY I SEE IT</p><p className="pa-principle-title">視覺與工程，<br /><em>是同一件事。</em></p></div>
          <p>一個按鈕的位置、一段動畫的節奏、一張表單的錯誤提示，都會影響使用體驗。因此，我在意第一眼的感受，也在意反覆使用之後，是否依然直覺、穩定。</p>
        </div>
      </div>

      <div className="pa-expertise" aria-labelledby="expertise-title">
        <div className="pa-shell">
          <div className="pa-section-heading"><p className="pa-kicker">WHAT I BRING / 專業能力</p><h3 id="expertise-title">從品牌表達，<br />到<em>實際操作。</em></h3><p>把設計、資料與開發<br />放在同一個脈絡裡思考。</p></div>
          <ol className="pa-capabilities">
            {capabilities.map(item => <li className="pa-capability" key={item.number}>
              <div className="pa-capability-top"><span className="pa-capability-number">{item.number}</span><span>{item.english}</span></div>
              <h4>{item.title}</h4>
              <p className="pa-capability-description">{item.description}</p>
              <ul className="pa-focus" aria-label={item.title + "的重點"}>{item.focus.split(" / ").map(focus => <li key={focus}>{focus}</li>)}</ul>
              <a href={item.href.startsWith("#") ? item.href : basePath + item.href}>{item.work}<span><ArrowUpRight size={19} aria-hidden="true" /></span></a>
            </li>)}
          </ol>
          <p className="pa-expertise-note">作品中的管理與結帳流程為互動示範。正式營運所需的共用資料庫、身分驗證、金流與第三方串接，會依需求另行確認範圍。</p>
        </div>
      </div>

      <div className="pa-approach pa-shell" aria-labelledby="approach-title">
        <div className="pa-section-heading"><p className="pa-kicker">HOW I WORK / 合作方式</p><h3 id="approach-title">好的合作，<br />從<em>理解開始。</em></h3></div>
        <ol className="pa-approach-list">{approach.map(item => <li key={item.step}><div className="pa-step"><span>{item.step.split(" / ")[0]}</span><span>{item.step.split(" / ")[1]}</span></div><h4>{item.title}</h4><p>{item.text}</p></li>)}</ol>
        <div className="pa-collaboration"><div><p className="pa-kicker">LET’S TALK ABOUT YOUR NEXT STEP</p><p>讓下一個想法，<br /><strong>有個好的開始。</strong></p><span>無論已有完整設計稿，或正在整理改版與系統需求，<br />都可以從目前的問題、期待的成果與預計時程聊起。</span></div><a href="#contact"><span>聊聊你的專案</span><ArrowUpRight size={30} strokeWidth={1.5} aria-hidden="true" /></a></div>
      </div>
    </section>
  );
}
