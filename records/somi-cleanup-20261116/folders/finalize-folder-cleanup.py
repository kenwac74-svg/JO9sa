"""Record completed cleanup, reusing copy/readback SHA journals."""
import json
import os
import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
RECORDS = Path('G:/somi/JO9sa/records/somi-cleanup-20261116')

def load(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))

def write(path, obj):
    Path(path).write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def main():
    empty = load(HERE / 'empty-deletion.json')
    release = load(HERE / 'retired-deletion.json')
    old = load(HERE / 'remaining-deletion.json')
    assert release['status'] == old['status'] == 'complete'
    removed = empty['removed'] + release['removedDirectories'] + old['removedDirectories']
    assert len(removed) == len(set(removed)) == 134
    assert all(not os.path.lexists(path) for path in removed)
    assert all(not os.path.lexists(Path('G:/somi') / row['relative']) for row in old['removedJunctions'])
    assert Path('G:/somi/Jack O Nine Tails v2.4_work/game/content').is_dir()
    batches = []
    for result in [release, old]:
        batch = Path(result['archive'])
        plan = load(batch / 'move-plan.json')
        rows = {row['relative']: row for row in plan['files']}
        events = [json.loads(line) for line in (batch / 'journal.jsonl').read_text(encoding='utf-8').splitlines()]
        verified = {row['relative']: row['sha256'] for row in events if row['event'] == 'verified'}
        moved = {row['relative']: row['sha256'] for row in events if row['event'] == 'moved'}
        assert verified == moved and set(moved) == set(rows)
        for rel, row in rows.items():
            assert not (Path('G:/somi') / rel).exists()
            assert (batch / 'files' / rel).stat().st_size == row['bytes']
            if 'sha256' in row:
                assert moved[rel] == row['sha256']
        batches.append({'root': str(batch), 'files': len(rows), 'bytes': sum(r['bytes'] for r in rows.values()), 'plan': str(batch / 'move-plan.json'), 'journal': str(batch / 'journal.jsonl')})
    preserved = load(HERE / 'catalog-preservation.json')
    assert len(preserved['files']) == 82 and all(Path(p).is_file() for p in preserved['files'])
    protected = ['Jack O Nine Tails v2.4_work/game/jack.qsp', 'Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp', 'JO9_2.4.2_Release_20261115/JO9_2.4.2_Kor_Full_20261115.zip', 'JO9_2.4.2_Patch2_20261116_Cumulative', 'JO9_work_backups/private-sex-menu-20261111-ab34a1446634', 'Codex_Archive_Stage_20261020']
    assert all((Path('G:/somi') / p).exists() for p in protected)
    index = load(RECORDS / 'archive-index.json')
    for batch in batches:
        assert batch['root'] not in {row['root'] for row in index['archives']}, 'Already finalized'
        index['archives'].append(batch)
    index['files'] = sum(row['files'] for row in index['archives'])
    index['logicalBytes'] = sum(row['bytes'] for row in index['archives'])
    index['spaceRecoveredBytes'] = shutil.disk_usage('G:/').free - 118139269120
    index['folderCleanup'] = {'removedDirectories': 134, 'removedJunctions': 2, 'additionalArchivedFiles': 4187, 'additionalArchivedBytes': 524209027, 'preservedGuideFiles': 82, 'preservedGuideBytes': 2954931, 'report': 'folders/REPORT_KO.md'}
    write(RECORDS / 'archive-index.json', index)
    report = '''# 불필요한 폴더 정리 — 2026-11-16

사용자 지시에 따라 빈 백업 폴더 32개, 옛 배포 폴더 7묶음, 구백업·이전 보관소 5묶음을 정리했다. 하위 폴더 포함 **134개 디렉터리**와 **진단용 정션 2개**를 제거했다. 정션의 실제 WORK content 대상은 보존했다.

잔존 파일은 삭제하기 전에 K:/doing/JO9_trash에 원래 상대경로 그대로 보관하고 복사본 SHA256을 읽어 대조했다. 이번 추가 이동은 **4,187파일·524,209,027바이트**다. 이미 검증한 데이터의 전체 재해시는 반복하지 않고 검증/이동 원장, 파일 크기, 원본 부재를 대조했다.

| 구분 | 보관 위치 |
|---|---|
| 옛 배포 폴더의 잔존 104파일 | `%s` |
| 구백업·이전 보관소의 4,083파일 | `%s` |

옛 배포 안내와 공지 이미지 **82파일·2,954,931바이트**는 JO9sa/records/retired-release-guides-20261116에도 보존했다. 기존에 기타 산출물에 등록되어 있던 HTML 13개의 내용이 계속 목록에 남는 것을 확인했다. 기존 Patch1 HTML의 RELEASE_NOTES_KO.html 링크는 정리 전부터 대상이 없었다.

기존 보관소의 복원 스크립트·원장은 원문을 보존했다. 내부 G 절대경로와 옛 G:/somi/JO9 경로가 남아 있으므로, 실행하려면 원래 위치에 보관소를 돌려놓거나 경로 매핑을 검토해야 한다. K 보관소 README에 안내했다.

현재 WORK와 Kor_Full 게임·최신 Full ZIP·누적 Patch2·종류별 최신 백업·도구가 실제 사용하는 scene-image-conditions 백업·Stage 연결 74개는 유지했다. 게임 데이터 수정, 빌드, 커밋·푸시는 하지 않았다.

삭제는 확인된 빈 디렉터리의 비재귀 rmdir로만 수행했다. 원본 이미지·세이브 복사본·고유 복구자료는 K에 보존되어 있다. 세부 경로는 remaining-move-plan.json, retired-folders.json, 각 K 배치의 move-plan.json과 journal.jsonl에서 확인할 수 있다.
''' % (release['archive'], old['archive'])
    (HERE / 'REPORT_KO.md').write_text(report, encoding='utf-8')
    verification = {'status': 'PASS', 'removedDirectories': len(removed), 'removedJunctions': 2, 'archivedFiles': sum(b['files'] for b in batches), 'archivedBytes': sum(b['bytes'] for b in batches), 'catalogHtmlPreserved': 13, 'guideFilesPreserved': 82, 'protectedPathsPresent': protected, 'method': 'reuse per-file SHA256 readback journals; current source absence and archive sizes checked'}
    write(HERE / 'verification.json', verification)
    destination = RECORDS / 'folders'
    destination.mkdir(exist_ok=True)
    for filename in ['REPORT_KO.md','verification.json','empty-deletion.json','retired-deletion.json','remaining-deletion.json','remaining-move-plan.json','retired-folders.json','catalog-preservation.json','archive-dependency-review.json','retire-release-folders.py','retire-old-backup-folders.py','finalize-folder-cleanup.py']:
        shutil.copy2(HERE / filename, destination / filename)
    main_report = RECORDS / 'REPORT_KO.md'
    content = main_report.read_text(encoding='utf-8')
    content = content.replace('45,457파일·51,608,194,750바이트', '%s파일·%s바이트' % (format(index['files'], ','), format(index['logicalBytes'], ',')), 1)
    content = content.replace('51,663,605,760바이트', format(index['spaceRecoveredBytes'], ',') + '바이트', 1)
    prior_row = '| 3차 | 96 | 447,455,493 | `K:\\doing\\JO9_trash\\2026-11-16_112042_somi_cleanup` |'
    assert prior_row in content
    content = content.replace(prior_row, prior_row + '\n| 옛 배포 폴더 | 104 | 14,478,971 | `%s` |\n| 구백업·이전 보관소 | 4,083 | 509,730,056 | `%s` |' % (release['archive'], old['archive']))
    content = content.replace('Stage 21.357GiB의 현재 연결 74개와 기존 복원용 보관소 2개도 그대로다.', 'Stage 21.357GiB의 현재 연결 74개는 유지했다. 기존 복원용 보관소 2개는 후속 폴더 정리에서 K에 전량 검증 보관했다.')
    content += '\n## 후속 폴더 정리\n\n빈 폴더·옛 배포·구백업 및 이전 보관소를 하위 포함 134개 디렉터리와 진단용 정션 2개까지 정리했다. 추가 4,187파일·524,209,027바이트를 K에 검증 보관했으며, 기타 산출물용 안내·이미지 82개는 저장소에 유지했다. 전체 이동 합계는 **%s파일·%s바이트**다. [폴더 정리 상세](folders/REPORT_KO.md)와 archive-index.json을 본다.\n' % (format(index['files'], ','), format(index['logicalBytes'], ','))
    main_report.write_text(content, encoding='utf-8')
    handoff = Path('G:/somi/JO9sa/docs/SESSION_HANDOFF_INDEX.md')
    text = handoff.read_text(encoding='utf-8-sig')
    marker = 'SOMI_FOLDER_CLEANUP_20261116'
    assert marker not in text
    handoff.write_text(text + '\n<!-- %s -->\n- 2026-11-16: 불필요한 폴더 134개·진단 정션 2개 정리. 잔존 자료는 K에 검증 보관, 기타 산출물 안내 유지. [상세 기록](../records/somi-cleanup-20261116/folders/REPORT_KO.md).\n' % marker, encoding='utf-8')
    print(json.dumps(verification | {'totalArchivedBytes': index['logicalBytes'], 'totalSpaceRecoveredBytes': index['spaceRecoveredBytes']}, ensure_ascii=False))

if __name__ == '__main__':
    main()
