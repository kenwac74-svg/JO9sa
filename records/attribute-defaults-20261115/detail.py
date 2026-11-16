exec(open('artifacts/attribute-defaults-20261115/audit.py',encoding='utf8').read().split('for n in q.index:')[0])
mode=sys.argv[1]
if mode=='calc':
 for a,b in [(510,575),(980,1048),(1330,1377)]:
  print('\nRANGE',a,b)
  print('\n'.join(f'{i+1} {l}' for i,l in enumerate(q.body('#static_base').splitlines()) if a<=i+1<=b))
elif mode=='threshold':
 for n in q.index:
  if n.startswith('#txt'):continue
  for i,l in enumerate(q.body(n).splitlines(),1):
   if 'cont_atr_threshold[' in l and l.lstrip().startswith('cont_atr_threshold['):print(n,i,l[:200])
elif mode=='init':
 for n in ['get_special_slave','get_stock_seed','stock_to_slave','stock_to_slave_nogt']:
  if n not in q.index:continue
  for i,l in enumerate(q.body(n).splitlines(),1):
   if any(t in l for t in ['_rate[','_rate["','hygiene','makeup','perfume','manicure','epilation','hairstyle','arousal','fear','sex_sum','obedience','temp_style','_calc_']):print(n,i,l[:300])
elif mode=='special':
 lines=q.body('get_special_slave').splitlines()
 for i,l in enumerate(lines):
  if not l.strip() or l.lstrip().startswith('!'):continue
  print(i+1,l[:250])
elif mode=='metadata':
 import re
 for n in ['#variative','jo9_traits','jo9_traits_view']:
  if n not in q.index:continue
  for i,l in enumerate(q.body(n).splitlines(),1):
   if any(t in l for t in ['color','_name[','_cycle','cont_atr[','indep_atr[','_rate[']):print(n,i,l[:400])
