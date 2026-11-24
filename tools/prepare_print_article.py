from pathlib import Path
import re,json,shutil
import pdfplumber
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate,Paragraph,Table,TableStyle,PageBreak,Spacer
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.units import cm
from xml.sax.saxutils import escape

root=Path('submission');out=root/'Для_печати';out.mkdir(exist_ok=True)
article=root/'literature/2606.12664v1.pdf'
terms=[
 [('solid electrolyte interphase','твёрдоэлектролитный межфазный слой (SEI)'),('lithium-ion batteries','литийионные аккумуляторы'),('cell formation','формирование аккумуляторного элемента'),('terminal voltage','напряжение на выводах элемента'),('cell expansion','расширение элемента, увеличение его толщины'),('voltage-only measurements','измерения только напряжения'),('state estimation','оценивание состояния'),('observability','наблюдаемость'),('electrode','электрод'),('degradation','деградация')],
 [('anode','анод'),('cathode','катод'),('electrolyte','электролит'),('lithiation','литирование, внедрение лития'),('polarization','поляризация'),('diffusion','диффузия'),('charging','заряд'),('discharge','разряд'),('surface kinetics','кинетика поверхностных процессов'),('side reaction','побочная реакция')],
 [('capacities','ёмкости электродов'),('resistance','электрическое сопротивление'),('capacitance','электрическая ёмкость конденсатора'),('ionic conductivity','ионная проводимость'),('electrode surface area','площадь поверхности электрода'),('temperature','температура'),('current density','плотность тока'),('molar volume','молярный объём'),('diffusion coefficient','коэффициент диффузии'),('state of charge','степень заряженности (SOC)')],
 [('manufacturing variability','разброс параметров при производстве'),('initial states','начальные состояния'),('process noise','шум процесса'),('nonlinear systems','нелинейные системы'),('covariance','ковариация'),('local observability','локальная наблюдаемость'),('uncertain parameters','неопределённые параметры'),('measurements','измерения'),('standard deviations','среднеквадратические отклонения'),('zero-order-hold','удержание постоянного входа между отсчётами')],
 [('sigma points','сигма-точки'),('Kalman gain','коэффициент усиления фильтра Калмана'),('convergence','сходимость'),('parameter uncertainty','неопределённость параметров'),('initial conditions','начальные условия'),('confidence envelopes','доверительные полосы'),('root-mean-square errors','среднеквадратические ошибки'),('real-time monitoring','мониторинг в реальном времени'),('stoichiometries','стехиометрические соотношения'),('residuals','невязки, остаточные ошибки')],
 [('SEI thickness','толщина межфазного слоя SEI'),('biased initial conditions','смещённые начальные условия'),('simulated trajectory','траектория, полученная моделированием'),('current modulation','изменение, модуляция тока'),('reduced-order modeling','моделирование с уменьшенным порядком модели'),('sensitivity analysis','анализ чувствительности'),('current profiles','профили тока'),('electrochemical impedance spectroscopy','электрохимическая импедансная спектроскопия'),('battery durability','долговечность аккумулятора'),('manufacturing cost','стоимость производства')]
]
def normalize(s):return re.sub(r'[^a-z0-9]','',s.lower())
with pdfplumber.open(article) as pdf:
 assert len(pdf.pages)==6
 for number,(page,group) in enumerate(zip(pdf.pages,terms),1):
  text=normalize(' '.join([page.extract_text() or '',page.crop((0,0,page.width/2,page.height)).extract_text() or '',page.crop((page.width/2,0,page.width,page.height)).extract_text() or '']))
  assert len(group)==10
  for term,translation in group:assert normalize(term) in text,(number,term)
shutil.copy2(article,out/'Статья_2026_для_печати_6_страниц.pdf')
from pypdf import PdfReader,PdfWriter
from io import BytesIO
base=PdfReader(str(root/'А3_перенос_ёмкости_и_напряжения.pdf'));sheet=base.pages[0]
buffer=BytesIO();overlay=canvas.Canvas(buffer,pagesize=(float(sheet.mediabox.width),float(sheet.mediabox.height)))
pdfmetrics.registerFont(TTFont('ArrowFont','C:/Windows/Fonts/arial.ttf'));overlay.setFont('ArrowFont',9)
for x,label,end in [(35,'battery_type.id','battery_type_attributes.battery_type_id'),(610,'attributes.id','battery_type_attributes.attribute_id')]:
 overlay.drawString(x,35,label);start=x+90;finish=x+155;overlay.line(start,38,finish,38);overlay.line(finish,38,finish-7,42);overlay.line(finish,38,finish-7,34);overlay.drawString(start+23,48,'1 : N');overlay.drawString(finish+12,35,end)
overlay.setFont('ArrowFont',8);overlay.drawString(35,13,'Учебный пример: id условные; в текущей БД номера записей могут отличаться.')
overlay.save();buffer.seek(0);sheet.merge_page(PdfReader(buffer).pages[0]);writer=PdfWriter();writer.add_page(sheet)
with (out/'А3_перерисовать_этот_образец.pdf').open('wb') as f:writer.write(f)

