'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',root='G:/Codex/tmp/jo9-meiki-yield-20261023';
const core=require(repo+'/tools/text-workshop/core.cjs');
const baselinePath='G:/somi/JO9_work_backups/meiki_size_yield_20261023/before.qsp',candidatePath=root+'/candidate.qsp';
const beforeRaw=fs.readFileSync(baselinePath),afterRaw=fs.readFileSync(candidatePath),before=core.parse(beforeRaw),after=core.parse(afterRaw);
const patch=JSON.parse(fs.readFileSync(root+'/patches/2026-10-23_meiki_size_yield.json','utf8'));
const prepared=JSON.parse(fs.readFileSync(root+'/prepared.json','utf8'));
assert.equal(before.hash,'4aa7bb9fad83f2a1dfc964b86f153d2515948db0e66791482e83a9ccedc725fc');
assert.equal(after.hash,'2958af5909714d4964cd03f243e8aa81fe515106cbf289de2e3dbb686d63193d');
assert(core.serialize(before).equals(beforeRaw));assert(core.serialize(after).equals(afterRaw));
assert.deepEqual(before.locations.map(x=>x.name),after.locations.map(x=>x.name));
assert.equal(patch.edits.length,20);
const replay={...before,lines:before.lines.slice()};
for(const e of patch.edits){const loc=replay.locations.find(x=>x.name===e.location);let body=core.shift(replay.lines[loc[e.field]],5);assert.equal(body.split(e.old).length-1,e.count);body=body.split(e.old).join(e.new);replay.lines[loc[e.field]]=core.shift(body,-5);}
assert(core.serialize(replay).equals(afterRaw),'Patch replay differs from candidate.');
const body=(doc,name)=>{const l=doc.locations.find(x=>x.name===name);return core.shift(doc.lines[l.body],5);};
const changed=[];
for(let i=0;i<before.locations.length;i++)for(const f of ['desc','body'])if(before.lines[before.locations[i][f]]!==after.lines[after.locations[i][f]])changed.push(before.locations[i].name+':'+f);
assert.deepEqual(changed,['init_game:body','next_day:body','end_day_screen:body','interaction:body']);
const roles=['slave','assistant','room1','room2','room3','room4'],base='semen_gain[max(0, tentacle_size - spawn_milked)]';
const fields=new Map(changed.map(s=>[s.split(':')[0],body(after,s.split(':')[0])]));
const oldEntries=core.entries(before),newEntries=core.entries(after),dialogueChanges=[];
let specialCount=0,normalQuantityCount=0;
for(const location of fields.keys()){
 const a=oldEntries.filter(e=>e.location===location&&e.field==='body'&&e.dialogue),b=newEntries.filter(e=>e.location===location&&e.field==='body'&&e.dialogue);
 assert.equal(a.length,b.length);
 const replacements=[];
 for(let i=0;i<a.length;i++)if(a[i].text!==b[i].text){
  core.validateMarkup(b[i].text);
  const expr=[...b[i].text.matchAll(/<<([\s\S]*?)>>/g)].map(m=>m[1]);
  if(a[i].text==='%명기착정성공'){
   assert.equal(expr.length,3);assert(/^\$(?:slave|assistant|room[1-4]|dynslave)_name$/.test(expr[0]));
   const role=expr[0].slice(1,-5);
   if(location==='end_day_screen'){assert(roles.includes(role));assert.equal(expr[1],"jo9_tentacle_report['"+role+"_gain']");assert.equal(expr[2],"jo9_tentacle_report['"+role+"_bonus']");}
   else{assert.equal(location,'interaction');assert(['dynslave','assistant','slave'].includes(role));assert.equal(expr[1],base+' * (12 + tentacle_size) / 10');assert.equal(expr[2],'20 + tentacle_size * 10');}
   const expected=prepared.sourceProse.replace('<<$slave_name>>','<<'+expr[0]+'>>').replace('[실제 획득량]','<<'+expr[1]+'>>').replace('[증가율]','<<'+expr[2]+'>>');
   assert.equal(b[i].text,expected,'Special text differs from the supplied user template.');
   specialCount++;
  }else{
   assert.equal(location,'end_day_screen');const role=expr[0].slice(1,-5);assert(roles.includes(role));
   assert.equal(b[i].text,a[i].text.replace('<<'+base+'>>',"<<jo9_tentacle_report['"+role+"_gain']>>"));
   normalQuantityCount++;
  }
  replacements.push({a:a[i],b:b[i]});
  dialogueChanges.push({location,oldLine:a[i].line,newLine:b[i].line,kind:a[i].text==='%명기착정성공'?'special-user-template':'ordinary-quantity-only'});
 }
 let restored=fields.get(location);
 for(const r of replacements.reverse())restored=restored.slice(0,r.b.start)+r.a.text.split(r.b.quote).join(r.b.quote+r.b.quote)+restored.slice(r.b.end);
 fields.set(location,restored);
}
assert.equal(specialCount,9);assert.equal(normalQuantityCount,6);assert.equal(dialogueChanges.length,15);
let next=fields.get('next_day'),report=fields.get('end_day_screen'),manual=fields.get('interaction'),init=fields.get('init_game');
const one=(s,a,b)=>{assert.equal(s.split(a).length-1,1,'Unexpected match count for an allowed edit.');return s.replace(a,b);};
for(const role of roles){
 const outer="\tif "+role+"['sub_tentacles'] > tentacle_size or "+role+"['virginity'] = 4:";
 assert.equal(body(before,'end_day_screen').split(outer).length-1,1);
 assert.equal(body(after,'end_day_screen').split(outer).length-1,1);
 const bonus="\t\t\tjo9_tentacle_report['"+role+"_bonus'] = iif("+role+"['virginity'] = 4, 20 + tentacle_size * 10, 0)\r\n";
 const gain="\t\t\tjo9_tentacle_report['"+role+"_gain'] = "+base+" * (100 + jo9_tentacle_report['"+role+"_bonus']) / 100\r\n";
 next=one(next,bonus,'');next=one(next,gain,'');
 next=one(next,"\t\t\tspawn_semen += jo9_tentacle_report['"+role+"_gain']","\t\t\tspawn_semen += "+base);
 const fallback="! JO9 MOD START MEIKI_REPORT_FALLBACK_"+role.toUpperCase()+" | 2026-10-23_meiki_size_yield\r\n\t\tif jo9_tentacle_report['"+role+"_gain'] <= 0:\r\n\t\t\tjo9_tentacle_report['"+role+"_gain'] = "+base+"\r\n\t\t\tjo9_tentacle_report['"+role+"_bonus'] = 0\r\n\t\tend\r\n! JO9 MOD END MEIKI_REPORT_FALLBACK_"+role.toUpperCase()+"\r\n";
 report=one(report,fallback,'');
 report=one(report,"\t\tif jo9_tentacle_report['"+role+"_bonus'] > 0:","\t\tif "+role+"['virginity'] = 4:");
 report=one(report,"\t\tdecade_semen += jo9_tentacle_report['"+role+"_gain']","\t\tdecade_semen += "+base);
}
for(const role of ['dynslave','assistant','slave']){
 const tabs=role==='dynslave'?'\t\t\t\t':'\t\t\t';
 manual=one(manual,tabs+'spawn_semen += '+base+" * iif("+role+"['virginity'] = 4, 12 + tentacle_size, 10) / 10",tabs+'spawn_semen += '+base);
}
const reset="killvar 'jo9_tentacle_report'\r\n";
next=one(next,reset,'');init=one(init,reset,'');
const strip=s=>s.replace(/^! JO9 MOD (?:START|END) MEIKI_[^\r\n]*(?:\r\n|\n|$)/gm,'');
fields.set('next_day',strip(next));fields.set('end_day_screen',strip(report));fields.set('interaction',strip(manual));fields.set('init_game',strip(init));
for(const [name,restored] of fields)assert.equal(restored,body(before,name),'Non-allowlisted change remains in '+name);
const codeAfter=after.locations.map(l=>core.shift(after.lines[l.body],5)).join('\n');
assert.equal((codeAfter.match(/killvar 'jo9_tentacle_report'/g)||[]).length,2);
assert.equal((body(after,'next_day').match(/killvar 'jo9_tentacle_report'/g)||[]).length,1);
assert(body(after,'next_day').indexOf("killvar 'jo9_tentacle_report'")<body(after,'next_day').indexOf("jo9_tentacle_report['slave_bonus']"));
const keys=[...new Set([...codeAfter.matchAll(/jo9_tentacle_report\['{1,2}([^']+)'{1,2}\]/g)].map(m=>m[1]))].sort();
assert.deepEqual(keys,roles.flatMap(r=>[r+'_gain',r+'_bonus']).sort());
const results=[12,18,24,64,126].map((n,size)=>Math.trunc(n*(12+size)/10));assert.deepEqual(results,[14,23,33,96,201]);
assert.equal(core.hash(fs.readFileSync(baselinePath)),before.hash);assert.equal(core.hash(fs.readFileSync(candidatePath)),after.hash);
const review={schema:1,status:'STATIC_REVIEW_PASS',reviewer:'independent pronoun_audit_method agent',baseline:{path:baselinePath,sha256:before.hash},candidate:{path:candidatePath,sha256:after.hash},patchEdits:20,locationCount:after.locations.length,changedFields:changed,verifiedCounts:{awards:9,automaticStatistics:6,specialUserTemplateTexts:specialCount,ordinaryQuantityOnlyTexts:normalQuantityCount,reportArrays:1,reportKeys:keys.length,resets:2},checks:{byteRoundtrip:true,patchReplayExact:true,locationOrderUnchanged:true,allUnrelatedFieldsUnchanged:true,inverseAllowedChangesEqualsBaseline:true,originalOuterSuccessGatesByteIdentical:true,userTemplateExactWithRoleAndNumericSubstitutions:true,ordinaryWordsUnchanged:true,arrayResetBeforeCapture:true,legacyFallbackNoInventoryAward:true,manualActorAndRatioExact:true,baseSlimeGrowthConsumptionQuestAndCapsPreserved:true},initialYields:results,dialogueChanges,limitations:['Static independent review only; native engine and release validation are handled separately by the parent.','Original ordinary growth-threshold failure behavior is deliberately preserved; recorded gain does not widen the outer success gate.','The single global report array can be present in saves until its next initialization/day reset.'],liveWorkWrittenByReviewer:false};
const out=path.join(root,'review');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'independent-review.json'),JSON.stringify(review,null,2)+'\n');
const md='# 독립 후보 검토 — 2026-10-23\n\n결과: STATIC_REVIEW_PASS. 실제 엔진·출고 검사는 별도다.\n\n- 기준본: '+before.hash+'\n- 후보: '+after.hash+'\n- 패치 20개를 기준본에 재생한 결과가 후보와 바이트 단위로 일치한다.\n- location 266개와 순서를 유지하며 init_game·next_day·end_day_screen·interaction의 본문만 변경했다.\n- 보상9·통계6·사용자 특수문구9·일반 자동 수량 치환6을 확인했다. 일반문구의 단어는 같다.\n- 역할별 수식과 캐시 키를 대조했다. 수동 훈련은 dynslave, 수동 지시는 assistant/slave를 사용한다.\n- 보고 배열1개/키12개, 초기화2곳(init_game·next_day), 다음날 캡처 전 초기화를 확인했다. 전역 배열은 초기화 전까지 세이브에 포함될 수 있다.\n- 원래 outer 성공 조건은 바이트 그대로다. 캐시 fallback은 그 안에 있으며 기존 세이브의 누락 값은 기본량·bonus0·일반문구를 사용하고 재지급하지 않는다.\n- 모든 허용 변경을 역변환한 결과 네 본문이 기준본과 완전히 일치한다. 이 대조로 기본표·슬라임 회수·성장·소모·퀘스트·저장 한도 등 나머지 코드의 보존을 확인했다.\n- 일반 역할의 기존 성장 임계치 실패 동작은 유지한다. 캐시를 이유로 성공 조건을 넓히지 않았다.\n- 미착정 크기0–4의 정수 지급량은14/23/33/96/201이다.\n\n원문 대사는 보고서에 복제하지 않았다. 검토자는 라이브 Work를 수정하지 않았다.\n';
fs.writeFileSync(path.join(out,'INDEPENDENT_REVIEW_KO.md'),md,'utf8');console.log(JSON.stringify({status:review.status,before:before.hash,after:after.hash,counts:review.verifiedCounts,reportDir:out},null,2));
