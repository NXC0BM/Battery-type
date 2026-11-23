from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
from docx import Document
import json,pdfplumber
root=Path('submission')
obsolete={'РПЗ_ЛР8_итоговая.docx','РПЗ_ЛР8.docx'}
for f in root.glob('*.docx'):
 if f.name.startswith('~$') or f.name in obsolete:continue
 d=Document(f);assert '__TASK_PAGE_BREAK__' not in '\n'.join(p.text for p in d.paragraphs)
 assert all(shd.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}fill')=='FFFFFF' for t in d.tables for row in t.rows for cell in row.cells for shd in cell._tc.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}shd'))
report=json.loads((root/'evidence/postman-run.json').read_text(encoding='utf-8-sig'))
print('Postman failures:',report['run']['summary']['tests']['failed'])
with ZipFile('C:/Web/battery_type_исправления.zip','w',ZIP_DEFLATED) as z:
 for f in root.rglob('*'):
  if f.is_file() and 'qa' not in f.relative_to(root).parts and not f.name.startswith('~$') and f.name not in obsolete:z.write(f,f.relative_to(root))
print('ZIP',Path('C:/Web/battery_type_исправления.zip').stat().st_size)
