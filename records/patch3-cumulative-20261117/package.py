import hashlib, html, json, shutil, zipfile
from collections import Counter
from pathlib import Path, PurePosixPath
from PIL import Image

R = Path('G:/somi/JO9sa')
W = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
D = Path(__file__).resolve().parent
T = Path('G:/Codex/tmp/patch3-cumulative-20261117')
OUT = Path('G:/somi/JO9_2.4.2_Patch3_20261117_Cumulative')
RECORD = R/'records/patch3-cumulative-20261117'
NAME = 'JO9_2.4.2_Patch3_20261117_Cumulative.zip'

def load(p): return json.loads(p.read_text('utf-8-sig'))
def sha(b): return hashlib.sha256(b).hexdigest()
def digest(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
    return h.hexdigest()
def safe(n):
    p=PurePosixPath(n)
    return bool(n) and not p.is_absolute() and '..' not in p.parts and ':' not in n and '\\' not in n
def md_html(s):
    lines=s.splitlines(); out=[]; mode=None
    def close():
        nonlocal mode
        if mode: out.append('</'+mode+'>'); mode=None
    def inline(v):
        v=html.escape(v)
        parts=v.split('**')
        v=''.join(('<strong>' if i%2 else '')+part+('</strong>' if i%2 else '') for i,part in enumerate(parts))
        return v.replace('`game/game`','<code>game/game</code>')
    for line in lines:
        if not line: close(); continue
        if line.startswith('# '): close(); out.append('<h1>'+inline(line[2:])+'</h1>')
        elif line.startswith('## '): close(); out.append('<h2>'+inline(line[3:])+'</h2>')
        elif line.startswith('- '):
            if mode!='ul': close(); out.append('<ul>'); mode='ul'
            out.append('<li>'+inline(line[2:])+'</li>')
        elif len(line)>2 and line[0].isdigit() and line[1:3]=='. ':
            if mode!='ol': close(); out.append('<ol>'); mode='ol'
            out.append('<li>'+inline(line[3:])+'</li>')
        else: close(); out.append('<p>'+inline(line)+'</p>')
    close()
    return '\n'.join(out)

inv=load(D/'inventory.json')
old=Path(inv['previousPatch']); assert digest(old)==inv['previousPatchSha256']
runtime={r['path']:r for r in inv['runtimeFiles']}
assert len(runtime)==len(inv['runtimeFiles'])
assert not OUT.exists(), 'Never overwrite a prior release folder'
assert not RECORD.exists(), 'Preserve prior packaging records'
assert digest(W/'jack.qsp')==inv['workQspSha256']
assert digest(R/'assets/runtime/2.4.1/jack.qsp')==inv['workQspSha256']
bases=[{r['path']:r for r in load(Path(p))['files']} for p in inv['baseManifests']]
full15=load(R/'records/hotfix-cumulative-20261115/full-package-manifest.json')
bases.append({r['path']:r for r in full15['files']})
for p in inv['mandatoryAliases']: assert all(p in b for b in bases), p

image_checked=[]; json_checked=0
for p,r in runtime.items():
    assert safe(p) and p.startswith('game/'),p
    src=W/p[5:]
    assert src.is_file() and not src.is_symlink() and not src.is_junction(),p
    assert src.stat().st_size==r['bytes'] and digest(src)==r['sha256'],p
    assert src.suffix.lower() not in {'.sav','.wav','.mp3','.ogg','.flac','.exe','.cmd','.ps1'},p
    assert not {'modtools','save','modworkpic','__jo9_imagebackups'} & {x.lower() for x in PurePosixPath(p).parts},p
    if src.suffix.lower()=='.json': load(src); json_checked+=1
for r in inv['changedSincePatch2']+inv['addedSincePatch2']:
    if r['path'].lower().endswith('.png'):
        with Image.open(W/r['path'][5:]) as im:
            size=im.size; im.verify()
        image_checked.append({'path':r['path'],'size':size})

notes=(D/'PATCH_NOTES_KO.md').read_text('utf-8')
page='''<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>JO9 2.4.2 긴급 3차 누적 패치</title>
<style>body{max-width:920px;margin:36px auto;padding:0 24px 50px;background:#151b24;color:#e6eaf0;font:17px/1.8 system-ui,sans-serif}h1,h2{color:#e5c18c;line-height:1.4}h1{font-size:1.8rem}h2{margin-top:2rem;font-size:1.3rem;border-bottom:1px solid #465263;padding-bottom:.4em}li{margin:.6em 0}strong{color:#a6e2d1}a{color:#9bd5ff}code{background:#263140;padding:2px 5px;border-radius:4px}.box{padding:16px 22px;border:1px solid #68768b;border-radius:10px}footer{margin-top:2rem;color:#adb8c7;font-size:.9rem}@media(max-width:600px){body{margin-top:20px;padding:0 18px 30px;font-size:16px}}</style></head><body>
'''+md_html(notes)+'''<footer><a href="RELEASE_NOTES_KO.html">2.4.2 풀버전 변경 안내</a></footer></body></html>'''
readme='''JO9 2.4.2 긴급 3차 누적 패치 (2026-11-17)

1차(매력 수정 개정 2 포함)·2차와 이후 승인된 수정을 모두 포함합니다.
이 패치 하나만 설치하면 됩니다. 1·2차를 먼저 설치할 필요가 없습니다.
2.4.2 최초 풀버전·r2·2026-11-15 풀버전에 적용합니다.
2.4.1 본편에 이 패치만 직접 적용하지 마세요.

1. 게임을 완전히 종료합니다. QSP 재로드만 하지 말고 프로세스를 종료하세요.
2. ZIP 안의 game 폴더를 실행 파일이 있는 설치 폴더에 합쳐 덮어씁니다.
   game 안에 game을 한 겹 더 만들지 마세요.
3. 게임을 다시 실행하고 기존 세이브를 불러옵니다.

저장 파일·기존 폴더·사용자 지정 이미지팩을 삭제하지 마세요.
별도 세이브 호환기는 필요 없습니다.
음원 파일·모드 제작 도구·개인 세이브는 들어 있지 않습니다.

이번 추가: 프리실라 후속 이벤트·새 재능 복사 마법, 대사·연출 복원,
개인실 규칙·목줄 판정, 의뢰 반복·무작위 등장·보상 생성·불러오기 보완,
최신 캐릭터 이미지·복장과 하단 테두리 수정.

자세한 유저용 안내: PATCH_NOTES_KO.html
게시글용 텍스트: PATCH_NOTES_KO.md
2.4.2 본편 전체 안내: RELEASE_NOTES_KO.html
'''
docs={'README_KO.txt':readme.replace('\n','\r\n').encode('utf-8-sig'),'PATCH_NOTES_KO.html':page.encode('utf-8'),'PATCH_NOTES_KO.md':notes.encode('utf-8')}
assert T.resolve().as_posix()=='G:/Codex/tmp/patch3-cumulative-20261117'
T.mkdir(parents=True,exist_ok=True)
assert not T.is_symlink() and not T.is_junction()
staged=T/(NAME+'.partial'); assert not staged.exists()
rows=[]; old_runtime=set(); old_docs={}
with zipfile.ZipFile(old) as source:
    prev=json.loads(source.read('PATCH_MANIFEST_SHA256.json'))
    prevrows={r['path']:r for r in prev['files']}
    assert prev['distributionQspSha256']=='816e86252952f0828b30490dc68c4aa53899d4a08cf0743913ebd00c4299bf6c'
    for info in source.infolist():
        n=info.filename; assert safe(n) and not info.is_dir(),n
        if n=='PATCH_MANIFEST_SHA256.json': continue
        raw=source.read(info); assert sha(raw)==prevrows[n]['sha256'],n
        if n.startswith('game/'): old_runtime.add(n)
        elif n not in docs: old_docs[n]=raw
    assert len(old_runtime)==763 and old_runtime<=set(runtime)
    with zipfile.ZipFile(staged,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as dest:
        for n,raw in sorted((old_docs|docs).items()):
            assert safe(n) and n not in runtime
            rows.append({'path':n,'bytes':len(raw),'sha256':sha(raw)})
            dest.writestr(n,raw)
        for n,r in sorted(runtime.items()):
            raw=(W/n[5:]).read_bytes()
            assert len(raw)==r['bytes'] and sha(raw)==r['sha256'],n
            rows.append(dict(r)); dest.writestr(n,raw)
        manifest={'version':'2.4.2','kind':'Patch3 cumulative including Patch1 revision2 and Patch2','date':'2026-11-17','baseVersions':['2.4.2 Full initial','2.4.2 Full r2','2.4.2 Full 2026-11-15'],'previousPatchSha256':inv['previousPatchSha256'],'firstPatchSha256':prev['firstPatchSha256'],'workQspSha256':inv['workQspSha256'],'distributionQspSha256':inv['workQspSha256'],'workBytesPreserved':True,'restored22TextIncluded':True,'latestManualDialogueAndImagesPreserved':True,'files':rows,'manifestExcludesItself':True,'compatibilityAliasesPreservedInSupportedBases':inv['mandatoryAliases'],'previousRequiredGamePaths':763,'previousRequiredGamePathsPreserved':True,'gameValidationReused':True,'fullGameTestsRepeated':False,'excluded':['audio assets','modding tools','personal saves','backups'],'validationRecords':['reward22-restored-20261116','private-room-rule-fix-20261116','amarida-completion-fix-20261116','generator-bounds-20261116','fog-ui-restore-20261116','duplicato-essentia-20261116','unique-random-audit-20261117','collar-equipped-20261117','ui-spell-fixes-20261117','priscilla-completion-20261117','appearance-sharing-20261117/MATERIALIZE.json','duplicato-manual-20261117','duplicato-native-cost300-20261117','duplicato-link-transport-20261117/verification.json']}
        mb=(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode('utf-8')
        dest.writestr('PATCH_MANIFEST_SHA256.json',mb)

expected={r['path']:r for r in rows}
expected['PATCH_MANIFEST_SHA256.json']={'path':'PATCH_MANIFEST_SHA256.json','bytes':len(mb),'sha256':sha(mb)}
seen=set()
with zipfile.ZipFile(staged) as z:
    for info in z.infolist():
        n=info.filename
        assert safe(n) and n.casefold() not in seen,n
        seen.add(n.casefold()); r=expected.pop(n); raw=z.read(info)
        assert len(raw)==r['bytes'] and sha(raw)==r['sha256'],n
    assert not expected
assert digest(W/'jack.qsp')==inv['workQspSha256']
assert digest(R/'assets/runtime/2.4.1/jack.qsp')==inv['workQspSha256']
assert digest(old)==inv['previousPatchSha256']
for n,r in runtime.items(): assert digest(W/n[5:])==r['sha256'],n
assert not OUT.exists()
OUT.mkdir()
archive=OUT/NAME
staged.rename(archive)
result={'path':str(archive),'bytes':archive.stat().st_size,'sha256':digest(archive),'entries':len(rows)+1,'runtimeFiles':len(runtime),'runtimeTypes':dict(Counter(PurePosixPath(n).suffix for n in runtime)),'priorPatchRuntimeFiles':763,'priorPatchPathsPreserved':True,'addedSincePatch2':len(inv['addedSincePatch2']),'replacedSincePatch2':len(inv['changedSincePatch2']),'metadataPathsChecked':inv['metadataPathsChecked'],'inventoryFilesHashed':inv['filesHashed'],'allEntriesCRCAndSHA256':True,'safePaths':True,'caseInsensitiveDuplicatePaths':0,'jsonFilesParsed':json_checked,'newOrChangedPNGsVerified':len(image_checked),'workQspSha256':inv['workQspSha256'],'distributionMatchesWork':True,'previousZipUnchanged':True,'workUnchanged':True,'trackedSourceUnchanged':True,'FullNotWritten':True,'gameTestsRepeatedForPackaging':False,'uploaded':False,'committed':False}
report=f'''# 2.4.2 3차 누적 패치 포장 기록

사용자 지시: “3차 패치로 묶어 릴리즈 노트도”.
배포물: {archive}
크기: {result['bytes']} bytes
SHA-256: {result['sha256']}
게임 파일 {len(runtime)}개, 전체 {result['entries']}항목.
기존 2차 필수 게임 파일 763개(1차742경로 포함)를 모두 유지했다.
2차 이후 추가46경로와 최신 변경4경로를 포함했다. game/jack.qsp는 현재 WORK와 바이트 동일하다.

## 포함 범위와 원고 보존

프리실라 후속 이벤트·선택 보상과 듀플리카토 에센티아(300스파크), 사용자 수동 대사·그림,
승인된2.2 대사·연출·동작 복원, 개인실 규칙·외근 제한, 목줄 실제 착용 판정,
아마리다 완료 보호, 고유 인물 무작위 등장 보호, 내부 보상 생성 상한·로드 결과 화면 복원,
미라·마르셀리나·바실리사 이미지·복장 및 일부 장면·하단 테두리를 포함했다.
2차에서만 적용했던2.2 원문12개 제외·배포 전용치환은 다시 실행하지 않았다.
게임 JSON의 복장 연결은 포함하고 모드툴의 공유·분리 UI는 제외했다.
음원 파일·도구·개인 SAV·백업·설치기는 포함하지 않았다.

## 확인 범위

기존 본편 원장과 메타데이터 {inv['metadataPathsChecked']}경로를 대조하고 차이 후보·기존 필수 파일 {inv['filesHashed']}개만 인벤토리 단계에서 해시했다.
포장 대상 파일의 바이트 및 기존2차 ZIP의 원장과 일치를 확인하고,
완성 ZIP 전체 항목 CRC·SHA256·경로 안전성·중복0·누적 합집합을 검증했다.
JSON {json_checked}개 파싱, 새로 추가되거나 달라진 PNG {len(image_checked)}개 파일 구조를 확인했다.
호환 PNG23경로는 최초/r2/11월15일 본편 원장에 모두 존재한다. 옛경로 삭제나 설치용 정리는 필요 없다.

검증된 기능은 각 기존 기록을 재사용했다. 마지막 QSP 해시는 듀플리카토 실제 Qt 클릭→미리보기→시전 통과 기록과 같다.
포장 때문에 전체 엔진9경로·개인 SAV 플레이·청음·육안 검사를 반복하지 않았다. 이를 전체 게임 PASS로 표현하지 않는다.
WORK·추적 소스·Full·기존 ZIP·사용자 저장을 변경하지 않았다. 업로드·커밋·푸시하지 않았다.

## 유지보수

inventory.py는 기존2차763경로를 출발점으로 최신WORK의 승인 리소스 변경을 수집한다.
package.py는 수집한 SHA와 현재바이트를 대조하고 원장·안내·새ZIP만 작성한다.
기존ZIP이나WORK를 역치환하지 않는다. 다음 패치에는 이 인벤토리의 fullWorkInventory를 메타데이터 기준으로 사용할 수 있다.
재실행은 새차수/새출력경로를 지정하고 이전산출물을 보존해야 한다.
'''
RECORD.mkdir()
for folder in [D,RECORD,OUT]:
    (folder/'package-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n','utf-8')
    (folder/'REPORT_KO.md').write_text(report,'utf-8')
    for n,raw in docs.items(): (folder/n).write_bytes(raw)
for n in ['inventory.py','inventory.json','package.py']: shutil.copy2(D/n,RECORD/n)
(RECORD/'package-manifest.json').write_bytes(mb)
(D/'package-manifest.json').write_bytes(mb)
(RECORD/'image-integrity.json').write_text(json.dumps(image_checked,ensure_ascii=False,indent=2)+'\n','utf-8')
(OUT/(NAME+'.sha256')).write_text(result['sha256']+'  '+NAME+'\n','ascii')
print(json.dumps(result,ensure_ascii=False))
