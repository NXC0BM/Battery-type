from pathlib import Path
import pdfplumber
from pdf2image import convert_from_path
root=Path('submission/qa/background-final');out=Path('submission/evidence/lab8')
with pdfplumber.open(root/'report.pdf') as pdf:
 page=next(i+1 for i,p in enumerate(pdf.pages) if '1 Цель' in (p.extract_text() or ''))
im=convert_from_path(str(root/'report.pdf'),first_page=page,last_page=page,dpi=110,poppler_path='C:/Users/MAT/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin')[0]
im.save(out/'tz-final.png')
print('TЗ goal proof page',page)
