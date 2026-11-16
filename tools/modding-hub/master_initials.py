"""JO9 MOD MASTER_INITIALS_20261115: source-derived starting-field inventory.

Never executes QSP. Catalogues assignments and preserves their source phase.
"""
import re,json,hashlib,functools

IDENT=r'\$?[^\W\d]\w*'
INDEX=r'''(?:-?\d+|'(?:''|[^'])*'|"(?:""|[^"])*")'''
BIND=re.compile(r'('+IDENT+r'(?:\[\s*'+INDEX+r'\s*\])?)\s*(\+=|-=|=(?!=))',re.UNICODE)
SOURCES=['init_game','init_story_mode','init_custom_game','hero_creation','hero_description','start_game','new_estate']
ALIASES={'$master_name',' $master_name','$master_ava','$master_ava_color','hero_choice','hero_select'}
TEMP={'i','a','b','c','j','k','txt','sp_txt','change_loc','snk_room_target','$place','$current_sub','$secondary_stt','ui_style','release_notes_message','daycount','id','href','src','is_home'}
RUNTIME=['$calculate_attributes','$moodlets_account']
CM={'jo9_cruel_mercy','jo9_cruel_mercy_half'}

def canonical(key):
 base=key.split('[',1)[0];index=key[len(base):].strip()
 if index:
  value=index[1:-1].strip()
  if value.startswith('"'):value="'"+value[1:-1].replace('""','"').replace("'","''")+"'"
  index='['+value+']'
 return base.lower()+index

def mask(code):
 """A same-length mask hides quotes/comments, including their separators."""
 out=list(code);q='';comment=False;comment_depth=0;i=0
 while i<len(code):
  ch=code[i]
  if comment:
   if ch=='{':comment_depth+=1
   elif ch=='}' and comment_depth:comment_depth-=1
   if ch in '\r\n' and not comment_depth:comment=False
   elif ch not in '\r\n':out[i]='\x00'
  elif q:
   out[i]=' '
   if ch==q:
    if i+1<len(code) and code[i+1]==q:out[i+1]=' ';i+=1
    else:q=''
  elif ch=='!':
   previous=code[:i].rstrip(' \t')[-1:] if i else ''
   if not previous or previous in '\r\n&:{':comment=True;out[i]='\x00'
  elif ch in "'\"":q=ch;out[i]=' '
  i+=1
 return ''.join(out)

def scalar(expression):
 e=expression.strip()
 if re.fullmatch(r'-?\d+',e):return int(e)
 if len(e)>=2 and e[0] in "'\"" and e[-1]==e[0]:
  q=e[0];inside=e[1:-1]
  if q not in inside.replace(q+q,''):return inside.replace(q+q,q)
 return None

def assignments(code,location=''):
 hidden=mask(code);records=[];stack=[];line_starts=[0]
 line=0
 for original in code.splitlines(keepends=True):
  start=line_starts[-1];end=start+len(original);visible=hidden[start:end];stripped=visible.strip();prefix_stack=list(stack)
  lower=stripped.lower()
  if re.match(r'^end\b',lower) and stack:stack.pop();prefix_stack=list(stack)
  elif re.match(r'^(else|elseif)\b',lower) and stack:prefix_stack=stack[:-1]+[original.strip()]
  for match in BIND.finditer(code,start,end):
   # A variable inside a string/comment is not a game assignment.
   if hidden[match.start():match.start()+1] in (' ','\x00'):continue
   before=hidden[start:match.start()];sep=max(before.rfind('&'),before.rfind(':'),before.rfind('{'),before.rfind('}'))
   lead=before[sep+1:].strip().lower()
   if re.match(r'^(if|elseif|while|for|local)\b',lead):continue
   value_start=match.end();at=value_start
   while at<len(code):
    ch=hidden[at]
    if ch in '\r\n&}\x00':break
    at+=1
   value_end=at
   # Remove a trailing inline comment, while preserving quoted ! and &.
   raw=code[value_start:value_end]
   value=raw.strip()
   if not value:continue
   key=canonical(match[1]);conditions=list(prefix_stack)
   if ':' in before and re.search(r'\bif\b',before,re.I):conditions.append(code[start:start+before.rfind(':')+1].strip())
   records.append({'key':key,'binding':match[1],'op':match[2],'expression':value,'value':scalar(value),'kind':'string' if key.startswith('$') else 'number',
    'location':location,'line':line+1,'conditional':bool(conditions),'conditions':conditions,'start':match.start(),'valueStart':value_start,'valueEnd':value_end})
  if re.match(r'^if\b',lower) and ':' in visible and not visible.split(':',1)[1].strip():stack.append(original.strip())
  elif re.match(r'^(else|elseif)\b',lower) and stack:stack[-1]=original.strip()
  line+=1;line_starts.append(end)
 return records

