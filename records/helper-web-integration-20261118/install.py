from pathlib import Path
import ast,gzip,hashlib,json,os
H=Path(__file__).resolve().parent
C=H/'candidate'
R=Path('G:/somi/JO9sa')
ROOT=R/'tools/modding-hub'
REC=R/'records/helper-web-integration-20261118'
sha=lambda b:hashlib.sha256(b).hexdigest()
meta=json.loads((H/'integration-prepared.json').read_text('utf8'))
assert json.loads((H/'native-check.json').read_text('utf8'))['status']=='PASS'
assert not REC.exists(),'Preserve existing record'
changes=[]
for name in meta['changedFiles']:
    assert sha((ROOT/name).read_bytes())==meta['sourceHashes'][name],f'Preserve changed source: {name}'
    changes.append((ROOT/name,(C/name).read_bytes()))
for name in meta['newFiles']:
    assert not (ROOT/name).exists(),f'Preserve existing file: {name}'
    changes.append((ROOT/name,(C/name).read_bytes()))
for name in ('test_helper_dashboard.py','test_helper_dashboard_html.py','test_helper_dashboard_http.py'):
    assert not (ROOT/'tests'/name).exists()
    changes.append((ROOT/'tests'/name,(C/name).read_bytes()))
readme=ROOT/'README_KO.md'
before=readme.read_bytes()
extra='''

## 게임 DB · 웹 대시보드 (Helper)

게임 DB 상단의 **웹 대시보드**에서 리림의 JO9 Helper 공략·세이브 분석 화면을 사용한다. 기존 특성·아이템·마법·MOB DB와 일반/인터뷰 대사 DB는 그대로 유지한다. 세이브 선택·육성 목표·스포일러 표시·컴팩트 보기·퀘스트/캐릭터 상세·가이드는 원본 Helper의 기능을 사용한다. 세이브와 게임에는 쓰지 않는다.

원본 `JO9_Helper.exe`가 게임 상위 폴더 또는 `JO9_Helper_v1.0.0/` 안에 있어야 한다. 다른 위치는 실행 환경 변수 `JO9_HELPER_EXE`로 지정한다. EXE를 복사·변경하거나 Git에 포함하지 않는다. Helper 원본의 공략/계산 데이터는 통합 작업실 자체 DB와 별도이며, 통합이 그 내용을 현재 QSP와 전수 대조했다는 뜻은 아니다.

탭을 처음 열 때만 원본 EXE의 웹 분석 서버를 `--no-overlay --no-tray --no-browser --game-dir <현재 WORK>`로 숨김 실행한다. 전용 동적 포트와 Windows 자식 작업에서 실행하고 소유 프로세스의 포트만 조회하므로 기존 8765 서버나 사용자 실행 창을 재사용/종료하지 않는다. 작업실 종료 시 전용 Helper도 닫힌다. 웹 주소는 작업실의 `/workspace/helper/`로 고정하며 기존 API와 분리한다. 데스크톱 오버레이/Helper 종료 버튼은 웹 통합 화면에서 제외한다. 원본 EXE를 직접 실행하면 원래 기능을 그대로 쓸 수 있다.

세이브는 원본 Helper가 마지막 저장 파일을 분석한다. 게임 메모리를 실시간으로 읽는 기능은 아니다. 첫 분석이 길어져도 같은 화면의 중복 요청은 하나로 합치고, 도중에 세이브 선택을 바꾸면 완료 뒤 최신 선택을 다시 읽는다. 기존 브라우저 설정 키와 제작자 표시는 유지한다.

관련 코드: `helper_dashboard.py`(리소스/분석 서버/읽기 프록시), `helper_dashboard_html.py`(화면·요청 조절), `helper-dashboard.css`(작업실 색상). `server.py`와 실행기의 빌드 목록에 세 파일을 함께 등록한다. 기록: `records/helper-web-integration-20261118/REPORT_KO.md`.
'''
changes.append((readme,before+extra.encode('utf8')))
for file,raw in changes:
    if file.suffix=='.py':ast.parse(raw.decode('utf8'))
REC.mkdir(parents=True)
originals={str(file):(file.read_bytes() if file.exists() else None) for file,_ in changes}
done=[]
try:
    for file,raw in changes:
        old=originals[str(file)]
        if old is not None:(REC/(file.name+'.before.gz')).write_bytes(gzip.compress(old))
        temp=file.with_name(file.name+'.helper-install.tmp')
        with temp.open('xb') as stream:stream.write(raw)
        os.replace(temp,file);done.append((file,raw))
    result={'installed':True,'files':[{'path':str(file),'beforeSha256':sha(originals[str(file)]) if originals[str(file)] is not None else None,'sha256':sha(raw)} for file,raw in changes],'originalExe':'G:/somi/Jack O Nine Tails v2.4_work/JO9_Helper_v1.0.0/JO9_Helper.exe','exeSha256':sha(Path('G:/somi/Jack O Nine Tails v2.4_work/JO9_Helper_v1.0.0/JO9_Helper.exe').read_bytes()),'gameAndSavesWritten':False,'commitPushOrRelease':False}
    (H/'applied.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),'utf8')
    (REC/'applied.json').write_bytes((H/'applied.json').read_bytes())
    for name in ('prepare-integration.py','install.py','integration-prepared.json','native-check.json'):(REC/name).write_bytes((H/name).read_bytes())
    print(json.dumps({'installed':True,'fileCount':len(changes),'exeSha256':result['exeSha256']}))
except BaseException:
    for file,raw in reversed(done):
        if file.exists() and file.read_bytes()==raw:
            old=originals[str(file)]
            if old is None:file.unlink()
            else:file.write_bytes(old)
    raise
