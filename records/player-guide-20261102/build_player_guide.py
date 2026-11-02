from pathlib import Path
from PIL import Image
from html import escape as esc
import io,base64,json,hashlib,re

O=Path(__file__).parent;O.mkdir(parents=True,exist_ok=True)
W=Path('G:/somi/Jack O Nine Tails v2.4_work/game');J=Path('G:/somi/JO9O/game')
R=Path('G:/somi/JO9sa/records')
old=json.loads((R/'release-guide-illustrated-20261101/content.json').read_text(encoding='utf8'))
media={
 'hero':(W/'content/pic/bg/kamira_street_small.png','영원의 로마','image'),
 'battle':(O/'assets/battle-ui-example.png','현재 전투 UI 구성 예시','preview'),
 'tutorial':(O.parent/'tutorial-current-ui-20261102/preview/intro.png','최신 공통 프레임을 적용한 튜토리얼','preview'),
 'cryo':(R/'post-patch-playtest-20261025/test-evidence/gui-evidence/06-isabella-forward.jpg','주인공·노예·조수의 상태를 함께 보는 생활 화면','screen'),
 'oldcity':(J/'content/pic/bg/kamira_street_small.png','기존 배경 리소스','image'),
 'newcity':(W/'content/pic/bg/kamira_street_small.png','2.4 계열 교체 배경','image'),
 'ogre':(W/'content/pic/mob/ogre.png','안개경계 · 오우거','image'),
 'warg':(W/'content/pic/mob/warg.png','안개경계 · 와그','image'),
 'egeya':(W/'content/pic/mob/egeya.png','이벤트 결투 · 에게야','image'),
 'home':(Path('C:/Users/User/AppData/Local/Temp/codex-clipboard-4e7f1896-b760-4094-982e-8501838c224d.png'),'속성과 특성을 살펴보는 정보 패널 예시','detail'),
 'isabella':(W/'content/pic/bg/isabella_meeting.png','현재 외형에 맞춰 갱신한 이사벨라의 만남','image'),
 'bankruptcy':(R/'asset-event-ui-20261024/runtime-test/evidence/07-before.png','현금이 부족할 때 자산과 대응 방법을 살피는 위기 화면','screen'),
 'spare':(W/'content/pic/scene/catdef2.png','캣파이트 · 상대를 살려준 뒤의 장면','image'),
 'rescue':(W/'content/pic/scene/coldef3.png','콜로세움 · 살아남은 출전자의 후송','image'),
 'champion':(W/'content/pic/scene/champion_return.png','우승 이후의 이야기를 잇는 전용 장면','image'),
 'guardian':(W/'content/pic/bg/strazhnik.png','포털 가디언 · 이벤트 소개 이미지','image'),
 'paladin':(W/'content/pic/mob/vatican_paladin.png','바티칸 팔라딘 · 전투 리마스터','image'),
}
encoded={};report=[]
for key,(p,caption,kind) in media.items():
 raw=p.read_bytes();im=Image.open(io.BytesIO(raw)).convert('RGB');original=im.size
 if kind=='screen':im=im.crop((21,53,1261,811))
 im.thumbnail((800,520) if kind in ('screen','preview') else (560,440),Image.Resampling.LANCZOS)
 b=io.BytesIO();im.save(b,'WEBP',quality=76,method=6)
 encoded[key]=(base64.b64encode(b.getvalue()).decode(),*im.size)
 report.append({'key':key,'source':str(p),'sourceSha256':hashlib.sha256(raw).hexdigest(),'kind':kind,'sourceSize':original,'embeddedSize':im.size,'embeddedBytes':len(b.getvalue())})
def fig(key,caption=None):
 p,default,kind=media[key];data,w,h=encoded[key];label={'screen':'게임 화면 · 2.4.0','detail':'게임 화면 · 정보 패널','preview':'UI 구성 예시 · 2.4.1','image':'게임 일러스트'}[kind]
 return f'<figure class="media" data-key="{key}"><button class="zoom" type="button" aria-label="{esc(caption or default)} 크게 보기"><img src="data:image/webp;base64,{data}" width="{w}" height="{h}" alt="{esc(caption or default)}" loading="lazy" decoding="async"><span class="image-tag">{label}</span><span class="expand-mark" aria-hidden="true">＋</span></button><figcaption>{esc(caption or default)}</figcaption></figure>'
def card(title,body,tag='2.4.0부터'):
 return f'<article class="card"><span class="tag">{tag}</span><h3>{title}</h3><p>{body}</p></article>'
def group(title,items):return '<details><summary>'+esc(title)+'</summary><ul>'+''.join('<li>'+esc(x)+'</li>' for x in items)+'</ul></details>'

