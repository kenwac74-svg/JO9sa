from pathlib import Path
import gzip,hashlib,json,re
HERE=Path(__file__).resolve().parent
HUB=Path('G:/somi/JO9sa/tools/modding-hub')
BASE=Path('G:/Codex/tmp/claude-character-studio-e0edb064/tools/jo9-history-lab/dist')
STAGE=HERE/'candidate'
items=[]
def one(text,old,new):
 assert text.count(old)==1, (old[:100],text.count(old))
 return text.replace(old,new,1)
def stage(name,text):
 target=HUB/name;out=STAGE/name;out.parent.mkdir(parents=True,exist_ok=True)
 raw=text.encode('utf-8-sig' if name.endswith('.ps1') else 'utf-8');out.write_bytes(raw)
 before=target.read_bytes() if target.exists() else None
 if before is not None:
  snap=HERE/'before'/Path(name+'.gz');snap.parent.mkdir(parents=True,exist_ok=True);snap.write_bytes(gzip.compress(before))
 items.append({'path':name,'before':hashlib.sha256(before).hexdigest() if before is not None else None,'after':hashlib.sha256(raw).hexdigest()})
def vendor(name):return (BASE/name).read_text('utf-8')

s=vendor('past-history.mjs')
start=s.index(' // [계산 규칙 기록 2026-11-12] 연령 처리')
end=s.index(" const occ=tierOf",start)
s=s[:start]+' // seed_age는 발육·외형 분류 코드이며, 사용자가 지정한 가중치만 적용한다.\n'+s[end:]
stage('overrides/past-history.mjs',s)

s=vendor('sim-data.mjs')
s=one(s,"let edited=null;","let edited=null;\n// Retain coefficient values from older settings while ignoring the obsolete classification exclusion.\nconst withoutCodeExclusions=f=>({...f,excludedAges:[]});")
s=one(s,'edited=f;return edited;','edited=withoutCodeExclusions(f);return edited;')
s=s.replace('edited=structuredClone(base);','edited=withoutCodeExclusions(structuredClone(base));')
s=one(s,'export function saveFormula(f){edited=f;try{localStorage.setItem(FORMULA_KEY,JSON.stringify(f));}','export function saveFormula(f){edited=withoutCodeExclusions(f);try{localStorage.setItem(FORMULA_KEY,JSON.stringify(edited));}')
s=one(s,'JSON.stringify(getFormula(base))!==JSON.stringify(base)','JSON.stringify(getFormula(base))!==JSON.stringify(withoutCodeExclusions(base))')
stage('overrides/sim-data.mjs',s)

s=vendor('coef-view.mjs')
s=one(s,'<h2>연령(seed_age) 가중치</h2>','<h2>발육 분류(seed_age) 가중치</h2>')
s=one(s,"${e(age)}${f.excludedAges.includes(Number(age))?' <span class=\"badge muted\">통계 제외</span>':''}",'${e(age)}')
s=one(s,'max="9" placeholder="seed_age 정수"','max="99" placeholder="seed_age 정수"')
s=re.sub(r"   <p class=\"fine-print\">'통계 제외'.*?</p></div></article>", '   <p class="fine-print">seed_age는 실제 나이가 아닌 발육·외형 분류 코드입니다. 0~99 정수 코드를 등록하고 가중치를 지정할 수 있습니다. 등록하지 않은 코드의 기본 가중치는 100입니다.</p></div></article>',s,count=1)
s=one(s,"if(age===''||w===''||!Number.isInteger(Number(age))){api.toast('seed_age 정수와 가중치를 넣으세요.');", "if(age===''||w===''||!Number.isInteger(Number(age))||Number(age)<0||Number(age)>99){api.toast('seed_age는 0~99 정수로, 가중치는 숫자로 넣으세요.');")
stage('overrides/coef-view.mjs',s)

s=vendor('sim-view.mjs')
s=one(s,'// 연령은 게임 코드 그대로 표시한다(0 young, 1 loli, 2 milf). 1은 통계 대상이 아니라 표본에 없다.','// 발육·외형 분류는 게임 코드 그대로 표시한다. 표본에 없는 코드를 골라도 제외 처리하지 않는다.')
s=one(s," ${key==='age'&&v==='1'?'disabled':''}",'')
s=one(s,"${e(key==='age'?(v==='1'?'1 (통계 제외)':v):name(key,v))}","${e(key==='age'?v:name(key,v))}")
s=s.replace('랜덤 노예(연령 코드 1 제외)입니다.','랜덤 노예입니다. 현재 표본에 없는 분류 코드는 선택 결과가 비어 있을 수 있습니다.')
s=s.replace("sel('age','연령 코드'","sel('age','발육 분류 코드'").replace("'모든 연령'","'모든 분류'")
stage('overrides/sim-view.mjs',s)

