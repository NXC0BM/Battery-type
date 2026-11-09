import json
from pathlib import Path
j=json.loads(Path('C:/Users/MAT/Desktop/WEB_ALL_IN_ONE.mdj').read_text(encoding='utf-8-sig'))
def walk(x):
 if isinstance(x,dict):
  yield x
  for v in x.values():yield from walk(v)
 elif isinstance(x,list):
  for v in x:yield from walk(v)
a=list(walk(j))
for t in ['Project','UMLModel','UMLInteraction','UMLAttribute','UMLOperation','UMLInterfaceRealization','UMLInterfaceView','UMLDependencyView','UMLSeqLifelineView','UMLSeqMessageView','ERDEntityView','ERDRelationship','ERDRelationshipView']:
 q=next((x for x in a if x.get('_type')==t),None)
 if q: print(t,json.dumps(q,ensure_ascii=False)[:4500])
