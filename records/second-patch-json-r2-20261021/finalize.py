"""Finalize the reviewed JSON placement revision and remove disposable QA copies."""
from pathlib import Path
import datetime as dt
import hashlib
import json
import os
import shutil
import stat
import zipfile

REPO=Path('G:/somi/JO9sa')
RECORD=REPO/'records/second-patch-json-r2-20261021'
OUT=Path('G:/somi/JO9_2.4_SecondPatch_20261021_Split')
TEMP=Path('G:/Codex/tmp/second-patch-json-r2-20261021')


def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))


def append(p,marker,body):
    raw=p.read_bytes();old=raw.decode('utf-8-sig');assert marker not in old
    p.write_text(old.rstrip()+'\n\n'+body.strip()+'\n',encoding='utf-8-sig' if raw.startswith(b'\xef\xbb\xbf') else 'utf-8')


b=load(RECORD/'BUILD_RESULT.json');q=load(RECORD/'release-validation.json');review=load(RECORD/'independent-review.json')
assert q['verdict']=='PASS' and review['status']=='PASS'
assert all(review['checks'].values())
checks={x['name']:x for x in q['checks']}
assert checks['installed-client-smoke']['detail']['passed']==9
assert checks['distribution-byte-match']['status']=='PASS'
assert checks['slave-template-registry']['status']=='PASS'
for a in b['artifacts']:
    p=Path(a['archive']);assert p.stat().st_size==a['bytes']
    assert p.with_name(p.name+'.sha256').read_text().split()[0]==a['sha256']
    if a['kind']=='core':
        with zipfile.ZipFile(p) as z:assert hashlib.sha256(z.read('game/jack.qsp')).hexdigest()=='404b57f83893e6fc06ff69260b654de770de09a75c3709570c0eaa2d23411365'
# The active folder README may be updated only when it is the old generated one.
previous=load(REPO/'records/second-patch-split-20261021/FINAL_RESULT.json')
old_core=next(a for a in previous['artifacts'] if a['kind']=='core')
with zipfile.ZipFile(old_core['archive']) as z:old_readme=z.read('README_SPLIT_PACKS_KO.txt')
assert (OUT/'README_KO.txt').read_bytes()==old_readme, 'Preserve unexpected manual README edits'
(OUT/'README_KO.txt').write_bytes((OUT/'README_r2_KO.txt').read_bytes())
result={**b,'status':'USER_TEST_READY','verifiedAt':dt.datetime.now(dt.timezone.utc).isoformat(),
    'coreOnlyReleaseGate':'PASS','coreOnlyEnginePaths':9,'coreOnlyTemplateRegistry':checks['slave-template-registry']['detail'],
    'combinedJSONMatchesWork':True,'previousPackagesPreserved':True,'personalPackReusedUnchanged':True,
    'existingSaveUIAndFullVisualTestPending':True}
