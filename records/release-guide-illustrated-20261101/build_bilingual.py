from pathlib import Path
import json, hashlib, re, sys
sys.stdout.reconfigure(encoding='utf-8')
ROOT=Path(__file__).resolve().parent
ko=json.loads((ROOT/'content.json').read_text(encoding='utf-8'))
en={
 'features241':[
  {'title':'Combat built around the battlefield','body':'Full-body opponent art and a wider battlefield take center stage, with actions, weapon techniques, and the combat log arranged separately. Distinct effects for piercing, slashing, blunt, and mental attacks make each exchange easier to follow.','image':'battle','alt':'New combat illustration of an ogre carrying a huge club in a misty forest','caption':'Fog Border combat illustration · Ogre'},
  {'title':'Decide what follows victory','body':'Regular Colosseum and Catfight Club matches now let you execute or spare a defeated opponent. Follow-up scenes reflect your choice and the match result, while practice matches follow a separate sparring conclusion.','image':'club','alt':'Two fighters clash in the torchlit underground Catfight Club, surrounded by spectators','caption':'Catfight Club · The underground fighting pit'},
  {'title':'Growth and prize money, together','body':'Victory results in the Colosseum and Catfight Club now include the prize announcement on the same screen. Rewards for ordinary Colosseum matches have also increased, making the results of a hard-fought win easier to review.'},
  {'title':'Scenes that fit the character','body':"Isabella's tavern and recruitment scenes now match her current appearance. Egeya's combat art and weapon references have been revised, and match results and sparring dialogue now better fit the player character, slave, or assistant involved."},
  {'title':'Combat art for each setting','body':'Expanded combat and defeat illustrations across the Fog Border, arena, Catfight Club, and key event battles. Group enemies use group defeat scenes, and some monsters now look different at different growth stages. Base-game, Indie Patch, personal, and additional artwork have also been organized into a unified collection.'}
 ],
 'followups241':[
  'Chaotic Essence now prioritizes eligible negative traits. If none are available, it can randomly remove an ambiguous disposition instead. Clearly positive traits and protected entries are retained.',
  "Buyer rumors now also consider whether a character can be traded and what standard buyers offer. When there is no suitable special recommendation, they can direct you to the Guild's purchasing agent."
 ]
}
en.update(json.loads((ROOT/'content.en.groups.json').read_text(encoding='utf-8')))
en.update(json.loads((ROOT/'content.en.fixes.json').read_text(encoding='utf-8')))
# Keep the guide in player-facing language rather than copying code terminology.
en['fixes'][0]['items'][0]="Fixed missing or incorrect full-body opponent artwork in some event battles."
en['fixes'][0]['items'][3]='Improved frame stability during combat effects, along with the alignment, colors, and line spacing of combat messages.'
en['groups240'][1]['items'][-1]="Improved Dull Cow's milk production, growth gains in certain specialist lessons for Genius characters, and some growth and production benefits from rare traits. Also aligned gains and messages across manual activities, automatic activities, and delayed reports."
en['groups240'][0]['items'][0]='On Fog Border patrols, you can send one slave or assistant into battle first. If that companion is defeated, the player character can take over. Each combatant chooses equipment when entering the fight.'
assert set(en)==set(ko)
for key in ['features241','followups241','groups240','fixes','other']:
 assert len(en[key])==len(ko[key]),key
for key in ['groups240','fixes']:
 for a,b in zip(ko[key],en[key]):assert len(a['items'])==len(b['items'])
