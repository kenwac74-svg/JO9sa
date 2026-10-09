# 개인 제작 기록과 선언형 패치에 근거한 작업물만 무설치 ZIP으로 묶는다.
from pathlib import Path, PurePosixPath
from collections import defaultdict
import datetime as dt, hashlib, html, io, json, re, sys, zipfile
from PIL import Image, ImageOps

ROOT=Path(__file__).resolve().parents[1]
ACTIVE=Path(r'C:\Users\Ken Choung\Documents\Codex\2026-10-06\task\JO9sa')
GAME=Path(r'C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex\game')
CAT=ACTIVE/'tools/local-workspace/catalog'
TRACK=CAT/'image_work/personal-patch'
NOW=dt.datetime.now(dt.timezone(dt.timedelta(hours=9)))
NAME='JO9_개인작업_이전패치_'+NOW.strftime('%Y%m%d_%H%M%S')
OUT=ROOT/'build'/NAME
OUT.mkdir(parents=True,exist_ok=False)
FILES={};META={};removed=[];images={};thumbs={};provenance={}

def sha(b):return hashlib.sha256(b).hexdigest()
def load(p):return json.loads(Path(p).read_text('utf-8-sig'))
def safe(rel):
    p=PurePosixPath(rel)
    if p.is_absolute() or '..' in p.parts or '\\' in rel or ':' in rel:raise ValueError(rel)
    return rel
def add(rel,b,role,evidence):
    safe(rel)
    if Path(rel).suffix.lower() in {'.exe','.dll','.msi','.pdb','.zip','.qsp.bak'}:raise ValueError('Forbidden '+rel)
    if rel in FILES:
        if FILES[rel]!=b:raise ValueError('Conflicting payload '+rel)
        return
    FILES[rel]=b;META[rel]={'path':rel,'bytes':len(b),'sha256':sha(b),'role':role,'evidence':evidence}
def copy(src,rel,role,evidence):add(rel,Path(src).read_bytes(),role,evidence)
def secretless(o,where=''):
    if isinstance(o,dict):
        out={}
        for k,v in o.items():
            if re.search(r'api.?key|protected.?key|token|secret|password|credential|authorization|encrypted',k,re.I):removed.append(where+'.'+k);continue
            out[k]=secretless(v,where+'.'+k)
        return out
    if isinstance(o,list):return [secretless(x,where) for x in o]
    if isinstance(o,str) and re.search(r'\bsk-(?:or-v1|svcacct|proj)-[A-Za-z0-9_-]+|\bBearer\s+[A-Za-z0-9_-]{10}',o):removed.append(where);return ''
    return o
def addjson(rel,data,role,evidence):add(rel,(json.dumps(data,ensure_ascii=False,indent=2)+'\n').encode(),role,evidence)
def work(rel,data,date,evidence,record=None,before=None,time_basis='successful-workshop-save-time'):
    safe(rel)
    actual=GAME/'content/pic'/rel
    if not actual.is_file() or sha(actual.read_bytes())!=sha(data):raise ValueError('Current image mismatch: '+rel)
    arc='game/content/pic/'+rel
    add(arc,data,'personal-image',evidence)
    images[rel]={'path':rel,'sha256':sha(data),'bytes':len(data),'created':date,'timeBasis':time_basis,'evidence':evidence,'before':before}
    provenance[rel]=record

# The latest recorded result wins. Completion flags and mtimes never establish ownership.
events=[json.loads(s) for s in (TRACK/'events.jsonl').read_text('utf-8').splitlines() if s.strip()]
chosen={};owned=set();baseline={}
for e in sorted(events,key=lambda e:(e['created'],e['key'])):
    if dt.datetime.fromisoformat(e['created'].replace('Z','+00:00'))>NOW:continue
    for f in e['files']:
        safe(f['path']);baseline.setdefault(f['path'],f)
        if e['operation']=='restore' and (f['path'],f['after']) not in owned:chosen.pop(f['path'],None);continue
        if e['operation']!='restore':owned.add((f['path'],f['after']))
        chosen[f['path']]=(e,f)
for rel,(e,f) in chosen.items():
    data=(TRACK/'objects'/f['after']).read_bytes()
    if sha(data)!=f['after']:raise ValueError('Ownership object mismatch '+rel)
    work(rel,data,e['created'],'successful-workshop-save:'+e['key'],e,baseline[rel])