(RECORD/'FINAL_RESULT.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(OUT/'LATEST_SPLIT_BUILD.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
marker='INDIE_JSON_MOVED_TO_RESOURCE_PACK_20261021'
artifact_lines='\n'.join('- '+a['kind']+': `'+Path(a['archive']).as_posix()+'` / '+str(a['bytes'])+' bytes / SHA256 `'+a['sha256']+'`' for a in b['artifacts'])
body='''## 인디 JSON 소속 수정·r2 테스트 빌드 ('''+marker+''')

사용자 승인: 인디 외형/등록 JSON31개는 해당 인디 이미지와 같은 리소스팩에 둔다. 이전 본체JSON32개 구성은 이 r2가 대체한다.

'''+artifact_lines+'''

- 본체 런타임은 QSP/CSS/211.json의3파일. 기존 도나25파일 정리유틸3파일도 유지. 이미지와 인디JSON은 없음.
- 인디 리소스팩은 이미지6799경로+연결JSON31개. 개인 이미지팩118파일은 바이트변경 없이 기존 ZIP을 사용.
- 이동31JSON은 인디통합 원명세와 경로/해시까지 일치. 211.json은 기존 승인 문법수리로 본체에 남음. 전체6951런타임 합집합/내용은 이전 검증 통합본과 같음.
- 인디팩 없이 최초 본체만 적용하면 기존2.4 인물등록상한/외형연결을 유지한다. 2323등 새인디등록은 인디팩을 적용할 때만 들어온다. 기존 인디팩/2323개체를 사용중이라면 해당JSON·그림은 유지하며 본체가 삭제/복원하지 않음.
- 실제 최초2.4 JSON에 본체211수리·정확구도나25제거를 모사한 별도구성으로 공식 실제엔진9경로/구조/줄경계/재생/멱등성/인물등록/추출QSPmirror PASS. 인디JSON31을 추가한 전체JSON은 Work와 해시·경로 일치.
- 삭제기는 기존18시험PASS 동결본과 동일하고 새기능변경 없음. 실제세이브선택UI/모든인물·화면·분기는 사용자플레이확인대상.
- 새2ZIP전항목CRC/SHA검사와독립검수PASS. 기존ZIP은보존하고활성README/목록을r2로갱신. 개인팩재압축/복사없음.
- Work/Full/세이브/커밋·푸시변경없음. 생성된격리QA/JSON복사본은증거보관후정리.

[최종결과](../records/second-patch-json-r2-20261021/FINAL_RESULT.json), [본체단독실제출고검사](../records/second-patch-json-r2-20261021/release-validation.json), [독립검수](../records/second-patch-json-r2-20261021/independent-review.json).
'''
append(REPO/'docs/SECOND_PATCH_WORK_BUNDLE_20261021.md',marker,body)
append(REPO/'docs/PACKAGING_POLICY_20261019.md',marker,body)
append(REPO/'docs/SESSION_HANDOFF_INDEX.md',marker,'''## 2026-10-21 인디 JSON 소속 수정 ('''+marker+''')

사용자승인으로인디JSON31을인디리소스팩(6799이미지와동봉)으로이동. 본체QSP/CSS/211.json+기존도나정리기,개인이미지118팩불변. 최신파일명Core_Test_r2/IndieResources_Test_r2,활성README와LATEST_SPLIT_BUILD.json갱신. 최초2.4+본체만적용한구성으로실제엔진9경로/등록/재생/멱등성/mirror PASS,전체팩합집합6951내용불변. 기존인디2323개체리소스는보존. Work/Full/세이브/커밋푸시불변. [결과](../records/second-patch-json-r2-20261021/FINAL_RESULT.json), [작업묶음](SECOND_PATCH_WORK_BUNDLE_20261021.md).
''')
assert TEMP.as_posix()=='G:/Codex/tmp/second-patch-json-r2-20261021'
assert TEMP.resolve(strict=True)==TEMP.absolute()
assert TEMP.parent.resolve(strict=True)==Path('G:/Codex/tmp').resolve(strict=True)
allowed={'qa-inputs','core-runtime','combined-json','release-qa'}
assert {p.name for p in TEMP.iterdir()}<=allowed
count=0;size=0
for root,dirs,files in os.walk(TEMP,followlinks=False):
    for n in dirs+files:
        p=Path(root)/n;s=p.lstat()
        assert not stat.S_ISLNK(s.st_mode) and not(getattr(s,'st_file_attributes',0)&0x400)
        assert p.resolve(strict=True).is_relative_to(TEMP.resolve(strict=True))
        if stat.S_ISREG(s.st_mode):count+=1;size+=s.st_size
shutil.rmtree(TEMP);assert not TEMP.exists()
(RECORD/'cleanup.json').write_text(json.dumps({'removed':str(TEMP),'files':count,'bytes':size,'scopeVerified':True,'reparsePoints':0,'finalPackagesAndEvidenceRetained':True},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':'USER_TEST_READY','coreOnlyGate':'PASS','enginePaths':9,'artifacts':b['artifacts'],'temporaryBytesFreed':size}))
