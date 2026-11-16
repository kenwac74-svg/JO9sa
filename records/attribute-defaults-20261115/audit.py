from pathlib import Path
import sys
sys.path.insert(0,'G:/somi/JO9sa/tools/modding-hub')
from master_editor import QspDocument
q=QspDocument(Path('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp').read_bytes())
mode=sys.argv[1] if len(sys.argv)>1 else 'initial'
for n in q.index:
 if n.startswith('#txt'):continue
 lines=q.body(n).splitlines()
 for i,l in enumerate(lines):
  if mode=='initial' and any(t in l for t in ["dynslave['style'] =","stock['style'] =","seed_style","dynslave['fame'] =","seed_mood"]):
   print(n,i+1,'\n'.join(lines[max(0,i-2):i+3])[:700])
  if mode=='calc' and n in ['#static_base','get_stock_seed','get_special_slave','generate_stock'] and ('style' in l or 'temp_style' in l or 'fame' in l or 'mood' in l):print(n,i+1,l[:600])
  if mode=='trait' and any(t in l for t in ['slave_features_list',"$traits_color",'traits_color','trait_color']):print(n,i+1,l[:300])
