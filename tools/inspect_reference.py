from docx import Document
from pathlib import Path
p=next(Path('C:/Web/course-reference/reports').glob('*.docx'))
d=Document(p)
for i,p in enumerate(d.paragraphs):
 if any(x in p.text.lower() for x in ['техническ','цель','назначен','задач','аппарат','расч','пользоват','запрос','введение']):
  print(i,p.style.name,p.text[:550])
s=d.sections[0]
print('PAGE',s.page_width.mm,s.page_height.mm,'MARGINS',s.top_margin.mm,s.bottom_margin.mm,s.left_margin.mm,s.right_margin.mm)
