import hashlib, json, re, shutil, zipfile
from pathlib import Path, PurePosixPath

R = Path('G:/somi/JO9sa')
W = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
T = Path('G:/Codex/tmp/patch2-cumulative-20261116')
D = Path(__file__).resolve().parent
RECORD = R/'records/patch2-cumulative-20261116'
OUT = Path('G:/somi/JO9_2.4.2_Patch2_20261116_Cumulative')
def load(p): return json.loads(p.read_text('utf-8-sig'))
def sha(b): return hashlib.sha256(b).hexdigest()
def digest(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
    return h.hexdigest()
def safe(n):
    p=PurePosixPath(n)
    return not p.is_absolute() and '..' not in p.parts and ':' not in n and '\\' not in n
inv=load(D/'inventory.json'); prep=load(D/'prepared.json')
old=Path(inv['firstPatch']); assert digest(old)==inv['firstPatchSha256']
assert digest(W/'jack.qsp')==prep['workQspSha256']
qsp=(T/'candidate.qsp').read_bytes(); assert sha(qsp)==prep['distributionQspSha256']
bases=[{r['path']:r for r in load(Path(p))['files']} for p in inv['baseManifests']]
runtime={r['path']:dict(r) for r in inv['runtimeFiles']}
for p in inv['mandatoryAliases']:
    assert all(p in b for b in bases),p
for p in prep['fixedAudioDependencies']:
    assert all(p in b for b in bases), 'Audio dependency missing from supported base: '+p
assert not OUT.exists(), 'Preserve existing packages; use a new revision.'
OUT.mkdir()
archive=OUT/'JO9_2.4.2_Patch2_20261116_Cumulative.zip'
readme='''JO9 2.4.2 긴급 2차 누적 패치 (2026-11-16)

2.4.2 풀버전 최초본·r2 또는 2026-11-15 풀버전에 적용합니다.
1차 패치(매력 수정 개정 2 포함)와 이후 수정이 모두 들어 있습니다.
1차 패치를 먼저 설치할 필요가 없으며, 이미 설치했어도 그대로 덮어쓰면 됩니다.
2.4.1 본편에 이 패치만 직접 적용하지 마세요.

1. 게임을 완전히 종료합니다. QSP 재로드만 하지 말고 프로세스를 종료하세요.
2. ZIP 안의 game 폴더를 게임 설치 폴더에 합쳐 같은 파일을 덮어씁니다.
   실행 파일과 나란히 있던 game 폴더입니다. game 안에 game을 더 만들지 마세요.
3. 게임을 재실행하고 기존 세이브를 불러옵니다.
기존 폴더·저장 파일·개인 이미지팩을 삭제하지 마세요. 별도 호환기는 필요 없습니다.

주요 추가 수정
- 승리 후 넘어가기에서 발생하던 사운드 관련 크래시와 유사 종료 경로 수정.
- 전투·경주 BGM의 이미지 데이터 충돌 및 일부 효과음 경로 수정.
- 기존 세이브의 잘못된 전투 BGM 경로 보정.
- 목표 안내·스크롤, 결과 선택지·이미지 연결 및 최신 캐릭터 이미지·복장 반영.
- 식사 목록의 중복 누적 정리와 전투 종료·전리품 생성 안전장치 포함.

음원 파일·모드 제작 도구·개인 세이브는 들어 있지 않습니다.
2.2 대사 복원은 포함하지 않습니다.
상세: PATCH_NOTES_KO.html / 2.4.2 전체 안내: RELEASE_NOTES_KO.html
'''
extra='''<h2>긴급 2차 추가 수정</h2><ul>
<li>안개 전투 승리 후 넘어가기를 누를 때 발생하던 사운드 관련 종료 문제를 수정했습니다. 잘못된 음원 경로가 남은 기존 세이브도 보정합니다.</li>
<li>전투·경주 배경음이 이미지 데이터와 충돌해 재생되지 않던 문제와 일부 효과음 경로의 중복 처리를 수정했습니다.</li>
<li>목표 목록과 안내창의 스크롤·표시를 정리하고, 결과 선택지와 장면 이미지 연결 수정 및 최신 수동 편집을 반영했습니다.</li>
<li>불러오기 때 식사 목록이 중복 누적되던 문제를 수정하고 전투 종료와 전리품 생성의 안전장치를 보완했습니다.</li>
<li>아프리카계 인물의 최신 초상·옷차림과 관련 장면 이미지를 함께 반영했습니다.</li>
</ul><p>아래 1차 패치 수정도 모두 포함합니다. 기존에 1차를 적용했더라도 이 누적 패치를 그대로 덮어쓰면 됩니다.</p>'''
rows=[]; unchanged=0; replaced=[]; added=[]
with zipfile.ZipFile(old) as source:
    old_manifest=json.loads(source.read('PATCH_MANIFEST_SHA256.json'))
    expected={r['path']:r for r in old_manifest['files']}
    infos=source.infolist()
    assert len({i.filename.casefold() for i in infos})==len(infos)
    notes=source.read('PATCH_NOTES_KO.html').decode('utf-8-sig')
    notes=notes.replace('JO9 2.4.2 1차 패치 · 개정 2','JO9 2.4.2 긴급 2차 누적 패치')
    notes=notes.replace('2026-11-15 · 기존 2.4.2 풀버전용','2026-11-16 · 기존 2.4.2 풀버전용 · 1차 수정 포함')
    notes=notes.replace('1차 패치의 기존 구성과 아래 매력 수정을 함께 적용합니다.','1차 패치의 모든 수정과 긴급 2차 수정을 함께 적용합니다.')
    notes=notes.replace('<h2>추가 수정 · 미용실과 매력</h2>',extra+'<h2>1차 포함 · 미용실과 매력</h2>',1)
    notes=notes.replace('이번 개정본은 기존 2.4.2에 적용하는 1차 패치 ZIP입니다.','음원 파일과 모드 제작 도구는 포함하지 않습니다. 게임을 완전히 종료한 뒤 적용해 주세요.')
    replacements={'README_KO.txt':readme.encode('utf-8-sig'),'PATCH_NOTES_KO.html':notes.encode('utf-8'),'game/jack.qsp':qsp}
    with zipfile.ZipFile(archive,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as dest:
        seen=set()
        for info in infos:
            n=info.filename
            assert safe(n) and not info.is_dir(),n
            if n=='PATCH_MANIFEST_SHA256.json':continue
            raw=source.read(info)
            assert n in expected and sha(raw)==expected[n]['sha256'],n
            if n in runtime and n!='game/jack.qsp':
                raw=(W/n[5:]).read_bytes()
                assert len(raw)==runtime[n]['bytes'] and sha(raw)==runtime[n]['sha256'],n
            raw=replacements.get(n,raw)
            row={'path':n,'bytes':len(raw),'sha256':sha(raw)}
            if row['sha256']==expected[n]['sha256']:unchanged+=1
            else:replaced.append(n)
            rows.append(row);dest.writestr(n,raw);seen.add(n)
        assert seen==set(expected),'First-patch path omitted'
        for n in sorted(set(runtime)-seen):
            assert safe(n),n
            raw=(W/n[5:]).read_bytes(); assert sha(raw)==runtime[n]['sha256'],n
            rows.append({'path':n,'bytes':len(raw),'sha256':sha(raw)});dest.writestr(n,raw);added.append(n)
        assert set(runtime)=={r['path'] for r in rows if r['path'].startswith('game/')}
        assert not any(r['path'].lower().endswith(('.wav','.mp3','.ogg','.flac','.sav','.exe','.cmd','.ps1')) for r in rows)
        manifest={'version':'2.4.2','kind':'Emergency Patch2 cumulative including Patch1 revision2','date':'2026-11-16','baseVersions':old_manifest['baseVersions'],'firstPatchSha256':inv['firstPatchSha256'],'workQspSha256':prep['workQspSha256'],'distributionQspSha256':prep['distributionQspSha256'],'restored22TextExcluded':12,'latestManualMenuTextPreserved':True,'lineEndingsNormalized':2,'files':rows,'manifestExcludesItself':True,'compatibilityAliasesPreservedInSupportedBases':inv['mandatoryAliases'],'gameValidationReused':True,'fullGameTestsRepeated':False,'audioNativeCasesReused':8}
        mb=(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode('utf-8')
        dest.writestr('PATCH_MANIFEST_SHA256.json',mb)
allrows=rows+[{'path':'PATCH_MANIFEST_SHA256.json','bytes':len(mb),'sha256':sha(mb)}]
expected_final={r['path']:r for r in allrows}; seen=set()
with zipfile.ZipFile(archive) as z:
    for info in z.infolist():
        n=info.filename
        assert safe(n) and n.casefold() not in seen,n
        seen.add(n.casefold());r=expected_final.pop(n);raw=z.read(info)
        assert len(raw)==r['bytes'] and sha(raw)==r['sha256'],n
    assert not expected_final
assert digest(old)==inv['firstPatchSha256']
assert digest(W/'jack.qsp')==prep['workQspSha256']
assert digest(R/'assets/runtime/2.4.1/jack.qsp')==prep['trackedSourceQspSha256']
result={'path':str(archive),'bytes':archive.stat().st_size,'sha256':digest(archive),'entries':len(allrows),'runtimeFiles':len(runtime),'firstPatchRuntimeFiles':742,'firstPatchPathsPreserved':True,'unchangedEntriesFromFirstPatch':unchanged,'replacedPaths':replaced,'addedPaths':added,'allEntryCRCAndSHA256':True,'safePaths':True,'caseInsensitiveDuplicatePaths':0,'oldPatchUnchanged':True,'workUnchanged':True,'sourceSnapshotUnchanged':True,'fullFolderUnchanged':True,'gameTestsRepeated':False,'uploaded':False,'committed':False}
RECORD.mkdir(parents=True,exist_ok=True)
for name,value in [('package-manifest.json',manifest),('package-result.json',result)]:
    text=json.dumps(value,ensure_ascii=False,indent=2)+'\n'
    (D/name).write_text(text,'utf-8');(RECORD/name).write_text(text,'utf-8')
for name in ['inventory.py','inventory.json','prepare.cjs','prepared.json','package.py']:shutil.copy2(D/name,RECORD/name)
for name,raw in [('README_KO.txt',replacements['README_KO.txt']),('PATCH_NOTES_KO.html',replacements['PATCH_NOTES_KO.html'])]:
    (OUT/name).write_bytes(raw);(RECORD/name).write_bytes(raw)
(OUT/'PACKAGE_RESULT.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n','utf-8')
(OUT/(archive.name+'.sha256')).write_text(result['sha256']+'  '+archive.name+'\n','ascii')
report=f'''# 2.4.2 긴급 2차 누적 패치

사용자 승인에 따라 1차 개정 2의 모든 경로를 유지하고 최신 WORK 리소스로 교체·추가했다.
배포물: {archive}
크기: {result['bytes']} bytes / SHA-256 {result['sha256']}
게임 파일 {len(runtime)}개, 전체 항목 {len(allrows)}개. 1차 필수 게임 파일 742개 모두 포함.

수정된 리소스만 해시 대조했다. 기존 원장으로 전체 리소스 메타데이터를 비교하되 불변 파일의 전체 재해시는 하지 않았다.
최신 WORK 수동 선택지 문구를 보존했다. 배포본에서만 기존 승인된 2.2 복원 문구 12개 제외와 lone LF 두 곳의 CRLF 정규화를 적용했다.
배포 QSP: {prep['distributionQspSha256']}
WORK: {prep['workQspSha256']}; 추적 스냅샷: {prep['trackedSourceQspSha256']}. 둘의 차이는 사용자가 마지막에 저장한 메뉴 문구 하나이며 덮어쓰지 않았다.

기존 사운드 엔진 8건·BGM 분리·미용실·조건 선택지 등 관련 검증을 재사용했고 기능 검사를 포장 때문에 반복하지 않았다.
QSP 구조/줄바꿈·왕복/역적용·사운드 패치 보존과 ZIP 전체 항목 CRC/SHA256/경로/중복/1차 합집합을 확인했다.
호환 PNG 23개 및 정적 음원 의존 경로는 양쪽 지원 본편 원장에 존재하여 유지한다. 음원·도구·SAV는 패치에 없다.
최신 수동 이미지 변경분과 준비된 장면 이미지 3개는 보존하여 포함했다. 실제 청음·전체 게임 플레이는 이번 포장 검사에 포함하지 않았다.
WORK·추적 소스·기존 Full·이전 ZIP·개인 저장은 변경하지 않았다. 새 Full 제작·업로드·커밋·푸시 없음.
'''
(D/'REPORT_KO.md').write_text(report,'utf-8');(RECORD/'REPORT_KO.md').write_text(report,'utf-8')
print(json.dumps(result,ensure_ascii=False))