ui=f'''
<section id="ui"><div class="chapter"><span>01 / UI 개선</span><h2>전장을 넓히고,<br>필요한 정보는 가까이.</h2><p>상대의 초상과 텍스트를 보던 전투에서, 상대의 전신과 전장을 바라보며 행동을 고르는 화면으로 바뀌었습니다.</p></div>
<div class="split"><div>{fig('battle')}</div><div class="copy"><span class="tag">2.4.1</span><h3>전투 화면을 다시 배치했습니다</h3><p>중앙에는 전신과 배경을 크게 보여 주고, 좌우에는 출전자 상태와 행동·무기 기술을 배치했습니다. 하단 전투 기록은 중앙 화면 폭을 사용해 읽을 공간을 확보했습니다.</p><ul><li>공격·방어·물약·무기 변경과 무기별 기술을 나눠 선택합니다.</li><li>긴 전투 기록은 스크롤로 확인하고, 공격 강조 색상과 왼쪽 정렬을 유지합니다.</li><li>찌르기·베기·타격·정신 공격의 유형에 맞춘 타격 효과를 구분했습니다.</li><li>승패 표시와 진행 버튼을 메시지 밖에 두어 결과를 읽기 쉽게 했습니다.</li></ul></div></div>
<div class="two-images">{fig('tutorial')}{fig('cryo')}</div>
<div class="cards three">{card('특성은 모아서, 설명은 읽기 쉽게','특성 전체보기에서 발견한 성향과 칭호를 살펴보고 설명을 읽을 수 있습니다. 등급색·칭호색·설명 형식도 구분해 육성 판단을 돕습니다.','2.4.0 → 2.4.1')}{card('보관한 인물을 얼굴로 찾기','크라이오 셀에 얼굴과 이름이 표시됩니다. 페이지를 넘겨 보관 인물을 찾아, 이름만 기억하며 목록을 뒤지던 불편을 줄였습니다.')}{card('튜토리얼과 인물 소개도 함께 정비','튜토리얼을 최신 공통 프레임으로 맞췄습니다. 장소와 인물의 설명을 확충해, 방문한 곳과 마주한 상대를 이해하기 쉽게 했습니다.','2.4.0 → 2.4.1')}</div></section>'''

art=f'''
<section id="art"><div class="chapter"><span>02 / 이미지 리마스터</span><h2>도시의 거리부터<br>결투 상대의 마지막 장면까지.</h2><p>지역·시설 배경, 주요 인물과 포트레이트, 전투 전신과 패배 컷을 확충했습니다. 원본·인디·개인 제작·추가 이미지 리소스를 이번 통합판에 함께 구성했습니다.</p></div>
<div class="comparison"><div>{fig('oldcity')}<b>기존 리소스</b></div><div>{fig('newcity')}<b>교체 리소스</b></div></div><p class="small-note">같은 장소의 기존 배경과 교체 배경 비교입니다. 왼쪽은 2.3 실행 화면이 아닌 기존 이미지 리소스입니다.</p>
<div class="cards three">{card('장소마다 다른 전장','안개경계는 안개숲, 아레나는 관중이 둘러싼 경기장, 캣파이트는 횃불이 켜진 지하 격투장으로 분위기를 구분합니다.','2.4.1')}{card('괴물의 크기와 인물의 무기','거대한 적은 배경과 구도로 크기를 드러내고, 작은 적은 주변 지형과의 비례를 맞췄습니다. 주요 인물은 설정에 맞는 무기와 전투 모습을 정리했습니다.','2.4.1')}{card('전투·패배를 한 세트로','전투 전신과 패배 장면을 연결하고, 단체 상대에는 함께 패배한 장면을 사용합니다. 일부 괴물은 성장 단계별 외형도 구분합니다.','2.4.1')}</div>
<div class="gallery three">{fig('ogre')}{fig('warg')}{fig('egeya')}</div>
<div class="ribbon"><strong>그림을 감상하는 방식도 바뀌었습니다.</strong><p>등록된 원본·추가 컷을 전환하고 선택을 유지할 수 있습니다. UI를 숨겨 컷신만 보는 기능도 제공합니다. 모든 이미지가 새 그림으로 교체된다는 뜻은 아니며, 이번에 채택된 리소스를 기준으로 통합했습니다.</p></div></section>'''

