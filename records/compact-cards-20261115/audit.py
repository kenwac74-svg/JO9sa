from pathlib import Path
import sys
sys.path.insert(0,'G:/somi/JO9sa/tools/modding-hub')
from master_editor import QspDocument
q=QspDocument(Path('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp').read_bytes())
for n in ['get_stock_seed','generate_slave','#static_base']:
 if n not in q.index:continue
 lines=q.body(n).splitlines()
 for i,l in enumerate(lines):
  if 'seed_sub_hug' in l or "['petting'] = (" in l or 'get_stock_seed' in l and not l.startswith('!'):print(n,i+1,l[:350])
for n in q.index:
 if n.startswith('#txt'):continue
 for i,l in enumerate(q.body(n).splitlines(),1):
  if 'get_stock_seed' in l and "gs " in l and not l.strip().startswith('!'):print(n,i,l[:250])
