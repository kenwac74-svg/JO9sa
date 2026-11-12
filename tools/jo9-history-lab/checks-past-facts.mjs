// 섹스토크 과거 사실 생성기의 결정성, 처녀 처리, 첫 경험 시기 표시불가, 이종 경험 조건, 페티시 범위, 촉수 대사 초안 형식을 검사한다
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pastHistory} from './dist/past-history.mjs';
import {pastFacts,packFacts} from './dist/past-facts.mjs';
const read=async f=>JSON.parse(await readFile(new URL('./dist/data/'+f,import.meta.url),'utf8'));
const F=await read('past-history-formula.json'),X=await read('past-facts.json'),T=await read('xeno-talk-drafts.json');
const skilled={sub_hug:4,sub_kiss:4,sub_bj:4,sub_vaginal:4,sub_anal:2,sub_hj:3,sub_tongue:3,sub_dt:5};
const stock=o=>({world:'modern',family:'worker',occupation:'whore',age:0,virginity:2,fertility:0,pregnant:0,clone:0,...skilled,...o});
const run=(s,seed='a',acq={})=>pastFacts(s,pastHistory(s,F,seed),F,X,seed,acq);
// 같은 입력은 같은 사실(사실 일관성)
for(let i=0;i<50;i++)assert.deepEqual(run(stock({}),'k'+i),run(stock({}),'k'+i));
// 연령 코드 1은 대상이 아니다
assert.equal(run(stock({age:1})),null);
// 처녀는 첫 경험·기록이 없다
const v=run(stock({occupation:'nun',virginity:0}));assert.equal(v.fields.first_band,'none');assert.equal(v.fields.partners,0);
// 청소년기는 내부 코드 B1, 성인 이후는 코드 없음. 나이 숫자는 저장하지 않는다
let teen=0,adult=0;
for(let i=0;i<400;i++){const r=run(stock({}),'b'+i);if(r.fields.first_band==='teen'){teen++;assert.equal(r.blocked.first_band,'B1');}else{adult++;assert.equal(r.blocked.first_band,undefined);}
 assert(!/age|\d+세/.test(packFacts(r.fields)),'나이 저장 금지');}
assert(teen>0&&adult>0);
// 세계 순서: 선사가 가장 이르고 중세·근대가 가장 늦다(평균 나이)
const M=X.firstBand.meanAge;assert(M.prehistoric<M.modern&&M.space<M.modern&&M.medieval===Math.max(...Object.values(M))&&M.industrial===M.medieval);
// 상대 수는 1 이상, 총횟수 이하. 하루 최다 상대 ≤ 상대 수. 하룻밤 최다 ≤ 총횟수
for(let i=0;i<300;i++){const s=stock({occupation:['whore','teacher','former_slave','poor_wife'][i%4]}),h=pastHistory(s,F,'p'+i),r=pastFacts(s,h,F,X,'p'+i);
 if(h.intimacy>0){assert(r.fields.partners>=1&&r.fields.partners<=h.intimacy);assert(r.fields.max_day_people<=r.fields.partners);assert(r.fields.max_night<=h.intimacy);}}
// 이종 경험: 안개 경계 순찰에서 괴물에게서 구해 온 노예. 촉수·괴물·짐승(B2)으로 나뉘고, 사람·성적 장면 없는 장면은 아님
const kind=sc=>run(stock({}),'x',{route:'patrol',scene:sc});
for(const sc of ['61101','61102','61103'])assert.equal(kind(sc).fields.xeno,'patrol_tentacle');
for(const sc of ['61106','61107','61111','61112','61114'])assert.equal(kind(sc).fields.xeno,'patrol_monster');
// 와그는 이터널 로마의 괴물: 표시 가능(B2 아님). 살던 세상의 동물 경험은 따로 home_animal(B2)
assert.equal(kind('61113').fields.xeno,'patrol_warg');assert.equal(kind('61113').blocked.xeno,undefined);
assert.equal(run(stock({})).fields.home_animal,0);
{const X2=structuredClone(X);X2.xeno.homeAnimal.pctByWorld.modern=100;const s=stock({}),r=pastFacts(s,pastHistory(s,F,'h'),F,X2,'h',{});assert.equal(r.fields.home_animal,1);assert.equal(r.blocked.home_animal,'B2');
 const v0=stock({occupation:'nun',virginity:0}),r0=pastFacts(v0,pastHistory(v0,F,'h'),F,X2,'h',{});assert.equal(r0.fields.home_animal,0,'처녀는 동물 경험 없음');}
for(const sc of Object.keys(X.xeno.patrolExcluded))assert(!['patrol_tentacle','patrol_monster','patrol_warg'].includes(kind(sc).fields.xeno),sc);
// 이전 주인 촉수는 노예 출신만
let pm=0;for(let i=0;i<400;i++){assert.notEqual(run(stock({occupation:'whore'}),'m'+i).fields.xeno,'prev_master');if(run(stock({occupation:'former_slave'}),'m'+i).fields.xeno==='prev_master')pm++;}
assert(pm>40&&pm<160,'prev_master 비율 '+pm);
// 처녀여도 순찰 구출 경험은 있을 수 있다(이터널 로마 안의 일)
assert.equal(run(stock({occupation:'nun',virginity:0}),'x',{route:'patrol',scene:'61102'}).fields.xeno,'patrol_tentacle');
// 페티시는 앞 주제와 연결되지 않는 성향만: 펠라·애널 중독, 피학, 노출, 색정광·정액 중독, 동성 성향, 기호증, 심리피학은 들어가지 않는다
const banned=['oral_affinity','anal_affinity','masochism','exhibitionism','nymphomania','homosexualism','abuse_attitude','compassion','water_attitude','fire_attitude','vermin_attitude','darkness_attitude','deprivation_attitude','blood_attitude'];
for(const c of X.fetish.candidates)assert(!banned.includes(c.key),c.key);
assert.deepEqual(run(stock({perversion:2,oral_affinity:1,masochism:2})).fields.fetish,['perversion']);
// 촉수 대사 초안: 두 경우 모두 있고, 말투 1·2가 다 있고, 키가 겹치지 않는다
const ids=new Set();for(const r of T.rows){assert(!ids.has(r.id));ids.add(r.id);assert(['patrol_tentacle','patrol_monster','prev_master'].includes(r.case));assert(r.text['1']&&r.text['2']);}
for(const c of ['patrol_tentacle','patrol_monster','prev_master'])for(const rel of ['warm','low','hostile'])assert(T.rows.some(r=>r.case===c&&r.rels===rel),c+' '+rel);
// 와그는 사용자 작성 칸(Claude 초안 없음)
assert(!T.rows.some(r=>r.case==='patrol_warg'||r.case==='patrol_animal'));
console.log('past facts checks ok');