systems=f'''
<section id="systems"><div class="chapter"><span>03 / 게임 기획 변경 및 추가</span><h2>누구를 키우고,<br>누구를 내보낼 것인가.</h2><p>2.4의 큰 변화는 화면에만 있지 않습니다. 동료 출전, 인물마다 다른 성장과 대화, 여러 인물을 운영하는 선택이 기존 육성·납품·전투 흐름 위에 더해졌습니다.</p></div>
<article class="feature"><span class="tag">2.4.0부터</span><h3>안개 전투에 노예·조수를 먼저 출전</h3><p>일반 안개 순찰에서 동료 한 명을 먼저 내보낼 수 있습니다. 동료가 패하면 주인공이 이어받고, 앞서 입힌 피해와 쓰러뜨린 적, 적의 소모된 자원은 유지됩니다. 각 출전자는 자기 차례에 장비를 고릅니다.</p><div class="flow" aria-label="동료 선출전 흐름"><div><b>출전자 선택</b><span>혼자 / 노예 / 조수</span></div><i aria-hidden="true">→</i><div><b>동료가 먼저 전투</b><span>육성한 능력과 장비로 출전</span></div><i aria-hidden="true">→</i><div><b>패배하면 주인공 교대</b><span>적에게 입힌 피해 유지</span></div></div><p class="small-note">노예·조수·주인공 세 명이 모두 연속 출전하는 방식은 아닙니다. 동료의 상태와 행동력을 살펴야 하며, 패배의 대가도 발생합니다.</p></article>
<div class="split reverse"><div class="copy"><span class="tag">2.4.0부터 · 후속 보완</span><h3>같은 수업도, 같은 일과도<br>모두에게 같지 않습니다</h3><p>학습 속도와 반복 활동, 성과를 대하는 태도와 좋지 않은 경험을 기억하는 방식까지 인물의 성향이 작용합니다. 처음부터 모든 성격이 드러나는 것은 아니며, 실제 활동 중 발견되는 특성도 있습니다.</p><div class="trait-grid"><div><b>천재 · 백치</b><span>배우는 속도와 성장 차이</span></div><div><b>끈기 · 산만함</b><span>반복 활동의 성과 차이</span></div><div><b>옹졸함 · 너그러움</b><span>불쾌한 경험을 기억하는 방식</span></div><div><b>건강체질 · 약골</b><span>체력과 운동 교육의 차이</span></div><div><b>광전사 · 성기사</b><span>실전의 공격·방어 성향</span></div><div><b>역전의 용사</b><span>실전 지속력의 개성</span></div></div><p>특성 전체보기와 발견 안내로 변화를 확인하고, 체질개선·카오틱 에센스 등으로 인물을 관리할 수 있습니다. 다재다능·절세미인·명기 같은 특별한 가치도 육성과 거래에 의미를 더합니다.</p></div><div>{fig('home')}</div></div>
<div class="split"><div>{fig('isabella')}</div><div class="copy"><span class="tag">2.4.0부터</span><h3>인상 한마디를 넘어,<br>관계와 경험을 묻는 대화</h3><p>과거, 인상, 부탁, 하고 싶은 일, 싫어하는 것, 현재 기분, 다른 인물에 대한 평가로 대화 구성을 넓혔습니다. 성격과 말투, 관계와 감정, 최근 경험을 반영해 인물마다 반응이 달라집니다.</p><p>최근 표현의 반복을 줄이고, 긴 답변은 문장 중간을 자르지 않도록 묶었습니다. 고유 인물의 사연과 직접 작성한 배경은 보존합니다.</p><p class="small-note">정해진 대사 조각을 상황에 맞게 조합하는 방식입니다. 독립 이벤트 수천 개나 무한 대화를 뜻하지 않습니다.</p></div></div>
<div class="cards two">{card('실전 경험과 개인 명성','직접 싸운 인물의 실전 경험, 안개경계의 목격담과 랠리·캣파이트 성적을 개인 명성에 반영하도록 보완했습니다. 육성의 결과가 교육 메뉴 밖에서도 드러납니다.')}{card('방과 업무를 나눠 여러 인물 운영','개인실마다 식단을 선택하고, 공용업무와 개인실 메이드의 역할을 구분합니다. 방·보관소를 오가며 인물을 찾는 동선도 정리했습니다.')}</div></section>'''

