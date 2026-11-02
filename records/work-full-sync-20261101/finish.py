from pathlib import Path
from datetime import datetime, timezone
import json, hashlib, shutil

P=Path(__file__).resolve().parent
D=Path('G:/somi/JO9sa/records/work-full-sync-20261101')
W=Path('G:/somi/Jack O Nine Tails v2.4_work')
F=Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full')
def h(p):
    with p.open('rb') as f: return hashlib.file_digest(f,'sha256').hexdigest()
def write(p,v): p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
raw=json.loads((P/'audit.json').read_text(encoding='utf-8'))
rows=json.loads((P/'runtime-comparison.json').read_text(encoding='utf-8'))
# The first candidate scan included this known WORK-only utility. Verify its
# exact previously approved bytes, then exclude it from deployment comparison.
utility='game/json/slaves/check_json.sh'
utility_hash='7b0f06715b1e03a1eaab7d077f9e8300185a34a90b27a953dd13ac4e511df704'
known=[x for x in rows if x['path']==utility]
if known:
    assert len(known)==1 and known[0]['workSha256']==utility_hash and known[0]['bytes']==73 and known[0]['fullSha256'] is None
    assert h(W/utility)==utility_hash and not (F/utility).exists()
runtime=[x for x in rows if x['path']!=utility]
assert len(runtime)==42917
assert all(x['workSha256']==x['fullSha256'] for x in runtime)
assert not raw['sourceChanged']
assert not [x for x in raw['fullDrift'] if x['path']!=utility]
assert not [x for x in raw['missingInManifest'] if x!=utility]
qsp=[h(x/'game/jack.qsp') for x in [W,F]]
assert qsp[0]==qsp[1]==raw['workQspSha256']==raw['fullQspSha256']
assert h(F/'BUILD_MANIFEST.json')==raw['manifestSha256']
result=dict(status='PASS',checkedUtc=datetime.now(timezone.utc).isoformat(),workQsp=str(W/'game/jack.qsp'),fullQsp=str(F/'game/jack.qsp'),qspSha256=qsp[0],qspEqual=True,sharedRuntimeFilesFreshlyHashed=42917,sharedRuntimeDifferences=0,fullOnlyCompatibilityRetained=9,approvedPublicSavesPreserved=7,fullRuntimeFiles=42926,workOnlyUtility=dict(path=utility,bytes=73,sha256=utility_hash,reason='Previously verified development-only validator; intentionally excluded from Full'),filesCopied=0,runtimeAlreadyCurrent=True,sourceChangedDuringComparison=False,privateSaveFilesRead=False,saveFilesWritten=False,runtimePathsReorganized=False,zipCreated=False,commitCreated=False,pushed=False,manifestSha256=raw['manifestSha256'])
write(P/'verification.json',result)
report=f'''# WORK・Full 최신 변경 일치 확인

2026-11-01 사용자 요청에 따라 두 폴더의 현재 실행 파일·이미지·CSS·JSON·폰트·라이선스를 새 SHA-256으로 대조했다. 공통 런타임 42,917파일의 차이는 0이다. 이미 최신 변경이 양쪽에 반영되어 있어 추가 덮어쓰기 파일은 0개다.

- WORK: `{W/'game/jack.qsp'}`
- Full: `{F/'game/jack.qsp'}`
- 동일 QSP SHA-256: `{qsp[0]}`

Full 전용 호환 리소스 9개와 공개 TC 세이브 7개는 기존 배포 명세의 해시와 일치한다. WORK에 남은 73바이트 개발 검증 도구 `game/json/slaves/check_json.sh`는 기존 최종 위생 검사에서 배포 제외한 파일이므로 복사하지 않았다. 첫 후보 스캔에는 이 파일이 포함돼 차이 1개로 나타났으나, 기존 승인된 정확 해시를 재확인한 뒤 런타임 비교 집계에서 제외했다. 원 후보 보고는 그대로 보존했다.

대사 편집기의 저장 동작은 WORK QSP를 직접 교체하므로 저장 완료된 편집은 현재 비교에 포함된다. 브라우저 안에서 저장하지 않은 입력이나 개인 세이브는 이번 감사 대상이 아니다. 원화·개발 도구·편집 이력·설정·백업을 배포본으로 복사하지 않았다. 기존 배포 명세도 그대로 일치한다.

새 생산 코드 변경이 없어 엔진 검사를 중복 실행하지 않았다. 현재 해시는 직전 출고9경로 및 이미지 수명 회귀를 통과한 QSP와 동일하다. 이번 새 검증은 파일 대조이며 새 GUI 플레이 검사로 표현하지 않는다. ZIP·커밋·푸시·경로 재편·세이브 수정은 하지 않았다.
'''
(P/'REPORT_KO.md').write_text(report,encoding='utf-8')
D.mkdir(parents=True,exist_ok=False)
for n in ['audit.py','finish.py','audit.json','verification.json','REPORT_KO.md']:
    shutil.copy2(P/n,D/n)
write(D/'comparison-evidence.json',dict(path=str(P/'runtime-comparison.json'),sha256=h(P/'runtime-comparison.json'),bytes=(P/'runtime-comparison.json').stat().st_size,note='Fresh per-file hashes retained in workspace; no duplicated diagnostic QSP or personal data.'))
print(json.dumps(result,ensure_ascii=False))
