from pathlib import Path
import zipfile, json, hashlib

repo=Path('G:/somi/JO9sa')
source=repo/'tools/game-reference'
dest=Path(__file__).parent/'JO9_특성_아이템_열람표_WORK_20261108.zip'
prefix='JO9_특성_아이템_열람표/'
files=[p for p in source.iterdir() if p.is_file() and p.suffix.lower() in ('.html','.cjs','.json','.md','.ps1')]
entries={prefix+'game-reference/'+p.name:p.read_bytes() for p in files}
entries[prefix+'text-workshop/core.cjs']=(repo/'tools/text-workshop/core.cjs').read_bytes()
entries[prefix+'JO9_특성_아이템_열람표.html']=(source/'jo9-reference.html').read_bytes()
entries[prefix+'먼저읽기.txt']=('''JO9 특성·아이템 열람표 — 현재 WORK 기준 2026-11-08

압축을 풀고 JO9_특성_아이템_열람표.html을 브라우저로 열면 됩니다.
특성 128개 · 아이템 271개(기본196+조리음식75).
게임 설치나 인터넷, Node.js 없이 검색·분류·탭을 사용할 수 있습니다.

데이터 기준 QSP:
60f8bc4064b33bf6fbd8d0722a18fb06bdf8918b8e1ec0097717abb71badfefe

정액 중독·석녀 발현과 치료, 시루 보정, 특별요리 재료의 현재 가격·판매 수량을 갱신했습니다.
특등급 처녀고기는 획득 이벤트 미연결로 표시합니다.
별도의 마법 목록은 포함돼 있지 않습니다.

game-reference 폴더에 데이터 JSON·생성기·템플릿·읽기 전용 서버를 포함했습니다.
재생성에는 Node.js22 이상과 실제 WORK 게임 폴더가 필요합니다. 자세한 명령은 game-reference/README.md에 있습니다.
text-workshop/core.cjs는 생성기에 필요한 QSP 읽기 코드입니다.
게임 QSP·음원·세이브·개인 설정은 들어 있지 않습니다.
''').encode('utf-8-sig')
assert not dest.exists()
with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for name,data in entries.items():z.writestr(name,data)
with zipfile.ZipFile(dest) as z:
 assert z.testzip() is None
 assert set(z.namelist())==set(entries)
 for name,data in entries.items():assert z.read(name)==data
report={'zip':str(dest),'bytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'entries':len(entries),'allEntryHashesVerified':True,'sourceQspSha256':'60f8bc4064b33bf6fbd8d0722a18fb06bdf8918b8e1ec0097717abb71badfefe'}
(Path(__file__).parent/'package-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