balance=f'''
<section id="balance"><div class="chapter"><span>04 / 밸런싱과 경영</span><h2>육성의 가치와<br>하루의 선택을 다시 조정했습니다.</h2><p>인물을 어떻게 키웠는지, 어디에서 거래하는지, 주어진 행동력을 어떻게 쓸지가 더 분명하게 이어지도록 보완했습니다.</p></div>
<div class="table-wrap"><table><caption>플레이에서 체감하는 주요 조정</caption><thead><tr><th>변경 분야</th><th>달라진 점</th><th>플레이에 미치는 영향</th></tr></thead><tbody><tr><th>행동력·과로</th><td>체력에 따른 기본 행동력 조정, 근육질 인물의 과로 부담 완화</td><td>체력 육성과 일과 배분을 함께 고려합니다.</td></tr><tr><th>체질과 성장</th><td>체질 특성을 전투 자원·운동 교육에 반영하고 성장 효과 보완</td><td>같은 일정이라도 체질에 따라 육성 방향이 달라집니다.</td></tr><tr><th>인물 평가</th><td>현재 속성·기술·복종·종합등급과 특별한 특성의 거래 가치 반영</td><td>교육 성과와 고유한 강점이 판매 판단에 의미를 갖습니다.</td></tr><tr><th>콜로세움 보상</th><td>기존 단계별 상금을 같은 비율로 확대, 결과·상금 안내 통합</td><td>경기 결과와 상금을 함께 확인합니다.</td></tr><tr><th>공개 경매</th><td>쉬움·보통의 지급 상한 해제, 하드코어는 상한 적용과 공제 안내</td><td>선택한 난이도에 따라 경매 대금 규칙이 달라집니다.</td></tr></tbody></table></div>
<div class="cards two">{card('인물에 맞는 구매자 소문','지역의 안내자에게 현재 보유 인물에 맞는 구매자 소문을 들을 수 있습니다. 별도 추천처가 마땅하지 않을 때는 길드 재매입을 안내합니다.','2.4.0부터 · 후속 보완')}{card('가치가 있는 인물을 알아보는 거래','명기·절세미인·다재다능의 가치와 일부 특별 거래 혜택을 보완했습니다. 모든 NPC가 같은 가격 배수를 적용하는 방식은 아니며, 고객의 인수 조건과 자금은 여전히 중요합니다.')}</div>
<div class="split"><div>{fig('bankruptcy')}</div><div class="copy"><span class="tag">2.4.0부터</span><h3>자금 위기에도 대응할 선택</h3><p>돈이 부족해졌을 때 자산을 정리하거나 직접 자금을 마련하며 위기에 대응하는 진행을 추가했습니다. 주거·장식·시설·보유 인물의 처분과 정산을 구분합니다.</p><p>무엇을 남기고 무엇을 정리할지 판단해야 합니다. 인물이 실제로 처분되면 연결된 진행 중 의뢰에도 결과가 생깁니다.</p></div></div></section>'''

events=f'''
<section id="events"><div class="chapter"><span>05 / 컷신 &amp; 이벤트</span><h2>승패 다음에도<br>이야기가 이어집니다.</h2><p>새 그림만 더하는 데서 그치지 않고, 경기의 선택·결과·후속 장면이 연결되도록 구성했습니다. 기존 주요 이벤트에도 현재 외형과 장소에 맞는 연출을 더했습니다.</p></div>
<div class="cards two">{card('이긴 뒤, 상대의 운명을 선택','콜로세움 정식 경기와 일반 캣파이트에서 처형하거나 살려주는 선택이 이어집니다. 선택에 맞춘 그림과 대사가 나오며, 연습경기는 생사를 가르는 경기와 구분해 대련을 마무리합니다.','2.4.1')}{card('보여 준 태도가 돌아오는 경기','잔혹함과 자비를 보여 준 행동이 이력으로 쌓입니다. 콜로세움·캣파이트에서 패배한 내 인물에게 상대가 어떤 대우를 하는지에도 영향을 줍니다. 전투 부상 자체의 위험이 없어지는 것은 아닙니다.','2.4.1')}</div>
<div class="gallery three">{fig('spare')}{fig('rescue')}{fig('champion')}</div>
<div class="copy wide"><h3>승리·패배·그 이후를 나눠 보여 줍니다</h3><p>주인공과 노예·조수의 대련 결과, 정식 경기의 사망·처형·생존 후송, 승리 뒤 상대의 처분, 챔피언 이후의 후속 장면을 구분했습니다. 결과 대사도 이미 끝난 전투와 다음 장면이 자연스럽게 이어지도록 다듬었습니다.</p><p>이사벨라의 술집·영입 거래 장면을 현재 외형으로 갱신하고, 에게야를 비롯한 주요 이벤트 상대의 전투 모습을 보완했습니다. 홍등가·살롱의 연속 장면과 일부 고유 인물의 역할 복장도 정리했습니다.</p></div>
<div class="two-images">{fig('guardian')}{fig('paladin')}</div><p class="small-note">포털 가디언·바티칸 팔라딘은 기존 이벤트의 소개·전투 연출을 갱신한 예입니다. 새로운 지역이나 별도 퀘스트를 개방했다는 뜻은 아닙니다.</p></section>'''

