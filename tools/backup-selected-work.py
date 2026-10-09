from pathlib import Path
import json,re,hashlib,zipfile,time,os,shutil
ROOT=Path(__file__).resolve().parents[1]
ACTIVE=Path(r'C:\Users\Ken Choung\Documents\Codex\2026-10-06\task\JO9sa')
GAME=Path(r'C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex\game')
ORIGINAL=Path(r'G:\내 드라이브\Moding\JO9main\game')
DEST=Path(r'G:\내 드라이브\Moding\worksink').resolve()
assert str(DEST).casefold()==r'G:\내 드라이브\Moding\worksink'.casefold()
stamp=time.strftime('%Y%m%d_%H%M%S')
local=ROOT/'backups'/('JO9_work_results_'+stamp+'.zip')
local.parent.mkdir(exist_ok=True)
status_text=(ACTIVE/'tools/local-workspace/catalog/catalog_status.js').read_text(encoding='utf-8-sig')
status=json.loads(status_text[status_text.index('{'):].strip().rstrip(';'))
progress=json.loads((ACTIVE/'tools/local-workspace/catalog/image_work/progress.json').read_text(encoding='utf-8-sig'))
states={x['relative_path'].replace('\\','/').lower():x.get('work_status') for x in progress['items']}
manifest={'created':stamp,'scope':'작업 결과 이미지, 환경설정, 변경된 도구와 설정만','images':[],'files':[],'excluded_original':[],'missing':[],'duplicate_images':[]}
hash_cache={}
def sha(p):
    key=str(p)
    if key not in hash_cache:
        h=hashlib.sha256()
        with p.open('rb') as f:
            while b:=f.read(2*1024*1024):h.update(b)
        hash_cache[key]=h.hexdigest()
    return hash_cache[key]