# Explicit user attachment applied before automatic provenance existed.
tsyu='characters/Tsyuansu (2).png';b=(GAME/'content/pic'/tsyu).read_bytes()
if sha(b)!='3d040c1bc587f4287c28476da5aeb4c3e5423248bf22bc70ca22b116a8a49668':raise ValueError('Tsyuansu attachment changed')
work(tsyu,b,NOW.isoformat(),'user-attachment-and-IMAGE_CYCLE_20261008.md',time_basis='transfer-confirmation-time; original completion time unknown')

# User-created home-computer event cuts explicitly declared in the restored mods.
event_mods={}
for mod in (ACTIVE/'mods').glob('*.json'):
    if 'redlight' not in mod.name:continue
    obj=load(mod)
    for edit in obj.get('edits',[]):
        for rel in re.findall(r'SNKmod[\\/]scene[\\/]whore_redlight[\\/][^\s\'\"]+?\.png',edit['new']):
            event_mods.setdefault(rel.replace('\\','/'),[]).append(mod.name)
for rel,mods in event_mods.items():
    if not (GAME/'content/pic'/rel).is_file():continue
    work(rel,(GAME/'content/pic'/rel).read_bytes(),NOW.isoformat(),'declared-home-event-cuts:'+','.join(mods),time_basis='transfer-confirmation-time; original completion time unknown')

# Keep the QSP exactly as currently used. No QSRC recompilation or engine patch.
copy(GAME/'jack.qsp','game/jack.qsp','qsp','current-live-qsp-roundtrip-verified')
copy(GAME/'css/base.css','game/css/base.css','ui-style','current-retained-ui-tooltip-dialogue-navigation')
copy(GAME/'json/menu_icon.json','game/json/menu_icon.json','ui-menu','current-ui-menu-definitions')

# UI resources from the user's own versioned UI release, verified against that release.
release=ROOT/'releases/JO9_UI_v1_9_14_SNKmod_R3_release.zip'
ui_reused=[];ui_changed=[]
with zipfile.ZipFile(release) as z:
    for name in z.namelist():
        marker='/payload/SNKmod/content/pic/'
        if marker not in name or name.endswith('/'):continue
        tail=name.split(marker,1)[1];rel='SNKmod/'+tail;file=GAME/'content/pic'/rel
        if not file.is_file():continue
        b=file.read_bytes()
        if sha(b)!=sha(z.read(name)):
            ui_changed.append(rel);continue
        copy(file,'game/content/pic/'+rel,'ui-resource','versioned-own-UI-R3-release:'+name)
        ui_reused.append(rel)

# Current UI overlays in original paths. Vanilla-identical assets and all slave-pack JSON are excluded.
vanilla={x['Rel']:x for x in load(ROOT/'reference/vanilla_manifest.json')['Files']}
allowed={'approved_main_v1','grimdark','jo9_v197','jon-UIadds'}
for folder in allowed:
    for f in (GAME/'content/pic/ui'/folder).glob('*.png'):
        rel=f.relative_to(GAME).as_posix();b=f.read_bytes();v=vanilla.get(rel)
        if v and sha(b)==v['Sha256']:continue
        copy(f,'game/'+rel,'ui-resource','current-user-UI-project:'+folder)

# Copy the actual installed editor, not stale workspace candidates or test fixtures.
editor=ACTIVE/'tools/text-workshop'
for f in editor.iterdir():
    if not f.is_file() or '.bak' in f.name or '.test.' in f.name or f.name.startswith('test.'):continue
    if f.suffix.lower() not in {'.cjs','.js','.html','.json','.ps1','.cmd','.md','.py'}:continue
    copy(f,'JO9-tools/tools/text-workshop/'+f.name,'tool','currently-installed-editor')
for f in (editor/'assets/dialogue-emoji').glob('*.png'):
    copy(f,'JO9-tools/tools/text-workshop/assets/dialogue-emoji/'+f.name,'tool-asset','editor-emoji-resource')
    copy(f,'game/content/pic/ui/dialogue_emoji/'+f.name,'ui-resource','editor-emoji-resource')
for f in CAT.iterdir():
    if f.is_file() and '.bak' not in f.name and f.name!='catalog_workshop_config.js' and f.suffix in {'.js','.json','.html'}:
        copy(f,'JO9-tools/tools/local-workspace/catalog/'+f.name,'catalog-state' if f.name in {'catalog_status.js','catalog_work_ids.json','catalog_work_codes.js'} else 'tool','current-shared-catalog')
for name in ['progress.json','history.jsonl','bg_queue.json']:
    copy(CAT/'image_work'/name,'JO9-tools/tools/local-workspace/catalog/image_work/'+name,'work-state','current-shared-progress')
