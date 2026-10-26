"""Record completed release gates, preserve inputs, then remove only task scratch."""
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import shutil
import stat

REPO=Path('G:/somi/JO9sa')
RECORD=REPO/'records/second-patch-zip-20261021'
SCRATCH=Path('G:/Codex/tmp/second-patch-zip-20261021')


def load(p):
    return json.loads(p.read_text(encoding='utf-8-sig'))


def digest(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(2**20),b''):h.update(b)
    return h.hexdigest()


def save(p,value):
    with p.open('x',encoding='utf-8',newline='\n') as f:
        json.dump(value,f,ensure_ascii=False,indent=2);f.write('\n')


def append_once(p,marker,text):
    old=p.read_text(encoding='utf-8-sig')
    assert marker not in old,'Already recorded '+str(p)
    bom=p.read_bytes().startswith(b'\xef\xbb\xbf')
    p.write_text(old.rstrip()+'\n\n'+text.strip()+'\n',encoding='utf-8-sig' if bom else 'utf-8',newline='')


build=load(RECORD/'BUILD_RESULT.json')
qa=load(RECORD/'release-validation.json')
review=load(RECORD/'independent-package-review.json')
assert qa['verdict']=='PASS'
assert review['status']=='PASS' and all(review['checks'].values())
checks={x['name']:x for x in qa['checks']}
assert checks['distribution-byte-match']['status']=='PASS'
assert checks['installed-client-smoke']['detail']['passed']==9
assert checks['patch-replay-and-idempotence']['detail']['byteExact']
assert checks['patch-replay-and-idempotence']['detail']['idempotent']
archive=Path(build['archive'])
assert archive.stat().st_size==build['bytes']
assert archive.with_name(archive.name+'.sha256').read_text().split()[0]==build['sha256']
for p,h in build['protectedHashes'].items():assert digest(Path(p))==h,'Protected input changed: '+p
result={**{k:v for k,v in build.items() if k!='protectedHashes'},
        'status':'USER_TEST_READY','verifiedAt':dt.datetime.now(dt.timezone.utc).isoformat(),
        'releaseVerdict':'PASS','installedClientPaths':9,'independentPackageChecks':20,
        'baselineOverlayRegistryPass':True,'saveUIPlayTestPending':True,
        'FullUpdated':False,'WorkRuntimeModified':False,'commit':False,'push':False,
        'limits':['Existing-save selection UI, full visual layout and every gameplay branch remain user tests.',
                  'Old Dona JSON25 files require exact manual removal; ZIP overlay alone cannot delete them.',
                  'Already incorrectly acquired characters are not automatically replaced.']}
