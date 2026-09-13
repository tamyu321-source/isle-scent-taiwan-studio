from pathlib import Path
import json
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output' / 'pdf'
OUT.mkdir(parents=True, exist_ok=True)
TMP = ROOT / 'tmp' / 'pdfs' / 'piglet'
TMP.mkdir(parents=True, exist_ok=True)
PDF = OUT / '豬仔仔幼兒園_網站改版與後台管理提案_YorkeHsu.pdf'
BASE = 'https://tamyu321-source.github.io/isle-scent-taiwan-studio/'
FRONT = BASE + 'piglet-daycare/'
ADMIN = FRONT + 'admin/'

for name, file in [('JH','msjh.ttc'), ('JHB','msjhbd.ttc')]:
    pdfmetrics.registerFont(TTFont(name, f'C:/Windows/Fonts/{file}', subfontIndex=0))
pdfmetrics.registerFont(TTFont('Latin', 'C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('LatinB', 'C:/Windows/Fonts/arialbd.ttf'))

W,H=A4
M=42
CW=W-2*M
INK='#202B29'
MUTED='#64716B'
PAPER='#FFFCF2'
LINE='#DFDFD3'
YELLOW='#FAE46A'
MINT='#E7F1E8'
CORAL='#F2D5C4'
SOFT='#F3F1E6'
WHITE='#FFFFFF'
C=canvas.Canvas(str(PDF),pagesize=A4,pageCompression=1)
C.setTitle('豬仔仔幼兒園 | 網站改版與後台管理提案')
C.setAuthor('Yorke Hsu')
C.setSubject('一頁式寵物寄宿網站、管理者登記預約、資料串聯與持久儲存')
BOXES=[]

def rect(x,y,w,h,fill,r=0,stroke=None):
    C.setFillColor(HexColor(fill))
    C.setLineWidth(.7)
    if stroke: C.setStrokeColor(HexColor(stroke))
    if r: C.roundRect(x,H-y-h,w,h,r,fill=1,stroke=int(bool(stroke)))
    else: C.rect(x,H-y-h,w,h,fill=1,stroke=int(bool(stroke)))

def line(x,y,x2,y2,color=LINE,sw=.7):
    C.setStrokeColor(HexColor(color)); C.setLineWidth(sw)
    C.line(x,H-y,x2,H-y2)

def text(s,x,y,size=10,bold=False,color=INK,font=None,align='left'):
    font=font or ('JHB' if bold else 'JH')
    width=pdfmetrics.stringWidth(s,font,size)
    if align=='right': x-=width
    elif align=='center': x-=width/2
    assert 0 <= x and x+width <= W+.1 and 0 <= y and y+size <= H, (s,x,y,width)
    C.setFont(font,size); C.setFillColor(HexColor(color))
    C.drawString(x,H-y-size*.86,s)
    BOXES.append(dict(page=C.getPageNumber(),text=s,x=x,y=y,w=width,h=size))
    return width

def para(s,x,y,width,size=10,leading=17,color=INK,bold=False):
    font='JHB' if bold else 'JH'
    rows=[]
    for p in s.split('\n'):
        buf=''
        for ch in p:
            if buf and pdfmetrics.stringWidth(buf+ch,font,size)>width:
                rows.append(buf); buf=ch
            else: buf+=ch
        rows.append(buf)
    for i,row in enumerate(rows): text(row,x,y+i*leading,size,bold,color)
    return y+len(rows)*leading

def pill(s,x,y,fill=YELLOW,size=8.7,w=None):
    w=w or pdfmetrics.stringWidth(s,'JHB',size)+24
    rect(x,y,w,24,fill,12)
    text(s,x+w/2,y+7,size,True,align='center')
    return w

def image(path,x,y,w):
    r=ImageReader(str(path)); iw,ih=r.getSize(); h=w*ih/iw
    C.drawImage(r,x,H-y-h,width=w,height=h,mask='auto')
    return h

def link(s,url,x,y,size=9):
    sw=text(s,x,y,size,True)
    line(x,y+size+3,x+sw,y+size+3,INK,.5)
    C.linkURL(url,(x,H-y-size-5,x+sw,H-y+2),relative=0,thickness=0)

def code(url,x,y,size=57):
    q=qr.QrCodeWidget(url,barFillColor=HexColor(INK)); b=q.getBounds()
    d=Drawing(size,size,transform=[size/(b[2]-b[0]),0,0,size/(b[3]-b[1]),0,0]); d.add(q)
    renderPDF.draw(d,C,x,H-y-size)
    C.linkURL(url,(x,H-y-size,x+size,H-y),relative=0,thickness=0)

def paw(x,y,s=1):
    C.setFillColor(HexColor(INK))
    C.ellipse(x+6*s,H-y-23*s,x+24*s,H-y-10*s,fill=1,stroke=0)
    for dx,dy in [(1,7),(9,1),(20,2),(28,9)]:
        C.ellipse(x+dx*s,H-y-dy*s-7*s,x+(dx+6)*s,H-y-dy*s,fill=1,stroke=0)

def page(n,label):
    rect(0,0,W,H,PAPER)
    text('YORKE HSU',M,34,10,font='LatinB')
    text('WEB DESIGN & DEVELOPMENT',M+86,35,7.5,color=MUTED,font='Latin')
    text(f'PIGLET / 0{n}',W-M,35,7.5,color=MUTED,font='Latin',align='right')
    line(M,58,W-M,58)
    line(M,H-43,W-M,H-43)
    text('豬仔仔幼兒園 / 網站改版提案',M,H-30,7.6,color=MUTED)
    text(label,W/2+24,H-30,7.5,color=MUTED,align='center')
    text(f'0{n} / 04',W-M,H-30,7.5,color=MUTED,font='Latin',align='right')

# 01 / Visual direction and relevant concept work.
page(1,'品牌與設計方向')
pill('寵物寄宿 / 品牌改版',M,80)
text('豬仔仔幼兒園',M,122,32,True)
text('網站改版與後台管理提案',M,169,23,True)
text('讓爸媽放心了解環境，讓管理者輕鬆掌握每一次寄宿。',M,210,11)
text('一頁式公開前台 + 管理者登記預約 + 費用與資料管理',M,235,9.6,color=MUTED)
rect(W-M-51,94,51,51,YELLOW,14)
paw(W-M-41,107,.94)

rect(M,277,CW,307,WHITE,6,LINE)
rect(M+1,278,CW-2,18,SOFT,5)
text('PIGLET DAYCARE / CONCEPT PREVIEW',W/2,283,6.8,font='Latin',color=MUTED,align='center')
image(ROOT/'public/images/work-daycare-preview.webp',M+1,296,CW-2)
text('活潑、有溫度，也容易使用。',M,606,15,True)
para('以明亮色彩、手繪感品牌標題與寵物照片建立親切感；\n價格、相簿與留言集中在同一頁，手機也能快速找到資訊。',M,635,CW,10.7,18)

for i,(title,sub,color) in enumerate([
    ('品牌展示','大圖、標語與價格方案',YELLOW),
    ('日常互動','公開相簿與照片留言',MINT),
    ('營運管理','預約、客戶與費用串聯',CORAL),
]):
    x=M+i*(CW+12)/3; bw=(CW-24)/3
    rect(x,688,bw,53,color,7)
    text(title,x+12,699,10.5,True)
    text(sub,x+12,719,8.2,color=MUTED)
para('示範說明：本附件畫面取自既有概念作品，並非案主舊站或已交付正式系統。\n照片為展示素材；正式版依案主提供的三隻豬仔照片、品牌資料與確認範圍製作。',M,759,CW,7.8,12,color=MUTED)
C.showPage()

# 02 / Complete public single-page scope, matching the brief.
page(2,'公開前台規劃')
pill('01 / 公開前台',M,80)
text('一頁呈現，資訊剛剛好。',M,120,26,True)
text('公開端以資訊展示、日常互動與「加賴預約」為主。',M,164,10.6,color=MUTED)
front_rows=[
    ('01','首頁大圖與品牌標題','三隻豬仔照片搭配手繪風格標題；\n後台可更換主視覺照片並編輯首頁文字。',YELLOW),
    ('02','三則品牌標語','爸媽放心出遊／足夠玩耍空間／\n別羨慕豬仔圓圓胖胖。',SOFT),
    ('03','價格方案展示','公開顯示方案內容、價格與推薦標記；\n由後台新增、編輯或刪除後同步載入。',MINT),
    ('04','資料夾式日常相簿','公開瀏覽資料夾與照片；後台管理分類、封面，\n並支援多張照片上傳及相簿新增／編輯／刪除。',SOFT),
    ('05','歡迎留言板','訪客可留下文字與上傳照片；\n管理者可查看及刪除留言，並設定上傳限制。',CORAL),
    ('06','加賴預約入口','連至案主指定的 LINE；由管理者確認後登記預約。\n前台先不設自動排程或訪客自行建立預約。',SOFT),
    ('07','營業時間與手機瀏覽','週一至週五 09:00-21:00；週六 10:00-16:00。\n週日資訊待確認；版面適配手機、平板與電腦。',MINT),
]
y=207
for num,title,body,color in front_rows:
    rect(M,y,CW,66,color,6)
    text(num,M+13,y+14,11,font='LatinB')
    text(title,M+43,y+13,11,True)
    para(body,M+202,y+12,CW-216,9.2,16,color=INK)
    y+=77
text('預約流程：訪客加 LINE 聯繫 → 管理者確認並登記 → 後台追蹤排程與費用。',M,765,8.7,color=MUTED)
C.showPage()

# 03 / Actual demo admin capture and management coverage.
page(3,'後台功能規劃')
pill('02 / 後台管理',M,80,fill=MINT)
text('預約、客戶與費用，一起管理。',M,120,24,True)
text('左側功能導覽，管理者顯示「游小瑀」；正式帳號與密碼於交付時設定。',M,158,9.4,color=MUTED)
image(ROOT/'output/source/piglet-assets/admin-overview.png',M,190,CW)
text('既有後台示範畫面 / 顯示資料為範例，正式版依以下範圍建置。',M,490,8.2,color=MUTED)
admin_rows=[
    ('預約管理','管理者自行新增預約、月曆排程；待確認／已確認／已取消。'),
    ('客戶資料','搜尋、新增／編輯／刪除；串聯客戶、預約、費用及價格方案。'),
    ('費用資料','管理品項、價格與備註；待付款／已付款／已取消狀態。'),
    ('日常記錄','資料夾新增／編輯／刪除、封面設定與多張照片上傳。'),
    ('價格方案','方案新增／編輯／刪除、推薦標記，同步公開前台展示。'),
    ('留言與網站設定','查看、刪除留言；維護首頁文字、主視覺及 LINE 連結。'),
]
y=520
for i,(title,body) in enumerate(admin_rows):
    if i%2==0: rect(M,y-2,CW,37,SOFT,4)
    text(title,M+10,y+9,9.5,True)
    para(body,M+119,y+8,CW-129,9.1,13.5,color=MUTED)
    y+=42
C.showPage()

# 04 / Persistence, relationships, acceptance and collaboration.
page(4,'資料、驗收與合作')
pill('03 / 資料與交付',M,80,fill=CORAL)
text('資料存得住，每次都能載入。',M,120,25,True)
text('正式版規劃使用伺服器資料庫與照片儲存空間，支援跨裝置讀取。',M,162,10,color=MUTED)

nodes=[('公開前台','方案、相簿與留言',YELLOW),('共用儲存','資料庫 + 照片檔案',MINT),('管理者後台','登入後存取營運資料',CORAL)]
nw=151
for i,(a,b,col) in enumerate(nodes):
    x=M+i*180
    rect(x,199,nw,58,col,6)
    text(a,x+nw/2,210,11,True,align='center')
    text(b,x+nw/2,232,8.3,color=MUTED,align='center')
    if i<2:
        ax=x+nw+7
        bx=ax+15
        ay=227
        line(ax,ay,bx,ay,INK,1)
        line(ax,ay,ax+4,ay-3,INK,1)
        line(ax,ay,ax+4,ay+3,INK,1)
        line(bx,ay,bx-4,ay-3,INK,1)
        line(bx,ay,bx-4,ay+3,INK,1)

text('資料串聯：客戶與寵物 → 預約＋價格方案 → 費用明細與付款狀態',M,275,9.4,True)
items=[
    ('儲存與載入','新增、修改與照片上傳完成後再顯示成功；重新整理、重新登入及換裝置，均讀取已儲存的資料。'),
    ('權限與異常','客戶、預約及費用限管理者查看；載入失敗時顯示提示與重試入口，不以空白資料覆寫既有紀錄。'),
    ('歷史與備份','方案調價保留既有費用；先確認取消與刪除的連動規則。備份頻率、保留期限及還原方式納入交付約定。'),
]
y=309
for title,body in items:
    text(title,M,y,10.3,True)
    para(body,M+89,y,CW-89,9.4,16,color=MUTED)
    y+=52

rect(M,475,CW,128,SOFT,6)
text('交付驗收將檢查',M+14,488,11,True)
checks=[
    '01  新增客戶、登記預約及費用後，月曆與客戶紀錄能互相對應。',
    '02  更新方案、相簿封面與照片後，公開前台重新開啟可看見更新。',
    '03  重新整理、重新登入與另一裝置登入，資料均完整且一致。',
    '04  訪客可留言並附照片；刪除後前台更新，未登入者無法讀取後台資料。',
    '05  模擬儲存或載入失敗，確認錯誤提示與既有資料保留。',
]
for i,s in enumerate(checks): text(s,M+14,513+i*16.4,8.8,color=MUTED)

text('合作流程',M,623,11,True)
text('需求與舊站盤點 → 視覺確認 → 系統建置 → 測試、上線與操作教學',M,645,9.3)
para('製作前確認：舊站網址與可移轉資料、正式照片、LINE 連結、寄宿計價及跨日規則。\n正式報價與交期於確認範圍後提供；主機、網域、資料／照片空間與維護費用會先列明。',M,669,CW,8.7,15,color=MUTED)

line(M,713,W-M,713)
text('Yorke Hsu',M,733,13,font='LatinB')
text('既有概念示範：資料目前限瀏覽器儲存。',M,756,8,color=MUTED)
text('正式版將依本提案另行建置共用儲存與權限。',M,770,8,color=MUTED)
link('查看前台示範',FRONT,M+284,735,9)
link('查看後台示範',ADMIN,M+284,761,9)
code(FRONT,W-M-60,724,58)
C.showPage(); C.save()

reader=PdfReader(str(PDF))
assert len(reader.pages)==4
content='\n'.join(p.extract_text() for p in reader.pages)
required=['豬仔仔幼兒園','游小瑀','爸媽放心出遊','足夠玩耍空間','別羨慕豬仔圓圓胖胖','09:00-21:00','10:00-16:00','待確認','已確認','已取消','待付款','已付款','共用儲存','重新登入','主機','正式報價','概念作品']
for term in required: assert term in content,term
assert '5,000' not in content and 'TK26082714ITLL02' not in content
urls=[]
for p in reader.pages:
    for a in p.get('/Annots',[]):
        obj=a.get_object()
        if '/A' in obj and '/URI' in obj['/A']: urls.append(str(obj['/A']['/URI']))
assert FRONT in urls and ADMIN in urls
(TMP/'text.txt').write_text(content,encoding='utf-8')
(TMP/'layout.json').write_text(json.dumps(BOXES,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(dict(file=str(PDF),pages=4,bytes=PDF.stat().st_size,links=urls),ensure_ascii=True))
