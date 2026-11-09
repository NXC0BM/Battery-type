from pathlib import Path
import json
p=Path('submission/WEB_ALL_IN_ONE_fixed.mdj');j=json.loads(p.read_text(encoding='utf-8'))
def walk(x):
 if isinstance(x,dict):
  if x.get('_type')=='ERDDiagram':x['defaultDiagram']=True
  for v in x.values():walk(v)
 elif isinstance(x,list):
  for v in x:walk(v)
walk(j);p.write_text(json.dumps(j,ensure_ascii=False,indent=2),encoding='utf-8')
p=Path('tools/build_diagrams.py');s=p.read_text(encoding='utf-8').replace("name='ER атрибуты и значения',ownedViews=[]","name='ER атрибуты и значения',defaultDiagram=True,ownedViews=[]");p.write_text(s,encoding='utf-8')
from docx import Document
p=next(Path('C:/Web/course-reference/reports').glob('*.docx'));d=Document(p)
for a,b in [(0,35),(207,240)]:
 for i in range(a,b):
  p=d.paragraphs[i]
  if p.text:print(i,p.style.name,'align',p.alignment,'text',p.text[:180])
