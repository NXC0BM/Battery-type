from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
import pdfplumber
folder=Path('submission/qa/report-v2')
with pdfplumber.open(folder/'report.pdf') as pdf:
 for i,p in enumerate(pdf.pages,1):
  t=p.extract_text() or '';print(i,len(t),t[:85].replace('\n',' / '),'END',t[-100:].replace('\n',' / '))
for group in range(3):
 sheet=Image.new('RGB',(1200,3*570),'#dddddd')
 for j in range(6):
  idx=group*6+j+1;im=Image.open(folder/f'page-{idx}.png');im.thumbnail((580,530));x=(j%2)*600;y=(j//2)*570;sheet.paste(im,(x,y+25));ImageDraw.Draw(sheet).text((x+10,y+5),str(idx),fill='black')
 sheet.save(folder/f'contact-{group+1}.jpg')
