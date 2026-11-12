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
