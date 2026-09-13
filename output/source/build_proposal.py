from pathlib import Path
from io import BytesIO
import json
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
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
PDF = OUT / 'TK26082714ITLL02_形象官網與購物車建置提案_YorkeHsu.pdf'
PORTFOLIO = 'https://tamyu321-source.github.io/isle-scent-taiwan-studio/'
MORI = PORTFOLIO + 'mori-studio/'

pdfmetrics.registerFont(TTFont('JH', 'C:/Windows/Fonts/msjh.ttc', subfontIndex=0))
pdfmetrics.registerFont(TTFont('JHB', 'C:/Windows/Fonts/msjhbd.ttc', subfontIndex=0))
pdfmetrics.registerFont(TTFont('Latin', 'C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('LatinB', 'C:/Windows/Fonts/arialbd.ttf'))

W, H = A4
M = 42
CW = W - 2*M
INK = '#203C39'
ACCENT = '#337565'
MUTED = '#65706B'
PAPER = '#FCFBF7'
LINE = '#D9DED6'
SOFT = '#EEF1E9'
WHITE = '#FFFFFF'
GOLD = '#B29460'
BOXES = []
C = canvas.Canvas(str(PDF), pagesize=A4, pageCompression=1)
C.setTitle('形象官網與購物車建置提案 | TK26082714ITLL02')
C.setAuthor('Yorke Hsu')
C.setSubject('品牌形象、產品分類、購物車與後台管理之初步提案')
C.setCreator('Yorke Hsu - Project Proposal')

def rect(x, y, w, h, fill, radius=0, stroke=None, sw=0.6):
    C.setFillColor(HexColor(fill))
    C.setLineWidth(sw)
    if stroke:
        C.setStrokeColor(HexColor(stroke))
    if radius:
        C.roundRect(x, H-y-h, w, h, radius, fill=1, stroke=int(bool(stroke)))
    else:
        C.rect(x, H-y-h, w, h, fill=1, stroke=int(bool(stroke)))

def line(x, y, x2, y2, color=LINE, sw=.7):
    C.setStrokeColor(HexColor(color))
    C.setLineWidth(sw)
    C.line(x, H-y, x2, H-y2)

def text(s, x, y, size=10, bold=False, color=INK, font=None, align='left'):
    font = font or ('JHB' if bold else 'JH')
    C.setFont(font, size)
    C.setFillColor(HexColor(color))
    width = pdfmetrics.stringWidth(s, font, size)
    if align == 'right':
        x -= width
    elif align == 'center':
        x -= width/2
    if x < -0.1 or x+width > W+.1 or y < 0 or y+size > H:
        raise ValueError(f'Out of page: {s} / {x,y,width,size}')
    C.drawString(x, H-y-size*.86, s)
    BOXES.append({'page': C.getPageNumber(), 'text': s, 'x': x, 'y': y, 'w': width, 'h': size})
    return width

def wrap(s, width, size=10, font='JH'):
    result = []
    for para in s.split('\n'):
        buf = ''
        for ch in para:
            if buf and pdfmetrics.stringWidth(buf+ch, font, size) > width:
                result.append(buf)
                buf = ch
            else:
                buf += ch
        result.append(buf)
    return result

def paragraph(s, x, y, width, size=10, leading=17, bold=False, color=INK):
    font = 'JHB' if bold else 'JH'
    rows = wrap(s, width, size, font)
    for i, row in enumerate(rows):
        text(row, x, y+i*leading, size, bold, color)
    return y+len(rows)*leading

def pill(s, x, y, w=None, fill=SOFT, fg=ACCENT, size=8.5, h=23):
    w = w or pdfmetrics.stringWidth(s, 'JH', size)+22
    rect(x,y,w,h,fill,h/2)
    text(s,x+w/2,y+(h-size)/2-1,size,color=fg,align='center')
    return w

def link(s, url, x, y, size=9.4, color=ACCENT, bold=True):
    width = text(s,x,y,size,bold,color)
    line(x,y+size+3,x+width,y+size+3,color,.5)
    C.linkURL(url,(x,H-y-size-5,x+width,H-y+2),relative=0,thickness=0)

def image(path, x, y, w):
    reader = ImageReader(str(path))
    iw, ih = reader.getSize()
    h = w*ih/iw
    C.drawImage(reader,x,H-y-h,width=w,height=h,mask='auto')
    return h

def qrcode(url, x, y, size=64):
    code = qr.QrCodeWidget(url,barFillColor=HexColor(INK))
    bounds = code.getBounds()
    bw, bh = bounds[2]-bounds[0],bounds[3]-bounds[1]
    d = Drawing(size,size,transform=[size/bw,0,0,size/bh,0,0])
    d.add(code)
    renderPDF.draw(d,C,x,H-y-size)
    C.linkURL(url,(x,H-y-size,x+size,H-y),relative=0,thickness=0)

def page(n, caption):
    rect(0,0,W,H,PAPER)
    text('YORKE HSU',M,34,10,font='LatinB')
    text('WEB DESIGN & DEVELOPMENT',M+86,35,7.5,color=MUTED,font='Latin')
    text(f'PROPOSAL / 0{n}',W-M,35,7.5,color=MUTED,font='Latin',align='right')
    line(M,58,W-M,58)
    line(M,H-43,W-M,H-43)
    text('TK26082714ITLL02',M,H-30,7.5,color=MUTED,font='Latin')
    text(caption,W/2,H-30,7.5,color=MUTED,align='center')
    text(f'0{n} / 03',W-M,H-30,7.5,color=MUTED,font='Latin',align='right')

def cup(x,y,w,h,color='#C7C4B7'):
    # Original vector illustration for the proposed interface, not a product photograph.
    C.setStrokeColor(HexColor(color))
    C.setLineWidth(4)
    C.ellipse(x+w*.67,H-y-h*.72,x+w*.93,H-y-h*.22,fill=0,stroke=1)
    rect(x+w*.12,y+h*.15,w*.62,h*.70,color,6)
    C.setFillColor(HexColor('#EAE7DB'))
    C.ellipse(x+w*.12,H-y-h*.27,x+w*.74,H-y-h*.11,fill=1,stroke=0)
    C.setFillColor(HexColor('#ADA99A'))
    C.ellipse(x+w*.19,H-y-h*.23,x+w*.68,H-y-h*.15,fill=1,stroke=0)

def vase(x,y,w,h):
    C.setFillColor(HexColor('#A7B3A2'))
    p=C.beginPath()
    p.moveTo(x+w*.38,H-y)
    p.lineTo(x+w*.62,H-y)
    p.curveTo(x+w*.58,H-y-h*.24,x+w*.86,H-y-h*.47,x+w*.80,H-y-h*.81)
    p.curveTo(x+w*.76,H-y-h,x+w*.24,H-y-h,x+w*.20,H-y-h*.81)
    p.curveTo(x+w*.14,H-y-h*.47,x+w*.42,H-y-h*.24,x+w*.38,H-y)
    p.close()
    C.drawPath(p,fill=1,stroke=0)
    line(x+w*.40,y+1,x+w*.60,y+1,'#6D846E',2)

# Page 1: identity and an actual screenshot of an existing concept website.
page(1,'品牌形象 / 作品展示')
pill('案件 TK26082714ITLL02',M,78,size=8.5)
text('形象官網與',M,116,29,bold=True)
text('購物車建置提案',M,157,29,bold=True,color=ACCENT)
text('讓品牌被看見，也讓顧客順利完成下單。',M,207,12)
text('Yorke Hsu  /  互動前端・產品介面・流程自動化',M,232,9.5,color=MUTED)

rect(M,269,CW,306,WHITE,7,LINE)
rect(M+1,270,CW-2,19,SOFT,6)
for i in range(3):
    C.setFillColor(HexColor(['#C7CFC5','#B6C1B1','#97AD9D'][i]))
    C.circle(M+13+i*10,H-279.5,2,fill=1,stroke=0)
text('MORI  /  CONCEPT WEBSITE',M+CW/2,275,6.6,font='Latin',color=MUTED,align='center')
image(ROOT/'public/images/work-mori-preview.webp',M+1,289,CW-2)
text('MORI 留白陶作',M,594,13,bold=True)
text('品牌網站與購物介面概念作品',M+121,596,9.5,color=MUTED)
link('開啟互動作品',MORI,W-M-74,596,9)
paragraph('透過清楚的品牌介紹、商品入口與一致的視覺風格，\n讓顧客從認識品牌，自然走向瀏覽產品。',M,624,CW,11,19)

cols=[('01','品牌形象','首頁、介紹與聯絡資訊'),('02','產品分類','分類瀏覽與商品詳情'),('03','購物車下單','訂購資料與訂單管理')]
for i,(n,title,desc) in enumerate(cols):
    x=M+i*(CW/3)
    line(x,681,x+CW/3-17,681)
    text(n,x,695,10,color=ACCENT,font='LatinB')
    text(title,x+25,692,11,bold=True)
    text(desc,x,715,8.5,color=MUTED)

rect(M,744,CW,37,SOFT,4)
paragraph('作品性質：本頁為既有概念作品截圖，非客戶商用案例。示範資料存於瀏覽器，\n未串接正式付款；本案的品牌、商品與版型將於需求確認後調整。',M+12,753,CW-24,8,12,color=MUTED)
C.showPage()

# Page 2: a tailored vector interface, not represented as a completed system.
page(2,'產品分類 / 訂購流程')
text('本案功能規劃',M,80,9.5,color=ACCENT,bold=True)
text('分類清楚，下單直覺。',M,107,27,bold=True)
text('先完成產品展示與基本訂单流程，後續可依營運需求擴充。'.replace('单','單'),M,153,10.5,color=MUTED)

ux,uy,uw,uh=M,188,CW,315
rect(ux,uy,uw,uh,WHITE,7,LINE)
rect(ux+1,uy+1,uw-2,38,SOFT,6)
text('日常選物',ux+17,uy+13,12,bold=True)
text('品牌介紹    聯絡我們',ux+198,uy+15,8,color=MUTED)
pill('購物車  2',ux+uw-92,uy+9,w=76,h=22,fill=WHITE,size=8)
text('把喜歡的日常，帶回家。',ux+17,uy+55,16,bold=True)
text('商品依用途分類，快速找到需要的品項。',ux+17,uy+82,8.5,color=MUTED)
xx=ux+17
for i,s in enumerate(['全部商品','杯具','花器','禮盒']):
    pw=pill(s,xx,uy+106,w=[69,45,45,45][i],fill=ACCENT if i==0 else SOFT,fg=WHITE if i==0 else MUTED,size=7.6,h=22)
    xx+=pw+6

card_y=uy+142
for i,(name,price) in enumerate([('霧白陶杯','NT$ 480'),('青灰花器','NT$ 680')]):
    x=ux+17+i*151
    rect(x,card_y,139,99,'#F2F1EA',5)
    if i==0: cup(x+39,card_y+21,60,62)
    else: vase(x+44,card_y+16,49,70)
    text(name,x,card_y+108,10,bold=True)
    text(price,x,card_y+127,9,font='Latin',color=MUTED)
    pill('加入購物車',x+68,card_y+124,w=71,h=21,fill=SOFT,size=7)

sx=ux+uw-174
rect(sx,uy+54,156,243,'#F4F5F0',5)
text('購物車摘要',sx+13,uy+69,11,bold=True)
line(sx+13,uy+94,sx+143,uy+94)
text('霧白陶杯',sx+13,uy+109,9)
text('數量  2',sx+13,uy+129,8,color=MUTED)
text('NT$ 960',sx+143,uy+129,8.5,font='Latin',align='right')
line(sx+13,uy+151,sx+143,uy+151)
text('商品小計',sx+13,uy+165,9)
text('NT$ 960',sx+143,uy+164,11,font='LatinB',align='right')
text('運費依確認的配送規則計算',sx+13,uy+189,7.2,color=MUTED)
rect(sx+13,uy+213,130,32,ACCENT,3)
text('填寫訂購資料',sx+78,uy+223,9,bold=True,color=WHITE,align='center')
text('匯款 / 人工確認訂單',sx+78,uy+259,7.6,color=MUTED,align='center')
text('介面示意：品牌、品項及價格僅供展示，非本案完成畫面。',M,515,8.2,color=MUTED)

text('顧客操作流程',M,548,12,bold=True)
steps=[('1','選分類 / 看商品'),('2','加入購物車'),('3','填寫訂購資料'),('4','送單 / 等待確認')]
gap=8
sw=(CW-3*gap)/4
for i,(num,label) in enumerate(steps):
    x=M+i*(sw+gap)
    rect(x,574,sw,61,SOFT,4)
    text(num,x+12,585,11,color=ACCENT,font='LatinB')
    text(label,x+12,607,8.5,bold=True)

line(M,657,W-M,657)
text('後台管理',M,675,12,bold=True)
paragraph('新增與修改商品、管理分類與價格；\n查看訂購資料並更新訂單處理狀態。',M,700,242,10,18)
text('下單與付款',M+274,675,12,bold=True)
paragraph('先採匯款與人工確認訂單方式；\n線上刷卡及物流串接可另行評估。',M+274,700,237,10,18)
text('基本驗收：分類可用、購物車數量與金額正確、送單後可於後台查詢。',M,763,8.4,color=MUTED)
C.showPage()

# Page 3: a bounded initial estimate and practical collaboration terms.
page(3,'初步報價 / 合作方式')
text('預算與交付範圍',M,80,9.5,color=ACCENT,bold=True)
text('先確認範圍，再開始製作。',M,107,26,bold=True)
rect(M,155,CW,99,INK,6)
text('初步建置報價',M+20,170,10,color='#D6E4DC')
text('NT$ 5,000 - 5,200',M+20,197,28,color=WHITE,font='LatinB')
text('現成版型 + 品牌風格調整',W-M-18,236,8.5,color='#D6E4DC',align='right')

text('預計包含',M,275,12,bold=True)
rows=[
    ('形象內容','首頁、品牌介紹與聯絡資訊；頁面形式於需求確認時決定。'),
    ('商品與分類','商品列表、分類與詳情；首批上架數量及規格另行確認。'),
    ('購物車與訂單','數量調整、金額計算、訂購資料與送單；匯款後人工確認。'),
    ('後台與手機版','商品、分類及訂單管理；適配手機瀏覽與基本操作。'),
    ('交付與教學','基本流程檢查、後台操作說明及商品維護教學。'),
]
y=302
for i,(label,desc) in enumerate(rows):
    if i%2==0: rect(M,y-4,CW,39,SOFT,3)
    text(label,M+11,y+8,9.5,bold=True)
    paragraph(desc,M+113,y+8,CW-124,9.0,13,color=MUTED)
    y+=42

text('合作流程',M,530,12,bold=True)
stages=[('01','確認需求','產品、版型與下單方式'),('02','製作與確認','依約定範圍調整畫面'),('03','檢查與交付','測試流程並說明操作')]
for i,(num,title,desc) in enumerate(stages):
    x=M+i*(CW/3)
    text(num,x,555,9,color=ACCENT,font='LatinB')
    text(title,x+23,553,10,bold=True)
    text(desc,x,575,8.1,color=MUTED)

rect(M,606,CW,101,SOFT,4)
text('製作前一起確認',M+13,617,10,bold=True)
paragraph('案主提供：Logo、品牌介紹、商品圖片／文字、價格及配送資訊。\n交期、首批上架量、修改次數、付款節點與維護方式，確認需求後約定。\n網域、主機及付費版型／外掛另計；線上刷卡、物流串接與額外客製另報。\n本報價為初估，最終以雙方確認的需求與報價為準。',M+13,639,CW-26,8.6,15,color=MUTED)

text('Yorke Hsu',M,733,14,font='LatinB')
text('品牌形象、產品介面與流程規劃',M,755,9,color=MUTED)
link('查看完整作品集',PORTFOLIO,M+260,741,10)
text('掃描或點擊 QR Code',M+260,762,7.5,color=MUTED)
qrcode(PORTFOLIO,W-M-67,720,66)
C.showPage()
C.save()

reader=PdfReader(str(PDF))
assert len(reader.pages)==3
all_text='\n'.join(p.extract_text() for p in reader.pages)
for required in ['TK26082714ITLL02','Yorke Hsu','5,000 - 5,200','概念作品','網域','購物車','後台']:
    assert required in all_text, required
link_urls=[]
for p in reader.pages:
    for item in p.get('/Annots',[]):
        obj=item.get_object()
        if '/A' in obj and '/URI' in obj['/A']:
            link_urls.append(str(obj['/A']['/URI']))
assert MORI in link_urls and PORTFOLIO in link_urls
(Path(__file__).parent/'proposal_text.txt').write_text(all_text,encoding='utf-8')
(Path(__file__).parent/'proposal_layout.json').write_text(json.dumps(BOXES,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'pdf':str(PDF),'pages':len(reader.pages),'bytes':PDF.stat().st_size,'links':link_urls,'text_boxes':len(BOXES)},ensure_ascii=False))