def disposition(record,source):
 key=record['key'];base=key.split('[',1)[0]
 if key in ALIASES:return 'alias','다른 전용 편집 항목 또는 인물 선택 번호'
 if key in TEMP or base in TEMP:return 'transient','화면/초기화 절차의 실행 임시값'
 if base.startswith(('$msg_','msg_','$difficulty_description','$bg','$place_','$estate_','$interior_')) or base in {'$study','$bed','$bath','$dungeon','$kitchen','$lab','$boudoir','$barn'}:return 'reference','화면 배치/배경 참조 · 거주지/인테리어로 계산'
 if base.startswith(('event_get','event_met','first_visit','train_slave_count')) or base in {'venera','venera2','pelageya','pelageya2','mira','zhanna','snezhana','madelyn','isabella_get'}:return 'world_state','NPC/이벤트 진행 상태 · 인물 능력치가 아님'
 if base in {'$защита','$суперудар'}:return 'reference','전투 메뉴 동작 코드 · QSP 이벤트에서 편집'
 if base.startswith(('$preset_name','$secondary_','$trace','$quest')):return 'reference','메뉴·경로·퀘스트 참조 자료'
 if base.startswith(('$assistant','$slave','assistant','slave','prisoner','contractor_demand','train_slave_training_count','trainer_slave_training_count')):return 'other_actor','다른 인물/업무의 시작 상태'
 if record['expression'].startswith('{'):return 'code','함수/메뉴 코드 · QSP 이벤트에서 편집'
 if source in RUNTIME:
  if not (base.startswith(('master_','female','guild_reputation','jo9_'))):return 'runtime_other','다른 실행 상태'
  if '_cap' in base:return 'balance','성장 계수/상한 표'
 return 'field',''

def group(key):
 base=key.split('[',1)[0]
 if key in CM:return 'CM'
 if base.startswith(('female','piercing_')):return '여주인 신체·설정'
 if base=='$master_spm':return '보유품·마법'
 if base.startswith('$master_') or base.endswith('_on') or base=='item_supermacy_bonus':return '장비·유물'
 if base.endswith(('_rate','_target')) or base=='master_check':return '성장·누적값 (고급)'
 if base.startswith(('master_','is_perv','is_kid','is_master_virgin')):return '능력치·상태·경험치'
 if base.startswith(('faction_','debt','guild_reputation','brand_','master_wealth')) or base in {'sparks','purse','noble_status'}:return '자금·세력·평판'
 if base.startswith(('inventory','fridge','lab_store','spell_','spm_','$master_spm')) or base in {'auspex','sententia_veritas','magna_magnifika','cruciato','tremendio','chaotic_essence','spawn_semen'} or any(ord(c)>127 for c in base):return '보유품·마법'
 if base in {'$estate','$starting_area','$interior','stock_limit','bath','kitchen','dungeon','lab','library','barn','boudoir','pen','stasis_tank','horse','dog','$dog_name','musical_instruments','svine','arachnidspider','polypusvermin','vibrator','cooked_food','guitar','piano','cello','violin'} or base.startswith('heavy_'):return '거주지·시설·소유물'
 return '게임 시작 설정 (고급)'

