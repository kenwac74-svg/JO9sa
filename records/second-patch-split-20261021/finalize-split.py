"""Finalize reviewed split artifacts; never install or run the cleanup on a game."""
from pathlib import Path
import datetime as dt
import hashlib
import json
import os
import shutil
import stat

REPO=Path('G:/somi/JO9sa')
RECORD=REPO/'records/second-patch-split-20261021'
SCRATCH=Path('G:/Codex/tmp/second-patch-split-20261021')


def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))


def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()


def append(p,marker,body):
    raw=p.read_bytes();txt=raw.decode('utf-8-sig')
    assert marker not in txt
    p.write_text(txt.rstrip()+'\n\n'+body.strip()+'\n',encoding='utf-8-sig' if raw.startswith(b'\xef\xbb\xbf') else 'utf-8')


build=load(RECORD/'SPLIT_BUILD_RESULT.json')
review=load(RECORD/'independent-split-review.json')
tests=load(RECORD/'utility-test-result.json')
utility_review=load(RECORD/'utility-review.json')
assert build['status']=='PACKAGING_PASS_FINAL_REVIEW_PENDING'
assert review['status']=='PASS' and tests['status']=='PASS' and tests['failed']==0 and tests['total']>=16
assert utility_review['status']=='PASS'
for name,r in utility_review['sourceFiles'].items():
    assert sha(RECORD/'utility'/name)==r['sha256']
for a in build['artifacts']:
    p=Path(a['archive'])
    assert p.stat().st_size==a['bytes']
    assert p.with_name(p.name+'.sha256').read_text().split()[0]==a['sha256']
assert build['runtimeUnion']==6951 and build['runtimeMatchesPreviousVerifiedBuild'] and build['disjointImagePacks']
qsp=Path('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp')
assert sha(qsp)=='404b57f83893e6fc06ff69260b654de770de09a75c3709570c0eaa2d23411365'
result={**build,'status':'USER_TEST_READY','verifiedAt':dt.datetime.now(dt.timezone.utc).isoformat(),
        'utilityRegressionTests':tests['total'],'utilityTestsPassed':tests['passed'],
        'utilityOnlyInvokedOnSyntheticFixtures':True,'userMustRunCleanup':True,
        'saveUIAndFullPlayStillPending':True,'previousCombinedZIPPreserved':True}
