import csv, hashlib, io, json, re, shutil, zipfile
from pathlib import Path
from PIL import Image

ROOT=Path('G:/somi/JO9sa')
PACK=Path('G:/somi/잭오나v2.4 캐릭터 정리')
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
CAT=Path('G:/somi/IMGMG/catalogs/character-pack-novel-20261027')
OUT=Path('G:/somi/JO9_Character_ImagePack_20261027')
RECORD=ROOT/'records/new-character-image-pack-20261027'
TMP=Path('G:/Codex/tmp/new-character-image-pack-20261027')
ZIP=OUT/'JO9_NewCharacters27_20261027_Manual.zip'
load=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
source_manifest=load(CAT/'manifest.json')
candidates=[r for r in source_manifest if r['id']!=2579]
ids=sorted({r['id'] for r in candidates})
assert len(candidates)==104 and len(ids)==27
young=[i for i in ids if 1000<=i<2000];mature=[i for i in ids if 2000<=i<2500]
assert len(young)==12 and len(mature)==15
mapping=dict(zip(young,range(1451,1463)))|dict(zip(mature,range(2324,2339)))
assert not ZIP.exists(), 'Never overwrite an existing final ZIP'
assert not TMP.exists(), 'Unexpected pre-existing staging directory'
for new in mapping.values():
    assert not list((WORK/'json/slaves').glob(str(new)+'.json'))
    assert not list((WORK/'json/slaves').glob(str(new)+'_*.json'))
    assert not list((WORK/'content/pic/girls').rglob(str(new)+'_*'))
before={'qsp':sha(WORK/'jack.qsp'),'index':sha(WORK/'json/slave_index.json'),
        'workJson':{p.name:sha(p) for p in (WORK/'json/slaves').glob('*.json')},
        'saves':{str(p):sha(p) for p in (WORK/'save').rglob('*') if p.is_file()}}
STAGE=TMP/'stage';STAGE.mkdir(parents=True);OUT.mkdir(parents=True,exist_ok=True);RECORD.mkdir(parents=True,exist_ok=True)
files=[];rows=[];changes=[]
for old,new in mapping.items():
    subset=[r for r in candidates if r['id']==old]
    stems={re.sub(r'_(gray|sepia)$','',Path(r['path']).stem) for r in subset}
    assert len(stems)==1, (old,stems)
    oldstem=stems.pop();newstem=re.sub(r'^'+str(old)+r'_',str(new)+'_',oldstem)
    assert oldstem!=newstem
    src_json=PACK/'json/slaves'/f'{old}.json';original=load(src_json);data=dict(original)
    fields={'fullimage':'girls/full/'+newstem,'seed_ava_clear':'content/pic/girls/face/'+newstem,
            'seed_ava_gray':'content/pic/girls/face/'+newstem+'_gray','seed_ava':'content/pic/girls/face/'+newstem+'_sepia'}
    for key,value in fields.items():data[key]=value
    # Only preserve a role alias when it used this same basic image; no unrelated outfit art is imported.
    for key in ('fullmade','fullsecretary','fullmistress'):
        value=original.get(key,'').replace('\\','/').rstrip('/')
        data[key]='girls/full/'+newstem if value=='girls/full/'+oldstem else ''
    for key,value in list(data.items()):
        if key.startswith('indpack_'):data.pop(key)
        elif key not in fields and key not in ('fullmade','fullsecretary','fullmistress') and isinstance(value,str) and value.replace('\\','/').startswith(('girls/','content/pic/')):
            data[key]=''
    hair=oldstem.split('_')[1]
    data['seed_hair']=hair.capitalize()
    assert data.get('seed_age')==(0 if old in young else 2)
    image_rel=['full/'+oldstem+'.png','face/'+oldstem+'.png','face/'+oldstem+'_gray.png','face/'+oldstem+'_sepia.png']
    selected_paths={r['path']:r for r in subset}
    for rel in image_rel:
        src=PACK/'game/content/pic/girls'/rel
        assert src.is_file(),str(src)
        digest=sha(src)
        if rel in selected_paths:assert digest==selected_paths[rel]['sha256']
        target='game/content/pic/girls/'+rel.replace(oldstem,newstem)
        dest=STAGE/target;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dest)
        with Image.open(dest) as image:dimensions=list(image.size);image.verify()
        assert sha(dest)==digest
        files.append({'path':target,'sha256':digest,'bytes':dest.stat().st_size,'source':str(src),
                      'originalId':old,'newId':new,'kind':'selected' if rel in selected_paths else 'supporting','dimensions':dimensions})
    target=f'game/json/slaves/{new}.json';dest=STAGE/target;dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(json.dumps(data,ensure_ascii=False,indent=4)+'\n',encoding='utf-8')
    assert load(dest)==data
    files.append({'path':target,'sha256':sha(dest),'bytes':dest.stat().st_size,'source':str(src_json),'originalId':old,'newId':new,'kind':'definition'})
    changes.append({'oldId':old,'newId':new,'originalStem':oldstem,'newStem':newstem,
                    'fields':{k:{'source':original.get(k),'pack':data.get(k)} for k in set(original)|set(data) if original.get(k)!=data.get(k) or (k in original)!=(k in data)}})
    rows.append([old,new,'young' if old in young else 'milf',newstem,len(subset),4-len(subset)])
