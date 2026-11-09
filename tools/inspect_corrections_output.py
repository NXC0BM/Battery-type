from pathlib import Path
from pdf2image import convert_from_path
from PIL import Image,ImageDraw
import pdfplumber
root=Path('submission/qa/final');target=root/'corrections';target.mkdir(exist_ok=True)
with pdfplumber.open(root/'corrections.pdf') as p:
 print('pages',len(p.pages))
 for i,pg in enumerate(p.pages,1):
  t=pg.extract_text() or '';print(i,len(t),t[:90].replace('\n',' / '))
images=convert_from_path(str(root/'corrections.pdf'),dpi=110,poppler_path='C:/Users/MAT/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin')
for i,im in enumerate(images,1):im.save(target/f'page-{i}.png')
for start in range(0,len(images),6):
 sheet=Image.new('RGB',(1200,1710),'#ddd');dd=ImageDraw.Draw(sheet)
 for j,im in enumerate(images[start:start+6]):
  im=im.copy();im.thumbnail((580,530));x=j%2*600;y=j//2*570;sheet.paste(im,(x,y+25));dd.text((x+10,y+5),str(start+j+1),fill='black')
 sheet.save(target/f'contact-{start//6+1}.jpg')
