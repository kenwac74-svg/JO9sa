from pathlib import Path
import json,hashlib
P=Path(__file__).resolve().parent
R=Path('G:/somi/JO9sa/records/build-2.4.1-20261101')
d=json.loads((P/'DELIVERY.json').read_text(encoding='utf-8'))
for q in [Path(d['work'])/'jack.qsp',Path(d['full'])/'game/jack.qsp']:
    with q.open('rb') as f:assert hashlib.file_digest(f,'sha256').hexdigest()==d['qspSha256']
with (Path(d['full'])/'BUILD_MANIFEST.json').open('rb') as f:assert hashlib.file_digest(f,'sha256').hexdigest()==d['manifestSha256']
idx=Path('G:/somi/JO9sa/docs/SESSION_HANDOFF_INDEX.md');raw=idx.read_bytes()
marker='## 2026-11-01 통합 Full 준비와 2.4.1 버전·감사 갱신'
assert marker not in raw.decode('utf-8-sig')
entry='\n\n'+marker+'\n[최신 빌드 기록](../records/build-2.4.1-20261101/REPORT_KO.md): WORK와 이번 배포 준비 Full의 QSP는 994f0606a59c…로 일치한다. 버전 표시 11곳·창 제목을2.4.1로 바꾸고 PSP_PSP(인디패치 원작자), zonezizone(잭오나 플레이 실황), 콤콤삼촌(허셀2이미지 제공)을 감사 목록에 추가했다. 필수 엔진9경로·크레딧 출력10판정과 실제2.4.1 창 제목 확인, 전체 Full 해시 대조PASS. 이전 버전 TC의 정상 업데이트 알림은 유지했고 검사 사본만 현재 빌드 상태로 보정했다. 세이브 구조·게임 수치·리소스 경로는 유지했다.\n[직전 통합·공간 정리 기록](../records/full-prezip-20261101/REPORT_KO.md)은 a11ecde6… 당시의 검사·이동 이력이다. 현재 Full은2.4.1로 갱신됐으며 ZIP은 아직 만들지 않았다. 기존 테스트SAV7개 유지. 새 버전 검사 임시 사본은 정리했고 복구자료는 별도 원장에 보존했다. 커밋·푸시 없음.\n'
idx.write_bytes(raw+entry.replace('\n','\r\n').encode('utf-8'))
(P/'FINAL_CHECK.json').write_text(json.dumps({'workFullMatch':True,'manifestMatches':True,'version':'2.4.1','zipCreated':False,'handoffUpdated':str(idx)},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for name in ['handoff.py','FINAL_CHECK.json']: (R/name).write_bytes((P/name).read_bytes())
print('2.4.1 final input hashes and manifest verified;handoff updated.')
