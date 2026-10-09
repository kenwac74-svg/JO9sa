import os, json, time, hashlib, zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
STAMP = time.strftime('%Y%m%d_%H%M%S')
OUT = HERE / 'backups' / ('JO9_HOME_' + STAMP)
OUT.mkdir(parents=True, exist_ok=False)
ACTIVE = Path(r'C:\Users\Ken Choung\Documents\Codex\2026-10-06\task\JO9sa')
GAME = Path(r'C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex\game')
excluded = []
compressed = {'.png','.jpg','.jpeg','.webp','.gif','.mp3','.ogg','.mp4','.zip','.7z','.woff','.woff2'}

def files(root):
    for base, dirs, names in os.walk(root):
        dirs[:] = [d for d in dirs if d.lower() not in {'.git','node_modules','__pycache__','backups' if Path(base) == HERE else '__never__'}]
        for name in names:
            p = Path(base) / name
            r = p.relative_to(root)
            parts = [x.lower() for x in r.parts]
            if name.lower() in {'local.config.json','grok-settings.json','dialogue-ai-settings.json','catalog_workshop_config.js'} or name.lower().startswith('.env'):
                excluded.append(str(p)); continue
            if 'runtime' in parts and 'backups' not in parts:
                excluded.append(str(p)); continue
            if p.is_symlink():
                excluded.append(str(p)); continue
            yield p, r

manifest = {'created': STAMP, 'sources': {'game':str(GAME),'JO9sa':str(ACTIVE),'session_workspace':str(HERE)},'archives':[]}

def archive(name, mappings, extras=()):
    path = OUT / name
    entries=[]
    with zipfile.ZipFile(path,'w',allowZip64=True,compression=zipfile.ZIP_DEFLATED,compresslevel=1) as z:
        for prefix,root in mappings:
            for p,r in files(root):
                arc = prefix + '/' + r.as_posix()
                stat = p.stat()
                z.write(p,arc,compress_type=zipfile.ZIP_STORED if p.suffix.lower() in compressed else zipfile.ZIP_DEFLATED)
                after=p.stat()
                if (stat.st_size,stat.st_mtime_ns)!=(after.st_size,after.st_mtime_ns):
                    raise RuntimeError('Source changed during backup: '+str(p))
                entries.append({'path':arc,'size':stat.st_size,'mtime_ns':stat.st_mtime_ns})
                if len(entries)%5000==0: print(name,len(entries),'files written',flush=True)
        for arc,p in extras:
            if p.is_file():
                z.write(p,arc); entries.append({'path':arc,'size':p.stat().st_size})
        z.writestr('FILE_MANIFEST.json',json.dumps(entries,ensure_ascii=False,indent=2))
    print('Verifying CRC:',name,flush=True)
    with zipfile.ZipFile(path) as z:
        bad=z.testzip()
        if bad: raise RuntimeError('Bad ZIP CRC: '+bad)
        count=len(z.infolist())
    digest=hashlib.sha256()
    with path.open('rb') as f:
        while chunk:=f.read(8*1024*1024): digest.update(chunk)
    manifest['archives'].append({'file':name,'bytes':path.stat().st_size,'entries':count,'sha256':digest.hexdigest(),'crc_verified':True})
    print('Verified:',name,path.stat().st_size,'bytes',flush=True)

