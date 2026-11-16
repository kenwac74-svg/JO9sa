import pathlib,json,hashlib,zipfile,shutil,os
from PIL import Image,ImageChops
R=pathlib.Path('G:/somi/JO9sa');D=R/'records/urgent242-duty-frame-20261114';O=pathlib.Path('G:/somi/JO9_2.4.2_Hotfix_20261114');T=pathlib.Path('G:/Codex/tmp/urgent242-duty-frame-20261114');W=pathlib.Path('G:/somi/Jack O Nine Tails v2.4_work/game');Z=O.with_suffix('.zip')
for suffix in ['','_gray','_sepia']:
 n='3040_brown_long_milf'+suffix+'.png';a=Image.open(D/('before-'+n)).convert('RGBA');b=Image.open(O/'game/content/pic/girls/face'/n).convert('RGBA');assert a.size==b.size
 box=(5,5,a.width-5,a.height-5);assert ImageChops.difference(a.crop(box),b.crop(box)).getbbox() is None
assert json.loads((T/'client-results.json').read_text('utf-8-sig'))[0]['pass']
readme='''JO9 2.4.2 긴급패치 — 2026-11-14

게임을 종료한 뒤 이 ZIP의 game 폴더를 2.4.2 풀버전 설치 폴더에 덮어쓰세요.
Jack-o-nine-tails.exe가 있는 폴더가 기준입니다. game 폴더 안에 다시 game을 넣지 마세요.
기존 저장 파일은 그대로 사용할 수 있으며 별도 호환기는 필요하지 않습니다.

수정 내용
- 개인실 업무 목록에서 긴 소모 안내를 빼고 업무명만 표시합니다.
- 마우스를 올리면 하루 칼로리 소모량, 필요 능력과 장비, 수행 조건을 표시합니다.
- 선택할 수 없는 업무도 전체 안내와 현재 불가 사유를 함께 표시합니다.
- 춘향 컬러·흑백·세피아 포트레이트에 기존 게임 테두리를 추가했습니다.

능력·장비 요구와 칼로리/행동력 비용, 전투·보상 수치는 변경하지 않았습니다.
적용 후 개인실에 다시 들어가 업무에 마우스를 올려 보세요.
'''
(O/'긴급패치_안내.txt').write_text(readme,'utf-8-sig')
files=sorted(p for p in O.rglob('*') if p.is_file());assert len(files)==5
if Z.exists():raise RuntimeError('Existing hotfix preserved')
with zipfile.ZipFile(Z,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in files:z.write(p,p.relative_to(O).as_posix())
rows=[]
with zipfile.ZipFile(Z) as z:
 assert z.testzip() is None
 for p in files:
  raw=p.read_bytes();assert z.read(p.relative_to(O).as_posix())==raw
  rows.append({'path':p.relative_to(O).as_posix(),'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw)})
result={'zip':str(Z),'zipBytes':Z.stat().st_size,'zipSha256':hashlib.sha256(Z.read_bytes()).hexdigest(),'files':rows,'nativeAssertions':12,'nativePass':True,'portraitCenterPixelsPreserved':True,'crcAndAllEntryBytes':True,'gameVisualConfirmation':'pending user hover check'}
(D/'package-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),'utf-8')
for f in ['client-results.json','plan.json','test.qsp']:
 if f!='test.qsp':shutil.copy2(T/f,D/f)
(D/'REPORT_KO.md').write_text('# 2.4.2 긴급패치\n\n업무명 4개를 짧게 표시하고 기존 help 툴팁에 소모량·실제 can/daily 조건을 추가했다. 불가 항목의 why는 기존 help 뒤에 덧붙여 조건·비용도 유지한다. can/set/daily/burn과 수치는 변경하지 않았다. label/help의 지정 구간과 불가 안내 결합 문자열만 변경했다.\n\n실제 엔진 12개 반환 검사 PASS. 최초 진단 표식이 검사기 형식에 맞지 않아 거절되었고, 진단 표식만 고친 뒤 통과했다. 게임 자체 오류는 아니었다. 춘향 3종은 기존 시루 동종 초상의 5px 테두리를 기존 합성 도구로 복사했고 중심 픽셀 동일성을 검증했다. 실제 게임 hover 배치는 사용자 확인 대기다.\n\nWORK와 추적 소스 반영. 배포 game/jack.qsp와 초상 3개, 안내 1개만 ZIP에 포함했고 전체 CRC/원본 바이트 대조 PASS. 풀 ZIP·옛 Kor_Full·SAV·공개 공지는 수정하지 않았다. 커밋/푸시/업로드 없음.\n\n호출: jo9_room_duty label/help. 기존 tooltip-data 표시를 재사용한다. 패치를 제거하면 긴 문구와 기존 불가 사유만 보이는 표시로 돌아가며 저장 형식에는 영향이 없다. 기록된 before.qsp.gz는 이번 수정 직전 복구 자료다.\n','utf-8')
shutil.copy2(__file__,D/'pack.py')
# Keep only compact source and minimal recovery, not generated diagnostics.
assert T.resolve()==T and T.is_relative_to(pathlib.Path('G:/Codex/tmp'))
for p in T.rglob('*'):assert not p.is_symlink() and not p.is_junction()
shutil.rmtree(T)
print(json.dumps({'zip':str(Z),'bytes':result['zipBytes'],'files':len(files),'nativePass':True,'crcPass':True},ensure_ascii=False))
