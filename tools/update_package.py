import json
from pathlib import Path
p=Path('battery-runtime-backend/package.json');j=json.loads(p.read_text(encoding='utf-8-sig'));j['scripts']['migrate']='node scripts/migrate.cjs';j['scripts']['review:init']='node scripts/init-review.cjs';j['scripts']['review:verify']='node scripts/verify-review.cjs';j['scripts']['review:migration']='node scripts/verify-migration.cjs';p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