for name in ['Start-JO9-Tools.ps1','Open-JO9-Tools.cmd']:
    copy(ACTIVE/'tools/local-workspace'/name,'JO9-tools/tools/local-workspace/'+name,'launcher','current-portable-launcher')
for name in ['grok-settings.json','dialogue-ai-settings.json']:
    cleaned=secretless(load(ACTIVE/'tools/local-workspace/runtime'/name),name)
    for where in ['runtime','settings-seed']:
        addjson('JO9-tools/tools/local-workspace/'+where+'/'+name,cleaned,'ai-settings','provider-model-and-character-without-keys')
for name in ['JO9_Server.ps1','JO9_Detect.ps1','JO9_Launch.cmd','config.json','filters.json','VERSION.txt','pixelpure_optimizer.html','button_template.png','mob template.png']:
    copy(GAME/'modtools'/name,'game/modtools/'+name,'tool','current-image-workshop')
copy(GAME/'modtools/place/JO9_Place_Workshop.html','game/modtools/place/JO9_Place_Workshop.html','tool','current-image-workshop')
original=load(GAME/'modtools/image-original-cuts.json');original['sourceRoot']='SELECT_ORIGINAL_ON_NEW_PC'
addjson('game/modtools/image-original-cuts.json',original,'original-cut-links','242-virtual-originals-no-original-images')

# Preserve the ownership of current final results; create object blobs from payload after installation.
snapshot=[]
for i in images.values():
    e=provenance[i['path']];created=i['created'];key=(e['key'] if e else 'explicit_'+sha(i['path'].encode())[:20])
    before=(i['before'] or {}).get('before')
    snapshot.append({'version':1,'key':key+':snapshot:'+sha(i['path'].encode())[:12],'id':key,'created':created,'createdKST':dt.datetime.fromisoformat(created.replace('Z','+00:00')).astimezone(NOW.tzinfo).strftime('%Y-%m-%d %H:%M:%S +09:00'),'timeBasis':i['timeBasis'],'recorded':NOW.isoformat(),'operation':'cut' if 'cut' in i['evidence'] or 'attachment' in i['evidence'] else 'replace','imported':True,'evidence':i['evidence'],'files':[{'path':i['path'],'after':i['sha256'],'before':before,'bytes':i['bytes'],'beforePath':None}]})
tracking={'version':1,'trackingStarted':load(TRACK/'settings.json')['trackingStarted'],'timezone':'Asia/Seoul','game':'SELECT_PLAY_ON_NEW_PC','catalogRoot':'SET_ON_APPLY','snapshotUntil':NOW.isoformat(),'historyScope':'current-final-results; historical intermediate blobs omitted'}
addjson('JO9-tools/tools/local-workspace/catalog/image_work/personal-patch/settings.json',tracking,'ownership-state','current-final-snapshot')
add('JO9-tools/tools/local-workspace/catalog/image_work/personal-patch/events.jsonl',('\n'.join(json.dumps(e,ensure_ascii=False) for e in snapshot)+'\n').encode(),'ownership-state','current-final-ownership-snapshot')

# Include mods as records only. The installed QSP already contains them; do not reapply blindly.
mods={f.name:f for f in (ACTIVE/'mods').glob('*.json')}
for f in (ROOT/'mods').glob('*.json'):
    if f.name=='2026-10-08_dark_gold_ui.json':continue
    mods.setdefault(f.name,f)
for name,f in mods.items():copy(f,'JO9-tools/mods/'+name,'mod-record','already-reflected-or-historical-declaration-not-auto-applied')
for f in (ACTIVE/'tools/local-workspace/runtime/cut-mods').rglob('*.json'):
    copy(f,'JO9-tools/records/cut-mods/'+f.relative_to(ACTIVE/'tools/local-workspace/runtime/cut-mods').as_posix(),'mod-record','successful-cut-registration')
for f in (ACTIVE/'tools/local-workspace/runtime/backups').glob('*.json'):
    obj=load(f)
    if obj.get('status')=='applied':addjson('JO9-tools/records/dialogue/'+f.name,secretless(obj),'dialogue-record','successful-dialogue-edit-without-backup-qsp')
for name in ['entries.json','saved-journals-verified.json','elizabeth-summary.json']:
    copy(ROOT/'tmp/kindroid-journals'/name,'JO9-tools/records/kindroid-journals/'+name,'journal-record','verified-NPC-and-place-journals')
