import json
from pathlib import Path
j=json.loads(Path('C:/Users/MAT/Desktop/WEB_ALL_IN_ONE.mdj').read_text(encoding='utf-8-sig'))
def walk(x):
 if isinstance(x,dict):
  if x.get('_type') in ['UMLClass','UMLInterface','UMLClassView','UMLInterfaceView','UMLLifeline','UMLLifelineView','UMLSequenceDiagram','UMLMessage','ERDEntity','ERDColumn']:
   a={k:v for k,v in x.items() if k not in ['ownedViews','ownedElements','attributes','operations','columns']}
   print(json.dumps(a,ensure_ascii=False)[:1800])
  for v in x.values():walk(v)
 elif isinstance(x,list):
  for v in x:walk(v)
walk(j)
