"""JO9 MOD GENERAL_DIALOGUE_DB_20261115: read/edit literal QSP dialogue data.

Does not execute game code, classify user text, or infer gameplay outcomes.
"""
from pathlib import Path
import re,hashlib,datetime,html,bisect
from master_editor import QspDocument,MasterEditor,literal,quote,encoded,digest

QUESTIONS={'1112':'인상 묻기','1115':'불만 묻기','1113':'요구 묻기','1114':'희망사항 묻기','1116':'기분 묻기','1111':'과거 묻기','1117':'조수에 대해 묻기','1118':'노예에 대해 묻기'}
ORIGINAL={'relation','obed','urge','fear','ratio','instinct','custom','spoil','moral'}
FIELDS={'text','role','types','relations','emotion','tone','level','question','good_mood','rare_praise','need_fear'}
INDEX=r'''(?:'(?:''|[^'])*'|"(?:""|[^"])*")'''
PATTERN=re.compile(r'(?m)^[ \t]*(?P<arr>\$?voice_fragment_(?:'+ '|'.join(FIELDS) +r')|\$slave_(?:'+'|'.join(ORIGINAL)+r')_description)\[(?P<index>'+INDEX+r'|-?\d+)\][ \t]*=[ \t]*(?P<value>[^\r\n]*)')
REFORM_LOCATION='jo9_character_dialogue'
REFORM_ROW=re.compile(r"(?m)^[ \t]*if \$line_key='(?P<profile>[a-z_]+)\|(?P<question>111[124])\|(?P<state>[a-z_]+)': \$result=(?P<value>"+INDEX+r")[ \t]*&[ \t]*exit[ \t]*\r?$")
REFORM_STRONG_BLOCK=re.compile(r"(?ms)^if \$args\[0\]='strong':\r?\n(?P<body>.*?)^end[ \t]*\r?$")
REFORM_STRONG_ROW=re.compile(r"(?m)^[ \t]*(?:if \$args\[1\]='(?P<profile>[a-z_]+)': )?\$result=(?P<value>"+INDEX+r")[ \t]*\r?$")
_CACHE={}

def plain(text):
 return html.unescape(re.sub(r'<<.*?>>|<[^>]*>',lambda m:m[0] if m[0].startswith('<<') else '\n' if re.match(r'<br\s*/?>',m[0],re.I) else '',str(text))).strip()
def compatible(value,wanted):return not wanted or not value or value=='*' or wanted in value.strip('|').split('|')

