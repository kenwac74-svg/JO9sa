import pathlib,json,shutil,hashlib
R=pathlib.Path('G:/somi/JO9sa');D=R/'records/full242-packing-20261113';T=pathlib.Path('G:/Codex/tmp/full242-packing-20261113');S=pathlib.Path('G:/somi/JO9_2.4.2_Full_20261113/JO9_2.4.2_Kor_Full');U=R/'tools/save-compatibility242';U.mkdir(exist_ok=True)
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n','utf-8')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
for name in ['save242.py','test_save242.py','save242-rules.json']:shutil.copy2(name,U/name)
for name in ['full242-package.py','full242-record-final.py','full242-load-probe.cjs']:shutil.copy2(name,D/name)
for name in ['report.json','report.md','client-results.json']:
 p=pathlib.Path('G:/Codex/tmp/full242-release-gate-20261113/run-TCBn7C')/name
 if p.exists():shutil.copy2(p,D/('release-gate-'+name))
before=json.loads((T/'bds_migration_report.json').read_text('utf-8'));repeat=json.loads((T/'frozen-final-report.json').read_text('utf-8'))
assert repeat['change_count']==0 and sha(T/'frozen-final-repeat.sav')==sha(T/'bds_242.sav')
original=pathlib.Path('G:/somi/Jack O Nine Tails v2.4_work/game/save/bds.sav');assert sha(original)==before['source_sha256'],'Original save changed; do not claim unchanged'
write(D/'save-compat-verification.json',{'sourceTests':17,'sourceTestsPass':True,'rawRealSaveRoundtripExact':True,'migrationChanges':before['change_count'],'numericValuesSlotsKeysPreserved':True,'crcPreservedByUtility':True,'customNamesPreserved':True,'originalSaveUnchanged':True,'standaloneExitCode':0,'standaloneRepeatChanges':0,'standaloneRepeatByteIdentical':True,'guiStartupVisible':True,'realGuiLoad':True,'realGuiSaveNewFile':True,'realGuiReload':True,'restoredScreen':'realtor_office','realSampleCount':1,'sampleBytes':original.stat().st_size,'gameStartInstrumentedOnly':True,'otherQspLocationsUnchangedForGuiTest':True,'oldSavesUseExistingDistributionVersionCompatibilitySetting':True,'strictOldCRCCompatibilityClaimed':False,'earlierAutomaticOpenGameProbe':'Failed: callback routed SAV path to game-world loader; excluded from pass count. Actual Game>Load UI tested separately.','allSaveStatesOrAllQuestBranchesTested':False,'personalSaveDistributed':False,'utilitySha256':sha(S/'JO9_Save_242.exe')})
write(D/'independent-review.json',{'scope':'One bounded read-only review of save converter and package exclusion scope; no portrait reinspection.','materialFindings':1,'finding':'CLI report path could overwrite source/output/rules or existing report.','resolution':'Preflight resolved-path collision/exists checks; exclusive report creation on success/error paths.','regressionRed':'5 collision subcase failures reproduced; test report encoding error corrected.','regressionGreen':'17 tests passed after fix; frozen EXE rebuilt and actual file repeat passed.','remainingMaterialFindings':0,'reviewLimit':'Final ZIP verification performed separately.'})
readme='''# JO9 2.4.2 세이브 호환 도구

2.4.1에서 전투를 끝내고 일반 화면에서 저장한 파일을 새 파일로 변환한다. 배포본은 JO9_Save_242.exe이며 Python 설치 없이 실행한다. 세이브 선택 → 검사 → 새 파일로 변환 순서로 사용하고, 출력 파일을 새 게임의 game/save에 두어 불러온다. 원본·기존 출력·기존 보고서는 덮어쓰지 않는다.

입력은 QSPSAVEDGAME 5.7.0 세이브와 save242-rules.json의 확정 경로/인물 규칙이다. 반환은 새 SAV 또는 오류 코드이며, 명령행에서만 선택적으로 JSON 보고서를 쓴다. --input, --output, --rules, --report 인자를 지원한다. --output을 생략하면 검사만 한다. 보고서는 입력·출력·규칙과 다른 새 경로여야 한다.

변환은 허용 목록과 정확히 일치하는 자원 경로, 동일 캐릭터 ID의 옛 기본 이름·기본 초상/전신 주소에 한정한다. 사용자 작명은 유지한다. 숫자 값, 변수 슬롯·배열 인덱스·키, 관계·육성·장비·퀘스트 진행과 CRC를 바꾸지 않는다. 옛 이미지 파일을 삭제·이동하지 않는다. 게임을 실행하거나 QSP를 수정하지 않으며 반복 변환은 무변경이다. 게임이 불러올 때 수행하는 기존 인물 갱신은 QSP의 별도 기능이다.

파일 저장은 같은 폴더에 임시 파일을 쓴 뒤 새 이름으로 확정하며, 실패한 임시 파일만 정리한다. GUI는 별도 작업 스레드로 처리해 멈추지 않으며 처리 중 중복 실행/종료를 막는다. 원본 파일이 처리 중 바뀌면 중단한다. 개인 세이브를 네트워크로 보내지 않는다.

전투 중 저장·다른 버전·손상된 형식은 지원하지 않는다. 구버전 CRC는 그대로 보존하므로 게임에 원래 있는 버전 호환 설정을 사용하며, 엄격한 옛 CRC 검사를 통과하도록 바꾸는 도구가 아니다.

검증: 원본 보존·기본/사용자 이름·ID·허용 경로·숫자/인덱스·반복·오류·전투 거부·보고서 충돌을 포함한17개 테스트, 실제 2.4.1 약50MB 저장의 무손실 왕복과14개 참조 변환, 최종 EXE 반복 변환0개/바이트 일치, 실제 Game>Load → 새 이름 저장 → 재불러오기 화면 복원을 확인했다. GUI 시험은 Start만 바꾼 격리 QSP를 썼고 다른 로케이션은 최종본과 같았다. 모든 세이브·퀘스트 분기·화면을 전수 검증한 결과는 아니다.

유지보수: save242.py가 파일·GUI·CLI를, save242-rules.json이 경로와 인물별 허용 매핑을, test_save242.py가 회귀 검사를 담당한다. 규칙을 갱신하면 EXE에 넣어 재빌드해야 한다. Python3.14/PyInstaller6.21 및 Tcl/Tk9 라이브러리를 사용했다. 제거하면 오프라인 변환 도구만 없어지며 게임 QSP의 갱신 함수나 이미 저장된 게임 상태는 바뀌지 않는다. 변환을 되돌리려면 보존한 원본을 사용한다.
'''
(U/'README_KO.md').write_text(readme,'utf-8')
compat='''2.4.1 저장 파일로 이어하기

1. 이전 게임에서 전투를 끝내고 일반 화면에서 저장합니다.
2. JO9_Save_242.exe에서 그 SAV를 선택해 검사한 뒤 새 이름으로 변환합니다.
3. 새 파일을 2.4.2의 game/save에 두고 게임의 Load 메뉴로 불러옵니다.

원본과 이미 있는 출력은 보존합니다. 사용자 작명·육성·장비·진행을 유지하고 알려진 기본 이름과 자원 경로만 정리합니다. 옛 자원은 이번 배포에 유지했습니다.
이전 세이브는 게임에 원래 있는 버전 호환 설정을 사용합니다. 전투 중 저장·다른 버전은 지원하지 않습니다.
처음 불러온 뒤에는 새 이름으로 한 번 저장해 계속 플레이하십시오.
'''
(S/'SAVE_COMPATIBILITY_KO.txt').write_text(compat,'utf-8-sig')
p=D/'stage-summary.json';data=json.loads(p.read_text('utf-8'));data.update(migrationUtilityPending=False,sourceQspSha256=sha(S/'game/jack.qsp'),playerNotes=43,portraitCards=53,latePortraitCopyOnly=True,officialGate='PASS',realSaveLoadSaveReload=True);write(p,data)
with (D/'progress.md').open('a',encoding='utf-8') as f:f.write('\n- Final QSP62a5f282... includes Shiru purchase portrait; focused enabled/gray/other-menu probePASS and official9-path gatePASS run-TCBn7C.\n- Player notes43 entries,53 portrait cards: explicit Dohna23 backgrounds/stats/traits and Hassa reward. User late6 portraits copied only; no visual/gameplay reinspection.\n- Final standalone tool17 testsPASS; report-path overwrite issue found in one review and fixed. Real converted save GUI load/new-file save/reload reached realtor_office. Version compatibility uses existing distribution option; CRC unchanged by converter.\n- Ready for fresh ZIP64 manifest/CRC/complete extraction hashes. No commit/push/upload, old Full unchanged.\n')
print(json.dumps({'archivedSource':str(U),'tests':17,'guiLoadSaveReload':True,'originalUnchanged':True},ensure_ascii=False))
