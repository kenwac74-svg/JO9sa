// 세계·출신·직업 기반 과거 경험 공식의 분류 누락, 처녀 고정·유부녀 규칙, 결정성, 정수 결과를 검사한다
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pastHistory,tierOf} from './dist/past-history.mjs';
const read=async f=>JSON.parse(await readFile(new URL('./dist/data/'+f,import.meta.url),'utf8'));
const F=await read('past-history-formula.json'),bg=await read('backgrounds.json'),drafts=await read('background-drafts.json');
const ids=kind=>[...new Set([...bg.records,...drafts.records].filter(r=>r.kind===kind).map(r=>r.id))];
// 분류 목록의 ID가 실제 배경에 있고, 한 ID가 두 묶음에 들어가지 않는다.
for(const kind of ['occupation','family','world']){
 const known=new Set([...ids(kind),'earth_rome']),seen=new Map();
 for(const [name,tier]of Object.entries(F[kind]))for(const id of tier.ids??[]){assert(known.has(id),`${kind} ${id} 없음`);assert(!seen.has(id),`${kind} ${id} 중복: ${seen.get(id)}·${name}`);seen.set(id,name);}
}
for(const id of F.marriage.pregnancyPerYearPct.traditional.ids.concat(F.marriage.pregnancyPerYearPct.industrial.ids,F.marriage.pregnancyPerYearPct.modern.ids))assert([...ids('world'),'earth_rome'].includes(id),id);
// 2026-11-11 최신 qsp generate_stock에서 뽑은 처녀 고정(virginity = 0) 직업·비처녀(virginity = 2) 직업
assert.deepEqual([...F.occupation.virginForced.ids].sort(),['barbarian_princess','bride','mprincess','noble_bride','nun','poor_bride','rich_bride','sorceress']);
for(const id of ['brothel','markitane','whore'])assert.equal(tierOf(F,'occupation',id).name,'sexWork');
for(const id of ['noble_wife','poor_wife','rich_wife','viking_wife'])assert.equal(tierOf(F,'occupation',id).name,'married');
const skilled={sub_hug:4,sub_kiss:4,sub_bj:4,sub_vaginal:4,sub_anal:2,sub_hj:3,sub_fj:2,sub_paizuri:2,sub_tongue:3,sub_dt:2,sub_asslik:1,sub_fisting:0,anal_stretch:0};
const stock=(o)=>({world:'medieval',family:'pesant',occupation:'poor_wife',age:0,virginity:2,fertility:0,pregnant:0,clone:0,...skilled,...o});
// 처녀 고정 배경은 기술이 높아도 성경험 0
for(const occupation of F.occupation.virginForced.ids)for(const age of [0,2])assert.equal(pastHistory(stock({occupation,age,virginity:0}),F,'s').intimacy,0,occupation);
// 비처녀면 처녀 고정 배경이어도, 기술이 낮아 0이 나와도 최소 경험 1~3
for(let i=0;i<200;i++){
 const nun=pastHistory(stock({occupation:'nun',virginity:2}),F,'n'+i).intimacy;assert(nun>=1&&nun<=3,'nun '+nun);
 const low=pastHistory({world:'modern',family:'worker',occupation:'teacher',age:0,virginity:2,fertility:0,pregnant:0,clone:0},F,'l'+i).intimacy;assert(low>=1&&low<=3,'low '+low);
}
assert.equal(pastHistory({world:'modern',family:'worker',occupation:'teacher',age:0,virginity:0,fertility:0,pregnant:0,clone:0},F,'z').intimacy,0);
assert.equal(pastHistory(stock({clone:1,virginity:2}),F,'s').intimacy,0);
// 연령 코드 1은 계산하지 않는다
assert.equal(pastHistory(stock({age:1}),F,'s').excluded,true);
assert.equal(pastHistory(stock({age:1}),F,'s').intimacy,null);
// 클론은 0
assert.equal(pastHistory(stock({clone:1}),F,'s').intimacy,0);
// 같은 입력은 같은 결과, 결과는 0 이상 정수
for(let i=0;i<50;i++){const a=pastHistory(stock({}),F,'k'+i),b=pastHistory(stock({}),F,'k'+i);assert.deepEqual(a,b);assert(Number.isInteger(a.intimacy)&&a.intimacy>=0);}
// 유부녀만 임신·출산을 만든다. 출산 ≤ 임신. 불임은 0. 다른 직업은 미상(null)
let sum={young:[0,0,0],milf:[0,0,0]};
for(let i=0;i<2000;i++)for(const [age,key]of [[0,'young'],[2,'milf']]){
 const r=pastHistory(stock({age}),F,'m'+i);
 assert(r.births<=r.pregnancies&&r.pregnancies>=0);
 sum[key][0]+=r.pregnancies;sum[key][1]+=r.births;sum[key][2]++;
}
const avg=k=>[sum[k][0]/sum[k][2],sum[k][1]/sum[k][2]].map(x=>x.toFixed(2));
// 기대값: 젊음 2.5년×45% ≈ 1.1회, 원숙 8.5년×45% ≈ 3.8회
assert(Math.abs(sum.young[0]/2000-1.125)<0.15&&Math.abs(sum.milf[0]/2000-3.825)<0.25,`평균 ${avg('young')} ${avg('milf')}`);
const sterile=pastHistory(stock({fertility:-1}),F,'s');assert.equal(sterile.pregnancies,0);assert.equal(sterile.births,0);
const other=pastHistory(stock({occupation:'whore'}),F,'s');assert.equal(other.pregnancies,null);assert.equal(other.births,null);
const pregnantNow=pastHistory(stock({occupation:'whore',pregnant:1}),F,'s');assert.equal(pregnantNow.pregnancies,1);assert.equal(pregnantNow.births,0);
// 현대 세계 유부녀는 전통 세계보다 임신이 적다
let trad=0,mod=0;for(let i=0;i<2000;i++){trad+=pastHistory(stock({age:2}),F,'t'+i).pregnancies;mod+=pastHistory(stock({age:2,world:'modern'}),F,'t'+i).pregnancies;}
assert(mod<trad);
// 같은 기술이면 접객업 > 유부녀 > 일반, 거리 출신 > 보호 출신
const at=o=>{let t=0;for(let i=0;i<300;i++)t+=pastHistory(stock(o),F,'v'+i).intimacy;return t/300;};
assert(at({occupation:'brothel'})>at({occupation:'poor_wife'})&&at({occupation:'poor_wife'})>at({occupation:'teacher'}));
assert(at({occupation:'teacher',family:'orphan'})>at({occupation:'teacher',family:'knight'}));
console.log(`PASS · 처녀 고정 8직업 0, 연령1 제외, 클론 0, 결정성, 유부녀 임신 평균 젊음 ${avg('young')[0]}·원숙 ${avg('milf')[0]} (출산 ${avg('young')[1]}·${avg('milf')[1]}), 불임 0, 비유부녀 미상`);
// 게임 생성 흉내: 처녀 고정 배경이 생성 뒤 처녀로 남는 비율(문서 6장의 게임 문제를 기록으로 고정)
const {simulateStock}=await import('./docs/simulate-generation.mjs');
let x=7;const rnd=(a,b)=>{x=(x*1103515245+12345)%2147483648;return a+Math.floor(x/2147483648*(b-a+1));};
const rate=meta=>{let v=0;for(let i=0;i<4000;i++)if(simulateStock('nun',meta,rnd).virginity<2)v++;return v/4000;};
const young=rate(2),milf=rate(3);
assert(Math.abs(young-0.375)<0.04&&Math.abs(milf-0.05)<0.02,`처녀 유지율 ${young} ${milf}`);
console.log(`게임 생성 흉내: 수녀 처녀 유지율 젊음 ${(young*100).toFixed(0)}% · 원숙 ${(milf*100).toFixed(0)}%`);
// 성 취향 특성: 총량(성욕)과 질·구강·애널 배분, 상대 배분
{
 const base={world:'medieval',family:'pesant',occupation:'brothel',age:2,virginity:2,fertility:0,pregnant:0,clone:0,sub_hug:3,sub_kiss:3,sub_bj:3,sub_vaginal:4,sub_anal:2,anal_stretch:0,sub_dt:0,sub_tongue:0};
 const mean=(o,f)=>{let t=0;for(let i=0;i<400;i++)t+=f(pastHistory({...base,...o},F,'t'+i));return t/400;};
 const total=r=>r.intimacy,share=act=>r=>r.acts[act]/r.intimacy;
 // 총량: 정액 중독 > 색정광 > 없음 > 불감증 > 석녀
 const lib=[2,1,0,-1,-2].map(n=>mean({nymphomania:n},total));
 for(let i=1;i<lib.length;i++)assert(lib[i-1]>lib[i],'성욕 순서 '+lib.join(','));
 // 배분 합 = 총량, 상대 배분 합 = 총량
 for(let i=0;i<200;i++){const r=pastHistory({...base,nymphomania:i%5-2,anal_affinity:i%3-1,homosexualism:i%4-1},F,'s'+i);
  assert.equal(r.acts.vaginal+r.acts.oral+r.acts.anal,r.intimacy);assert.equal(r.partners.opposite+r.partners.sameSex+r.partners.nonhuman,r.intimacy);}
 // 애널 중독은 애널 비중을 올리고, 혐오는 내린다
 const anal=[1,0,-1].map(n=>mean({anal_affinity:n},share('anal')));assert(anal[0]>anal[1]&&anal[1]>anal[2],'애널 '+anal);
 // 펠라 중독·정액 중독은 구강 비중을 올리고, 반사적 구역질·순수한 영혼은 내린다
 const oral0=mean({},share('oral'));
 assert(mean({oral_affinity:1},share('oral'))>oral0&&mean({nymphomania:2},share('oral'))>oral0);
 assert(mean({jo9_gag_reflex:1},share('oral'))<oral0&&mean({perversion:-1},share('oral'))<oral0);
 assert(mean({perversion:-1},share('anal'))<mean({},share('anal'))&&mean({perversion:2},share('anal'))>mean({},share('anal')));
 // 처녀는 질 0, 기술 0인 비처녀 최소 경험은 질
 const virgin=pastHistory({...base,occupation:'teacher',virginity:0},F,'v');assert.equal(virgin.acts.vaginal,0);assert(virgin.intimacy>0);
 const minimal=pastHistory({world:'modern',family:'worker',occupation:'teacher',age:0,virginity:2,fertility:0,pregnant:0,clone:0},F,'m');assert.equal(minimal.acts.vaginal,minimal.intimacy);
 // 레즈비언은 동성 비중이 높고, 동성애 혐오는 동성 0
 assert(mean({homosexualism:2},r=>r.partners.sameSex/r.intimacy)>0.7);
 assert.equal(mean({homosexualism:-1},r=>r.partners.sameSex),0);
 console.log(`성 취향 특성: 총량(정액중독→석녀) ${lib.map(x=>x.toFixed(0)).join(' > ')}, 애널 비중(중독/없음/혐오) ${anal.map(x=>(x*100).toFixed(0)+'%').join('/')}`);
}
// 기본 속성: 외모가 높을수록 경험이 늘고, 속성 계수는 60~160으로 자른다
{
 const {attributeFactor}=await import('./dist/past-history.mjs');
 const b={world:'medieval',family:'pesant',occupation:'teacher',age:2,virginity:2,fertility:0,pregnant:0,clone:0,sub_kiss:3,sub_bj:3,sub_vaginal:3};
 const m=o=>{let t=0;for(let i=0;i<300;i++)t+=pastHistory({...b,...o},F,'a'+i).intimacy;return t/300;};
 const byBeauty=[0,1,2,3,4,5].map(beauty=>m({beauty}));
 for(let i=1;i<6;i++)assert(byBeauty[i]>byBeauty[i-1],'외모 '+byBeauty);
 // 값이 없으면 기준(100). 최대·최소 조합은 170·50으로 자른다
 assert.equal(attributeFactor({},F).factor,100);
 assert.equal(attributeFactor({beauty:6,exotic:7,style:8,temper:5,pride:0,sensitivity:5,ego:0,stamina:5,fat:1},F).factor,170);
 assert.equal(attributeFactor({beauty:0,exotic:0,style:0,temper:0,pride:5,sensitivity:0,ego:5,stamina:0,fat:5},F).factor,50);
 // 태도는 낮을수록(개방적) 많고, 체형은 모델·육감적이 비만보다 많다. 지성·인지도·기분은 영향 없음
 assert(attributeFactor({pride:0},F).factor>attributeFactor({pride:5},F).factor);
 assert(attributeFactor({fat:1},F).factor>attributeFactor({fat:5},F).factor);
 for(const key of ['intellect','fame','mood'])assert.equal(attributeFactor({[key]:5},F).factor,100,key);
 // 안개경계 노예: 흉터로 현재 외모 0이어도 타고난 미모 4로 판정. 절세미인 +1(최대 6). 기본값이 없으면 현재값
 assert.equal(attributeFactor({beauty:0,base_beauty:4,scars:3},F).factor,attributeFactor({beauty:4},F).factor);
 assert.equal(attributeFactor({beauty:3,base_beauty:5,jo9_peerless:1},F).factor,attributeFactor({beauty:6},F).factor);
 assert.equal(attributeFactor({exotic:0,base_exotic:3},F).factor,attributeFactor({exotic:3},F).factor);
 console.log(`기본 속성: 외모 0~5 평균 ${byBeauty.map(x=>x.toFixed(0)).join(' < ')}`);
}
