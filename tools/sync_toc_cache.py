from pathlib import Path
import json,re,pdfplumber
root=Path('submission/qa/background-final')
labels=['ВВЕДЕНИЕ','1 ПРЕДМЕТНАЯ ОБЛАСТЬ','2 АРХИТЕКТУРА','2.1 Таблицы базы данных','3 АЛГОРИТМЫ','3.1 Расчёт аппаратных требований','3.2 Проверка дополнительных алгоритмов','4 ОПИСАНИЕ ИНТЕРФЕЙСА','ЗАКЛЮЧЕНИЕ','СПИСОК ИСПОЛЬЗОВАННЫХ ИСТОЧНИКОВ','Приложение А Техническое задание','Приложение Б Методы веб сервиса']
def normalize(text):return re.sub(r'\s+',' ',text).strip().casefold()
found={}
with pdfplumber.open(root/'report.pdf') as pdf:
 for number,page in enumerate(pdf.pages,1):
  for line in (page.extract_text() or '').splitlines():
   for label in labels:
    if normalize(line)==normalize(label):found[label]=number
assert len(found)==len(labels),set(labels)-set(found)
(root/'toc-pages.json').write_text(json.dumps(found,ensure_ascii=False,indent=2),encoding='utf-8')
print('TOC pages:',json.dumps(found,ensure_ascii=True))
