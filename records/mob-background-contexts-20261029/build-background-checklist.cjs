'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const here=__dirname,work='G:/somi/Jack O Nine Tails v2.4_work/game',repo='G:/somi/JO9sa';
const read=n=>JSON.parse(fs.readFileSync(path.join(here,n),'utf8'));
const raw=fs.readFileSync(work+'/jack.qsp'),sha=c.hash(raw),world=c.parse(raw);
const bodies=new Map(world.locations.map(l=>[l.name,c.shift(world.lines[l.body],5).split(/\r?\n/)]));
const ev=(location,line)=>{assert(bodies.has(location)&&line>0&&line<=bodies.get(location).length,location+':'+line);return{location,line,text:bodies.get(location)[line-1]};};
const unique=a=>a.filter((x,i)=>a.findIndex(y=>y.location===x.location&&y.line===x.line)===i);
const fog=read('fog-contexts.json'),arena=read('arena-contexts.json'),events=read('event-contexts.json');
assert.equal(sha,fog.source.sha256);assert.equal(sha,arena.source.sha256);assert.equal(sha,events.sourceSha256);
const htmlPath=work+'/modtools/catalog/catalog_merge_vs_original.html',html=fs.readFileSync(htmlPath,'utf8');
const manifestRx=/window\.JO9_MOB_SETS\s*=\s*(\{.*?\});\s*<\/script>/s;
const match=html.match(manifestRx);assert(match,'Live catalog MOB manifest');const original=JSON.parse(match[1]);
assert.equal(original.entries.length,78);assert.equal(original.groups.length,8);
const currentJS=fs.readFileSync(repo+'/tools/mob-image-sets/catalog-mob-sets.js','utf8'),candidateJS=fs.readFileSync(path.join(here,'catalog-mob-sets.candidate.js'),'utf8');
const maps=new Map();
function add(key,ctx){if(!maps.has(key))maps.set(key,[]);maps.get(key).push(ctx);}
const fogBg=fog.contextEvidence.battleBackground.path;
const fogSceneLine=bodies.get('#place_base').findIndex(t=>/\$bg\['edge_patrol'\]/.test(t));
const fogScene=fogSceneLine>=0?ev('#place_base',fogSceneLine+1):null;
const fogSceneMatch=fogScene?.text.match(/=\s*['"]([^'"]+)['"]/);
const fogSceneExpression=fogSceneMatch?'content/pic/bg/'+fogSceneMatch[1]+'.png':null;
const fogScenePath=fogSceneExpression?.includes('<<rand(1,2)>>')?[1,2].map(n=>fogSceneExpression.replace('<<rand(1,2)>>',String(n))):fogSceneExpression;
for(const row of fog.entries){
 const cases=fog.cases.filter(x=>row.encounters.includes(x.interactionCity));
 const evidence=unique([...cases.flatMap(x=>x.evidence.filter(y=>/\$враг|\$вр\[|\$place/.test(y.code)).map(y=>ev('interaction_city',y.line))),...fog.contextEvidence.battleBackground.lines.map(n=>ev('боевой_интерфейс',n)),...fog.contextEvidence.resultBackground.lines.map(n=>ev('конец_боя',n)),...(fogScene?[fogScene]:[])]);
 add(row.key,{id:'fog_border_battle',kind:'fog',label:'안개경계 정찰 전투',environment:'안개경계의 숲',place:'edge_patrol',battleBackground:fogBg,resultBackground:fogBg,sceneBackground:fogScenePath,sceneBackgroundExpression:fogSceneExpression,condition:'interaction_city='+row.encounters.join('/')+'; $place=edge_patrol',encounters:row.encounters,status:'verified-static-qsp',evidence});
}
for(const ctx of arena.contexts){
 const place=ctx.kind==='catfight'?'catfightclub':ctx.kind==='arena_training'?'colosseum':'colosseum_arena';
 const bgLine=bodies.get('#place_base').findIndex(t=>t.includes("$bg['"+place+"']"));
 const bgEv=bgLine>=0?ev('#place_base',bgLine+1):null,bgMatch=bgEv?.text.match(/=\s*['"]([^'"]+)['"]/);
 for(const key of ctx.enemyKeys){
  const ownEvidence=ctx.evidence.filter(x=>x.text.includes("'"+key+"'")||/fight_return|arena_mode|interaction_city = 12801|interaction_city = 199/.test(x.text));
  add(key,{id:ctx.id,kind:ctx.kind,label:ctx.label,environment:ctx.background.environment,place,battleBackground:ctx.background.runtime,resultBackground:ctx.background.runtime,sceneBackground:ctx.background.sceneReference||(bgMatch?'content/pic/bg/'+bgMatch[1]+'.png':null),condition:ctx.condition,status:'verified-static-qsp',notes:[ctx.background.note,ctx.selectorNote].filter(Boolean),evidence:unique([...ownEvidence,...ctx.background.runtimeEvidence,...(bgEv?[bgEv]:[])].map(x=>ev(x.location,x.line)))});
 }
}
for(const row of events.entries){
 add(row.enemyKey,{id:row.contextId,kind:'event',label:row.labelKo,environment:row.labelKo.replace('와의 이벤트 결투',' 결투 장소').replace('이벤트 전투','이벤트 장소'),place:row.place,battleBackground:row.actualBattleBackground,resultBackground:row.actualResultBackground,sceneBackground:row.sceneBackground.declaredPath,condition:Object.entries(row.runtimeSelector).map(([k,v])=>k+'='+v).join('; '),status:'verified-static-qsp',notes:[...row.notes,'현재 전투 렌더러는 장소 배경 대신 공통 fight.png를 선택한다. 장소에 맞는 합성 원본은 전투 전 장소 배경을 기준으로 검토한다.'],evidence:unique([...row.evidence,...row.sceneBackground.definitions,...events.renderer.battleEvidence].map(x=>ev(x.location,x.line)))});
}
const variantBase=new Map();
for(const line of bodies.get('colosseum_fight'))for(const m of line.matchAll(/\$силуэт_моба\['([^']+)'\]\s*=\s*"([^"]+)"/g))variantBase.set(m[2].replaceAll('\\','/'),m[1]);
const rows=original.entries.map(entry=>{
 const baseKey=entry.key.startsWith('variant:')?variantBase.get(entry.standing.path):entry.key;
 assert(baseKey,'Unmapped variant '+entry.key);const contexts=maps.get(baseKey);assert(contexts?.length,'Unmapped context '+entry.key);
 const notes=[];
 if(entry.key==='kimerian_e')notes.push('확인된 배경 불일치: 전투 전신 gladiator_kimerian_5.png는 숲 배경이지만 QSP 출전 장소는 콜로세움이다. 기존 배경 유지 원칙의 수정 예외로 등록. 아직 이미지 교체하지 않음.');
 if(entry.portrait?.path==='content/pic/mob/spawn_ava.png')notes.push('초상 spawn_ava.png를 안개경계 3종과 아레나 1종이 공유한다. 장소별 초상 배경을 적용할 때는 파일과 연결을 분리해야 한다. 전신·패배는 spawn/gladiator_spawn으로 이미 분리됨.');
 if(contexts.some(x=>x.kind==='catfight'||x.kind==='event'))notes.push('전투 전 장소 배경과 실제 전투 렌더러 배경을 구분해 기록함. 공통 fight.png가 해당 장소의 권장 합성 배경이라는 뜻은 아님.');
 return{key:entry.key,enemyKey:baseKey,name:entry.name,appearanceContexts:contexts,backgroundNotes:notes,slots:Object.fromEntries(['portrait','standing','defeat'].filter(k=>entry[k]).map(k=>[k,{path:entry[k].path,runtimePath:entry[k].runtimePath||entry[k].path}]))};
});
const groups=original.groups.map(g=>{
 const contexts=[...new Map(g.members.flatMap(m=>maps.get(m.key)||[]).map(x=>[x.id,x])).values()];assert(contexts.length,g.key);
 const e=bodies.get('jo9_battle_fate').findIndex(t=>t.includes(g.path));assert(e>=0,g.key+' selector');
 return{key:g.key,name:g.name,appearanceContexts:contexts.map(x=>({...x,evidence:unique([...x.evidence,ev('jo9_battle_fate',e+1)])})),backgroundNotes:['단체전은 단체 컷신 한 장의 배경을 해당 전투 장소에 맞춘다. 기존 배경이 올바른 컷은 유지한다.'],path:g.path};
});
const assets=new Map();for(const r of rows)for(const [slot,a]of Object.entries(r.slots)){if(!assets.has(a.path))assets.set(a.path,[]);assets.get(a.path).push({key:r.key,enemyKey:r.enemyKey,slot,contextIds:r.appearanceContexts.map(x=>x.id)});}
const sharedAssets=[...assets].filter(([,u])=>u.length>1).map(([assetPath,uses])=>({path:assetPath,uses,contextIds:[...new Set(uses.flatMap(x=>x.contextIds))],needsContextSplit:new Set(uses.flatMap(x=>x.contextIds)).size>1}));
const summary={entries:rows.length,groups:groups.length,byKind:Object.fromEntries([...new Set(rows.flatMap(x=>x.appearanceContexts.map(y=>y.kind)))].map(k=>[k,rows.filter(r=>r.appearanceContexts.some(x=>x.kind===k)).length])),unmapped:0,sharedAssets:sharedAssets.length,multiContextSharedAssets:sharedAssets.filter(x=>x.needsContextSplit).length};
const data={schema:'jo9-mob-background-contexts-v1',checkedAt:'2026-10-29',source:{world:work+'/jack.qsp',sha256:sha,locations:world.locations.length},verification:'Current compiled QSP static path/selector audit. Not a manual playtest and not a background image replacement.',policy:{preserveExistingCorrectBackgrounds:true,repairConfirmedWrongBackgrounds:true,transparentCutouts:'합성 대상. 인물의 잘린 면을 화면 외곽에 맞추고 최종 795×596 불투명 컷으로 구성.',sharedFiles:'초상/전신/패배 경로별로 사용 문맥을 대조한다. 초상 프레임 분류는 등장 장소 근거로 사용하지 않는다.',saveCompatibility:'이 기록은 런타임 QSP·인물 ID·저장 변수·SAV를 변경하지 않는다. 추후 실제 연결 변경 때는 기존 전투 중 세이브 캐시를 별도 확인한다.'},summary,entries:rows,groups,sharedAssets,dynamicContexts:events.dynamicContexts,excludedRaceFiles:original.excludedRaceFiles,nonBattleSharedUses:fog.sharedSpawn.nonBattleUses,selectedArenaReview:{path:'C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/output/colosseum-common-bg-20261029/colosseum_common_bg_arena_reference_795x596_review.png',status:'사용자 선택 시안; 이번 작업에서 이미지 미적용'}};
const updated=structuredClone(original);for(const entry of updated.entries){const row=rows.find(r=>r.key===entry.key);entry.appearanceContexts=row.appearanceContexts;entry.backgroundNotes=row.backgroundNotes;}for(const group of updated.groups){const row=groups.find(r=>r.key===group.key);group.appearanceContexts=row.appearanceContexts;group.backgroundNotes=row.backgroundNotes;}
updated.backgroundContextAudit={schema:data.schema,checkedAt:data.checkedAt,sourceSha256:sha,summary,document:'docs/MOB_BACKGROUND_CONTEXTS_KO.md'};
const strip=x=>{const t=structuredClone(x);delete t.backgroundContextAudit;for(const v of [...t.entries,...t.groups]){delete v.appearanceContexts;delete v.backgroundNotes;}return t;};assert.deepEqual(strip(updated),original,'Protect all existing slot/work/progress metadata');
const encoded=JSON.stringify(updated).replaceAll('<','\\u003c');
let next=html.replace(match[1],()=>encoded);assert.notEqual(next,html);
const start='/* JO9 MOD START MOB_SET_CATALOG_20261028',end='/* JO9 MOD END MOB_SET_CATALOG_20261028 */';
const a=next.indexOf(start),b=next.indexOf(end,a);assert(a>=0&&b>a&&next.indexOf(start,a+1)===-1,'One existing inline consumer');
const oldInline=next.slice(a,b+end.length);assert.equal(oldInline.replace(/\r\n/g,'\n').trim(),currentJS.replace(/\r\n/g,'\n').trim(),'Inline and tracked consumer agree before edit');
next=next.slice(0,a)+candidateJS.trimEnd()+next.slice(b+end.length);
const mask=t=>{const j=t.match(manifestRx);const x=t.replace(j[1],'__MOB_MANIFEST__'),s=x.indexOf(start),e=x.indexOf(end,s);return x.slice(0,s)+'__MOB_CONSUMER__'+x.slice(e+end.length);};assert.equal(mask(next),mask(html),'Preserve all other catalog content and manual status');
fs.writeFileSync(path.join(here,'background-contexts.candidate.json'),JSON.stringify(data,null,2)+'\n');
fs.writeFileSync(path.join(here,'catalog.candidate.html'),next);
fs.writeFileSync(path.join(here,'before-mob-manifest.json'),JSON.stringify(original,null,2)+'\n');
fs.writeFileSync(path.join(here,'before-catalog-mob-sets.js'),currentJS);
const esc=x=>String(x??'').replaceAll('|','\\|').replaceAll('\n',' '),short=p=>Array.isArray(p)?p.map(short).join(' / '):p?.replace('content/pic/','')||'없음';
let md='# 전투 MOB 등장 장소·배경 체크리스트\n\n기준: 2026-10-29 현재 WORK QSP `'+sha+'`. 정적 경로 조사이며 실제 플레이 전수검증과 구분한다.\n\n';
md+='이미 배경이 있는 올바른 컷은 유지한다. 투명 컷은 장소에 맞게 합성하며, `kimerian_e`처럼 확인된 잘못된 배경은 수정 예외로 관리한다. 이번 작업은 기록과 체크리스트 표시만 갱신하며 QSP·PNG·SAV를 교체하지 않는다.\n\n';
md+='## 장소와 렌더러를 구분하는 기준\n\n- 콜로세움 검투 대회 32종, 대련 이미지 변형 14종, 캣파이트 3종, 안개경계 24종, 고유 이벤트 5종: 체크리스트 78항목 전부 연결. 단체 8세트 별도 연결.\n- 장소 배경은 전투 준비 화면의 선언값이다. 실제 전투·결과 배경은 `боевой_интерфейс`/`конец_боя`의 선택값이다. 불투명 MOB 그림은 이 부모 배경을 가릴 수 있다.\n- 현재 캣파이트와 이벤트 전투는 전용 장소 배경이 있어도 공통 `ui/grimdark/bg/fight.png`를 선택한다. 이것을 해당 장소의 권장 합성 원본으로 오인하지 않는다.\n- 초상 프레임 분류는 등장 장소 분류가 아니다. 경주 전용 초상은 전투·패배 컷 제작 대상에서 계속 제외한다.\n\n';
md+='## 항목별 제작 정보\n\n|이름·키|전투 구분 / 장소|배경 기준|현재 실제 전투 배경|전투 전 장소 배경|QSP 출전 근거|\n|---|---|---|---|---|---|\n';
for(const r of rows){const x=r.appearanceContexts[0],e=x.evidence.find(y=>y.text.includes("'"+r.enemyKey+"'"))||x.evidence[0];md+='|'+[r.name+' · `'+r.key+'`',x.label+' / `'+x.place+'`',x.environment,'`'+short(x.battleBackground)+'`','`'+short(x.sceneBackground)+'`','`'+e.location+':'+e.line+'`'].map(esc).join('|')+'|\n';}
md+='\n## 단체 컷신\n\n|세트|등장 장소|패배 파일|\n|---|---|---|\n';for(const g of groups)md+='|'+[g.name,g.appearanceContexts.map(x=>x.label).join(' / '),'`'+short(g.path)+'`'].map(esc).join('|')+'|\n';
md+='\n## 우선 확인할 공유·오류 경로\n\n- `spawn_ava.png`: 안개 3종과 아레나 1종이 공유하는 초상. 장소별 초상 배경에는 파일·연결 분리가 필요하다. 전신·패배는 이미 `spawn.png`/`gladiator_spawn.png`로 나뉜다. 트로피룸 아이콘 사용도 보존해야 한다.\n- `kimerian_e`: `gladiator_kimerian_5.png`에 숲 배경이 있으나 출전은 콜로세움이다. **배경 수정 필요, 미적용**. 기존 배경을 무조건 보존하는 항목이 아니다.\n- 캣파이트 일반 상대 `gladiatrix1~3`와 클럽 주인 에게야의 이벤트 결투 `egeya`는 배경 문맥을 분리한다.\n- `$catfighter_setup`의 임시 `gladiatrix*_ava` 키는 interaction103001에서 정식 `gladiatrix1~3`으로 다시 선택한다. 임시 문자열만 보고 출전 오류로 판단하지 않는다.\n- 소유 노예의 야간 습격/교육 중 반격은 고정 MOB 원화가 아닌 현재 인물을 사용하는 동적 전투다. 침실/호출 장소를 별도 문맥으로 유지한다.\n\n';
md+='## 후속 배경 적용 때 사용할 자료\n\n정본: `tools/mob-image-sets/background-contexts.json`. 각 항목의 `appearanceContexts`는 종류·장소·조건·실제 배경·장소 배경·QSP 위치/행을 보존한다. `sharedAssets`는 같은 경로의 여러 용도를 보여준다. 다른 배경이 필요한 공유 경로를 먼저 분리한 뒤 해당 전투 문맥에서 연결해야 한다. 이 기록만으로 이미지 교체 완료나 기존 전투 중 세이브 호환 완료를 의미하지 않는다.\n';
fs.writeFileSync(path.join(here,'MOB_BACKGROUND_CONTEXTS_KO.candidate.md'),md);
const audit={sourceQspSha256:sha,sourceCatalogPath:htmlPath,sourceCatalogSha256:c.hash(Buffer.from(html)),candidateCatalogSha256:c.hash(Buffer.from(next)),sourceConsumerSha256:c.hash(Buffer.from(currentJS)),candidateConsumerSha256:c.hash(Buffer.from(candidateJS)),summary,allExistingMetadataPreserved:true,nonMobCatalogBytesPreserved:true,scope:'Metadata and checklist display/documentation only. No QSP, image, save, release, or completion-state edits.'};
fs.writeFileSync(path.join(here,'candidate-validation.json'),JSON.stringify(audit,null,2)+'\n');console.log(JSON.stringify(audit,null,2));