assert len([r for r in files if r['kind']=='selected'])==104
assert len([r for r in files if r['kind']=='supporting'])==4
assert len([r for r in files if r['kind']=='definition'])==27
assert not any(r['originalId']==2579 or r['newId']==1450 for r in files)
for p in (STAGE/'game/json/slaves').glob('*.json'):
    data=load(p)
    for key in ('fullimage','seed_ava_clear','seed_ava_gray','seed_ava','fullmade','fullsecretary','fullmistress'):
        value=data.get(key,'')
        if not value:continue
        rel=value if value.startswith('content/') else 'content/pic/'+value
        assert (STAGE/'game'/(rel+'.png')).is_file(),(p.name,key,value)
assert len({r['path'].lower() for r in files})==len(files)
readme='''JO9 신규 캐릭터 이미지팩 — 수동 통합용 / 2026-10-27

구성: 27개 신규 번호 / PNG108장 / 캐릭터 JSON27개
카탈로그의 신규 내용104장과, 전신·얼굴 기본세트를 완성하는 보충4장입니다.
2579 에게야는 제외했습니다.

새 번호: 1451~1462(12개), 2324~2338(15개)
1450은 과거 사용 이력이 있어 재사용하지 않았습니다.
기존 인물 JSON이나 이미지와 같은 경로를 덮어쓰지 않습니다.
번호 대조표는 ID_MAP.csv, 파일별 SHA-256은 MANIFEST.json에 있습니다.

압축 안 game 폴더는 게임 폴더 구조에 맞춘 수동 통합 자료입니다.
기존 game 폴더를 삭제하지 마세요. 이번 팩에는 QSP·엔진·세이브·설정이 없습니다.
WORK·Kor_Full에 자동 적용하지 않았습니다.

중요: 새 캐릭터의 무작위 등장 연결은 아직 포함하지 않았습니다.
기존 slave_index.json을 덮어쓰거나 young_last를1462로 단순 확장하지 마세요.
1450 JSON이 없는 현재 구성에서는 번호 사이 빈칸을 추첨하는 문제가 생깁니다.
일반 생성에 넣으려면 신규 번호 목록을 별도로 연결하는 QSP 작업이 필요합니다.
이 ZIP은 새 번호와 자원을 먼저 분리한 수동 통합용 이미지·정의 팩입니다.

기본 전신·얼굴만 포함합니다. 실제로 별도 준비되지 않은 역할의상 경로와
다른 인물의 옛 이미지 경로를 새 JSON에 연결하지 않았습니다.
원본 JSON의 수치·연령 정보는 유지하고 머리색과 기본 이미지 경로를 해당 세트에 맞췄습니다.
2071계열은 파란 단발 전신1장,2287계열은 백발 장발 얼굴3장을 보충했습니다.
108장 모두 원본 PNG의 바이트를 유지했으며 새 그림 생성·필터·재압축은 하지 않았습니다.

검사: 새번호/경로충돌,JSON구문,필수이미지참조,PNG유효성,원본해시,ZIP CRC·내용일치.
실제게임등장·플레이·기존세이브호환을 새로 실행 검증한 것은 아닙니다.
제작 후 원본·WORK·기존 세이브는 변경하지 않았습니다.
'''
(STAGE/'README_KO.txt').write_text(readme,encoding='utf-8-sig')
with (STAGE/'ID_MAP.csv').open('w',encoding='utf-8-sig',newline='') as f:
    writer=csv.writer(f);writer.writerow(['original_id','new_id','age_group','new_stem','selected_images','supporting_images']);writer.writerows(rows)
