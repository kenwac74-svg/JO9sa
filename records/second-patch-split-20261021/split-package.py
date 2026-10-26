"""Repack the verified second-patch runtime into core / Indie / SAnk ZIPs."""
from collections import Counter
import datetime as dt
import hashlib
import json
from pathlib import Path, PurePosixPath
import stat
import zipfile

REPO=Path('G:/somi/JO9sa')
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
RECORD=REPO/'records/second-patch-split-20261021'
UTILITY=RECORD/'utility'
PREVIOUS=REPO/'records/second-patch-zip-20261021'
OUT=Path('G:/somi/JO9_2.4_SecondPatch_20261021_Split')


def sha(data):return hashlib.sha256(data).hexdigest()


def read_json(p):return json.loads(p.read_text(encoding='utf-8-sig'))


def dump(obj):return (json.dumps(obj,ensure_ascii=False,indent=2)+'\n').encode('utf-8')


def digest(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(2**20),b''):h.update(b)
    return h.hexdigest()


def safe(name):
    p=PurePosixPath(name)
    assert not p.is_absolute() and '..' not in p.parts and '\\' not in name and ':' not in name
    return name


def text(value):return value.replace('\n','\r\n').encode('utf-8-sig')


def build():
    RECORD.mkdir(parents=True,exist_ok=True)
    OUT.mkdir(parents=True,exist_ok=True)
    previous=read_json(PREVIOUS/'FINAL_RESULT.json')
    assert previous['status']=='USER_TEST_READY' and previous['releaseVerdict']=='PASS'
    source=Path(previous['archive'])
    source_stat=source.stat()
    assert source_stat.st_size==previous['bytes']
    expected=read_json(PREVIOUS/'RUNTIME_FILE_LIST.json')
    utility_files=sorted(p for p in UTILITY.iterdir() if p.is_file())
    assert len(utility_files)==3 and Counter(p.suffix.lower() for p in utility_files)=={'.ps1':1,'.cmd':1,'.json':1}
    utility={p.name:p.read_bytes() for p in utility_files}
    for p in utility_files:
        assert p.resolve(strict=True)==p.absolute() and not(p.lstat().st_file_attributes&0x400)
    assert next(data for name,data in utility.items() if name.endswith('.ps1')).startswith(b'\xef\xbb\xbf')
    tests=read_json(RECORD/'utility-test-result.json')
    assert tests['status']=='PASS' and tests.get('total',0)>=16 and tests.get('failed',1)==0, 'Deletion utility must pass before packaging'
    rows=expected['files']
    groups={'core':[],'indie':[],'sank':[]}
    for r in rows:
        safe(r['path'])
        if r['kind']!='image':groups['core'].append(r)
        elif r['source']=='PSP_PSP_external_integration':groups['indie'].append(r)
        elif r['source']=='workshop_recorded_replacement':groups['sank'].append(r)
        else:raise AssertionError('Unknown source '+str(r))
    assert {k:len(v) for k,v in groups.items()}=={'core':34,'indie':6799,'sank':118}
    assert {r['path'] for r in rows}==set().union(*(set(r['path'] for r in g) for g in groups.values()))
    assert sum(map(len,groups.values()))==len(rows)
    labels={'core':'Core','indie':'IndieImages','sank':'SAnkImages'}
    names={k:('JO9_2.4_SecondPatch_20261021_Core_Test.zip' if k=='core' else 'JO9_2.4_'+labels[k]+'_20261021_Test.zip') for k in groups}
    ps_name=next(n for n in utility if n.endswith('.ps1'))
    cmd_name=next(n for n in utility if n.endswith('.cmd'))
    utility_names=', '.join(utility)
    overview=f'''잭오나2.4 알파2차 누적 테스트 빌드 - 분리 구성

1. {names['core']}
   최신QSP·CSS·JSON32개와 구도나JSON25개 삭제기. 1차/r2/r3 수정 포함.
2. {names['indie']}
   PSP_PSP 인디 리소스6799경로. 본체의 새 인물/외형JSON과 함께 필요합니다.
3. {names['sank']}
   SAnk 개인작업118파일(배경19/몹99, B컷7포함).

처음2.4에 적용할 때: 이미지팩 적용 → 본체 적용 → 삭제기 실행 → 게임 실행.
이미지팩은 각각 game 폴더를 기존 game 폴더와 합쳐 덮어씁니다.
본체는 game 폴더와 삭제기3파일({utility_names})을 게임 최상위폴더에 복사합니다.
{cmd_name}을 더블클릭하면 정확히 지정된 옛 도나JSON25개만 검사·제거합니다.
본체를 단독으로 처음 적용하면 새 인물/외형에 필요한 인디 그림이 없을 수 있습니다.

앞선4.19GB 통합 테스트ZIP을 이미 적용했다면 이미지 내용은 동일하므로 본체만 적용하면 됩니다.
그 후 이미지에 변화가 없는 후속 본체 패치는 이미지팩을 매번 다시 받을 필요가 없습니다.
세이브·개인설정·독립편집도구·게임설치기는 포함하지 않았습니다.
기존game폴더를 통째로 지우지 마세요. 이미 잘못 보상받은 개체는 자동교체하지 않습니다.
'''
    readmes={
      'core':f'''2.4 알파2차 누적 본체 테스트 패치

포함: game/jack.qsp, game/css/base.css, JSON32개, 구도나JSON삭제기.
1차/r2/r3 수정도 포함합니다. 이미지 파일은 없습니다.

적용
1. 게임을 종료합니다.
2. 인디 이미지팩을 아직 적용하지 않았다면 먼저 같은 게임폴더에 합칩니다.
   새2323랜덤인물·이사벨라등의 JSON이 인디팩 그림을 사용하므로 최초에는 함께 필요합니다.
   개인제작 이미지팩은 별도로 적용할 수 있습니다.
3. 이 ZIP의 game 폴더를 기존 game 폴더에 합쳐 같은 파일을 덮어씁니다.
   함께 들어 있는 삭제기3파일({utility_names})도 게임 실행파일이 있는 최상위폴더에 복사합니다.
4. {cmd_name}을 더블클릭합니다. 설치폴더를 찾지 못하면 실제 게임폴더를 지정합니다.
   지정된 옛 도나JSON25개만 검사·제거합니다. 이미 없으면 건너뛰며 정상 고번호JSON과 원작JSON은 보존합니다.
   수정된 옛 파일이나 정상 파일의 누락/불일치가 있으면 이유를 표시하고 삭제를 멈춥니다.
5. 게임을 다시 실행해 기존 세이브를 불러와 확인합니다.

삭제기는 사용자가 직접 실행할 때만 동작하며 게임설치/파일복사/자동백업은 하지 않습니다.
수동 제거를 원하면 REMOVE_OLD_DONA_JSON_KO.txt의 정확한 목록을 사용하세요.
명령행 미리보기: powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\\{ps_name} -GameDirectory <실제game폴더> -WhatIf

앞선4.19GB 통합테스트 ZIP과 게임파일 내용은 동일합니다. 이미 그 이미지를 적용했다면 본체만 받으면 됩니다.
검사: QSP는 앞선실제엔진9경로PASS파일과 바이트동일. 분리ZIP모든항목의CRC·SHA검사.
삭제기는 별도동작·문법·회귀검사를 거쳤습니다. 실제세이브선택UI/전체화면·모든분기는 사용자플레이확인대상입니다.
''',
      'indie':'''2.4 인디 이미지 리소스팩 - PSP_PSP

게임 내 이미지6799개 경로를 포함합니다. JSON·QSP·세이브는 없습니다.
기존2.4와 동일한파일은 제외했고 새인물/외형/장면과 필요한 구이사벨라그림 재사용경로를 포함합니다.
275개 재사용경로는 새로 그린 그림 수에 포함하지 않습니다.

게임을 종료하고 ZIP의 game 폴더를 실제게임의 game 폴더와 합쳐 같은 파일을 덮어쓰세요.
2차본체의 JSON32개와 함께 사용해야 새인물·외형이 올바르게 연결됩니다.
앞선4.19GB 통합테스트ZIP을이미 적용했다면 같은그림이므로 다시 적용할필요는 없습니다.

인디패치 원작자 PSP_PSP. 관련원작/팩의 기존크레딧을 유지합니다.
개인제작 이미지118파일은 별도 SAnk 이미지팩입니다.
''',
      'sank':'''2.4 SAnk 개인제작 이미지 리소스팩

개인작업118파일(배경19/몹99)을 포함합니다. 신규B컷7개 포함.
111개기존경로교체와7개B컷추가이며,118종의새그림이나오늘제작량이라는뜻은아닙니다.
이미지외 QSP·JSON·세이브는 없습니다. 기배포2.4와같은파일은 제외했습니다.

게임을종료하고ZIP의game폴더를실제게임의game폴더와합쳐같은파일을덮어쓰세요.
B컷전환은2차본체의누적QSP와함께사용합니다. 인디팩과파일경로가겹치지않습니다.
앞선4.19GB통합테스트ZIP을이미적용했다면같은그림이므로다시적용할필요는없습니다.
제작/개편:SAnk. 기존게임/외부리소스의원작크레딧은유지합니다.
'''}
    manifests={}
    outputs=[]
    all_verified=set()
    with zipfile.ZipFile(source) as src:
        assert read_json(PREVIOUS/'RUNTIME_FILE_LIST.json')==json.loads(src.read('BUILD_MANIFEST.json'))
        for k,group in groups.items():
            target=OUT/names[k]
            assert not target.exists(), 'Preserve existing artifacts'
            manifest={'schema':1,'id':target.stem,'kind':k,'status':'USER_TEST_CANDIDATE',
                      'createdAt':dt.datetime.now(dt.timezone.utc).isoformat(),
                      'sourceArchiveSha256':previous['sha256'], 'runtimeFiles':group,
                      'runtimeCount':len(group),'runtimeBytes':sum(r['bytes'] for r in group),
                      'qspSha256':expected['qspSha256'] if k=='core' else None,
                      'requires':['2.4_Korean_base']+(['IndieImages_when_not_installed'] if k=='core' else ['SecondPatch_Core']),
                      'utility':({name:{'sha256':sha(data),'bytes':len(data)} for name,data in utility.items()} if k=='core' else {}),
                      'manualDelete':expected['manualDelete'] if k=='core' else [],
                      'FullSynchronized':False,'gameFilesChangedByRepack':False}
            extra={'README_'+labels[k].upper()+'_KO.txt':text(readmes[k]),
                   'BUILD_MANIFEST_'+labels[k].upper()+'.json':dump(manifest)}
            if k=='core':
                extra.update(utility)
                extra['README_SPLIT_PACKS_KO.txt']=text(overview)
                changelog=src.read('CHANGELOG_KO.md').decode('utf-8-sig')
                changelog=changelog.replace('옛 도나 JSON25개 수동 제거가 필요합니다. 정확한 목록을 함께 제공합니다.',
                    '옛 도나 JSON25개는 동봉된 삭제기를 실행하거나 정확한 목록대로 수동 제거합니다.')
                changelog+='\n이미지는 별도 인디 리소스팩과 SAnk 제작/교체 이미지팩으로 제공합니다. 본체 ZIP에는 이미지가 없습니다.\n'
                extra['CHANGELOG_KO.md']=text(changelog.replace('\r\n','\n'))
                extra['REMOVE_OLD_DONA_JSON_KO.txt']=src.read('REMOVE_OLD_DONA_JSON_KO.txt')
            expected_members={r['path']:{'sha256':r['sha256'],'bytes':r['bytes']} for r in group}
            expected_members.update({n:{'sha256':sha(b),'bytes':len(b)} for n,b in extra.items()})
            with zipfile.ZipFile(target,'x',allowZip64=True) as dst:
                for name,data in extra.items():dst.writestr(name,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=6)
                for i,r in enumerate(group):
                    source_info=src.getinfo(r['path'])
                    assert source_info.file_size==r['bytes']
                    info=zipfile.ZipInfo(r['path'],source_info.date_time)
                    info.compress_type=zipfile.ZIP_STORED if k!='core' else zipfile.ZIP_DEFLATED
                    info._compresslevel=6
                    h=hashlib.sha256();size=0
                    with src.open(r['path']) as f,dst.open(info,'w',force_zip64=True) as g:
                        for b in iter(lambda:f.read(2**20),b''):g.write(b);h.update(b);size+=len(b)
                    assert size==r['bytes'] and h.hexdigest()==r['sha256']
                    if (i+1)%1000==0:print(json.dumps({'phase':'write','pack':k,'members':i+1}),flush=True)
            with zipfile.ZipFile(target) as check:
                assert set(check.namelist())==set(expected_members)
                assert len(check.namelist())==len(set(n.casefold() for n in check.namelist()))
                for i,name in enumerate(check.namelist()):
                    safe(name);h=hashlib.sha256();size=0
                    with check.open(name) as f:
                        for b in iter(lambda:f.read(2**20),b''):h.update(b);size+=len(b)
                    assert h.hexdigest()==expected_members[name]['sha256'] and size==expected_members[name]['bytes']
                    if name.startswith('game/'):all_verified.add(name)
                    if (i+1)%1000==0:print(json.dumps({'phase':'CRC-and-SHA','pack':k,'members':i+1}),flush=True)
            archive_sha=digest(target)
            (OUT/(target.name+'.sha256')).write_text(archive_sha+'  '+target.name+'\n',encoding='ascii')
            manifests[k]=manifest
            outputs.append({'kind':k,'archive':str(target),'bytes':target.stat().st_size,'sha256':archive_sha,
                            'runtimeFiles':len(group),'totalFiles':len(expected_members),'CRCAndSHA256':True})
            print(json.dumps({'phase':'pack-complete','pack':k,'bytes':target.stat().st_size}),flush=True)
    assert all_verified=={r['path'] for r in rows}
    assert (source.stat().st_size,source.stat().st_mtime_ns)==(source_stat.st_size,source_stat.st_mtime_ns)
    for r in groups['core']:
        assert digest(WORK/r['path'][5:])==r['sha256']
    result={'status':'PACKAGING_PASS_FINAL_REVIEW_PENDING','artifacts':outputs,'runtimeUnion':len(all_verified),
            'runtimeMatchesPreviousVerifiedBuild':True,'disjointImagePacks':True,'sourceArchiveUnchanged':True,
            'gameFilesChanged':False,'FullUpdated':False,'commit':False,'push':False,
            'newUserAuthorization':'Explicit exact25file Dona JSON deletion utility; no game installer or backup automation.',
            'qspGateReused':{'reason':'QSP/CSS/JSON payload unchanged from already validated combined build.',
                             'report':'../second-patch-zip-20261021/release-validation.json','verdict':'PASS','nativePaths':9}}
    (OUT/'README_KO.txt').write_bytes(text(overview))
    with (RECORD/'SPLIT_BUILD_RESULT.json').open('x',encoding='utf-8') as f:json.dump(result,f,ensure_ascii=False,indent=2);f.write('\n')
    with (RECORD/'SPLIT_MANIFESTS.json').open('x',encoding='utf-8') as f:json.dump(manifests,f,ensure_ascii=False,indent=2);f.write('\n')
    print(json.dumps({'status':result['status'],'artifacts':outputs}),flush=True)


if __name__=='__main__':build()
