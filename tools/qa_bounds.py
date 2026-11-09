import pdfplumber
from pathlib import Path
with pdfplumber.open('submission/qa/final/guide.pdf') as p:
 for i,pg in enumerate(p.pages,1):
  chars=pg.chars
  print(i,round(min(c['top'] for c in chars),1),round(max(c['bottom'] for c in chars),1))
  if i==5:print(pg.extract_text()[:100])
