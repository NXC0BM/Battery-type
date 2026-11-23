from pathlib import Path
from pdf2image import convert_from_path
from PIL import Image,ImageDraw
import pdfplumber,json,sys
sys.stdout.reconfigure(encoding='utf-8')
root=Path('submission/qa/background-final')
summary={}
for name in ['report','corrections','calculation']:
 file=root/(name+'.pdf');target=root/name;target.mkdir(exist_ok=True)
 with pdfplumber.open(file) as pdf:
  pages=[]
  for number,page in enumerate(pdf.pages,1):
   text=page.extract_text() or ''
   pages.append({'page':number,'characters':len(text),'start':text[:120],'images':len(page.images),'outOfPage':any(i['x0']<0 or i['x1']>page.width+1 or i['top']<0 or i['bottom']>page.height+1 for i in page.images)})
   (target/f'page-{number}.txt').write_text(text,encoding='utf-8')
  summary[name]=pages
  print(name,len(pages),'pages');print('\n'.join(f"{p['page']}: {p['characters']} chars; {p['start'][:75]!r}; imageOutside={p['outOfPage']}" for p in pages))
 images=convert_from_path(str(file),dpi=110,poppler_path='C:/Users/MAT/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin')
 for i,image in enumerate(images,1):image.save(target/f'page-{i}.png')
 for start in range(0,len(images),6):
  sheet=Image.new('RGB',(1400,1980),'#ddd');draw=ImageDraw.Draw(sheet)
  for j,image in enumerate(images[start:start+6]):
   image=image.copy();image.thumbnail((680,625));x=j%2*700;y=j//2*660;sheet.paste(image,(x,y+28));draw.text((x+12,y+8),str(start+j+1),fill='black')
  sheet.save(target/f'contact-{start//6+1}.jpg')
(root/'layout.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