save(RECORD/'FINAL_RESULT.json',result)
marker='SECOND_PATCH_TEST_ZIP_20261021'
bundle=f'''## 2차 누적 테스트 ZIP 제작 ({marker})

사용자 최신 지시: 배포 폴더에 직접 반영하지 않고 ZIP으로 만들어 사용자가 적용·확인한다.

- 테스트 후보: `{archive.as_posix()}` (4,186,287,284 bytes, 약4.19GB).
- SHA256: `{build['sha256']}`.
- 1차/r2/r3 수정 포함 누적본. 기존2.4 한국어판 위에 이 ZIP 하나를 적용한다.
- 런타임6,951파일: 이미지6,917경로 + JSON32 + QSP/CSS각1. 안내/명세4파일을 포함해ZIP총6,955항목.
- 이미지 기준은 실제 최초2.4배포본이며 동일경로/동일바이트는 제외. 개인118/인디6,799 출처와 기존 그림 재사용275경로를 구분했다.
- JSON32개는 인디 의존31개와211수리1개. `REMOVE_OLD_DONA_JSON_KO.txt`의 정확한 구 도나25파일은 수동 제거해야 한다. 정상8877~8901과 원작퀘스트JSON 보존. 설치기·자동삭제스크립트 없음.
- 최신WorkQSP404b57…1365/CSS4b34d5…0276. 모든ZIP항목 재추출·CRC/SHA 및 원본해시 일치. 기준배포JSON에 덮어쓰기+정확25삭제를 모사한 결과가Work전체JSON과 일치했다.
- 새 공식출고검사: 구조/줄경계·패치정확재생/멱등성·인물등록·ZIP재추출QSP mirror·실제엔진9경로 PASS. 독립패키지검수20항목PASS.
- 실제세이브선택UI/전체화면/모든게임분기는 사용자가 플레이 확인한다. 이미 잘못 받은 개체 자동교체 없음.
- Full/Work게임·세이브·기존ZIP·커밋/푸시 불변. 생성된진단/추출사본은 검사후정리하며 핵심명세/보고/재현도구만 보관.

[최종결과](../records/second-patch-zip-20261021/FINAL_RESULT.json), [출고검사](../records/second-patch-zip-20261021/release-validation.json), [독립검수](../records/second-patch-zip-20261021/independent-package-review.json).
'''
append_once(REPO/'docs/SECOND_PATCH_WORK_BUNDLE_20261021.md',marker,bundle)
append_once(REPO/'docs/SESSION_HANDOFF_INDEX.md',marker,f'''## 2026-10-21 2차 누적 테스트 ZIP ({marker})

사용자 직접 적용용 `{archive.as_posix()}`, 약4.19GB. 런타임6951파일(이미지6917/JSON32/QSP·CSS2)과 안내4. 구도나25파일 정확수동제거 필요. 새실제엔진9경로/구조·재생·멱등성/ZIPmirror·전체CRC·해시/독립20검수PASS. Full·Work·세이브·기존ZIP·커밋푸시불변. [최종결과](../records/second-patch-zip-20261021/FINAL_RESULT.json), [작업묶음](SECOND_PATCH_WORK_BUNDLE_20261021.md). 실제세이브UI/전체플레이는사용자확인대기.
''')
append_once(REPO/'docs/PACKAGING_POLICY_20261019.md',marker,f'''## 2026-10-21 2차 누적 사용자 테스트 후보 ({marker})

`{archive.as_posix()}` / 4,186,287,284 bytes / SHA256 `{build['sha256']}`.
설치기없는수동덮어쓰기방식. 1차/r2/r3누적수정과미배포이미지/JSON포함. 세이브·개인설정·도구미포함. 구도나25파일은정확목록대로수동제거해야함. 사용자가배포폴더에직접적용해확인할테스트후보이며공개배포완료가아님. Full동기화/커밋/푸시없음. [검증결과](../records/second-patch-zip-20261021/FINAL_RESULT.json).
''')
report='''2.4 알파 2차 누적 테스트 ZIP 제작 완료

사용자 지시대로 배포 폴더에는 적용하지 않고 새 ZIP을 만들었다.
기본2.4 위에 적용하는 누적본으로 1차/r2/r3 별도 설치는 필요하지 않다.
game 폴더 병합·덮어쓰기 후 정확한 구 도나25파일을 수동 제거해야 한다.
삭제 목록과 유지 파일을 한국어로 동봉했고 설치기/자동삭제/백업 스크립트는 없다.

크기: 4,186,287,284 bytes(약4.19GB). 이미지6917개 경로와 JSON32, 최신QSP/CSS.
기배포 동일 이미지는 제외하고 개인작업118/인디통합6799를 구분했다.
전체6955 ZIP항목 재추출CRC·SHA, 현재Work해시, JSON설치모사 일치.
공식 구조/줄경계/재생/멱등성/인물등록/추출QSPmirror/실제엔진9경로 PASS.
독립ZIP검수20항목 PASS. 과거 기능별PASS를 이번에 전부 다시 실행했다고 주장하지 않는다.

실제기존세이브선택UI/모든화면/모든분기/밸런스는 사용자의플레이확인이남는다.
이미잘못받은인물은자동교체하지않는다. Work/Full/세이브/이전ZIP/커밋푸시는변경없다.
FINAL_RESULT.json과출고검사/독립검수기록을참고한다.
'''
(RECORD/'REPORT_KO.txt').write_text(report,encoding='utf-8-sig')
# Only regenerable task copies are removed, after persisted evidence and gate PASS.
assert SCRATCH.as_posix()=='G:/Codex/tmp/second-patch-zip-20261021'
assert SCRATCH.resolve(strict=True)==SCRATCH.absolute()
assert SCRATCH.parent.resolve(strict=True)==Path('G:/Codex/tmp').resolve(strict=True)
allowed={'qa-inputs','verification','overlay-runtime','release-qa'}
assert {p.name for p in SCRATCH.iterdir()} <= allowed
files=0;byte_count=0
for root,dirs,names in os.walk(SCRATCH,followlinks=False):
    for name in dirs+names:
        p=Path(root)/name;s=p.lstat()
        assert not stat.S_ISLNK(s.st_mode) and not(getattr(s,'st_file_attributes',0)&0x400),'Reparse cleanup path: '+str(p)
        assert p.resolve(strict=True).is_relative_to(SCRATCH.resolve(strict=True))
        if stat.S_ISREG(s.st_mode):files+=1;byte_count+=s.st_size
shutil.rmtree(SCRATCH)
assert not SCRATCH.exists()
save(RECORD/'cleanup.json',{'removed':str(SCRATCH),'files':files,'bytes':byte_count,
                          'scopeVerified':True,'reparsePoints':0,'regenerableCopiesOnly':True,
                          'archiveAndEvidencePreserved':True})
print(json.dumps({'status':'USER_TEST_READY','archive':str(archive),'bytes':build['bytes'],
                  'nativeProbes':9,'temporaryBytesFreed':byte_count,'FullUpdated':False},ensure_ascii=False))
