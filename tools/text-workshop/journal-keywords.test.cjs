'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createJournalModel}=require('./build-journal-keywords.cjs');
const entries=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'journal-keywords.json'),'utf8'));
const model=createJournalModel(entries);
test('registered NPC and place hooks match names and exact QSP IDs without ID substrings',()=>{
 assert.ok(model.match({selection:{text:'보 아저씨에게 묻는다.'}}).includes('보 아저씨'));
 assert.ok(model.match({selection:{text:'인사한다.'},context:{scene:{conditions:["$npc = 'uncle_bo'"]}}}).includes('보 아저씨'));
 assert.ok(!model.match({selection:{text:'x_uncle_bo_extra'}}).includes('보 아저씨'));
 const place=entries.find(e=>e.kind==='place');assert.ok(model.match({selection:{text:place.name}}).includes(place.name));
 assert.deepEqual(model.match({selection:null}),[]);
});
test('request preserves exact registered hooks, removes duplicates, and empty selection adds nothing',()=>{
 assert.equal(model.request([]),'');
 const request=model.request(['보 아저씨','빈민가 집','보 아저씨']);
 assert.match(request,/저널 호출 키워드: 보 아저씨, 빈민가 집/);
 assert.match(request,/저널에 없는 설정을 만들지/);
 assert.equal((request.match(/보 아저씨/g)||[]).length,1);
});
test('both copied and sent adaptation requests include selected journal hooks; scripts parse',()=>{
 const js=fs.readFileSync(require('node:path').join(__dirname,'dialogue-ai.js'),'utf8');
 assert.match(js,/message:\(window\.JO9_JOURNAL_CONTEXT\(\)\|\|''\)/);
 assert.match(js,/window\.JO9_JOURNAL_SELECT\(\)/);new vm.Script(js);
 const html=fs.readFileSync(require('node:path').join(__dirname,'index.html'),'utf8');
 assert.match(html,/\$\{window\.JO9_JOURNAL_CONTEXT\?\.\(\)\|\|''\}/);
 for(const script of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
});
