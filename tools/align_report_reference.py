from pathlib import Path
p=Path('tools/build_documents.py');s=p.read_text(encoding='utf-8')
s=s.replace("d.styles['Title'].font.size=Pt(16);", "d.styles['Normal'].paragraph_format.alignment=WD_ALIGN_PARAGRAPH.JUSTIFY\n d.styles['Title'].font.size=Pt(16);")
s=s.replace("para.paragraph_format.first_line_indent=Cm(0);para.paragraph_format.line_spacing=1;", "para.paragraph_format.alignment=WD_ALIGN_PARAGRAPH.LEFT;para.paragraph_format.first_line_indent=Cm(0);para.paragraph_format.line_spacing=1;")
a=s.index('def title(d,subtitle):');b=s.index('\napi=[',a)
s=s[:a]+'''def centered(d,text,size=14,bold=False,italic=False,after=6):
 r=p(d,text,bold);r.alignment=WD_ALIGN_PARAGRAPH.CENTER;r.paragraph_format.first_line_indent=Cm(0)
 r.paragraph_format.line_spacing=1;r.paragraph_format.space_after=Pt(after)
 for run in r.runs:run.font.size=Pt(size);run.italic=italic
 return r

def university_heading(d):
 from copy import deepcopy
 from io import BytesIO
 reference=Document(next(Path('C:/Web/course-reference/reports').glob('*.docx')))
 element=deepcopy(reference.tables[0]._element)
 for blip in element.iter(qn('a:blip')):
  old_id=blip.get(qn('r:embed'))
  if old_id:
   image=reference.part.related_parts[old_id]
   new_id,_=d.part.get_or_add_image(BytesIO(image.blob));blip.set(qn('r:embed'),new_id)
 d._element.body.insert(len(d._element.body)-1,element)

def title(d,subtitle):
 university_heading(d)
 p(d,'ФАКУЛЬТЕТ  ИНФОРМАТИКА И СИСТЕМЫ УПРАВЛЕНИЯ')
 p(d,'КАФЕДРА  СИСТЕМЫ ОБРАБОТКИ ИНФОРМАЦИИ И УПРАВЛЕНИЯ')
 p(d);p(d)
 centered(d,'РАСЧЕТНО-ПОЯСНИТЕЛЬНАЯ ЗАПИСКА',18,True,after=18)
 centered(d,'К ДОМАШНЕМУ ЗАДАНИЮ',18,True,True,18)
 centered(d,'НА ТЕМУ',18,True,True,10)
 centered(d,'Расчёт времени работы устройства от аккумулятора',18,True,True,8)
 centered(d,'Li-ion, Li-Po, Ni-MH',16,False,False,24)
 p(d);p(d)
 for line in ['Студент  ИУ5-51Б             _______________  Рыбин М. А.',
              '                                               Подпись, дата',
              'Руководитель                    _______________  Канев А. И.',
              '                                               Подпись, дата']:
  r=p(d,line);r.alignment=WD_ALIGN_PARAGRAPH.LEFT;r.paragraph_format.first_line_indent=Cm(0);r.paragraph_format.line_spacing=1
 p(d);centered(d,'Москва 2026',14)
 page(d)

def tz_title(d):
 h(d,'Приложение А Техническое задание')
 centered(d,'МОСКОВСКИЙ ГОСУДАРСТВЕННЫЙ ТЕХНИЧЕСКИЙ УНИВЕРСИТЕТ',14)
 centered(d,'имени Н. Э. Баумана',14,after=16)
 centered(d,'Кафедра систем обработки информации и управления',14,after=16)
 t=d.add_table(rows=1,cols=2);t.autofit=False
 for col in t.columns:col.width=Cm(8)
 for cell,text in zip(t.rows[0].cells,[
  'УТВЕРЖДАЮ\\nЗаведующий кафедрой ИУ5\\n_____________________\\n«___» __________ 2026 г.',
  'СОГЛАСОВАНО\\nНаучный руководитель\\n____________ А. И. Канев\\n«___» __________ 2026 г.']):
  for i,line in enumerate(text.split('\\n')):
   r=cell.paragraphs[0] if i==0 else cell.add_paragraph();r.add_run(line);r.alignment=WD_ALIGN_PARAGRAPH.CENTER;r.paragraph_format.first_line_indent=Cm(0);r.paragraph_format.line_spacing=1;r.paragraph_format.space_after=Pt(4)
 p(d)
 centered(d,'Расчёт времени работы устройства от аккумулятора',16,True,after=16)
 centered(d,'Техническое задание',14)
 centered(d,'Вид документа',12,after=14)
 centered(d,'Писчая бумага',14)
 centered(d,'Вид носителя',12,after=14)
 centered(d,'6',14)
 centered(d,'Количество листов',12,after=14)
 centered(d,'ИСПОЛНИТЕЛЬ',14)
 centered(d,'Рыбин М. А.',14)
 centered(d,'«___» __________ 2026 г.',14,after=16)
 centered(d,'Москва 2026',14)
 page(d)
''' + s[b:]
s=s.replace("page(d);h(d,'Приложение А Техническое задание')",'page(d);tz_title(d)')
p.write_text(s,encoding='utf-8')
