from pathlib import Path
p=Path('tools/build_documents.py');s=p.read_text(encoding='utf-8').replace('[.6,4.4,3.4,4.1,3.5]','[.8,4.4,3.4,4.1,3.3]')
s=s.replace("p(d,'Cookie: connect.sid=<значение сессии>. В Postman заголовок Cookie должен быть включён галочкой. Для JSON включён Content-Type: application/json. Для form-data Content-Type формирует сам Postman с boundary; задавать его вручную нельзя.')", "note=p(d,'Заголовки Postman: Cookie включён у создателя; JSON — Content-Type: application/json. Для form-data Content-Type с boundary формирует Postman.'); note.paragraph_format.line_spacing=1\nfor run in note.runs:run.font.size=Pt(12)")
p.write_text(s,encoding='utf-8')
