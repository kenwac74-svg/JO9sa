"""Move only the 31 Indie definitions into their resource pack; payload unchanged."""
from collections import Counter
import datetime as dt
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import stat
import zipfile

REPO=Path('G:/somi/JO9sa')
RECORD=REPO/'records/second-patch-json-r2-20261021'
PREVIOUS=REPO/'records/second-patch-zip-20261021'
SPLIT=REPO/'records/second-patch-split-20261021'
OUT=Path('G:/somi/JO9_2.4_SecondPatch_20261021_Split')
TEMP=Path('G:/Codex/tmp/second-patch-json-r2-20261021')
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
BASE=Path('G:/somi/JO9_2.4_Release_20261019_Final/verified/JO9_2.4_Full/game')


def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def dump(x):return (json.dumps(x,ensure_ascii=False,indent=2)+'\n').encode('utf-8')
def text(x):return x.replace('\n','\r\n').encode('utf-8-sig')
def sha(x):return hashlib.sha256(x).hexdigest()


def digest(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(2**20),b''):h.update(b)
    return h.hexdigest()


def save(p,value):
    p.parent.mkdir(parents=True,exist_ok=True)
    with p.open('xb') as f:f.write(dump(value))


def safe(name):
    p=PurePosixPath(name)
    assert name==str(p) and not p.is_absolute() and '..' not in p.parts and '\\' not in name and ':' not in name