for f in (ROOT/'docs').glob('*.md'):
    if re.match(r'(DIALOGUE_|IMAGE_CUT|IMAGE_CYCLE|PERSONAL_IMAGE)',f.name):copy(f,'JO9-tools/docs/'+f.name,'documentation','current-feature-handoff')
for name in ['CHOICE_COLOR_RULES.md','context-notes.md']:
    copy(ROOT/'docs/text-workshop'/name,'JO9-tools/docs/text-workshop/'+name,'documentation','agreed-dialogue-rules')
for name in ['qsp_dump.py','qsp_verify.py','dialogue-length-rule.txt']:
    copy(ROOT/'tools'/name,'JO9-tools/tools/'+name,'tool','analysis-and-prompt-rule')
copy(ACTIVE/'tools/apply_mods.ps1','JO9-tools/tools/apply_mods.ps1','tool','declared-mod-utility')

# Lightweight before/after catalogue: no full-size comparison originals and no base64.
def thumbnail(b):
    h=sha(b)
    if h in thumbs:return thumbs[h][0]
    with Image.open(io.BytesIO(b)) as src:
        src=ImageOps.exif_transpose(src).convert('RGBA')
        for edge in (160,128,96,64,32):
            im=src.copy();im.thumbnail((edge,edge))
            for quality in (60,40,20,1):
                target=io.BytesIO();im.save(target,'WEBP',quality=quality,method=6);data=target.getvalue()
                if len(data)<=6000:
                    name='thumbs/'+h+'.webp';thumbs[h]=(name,data);return name
    raise ValueError('Thumbnail budget')
rows=[];comparison_missing=[]
for rel,i in sorted(images.items()):
    after=thumbnail(FILES['game/content/pic/'+rel]);before=None;prior=i['before'] or {}
    old=prior.get('beforePath')
    if old and str(old).lower().startswith('c:') and Path(old).is_file():
        b=Path(old).read_bytes()
        if sha(b)==prior.get('before'):
            try:before=thumbnail(b)
            except (ValueError,OSError):pass
    if before is None:comparison_missing.append(rel)
    left=('<img loading="lazy" src="'+before+'">') if before else '비교 원본 미포함 / 추가 컷'
    label='저장: ' if i['timeBasis']=='successful-workshop-save-time' else '이전본 확인: '
    rows.append('<tr><td>'+html.escape(rel)+'<br><small>'+label+html.escape(i['created'])+'</small></td><td>'+left+'</td><td><a href="../game/content/pic/'+html.escape(rel,quote=True)+'"><img loading="lazy" src="'+after+'"></a></td></tr>')
page='''<!doctype html><html lang="ko"><meta charset="utf-8"><title>개인 작업 대조 카탈로그</title><style>body{font:14px sans-serif;background:#202020;color:#eee;margin:24px}td,th{padding:10px;border-bottom:1px solid #555;text-align:left}img{max-width:160px;max-height:160px;background:#555}input{padding:10px;width:330px}small{color:#aaa}</style><h1>개인 작업 대조 카탈로그</h1><p>'''+html.escape(NOW.isoformat())+'까지 · '+str(len(images))+'개. 작은 미리보기이며 결과를 클릭하면 실제 파일을 엽니다.</p><p>직접 저장 기록·첨부 적용·선언형 이벤트 패치로 확인한 결과만 표시합니다. UI 필수 리소스는 별도 파일 목록에 있습니다.</p><input placeholder="파일명 검색" oninput="document.querySelectorAll(\'tbody tr\').forEach(r=>r.hidden=!r.cells[0].textContent.toLowerCase().includes(this.value.toLowerCase()))"><table><thead><tr><th>파일 / 작업 시각</th><th>작업 전</th><th>현재 결과</th></tr></thead><tbody>'+''.join(rows)+'</tbody></table></html>'
add('catalog/index.html',page.encode(),'comparison-catalog','small-deduplicated-lazy-thumbnails')
for name,b in thumbs.values():add('catalog/'+name,b,'comparison-thumbnail','at-most-160px-and-6000-bytes')
assert sum(len(b) for _,b in thumbs.values())<=12*1024*1024

for src,dest in [('Apply.ps1','Apply.ps1'),('Open-Modding-Tools.ps1','JO9-tools/tools/local-workspace/Open-Modding-Tools.ps1')]:
    b=(ROOT/'tools/transfer-zip'/src).read_text('utf-8-sig').replace('\r\n','\n').replace('\n','\r\n').encode('utf-8-sig')
    add(dest,b,'installer' if src=='Apply.ps1' else 'launcher','no-exe-no-backup-portable-PowerShell')