s=vendor('pillow-talk.mjs')
s=one(s,'// 메타데이터가 붙은 조각 행을 거르고 최근 2회를 피해 추첨한다. 성인(연령 코드 0·2) 랜덤 노예만 대상.','// 메타데이터가 붙은 조각 행을 거르고 최근 2회를 피해 추첨한다. seed_age는 발육·외형 분류 코드다.')
s=re.sub(r'^ // \[클로드 정책 거부\].*\n if\(result.excluded\)return null;\n','',s,count=1,flags=re.M)
stage('overrides/pillow-talk.mjs',s)

s=(HUB/'overrides/character-view.mjs').read_text('utf-8')
s=re.sub(r'^  // \[클로드 정책 거부\].*\n  if\(r.excluded\)return .*?;\n','',s,count=1,flags=re.M)
s=one(s,"r.excluded?'<p class=\"muted-text\">제외 연령(공식 데이터 excludedAges)이라 과거 경험을 자동 계산하지 않습니다.</p>':",'')
s=one(s,"${a}${getFormula(D.formula).excludedAges.includes(a)?' (자동 계산 제외)':''}",'${a}')
s=one(s,'연령 코드 0 젊음 · 1 소녀 · 2 원숙. 자동 계산 제외 연령은 공식 데이터 excludedAges로 정합니다.','발육·외형 분류 0 젊음 · 1 어림 · 2 성숙. 실제 나이 숫자가 아닙니다.')
s=s.replace('<div class="cv-pick-label">연령 코드</div>','<div class="cv-pick-label">발육 분류</div>')
stage('overrides/character-view.mjs',s)

s=(HUB/'overrides/studio-view.mjs').read_text('utf-8')
s=one(s,'const b = st.book, blocked = st.talk.noAutoGenerate, sim = api.charView;','const b = st.book, sim = api.charView;')
s=re.sub(r'^   \$\{blocked \?.*?\n','',s,count=1,flags=re.M)
s=re.sub(r'^   if \(st.talk.noAutoGenerate\) Object.assign.*?\n   else Object.assign', '   Object.assign',s,count=1,flags=re.M)
s=one(s,"${x.excluded ? ' (연령 코드 1은 과거 경험 없음)' : ''}",'')
stage('overrides/studio-view.mjs',s)

extra="'overrides/past-history.mjs','overrides/sim-data.mjs','overrides/coef-view.mjs','overrides/sim-view.mjs','overrides/pillow-talk.mjs',"
s=(HUB/'server.py').read_text('utf-8')
s=one(s,"'overrides/character-view.mjs',",extra+"'overrides/character-view.mjs',")
s=one(s,'base.api.shared_appearance_data=sharing.resolve_data','base.api.shared_appearance_data=sharing.resolve_data\n # seed_age classifies appearance; it never disables editing or importing dialogue.\n base.excluded_ages=set')
s=one(s,"'spawn-notice.mjs','studio-look.mjs'","'past-history.mjs','sim-data.mjs','coef-view.mjs','sim-view.mjs','pillow-talk.mjs','spawn-notice.mjs','studio-look.mjs'")
s=one(s,"   if native=='character-view.mjs':", "   if native=='data/past-history-formula.json':\n    formula=json.loads((base.DIST/'data/past-history-formula.json').read_text('utf-8'))\n    formula['excludedAges']=[]\n    formula.setdefault('ageFactor',{}).setdefault('1',100)\n    return self.send_json(200,formula)\n   if native=='character-view.mjs':")
stage('server.py',s)
s=(HUB/'Start-Modding-Hub.ps1').read_text('utf-8-sig')
s=one(s,"'overrides/character-view.mjs',",extra+"'overrides/character-view.mjs',")
stage('Start-Modding-Hub.ps1',s)

(HERE/'change-manifest.json').write_text(json.dumps(items,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'candidateFiles':len(items),'paths':[x['path'] for x in items]}))
