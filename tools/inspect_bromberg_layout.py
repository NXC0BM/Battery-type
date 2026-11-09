import pdfplumber
from pdf2image import convert_from_path
from pathlib import Path
p=Path('submission/qa/bromberg-reference.pdf')
with pdfplumber.open(p) as d:
 print('Pages',len(d.pages))
 targets=[1]
 for i,page in enumerate(d.pages):
  text=page.extract_text() or ''
  if 'писчая бумага' in text or ('Цель' in text and 'Необходимо разработать систему' in text):targets.append(i+1)
 print('Targets',targets)
for n in targets:
 im=convert_from_path(str(p),first_page=n,last_page=n,dpi=110,poppler_path='C:/Users/MAT/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin')[0]
 im.save(p.parent/f'bromberg-{n}.png')