cmd='@echo off\r\npowershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File "%~dp0Apply.ps1" %*\r\nif errorlevel 1 pause\r\n'
add('적용.cmd',cmd.encode('ascii'),'installer','optional-ZIP-application-button')
add('JO9-tools/tools/local-workspace/Open-Modding-Tools.cmd',b'@echo off\r\npowershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Open-Modding-Tools.ps1"\r\nif errorlevel 1 pause\r\n','launcher','all-seven-modding-windows-including-gamma')

readme=f'''JO9 개인 작업 이전 패치 — {NOW.strftime('%Y-%m-%d %H:%M:%S')} KST

EXE 설치기 없이 ZIP으로 적용합니다. 게임 실행 파일은 포함·교체하지 않습니다.
기존 Jack-o-nine-tails 2.3.2.5 한국어판 게임이 필요합니다. 전체 게임 배포본은 아닙니다.

1. ZIP을 별도 폴더에 모두 풉니다. ZIP 안에서 바로 실행하지 마세요.
2. 적용할 게임과 그 게임의 모딩 도구를 종료합니다.
3. 적용.cmd를 실행하고 플레이 게임 폴더, 순정 비교 게임 폴더를 차례로 선택합니다.
   상위 게임 폴더 또는 jack.qsp가 있는 game 폴더를 고를 수 있습니다.
   백업은 만들지 않습니다. 현재 작업본 QSP·이미지·스타일·작업 상태를 덮어씁니다.
4. 게임 상위 폴더의 '모딩 도구 열기.cmd'를 실행합니다. Node.js 20 이상 또는
   Codex에 포함된 Node.js가 있으면 추가 패키지 설치 없이 도구가 실행됩니다.
   게임 플레이에는 Node.js가 필요 없습니다. 게임은 기존 런처로 실행하세요.
5. Codex 내부 브라우저를 쓰려면 3813/, 3813/catalog, 5269/ 주소를 그곳에서 엽니다.
   버튼은 기본 브라우저에 로컬 도구 3개와 JoyCaption·번역·Mage·Gamma를 엽니다.

포함: 기록 확인 이미지 {len(images)}개(작업 저장 282개, 사용자 첨부 Tsyuansu B컷,
홍등가 사용자 이벤트 컷), 현재 jack.qsp, 컷 전환·UI 숨기기·대사 넘기기 정렬·
유지하기로 한 UI 조정, 필요한 사용자 UI 리소스, 최신 대사/이미지 편집 도구,
체크리스트의 고정 작업번호·상태·진행 기록, NPC/장소 저널 기록과 키워드,
AI 제공자·모델·캐릭터 설정, 작은 대조 카탈로그.

원본 B컷 {len(original['originals'])}개는 용량을 늘리지 않도록 ZIP에 넣지 않았습니다.
적용 버튼이 새 PC의 순정 content/pic에 연결 폴더를 만듭니다. 순정은 수정하지 않습니다.
해당 원본 파일 해시를 적용 전에 검사합니다. 순정 폴더를 옮기면 다시 연결해야 합니다.
원본이 없는 예약 B컷은 기존 상태대로 유지됩니다.

제외: 올걸팩과 다른 이미지팩의 이미지·캐릭터 JSON, 게임 EXE/DLL·엔진·폰트,
전체 게임, 세이브, 과거 QSP/이미지 백업·중간 버전, API 비밀키·브라우저 로그인.
본체의 일반 이미지·소리·폰트는 기존 설치본 것을 사용합니다.
QSP에는 현재 적용된 대사와 이벤트 변경이 통합되어 있으므로 다른 QSP 위에
부분 병합하는 방식이 아닙니다. 새 PC에서 더 최근에 수정한 QSP가 있으면 먼저 대조하세요.
온라인 Mage/Gamma 작품과 Kindroid 계정 내용은 계정에 남아 있으며 ZIP이 로그인시키지 않습니다.
API 키는 새 PC의 도구 설정에서 다시 입력하세요. 대상 도구에 이미 저장된 키는 유지합니다.

catalog/index.html: 배포 이미지 작업 전/후 대조. 썸네일 최대 160px, 장당 6KB 이하,
중복 공유·지연 로딩. 비교용 전체 원본은 넣지 않았습니다.
MANIFEST.json: 각 파일의 SHA-256, 역할, 포함 근거 및 작업 마감 시각.
JO9-tools/records: QSP 수정 기록과 저널 원문. mods는 이미 적용된 기록도 포함하므로
전체를 다시 적용하지 마세요. 실제 적용 기준은 이 ZIP의 game/jack.qsp입니다.
개인 이미지 추적은 현재 최종 결과의 제작 시각을 유지합니다. 과거 중간 버전의
이미지 데이터는 제외했으므로 이전 날짜로 되돌리는 백업으로 쓰지는 않습니다.

직접 적용: game 폴더 내용만 덮어써도 QSP/이미지/스타일은 반영됩니다. 다만 원본 B컷
연결과 모딩 도구의 새 경로 설정까지 완료하려면 적용.cmd를 쓰는 것이 간단합니다.
검사만: powershell.exe -NoProfile -ExecutionPolicy Bypass -File Apply.ps1
  -GameDir "플레이 game 경로" -OriginalDir "순정 game 경로" -VerifyOnly

게임 실행·플레이 검증은 사용자가 합니다. ZIP 제작과 검사에서 게임을 실행하지 않습니다.
'''
add('먼저읽기.txt',readme.encode('utf-8-sig'),'documentation','transfer-and-application-instructions')
validation=load(ROOT/'tmp/transfer-audit/installer-validation.json')
validation.pop('fixture',None)
validation.update({'qspRoundtrip':True,'qspBytesUnchanged':True,'qspSha256':META['game/jack.qsp']['sha256'],'zipCRC':'PASS','payloadHashes':'PASS','executableFilesIncluded':0,'otherImagePackDataIncluded':0,'note':'임시 게임 설치 시험 및 ZIP 정적 검증. 실제 게임 플레이와 새 PC 실행은 사용자 확인.'})
addjson('검증결과.json',validation,'validation','installer-fixture-and-package-integrity-checks')
manifest={'version':1,'name':NAME,'createdKST':NOW.isoformat(),'workUntilKST':NOW.isoformat(),'gameVersion':'Jack-o-nine-tails 2.3.2.5 Korean','noExecutablePatch':True,'noInstallBackup':True,'fullGame':False,'qspSha256':META['game/jack.qsp']['sha256'],'recordedImageCount':len(chosen),'workImageCount':len(images),'workImageBytes':sum(i['bytes'] for i in images.values()),'workImages':[{k:v for k,v in i.items() if k!='before'} for i in images.values()],'originalBCutCount':len(original['originals']),'originalBCutBytesExcluded':sum(x['bytes'] for x in original['originals'].values()),'thumbnailBytes':sum(len(b) for _,b in thumbs.values()),'catalogBytes':sum(len(b) for name,b in FILES.items() if name.startswith('catalog/')),'comparisonMissing':comparison_missing,'removedSecretFields':removed,'uiReleaseResources':len(ui_reused),'uiReleaseChangedExcluded':ui_changed,'ownershipPolicy':'successful writes + explicit user attachment + declared user event cuts; no ownership from completion or mtime','files':list(META.values())}
addjson('MANIFEST.json',manifest,'manifest','hash-and-scope-audit')
for rel,b in FILES.items():
    file=OUT/rel;file.parent.mkdir(parents=True,exist_ok=True);file.write_bytes(b)
