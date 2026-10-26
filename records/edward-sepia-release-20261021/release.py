"""Synchronize one approved image and revise only the personal image pack."""
from pathlib import Path
import datetime as dt
import hashlib,json,os,shutil,sys,zipfile
from PIL import Image

REPO=Path('G:/somi/JO9sa');REC=REPO/'records/edward-sepia-release-20261021'
OUT=Path('G:/somi/JO9_2.4_SecondPatch_20261021_Split')
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game');FULL=Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full/game')
REL='game/content/pic/master/master_edward_sepia.png'
HASH='2e827bc6faba1d4ac586b7976f9fc028621c2b71870645cab4bdcb6534afac06'
OLD='73323a81cf6d46e4b5b4ff470425dafcd28e47ed2377018c7b38aa14ba20cf78'
NAMES={'core':'JO9_2.4_SecondPatch_20261021.zip','indie':'JO9_2.4_IndieResources_20261021.zip','sank':'JO9_2.4_SAnkImages_20261021.zip'}
NEW=OUT/'JO9_2.4_SAnkImages_20261021_r2.zip'
load=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
data=lambda o:(json.dumps(o,ensure_ascii=False,indent=2)+'\n').encode('utf-8')
sha_bytes=lambda b:hashlib.sha256(b).hexdigest()
def sha(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(8*1024*1024),b''):h.update(b)
    return h.hexdigest()
def write(p,o):p.write_bytes(data(o))
def pin(p):
    s=p.stat();return {'path':str(p),'bytes':s.st_size,'mtimeNs':s.st_mtime_ns,'sha256':sha(p)}
def check_files(rows):
    for r in rows:
        p=Path(r['path']);s=p.stat();assert [s.st_size,s.st_mtime_ns]==[r['bytes'],r['mtimeNs']],str(p)
        if p.suffix.lower()!='.zip':assert sha(p)==r['sha256'],str(p)
