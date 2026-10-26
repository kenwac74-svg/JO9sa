'use strict';
const fs=require('fs'),assert=require('assert/strict');
const repo='G:/somi/JO9sa',base=repo+'/records/trait-system-review-20261024',c=require(repo+'/tools/text-workshop/core.cjs');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const original=read(base+'/original-inventory.json'),added=read(base+'/new-inventory.json'),relations=read(base+'/relations.json'),rename=read(repo+'/records/strong-obedience-rename-20261024/FINAL_RESULT.json');
assert.equal(original.inventory.length,39);assert.equal(added.axes.length,15);assert.equal(c.hash(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp')),rename.after);
const rows=[],replace=s=>String(s||'').replaceAll('완전한 사육','강한 복종심'),cell=s=>replace(s).replaceAll('|',' / ').replace(/\r?\n/g,' '),origin=x=>x.provenance&&x.provenance.class||'신규·복원';
for(const x of original.inventory)rows.push({key:x.key,origin:'원본 활성',variants:x.variants.map(v=>({...v,label:replace(v.label)})),classification:x.pathClassification,effect:replace(x.effect),acquisition:replace(x.acquisition||x.acquired),discovery:replace(x.discovery),exclusion:replace(x.crossExclusion),refs:'original-inventory.json'});
for(const x of added.axes)rows.push({key:x.key,origin:origin(x),variants:x.variants.map(v=>({...v,label:replace(v.label)})),classification:x.classification,effect:replace(x.effect),acquisition:replace(x.generation),discovery:replace(x.discovery),exclusion:replace(x.exclusion),refs:'new-inventory.json'});
assert.equal(new Set(rows.map(r=>r.key)).size,54,'One row per live trait axis');assert.equal(rows.reduce((n,r)=>n+r.variants.length,0),95);
const oldPolarity=original.inventory.reduce((a,x)=>{for(const v of x.variants)a[v.valence]=(a[v.valence]||0)+1;return a},{}),newPolarity=added.axes.reduce((a,x)=>{for(const v of x.variants)a[v.polarity]=(a[v.polarity]||0)+1;return a},{});
write(base+'/all-traits.json',{status:'REVIEW_ONLY_NO_NEW_RULES_APPLIED',auditSnapshotSha256:rename.before,workAfterTextOnlyRename:rename.after,counts:{axes:54,displayVariants:95,originalAxes:39,originalVariants:72,newOrRestoredAxes:15,newOrRestoredVariants:23,oldPolarity,newPolarity},classificationDecision:'Pending user response: all later acquisition as achievement vs ordinary traits plus title achievements',rows});
let table='# 전체 특성 대조표 — 2026-10-24\n\n54개 저장 축과95개 표시 변형이다. 한 인물이95개를 동시에 가질 수 있다는 뜻이 아니다. 같은 축의 양/음·하위/상위 단계는 하나의 현재값이며 한 칸으로 세야 한다. 임신·부상·회복·기아 등 상태와 기본 속성은 제외했다. 명칭은 최신 강한 복종심으로 표기했다.\n\n조사는afb2…기준이며 후속WORK f2d5…에서는명칭·설명4문구만바뀌어효과·분류근거는동일하다. 새배제/상한/분류필드는구현하지않았다. 상세현재조건과참조행은연결된원본/신규JSON에있다.\n\n| 출처 | 저장 축 | 표시 변형 | 유불리 | 획득 경로 분류 | 핵심 효과 |\n|---|---|---|---|---|---|\n';
for(const r of rows){const labels=r.variants.map(v=>v.label+' ('+v.value+')').join(' / '),pol=[...new Set(r.variants.map(v=>v.valence||v.polarity))].join(' / ');table+='|'+[r.origin,r.key,labels,pol,typeof r.classification==='string'?r.classification:r.classification.type||JSON.stringify(r.classification),r.effect].map(cell).join('|')+'|\n';}
table+='\n[원본 전체 경로](ORIGINAL_KO.md) · [신규·복원 전체 경로](NEW_KO.md) · [주요23관계 검토](RELATIONS_KO.md) · [인벤토리 교차검사](CROSSCHECK_KO.md)\n';fs.writeFileSync(base+'/ALL_TRAITS_KO.md',table);
fs.writeFileSync(base+'/REVIEW_KO.md',`# 특성 체계 전수 검토와 결정안 — 2026-10-24

## 적용 완료와 검토 중인 범위

사용자가 승인한 ‘완전한 사육→강한 복종심’ 명칭·설명만 WORK에 반영했다. 목록·편집기 명칭과 공통·여주인 설명4곳을 변경했고, 원래meekness의값·발견·지속효과·반대축은 유지했다. 실제엔진출력2경로·공식출고9경로·문법경계·정확재생/재적용·독립검토PASS다. 세이브76개·Full·CSS는 보존했다. [변경 기록](../strong-obedience-rename-20261024/MANUAL_KO.md).

아래의 새 배제·발생률·개수·출처분류·성취후보는 **설계 검토안이며 미적용**이다. 조사 단계에서 특성을 지우거나 역할·기분·자아·가격을 재설정하지 않았다. 커밋·푸시하지 않았다.

## 전체 범위

- 기존 활성39축/72표시 변형. 모든키는보호참조JO9O에도있지만그파일의모든본문이역사적상류순정임을새로인증한것은아니다.
- 신규·복원15축/23표시 변형. 이중완전신규12축/19종,비활성기존키복원3축/4종이다.
- 합계54축/95표시 변형. 같은키의여러단계·양음은별도슬롯이아니다.
- 원본 표시 변형은게임효과기준긍정24/부정14/상황형34. 신규·복원은유리·조건부유리13/불리·행동제약9/장단점혼합1로요약할수있다. 이는생성출현률이아니며모두같은확률로등장한다는뜻도아니다.
- 원본39축과신규15축을전체표에연결했다. 주요관계23건은개별검토했고,이23건만으로가능한모든특성쌍을플레이검증했다는뜻은아니다.

[전체54축 대조표](ALL_TRAITS_KO.md), [원본](ORIGINAL_KO.md), [신규](NEW_KO.md), [관계별 근거](RELATIONS_KO.md).

## 오래 보유했을 때 실제로 늘어나는 것

많은표시는새특성획득이아니라처음부터있던값의발견이다. 신규성격7종이대표적이며known/revealed를올리는것만으로선천값이새로추첨되지않는다. 천재/백치·일벌레/안분지족같은축의양쪽을모두얻는경로도없다.

반면원본에는보유중XP조건에의한새획득/단계변화가13축14전이있다. 단계는같은축을교체하므로두칸이아니다. 전투직업은3종중하나만생기고,다재다능과성형경로절세미인도보유중생길수있다. 이정도만으로도작은표시예산을넘을수있으므로사용자의누적우려는실제설계대상이다. 일부부정값은훈련으로치환되거나해결되지만모든부정특성이자동사라지는구조도아니다.

## 이미 보장되는 배제

| 축 | 현재 처리 |
|---|---|
|천재/백치|같은키+1/-1|
|건강체질/약골|같은키+1/-1|
|일벌레/안분지족|같은키+1/-1|
|끈기/산만함|같은키+1/-1|
|옹졸함/너그러움|같은키+1/-1|
|강한복종심/자유로운영혼|같은meekness수치의양수/음수|
|광전사/성기사/역전의용사|같은직업키1/2/3중하나|
|노예근성/거센반항심|생성·수동편집·영입초기화에서배제|

무모함/용감함/겁쟁이등기존단계와양음축도원본표에있다. 타고난투사와동물3적성은생성기에서배제하지만모든주입·편집경로에공통된규약인것은아니다.

## 새로 판단할 교차 관계

| 비교 | 확인된 차이와 판단안 |
|---|---|
|노예근성/자유로운영혼|현재동시부여가능. 개념상배제후보1순위이나초기복종과상시성향이라는구현차이는있음. 신규부여시배제할지결정필요|
|선천적벙어리/달변가|현재배제없음. 달변가가음성말하기재능인지표현전반인지명칭·범위를먼저정해야함|
|강한복종심/노예근성|지속보정과영입초기훈련으로서로보완. 같은효과중복지급이아니므로명칭·설명분리유지|
|천재/분야적성|천재는XP배율,개별적성은성실도/승급문턱등다른효과. 강한중첩이지만완전중복아님|
|역전의용사/타고난투사/용감함|서로다른보정층. 용사+용감함사기2.25배등강한조합이지만시간이지날수록배율이계속누적되는복리는아님|
|건강체질/운동광/게으름|건강자원과운동선호가달라진짜반대쌍이아님. 기본체력등급과도별개|
|야심가/인지욕구|성장한날칭찬의추가반응과평소관심보상선호로부분중첩. 단순삭제·통합보다범위구분이우선|

같은계열성장·가치에기여한다는이유만으로모두배제하면캐릭터조합이줄어든다. 명확한반대축은같은슬롯의대체값으로만두고,부분보완은총량과실제배율로관리하는안을권한다. 기존에모순되는값이있는세이브는새규칙을로드할때자동삭제하지않는다.

## 긍정 편중과 상한을 다루는 기준

표시칸만잘라내면숨은보유특성과효과가계속남는다. 생성·입수·새획득에서같은보유수규칙을써야한다. 아직발견되지않은값도실제로보유한특성이면수에포함한다.

제안으로는일반성향8칸을긍정만으로자동채우지않고,새일반무작위인물의순수이점최대4개안을다음수치검토의출발점으로둘수있다. 나머지칸을억지로부정특성으로채우는안은아니다. 부정·상황형의정확한확률과특별프리셋예외는아직결정하지않았다. 각특성의현재출현빈도는시드/조건/후속덮어쓰기때문에표시종수만으로추정하지않는다.

후천획득은같은축반대값/상위단계라면기존값교체로취급한다. 독립성향이추가될때꽉찬칸을어떻게처리할지(선택교체/추가보류등)는정책결정이필요하다. 기존희귀특성자동삭제나부정효과를감추는표시전용상한은구현하지않는다.

## 성취 슬롯의 핵심 충돌과 미결정 사항

사용자는다재다능1칸과미래창관모드1칸을필수로두고세번째를검토중이다. 성취3칸확정이나창관특성효과승인은아니다. 필수성취가달성되었는데먼저얻은성취때문에못받는설계는피해야하므로예약슬롯또는명시적구분이필요하다.

사용자의획득경로기준을그대로쓰면초기보유/후기획득이모두가능한원본13축,전투직업,절세미인등을성취로구분해야한다. 기존저장에는출처표식이없어같은값만으로어느경로인지복구할수없다. 생성시XP가0이라고선천·후천을추정하는방법도이미획득후XP가쌓이므로정확하지않다. 아레나칭호도에게야가영입당시기존경력으로받는예외가있다.

따라서질문을제시했다: A)일반성향8칸+특별칭호형성취3칸으로구분, B)보유중얻는특성을모두성취로세고성취칸확대. 답을받기전에는어느분류도적용하지않는다. A를추천하지만이는사용자최신기준을단순화하는새제안이므로동의없이채택하지않는다.

세번째특별성취후보는기존대회칭호(투기장/경주)를한성과축으로묶는안이나전투직업3종중하나의성취경로를재사용하는안을비교할수있다. 후자의현재코드는10·15…승때9%추첨이므로‘조건달성시무조건획득’성취로쓰려면별도수리·승인이필요하다. 미래창관효과·새보너스수치는여기서만들지않았다.

## 별도 확인할 기존 결함 후보

일부passion_*는생성값2가가능한데목록은±1만표시하여효과가있어도표시가누락될가능성이있다. 일부시드의통상표시범위밖값도확인했다. 슬롯설계와무관하게고치려면참조경로를분리검증해야하며이조사에서정규화하거나삭제하지않았다.

## 검증 한계

전수표는실제표시분기·키참조·부여/발견/해제코드와보호참조·시드의정적대조다. 사용자캐릭터가가능한모든조합을플레이한검사나새분류이관시험은아니다. 개인세이브원문과임시진단게임복사본은공개표에넣지않았다. 이번명칭수정만WORK적용했고이검토안의배제·슬롯·수치변경은없다.
`);
fs.mkdirSync(base+'/scripts',{recursive:true});fs.copyFileSync(__filename,base+'/scripts/synthesize-report.cjs');write(base+'/synthesis-verification.json',{uniqueAxes:54,variants:95,originalAxes:39,newOrRestoredAxes:15,relations:relations.relationships.length,workSha256:rename.after,latestRenameOnly:true,newRulesApplied:false,classificationAnswerPending:true,gameOrSaveWritesByThisScript:false});console.log(JSON.stringify({axes:54,variants:95,oldPolarity,newPolarity,relations:relations.relationships.length}));if(require('path').basename(__filename)==='.trait-system-report.cjs')fs.unlinkSync(__filename);