LABELS={'master_energy':'행동력','master_excitement':'흥분','master_excitement_rate':'흥분 누적값','master_wounds':'부상','master_wounds_rate':'부상 누적값','master_hygiene':'청결 등급','master_hygiene_rate':'청결 누적값','master_mood':'기분 등급','master_mood_rate':'기분 누적값','master_half_action':'행동력 반점 잔여','master_supermacy':'장악력',
 'female_virginity':'여주인 경험 상태','female_anal_description':'여주인 신체 묘사 단계','female_lactation':'수유 상태','female_nipple_piercing':'유두 피어싱','female_vaginal_modification':'신체 개조 상태','female[\'age\']':'여주인 연령 분류','female[\'boobs\']':'여주인 가슴 분류','female[\'fertility\']':'가임성','female[\'fertility_revealed\']':'가임성 발견 여부',
 '$master_armor':'방어구','$master_cloth':'평상복','$master_right_wpn':'오른손 무기','$master_left_wpn':'왼손 무기','$master_back_wpn':'등 무기','$master_arm_wpn':'팔 장비','$master_leg_wpn':'허벅지 장비','$master_head_gear':'투구','$master_earring':'귀걸이','$master_amulet':'목걸이','$master_ring':'반지','$master_karman':'주머니 장비',
 '$estate':'시작 거주지','$starting_area':'시작 지역 안내','$interior':'인테리어','stock_limit':'기본 수용 인원','sparks':'시작 스파크','debt':'부채','noble_status':'귀족 지위','guild_reputation':'길드 평판','guild_reputation_rate':'길드 평판 누적값','brand_rate':'상표 평판 누적값','get_initial_slave':'시작 인물 지급 여부','game_difficulty':'게임 난이도','difficulty_setting':'복종 난이도','is_kid':'특수 주인공 분류','is_master_virgin':'주인공 미경험 상태','is_gangbang':'단체 행동 설정'}

LABELS.update({'master_str':'힘','master_cha':'매력','master_style':'스타일','master_libido':'욕구','master_tutor':'교육','master_fighter':'전투 기술','master_butler':'관리','master_artdirector':'예술','master_medic':'의학','master_mage':'마법','master_torture':'고문','master_domination':'지배','master_bondage':'결박','master_flagelation':'채찍','master_petting':'애무','master_oral':'구강','master_penetration':'삽입','master_fetish':'페티시즘','master_vampire':'뱀파이어','master_check':'초기 경험치 환산 완료 여부','master_ill':'질병 상태','master_issues':'개인 문제 상태','master_perv_rate':'특수 욕구 진행 누적값','master_wealth':'재산 평가','master_wealth_target':'목표 재산',
 'female[\'clit_piercing\']':'클리토리스 피어싱','female[\'brand\']':'여주인 상표','female[\'breast_enchanced\']':'가슴 강화','piercing_in':'피어싱 장착 상태',
 '$master_wpn':'주 무기 (호환값)','$master_scnd':'보조 장비 (호환값)','$master_spm':'선택한 전투 기술','spm_learned':'습득한 전투 기술','inventory':'보관함','fridge':'식료품 보관함','lab_store':'연구 재료','faction_fame':'세력 명성','master_moodlet':'주인공 무들렛','faction_purchase':'세력 구매 기록',
 'bath':'욕실','kitchen':'주방','dungeon':'감옥','library':'도서관','lab':'연구실','barn':'외양간','boudoir':'개인실','pen':'우리','stasis_tank':'냉동 보관 시설','horse':'말','dog':'개','$dog_name':'개 이름','svine':'돼지','musical_instruments':'악기 보유','guitar':'기타','piano':'피아노','cello':'첼로','violin':'바이올린','vibrator':'진동기','cooked_food':'준비된 식사','arachnidspider':'거미 사육','polypusvermin':'촉수 사육',
 'heavy_frame':'전차 프레임','heavy_boards':'전차 판재','heavy_chasis':'전차 차대','heavy_wheels':'전차 바퀴','heavy_rider_armor':'전차 기수 방어구','debt_count':'부채 횟수','debt_history':'부채 이력','purse':'소지금 보조값','hero_points':'커스텀 제작 포인트','game_difficulty':'게임 난이도','difficulty_setting':'복종 난이도','story_mode':'스토리 모드','custom_game':'커스텀 모드','demo_game':'데모 모드','wizard_mode':'특수 주인공 모드'})