public=[{k:v for k,v in r.items() if k!='source'} for r in files]
(STAGE/'MANIFEST.json').write_text(json.dumps({'schema':1,'purpose':'manual-integration','randomGenerationIntegrated':False,'excludedOriginalIds':[2579],
    'sourceImageCount':104,'supportingImageCount':4,'characterCount':27,'files':public},ensure_ascii=False,indent=2),encoding='utf-8')
with zipfile.ZipFile(ZIP,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in sorted(STAGE.rglob('*')):
        if p.is_file():z.write(p,p.relative_to(STAGE).as_posix())
with zipfile.ZipFile(ZIP) as z:
    assert z.testzip() is None
    for row in files:assert hashlib.sha256(z.read(row['path'])).hexdigest()==row['sha256']
    assert not any(re.search(r'(^|/)(jack\.qsp|slave_index\.json|.*\.sav|.*\.exe|.*\.ps1|.*\.cmd)$',n,re.I) for n in z.namelist())
    assert len(z.namelist())==138
assert before['qsp']==sha(WORK/'jack.qsp') and before['index']==sha(WORK/'json/slave_index.json')
assert before['workJson']=={p.name:sha(p) for p in (WORK/'json/slaves').glob('*.json')}
assert before['saves']=={str(p):sha(p) for p in (WORK/'save').rglob('*') if p.is_file()}
result={'status':'PASS','zip':str(ZIP),'zipBytes':ZIP.stat().st_size,'sha256':sha(ZIP),'characters':27,'pngFiles':108,
    'selectedImages':104,'supportingImages':4,'jsonFiles':27,'zipEntries':138,'mapping':mapping,'excludedIds':[2579,1450],
    'collisionWithWork':False,'randomGenerationIntegrated':False,'qspChanged':False,'workChanged':False,'savesChanged':False,'gameplayTested':False}
(RECORD/'RESULT.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
(RECORD/'provenance.json').write_text(json.dumps({'files':files,'jsonAdjustments':changes},ensure_ascii=False,indent=2),encoding='utf-8')
for name in ('README_KO.txt','ID_MAP.csv','MANIFEST.json'):
    shutil.copy2(STAGE/name,OUT/name)
shutil.copy2(Path(__file__),RECORD/'build.py')
(RECORD/'PLAN_KO.md').write_text('''# 신규 캐릭터 이미지팩 제작·검증 계획

사용자 지시: 카탈로그에서2579를 제외하고 나머지에 새번호를 부여해 별도 이미지팩으로 만든다.

1. 기존·퇴역 번호와 겹치지 않는1451~1462/2324~2338을 할당한다.
2. 선택된104장과 기본세트 보충4장을 새번호로 복사하고27개 JSON을 연결한다.
3. WORK 무변경 상태에서 등록·PNG·참조·해시·ZIP CRC 검사를 수행한다.
4. 생성 범위를 자동 변경하지 않는 수동 통합 ZIP을 전달한다. 실제 일반등장 연결은 별도 범위다.

QSP·엔진·세이브·배포폴더를 수정하지 않으며 커밋·푸시하지 않는다.
''',encoding='utf-8')
print(json.dumps(result,ensure_ascii=True))
