from pathlib import Path
import re,json,io,base64,hashlib,shutil
from PIL import Image
W=Path('G:/somi/Jack O Nine Tails v2.4_work');F=Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full');R=Path('G:/somi/JO9sa/records/final-prezip-20261102');A=Path('K:/doing/JO9_trash/final-prezip-20261102/documents')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def put(root,name,text):
 p=root/name
 if p.exists():
  b=A/root.name/name;b.parent.mkdir(parents=True,exist_ok=True)
  if not b.exists():shutil.copy2(p,b)
 p.write_text(text,encoding='utf8')
assets=json.loads(Path('G:/somi/JO9sa/records/release-guide-illustrated-20261101/illustrated-build-report.json').read_text(encoding='utf8'))['files'][0]['images']
image_report=[]
for lang,name in [('ko','JO9_2.4.1_업데이트안내.html'),('en','JO9_2.4.1_Update_Guide_EN.html')]:
 s=(W/name).read_text(encoding='utf8')
 for asset in assets:
  source=W/'game'/asset['source'];im=Image.open(source).convert('RGB');im.thumbnail((640,480) if asset['key']=='city' else (560,560),Image.Resampling.LANCZOS);buf=io.BytesIO();im.save(buf,'WEBP',quality=78,method=6);data='data:image/webp;base64,'+base64.b64encode(buf.getvalue()).decode()
  key=asset['key'];pattern=r'(<figure class="hero-art">.*?<img[^>]+src=")[^"]+' if key=='city' else r'(<figure data-image-key="'+re.escape(key)+r'">.*?<img[^>]+src=")[^"]+'
  s,n=re.subn(pattern,lambda m:m[1]+data,s,count=1,flags=re.S);assert n==1,key
  image_report.append({'locale':lang,'key':key,'source':asset['source'],'sha256':sha(source),'thumbnailBytes':len(buf.getvalue())})
 if 'id="final-241"' not in s:
  if lang=='ko':block='<section id="final-241"><div class="wrap"><div class="section-head"><h2>2.4.1 최종 반영</h2></div><ul><li>쉬움·보통 난이도에서는 공개 경매의 지급 상한을 없앴습니다. 하드코어에서는 초과분 공제 사유를 결과 화면에서 안내합니다.</li><li>콜로세움 상금의 등급별 증액과 결과·상금 안내 통합을 챔피언 결과에도 적용하고, 후속 장면 연출을 보완했습니다.</li><li>튜토리얼을 최신 공통 UI로 정리하고, 포털 가디언·바티칸 팔라딘의 소개와 최신 그림을 반영했습니다.</li></ul></div></section>'
  else:block='<section id="final-241"><div class="wrap"><div class="section-head"><h2>Final 2.4.1 additions</h2></div><ul><li>Public auction payouts are uncapped on Easy and Normal. Hardcore explains deductions on the result screen.</li><li>Colosseum prize scaling and the combined result/reward display now also cover champion outcomes, with updated follow-up scenes.</li><li>The tutorial uses the current shared UI. Portal Guardian and Vatican Paladin introductions and artwork have been updated.</li></ul></div></section>'
  s=s.replace('<section id="fixes">',block+'<section id="fixes">',1)
 assert len(re.findall('<img ',s))>=10 and not re.search(r'<(?:script|img)[^>]+(?:src)=[\"\']https?://',s)
 for root in (W,F):put(root,name,s)
readme='''Jack O Nine Tails 2.4.1 한국어판 — 두 번째 통합 Full

실행: 이 폴더의 Jack-o-nine-tails.exe를 실행하세요.
Windows용입니다. game·LICENSES 등 폴더 구조를 그대로 유지하세요.
별도 설치나 모드툴 서버가 필요하지 않습니다. 게임 실행.cmd는 필요할 때 사용할 수 있는 보조 실행 파일입니다.

원본·개인·인디·추가 이미지팩과 최신 QSP, 대사, 인물 JSON, UI·효과·글꼴을 통합했습니다.
구 이미지팩이나 옛 QSP 패치를 다시 덮어쓰지 마세요.
업데이트 내용은 동봉한 한국어·영어 HTML에서 오프라인으로 볼 수 있습니다.

기존 SAV는 별도로 보관하고 game/save에 복사해서 사용하세요. 새 슬롯에 저장하는 것을 권장합니다.
TC_01~TC_10은 점검용이며 새 게임 시작용이 아닙니다. 사용법은 PLAYTEST_KO.md에 있습니다.

출처
2.4 한국어 모딩·이미지 작업 SAnk
기존 한국어판 한글을사랑합시다·사서고생분들·도나패치 개발진
올걸팩 smsfbatalovehandle
PSP_PSP : 인디패치 원작자
zonezizone : 잭오나 플레이 실황
콤콤삼촌 : 허셀2이미지 제공
원작·엔진·외부 패치의 크레딧과 LICENSES 고지를 유지합니다.
'''
for root in (W,F):put(root,'README_KO.txt',readme)
tc='''# 최종 육안 확인

루트의 **Jack-o-nine-tails.exe**로 실행하세요. CMD 실행은 필요하지 않습니다.
이전 TC_01~07 동선은 아래 기존 안내를 참고하세요.

1. TC_08_AUCTION_DIFFICULTY.sav: 게임 난이도를 보통/하드코어로 바꿔 경매 지급과 하드코어 공제 안내를 비교합니다.
2. TC_09_PORTAL_GUARDIAN_EVENT.sav: 포털 지대→도입 3쪽→가디언과 싸운다. 오른쪽 설정과 전투·패배 그림을 확인합니다.
3. TC_10_VATICAN_PALADIN_EVENT.sav: 포털 지대→도입 3쪽→성기사와 싸운다. 소개·전투·패배 그림과 오른쪽 설정을 확인합니다.
4. 새 게임 튜토리얼의 프레임·긴 선택 목록, 기존 저장에서 목욕·요리를 한 뒤 이전 전투 그림이 남지 않는지 확인합니다.

실제 저장파일 GUI 불러오기·모든 이벤트 완주·그림의 육안 품질은 자동 검사 통과와 구분합니다.

---
'''
old=(F/'PLAYTEST_KO.md').read_text(encoding='utf8');put(F,'PLAYTEST_KO.md',tc+old.replace('게임 실행.cmd','Jack-o-nine-tails.exe'))
(R/'document-update.json').write_text(json.dumps({'images':image_report,'standaloneGuides':2,'publicTestSaves':10,'normalExeRecommended':True},ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'guides':2,'embeddedImagesPerGuide':len(assets),'publicTestSaves':10,'READMEUpdated':True}))
