"""Fetch only the current commit's successful GitHub Actions executable."""
from pathlib import Path
import subprocess, urllib.request, json, io, zipfile, hashlib, time

repo = 'C:/Web/Battery-type-native'
base = ['git', '-C', repo, '-c', 'safe.directory='+repo]
sha = subprocess.check_output(base+['rev-parse', 'HEAD'], text=True).strip()
credential = subprocess.run(base+['credential', 'fill'], input='protocol=https\nhost=github.com\n\n', text=True, capture_output=True, check=True)
values = dict(line.split('=', 1) for line in credential.stdout.splitlines() if '=' in line)
headers = {'Authorization': 'Bearer '+values['password'], 'Accept': 'application/vnd.github+json'}
class ArtifactRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, response_headers, newurl):
        redirected = super().redirect_request(req, fp, code, msg, response_headers, newurl)
        if not newurl.startswith('https://api.github.com/'):
            redirected.remove_header('Authorization')
        return redirected
opener = urllib.request.build_opener(ArtifactRedirect)
def request(path):
    url = 'https://api.github.com/repos/NXC0BM/Battery-type-native/'+path
    if '/zip' in path: url += '?fresh='+str(time.time_ns())
    with opener.open(urllib.request.Request(url, headers=headers)) as response:
        return response.read()
runs = json.loads(request('actions/runs?per_page=10'))['workflow_runs']
matches = [r for r in runs if r['head_sha']==sha and r['head_branch']=='main']
assert matches, 'No build for current native commit'
run = matches[0]
print(json.dumps({k:run[k] for k in ['id', 'status', 'conclusion', 'html_url', 'head_sha']}))
if run['status']!='completed': raise SystemExit(0)
assert run['conclusion']=='success', 'Native build failed'
artifacts = json.loads(request(f"actions/runs/{run['id']}/artifacts"))['artifacts']
artifact = next(a for a in artifacts if a['name']=='battery_type-windows' and not a['expired'])
with zipfile.ZipFile(io.BytesIO(request(f"actions/artifacts/{artifact['id']}/zip"))) as archive:
    names = [n for n in archive.namelist() if n.endswith('battery_type-native.exe')]
    assert len(names)==1
    binary = archive.read(names[0])
    assert binary.startswith(b'MZ')
for target in ['submission/native/battery_type-native.exe', 'C:/Web/native-build-final/battery_type-native.exe']:
    Path(target).write_bytes(binary)
metadata = {'date': '2026-11-25', 'workflow': run['html_url'], 'commit': sha, 'sha256': hashlib.sha256(binary).hexdigest(), 'bytes': len(binary), 'uiVerified': False, 'note': 'Windows Actions build. Search checked headlessly in shared React/Worker source; no native window opened per user instruction.'}
Path('submission/evidence/lab8/native-build.json').write_text(json.dumps(metadata, indent=2)+'\n', encoding='utf-8')
print('Downloaded current Windows executable:', metadata['sha256'])
