from pathlib import Path
import shutil, json

root=Path('submission'); source=root/'evidence/lab8'; target=root/'Скриншоты_ДЗ_и_допов'
groups={
 '01_ДЗ':['testvkr-final-window.png','report-size.png','staruml-er-window.png','staruml-classes-window.png','staruml-sequence-window.png'],
 '02_Индексы':['grid-readable.png','pagination-readable.png','index-measurements.png','redis-feed.png'],
 '03_Нативное':['native-window.png','native-detail-window.png','clip-search.png','native-lan-api.pcap','native-lan-api.txt'],
 '04_Асинхронность':['rotation-before-readable.png','rotation-after-readable.png','rotation-readable.json'],
}
for group,files in groups.items():
 folder=target/group;folder.mkdir(parents=True,exist_ok=True)
 for name in files:
  assert (source/name).exists(),name
  shutil.copy2(source/name,folder/name)
shutil.copy2(root/'diagrams/sequence-async.png',target/'04_Асинхронность/sequence-async.png')
(target/'Сведения_о_снимках.txt').write_text('''Снимки ДЗ и каждого из трёх дополнительных заданий

StarUML, Postman и native-*-window.png — настоящие снимки окон приложений.
Снимок классов StarUML показывает принятую основную структуру; полный
актуальный файл MDJ дополнительно включает класс asyncio и вторую последовательность.
clip-search.png — проверка того же CLIP-интерфейса в браузере, не снимок Tauri.
grid, pagination и rotation — реальные снимки веб-приложения.
report-size — браузерная сводка фактического размера DOCX из файловой системы.
index-measurements и redis-feed — визуализации фактических сохранённых данных,
не снимки pgAdmin или терминала. Исходные JSON находятся в evidence/lab8.
sequence-async — иллюстрация диаграммы из модели, не снимок окна StarUML.
native-lan-api.pcap — настоящий tcpdump с пакетом назначения
192.168.1.128:53000 на участке временный Docker-прокси → API.
Захват физического Ethernet-интерфейса не выполнялся.
TestVKR итогового DOCX: в режиме КуР остаётся одно замечание к названию работы.
''',encoding='utf-8')
branches=[
 ('Индексы — бэкенд','Battery-type','battery_type-extra-indexes'),
 ('Индексы — фронтенд','Battery-type-frontend','battery_type-extra-indexes'),
 ('Нативное приложение и CLIP','Battery-type-native','battery_type-extra-native'),
 ('Асинхронность — основной бэкенд','Battery-type','battery_type-extra-async'),
 ('Асинхронность — фронтенд','Battery-type-frontend','battery_type-extra-async'),
 ('Асинхронность — отдельный сервис','Battery-type-async','battery_type-extra-async'),
]
lines=['Ветки дополнительных заданий battery_type','',
       'Для списка сдачи старосте: ДЗ/ЛР8; индексы и Redis-лента;',
       'нативное приложение Tauri с CLIP; межсервисное взаимодействие asyncio.','',
       'Теория: два вопроса по ДЗ, вопрос по статье для ОТЛ, по одному вопросу на доп.',
       'Подготовленные формулировки находятся в Теория_ДЗ_и_допов.docx.','',
       'Ветки содержат итоговую накопленную реализацию; это не изолированные варианты без других допов.','']
for label,repo,branch in branches:lines.extend([label, f'https://github.com/NXC0BM/{repo}/tree/{branch}',''])
(root/'Ветки_и_теория_допов.txt').write_text('\n'.join(lines),encoding='utf-8')
(source/'extra-branches.json').write_text(json.dumps([{'task':label,'repo':repo,'branch':branch,'url':f'https://github.com/NXC0BM/{repo}/tree/{branch}'} for label,repo,branch in branches],ensure_ascii=False,indent=2),encoding='utf-8')
temporary=source/'native-current-http.pcap'
if temporary.exists():shutil.move(str(temporary),str(root/'qa/native-current-http.pcap'))
print('Screenshots grouped for homework and three extras; branch map written')