seen={}
with zipfile.ZipFile(local,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=1,allowZip64=True) as z:
    def add(p,arc,image=False):
        if not p.is_file():manifest['missing'].append(str(p));return
        h=sha(p)
        if image and h in seen:
            manifest['duplicate_images'].append({'path':arc,'same_as':seen[h]});return
        if image:seen[h]=arc
        st=p.stat()
        z.write(p,arc,compress_type=zipfile.ZIP_STORED if image else zipfile.ZIP_DEFLATED)
        if (st.st_size,st.st_mtime_ns)!=(p.stat().st_size,p.stat().st_mtime_ns):raise RuntimeError('Changed during backup: '+str(p))
        manifest['images' if image else 'files'].append({'path':arc,'bytes':st.st_size,'sha256':h})
    for n,(rel,tags) in enumerate(status['items'].items()):
        r=rel.replace('\\','/')
        if 'done' not in tags or '/reserve/' in '/'+r.lower()+'/':continue
        if states.get(r.lower()) in {'original_retained','discarded_by_user','not_started'}:
            manifest['excluded_original'].append(r);continue
        p=GAME/Path(r)
        ref=ORIGINAL/Path(r)
        if not p.is_file():manifest['missing'].append(r);continue
        if ref.is_file() and p.stat().st_size==ref.stat().st_size and sha(p)==sha(ref):
            manifest['excluded_original'].append(r);continue
        add(p,'results/game/'+r,True)
        if len(manifest['images']) and len(manifest['images'])%100==0:print('Collected result images:',len(manifest['images']),flush=True)
    # Generated variants supplied in this chat, not original/reference images.
    for idx,name in enumerate(['codex-clipboard-f397e1c8-05b6-4c28-a4f6-dd5c6c607399.png','codex-clipboard-2a03a1c4-de45-4527-9eb7-4e7a25b86faa.png','codex-clipboard-39c0b7ec-25cf-4cbe-bbbd-eb03bc5e8c6f.png'],1):
        add(Path(r'C:\Users\KENCHO~1\AppData\Local\Temp')/name,f'results/in-progress/Voland-variant-{idx}.png',True)
    changes=['tools/text-workshop/server.cjs','tools/text-workshop/grok-prompt.cjs','tools/local-workspace/catalog/catalog_workshop.js','tools/local-workspace/catalog-seed/catalog_workshop.js','tools/imgmg/catalog_workshop.js']
    for r in changes:add(ACTIVE/r,'changed-tools/JO9sa/'+r)
    add(GAME/'modtools/place/JO9_Place_Workshop.html','changed-tools/game/modtools/place/JO9_Place_Workshop.html')
    for r in ['docs/DIALOGUE_TEXT_CAPACITY_20261007.md','tools/dialogue-length-rule.txt','tools/catalog-follow-selection.js','tools/catalog-selection-server.snippet.txt','tools/workshop-catalog-selection.js','tools/measure-dialogue-layout.cjs']:
        add(ROOT/r,'changed-tools/session/'+r)
    for r in ['catalog_status.js','catalog_work_ids.json','catalog_work_codes.js','image_work/progress.json']:
        add(ACTIVE/'tools/local-workspace/catalog'/r,'settings/catalog/'+r)
    for r in ['tools/local-workspace/Start-JO9-Tools.ps1','tools/local-workspace/Open-JO9-Tools.cmd']:
        add(ACTIVE/r,'settings/launcher/'+Path(r).name)
    removed=[]
    def clean(obj,path=''):
        if isinstance(obj,dict):
            out={}
            for k,v in obj.items():
                if re.search(r'api.?key|token|secret|password|credential|encrypted|protected|authorization',k,re.I):removed.append(path+'.'+k);continue
                out[k]=clean(v,path+'.'+k)
            return out
        if isinstance(obj,list):return [clean(x,path) for x in obj]
        if isinstance(obj,str) and re.search(r'sk-(?:or-v1|svcacct|proj)-|Bearer\s+[A-Za-z0-9]',obj):removed.append(path);return ''
        return obj
    settings=[(ACTIVE/'tools/local-workspace/local.config.json','environment/source-local.config.json'),(GAME/'modtools/config.json','environment/workshop-config.json'),(GAME/'modtools/filters.json','environment/workshop-filters.json'),(GAME/'modtools/text-workshop/runtime/grok-settings.json','settings/ai/grok-settings.json'),(GAME/'modtools/text-workshop/runtime/dialogue-ai-settings.json','settings/ai/dialogue-ai-settings.json')]
    for p,arc in settings:
        if p.is_file():
            try:data=clean(json.loads(p.read_text(encoding='utf-8-sig')))
            except (ValueError,UnicodeError):manifest['missing'].append('Cannot parse settings: '+str(p));continue
            z.writestr(arc,json.dumps(data,ensure_ascii=False,indent=2))
            manifest['files'].append({'path':arc,'sanitized':True})
    z.writestr('environment/tool-windows.json',json.dumps({'local_ports':[3813,5269],'urls':['http://127.0.0.1:3813/catalog','http://127.0.0.1:3813/','http://127.0.0.1:5269/','https://huggingface.co/spaces/fancyfeast/joy-caption-beta-one','https://translate.google.co.kr/?sl=en&tl=ko&op=translate','https://www.mage.space/advanced'],'dialogue_default_characters':'370~390','dialogue_rule':'Rendered line capacity differs by scene; see measurement document'},ensure_ascii=False,indent=2))
    note='''# 집에서 이어하기 — 작업 결과만 백업

results/game: 체크리스트 완료 이미지 중 원본 유지/동일 파일을 제외한 현재 적용 결과. game 기준 상대 경로를 유지했습니다. 동일 바이트 이미지는 한 번만 저장하고 MANIFEST의 duplicate_images에 대응 경로를 적었습니다.
results/in-progress: 이 대화에 첨부한 Voland 생성 시안. 최종 채택/게임 적용본이 아닙니다.
changed-tools: 이번 세션 수정 도구 파일. 집의 JO9sa 및 game/modtools 대응 위치에 적용할 수 있습니다. 전체 도구 설치본은 아니므로 기존 JO9sa 도구가 필요합니다. session 폴더에는 측정·연동 소스가 있습니다.
settings/catalog: 카탈로그 체크 상태·작업 번호·진행 기록. 기존 번호를 삭제하거나 새로 부여하지 마세요.
environment: 기존 PC 경로와 워크샵 설정 기록. 집에서는 경로를 다시 지정하세요. launcher의 Start-JO9-Tools.ps1 -Configure로 플레이 game 및 순정 비교 game 경로를 설정합니다. 카탈로그 3813, 자동감지 워크샵 5269에서 실행합니다.
settings/ai: 모델·제공자 등 설정을 보존하되 API 키·보호키·토큰은 제거했습니다. 집에서 키를 다시 입력해야 합니다.
게임 전체, 원본/참고자료, 도구 전체, Git 저장소, 세이브, 서버 실행 토큰·PID·로그는 포함하지 않았습니다. 온라인 Mage/Gamma 작품 및 브라우저 미저장 상태도 별도입니다.
이미지 파일 자체를 축소/재인코딩하지 않았습니다. ZIP CRC 검사와 SHA-256 검증을 수행했습니다. G: 개인 Drive 경로에 로컬 파일을 저장한 것이며 Google Drive 원격 동기화 완료는 확인하지 않았습니다.
'''
    z.writestr('집에서_이어하기.md',note)
    manifest['removed_secret_fields']=removed
    manifest['image_count']=len(manifest['images'])
    manifest['image_bytes']=sum(x['bytes'] for x in manifest['images'])
    z.writestr('MANIFEST.json',json.dumps(manifest,ensure_ascii=False,indent=2))
print('Checking archive CRC',flush=True)
with zipfile.ZipFile(local) as z:
    bad=z.testzip()
    if bad:raise RuntimeError('CRC failure '+bad)
digest=sha(local)
DEST.mkdir(parents=True,exist_ok=True)
target=DEST/local.name
assert target.parent==DEST and not target.exists()
shutil.copyfile(local,target)
if sha(target)!=digest:raise RuntimeError('Destination hash mismatch')
(DEST/(local.name+'.sha256.txt')).write_text(digest+'  '+local.name+'\n',encoding='ascii')
print(json.dumps({'destination':str(target),'images':manifest['image_count'],'image_MiB':round(manifest['image_bytes']/1048576,1),'archive_MiB':round(target.stat().st_size/1048576,1),'excluded_original':len(manifest['excluded_original']),'deduplicated':len(manifest['duplicate_images']),'missing':manifest['missing'],'sha256':digest,'CRC':'passed','copy_hash':'matched'},ensure_ascii=False),flush=True)
