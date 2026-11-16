"""Verify the approved 96-file follow-up and refresh cleanup documentation."""
import hashlib
import json
from pathlib import Path
import shutil

HERE=Path(__file__).resolve().parent
PHASE=HERE/'phase3'
RECORD=Path('G:/somi/JO9sa/records/somi-cleanup-20261116')
load=lambda p:json.loads(Path(p).read_text(encoding='utf-8-sig'))
dump=lambda p,x:Path(p).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
plan,result=load(PHASE/'move-plan.json'),load(PHASE/'result.json')
assert result['status']=='complete' and result['movedFiles']==96 and result['movedBytes']==447455493
assert not result['sourceFilesRemaining'] and not result['concurrentlyChangedProtectedFiles']
archive=Path(result['archive'])
proof={r['relative']:{'verified':set(),'moved':set()} for r in plan['files']}
for line in (archive/'journal.jsonl').read_text(encoding='utf-8').splitlines():
    event=json.loads(line)
    if event['event'] in ('verified','moved'):
        proof[event['relative']][event['event']].add(event['sha256'])
for row in plan['files']:
    relative=row['relative']
    assert not (Path(plan['source'])/relative).exists(), relative
    assert (archive/'files'/relative).stat().st_size==row['bytes'], relative
    assert len(proof[relative]['verified'])==1 and proof[relative]['verified']==proof[relative]['moved'], relative
for row in plan['keep']:
    assert Path(row['path']).is_file(), row['path']
verification={'status':'PASS','files':96,'bytes':447455493,'sha256EvidenceCoverage':96,'sourceFilesRemaining':0,'payloadsRehashed':0,'trackedSourceFiles':0,'archive':str(archive),'approval':'Explicit user reply approved moving the 95 old QSP recovery files and one retired utility.'}
dump(PHASE/'verification.json',verification)

followup=RECORD/'phase3'
followup.mkdir(exist_ok=False)
for name in ('approval.json','move-plan.json','result.json','verification.json'):
    shutil.copyfile(PHASE/name,followup/name)
shutil.copyfile(__file__,followup/'finalize_approved_records.py')
index=load(RECORD/'archive-index.json')
index['files']+=96
index['logicalBytes']+=447455493
index['spaceRecoveredBytes']=result['freeAfter']-118139269120
index['archives'].append({'root':str(archive),'files':96,'bytes':447455493,'plan':str(archive/'move-plan.json'),'journal':str(archive/'journal.jsonl')})
index['approvedRecoveryFiles']={**index.pop('pendingRecords'),'status':'approved-and-moved','approval':'Explicit user approval received 2026-11-16','archive':str(archive)}
index['approvedRecoveryFiles'].pop('reason',None)
dump(RECORD/'archive-index.json',index)

old_report=(RECORD/'REPORT_KO.md').read_text(encoding='utf-8')
previous=RECORD/'REPORT_PHASE1_2_KO.md'
assert not previous.exists()
previous.write_text(old_report,encoding='utf-8')
report=f'''# G:/somi 정리 최종 기록 — 2026-11-16

사용자가 승인한 저장소 과거 복구본 96개까지 이동 완료했다. 전체 이동은 **{index['files']:,}파일·{index['logicalBytes']:,}바이트**이며, G 여유 공간의 최초 기준 대비 증가는 **{index['spaceRecoveredBytes']:,}바이트**다. 여유 공간 차이에는 작업 사이 다른 디스크 사용량의 영향도 포함된다.

| 배치 | 파일 수 | 이동 바이트 | 보관 위치 |
|---|---:|---:|---|
'''
for number,batch in enumerate(index['archives'],1):
    report+=f"| {number}차 | {batch['files']:,} | {batch['bytes']:,} | `{batch['root']}` |\n"
report+='''
각 배치의 `files/` 아래에 원래 `G:/somi/` 뒤 상대경로가 유지된다. 정확한 복구 목록과 SHA256 근거는 해당 `move-plan.json`, `journal.jsonl`에 있으며, 2차에는 `resume-journal.jsonl`도 함께 있다. 복원 시 G의 기존 다른 파일을 덮어쓰지 않는다.

3차는 과거 QSP 복구본 95개와 퇴역 호환기 1개, 총 447,455,493바이트다. 96개 모두 Git 비추적임을 새로 확인했다. 각 복사본의 SHA256을 확인한 뒤 원래 파일을 제거했고, 최종 검사에서는 원본 부재·보관 파일 크기·검증/이동 원장 일치를 확인했다. 이미 검증한 전체 데이터를 다시 해시하지 않았다.

최신 Full, 누적 Patch2, 종류별 최신 백업, 현재 WORK·세이브·Git 추적 소스·보고서·편집기 되돌리기 이력은 유지했다. Stage 21.357GiB의 현재 연결 74개와 기존 복원용 보관소 2개도 그대로다. 과거 패킹 스크립트의 구 Full `BASE` 경로는 보관본을 복원하거나 새 보관 위치로 재지정해야 한다.

최초 전체 이동안은 자동 승인 심사가 저장소 복구자료 손실 위험을 이유로 거부했다. 이후 사용자가 해당 96개를 명시 승인했고, 그 범위의 이동도 완료했다. 이 96개에 대한 승인 대기는 해소됐다.

초기 1·2차의 세부 조사와 당시 승인 대기 상태는 [이전 단계 기록](REPORT_PHASE1_2_KO.md)에 보존했다. 3차 결과는 `phase3/verification.json`, 전체 보관 경로는 `archive-index.json`에 있다. 게임·소스 본문·세이브·배포 ZIP·커밋·푸시 변경은 없다.
'''
(RECORD/'REPORT_KO.md').write_text(report,encoding='utf-8')
(PHASE/'REPORT_KO.md').write_text(report,encoding='utf-8')
(archive/'README_KO.md').write_text(report,encoding='utf-8')
notice='''> 2026-11-16 후속 처리: 사용자 명시 승인으로 저장소 과거 복구본 96개도 추가 이동 완료했다. 승인 대기는 해소됐다. 최신 전체 기록은 G:/somi/JO9sa/records/somi-cleanup-20261116/REPORT_KO.md 및 archive-index.json을 참조한다. 아래는 당시 1·2차 기록이다.

'''
for batch in index['archives'][:-1]:
    readme=Path(batch['root'])/'README_KO.md'
    readme.write_text(notice+readme.read_text(encoding='utf-8'),encoding='utf-8')
session=Path('G:/somi/JO9sa/docs/SESSION_HANDOFF_INDEX.md')
marker='SOMI_CLEANUP_RECORDS_APPROVED_20261116'
if marker not in session.read_text(encoding='utf-8-sig'):
    with session.open('a',encoding='utf-8') as stream:
        stream.write(f'\n\n### 2026-11-16 과거 복구본 후속 승인 완료 ({marker})\n\n사용자가 과거 QSP 복구본95개+퇴역 호환기1개 이동을 명시 승인. 96파일447,455,493바이트를 SHA256 확인 후 K로 이동했고 최신백업/추적소스/보고서 유지. 전체45,457파일51,608,194,750바이트 이동. 이전 records 승인대기는 해소. [현재 최종 기록](../records/somi-cleanup-20261116/REPORT_KO.md).\n')
print(json.dumps({'status':'PASS','approvedFilesMoved':96,'bytes':447455493,'archive':str(archive),'totalFiles':index['files'],'totalLogicalBytes':index['logicalBytes'],'approvalPending':False},ensure_ascii=False))