misc='<section id="others"><div class="chapter"><span>06 / 기타 변경</span><h2>세부 개선과 버그 수정.</h2><p>위의 주요 콘텐츠와 구분해, 플레이 중 알아두면 좋은 세부 조정·수정 내역과 아직 확장 중인 요소를 모았습니다.</p></div><div class="misc-grid">'
misc+=group('육성·생산·정보 표시의 세부 보완',[
 '겹치는 활동·휴식 및 관심 성향을 통합하고 최신 명칭을 정리했습니다. 양립하지 않는 일부 특성의 중복도 정리했습니다.',
 '명기 발견 이력과 최초 발견 안내, 일부 희귀 특성의 성장·생산 혜택과 성형 결과를 보완했습니다.',
 '카오틱 에센스는 제거 가능한 부정 특성을 먼저, 그다음 애매한 성향을 정리하도록 범위를 보완했습니다. 확실한 긍정 특성과 보호 대상은 유지합니다.',
 '일부 전문 교육, 우유 등 생산 활동의 획득량·보고·수동/자동 정산을 맞췄습니다.',
 '괴물의 갈망·만족 표시를 조수 개인 상태에서 분리하고, 성장 상태는 별도 설명으로 확인하도록 정리했습니다.',
 '속성·기술·종합등급의 표시, 임신 단계와 상태 아이콘, 장비 설명·툴팁·이모지를 정비했습니다.',
 '일반 이사에서 개인실과 입주자를 유지하고, 주거에 따른 개인실 증축 한도를 구분했습니다.',
 '단체전의 패배 이미지를 묶고 MOB 초상 프레임·배경색·얼굴 영역과 이미지 규격을 정리했습니다.',
 '상세 설명은 직접적인 확률·산식·보상 조건을 나열하는 대신 상황에 맞는 힌트로 다듬었습니다.'
])
for g in old['fixes']:misc+=group(g['title']+' · 버그 수정',g['items'])
misc+=group('생활·거래·상점의 작은 조정',[
 '환전·거래 결과의 보유 금화, 우유 가격판·재고 수량과 약품 선택 화면을 정리했습니다.',
 '캣파이트 상금을 설정과 일치하도록 조정했습니다. 모든 경기의 상금이 일괄 상향된 것은 아닙니다.',
 '판매처 소문 추천·돌아가기 메뉴와 안내자 아이콘·말투, 현재 참가자 이름을 정리했습니다.',
 '정보창의 불필요한 제목과 여백을 정리하고 통화 표기·띄어쓰기·번역·문자 인코딩을 보완했습니다.',
 '미술 교사를 전용 수업 화면과 아이콘으로 구분하고, 장비·보관함·치트 및 인물 편집기의 표시를 정리했습니다.'
])
misc+=group('개발 중·추가 활용 예정',[
 '아그라바 특수 재고: 신선한 과일·아그라바 와인의 소형 상품 상시 구매, 별도 보관 수량과 구매 툴팁을 추가했습니다. 일반 식사에 소비되는 완성된 식재료 시스템은 아닙니다.',
 '숨은 행동 성향의 추가 콘텐츠 연계는 확장 범위입니다. 잔혹·자비에 따른 지배력·매력의 새 능력 보너스는 이번 완성 기능으로 소개하지 않습니다.',
 '전체 난이도 배율 재설계와 창관 관련 추가 기획은 추후 논의 범위입니다. 현재 적용한 경매 규칙 등 개별 조정과 구분합니다.'
])
misc+=group('제작·배포 환경의 변경',[
 '이미지 체크리스트에 MOB 세트·등장 장소·장면 조건을 보강하고, 얼굴 영역 선택·프레임·이미지 크기 맞춤을 보완했습니다.',
 '이미지 B/C컷 조건 편집과 백업 리소스의 목록 중복 처리를 정리했습니다. 제작용 편집 도구의 개선은 별도 게임 콘텐츠 수로 세지 않습니다.',
 '기존 저장이 참조하는 일부 이미지의 호환 경로를 유지하고, 원본·개인·인디·추가 리소스의 출처와 구성을 정리했습니다.',
 '게임 버전은 2.4.1입니다. 제작진 감사와 라이선스 고지를 갱신했습니다.'
])
misc+='</div></section>'

