from docx import Document
from pathlib import Path
from lxml import etree
r=Document(next(Path('C:/Web/course-reference/reports').glob('*.docx')))
print('sections',len(r.sections))
for i,s in enumerate(r.sections):print(i,s.different_first_page_header_footer,s.header_distance.mm,s.footer_distance.mm,[x.text for x in s.first_page_header.paragraphs])
for i in [14,22,32,208,218,227,234]:
 p=r.paragraphs[i];print(i,[(x.text,x.bold,x.italic,x.font.size.pt if x.font.size else None) for x in p.runs])
print('bodyelements first',[(i,e.tag.split('}')[-1]) for i,e in enumerate(r._element.body)][:10])
