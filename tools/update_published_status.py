from pathlib import Path
p=Path('tools/build_guide.py');s=p.read_text(encoding='utf-8')
s=s.replace('Подготовлен отдельный локальный Git-репозиторий фронтенда. Удалён Outlet Context; состояние находится в страницах.','Создан отдельный GitHub-репозиторий Battery-type-frontend. Удалён Outlet Context; состояние находится в страницах.')
s=s.replace('C:/Web/Battery-type-frontend. Публикация нового репозитория GitHub ещё требуется.','github.com/NXC0BM/Battery-type-frontend; локально C:/Web/Battery-type-frontend.')
s=s.replace("'Публикация отдельного фронтенд-репозитория на GitHub и отправка подготовленных веток.',",'')
p.write_text(s,encoding='utf-8')
p=Path('README.md');s=p.read_text(encoding='utf-8').replace('Весь комплект подготовлен локально; факт принятия преподавателем не утверждается.','Фронтенд: https://github.com/NXC0BM/Battery-type-frontend . Ветки исправлений подготовлены отдельно от исходных; факт принятия преподавателем не утверждается.');p.write_text(s,encoding='utf-8')