(ROOT/'content.en.json').write_text(json.dumps(en,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

replacements=[
 ("OUT = ROOT / 'JO9_2.4.1_업데이트안내.html'","OUT = ROOT / 'JO9_2.4.1_Update_Guide_EN.html'"),
 ("(ROOT/'content.json')","(ROOT/'content.en.json')"),
 ("(ROOT/'build-report.json')","(ROOT/'build-report.en.json')"),
 ('<html lang="ko">','<html lang="en">'),
 ('잭 오 나인 테일즈 한국어 모드 2.4.1 업데이트 안내. 2.3 이후 2.4.0 누적 변경과 2.4.1 신규 업데이트·버그 수정을 함께 소개합니다.','Jack-O’-Nine-Tails Korean mod 2.4.1 update guide. Includes cumulative changes since 2.3, the 2.4.0 updates, and new features and fixes in 2.4.1.'),
 ('잭 오 나인 테일즈 2.4.1 | 업데이트 안내','Jack-O’-Nine-Tails 2.4.1 | English Update Guide'),
 ('다시, 영원의 로마로','RETURN TO ETERNAL ROME'),
 ('더 선명해진 전투,<br><em>더 깊어진 육성.</em>','A clearer battlefield.<br><em>More ways to grow.</em>'),
 ('2.4에서 넓어진 인물 육성과 생활 관리에<br>전투 연출, 경기 결과와 새로운 편의를 더했습니다.','Building on the character training and household management of 2.4,<br>2.4.1 adds new combat presentation, match outcomes, and conveniences.'),
 ('처음 받는 분도 한 번에 살펴볼 수 있도록<br>2.3 이후의 2.4.0 누적 변경과 2.4.1 추가분을 함께 담았습니다.','New to this release? This English guide to the Korean mod covers<br>the cumulative changes since 2.3 and the additions in 2.4.1.'),
 ('어두운 석조 도시의 밤거리와 안개, 가로등이 켜진 잭 오 나인 테일즈 배경','A foggy stone-built city at night, lit by street lamps'),
 ('한국어 모드 2.4.1 업데이트 안내','Korean mod 2.4.1 · update guide'),
 ('문서 목차','Document contents'),
 ('이번 버전의 주요 변화와, 2.3에서 이어지는 2.4.0의 전체 누적 변경을 함께 소개합니다.','Explore the highlights of this release and the full cumulative changes introduced in 2.4.0 since version 2.3.'),
 ('2.4.1의 주요 변화','Highlights of 2.4.1'),
 ('기존 기능도 한 번 더 다듬었습니다.','Further refinements to existing features'),
 ('2.4.0에서 넓어진 플레이도 함께','Everything 2.4.0 brought to the game'),
 ('함께 키운 동료를 실전에 내보내고, 성격과 체질에 맞춰 육성하며, 관계에 따라 달라지는 대화를 나눕니다. 특성 확인부터 개인실·보관·거래·위기 대응까지, 2.3 이후의 변화가 아래에 모두 이어집니다.','Send the companions you have trained into battle, adapt training to their personalities and constitutions, and hear dialogue shaped by relationships. The full list below covers changes since 2.3, from traits and private rooms to storage, trade, and financial crises.'),
 ('분야를 누르면 해당 누적 변경 전체가 펼쳐집니다.','Select a category to read its full cumulative changes.'),
 ('전체 펼치기','Expand all'),('전체 접기','Collapse all'),
 ('개 항목',' items'),
 ('2.4.0 누적 항목은 이번에 처음 추가된 기능이라는 뜻이 아닙니다. 2.4.1을 처음 접하는 분을 위해, 2.3 이후의 변경을 현재 명칭과 최종 반영 내용으로 묶었습니다.','The cumulative 2.4.0 entries are not all new in 2.4.1. They bring together the changes since 2.3, using current names and final behavior, for readers downloading this release for the first time.'),
 ('화면을 가리거나 진행을 끊던 문제, 인물·재고·정산의 잘못된 연결을 분야별로 정리했습니다. 2.4.1 수정과 2.4.0 누적 수정을 구분해 표시했습니다.','Grouped fixes for obstructed screens, interrupted progression, and incorrect character, inventory, and payment handling. The labels distinguish 2.4.1 fixes from the cumulative fixes in 2.4.0.'),
 ('표기와 리소스 정비, 제작·검수 환경의 작은 개선을 모았습니다.','Smaller improvements to presentation, resources, and the modding and review environment.'),
 ('제작 도구 관련 항목은 모딩·검수 환경의 변경입니다. 일반 플레이에 별도 모드툴 실행은 필요하지 않습니다.','Tool-related entries describe the modding and review environment. Normal play does not require a separate modding tool.'),
 ('제작과 감사','Credits and thanks'),
 ('2.4 한국어판 개편: SAnk · 원작과 역대 개발진, 번역·이미지 제작자 및 커뮤니티에 감사드립니다.','Korean 2.4 mod revision: SAnk. Thanks to the original creator, past developers, translators, artists, and the community.'),
 ('PSP_PSP — 인디패치 원작자<br>zonezizone — 잭오나 플레이 실황<br>콤콤삼촌 — 허셀2 이미지 제공','PSP_PSP — Indie Patch creator<br>zonezizone — Jack-O’-Nine-Tails gameplay videos<br>KomkomSamchon (콤콤삼촌) — Honey Select 2 images'),
 ('상세 제작진과 원본 리소스 크레딧은 게임 내 크레딧을 확인해 주세요.','See the in-game credits for the full contributor and original-resource acknowledgments.'),
 ('업데이트 안내 · 이미지 내장형 단일 HTML','Update guide · single HTML with embedded images'),
 ('맨 위로 ↑','Back to top ↑'),
 ('버그 패치 내역','Bug fixes'),('그외 변경','Other changes'),('업데이트','Updates'),
]
template=(ROOT/'build.py').read_text(encoding='utf-8')
for old,new in replacements:
 assert old in template,'Missing translation anchor: '+old
 template=template.replace(old,new)
compile(template,str(ROOT/'build.en.py'),'exec')
(ROOT/'build.en.py').write_text(template,encoding='utf-8')
exec(compile(template,str(ROOT/'build.en.py'),'exec'),{'__file__':str(ROOT/'build.en.py'),'__name__':'__main__'})

def paragraph(lines,text):
 lines.extend([text,''])

def forum(locale,d):
 en_mode=locale=='EN'
 lines=[]
 paragraph(lines,'Jack-O’-Nine-Tails Korean Mod 2.4.1 — Update Guide' if en_mode else '잭 오 나인 테일즈 한국어 모드 2.4.1 업데이트 안내')
 paragraph(lines,'A clearer battlefield. More ways to grow.' if en_mode else '더 선명해진 전투, 더 깊어진 육성.')
 paragraph(lines,'This English guide describes the Korean mod. It covers the additions in 2.4.1 and all cumulative changes in 2.4.0 since 2.3.' if en_mode else '2.4.1을 처음 받는 분도 한 번에 살펴볼 수 있도록, 2.3 이후의 2.4.0 누적 변경과 2.4.1 추가분을 함께 담았습니다.')
 paragraph(lines,'[1. UPDATES]' if en_mode else '[1. 업데이트]')
 paragraph(lines,'[Highlights of 2.4.1]' if en_mode else '[2.4.1 주요 변화]')
 for item in d['features241']:
  paragraph(lines,item['title']);paragraph(lines,item['body'])
  for text in item.get('items',[]):lines.append('- '+text)
  if item.get('items'):lines.append('')
 paragraph(lines,'[Further refinements to existing features]' if en_mode else '[기존 기능의 후속 개선]')
 for text in d['followups241']:lines.append('- '+text)
 lines.append('')
 paragraph(lines,'[2.3 → 2.4.0: Full cumulative changes]' if en_mode else '[2.3 → 2.4.0 전체 누적 변경]')
 paragraph(lines,'These entries describe the cumulative 2.4.0 changes, not features first introduced in 2.4.1. Current names and final behavior are used below.' if en_mode else '아래는 이번에 처음 추가된 기능이라는 뜻이 아닙니다. 2.3 이후의 변경을 현재 명칭과 최종 반영 내용으로 묶었습니다.')
 for i,g in enumerate(d['groups240'],1):
  paragraph(lines,f'{i}) '+g['title'])
  for item in g['items']:lines.append('- '+item)
  lines.append('')
 paragraph(lines,'[2. BUG FIXES]' if en_mode else '[2. 버그 패치 내역]')
 for g in d['fixes']:
  paragraph(lines,'['+g['version']+'] '+g['title'])
  for item in g['items']:lines.append('- '+item)
  lines.append('')
 paragraph(lines,'[3. OTHER CHANGES]' if en_mode else '[3. 그외 변경]')
 for item in d['other']:lines.append('- '+item)
 lines.append('')
 paragraph(lines,'Tool-related entries describe the modding and review environment. Normal play does not require a separate modding tool.' if en_mode else '제작 도구 관련 항목은 모딩·검수 환경의 변경입니다. 일반 플레이에 별도 모드툴 실행은 필요하지 않습니다.')
 paragraph(lines,'[Credits and thanks]' if en_mode else '[제작과 감사]')
 paragraph(lines,'Korean 2.4 mod revision: SAnk. Thanks to the original creator, past developers, translators, artists, and the community.' if en_mode else '2.4 한국어판 개편: SAnk. 원작과 역대 개발진, 번역·이미지 제작자 및 커뮤니티에 감사드립니다.')
 lines.extend(['PSP_PSP — Indie Patch creator','zonezizone — Jack-O’-Nine-Tails gameplay videos','KomkomSamchon (콤콤삼촌) — Honey Select 2 images'] if en_mode else ['PSP_PSP — 인디패치 원작자','zonezizone — 잭오나 플레이 실황','콤콤삼촌 — 허셀2 이미지 제공'])
 lines.extend(['','See the in-game credits for the full contributor and original-resource acknowledgments.' if en_mode else '상세 제작진과 원본 리소스 크레딧은 게임 내 크레딧을 확인해 주세요.',''])
 p=ROOT/f'JO9_2.4.1_Forum_{locale}.txt'
 p.write_bytes(('\r\n'.join(lines)).encode('utf-8-sig'))
 return p

files=[ROOT/'JO9_2.4.1_Update_Guide_EN.html',forum('KO',ko),forum('EN',en)]
report={'files':[{'file':str(p),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in files],'counts':{'features241':len(ko['features241']),'followups241':len(ko['followups241']),'groups240':len(ko['groups240']),'cumulative_items':sum(len(g['items']) for g in ko['groups240']),'fix_items':sum(len(g['items']) for g in ko['fixes']),'other_items':len(ko['other'])}}
(ROOT/'bilingual-build-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
