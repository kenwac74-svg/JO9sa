// 캐릭터 시뮬레이터의 대분류 데이터와 이름 포함 엔진 표본을 검사한다
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=async f=>JSON.parse(await readFile(new URL('./dist/data/'+f,import.meta.url),'utf8'));
const [CAT,BG,BGD,STOCK]=await Promise.all(['background-categories.json','backgrounds.json','background-drafts.json','generated-stock.json'].map(read));
const ids=kind=>new Set([...BG.records,...BGD.records].filter(r=>r.kind===kind).map(r=>r.id));
// 세계·출신·직업이 모두 정확히 한 대분류에 들어간다
for(const kind of ['world','family','occupation']){
 const all=ids(kind),seen=new Map();
 for(const g of CAT[kind])for(const m of g.members){assert(all.has(m),`${kind} ${m} 없음`);assert(!seen.has(m),`${kind} ${m} 중복`);seen.set(m,g.label);}
 assert.equal(seen.size,all.size,`${kind} 누락: ${[...all].filter(x=>!seen.has(x))}`);
}
// 세계 대분류 7개(선사·고대·중세·판타지·근대·현대·미래)
assert.deepEqual(CAT.world.map(g=>g.label),['선사','고대','중세','판타지','근대','현대','미래']);
// 출신은 엑셀 계층 분류(사용자 확정) 7개
assert.equal(CAT.family.length,7);assert(CAT.family.every(g=>g.source==='xlsx'));
// 직업 대분류는 공통 규칙 기준(rule)과 신규(new)로 출처가 표시된다
assert(CAT.occupation.every(g=>['rule','new'].includes(g.source)));
// 엔진 표본: 이름과 ID(stock_type)가 있다
const K=STOCK.keys;assert(K.includes('name')&&K.includes('type'));
const ni=K.indexOf('name');assert(STOCK.rows.every(r=>typeof r[ni]==='string'&&r[ni].length>0),'이름 없는 표본');
console.log('character view checks ok');

// 산식 계수: 대분류 범위 → 소분류 값. 기본값(소분류 값 없음)은 기존 묶음 계수 결과와 같다
const {pastHistory,categoryFactor}=await import('./dist/past-history.mjs');
const FORMULA=await read('past-history-formula.json'),REFS=await read('interview-refs.json');
const sample=STOCK.rows.slice(0,800).map(r=>Object.fromEntries(K.map((k,i)=>[k,r[i]])));
const plain=structuredClone(FORMULA);delete plain.categories;
for(const [i,s]of sample.entries())assert.deepEqual(pastHistory(s,FORMULA,'k'+i),pastHistory(s,plain,'k'+i),'기본 범위에서 결과가 바뀜');
for(const kind of ['world','family','occupation'])for(const g of CAT[kind])assert(FORMULA.categories[kind].groups[g.id],`${kind} 대분류 ${g.id} 계수 없음`);
// 소분류 값은 대분류 범위 안으로 맞춰진다
{const f=structuredClone(FORMULA),g=f.categories.occupation.groups.job1;g.min=150;g.max=180;f.categories.occupation.items.whore=999;
 assert.equal(categoryFactor(f,'occupation','whore',200).factor,180);assert.equal(categoryFactor(f,'occupation','brothel',200).factor,180);
 g.max=300;assert.equal(categoryFactor(f,'occupation','brothel',200).factor,200);}
// 특성 키워드 가중치는 맞는 특성에만 곱해진다
{const f=structuredClone(FORMULA);f.traitWeights=[{name:'겁쟁이',key:'courage',op:'=',value:-1,factor:200}];
 const s={...sample.find(r=>r.virginity>1&&r.occupation==='whore'),courage:-1},s0={...s,courage:0};
 const a=pastHistory(s,f,'t').intimacy,b=pastHistory(s0,f,'t').intimacy;assert(a>b,`특성 가중치 미적용 ${a} ${b}`);}
// 원본 DB 참조표: 게임용 주제 키가 있고, 표시 불가 원문은 비어 있다
assert(REFS.topics.partners.length>100&&REFS.topics.first_time.length>50);
assert(Object.values(REFS.rows).every(r=>r.b.includes('B1')||r.b.includes('B2')?r.t===null:true),'표시 불가 원문이 들어 있음');
console.log('formula category checks ok');
