"""Read-only presentation metadata from WORK; never executes QSP expressions."""
import hashlib,re
from master_editor import QspDocument,literal

ATTRS={'beauty':'beauty','exotic':'exotic','stamina':'stamina','sensitivity':'sensitivity','temper':'temper','intellect':'intellect','ego':'ego','pride':'pride','fat':'fat','style':'style','fame':'girl_fame','mood':'mood','arousal':'excitement'}
WORK=['service','cook','nurse','secretary','gladiatrix','alchemy','enchanter','expression','calisthenics','art','music','pet','dressage','cowSK']
DETAIL_LABELS={'sub_bestiality':'동물 상대','sub_horse':'말 상대','sub_tentacles':'촉수','sub_arachnidspider':'거미형 상대','sub_polypusvermin':'해양 촉수','sub_nipplefuck':'유두 성교'}
SKILLS=[('petting','애무',['sub_hug','sub_hj','sub_fj','sub_paizuri']),('oral','구강',['sub_kiss','sub_tongue','sub_bj','sub_dt','sub_asslik']),('penetration','삽입',['sub_vaginal','sub_anal','sub_fisting','anal_stretch']),('orgy','단체 섹스',['sub_threesome','sub_dp','sub_tp','sub_gangbang','sub_bukkake']),('roleplay','노출',['sub_seduce','sub_masturbation','sub_dildo','sub_exhibit','sub_humiliation']),('fetishism','페티시즘',['sub_enema','sub_mazo','sub_selfpain','sub_piss','sub_kopro']),('xenophily','이종',['sub_zoosex','sub_bestiality','sub_horse','sub_tentacles','sub_arachnidspider','sub_polypusvermin']),('nipplefuck','유두 성교',['sub_nipplefuck']),('lesbiansex','레즈비언 섹스',['sub_lesbiansex1','sub_lesbiansex2','sub_lesbiansex3','sub_lesbiansex4'])]
STATUS=[('mood','기분','#187700'),('arousal','흥분','#ad0e7b'),('fear','두려움','#960018'),('angst','절망','#464451'),('spoil','응석','#EE1289'),('moral','헌신','#008080'),('instinct','사육','#9e8e00'),('custom','습관','#082567'),('rational','인식','#B452CD')]
SIM_NUMBERS={k for k,_,_ in STATUS}|{'rate.'+k for k,_,_ in STATUS}|{'sex_sum','obedience','supermacy'}
PSY_KEYS={'servile','obedient','optimistic','soft','docile','reluctant','resistant','arrogant','hateful','frightened','lachrymose','depresive','broken','hysteric','horny'}
def validate_simulation(value):
 if not isinstance(value,dict) or set(value)-SIM_NUMBERS-{'psy_status'}:raise ValueError('알 수 없는 시뮬레이션 항목입니다.')
 for k,v in value.items():
  if k=='psy_status':
   if v not in PSY_KEYS:raise ValueError('정신 상태 코드를 확인하세요.')
  elif type(v) is not int or abs(v)>9007199254740991:raise ValueError('시뮬레이션 수치는 정수로 입력하세요.')
 return dict(value)

