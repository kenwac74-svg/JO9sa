import hashlib,json,shutil
from pathlib import Path
from PIL import Image
repo=Path('G:/somi/JO9sa')
game=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
record=repo/'records/character-1450-to-1447-20261027_024937'
backup=Path('G:/somi/JO9_work_backups/character_1450_to_1447_20261027_024937')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
load=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
original=load(backup/'json/slaves/1450.json')
expected={k:v.replace('1450_','1447_') if isinstance(v,str) else v for k,v in original.items()}
assert load(game/'json/slaves/1447.json')==expected
idx=load(backup/'json/slave_index.json');idx['young_last']=1449
assert load(game/'json/slave_index.json')==idx
assert not (game/'json/slaves/1450.json').exists()
writes=[]
for key in ('fullimage','seed_ava','seed_ava_gray','seed_ava_clear'):
    old=original[key]
    old=('' if old.startswith('content/') else 'content/pic/')+old+'.png'
    new=old.replace('1450_','1447_');p=game/new;tracked=repo/'resources/new'/new
    assert sha(p)==sha(game/old)==sha(tracked)
    with Image.open(p) as im:im.verify()
    writes.append({'path':new,'source':tracked.relative_to(repo).as_posix(),'sha256':sha(p)})
for rel in ('json/slaves/1447.json','json/slave_index.json'):
    assert sha(game/rel)==sha(repo/'assets'/rel)
    writes.append({'path':rel,'source':'assets/'+rel,'sha256':sha(game/rel)})
qsp=sha(game/'jack.qsp')
assert qsp=='eafdc1a2ffcc3f5806735617c2eec88c79449c9aca0ce1dabee6e78d835a2574'
result={'status':'PASS','backup':str(backup),'writes':writes,'retired':['json/slaves/1450.json'],'young_last':1449,'jsonFilesValidated':2,'imageFilesVerified':4,'qspSha256':qsp,'qspChanged':False,'savesChanged':False,'nativeGameplayTested':False,'compatibility':'Old 1450 PNG and old 1447 blond PNG retained; no save migration.'}
(record/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
shutil.copy2(Path(__file__),record/'verify.py')
shutil.copy2(Path(__file__).with_name('rename_1450_to_1447.py'),record/'apply-and-verify.py')
(record/'MANUAL_KO.md').write_text('''# 1450 → 1447

1450의 전신·얼굴 4장과 설정을 1447로 옮겼다. 일반 생성 상한 young_last는 1449로 복원했다. 1450 JSON은 게임 밖에 백업 후 제거했다. 이전 인계서의 1447 새 이미지 준비 대기 상태를 대체한다.

WORK와 추적 소스만 변경했다. 기존 세이브의 저장 경로를 위해 1450 PNG와 구 1447 금발 PNG를 보존했고 캐시는 자동 이관하지 않는다. 새로 생성되는 1447부터 새 정의를 읽는다. 게임 재시작 후 신규 1447의 외형을 확인한다.

변경 JSON 2개의 구문과 기대값, PNG 4장의 유효성·원본 및 추적 소스 해시 일치, 이미지 연결과 QSP 보존을 검사했다. 실제 게임 플레이는 검사하지 않았다. QSP·세이브·Kor_Full은 변경하지 않았다. 복구 백업과 파일 명세는 result.json에 있다.
''',encoding='utf-8')
with (repo/'docs/SESSION_HANDOFF_INDEX.md').open('a',encoding='utf-8') as f:
    f.write('\n\n## 2026-10-27: 1450 외형을 1447로 변경\n\n[적용 결과](../records/'+record.name+'/MANUAL_KO.md). 기존 1447 새 세트 대기를 대체한다. WORK와 추적 소스만 적용, QSP·세이브·Kor_Full 무변경.\n')
print(json.dumps(result,ensure_ascii=False))