def build():
    assert not REC.exists() and not NEW.exists();REC.mkdir(parents=True)
    shutil.copyfile(__file__,REC/'release.py')
    original=load(OUT/'LATEST_SPLIT_BUILD.json');artifacts=[]
    for a in original['artifacts']:
        a=dict(a);p=OUT/NAMES[a['kind']];r=pin(p);assert r['sha256']==a['sha256'];a['archive']=str(p);artifacts.append(a)
    assets=load(REPO/'records/edward-sepia-fix-20261021/FINAL_RESULT.json')
    source=WORK/REL[5:];target=FULL/REL[5:];assert sha(source)==HASH==assets['afterSHA256']
    with Image.open(source) as image:assert image.size==(150,150);image.verify()
    assert sha(target)==OLD
    assert not(target.lstat().st_file_attributes&0x400)
    recovery=Path(assets['backup']);assert sha(recovery)==OLD
    protected=[pin(Path(a['archive'])) for a in artifacts]
    for root in [WORK,FULL]:
        for p in [root/'jack.qsp',root/'config.xml',root/'css/base.css',root/'json/slaves/211.json',*sorted((root/'save').glob('*')),*sorted((root/'content/pic/master').glob('*.png'))]:
            if p.is_file() and p not in [source,target]:protected.append(pin(p))
    old=next(a for a in artifacts if a['kind']=='sank')
    with zipfile.ZipFile(old['archive']) as z:
        assert z.testzip() is None
        members={n:z.read(n) for n in z.namelist()}
    assert len(members)==120 and REL not in members
    old_runtime={n:sha_bytes(b) for n,b in members.items() if n.startswith('game/')};assert len(old_runtime)==118
    manifest=load_zip_json= json.loads(members['BUILD_MANIFEST_SANKIMAGES.json'])
    assert manifest['runtimeCount']==118
    for r in manifest['runtimeFiles']:assert len(members[r['path']])==r['bytes'] and sha_bytes(members[r['path']])==r['sha256']
    for a in artifacts:
        if a['kind']=='sank':continue
        with zipfile.ZipFile(a['archive']) as z:assert REL not in z.namelist()
    write(REC/'PINNED_STATE.json',{'latest':original,'artifacts':artifacts,'protected':protected,'oldPersonal':old,'oldRuntime':old_runtime,'FullBefore':pin(target),'recovery':pin(recovery)})
    staging=target.with_name(target.name+'.edward-release-pending');assert not staging.exists()
    staging.write_bytes(source.read_bytes());assert sha(staging)==HASH and sha(target)==OLD;os.replace(staging,target)
    assert sha(source)==sha(target)==HASH;check_files(protected)
    now=dt.datetime.now(dt.timezone.utc).isoformat()
    members[REL]=source.read_bytes()
    manifest.update(id='JO9_2.4_SAnkImages_20261021_r2',revision='r2-edward-sepia',status='USER_TEST_READY',createdAt=now,sourceArchiveSha256=old['sha256'],upstreamSourceArchiveSha256=manifest['sourceArchiveSha256'],runtimeCount=119,runtimeBytes=26644077,FullSynchronized=True,gameFilesChangedByRepack=False,counts={'image':119,'bg':19,'mob':99,'master':1},changedInThisRevision=[REL],previousRuntimePayloadsPreserved=True)
    manifest['runtimeFiles'].append({'path':REL,'bytes':source.stat().st_size,'sha256':HASH,'kind':'image','source':'workshop_recorded_replacement','imageClass':'changed_bytes_not_in_baseline','changeType':'sepia_filter_fix'})
    assert len(manifest['runtimeFiles'])==119 and sum(r['bytes'] for r in manifest['runtimeFiles'])==manifest['runtimeBytes']
    members['BUILD_MANIFEST_SANKIMAGES.json']=data(manifest)
    readme='''2.4 SAnk 개인 이미지 리소스팩 r2

기존 개인팩 118개와 에드워드 세피아 초상화 수정본 1개, 총 119파일입니다.
구성: 배경 19 / 몹 99 / 주인공 초상화 1. 기존 경로 교체 112개와 B컷 추가 7개입니다.
파일 수는 새로 그린 그림 수나 오늘 작업량을 뜻하지 않습니다.

이번 r2에서는 master_edward_sepia.png에 컬러 원본이 들어 있던 문제를 고쳤습니다.
기존 편집기의 세피아 필터만 적용했으며 얼굴·테두리 위치와 150×150 크기는 유지했습니다.
기존 개인팩이나 통합팩을 적용했더라도 이 수정이 필요하면 r2를 다시 덮어써 주세요.
이번 변경은 이 초상화 1개뿐이며 기존 118개 이미지의 내용은 같습니다.

게임을 종료하고 ZIP의 game 폴더를 실제 게임의 game 폴더와 합쳐 같은 파일을 덮어쓰세요.
이미지 외 QSP·JSON·CSS·세이브·독립 편집도구·설치기는 포함하지 않습니다.
B컷 전환은 2차 누적 본체와 함께 사용합니다. 인디 리소스팩과 파일 경로가 겹치지 않습니다.
처음 적용할 때는 선택한 이미지팩들을 먼저, 본체를 마지막에 적용하세요.

제작/개편: SAnk. 기존 게임·외부 리소스의 원작 크레딧을 유지합니다.
'''
    members['README_SANKIMAGES_KO.txt']=readme.replace('\n','\r\n').encode('utf-8-sig')
    with zipfile.ZipFile(NEW,'x',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for n,b in members.items():z.writestr(n,b)
    with zipfile.ZipFile(NEW) as z:
        assert len(z.namelist())==len({n.casefold() for n in z.namelist()})==121
        assert z.testzip() is None
        for n,b in members.items():assert z.read(n)==b
        for n,h in old_runtime.items():assert sha_bytes(z.read(n))==h
    archive_hash=sha(NEW);(OUT/(NEW.name+'.sha256')).write_text(archive_hash+'  '+NEW.name+'\n',encoding='ascii')
    new={'kind':'sank','archive':str(NEW),'bytes':NEW.stat().st_size,'sha256':archive_hash,'runtimeFiles':119,'totalFiles':121,'counts':{'image':119,'bg':19,'mob':99,'master':1},'CRCAndSHA256':True,'reusedUnchanged':False}
    check_files(protected);assert sha(source)==sha(target)==HASH
    result={'status':'FULL_UPDATED_PACKAGE_READY_REVIEW_PENDING','personalPack':new,'FullUpdated':True,'onlyChangedRuntime':REL,'imageSHA256':HASH,'previous118ImagePayloadsPreserved':True,'coreAndIndieUnchanged':True,'protectedFileCount':len(protected),'QSPUnchanged':True,'recovery':str(recovery),'commit':False,'push':False}
    write(REC/'PACKAGE_RESULT.json',result);print(json.dumps(result))
def finish():
    state=load(REC/'PINNED_STATE.json');package=load(REC/'PACKAGE_RESULT.json');review=load(REC/'independent-review.json')
    assert review['status']=='PASS' and review['imageSHA256']==HASH and review['personalPackSHA256']==package['personalPack']['sha256']
    check_files(state['protected']);assert sha(NEW)==package['personalPack']['sha256']
    assert sha(WORK/REL[5:])==sha(FULL/REL[5:])==HASH
    latest=state['latest'];latest['artifacts']=[package['personalPack'] if a['kind']=='sank' else a for a in state['artifacts']]
    latest['runtimeUnion']=6952;latest['counts']['personalImages']=119
    latest.update(status='USER_TEST_READY',verifiedAt=dt.datetime.now(dt.timezone.utc).isoformat(),personalPackReusedUnchanged=False,personalImageRevision='r2-edward-sepia',onlyChangedRuntime=REL,FullUpdated=True,FullImageSHA256=HASH,gameFilesChanged=True,qspUnchangedInImageRevision=True,existingSaveUIAndFullVisualTestPending=True,commit=False,push=False)
    write(OUT/'LATEST_SPLIT_BUILD.json',latest)
    previous_readme=OUT/'README_KO.txt';shutil.copyfile(previous_readme,REC/'README_BEFORE_KO.txt')
    readme=f'''2.4 알파 2차 누적 패치 - 현재 배포 구성

1. 본체: {NAMES['core']}
   최신 QSP·CSS·수정된 211.json과 도나 구형 JSON 25개 삭제기.
   1차 패치 수정, 절세미인 표시명, 대사 수정기의 최종 문구 13곳을 포함합니다.
2. 인디 리소스팩: {NAMES['indie']}
   PSP_PSP 이미지 6,799개 경로와 연결용 JSON 31개. 기존 팩과 같습니다.
3. 개인 이미지팩 r2: {NEW.name}
   기존 118개 + 에드워드 세피아 수정 1개 = 119파일(배경19/몹99/주인공1, B컷7 포함).
   기존 개인팩 적용자도 세피아 수정을 받으려면 이 r2를 다시 덮어써 주세요.

게임을 종료하고 각 팩의 game 폴더를 기존 game 폴더와 합쳐 같은 파일만 덮어씁니다.
처음 적용할 때는 사용할 이미지팩들을 먼저, 본체를 마지막에 적용하세요.
본체와 인디팩을 이미 최신으로 적용했다면 이번에는 개인 이미지팩 r2만 갱신하면 됩니다.
기존 game 폴더를 통째로 지우지 마세요. 세이브·개인설정·독립 편집도구·설치기는 포함하지 않습니다.

본체의 삭제기 3파일도 게임 실행파일이 있는 최상위 폴더에 복사하고 Remove-Old-Dona-Json.cmd를 실행합니다.
삭제기는 정확히 지정된 옛 도나 JSON 25개만 검사·제거하며, 이미 없으면 건너뜁니다.
수동 제거는 본체의 REMOVE_OLD_DONA_JSON_KO.txt를 따릅니다.
기존 세이브에 인디 인물 2323이 있으면 관련 JSON과 그림을 제거하지 마세요.

이번 갱신: 에드워드 세피아 이미지 1개를 WORK·배포용 Full·개인 이미지팩에 반영했습니다.
본체와 인디 ZIP의 바이트는 변경하지 않았습니다. 기존 ZIP과 이전 안내는 보존했습니다.
'''
    previous_readme.write_text(readme,encoding='utf-8-sig')
    note='''\n\n## 에드워드 세피아 배포 반영 완료 (EDWARD_SEPIA_RELEASE_20261021)

사용자 추가 지시 "반영해"에 따라 앞선 WORK 한정 수정 상태를 배포용 Full과 개인 이미지팩까지 반영 완료로 갱신한다.

- Full의 content/pic/master/master_edward_sepia.png를 WORK와 동일한 세피아 수정본으로 교체. 150×150, SHA256 '''+HASH+'''. 기존 백업으로 원본 복구 가능.
- 개인 이미지팩 r2는 기존118개 이미지 바이트 보존 + 수정본1개 = 총119파일. 배경19/몹99/주인공1, 신규 B컷7개는 기존과 동일. 다른 이미지 확대 반영 없음.
- 새 파일: '''+NEW.as_posix()+'''. 기존 개인팩·본체·인디 ZIP 보존. 사용자 정리 후의 현재 본체/인디 파일명을 확인하고 LATEST/README 경로를 실제 파일명으로 갱신.
- QSP·CSS·JSON·세이브·설정 변경 없음. 이미지팩 전체 CRC/해시·기존118개 보존·WORK/Full/ZIP 수정본 일치·독립 검수 PASS. QSP는 기존 출고 검사와 동일 바이트이며 이번에는 수정하지 않음.
- [배포 결과](../records/edward-sepia-release-20261021/FINAL_RESULT.json). 커밋·푸시 보류 유지.
'''
    for p in [REPO/'docs/SECOND_PATCH_WORK_BUNDLE_20261021.md',REPO/'docs/SESSION_HANDOFF_INDEX.md',REPO/'docs/PACKAGING_POLICY_20261019.md']:
        raw=p.read_bytes();text=raw.decode('utf-8-sig');assert 'EDWARD_SEPIA_RELEASE_20261021' not in text
        p.write_text(text.rstrip()+note,encoding='utf-8-sig' if raw.startswith(b'\xef\xbb\xbf') else 'utf-8')
    result={**package,'status':'WORK_FULL_PERSONAL_PACK_UPDATED','independentReview':'PASS','activeManifestUpdated':True,'currentArtifacts':latest['artifacts'],'verifiedAt':latest['verifiedAt']}
    write(REC/'FINAL_RESULT.json',result);print(json.dumps({'status':result['status'],'personalPack':package['personalPack'],'FullUpdated':True,'QSPUnchanged':True,'coreAndIndieUnchanged':True,'commit':False,'push':False}))

assert sys.argv[1] in ['build','finish'];globals()[sys.argv[1]]()
