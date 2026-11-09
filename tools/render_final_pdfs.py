from pathlib import Path
from pdf2image import convert_from_path
from PIL import Image,ImageDraw
import pdfplumber
folder=Path('submission/qa/final')
for name in ['report','calculation','corrections']:
 target=folder/name;target.mkdir(exist_ok=True)
 images=convert_from_path(str(folder/(name+'.pdf')),dpi=110,poppler_path='C:/Users/MAT/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin')
 for i,im in enumerate(images,1):im.save(target/f'page-{i}.png')
 with pdfplumber.open(folder/(name+'.pdf')) as pdf:
  print(name,len(images),'pages')
  for i,p in enumerate(pdf.pages,1):
   t=p.extract_text() or '';print(i,len(t),t[:38].replace('\n',' / '))
 for start in range(0,len(images),6):
  sheet=Image.new('RGB',(1200,1710),'#ddd');draw=ImageDraw.Draw(sheet)
  for j,im in enumerate(images[start:start+6]):
   im=im.copy();im.thumbnail((580,530));x=j%2*600;y=j//2*570;sheet.paste(im,(x,y+25));draw.text((x+10,y+5),str(start+j+1),fill='black')
  sheet.save(target/f'contact-{start//6+1}.jpg')
a3=convert_from_path(str(Path('submission/А3_перенос_ёмкости_и_напряжения.pdf')),dpi=130,poppler_path='C:/Users/MAT/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin');a3[0].save(folder/'a3.png')