(RECORD/'FINAL_RESULT.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=[]
for a in build['artifacts']:
    lines.append('- '+a['kind']+': `'+Path(a['archive']).as_posix()+'` / '+str(a['bytes'])+' bytes / SHA256 `'+a['sha256']+'`')
marker='SECOND_PATCH_SPLIT_AND_DONA_CLEANER_20261021'
body='''## 2차 테스트 빌드 분리·도나 JSON 삭제기 ('''+marker+''')

사용자 최신 지시: 본체(QSP/비이미지/도나JSON삭제기), 인디이미지팩, 개인제작/교체이미지팩의 세 ZIP으로 분리한다. 기존 설치기없는ZIP기본값은 유지하며, 이번 정확25파일 정리 유틸만 명시적으로 추가 승인했다. 자동설치·자동백업·게임시작시자동삭제를 추가한 것이 아니다.

'''+ '\n'.join(lines)+'''

- 본체: QSP1/CSS1/게임JSON32. 이미지0. 1차/r2/r3수정 포함.
- 인디팩: PSP_PSP6799경로. 개인팩: SAnk118파일(bg19/mob99,B컷7포함). 두이미지팩비중복·합6917,기존통합ZIP런타임6951파일과정확동일.
- 최초적용은인디이미지팩과본체를함께적용한다. CORE의2323등인물/외형JSON은인디팩이미지에의존한다. 기존통합ZIP이미지가적용돼있으면본체만다시받을수있다. 개인이미지팩은별도적용가능.
- 삭제기3파일은본체에포함. 실행파일옆최상위에복사하고CMD를직접실행하면정확한구도나25파일만검사·삭제한다. 목록SHA고정,대상/정상고번호SHA대조,전체사전검사,루트/상위/대상재분석점거부,비재귀Literal삭제,미리보기/재실행지원. 수정/누락이있으면중단. 원작같은번호JSON/정상8877~8901/세이브/QSP는삭제하지않는다.
- 삭제기는격리시험폴더에서만실행했다. 실제Work/Full에는실행하지않았다. 정상제거/재실행/부분부재/WhatIf·DryRun/변조거부/정상파일누락/잘못된폴더/정션/명세변조등'''+str(tests['total'])+'''회귀PASS.
- 분리ZIP모든항목CRC/SHA확인및독립검토PASS. 게임QSP는앞선공식실제엔진9경로/재생/멱등성PASS본과동일하며새게임로직수정없음. 실제엔진9검사를이번포장만으로새로실행했다고주장하지않는다.
- Full동기화/Work런타임수정/세이브수정/커밋푸시없음. 예전4.19GB통합테스트ZIP은과거검증산출물로보존하며새다운로드안내는세분리팩을사용한다.

[최종결과](../records/second-patch-split-20261021/FINAL_RESULT.json), [삭제기회귀](../records/second-patch-split-20261021/utility-test-result.json), [독립검토](../records/second-patch-split-20261021/independent-split-review.json).
'''
append(REPO/'docs/SECOND_PATCH_WORK_BUNDLE_20261021.md',marker,body)
append(REPO/'docs/PACKAGING_POLICY_20261019.md',marker,body)
append(REPO/'docs/SESSION_HANDOFF_INDEX.md',marker,'''## 2026-10-21 2차 빌드 분리 ('''+marker+''')

사용자지시로본체(QSP/CSS/JSON32+도나25파일정리유틸)/인디6799이미지/개인118이미지의세ZIP을생성·전항목CRC/SHA·독립검토했다. CORE의인디JSON때문에최초에는인디팩동반필수,기적용이미지재다운불필요. 새삭제기는명시적승인예외이며수동실행시만작동,격리폴더'''+str(tests['total'])+'''회귀PASS. 게임파일은기존통합검증본과동일,Work/Full/세이브/커밋푸시불변. [최종결과](../records/second-patch-split-20261021/FINAL_RESULT.json), [작업묶음](SECOND_PATCH_WORK_BUNDLE_20261021.md).
''')
report='2차 빌드 분리 완료\n\n'+'\n'.join(lines)+'''\n
본체는 비이미지34런타임과 정리유틸3파일, 설치/팩안내/변경내역/수동제거 대안 명세를 포함한다.
인디팩은 CORE JSON과 함께 필요하며 개인 이미지팩은 따로 적용할 수 있다.
기존 통합빌드와 런타임 파일 내용은 같고 세이브·개인설정·별도 편집도구는 없다.
도나JSON 정리기는 사용자가 직접 실행해야 하며 Work/Full에 실행하지 않았다.
과거 통합ZIP의 실제 엔진9경로 PASS와 바이트 동일하고 삭제기 및 분리ZIP을 별도 검증했다.
실제 GUI 세이브 로드와 전체 플레이/화면 확인은 사용자 시험 범위로 남긴다.
'''
(RECORD/'REPORT_KO.txt').write_text(report,encoding='utf-8-sig')
if SCRATCH.exists():
    assert SCRATCH.as_posix()=='G:/Codex/tmp/second-patch-split-20261021'
    assert SCRATCH.resolve(strict=True)==SCRATCH.absolute()
    assert SCRATCH.parent.resolve(strict=True)==Path('G:/Codex/tmp').resolve(strict=True)
    count=0;size=0
    for root,dirs,files in os.walk(SCRATCH,followlinks=False):
        for n in dirs+files:
            p=Path(root)/n;s=p.lstat()
            assert not stat.S_ISLNK(s.st_mode) and not(getattr(s,'st_file_attributes',0)&0x400),str(p)
            assert p.resolve(strict=True).is_relative_to(SCRATCH.resolve(strict=True))
            if stat.S_ISREG(s.st_mode):count+=1;size+=s.st_size
    shutil.rmtree(SCRATCH)
    (RECORD/'cleanup.json').write_text(json.dumps({'taskTempRemoved':str(SCRATCH),'files':count,'bytes':size,
        'reparsePoints':0,'scopeVerified':True,'finalZIPsAndReproScriptsPreserved':True},indent=2)+'\n',encoding='utf-8')
probe=RECORD/'write-probe.txt'
if probe.exists():
    assert probe.stat().st_size==5;probe.unlink()
print(json.dumps({'status':'USER_TEST_READY','artifacts':build['artifacts'],'utilityTests':tests['total'],'FullUpdated':False}))
