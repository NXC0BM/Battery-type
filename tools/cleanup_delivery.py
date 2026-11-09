from pathlib import Path
from PIL import Image
p=Path('tools/build_correction_evidence.py');s=p.read_text(encoding='utf-8').replace('im.crop((w//2-210,0,w//2+210,h))','im.crop((w//2-210,0,w//2+210,h if name=="lab5-01-grid" else 800))');p.write_text(s,encoding='utf-8')
p=Path('README.md');s=p.read_text(encoding='utf-8').replace('submission/Замечания_и_порядок_защиты.docx','submission/Исправлено_по_замечаниям.docx').replace('ответы на замечания, объяснения атрибутов/лайка, порядок показа.','замечания, короткие ответы и изображения по образцу файла с рабочего стола.');p.write_text(s,encoding='utf-8')
p=Path('tools/build_readmes.py');s=p.read_text(encoding='utf-8').replace('submission/Замечания_и_порядок_защиты.docx','submission/Исправлено_по_замечаниям.docx').replace('ответы на замечания, объяснения атрибутов/лайка, порядок показа.','замечания, короткие ответы и изображения по образцу.');p.write_text(s,encoding='utf-8')
p=Path('tools/render_final_pdfs.py');s=p.read_text(encoding='utf-8').replace("['report','calculation','guide']","['report','calculation','corrections']");p.write_text(s,encoding='utf-8')
p=Path('tools/package_submission.py');s=p.read_text(encoding='utf-8').replace("len(report.get('run',{}).get('failures',[]))","report['run']['summary']['tests']['failed']");p.write_text(s,encoding='utf-8')
