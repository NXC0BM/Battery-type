from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
from docx import Document
import json,pdfplumber
root=Path('submission')
obsolete={'РПЗ_ЛР8_итоговая.docx','РПЗ_ЛР8.docx','РПЗ_ЛР8_проверка2.docx'}
for f in root.glob('*.docx'):
 if f.name.startswith('~$') or f.name in obsolete:continue
 d=Document(f);assert '__TASK_PAGE_BREAK__' not in '\n'.join(p.text for p in d.paragraphs)
 assert all(shd.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}fill')=='FFFFFF' for t in d.tables for row in t.rows for cell in row.cells for shd in cell._tc.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}shd'))
report=json.loads((root/'evidence/lab8/postman.json').read_text(encoding='utf-8-sig'))
print('Postman failures:',report['run']['summary']['tests']['failed'])
assert report['run']['summary']['tests']['failed']==0
assert report['run']['summary']['executedRequests']['errors']==0
archive=Path('C:/Web/battery_type_ЛР8.zip')
legacy={'РПЗ_и_ТЗ_исправлено.docx','Исправлено_по_замечаниям.docx','Расчёт_116_пользователей.docx','РПЗ_ЛР8_проверка3.docx','Исправлено_ЛР8.docx'}
with ZipFile(archive,'w',ZIP_DEFLATED) as z:
 for f in root.rglob('*'):
  relative=f.relative_to(root)
  if f.is_file() and 'qa' not in relative.parts and not f.name.startswith('~$') and f.name not in obsolete:
   target=Path('Предыдущие_этапы')/f.name if len(relative.parts)==1 and f.name in legacy else relative
   z.write(f,target)
assert (root/'native/battery_type-native.exe').exists(),'Native executable missing from local delivery'
with ZipFile(archive,'r') as z:
 assert 'native/battery_type-native.exe' in z.namelist()
 assert 'РПЗ_ЛР8_готово.docx' in z.namelist()
 assert z.testzip() is None,'Damaged ZIP entry'
print('ZIP',archive.stat().st_size)