def build():
    RECORD.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
    prior=load(PREVIOUS/'FINAL_RESULT.json');whole=load(PREVIOUS/'RUNTIME_FILE_LIST.json')
    source=Path(prior['archive']);source_stat=source.stat()
    assert prior['status']=='USER_TEST_READY' and source_stat.st_size==prior['bytes']
    rows=whole['files'];core_names={'game/jack.qsp','game/css/base.css','game/json/slaves/211.json'}
    core=[r for r in rows if r['path'] in core_names]
    indie_json=[r for r in rows if r['kind']=='json' and r['path'] not in core_names]
    indie_images=[r for r in rows if r.get('source')=='PSP_PSP_external_integration']
    personal=[r for r in rows if r.get('source')=='workshop_recorded_replacement']
    assert (len(core),len(indie_json),len(indie_images),len(personal))==(3,31,6799,118)
    assert {r['path'] for r in core}==core_names
    groups={'core':core,'indie':indie_images+indie_json}
    assert len({r['path'] for r in core+indie_json+indie_images+personal})==len(rows)==6951
    utility={p.name:p.read_bytes() for p in (SPLIT/'utility').iterdir() if p.is_file()}
    tested=load(SPLIT/'utility-test-result.json')
    assert tested['status']=='PASS' and tested['total']==18 and len(utility)==3
    for r in tested['productionFiles']:assert sha(utility[r['name']])==r['sha256']
    previous_split=load(SPLIT/'FINAL_RESULT.json')
    sank=next(r for r in previous_split['artifacts'] if r['kind']=='sank')
    assert digest(Path(sank['archive']))==sank['sha256']
    names={'core':'JO9_2.4_SecondPatch_20261021_Core_Test_r2.zip',
           'indie':'JO9_2.4_IndieResources_20261021_Test_r2.zip'}
    overview=f'''2.4 알파 2차 누적 테스트 빌드 - r2 구성 수정

본체: {names['core']}
  QSP·CSS·수정된211.json과 도나 구형JSON25개 삭제기. 이미지/인디용JSON 없음.
인디 리소스팩: {names['indie']}
  PSP_PSP 이미지6799개 경로와 연결용JSON31개. 이미지와 인물/의상등록을 한 팩으로 관리합니다.
개인 이미지팩: {Path(sank['archive']).name}
  이미지118파일. 앞서 만든 팩과 같으므로 다시 받거나 적용할 필요는 없습니다.

각 팩의 game 폴더를 기존 game 폴더와 합쳐 같은 파일만 덮어씁니다. 기존 game을 통째로 지우지 마세요.
본체의 삭제기3파일도 게임실행파일이 있는 최상위폴더에 복사하고 Remove-Old-Dona-Json.cmd를 실행합니다.
기존2.4에 본체만 적용하면 기존 인물/외형 등록이 유지됩니다. 새 인디 외형과 구이사벨라 랜덤등록은 인디팩이 담당합니다.
기존에 인디팩/통합ZIP을 적용했다면 그 JSON과 그림은 보존하며 본체만 갱신할 수 있습니다.
기존세이브에 인디인물2323을 이미 보유한 경우 관련 JSON/그림을 제거하지 마세요.

1차/r2/r3 수정이 포함된 누적 본체입니다. 세이브·개인설정·별도편집도구·설치기는 포함하지 않습니다.
이번에는 파일의 소속만 조정했으며 게임코드·효과·삭제기는 앞선 검증본과 동일합니다.
'''
    readmes={
      'core':'''2.4 알파 2차 누적 본체 테스트 패치 r2

포함: game/jack.qsp, game/css/base.css, game/json/slaves/211.json, 도나JSON삭제기3파일.
이미지와 인디용JSON31개는 별도 인디 리소스팩에 있습니다.

게임 종료 후 game 폴더를 기존 game 폴더와 합쳐 덮어쓰세요.
삭제기3파일(Remove-Old-Dona-Json.cmd/.ps1, dona-json-delete-allowlist.json)도 게임 최상위폴더에 복사하세요.
Remove-Old-Dona-Json.cmd를 실행하면 지정된 옛 도나JSON25개만 검사·제거합니다.
정상고번호파일/원작퀘스트파일/세이브는 보존합니다. 이미 정리됐으면 건너뜁니다.
수정된 파일, 정상파일 누락/불일치, 연결경로가 있으면 삭제 전에 멈추고 이유를 표시합니다.
수동제거 대안은 REMOVE_OLD_DONA_JSON_KO.txt입니다. 기존 game 폴더 전체를 지우지 마세요.

본체만 적용하면 기존2.4 인물/외형등록이 유지됩니다. 새인디외형을 원하면 인디리소스팩을 함께 적용하세요.
앞선 통합ZIP/인디팩을 적용한 폴더의 인디JSON은 이 본체가 삭제하거나 되돌리지 않습니다.
기존세이브의 인디인물2323과 관련 리소스는 유지하세요.
1차/r2/r3수정 포함. 실제세이브UI/모든화면과분기는 사용자 플레이 확인대상입니다.
''',
      'indie':'''2.4 인디 리소스팩 r2 - 이미지와 연결 JSON 통합

PSP_PSP 인디 이미지6799개 경로와 연결용JSON31개를 포함합니다.
JSON은 새 얼굴·몸·의상 경로, 인물2323과 랜덤등록상한을 함께 연결합니다.
구이사벨라 그림을 랜덤인물로 보존하는 데 필요한275개 재사용경로도 포함합니다.
6799는 파일경로 수이며 모두 새로 그린 그림이라는 뜻은 아닙니다.

게임 종료 후 ZIP의 game 폴더를 실제 game 폴더와 합쳐 같은파일을 덮어쓰세요.
2차누적본체와 함께 사용합니다. 본체에는 인디JSON이 없으므로 이 팩만으로 이미지/등록을 함께 관리할 수 있습니다.
앞선4.19GB통합ZIP 또는 최초분리본의 본체+인디이미지팩을 이미 적용했다면 런타임내용은 같습니다.
이 경우 다시 받을 필요는 없습니다. 기존세이브에2323이 있다면 관련 JSON/그림을 삭제하지 마세요.
세이브·QSP·개인이미지118파일은 포함하지 않습니다.

인디패치 원작자: PSP_PSP. 기존게임/관련리소스의 크레딧은 유지합니다.
'''}
    artifacts=[];verified=set();manifests={}
    with zipfile.ZipFile(source) as src:
        assert json.loads(src.read('BUILD_MANIFEST.json'))==whole
        for kind,group in groups.items():
            archive=OUT/names[kind];assert not archive.exists()
            manifest={'schema':1,'kind':kind,'revision':'r2-json-placement','runtimeFiles':group,
                'runtimeCount':len(group),'counts':dict(Counter(r['kind'] for r in group)),
                'utility':({n:{'bytes':len(b),'sha256':sha(b)} for n,b in utility.items()} if kind=='core' else {}),
                'indieDefinitionsInCore':False,'indieJSONCount':31 if kind=='indie' else 0,
                'gamePayloadUnchanged':True,'sourceArchiveSha256':prior['sha256'],
                'requires':['existing2.4KoreanGame']+(['secondPatchCore'] if kind=='indie' else []),
                'createdAt':dt.datetime.now(dt.timezone.utc).isoformat()}
            extras={'README_'+kind.upper()+'_r2_KO.txt':text(readmes[kind]),'BUILD_MANIFEST_'+kind.upper()+'_r2.json':dump(manifest)}
            if kind=='core':
                extras.update(utility);extras['README_SPLIT_PACKS_r2_KO.txt']=text(overview)
                extras['REMOVE_OLD_DONA_JSON_KO.txt']=src.read('REMOVE_OLD_DONA_JSON_KO.txt')
                old_core=next(r for r in previous_split['artifacts'] if r['kind']=='core')
                with zipfile.ZipFile(old_core['archive']) as old_zip:
                    prior_changelog=old_zip.read('CHANGELOG_KO.md').decode('utf-8-sig').replace('\r\n','\n')
                extras['CHANGELOG_KO.md']=text(prior_changelog.rstrip()+'''\n\n## 2차 누적 테스트 패치 r2 포장 수정

게임코드와이미지내용은앞선검증본과같습니다.
인디용JSON31개를본체에서인디리소스팩으로옮겨이미지·외형등록을같은팩에서관리합니다.
본체에는QSP·CSS·211.json수리와구도나25파일정리기만포함합니다.
개인이미지팩118파일은변경없습니다. 기존에모두적용했다면다시받을필요없습니다.
도나JSON25개는동봉된삭제기를실행하거나정확한수동목록대로제거합니다.
1차/r2/r3및앞선2차대사·서식·인물/장비/개인실수정내역은유지합니다.
''')
            expected={r['path']:{'bytes':r['bytes'],'sha256':r['sha256']} for r in group}
            expected.update({n:{'bytes':len(b),'sha256':sha(b)} for n,b in extras.items()})
            with zipfile.ZipFile(archive,'x',allowZip64=True) as z:
                for n,b in extras.items():z.writestr(n,b,compress_type=zipfile.ZIP_DEFLATED,compresslevel=6)
                for i,r in enumerate(group):
                    safe(r['path']);info=zipfile.ZipInfo(r['path'],src.getinfo(r['path']).date_time)
                    info.compress_type=zipfile.ZIP_STORED if r['kind']=='image' else zipfile.ZIP_DEFLATED;info._compresslevel=6
                    h=hashlib.sha256();size=0
                    with src.open(r['path']) as f,z.open(info,'w',force_zip64=True) as dest:
                        for b in iter(lambda:f.read(2**20),b''):dest.write(b);h.update(b);size+=len(b)
                    assert size==r['bytes'] and h.hexdigest()==r['sha256']
                    if (i+1)%1000==0:print(json.dumps({'phase':'write','pack':kind,'files':i+1}),flush=True)
            with zipfile.ZipFile(archive) as z:
                assert len(z.namelist())==len(set(n.casefold() for n in z.namelist()))==len(expected)
                assert set(z.namelist())==set(expected)
                for i,n in enumerate(z.namelist()):
                    safe(n);h=hashlib.sha256();size=0
                    with z.open(n) as f:
                        for b in iter(lambda:f.read(2**20),b''):h.update(b);size+=len(b)
                    assert (size,h.hexdigest())==(expected[n]['bytes'],expected[n]['sha256'])
                    if n.startswith('game/'):verified.add(n)
                    if (i+1)%1000==0:print(json.dumps({'phase':'verify','pack':kind,'files':i+1}),flush=True)
            h=digest(archive);(OUT/(archive.name+'.sha256')).write_text(h+'  '+archive.name+'\n',encoding='ascii')
            artifacts.append({'kind':kind,'archive':str(archive),'bytes':archive.stat().st_size,'sha256':h,
                'runtimeFiles':len(group),'counts':manifest['counts'],'allCRCandSHA256':True})
            manifests[kind]=manifest
    assert verified|{r['path'] for r in personal}=={r['path'] for r in rows}
    artifacts.append({**sank,'reusedUnchanged':True})
    # Configure a published2.4 + core-only overlay for the installed engine gate.
    game=TEMP/'core-runtime/game';assert not game.exists()
    shutil.copytree(BASE/'json',game/'json');shutil.copyfile(BASE/'config.xml',game/'config.xml')
    with zipfile.ZipFile(artifacts[0]['archive']) as z:
        for r in core:
            dest=game/r['path'][5:];dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(z.read(r['path']))
    for d in whole['manualDelete']:
        p=game/d['file'];assert digest(p)==d['only_if_sha256'];p.unlink()
    assert load(game/'json/slave_index.json')==load(BASE/'json/slave_index.json')
    assert not (game/'json/slaves/2323.json').exists()
    combined=TEMP/'combined-json';shutil.copytree(game/'json',combined)
    with zipfile.ZipFile(artifacts[1]['archive']) as z:
        for r in indie_json:
            dest=combined/r['path'][10:];dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(z.read(r['path']))
    map_json=lambda root:{p.relative_to(root).as_posix():digest(p) for p in root.rglob('*.json')}
    assert map_json(combined)==map_json(WORK/'json')
    for r in core:assert digest(WORK/r['path'][5:])==r['sha256']
    assert (source.stat().st_size,source.stat().st_mtime_ns)==(source_stat.st_size,source_stat.st_mtime_ns)
    (OUT/'README_r2_KO.txt').write_bytes(text(overview))
    result={'status':'PACKAGED_QA_PENDING','artifacts':artifacts,'runtimeUnion':6951,
        'counts':{'coreRuntime':3,'coreGameJSON':1,'indieImages':6799,'indieJSON':31,'personalImages':118},
        'allPayloadBytesMatchPreviouslyValidatedBuild':True,'combinedJSONMatchesWork':True,
        'coreOnlyUsesOriginalRegistry':True,'utilityUnchanged18Tests':True,
        'gameFilesChanged':False,'FullUpdated':False,'commit':False,'push':False}
    save(RECORD/'BUILD_RESULT.json',result);save(RECORD/'MANIFESTS.json',manifests)
    print(json.dumps(result),flush=True)


if __name__=='__main__':build()