css='''
:root{--bg:#111716;--panel:#19201d;--line:#38433a;--ink:#eee9da;--muted:#b6beb0;--gold:#d1b775;--sage:#8ca58c;--paper:#e8dfc8;--dark:#222d27}*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:78px}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.85 'Malgun Gothic','맑은 고딕',system-ui,sans-serif;word-break:keep-all;overflow-wrap:anywhere}a{color:inherit}button{font:inherit}a:focus-visible,button:focus-visible,summary:focus-visible{outline:2px solid var(--gold);outline-offset:5px}img{max-width:100%;height:auto;display:block}.wrap{width:min(1120px,calc(100% - 64px));margin:auto}.masthead{display:flex;align-items:center;justify-content:space-between;padding:22px 0;border-bottom:1px solid var(--line);font-size:11px;letter-spacing:.12em;color:var(--muted)}.masthead b{color:var(--gold)}.version{border:1px solid #80704b;padding:4px 10px;color:var(--gold)}.hero{display:grid;grid-template-columns:1.15fr 1fr;gap:44px;align-items:center;padding:54px 0 42px}.eyebrow{color:var(--gold);font-size:12px;letter-spacing:.12em;margin:0 0 15px}.hero h1{font-size:clamp(32px,4vw,49px);line-height:1.35;letter-spacing:-.06em;margin:0 0 20px}.hero h1 em{font-style:normal;color:var(--gold)}.hero .lead{font-size:17px;color:#c5cbbd;margin:0 0 20px}.hero .note{font-size:12px;color:var(--muted)}.hero .media{margin:0}.hero .media img{aspect-ratio:4/3;object-fit:cover}.nav{position:sticky;top:0;z-index:3;background:#111716f5;border-block:1px solid var(--line)}.nav .wrap{display:flex;gap:25px;overflow-x:auto;scrollbar-width:thin}.nav a{white-space:nowrap;text-decoration:none;padding:14px 0;font-size:13px;font-weight:700}.nav a:hover{color:var(--gold)}.summary-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:26px;padding:27px 0 30px;border-bottom:1px solid var(--line)}.summary-strip b{color:var(--gold);font-size:14px;display:block}.summary-strip p{margin:5px 0 0;color:var(--muted);font-size:13px}section{padding:59px 0;border-bottom:1px solid var(--line)}.chapter{max-width:800px;margin-bottom:30px}.chapter>span{color:var(--gold);font-size:12px;font-weight:bold;letter-spacing:.08em}.chapter h2{font-size:34px;line-height:1.4;letter-spacing:-.045em;margin:10px 0 15px}.chapter>p{color:var(--muted);margin:0;font-size:16px}.split{display:grid;grid-template-columns:1.15fr 1fr;gap:34px;align-items:center;margin:28px 0 35px}.reverse{grid-template-columns:1.1fr 1fr}.copy h3,.feature h3{font-size:24px;line-height:1.5;letter-spacing:-.035em;margin:9px 0 14px}.copy p{margin:0 0 14px;color:#d5d9cb}.copy ul{padding-left:19px;color:var(--muted);font-size:14px}.copy li{margin:7px 0}.tag{font-size:11px;color:var(--sage);font-weight:700;letter-spacing:.04em}.cards{display:grid;gap:18px;margin:27px 0}.three{grid-template-columns:repeat(3,1fr)}.two{grid-template-columns:repeat(2,1fr)}.card{border-top:2px solid #7e7958;background:var(--panel);padding:21px 22px}.card h3{font-size:18px;line-height:1.5;margin:8px 0 12px;letter-spacing:-.025em}.card p{margin:0;color:var(--muted);font-size:14px}.media{margin:0;min-width:0}.zoom{display:block;width:100%;padding:5px;border:1px solid #6d654d;background:#222b25;color:var(--ink);position:relative;cursor:zoom-in}.zoom img{width:100%;object-fit:contain;background:#151a17}.image-tag{position:absolute;top:10px;left:10px;padding:2px 7px;background:#111914d9;color:#e5dfc8;font-size:10px}.expand-mark{position:absolute;right:11px;bottom:9px;color:white;background:#111a14b5;border-radius:50%;width:23px;height:23px;line-height:23px;font-size:18px}.media figcaption{font-size:11px;line-height:1.6;color:var(--muted);margin:8px 1px 0}.two-images{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:26px 0}.gallery{display:grid;gap:19px;margin:30px 0}.gallery img{aspect-ratio:4/3;object-fit:cover}.comparison{display:grid;grid-template-columns:1fr 1fr;gap:20px;background:#1b241e;border:1px solid var(--line);padding:19px}.comparison b{display:block;text-align:center;color:var(--gold);font-size:12px;margin-top:10px}.comparison img{aspect-ratio:4/3;object-fit:cover}.small-note{font-size:12px!important;color:#a5af9f!important;line-height:1.75!important}.ribbon{border-left:3px solid var(--gold);padding:18px 22px;background:#20271e;margin-top:26px}.ribbon strong{font-size:17px}.ribbon p{font-size:14px;color:var(--muted);margin:9px 0 0}.feature{background:var(--paper);color:var(--dark);padding:28px 32px}.feature .tag{color:#626d44}.feature .small-note{color:#586452!important}.feature p{margin:0 0 15px}.flow{display:flex;gap:14px;align-items:center;margin:23px 0}.flow>div{flex:1;border:1px solid #b8b397;padding:12px 14px;background:#f2ecd9}.flow b{display:block;font-size:14px}.flow span{display:block;font-size:12px;color:#61705e;margin-top:4px}.flow i{font-style:normal;color:#6c714d}.trait-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:20px 0}.trait-grid>div{padding:9px 11px;border-left:2px solid #72977d;background:var(--panel)}.trait-grid b{display:block;font-size:13px;color:#dedac5}.trait-grid span{font-size:12px;color:var(--muted)}.table-wrap{overflow:auto;border:1px solid var(--line)}table{border-collapse:collapse;width:100%;font-size:14px}caption{text-align:left;color:var(--gold);padding:15px 19px;font-weight:700}th,td{text-align:left;vertical-align:top;padding:15px 18px;border-top:1px solid var(--line)}thead{background:#273026;color:var(--gold)}tbody th{white-space:nowrap;background:#1b241f;color:#ddd6bf}td{color:var(--muted)}.wide{max-width:880px;margin:30px 0}.misc-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start}details{background:#19211c;border:1px solid var(--line)}summary{cursor:pointer;padding:15px 18px;font-size:14px;font-weight:700;color:#d8d2bb}details[open] summary{border-bottom:1px solid var(--line)}details ul{margin:15px 19px;padding-left:17px;font-size:13px;color:var(--muted)}details li{margin:10px 0}footer{padding:30px 0 45px;font-size:12px;color:var(--muted)}footer .foot-title{font-size:15px;color:var(--gold);font-weight:bold}footer a{color:var(--gold)}dialog{background:#111b15;color:var(--ink);border:1px solid #8c7b54;max-width:min(900px,96vw);max-height:94vh;padding:18px}dialog::backdrop{background:#000d}dialog img{max-height:76vh;width:auto;margin:auto}dialog p{margin:10px 0 0;font-size:13px}#close-dialog{position:sticky;top:0;display:block;margin:0 0 12px auto;border:1px solid #70684e;background:#263022;color:white;padding:4px 12px;cursor:pointer}.actions{display:flex;gap:12px;margin:18px 0}.actions button{background:#263126;border:1px solid #72694b;color:var(--ink);padding:7px 13px;cursor:pointer;font-size:12px}@media(max-width:760px){.wrap{width:calc(100% - 34px)}.masthead{font-size:9px}.hero{grid-template-columns:1fr;gap:25px;padding-top:35px}.hero .media{max-width:460px}.hero h1{font-size:35px}.nav .wrap{gap:20px}.summary-strip{grid-template-columns:1fr;gap:15px}.chapter h2{font-size:29px}.split,.reverse{grid-template-columns:1fr;gap:20px}.cards.three,.gallery.three{grid-template-columns:1fr 1fr}.misc-grid{grid-template-columns:1fr}.flow{flex-direction:column;align-items:stretch}.flow i{text-align:center;transform:rotate(90deg)}.flow>div{flex:auto}.feature{padding:23px 19px}.comparison,.two-images{gap:13px}.comparison{padding:12px}.card{padding:17px}.table-wrap th,.table-wrap td{padding:11px 12px}.hero .media img{max-height:290px}.copy h3{font-size:22px}}@media(max-width:440px){.cards.three,.cards.two,.gallery.three,.two-images{grid-template-columns:1fr}.comparison{grid-template-columns:1fr 1fr}.comparison .image-tag{display:none}.gallery .media{max-width:400px}.chapter h2{font-size:27px}.hero h1{font-size:32px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}@media print{body{background:white;color:#222;font-size:11pt}.wrap{width:100%}.nav,.actions,.expand-mark,.image-tag,dialog{display:none}section{padding:20px 0;break-inside:auto}.chapter,.copy,.card,.media,details{break-inside:avoid}.card,.feature,.ribbon,details,.comparison{background:#f1f0e8;color:#222}.copy p,.card p,.chapter p,details li,footer,.small-note{color:#444!important}.chapter h2{font-size:24px}img{max-height:230px!important;width:auto!important}.tag,.eyebrow{color:#555}.hero{padding:20px 0}.hero .lead{color:#444}.masthead{color:#333}.zoom{border-color:#aaa;background:white}.media figcaption{color:#444}.misc-grid{grid-template-columns:1fr}details:not([open])>ul{display:block}table td{color:#333}th,td{border-color:#ccc}.flow>div{background:#eee}.table-wrap{overflow:visible}}
'''