archive=OUT.with_suffix('.zip')
with zipfile.ZipFile(archive,'x',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for rel,b in FILES.items():z.writestr(rel,b)
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    for f in manifest['files']:
        assert sha(z.read(f['path']))==f['sha256'],f['path']
    assert not any(re.search(r'\.(exe|dll|msi)$',n,re.I) or '/json/slaves/' in n or '/backups/' in n or '/__JO9_ImageBackups/' in n for n in z.namelist())
assert sha((GAME/'jack.qsp').read_bytes())==manifest['qspSha256'],'QSP changed during packaging'
digest=sha(archive.read_bytes());archive.with_suffix('.zip.sha256.txt').write_text(digest+'  '+archive.name+'\n','utf-8-sig')
result={'archive':str(archive),'stage':str(OUT),'bytes':archive.stat().st_size,'sha256':digest,'workImages':len(images),'recordedImages':len(chosen),'eventCuts':len(event_mods),'catalogBytes':manifest['catalogBytes'],'thumbnailBytes':manifest['thumbnailBytes'],'files':len(manifest['files']),'QSP':manifest['qspSha256'],'comparisonMissing':len(comparison_missing),'uiReleaseChangedExcluded':ui_changed}
(ROOT/'tmp/transfer-audit/package.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),'utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2),flush=True)
