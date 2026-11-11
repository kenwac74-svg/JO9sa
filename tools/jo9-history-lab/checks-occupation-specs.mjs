// 직업 명세 데이터가 원본과 같은지, 특성·직업·스킬 연결과 배척·모순 조건이 맞는지 검사한다
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildSpecs} from './docs/build-occupation-specs.mjs';
const saved=JSON.parse(await readFile(new URL('./dist/data/occupation-specs.json',import.meta.url),'utf8'));
const {specs,errors}=buildSpecs();
assert.deepEqual(errors,[]);
assert.deepEqual(saved.specs,specs,'occupation-specs.json이 원본과 다르다. node docs/build-occupation-specs.mjs로 다시 만든다');
// 오류 검출 자체를 확인한다.
const bad=buildSpecs([{label:'x',occupations:['nope'],line:1,rules:[{type:'chance',trait:'없는특성',probability:120},{type:'group',options:[{trait:'레즈비언',probability:60},{trait:'양성애자',probability:30}],none:40},{type:'grant',trait:'끈기'},{type:'exclude',trait:'끈기'},{type:'skillMin',skill:'회계',grade:'Z'}]}]).errors;
for(const part of ['없는 직업 ID: nope','없는 특성: 없는특성','배척 그룹 합 130','부여와 제외가 겹침: nope|끈기','없는 스킬: 회계','없는 등급: Z'])assert(bad.some(e=>e.includes(part)),part);
// 한 직업에서 추첨 가능한 특성끼리 같은 게임 키의 다른 값이면, 배척 그룹으로 묶여 있어야 한다.
const conflicts=[];
const occ=new Map();
for(const s of specs)for(const o of s.occupations)for(const r of s.rules){
 if(!occ.has(o.id))occ.set(o.id,[]);
 if(['chance','grant','raise'].includes(r.type))occ.get(o.id).push({t:r.trait,group:null});
 if(r.type==='group')r.options.forEach(x=>occ.get(o.id).push({t:x.trait,group:s.label}));
 if(r.type==='tiered'){r.first.forEach(t=>occ.get(o.id).push({t,group:s.label+'1'}));r.second.traits.forEach(t=>occ.get(o.id).push({t,group:s.label+'2'}));}
}
for(const [id,list]of occ)for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
 const a=list[i],b=list[j];
 if(a.t.key&&a.t.key===b.t.key&&a.t.id!==b.t.id&&!(a.group&&a.group===b.group))conflicts.push(`${id}: ${a.t.name} / ${b.t.name} (${a.t.key})`);
}
// 2026-11-11 확인: 영웅 여전사의 1단계 둘(타고난 투사·용감함)은 서로 다른 키라 함께 가질 수 있으나 명세는 "둘 중 하나"다. 생성기는 tiered 규칙을 그룹으로 처리해야 한다.
assert.deepEqual(conflicts,[],conflicts.join('\n'));
// 확정 확률의 대표값
const find=(label,name)=>specs.find(s=>s.label===label).rules.find(r=>r.trait?.name===name);
assert.equal(find('페미니스트','과대망상').probability,30);
assert.equal(find('바이킹의 아내','물 기호증').probability,40);
assert.equal(specs.find(s=>s.label==='영웅 여전사').rules[0].overall,4);
assert.equal(specs.find(s=>s.label==='목축업자').rules[0].minValue,3);
console.log(`PASS · 직업 명세 ${specs.length}개, 규칙 ${specs.flatMap(s=>s.rules).length}개, 원본 일치, 오류 검출 6종, 같은 키 충돌 0건`);