readme='''# JO9 집으로 가져갈 작업 백업

이 폴더 전체를 외장 저장장치나 개인 Drive에 옮기세요. 자동 업로드는 하지 않았습니다.

1. JO9_PLAY_GAME.zip을 새 폴더에 풀면 game 폴더가 생깁니다. 현재 jack.qsp, 적용 이미지(content/pic, reserve 포함), 작업 이미지(content/modworkpic), CSS·폰트·엔진·세이브·modtools·대사 수정 이력이 들어 있습니다. 기존 게임에 바로 덮어쓰지 말고 별도 폴더에서 확인하세요.
2. JO9_TOOLS_AND_WORK.zip을 풀면 JO9sa(실제 사용 중인 최신 도구와 카탈로그 상태), session-work(이번 세션 측정·연동 소스), image-reference(첨부 작업 이미지)가 생깁니다.
3. JO9sa/tools/local-workspace/Open-JO9-Tools.cmd를 실행해 새 PC의 플레이 game과 순정 비교 game 폴더를 지정합니다. Node.js가 없으면 실행기 안내를 따릅니다. 도구 실행 주소는 http://127.0.0.1:3813/ 와 http://127.0.0.1:3813/catalog 입니다. 경로를 재지정하려면 Start-JO9-Tools.ps1 -Configure 를 사용합니다.
4. 자동감지 이미지 워크샵은 game/modtools/JO9_Server.ps1 -Port 5269 로 실행하고 http://127.0.0.1:5269/ 를 엽니다. 파일 선택→카탈로그 연동은 3813·5269 포트를 기준으로 구현했습니다. 두 서버가 함께 실행돼야 합니다.
5. API 키는 제외했으므로 새 PC 도구 설정에서 다시 입력해야 합니다. PC별 경로, 서버 토큰/PID/로그, .git, node_modules도 제외했습니다. 소스 백업이므로 새 폴더에 기존 Git 저장소를 연결하는 절차는 별도입니다.
6. 순정 비교 게임은 별도 보관된 기존 원본을 사용합니다. 이 백업에 순정 게임을 중복 포함하거나 수정하지 않았습니다. Mage/Gamma 계정의 온라인 작품, 브라우저의 미저장 결과·세션은 ZIP에 포함되지 않습니다. 필요한 온라인 결과는 해당 서비스에서 저장하세요.

## 이번 세션 변경
- 대사 출력 길이: 실제 게임 CSS·폰트 기준 33개 텍스트 영역 측정. 일반 #text는 7줄, 370~390자 권장 프롬프트로 변경. 사적 공간은 6줄 기준. 모델 지침이며 실제 Qt 게임 렌더링에 대한 절대 길이 보장은 아님. 측정 결과는 session-work/docs/DIALOGUE_TEXT_CAPACITY_20261007.md.
- 이미지 자동감지 워크샵에서 검출 파일 선택 시 카탈로그가 해당 경로로 자동 이동하도록 변경. 실행 중 최신 서버/카탈로그/워크샵 HTML이 포함됨.
- 도구창 목록: 카탈로그, 대사 편집실, 이미지 워크샵, Joy Caption, Google Translate, Mage. 현재 사용 중 Gamma는 https://gamma.app/ 에 로그인해 별도로 이어갑니다.
- Voland 제작 진행: 네 인물 구도는 확보, 배경 군중 제거가 진행 중. Mage 인페인트에 배경 커튼 프롬프트를 입력했으며 이 세션에서 생성 버튼은 누르지 않음. 원본 게임 이미지는 자동 교체하지 않음.

## Mage 배경 편집 프롬프트
Replace only the masked background with a continuous backdrop of deep crimson velvet curtains, rich natural folds, soft dark red lighting, and subtle gothic shadows. Remove all background spectators and replace them entirely with curtains and a clean shadowed stone floor where appropriate. No people, faces, figures, statues, or silhouettes in the background. Preserve the four main foreground adults, their faces, hair, clothing, bodies, poses, and the entire throne exactly as they are. Match the existing painterly fantasy style, perspective, texture, and lighting. Keep the foreground sharp and the background softly shaded. Do not alter any unmasked area.

## 검증
각 ZIP의 모든 항목을 CRC 검사하고 SHA-256을 MANIFEST.json 및 SHA256SUMS.txt에 기록했습니다. 실제 집 PC 실행과 게임 플레이는 검증하지 않았습니다. 세이브를 포함한 개인용 백업이므로 개인 저장소로 옮기세요.
'''
(OUT/'집에서_이어하기.md').write_text(readme,encoding='utf-8-sig')
archive('JO9_TOOLS_AND_WORK.zip',[('JO9sa',ACTIVE),('session-work',HERE)],[( 'image-reference/Voland-latest.png',Path(r'C:\Users\KENCHO~1\AppData\Local\Temp\codex-clipboard-39c0b7ec-25cf-4cbe-bbbd-eb03bc5e8c6f.png')),('image-reference/Voland-previous.png',Path(r'C:\Users\KENCHO~1\AppData\Local\Temp\codex-clipboard-2a03a1c4-de45-4527-9eb7-4e7a25b86faa.png')),('집에서_이어하기.md',OUT/'집에서_이어하기.md')])
archive('JO9_PLAY_GAME.zip',[('game',GAME)])
manifest['excluded_files']=excluded
(OUT/'MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'SHA256SUMS.txt').write_text(''.join(a['sha256']+'  '+a['file']+'\n' for a in manifest['archives']),encoding='ascii')
print('COMPLETE',OUT,flush=True)
