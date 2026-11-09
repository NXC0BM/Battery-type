from pathlib import Path
src=Path('C:/Users/MAT/.codex/plugins/cache/openai-primary-runtime/documents/26.1105.12137/skills/documents/render_docx.py').read_text(encoding='utf-8')
src=src.replace('soffice = _resolve_soffice()',"soffice = r'C:\\Web\\document-renderer\\portable\\program\\soffice.com'")
src=src.replace('text=True,','text=True, encoding="cp1251", errors="replace",')
src=src.replace('tempfile.TemporaryDirectory(prefix=', 'tempfile.TemporaryDirectory(ignore_cleanup_errors=True, prefix=')
Path('tools/render_docx_windows.py').write_text(src,encoding='utf-8')