for _base,_label in list(LABELS.items()):
 if _base.startswith('master_') and not _base.endswith(('_rate','_target')):LABELS.setdefault(_base+'_rate',_label+' 누적값')

def label(key):
 if key in LABELS:return LABELS[key]
 root=key.split('[',1)[0]
 if '[' in key and root in LABELS:return LABELS[root]+' '+key[len(root):]
 if root.startswith('faction_purchase_'):return '세력 구매 기록 · '+root.removeprefix('faction_purchase_')
 if root.endswith('_auto_cast'):return '자동 마법 사용 · '+root.removesuffix('_auto_cast')
 if root.startswith('spell_'):return '습득 마법 · '+root.removeprefix('spell_')
 if root.startswith('cheat_'):return '치트 설정 · '+root.removeprefix('cheat_')
 return key

_CACHE={}

def clean_managed(text):
 return re.sub(r'(?m)^! JO9 MOD START MASTER_INITIALS_20261115:[^\r\n]+\r?\n.*?^! JO9 MOD END MASTER_INITIALS_20261115:[^\r\n]+(?:\r?\n|$)','',text,flags=re.S)
def base_catalog(doc,preset_codes):
 fingerprint=hashlib.sha256(doc.raw+json.dumps(preset_codes,sort_keys=False,ensure_ascii=False).encode('utf-8')).hexdigest()
 if fingerprint in _CACHE:return _CACHE[fingerprint]
 raw=[]
 for location in SOURCES+RUNTIME:
  if location in doc.index:raw.extend(assignments(clean_managed(doc.body(location)),location))
 union=[]
 for sid,code in preset_codes.items():union.extend(assignments(code,'preset:'+str(sid)))
 known={}
 for record in raw+union:
  status,reason=disposition(record,record['location']);record={**record,'disposition':status,'reason':reason}
  known.setdefault(record['key'],[]).append(record)
 fields=[]
 for key,records in known.items():
  included=[r for r in records if r['disposition']=='field']
  if not included:continue
  # The normal preset route uses game + story initialization; custom is shown as an alternative source.
  defaults=[r for location in ['init_game','init_story_mode'] for r in included if r['location']==location and not r['conditional'] and r['op']=='=']
  default=defaults[-1] if defaults else None
  kind=included[0]['kind'];value=default['value'] if default else ('' if kind=='string' else 0);expression=default['expression'] if default else ("''" if kind=='string' else '0')
  # Literal creation overrides may be applied after the ordinary preset block.
  after=[r for r in included if r['location'] in ['hero_description','start_game','new_estate']]
  reset_on_selection=any(r['location']=='init_story_mode' and r['op']=='=' and not r['conditional'] for r in included)
  phase='start' if any(r['location'] in ['start_game','new_estate'] for r in after) else 'description' if after else 'preset' if reset_on_selection else 'start'
  # Residence must be configured before new_estate consumes it.
  if key in {'$estate','$starting_area'}:phase='preset'
  if key=='$interior':phase='residence'
  derived=[r for r in records if r['location'] in RUNTIME or (r['location']=='hero_description' and r['value'] is None)]
  derived_only=not default and not after and any(r['location'] in RUNTIME and not r['conditional'] and r['op']=='=' for r in records)
  initial_value,initial_expression=(None,' / '.join(dict.fromkeys(r['expression'] for r in derived))) if derived_only else (value,expression)
  if derived_only:value,expression=initial_value,initial_expression
  unconditional=[r for r in after if not r['conditional'] and r['op']=='=']
  if any(r['conditional'] for r in after):value=None;expression=' / '.join(dict.fromkeys(r['expression'] for r in after))
  elif unconditional:value=unconditional[-1]['value'];expression=unconditional[-1]['expression']
  fields.append({'key':key,'label':label(key),'group':group(key),'kind':kind,'phase':phase,'postAssigned':bool(after),'initialValue':initial_value,'initialExpression':initial_expression,'value':value,'expression':expression,'inherited':True,
   'sources':[{k:r[k] for k in ['location','line','op','expression','conditional','conditions','disposition','reason']} for r in records],
   'recalculated':bool(derived),'conditional':any(r['conditional'] for r in after)})
 result={'fields':fields,'inventory':[{k:r[k] for k in ['key','binding','op','expression','location','line','conditional','conditions','disposition','reason']} for records in known.values() for r in records]}
 _CACHE.clear();_CACHE[fingerprint]=result;return result

