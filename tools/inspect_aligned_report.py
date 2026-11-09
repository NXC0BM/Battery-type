import pdfplumber
from pdf2image import convert_from_path
from pathlib import Path
p=Path('submission/qa/final/report.pdf')
with pdfplumber.open(p) as d:
 print('pages',len(d.pages));targets=[1]
 for i,page in enumerate(d.pages):
  t=page.extract_text() or ''
  if 'Приложение А Техническое задание' in t or '1 Цель' in t or 'Приложение Б Методы' in t:print(i+1,t[:120].replace('\n',' / '));targets.append(i+1)
for n in targets:
 im=convert_from_path(str(p),first_page=n,last_page=n,dpi=110,poppler_path='C:/Users/MAT/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin')[0];im.save(p.parent/f'aligned-{n}.png')