hero=fig('hero','리마스터 배경 · 영원의 로마')
html=f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>잭 오 나인 테일즈 2.4.1 — 2.3에서 무엇이 달라졌나</title><meta name="description" content="UI, 이미지 리마스터, 동료 전투, 특성·대화·경영과 경기 후속 장면으로 살펴보는 2.3 대비 2.4~2.4.1 업데이트."><style>{css}</style></head><body id="top"><header class="wrap"><div class="masthead"><b>JACK-O'-NINE-TAILS · KOREAN MOD</b><span class="version">2.4.1 통합판</span></div><div class="hero"><div><p class="eyebrow">2.3 → 2.4.0 → 2.4.1</p><h1>다시 만나는<br><em>영원의 로마.</em></h1><p class="lead">전투의 장면부터 인물을 키우는 방식까지.<br>2.3에서 달라진 플레이를 한눈에 살펴보세요.</p><p class="note">2.4 최초 업데이트와 이후 누적 변경을 함께 소개합니다.<br>세부 수정·버그·개발 중 요소는 마지막 ‘기타 변경’에 모았습니다.</p></div>{hero}</div></header><nav class="nav" aria-label="문서 목차"><div class="wrap"><a href="#ui">UI 개선</a><a href="#art">이미지 리마스터</a><a href="#systems">게임 시스템</a><a href="#balance">밸런싱</a><a href="#events">컷신 &amp; 이벤트</a><a href="#others">기타 변경</a></div></nav><main class="wrap"><div class="summary-strip"><div><b>보고 고르는 전투</b><p>전신·전장·기술·기록을 나누고, 육성한 동료를 실전에 내보냅니다.</p></div><div><b>인물마다 다른 육성</b><p>특성과 성격, 경험과 관계가 성장·대화·거래에 반영됩니다.</p></div><div><b>승리 이후의 선택</b><p>상대의 생사와 경기의 후속 장면을 잇는 흐름을 더했습니다.</p></div></div>{ui}{art}{systems}{balance}{events}{misc}<footer><p class="foot-title">2.4를 처음 받는 분께</p><p>이 문서는 2.3을 기준으로 2.4.0과 2.4.1의 누적 변화를 소개합니다. 예전 이미지팩이나 구 QSP 패치를 통합판에 다시 덮어쓰지 마세요. 게임은 동봉된 일반 EXE로 실행하면 됩니다.</p><p>‘게임 화면 · 2.4.0’은 당시 실행 캡처이며, 정보 패널은 제공된 게임 화면을 발췌했습니다. ‘UI 구성 예시’는 현행 2.4.1 출력 HTML을 렌더링한 화면입니다. 일러스트는 최종 채택된 게임 리소스를 축소한 것입니다. 각 그림을 누르면 확대해서 볼 수 있습니다.</p><p>2026.11.02 기준 · 한국어 모딩·이미지 작업 SAnk<br>원작 및 기존 한국어판·인디·이미지팩 제작진의 크레딧은 게임과 LICENSES에서 확인하세요.</p><a href="#top">문서 처음으로 ↑</a></footer></main><dialog id="image-dialog" aria-label="그림 확대"><button id="close-dialog" type="button">닫기 · Esc</button><img id="dialog-image" alt=""><p id="dialog-caption"></p></dialog><script>
const dialog=document.getElementById('image-dialog'),big=document.getElementById('dialog-image');
document.querySelectorAll('.zoom').forEach(button=>button.addEventListener('click',()=>{{const image=button.querySelector('img');big.src=image.src;big.alt=image.alt;document.getElementById('dialog-caption').textContent=image.alt;dialog.showModal();}}));
document.getElementById('close-dialog').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{{if(e.target===dialog){{const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}}}});
const actions=document.createElement('div');actions.className='actions';actions.innerHTML='<button type="button" id="toggle-details">기타 변경 전체 펼치기</button>';document.querySelector('#others .chapter').appendChild(actions);document.getElementById('toggle-details').onclick=e=>{{const rows=[...document.querySelectorAll('details')],open=rows.some(x=>!x.open);rows.forEach(x=>x.open=open);e.target.textContent=open?'기타 변경 전체 접기':'기타 변경 전체 펼치기';}};
</script></body></html>'''
target=O/'JO9_2.4.1_업데이트안내.html';target.write_text(html,encoding='utf8')
(O/'media-manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
(O/'build-result.json').write_text(json.dumps({'file':str(target),'bytes':target.stat().st_size,'images':len(report),'mainSections':5,'otherGroups':html.count('<details>'),'standalone':True},ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'file':str(target),'bytes':target.stat().st_size,'images':len(report),'otherGroups':html.count('<details>')},ensure_ascii=False))