def metadata(raw,view_js='',view_css=''):
 q=QspDocument(raw);static=q.body('#static_base') if '#static_base' in q.index else '';var=q.body('#variative') if '#variative' in q.index else '';debug=q.body('debug_info') if 'debug_info' in q.index else ''
 palettes={k:{} for k in ['skill','rank','stat','plain']}
 for m in re.finditer(r"\$_font_col(_skill|_rank|_stat)?\[(\d+)\]\s*=\s*'[^\r\n]*?color\s*=\s*\"(#[0-9a-fA-F]{6})\"",static):palettes[(m[1] or '_plain')[1:]][int(m[2])]=m[3]
 labels={m[1]:literal(m[2]) for m in re.finditer(r"\$atr_name\['([^']+)'\]\s*=\s*('(?:''|[^'])*')",var)}
 arrays={}
 for m in re.finditer(r"\$(\w+)\[(-?\d+)\]\s*=\s*\$?dyneval\(\$vb_cycle(_skill|_stat|_rank)?,\s*(\d+),\s*('(?:''|[^'])*')\)",var):
  arrays.setdefault(m[1],{})[int(m[2])]={'text':literal(m[5]),'cycle':(m[3] or '_plain')[1:],'index':int(m[4])}
 for m in re.finditer(r"\$(\w+)\[(-?\d+)\]\s*=\s*('(?:''|[^'\r\n])*')",var):
  arrays.setdefault(m[1],{})[int(m[2])]={'text':re.sub('<[^>]+>','',literal(m[3])),'cycle':'plain','index':11}
 values={key:arrays.get(arr,{}) for key,arr in ATTRS.items()}
 for key in WORK+[x[0] for x in SKILLS]+[k for _,_,children in SKILLS for k in children]:
  values[key]=arrays.get('slave_'+key,{})
  if key not in labels and values[key]:labels[key]=re.sub(r'\s+[FDCBAS](?:\+\+)?$','',values[key].get(0,next(iter(values[key].values())))['text'])
 for key in [k for k in labels if k.startswith('master_')]:
  # Master attributes use their own arrays if present; their values are not always skill grades.
  if key in arrays:values[key]=arrays[key]
 for key,label in DETAIL_LABELS.items():
  labels.setdefault(key,label)
  if not values.get(key):values[key]={i:{'text':label+' '+grade,'cycle':'skill','index':i} for i,grade in enumerate('FDCBAS')}
 psych={}
 for m in re.finditer(r"if \$slave_psy_status = '([^']+)': \$slave_psy_status = '<font color=\"(#[0-9a-fA-F]{6})\">([^<]+)</font>'",debug):psych[m[1]]={'text':m[3],'color':m[2]}
 seed=q.body('get_stock_seed') if 'get_stock_seed' in q.index else ''
 supported=sorted(set(re.findall(r'\bseed_(\w+)\[stock_type\]',seed)))
 trait_colors={}
 def norm(text):return re.sub(r'[\s\[\]]','',text)
 cycle=re.compile(r"\$?dyneval\(\$vb_cycle(_skill|_stat|_rank)?,\s*(\d+),\s*(['\"])([^'\"]+)\3\)")
 # Feature lists have priority over incidental text elsewhere in the game.
 ordered=[static[static.find('$update_slave_features_list = {'):]]+[q.body(n) for n in q.index if n not in ['#static_base'] and not n.startswith('#txt')]
 for body in ordered:
  for match in cycle.finditer(body):
   color=palettes[(match[1] or '_plain')[1:]].get(int(match[2]))
   if color:trait_colors.setdefault(norm(match[4]),color)
  for match in re.finditer(r'color\s*[:=]\s*["\']?(#[0-9a-fA-F]{6})[;"\']?[^>]*>([^<>]+)</',body):
   trait_colors.setdefault(norm(match[2]),match[1])
 # The game profile applies another grade/title layer in JS and CSS.
 profile_grades={}
 grade_block=re.search(r'var grades\s*=\s*\{([^}]+)\}',view_js)
 if grade_block:profile_grades={key:int(value) for key,value in re.findall(r'(\w+)\s*:\s*(\d+)',grade_block[1])}
 profile_colors={int(m[1]):m[2] for m in re.finditer(r'data-grade="(\d+)"[^\r\n{]*\{color:(#[0-9a-fA-F]{6})',view_css)}
 for line in (q.body('jo9_traits').splitlines() if 'jo9_traits' in q.index else []):
  if '$result +=' not in line:continue
  match=re.search(r"''describe''\s*,\s*''(\w+)''[^>]*>([^<>]+)</a>",line)
  if match and match[1] in profile_grades:
   grade=profile_grades[match[1]];trait_colors[norm(match[2])]=profile_colors.get(grade,palettes['skill'].get(grade,'#000000'))
 title_match=re.search(r'data-kind="title"[^\r\n{]*\{color:(#[0-9a-fA-F]{6})',view_css)
 title_color=title_match[1] if title_match else '#5c351d'
 thresholds={int(m[1]):int(m[2]) for m in re.finditer(r'(?m)^cont_atr_threshold\[(\d+)\]\s*=\s*(\d+)',var)}
 return {'qspHash':hashlib.sha256(raw).hexdigest(),'sources':['#variative','#static_base','debug_info','get_stock_seed','content/js/jo9_traits_view.js','css/jo9_traits_view.css'],'traitColors':trait_colors,'titleColor':title_color,'continuousThresholds':[thresholds.get(i,[0,10,20,40,80,160][i]) for i in range(6)],'palettes':palettes,'labels':labels,'values':values,'psych':psych,'status':[{'key':k,'label':label,'color':c} for k,label,c in STATUS],'skills':[{'key':k,'label':label,'children':kids} for k,label,kids in SKILLS],'workSkills':WORK,'supportedSeeds':supported}

_cache={}
def read_metadata(path):
 js=path.parent/'content/js/jo9_traits_view.js';css=path.parent/'css/jo9_traits_view.css'
 key=tuple((str(p),p.stat().st_mtime_ns,p.stat().st_size) if p.exists() else (str(p),None,None) for p in [path,js,css])
 if key not in _cache:
  result=metadata(path.read_bytes(),js.read_text('utf-8-sig') if js.exists() else '',css.read_text('utf-8-sig') if css.exists() else '');_cache.clear();_cache[key]=result
 return _cache[key]