def applies_to_actor(record,sid):
 unknown=False
 for condition in record['conditions']:
  m=re.fullmatch(r'\s*(?:if|elseif)\s+hero_choice\s*=\s*(\d+)\s*(?:(and)\b.*)?\s*:\s*',condition,re.I)
  if m:
   if int(m[1])!=int(sid):return False
   if m[2]:unknown=True
  else:unknown=True
 return None if unknown else True

def catalog(doc,preset_codes,code,overrides=None,sid=None):
 base=base_catalog(doc,preset_codes);present={r['key']:r for r in assignments(clean_managed(code),'preset') if r['op']=='='};overrides=overrides or {};out=[]
 for row in base['fields']:
  current=dict(row);specific=present.get(row['key'])
  if sid is not None:
   current.update(value=row['initialValue'],expression=row['initialExpression'],conditional=False)
   current['sources']=[r for r in row['sources'] if not r['location'].startswith('preset:') or r['location']=='preset:'+str(sid)]
   if specific:current.update(value=specific['value'],expression=specific['expression'],inherited=False)
   for source in current['sources']:
    if source['location'] not in ['hero_description','start_game','new_estate']:continue
    applicable=applies_to_actor(source,sid)
    if applicable is False:continue
    if applicable is None:current.update(value=None,expression=current['expression']+' / '+source['expression'],conditional=True)
    else:current.update(value=scalar(source['expression']),expression=source['expression'])
  elif specific and (row['phase']=='preset' or not row['postAssigned']):current.update(value=specific['value'],expression=specific['expression'],inherited=False)
  current.update(baseValue=current['value'],baseExpression=current['expression'])
  if row['key'] in overrides:
   value=overrides[row['key']];current.update(value=value,expression=encode_value(value),inherited=False,override=True)
  out.append(current)
 return {'fields':out,'inventory':base['inventory']}

# Managed blocks carry no additional game variables. Only the chosen actor is changed.
TAG='MASTER_INITIALS_20261115'
PHASES={'description':('hero_description',r"(?m)^[ \t]*\$secondary_stt\s*=\s*''"),
 'residence':('start_game',r"(?m)^[ \t]*gs\s+['\"]new_estate['\"]"),
 'start':('start_game',r"(?m)^[ \t]*gs\s+['\"]#npc_base['\"]")}
def encode_value(value):
 if type(value) is int:return str(value)
 if isinstance(value,str):return "'"+value.replace("'","''")+"'"
 raise ValueError('정수 또는 문자열을 입력하세요.')
def block_pattern(phase,sid):
 tag=re.escape(TAG+':'+phase+':'+str(int(sid)))
 return re.compile(r'(?m)^! JO9 MOD START '+tag+r'\r?\n(.*?)^! JO9 MOD END '+tag+r'(?:\r?\n|$)',re.S)
def strip_block(text,phase,sid):
 matches=list(block_pattern(phase,sid).finditer(text))
 if len(matches)>1:raise ValueError('시작값 편집 구간이 중복됩니다.')
 if not matches:return text
 m=matches[0];return text[:m.start()]+text[m.end():]
def read_overrides(doc,sid,code):
 out={}
 for phase in ['preset',*PHASES]:
  text=code if phase=='preset' else doc.body(PHASES[phase][0]) if PHASES[phase][0] in doc.index else ''
  matches=list(block_pattern(phase,sid).finditer(text))
  if len(matches)>1:raise ValueError('시작값 편집 구간이 중복됩니다.')
  if matches:
   for r in assignments(matches[0][1]):
    if r['op']=='=' and r['value'] is not None:out[r['key']]=r['value']
 return out