class GeneralDialogueDB:
 def __init__(self,root,backend=None):self.root=Path(root).resolve();self.path=self.root/'jack.qsp';self.editor=MasterEditor(self.root,backend)
 def _load(self):
  stamp=self.path.stat();finger=(str(self.path),stamp.st_mtime_ns,stamp.st_size)
  if finger in _CACHE:return _CACHE[finger]
  doc=QspDocument(self.path.read_bytes());rows=[];spans={};skipped=0
  for location in ['#txt_man','#txt_woman']:
   if location not in doc.index:continue
   text=doc.body(location);pieces={};originals=[];line_starts=[0]+[m.end() for m in re.finditer('\n',text)]
   for match in PATTERN.finditer(text):
    raw=match['value'].rstrip();index=match['index'];key=literal(index) if index.startswith(('\'', '"')) else index
    try:value=literal(raw) if match['arr'].startswith('$') else int(raw)
    except (ValueError,TypeError):skipped+=1;continue
    binding=match['arr']+'['+index+']';start=match.start('value');end=start+len(raw)
    if match['arr'].startswith('$slave_'):
     category=match['arr'].removeprefix('$slave_').removesuffix('_description');rid=location+'|'+category+':'+key
     row={'id':rid,'key':binding,'text':value,'kind':'original','question':'1112','role':'fact_'+category+'_'+key,'types':'*','relations':'*','tone':0,'level':0,'source':location,'line':bisect.bisect_right(line_starts,match.start()),'revision':digest(raw.encode('utf-8'))}
     originals.append(row);spans[rid]=(location,start,end,raw)
    else:
     field=match['arr'].lstrip('$').removeprefix('voice_fragment_');record=pieces.setdefault(key,{})
     record[field]=value
     if field=='text':record.update(_start=start,_end=end,_raw=raw,_line=bisect.bisect_right(line_starts,match.start()))
   for key,piece in pieces.items():
    if 'text' not in piece:continue
    q=str(piece.get('question') or '')
    if q not in QUESTIONS:
     m=re.search(r'(111[1-8])',str(piece.get('role',''))+' '+key);q=m[1] if m else '1112'
    rid=location+'|'+key
    row={k:v for k,v in piece.items() if not k.startswith('_')};row.update(id=rid,key=key,kind='fragment',question=q,source=location,line=piece['_line'],revision=digest(piece['_raw'].encode('utf-8')))
    row.setdefault('types','*');row.setdefault('relations','*');row.setdefault('tone',0);row.setdefault('level',0)
    rows.append(row);spans[rid]=(location,piece['_start'],piece['_end'],piece['_raw'])
   rows.extend(originals)
  result=(doc,rows,spans,skipped);_CACHE.clear();_CACHE[finger]=result;return result
 def meta(self):
  _,rows,_,skipped=self._load();counts={q:sum(r['question']==q for r in rows) for q in QUESTIONS}
  return {'rows':len(rows),'questions':QUESTIONS,'counts':counts,'questionAliases':{'1118':'1117'},'skippedNonLiteral':skipped,'source':str(self.path),'types':['ice','proud','flame','calm','plain','frank','doll','meek','fragile'],'relations':['neutral','hopeful','duty','loyal','hostile','fearful','bleak','broken']}
 def reform(self):
  """Read deployed voice reform literals for preview without exposing them to save()."""
  doc,_,_,_=self._load()
  rows=[];strong={}
  if REFORM_LOCATION in doc.index:
   body=doc.body(REFORM_LOCATION)
   rows=[{'profile':m['profile'],'question':m['question'],'state':m['state'],'text':literal(m['value'])} for m in REFORM_ROW.finditer(body)]
   block=REFORM_STRONG_BLOCK.search(body)
   if block:strong={m['profile'] or 'fallback':literal(m['value']) for m in REFORM_STRONG_ROW.finditer(block['body'])}
  return {'rows':rows,'source':str(self.path),'available':bool(rows),'strong':strong}
 def search(self,params):
  _,rows,_,_=self._load();q=str(params.get('q','')).strip().casefold();question=str(params.get('question',''));question='1117' if question=='1118' else question;tone=str(params.get('tone',''));kind=params.get('kind','');source=params.get('source','')
  found=[r for r in rows if (not question or r['question']==question) and (not kind or r['kind']==kind) and (not source or r['source']==source) and compatible(str(r.get('types','*')),str(params.get('type',''))) and compatible(str(r.get('relations','*')),str(params.get('relation',''))) and (not tone or not r.get('tone') or str(r['tone'])==tone) and (not q or q in (r['key']+' '+plain(r['text'])+' '+r.get('role','')).casefold())]
  try:offset=max(0,int(params.get('offset',0)));limit=max(1,min(100,int(params.get('limit',30))))
  except (TypeError,ValueError):raise ValueError('목록 범위는 정수여야 합니다.')
  return {'total':len(found),'rows':[{**r,'plain':plain(r['text'])} for r in found[offset:offset+limit]],'offset':offset,'limit':limit}
 def row(self,rid):
  _,rows,_,_=self._load();row=next((r for r in rows if r['id']==rid),None)
  if not row:raise FileNotFoundError('일반 대사 항목을 찾지 못했습니다.')
  return {**row,'plain':plain(row['text'])}
 def save(self,body):
  value=body.get('text')
  if not isinstance(value,str) or len(value)>8000:raise ValueError('대사는 8000자 이하 문자열로 입력하세요.')
  doc,_,spans,_=self._load();row=self.row(body.get('id'))
  if body.get('revision')!=row['revision']:raise ValueError('원문이 바뀌었습니다. 다시 불러오세요.')
  location,start,end,old=spans[row['id']];new=quote(value);changes=[] if old==new else [{'id':row['id'],'before':row['text'],'after':value}]
  if changes and not body.get('dryRun'):
   before=doc.body(location);after=before[:start]+new+before[end:];raw=doc.replace_body(location,after);folder=self.root/'jo9_editor/general-dialogue-patches';stamp=datetime.datetime.now().strftime('%Y%m%d_%H%M%S_%f')
   payloads={self.path:raw,folder/(stamp+'.json'):encoded({'id':'general_dialogue_'+stamp,'target':'game/jack.qsp','before_sha256':digest(doc.raw),'after_sha256':digest(raw),'edits':[{'location':location,'field':'body','old':before,'new':after,'count':1}]})}
   if not (folder/'before_first_save.qsp').exists():payloads[folder/'before_first_save.qsp']=doc.raw
   self.editor._write(payloads)
  return {'changes':changes,'saved':bool(changes) and not body.get('dryRun'),'dryRun':bool(body.get('dryRun')),'row':self.row(row['id']) if not body.get('dryRun') else row}
