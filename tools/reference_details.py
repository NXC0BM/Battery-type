from docx import Document
from pathlib import Path
p=next(Path('C:/Web/course-reference/reports').glob('*.docx'))
d=Document(p)
for i in range(235,255): print(i,d.paragraphs[i].text)
for i in range(130,149): print(i,d.paragraphs[i].text)
