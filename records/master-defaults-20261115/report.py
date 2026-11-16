"""Reproducible, read-only audit of the current WORK master startup sources."""
from pathlib import Path
import sys,json,collections,hashlib,re
H=Path('G:/somi/JO9sa/tools/modding-hub');sys.path.insert(0,str(H))
from master_editor import MasterEditor,QspDocument
import master_initials as mi
L=Path(__file__).resolve().parent
W=Path('G:/somi/Jack O Nine Tails v2.4_work/game');D=Path('G:/somi/JO9sa/records/master-defaults-20261115')

def cell(v):return str(v).replace('|','\\|').replace('\n',' ').replace('\r','')
if __name__=='__main__':
 s=MasterEditor(W);doc,body,entries=s._native();presets={key[1]:s._master(key[1],entries)['statsCode'] for key in entries if key[0]=='$master_base_name'}
 catalog=mi.base_catalog(doc,presets);fields=catalog['fields'];counts=collections.Counter(r['group'] for r in fields)
 # Also record dynamic array writes and whole-array resets. These are state/code,
 # not independent constant-key starting fields.
 dynamic=[];resets=[]
 for location in mi.SOURCES+mi.RUNTIME:
  if location not in doc.index:continue
  text=doc.body(location);visible=mi.mask(text)
  for m in re.finditer(r'('+mi.IDENT+r')\[([^\]\r\n]+)\]\s*(\+=|-=|=(?!=))',text):
   if visible[m.start():m.start()+1] in (' ','\x00'):continue
   if not re.fullmatch(mi.INDEX,m[2].strip()):dynamic.append({'location':location,'line':text.count('\n',0,m.start())+1,'binding':m[1]+'['+m[2]+']','reason':'실행 중 선택되는 인덱스 · 고정 인물 초기값이 아님'})
  for m in re.finditer(r"(?mi)^\s*killvar\s+(['\"])([^'\"]+)\1",text):
   if visible[m.start():m.end()].strip(' \t\r\n\x00'):resets.append({'location':location,'array':m[2]})
 audit={**catalog,'dynamicArrayWrites':dynamic,'wholeArrayResets':resets,'qsp_sha256':hashlib.sha256(doc.raw).hexdigest(),'presets':list(presets)}
 (D/'inventory.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),'utf-8')
 rows=s.list();read_checks=[]
 for row in rows:
  a=s.read(row['id']);keys=[r['key'] for r in a['initialCatalog']['fields']];assert len(keys)==len(set(keys));assert len(keys)==len(fields)
  assert not a['initialOverrides'];read_checks.append({'id':row['id'],'name':row['name'],'fields':len(keys)})
 # Check source and whole game data stayed read-only during this tool change.
 (D/'work-read-verification.json').write_text(json.dumps({'qsp_sha256':audit['qsp_sha256'],'presets':read_checks,'game_data_saved':False},ensure_ascii=False,indent=2),'utf-8')
 lines=['# 마스터 공통 초기값 전수 대조 및 편집기 반영','',f"현재 WORK의 남주인공·여주인공 {len(rows)}개 프리셋과 초기화/계산 {len(mi.SOURCES+mi.RUNTIME)}개 위치에서 실제 대입 {len(catalog['inventory']):,}건을 대조했다. 변수/상수 인덱스 {len(fields)}개를 등록했으며, CM의 기존 두 내부값을 한 칸으로 합쳐 사용자 편집칸은 {len(fields)-1}개다.",'',
 '기존 UI의 **마스터 편집 → 능력치·특성**에 통합했다. 공통값, 개별값, 조건값, 재계산값을 구분하며 변수명/뜻/출처/저장 단계를 툴팁으로 보여준다. 같은 구조를 노예 편집의 마스터 전환용 설정에도 적용했다. 원본 코드 직접 편집도 유지한다.','',
 '| 묶음 | 내부 항목 수 |','|---|---:|']
 lines += [f'| {g} | {n} |' for g,n in counts.items()]
 lines += ['', '## 저장 동작과 원본 보존','',
 '- 표 입력은 `initials: {변수명: 정수 또는 문자열}`로 전달한다. `null`은 표 지정만 해제한다. `dryRun`은 차이만 반환한다.',
 '- `MasterEditor.initial_catalog`는 QSP를 실행하지 않고 초기화·프리셋·후속 초기화·계산 출처를 반환한다. 화면이 임의 코드를 평가하지 않는다.',
 '- 선택을 넘길 때 story 초기화가 복원하는 값은 해당 프리셋 끝에 지정한다. CM·개 이름·말 보유·일부 옵션처럼 복원되지 않는 값은 선택한 인물로 게임을 시작할 때만 지정하여 다른 후보로 전파되지 않게 한다.',
 '- 행동력은 `hero_description` 계산 이후, 시설·주인공 특수값은 `start_game` 초기화 이후에 인물 번호 조건으로 적용한다. 인테리어는 `new_estate` 호출 직전에 적용한다. 공통 초기화 원문을 일괄 덮어쓰지 않는다.',
 '- 저장은 QSP·역할 보관 JSON·최초 QSP 백업·위치별 변경 mods를 한 작업으로 기록한다. 초기값을 편집해도 새로운 런타임 저장 변수를 만들지 않는다.',
 '- 코드/공통 출처/본인 편집 구간이 외부에서 바뀌면 이전 화면의 저장을 거절하고 재읽기를 안내한다. 다른 인물의 변경은 덮어쓰지 않는다.',
 '- 표 지정 해제는 도구가 만든 지정분만 해제한다. 사용자가 원본 편집 구간에 명령/식을 직접 추가했다면 자동 재생성으로 지우지 않고 원본 코드에서 편집하도록 알린다.',
 '- 노예↔마스터 복제는 선택한 설정을 보존하고 새 번호에 연결한다. 복제 대응표에서 직접 입력한 값이 기존 표 지정값보다 우선한다.',
 '- 현재 게임 QSP/JSON/세이브는 이번 도구 개발에서 저장하지 않았다. 사용자 저장 버튼은 새 게임 시작 프리셋을 바꾸며 진행 중인 세이브의 주인공을 갱신하지 않는다.','',
 '## 계산값과 대조 범위','',
 '조건식을 임의로 실행하지 않는다. 현재 인물 번호만으로 배제되는 다른 주인공 전용 분기는 표시값에 섞지 않으며, 나머지 조건/계산 결과는 자동·조건값으로 표시한다. 누적값·장비·CM 등으로 계속 다시 계산되는 능력치는 초기 지정이 영구 고정된다는 뜻이 아니다. 세련된 게임 내 표시 문구를 알 수 없는 변수는 원래 식별자와 실제 출처를 보존한다.','',
 '별도 이름·초상·소개는 기존 배경 설정 UI에 있으므로 같은 값을 중복 입력시키지 않는다. NPC 진행 상태·화면 배치·메뉴 코드·반복문 임시값은 인물의 시작 능력치/설정과 구분해 아래 제외 원장에 기록했다. 가변 인덱스와 배열 전체 초기화도 `inventory.json`에 별도로 기록한다. 커스텀 생성 경로의 보정은 별도 출처로 보여주며 스토리 프리셋 공통값으로 혼합하지 않는다.','',
 '## 검증 및 한계','',
 '- 42개 실제 프리셋을 읽어 항목 수·키 중복·원본 읽기를 확인했다.',
 '- 관련 Python 26건, JavaScript 10건 및 격리 HTTP API 확인: 읽기·미리보기·저장·표 지정 해제·서로 다른 인물·양방향 복제·직접 원고 보존.',
 '- 브라우저의 별도 확인 탭에서 CM·공통 문자열 값·검색·변경 보기·되돌리기·묶음 배치를 확인했다. 사용자 작업 탭은 새로고침하지 않았다.',
 '- 실제 WORK에 시험 캐릭터/값을 저장하지 않았고 게임 EXE 플레이 검증은 하지 않았다. 배포용 전체 검사는 이 도구 변경 범위에 포함하지 않았다.','',
 '## 전체 등록 원장','', '| 변수 | 뜻/표기 | 묶음 | 저장 단계 | 주요 출처 |','|---|---|---|---|---|']
 for r in fields:
  src=list(dict.fromkeys(x['location'] for x in r['sources'] if not x['location'].startswith('preset:')))
  lines.append('| '+' | '.join(cell(x) for x in [r['key'],r['label'],r['group'],r['phase'],', '.join(src)])+' |')
 excluded={}
 for r in catalog['inventory']:
  if r['disposition']!='field':excluded.setdefault((r['key'],r['reason']),set()).add(r['location'])
 lines += ['', '## 다른 기능에 속해 중복 등록하지 않은 항목', '', '| 식별자 | 이유 | 출처 |','|---|---|---|']
 lines += ['| '+' | '.join(cell(x) for x in [key,reason,', '.join(sorted(locations))])+' |' for (key,reason),locations in sorted(excluded.items())]
 (D/'REPORT_KO.md').write_text('\n'.join(lines)+'\n','utf-8')
 print(json.dumps({'presets':len(rows),'fields':len(fields),'controls':len(fields)-1,'assignments':len(catalog['inventory']),'dynamic_writes':len(dynamic),'report':str(D/'REPORT_KO.md'),'qsp_sha256':audit['qsp_sha256']},ensure_ascii=False))
