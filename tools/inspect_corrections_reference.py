from pathlib import Path
import pdfplumber
from pdf2image import convert_from_path
p=Path('C:/Web/Battery-type/submission/qa/corrections-reference.pdf')
with pdfplumber.open(p) as d: print('Reference pages',len(d.pages))
ims=convert_from_path(str(p),first_page=1,last_page=2,dpi=110,poppler_path='C:/Users/MAT/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin')
for i,im in enumerate(ims,1):im.save(p.parent/f'corrections-reference-{i}.png')
