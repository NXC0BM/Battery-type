"""Read-only publication review; raw captures and local credentials are excluded."""
from pathlib import Path
import subprocess, re, json, hashlib
from zipfile import ZipFile
import pdfplumber

root=Path.cwd()
def git(*args):
    return subprocess.check_output(['git','-c','safe.directory=C:/Web/Battery-type',*args]).decode('utf-8').split('\0')
paths=sorted(set(filter(None,git('diff','--name-only','-z')+git('ls-files','--others','--exclude-standard','-z'))))
patterns=[r'gh[pousr]_[A-Za-z0-9]{20,}',r'github_pat_[A-Za-z0-9_]{20,}',
          r'-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----',
          r'(?i)(?:connect\.sid=|s%3A)[A-Za-z0-9%._-]{20,}',
          r'eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}']
manifest=[]
for path in paths:
    p=root/path
    assert p.is_file(),path
    assert 'qa' not in p.relative_to(root).parts,path
    assert p.suffix.lower() in {'.py','.cjs','.ts','.sql','.md','.mdj','.json','.docx','.pdf','.png','.txt'} or path=='.gitignore',path
    assert not any(x in path.lower() for x in ['.env','credential','secret','pcap']),path
    data=p.read_bytes()
    if p.suffix=='.docx':
        with ZipFile(p) as z:text='\n'.join(z.read(n).decode('utf-8',errors='replace') for n in z.namelist() if n.startswith('word/') and n.endswith('.xml'))
    elif p.suffix=='.pdf':
        with pdfplumber.open(p) as pdf:text='\n'.join(page.extract_text() or '' for page in pdf.pages)
    elif p.suffix=='.png':
        assert data.startswith((b'\x89PNG\r\n\x1a\n',b'\xff\xd8'));text=''
    else:text=data.decode('utf-8')
    assert not any(re.search(pattern,text) for pattern in patterns),f'Secret-like value requires review: {path}'
    manifest.append({'path':path,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
result={'files':manifest,'review':'Text, DOCX XML and PDF text scanned for session tokens, GitHub tokens, JWTs and private keys. Native window screenshots visually reviewed. New captures and exe are ignored; reviewed metadata contains only Host/User-Agent and no Cookie values.',
        'excludedRawCaptures':['submission/evidence/lab8/native-http.pcap','submission/evidence/lab8/native-lan-api.pcap'],
        'reviewedImages':'StarUML core diagrams, TestVKR one-warning result, Postman GET Headers, native catalog/detail, report size and index receipt. Grouped images are copies of these or existing reviewed application screenshots.'}
out=root/'submission/qa/public-payload-review.json';out.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Reviewed {len(manifest)} explicit files, {sum(x["bytes"] for x in manifest)} bytes. No raw PCAP/EXE, QA directory, environment files or detected secret values included.')
