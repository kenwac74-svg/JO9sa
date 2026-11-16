from pathlib import Path
import sys,re,json
sys.path.insert(0,'G:/somi/JO9sa/tools/modding-hub')
from master_editor import QspDocument
q=QspDocument(Path('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp').read_bytes())
mode=sys.argv[1]
if mode=='palette':
 for n in q.index:
  for i,l in enumerate(q.body(n).splitlines(),1):
   if re.match(r'\s*\$_font_col',l):print(n,i,l[:500])
elif mode=='state':
 for n in q.index:
  if n.startswith('#txt'):continue
  lines=q.body(n).splitlines()
  for i,l in enumerate(lines):
   if any(t in l for t in ['psy_basic_rate','basic_rate','sex_school','두려움 등급','현재 복종도','성교육 계','흥분 단계']):
    print(n,i+1,l[:700])
elif mode=='seed':
 lines=q.body('get_stock_seed').splitlines()
 for i,l in enumerate(lines):
  if any(t in l for t in ['psy','fear','angst','moral','instinct','rational','custom','arousal','obed','spoil','supermacy','style','mood']):print(i+1,l[:1000])
elif mode=='skills':
 for n in q.index:
  if n.startswith('#txt'):continue
  for i,l in enumerate(q.body(n).splitlines(),1):
   if any(t in l for t in ["['petting'] =","['oral'] =","['penetration'] =","['orgy'] =","['roleplay'] =","['fetishism'] =","['xenophily'] =","['nipplefuck'] =","['lesbiansex'] ="]):print(n,i,l[:1500])
elif mode=='dump':
 for n in sys.argv[2:]:
  Path(__file__).with_name(re.sub(r'[^A-Za-z0-9_-]','_',n)+'.txt').write_text(q.body(n),encoding='utf8')