pdfmetrics.registerFont(TTFont('Guide','C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('GuideBold','C:/Windows/Fonts/arialbd.ttf'))
body=ParagraphStyle('body',fontName='Guide',fontSize=10.5,leading=14,spaceAfter=9)
title=ParagraphStyle('title',parent=body,fontName='GuideBold',fontSize=17,leading=22,spaceAfter=14)
cell=ParagraphStyle('cell',parent=body,fontSize=10.5,leading=14,spaceAfter=0)
story=[]
for i,group in enumerate(terms,1):
 if i>1:story.append(PageBreak())
 story.append(Paragraph(f'Страница статьи {i}: 10 терминов',title))
 if i==1:
  story.append(Paragraph('Z. Wan et al. Modeling and Estimation of Solid Electrolyte Interphase during Formation in Battery Manufacturing. arXiv:2606.12664v1, 10.06.2026.',body))
  story.append(Paragraph('Статья: полный PDF, 6 страниц. Печатать по одной странице на листе А4, односторонне. На каждой странице подчеркнуть 10 английских терминов, поставить номера 1–10 а переводы написать отдельно от руки, указав страницу статьи и номера терминов. Этот словарь использовать с экрана; дополнительно печатать его не требуется.',body))
  story.append(Paragraph('Источник: https://arxiv.org/abs/2606.12664v1',body))
 rows=[[Paragraph('№',cell),Paragraph('Найти в английском тексте',cell),Paragraph('Написать отдельно от руки',cell)]]
 for j,(term,translation) in enumerate(group,1):rows.append([str(j),Paragraph(escape(term),cell),Paragraph(escape(translation),cell)])
 table=Table(rows,colWidths=[.7*cm,6.8*cm,9.1*cm],hAlign='LEFT')
 table.setStyle(TableStyle([('FONTNAME',(0,0),(-1,-1),'Guide'),('FONTSIZE',(0,0),(-1,-1),10.5),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('GRID',(0,0),(-1,-1),.5,colors.HexColor('#AAAAAA')),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#f2f2f2')),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10)]))
 story.append(table);story.append(Spacer(1,14))
 if i==3:story.append(Paragraph('Не путать capacity и capacitance. Capacity — ёмкость аккумулятора или электрода; capacitance — электрическая ёмкость конденсатора. В проекте ёмкость аккумулятора задана в мА·ч.',body))
 if i==6:story.append(Paragraph('На шестой странице все 10 терминов выбраны из основного текста заключения, а не из списка литературы.',body))
def footer(c,doc):
 c.setFont('Guide',9);c.drawString(2*cm,1.2*cm,'Подсказка для рукописных пометок; статья остаётся отдельным исходным PDF.')
 c.drawRightString(A4[0]-2*cm,1.2*cm,str(doc.page))
SimpleDocTemplate(str(out/'60_терминов_по_10_на_страницу.pdf'),pagesize=A4,leftMargin=2*cm,rightMargin=2*cm,topMargin=1.8*cm,bottomMargin=2*cm).build(story,onFirstPage=footer,onLaterPages=footer)
(out/'Термины_по_страницам.json').write_text(json.dumps({str(i):[{'term':t,'translation':v} for t,v in group] for i,group in enumerate(terms,1)},ensure_ascii=False,indent=2),encoding='utf-8')
lines=['А3 и статья: что сделать вручную','',
'А3: один лист 420×297 мм, горизонтально. Перерисовать все четыре таблицы из образца: одну ДО и три ПОСЛЕ.',
'Это учебный пример с условными id, а не выгрузка текущей демонстрационной БД.',
'ДО: battery_type содержит ёмкость 3000/3350 и напряжение 3.60/3.60.',
'ПОСЛЕ: в battery_type этих двух столбцов нет; остальные данные остаются.',
'attributes содержит общие названия и единицы. battery_type_attributes содержит четыре конкретных значения.',
'Нарисовать связи: battery_type.id 1 → N battery_type_attributes.battery_type_id;',
'attributes.id 1 → N battery_type_attributes.attribute_id.',
'Не переносить в справочник названия моделей, изображения, статусы и остальные системные поля.',
'users и likes на этом листе не заменяют три таблицы после переноса.','',
'Статья: Modeling and Estimation of Solid Electrolyte Interphase during Formation in Battery Manufacturing.',
'Zhiwen Wan и соавторы, arXiv:2606.12664v1, 10.06.2026. В скачанном полном PDF 6 страниц.',
'Распечатать все 6 страниц, односторонне, по одной странице на листе А4.',
'На каждой странице выделить 10 терминов. Переводы написать отдельно от руки с номерами страниц и терминов. Всего 60 терминов.',
'Словарь лежит рядом; его распечатывать не нужно.',
'Термины проверены по соответствующей странице PDF; на стр. 6 все термины выбраны из основного текста заключения.',
'https://arxiv.org/abs/2606.12664v1','',
'Короткий ответ по статье: авторы оценивают рост межфазного слоя SEI при формировании литийионного элемента. Для оценивания используют напряжение и изменение толщины элемента; дополнительные измерения помогают восстановить внутреннее состояние. В учебном каталоге эта статья связана с характеристиками аккумуляторов, но модель SEI в проекте не реализована.',
'Статья включена в РПЗ как источник [1]; вопрос по статье в Теория_ДЗ_и_допов.docx обновлён под неё.'
]
(out/'Что_сделать_на_бумаге.txt').write_text('\n'.join(lines),encoding='utf-8')
print('Verified six original pages and 10 existing terms per page; print pack prepared')