def owned_blocks(doc,sid,code):
 out={}
 for phase in ['preset',*PHASES]:
  text=code if phase=='preset' else doc.body(PHASES[phase][0]) if PHASES[phase][0] in doc.index else ''
  out[phase]=[m[0] for m in block_pattern(phase,sid).finditer(text)]
 return out
def merge_changes(fields,current,patch):
 if not isinstance(patch,dict):raise ValueError('시작값 수정은 객체여야 합니다.')
 known={r['key']:r for r in fields};out=dict(current)
 for key,value in patch.items():
  if key not in known:raise ValueError('목록에 없는 시작값입니다: '+key)
  if value is None:out.pop(key,None);continue
  kind=known[key]['kind']
  if (kind=='number' and (type(value) is not int or abs(value)>9007199254740991)) or (kind=='string' and (not isinstance(value,str) or len(value)>10000 or '\n' in value or '\r' in value)):
   raise ValueError('시작값의 정수/문자열 형식이 맞지 않습니다: '+key)
  out[key]=value
 return out
def apply_overrides(doc,sid,code,overrides,fields):
 # Direct source edits remain available. Do not silently discard user formulas
 # while regenerating a block which was originally produced as literal values.
 for phase,blocks in owned_blocks(doc,sid,code).items():
  for block in blocks:
   lines=block.splitlines()[1:-1]
   if phase!='preset':
    if not lines or not re.fullmatch(r'\s*if\s+hero_choice\s*=\s*'+str(int(sid))+r'\s*:\s*',lines[0],re.I) or lines[-1].strip().lower()!='end':
     raise ValueError('표 지정 구간을 직접 수정했습니다. 이 구간은 원본 코드에서 편집하세요.')
    lines=lines[1:-1]
   seen=set()
   for line in lines:
    rows=assignments(line)
    if len(rows)!=1 or rows[0]['conditional'] or rows[0]['op']!='=' or rows[0]['value'] is None or rows[0]['key'] in seen or line[:rows[0]['start']].strip() or line[rows[0]['valueEnd']:].strip():
     raise ValueError('표 지정 구간을 직접 수정했습니다. 이 구간은 원본 코드에서 편집하세요.')
    seen.add(rows[0]['key'])
 known={r['key']:r for r in fields};groups={k:{} for k in ['preset',*PHASES]}
 for key,value in overrides.items():
  if key not in known:raise ValueError('목록에 없는 시작값입니다: '+key)
  groups[known[key]['phase']][key]=value
 bodies={};code=strip_block(code,'preset',sid)
 for phase,values in groups.items():
  location=None if phase=='preset' else PHASES[phase][0]
  original=code if phase=='preset' else bodies.get(location,doc.body(location) if location in doc.index else '')
  text=strip_block(original,phase,sid)
  if values:
   nl='\r\n' if '\r\n' in text else '\n';tag=TAG+':'+phase+':'+str(int(sid))
   lines=['! JO9 MOD START '+tag]
   if phase!='preset':lines.append('if hero_choice = '+str(int(sid))+':')
   lines.extend((' ' if phase!='preset' else '')+key+' = '+encode_value(value) for key,value in sorted(values.items()))
   if phase!='preset':lines.append('end')
   lines.append('! JO9 MOD END '+tag);block=nl.join(lines)+nl
   if phase=='preset':text+=(nl if text and not text.endswith('\n') else '')+block
   else:
    visible=mask(text)
    anchor=next((m for m in re.finditer(PHASES[phase][1],text) if visible[m.start():m.end()].strip(' \t\r\n\x00') and visible[:m.start()].count('{')==visible[:m.start()].count('}')),None)
    if not anchor:raise ValueError('시작값을 넣을 위치를 찾지 못했습니다: '+str(location))
    text=text[:anchor.start()]+block+text[anchor.start():]
  if phase=='preset':code=text.rstrip('\r\n')
  elif text!=original:bodies[location]=text
 return code,bodies
