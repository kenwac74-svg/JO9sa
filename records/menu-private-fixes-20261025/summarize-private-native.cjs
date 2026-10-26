'use strict';
// Read-only native evidence checks; writes this task's compact review artifacts only.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const {snapshotRoles,assertRolesPreserved}=require('./private-edits.cjs');
const task='G:/Codex/tmp/menu-private-fixes-20261025',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const milk=task+'/native-private-verified',menu=task+'/native-menu135-verified',control=task+'/native-menu134-control',sourceHash='8b9cf39fe2327079b0823f6e474c93151538a512fa8738ed5f330749a0940db5';
const cssHash='eebc83753cbe894a2b914b4a620449cd4d1e73a8bc053846e6cebd84c351d1df';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),load=p=>sc.parse(fs.readFileSync(p));
const hash=s=>c.hash(Buffer.from(JSON.stringify(snapshotRoles(s))));
const meta=s=>{let v=sc.value(s,'QA_MILK_METRICS')[1];for(let i=0;i<4;i++){try{return JSON.parse(v)}catch(e){v=decodeURIComponent(v)}}throw Error('Invalid milk metrics')};
const field=(s,name)=>{const v=s.vars.find(x=>x.name===name);return v?{values:v.values,idx:v.idx}:null};
function semanticRoundTrip(before,after,scope){
 const a=snapshotRoles(before),b=snapshotRoles(after),differences=[];
 for(const role of Object.keys(a))for(const af of a[role].fields){const bf=b[role].fields.find(x=>x.name===af.name);if(af.sha256===bf.sha256)continue;
  assert(['SLAVE_RATE','ROOM1_RATE','SNK_PARKED_SLAVE'].includes(af.name),scope+' unexpected '+af.name);
  const x=field(before,af.name),y=field(after,af.name);
  if(af.name.endsWith('_RATE')){assert.deepEqual(x.idx,y.idx);const i=x.idx.find(t=>t[1]==='NOTHING')[0],values=y.values.map(t=>t.slice());values[i]=x.values[i].slice();assert.deepEqual(values,x.values,scope+' only RATE[NOTHING] may change');}
  else{assert.equal(a.snk_parked_slave.state,'0');assert.equal(b.snk_parked_slave.state,'0');assert.equal(a.snk_parked_slave.name,'');assert.equal(b.snk_parked_slave.name,'');assert.equal(x,null);const v=Object.fromEntries(y.idx.map(t=>[t[1],y.values[t[0]]]));assert.deepEqual(v,{ERO_RWD_CNT:['1',''],JO9_MEIKI_INITIALIZED:['1',''],JO9_MEIKI_PREV:['0','']});}
  differences.push({scope,name:af.name,before:x,after:y,classification:af.name==='SNK_PARKED_SLAVE'?'Only existing default initialization in an inactive empty temporary role. No actor ownership or attributes are lost.':'Only existing RATE[NOTHING] display-recomputation counter; all other values and name indices are identical.'});bf.sha256=af.sha256;
 }
 assert.deepEqual(differences.map(x=>x.name).sort(),['ROOM1_RATE','SLAVE_RATE','SNK_PARKED_SLAVE']);assert.deepEqual(a,b,scope+' all other 23-schema fields and actor state must match');return differences;
}
const report={status:'PASS',sourceHash,originalCssUnchanged:true,roleSnapshotsPreserved:true,roleSchemaEntries:23,cases:[],ignoredNamedDifferences:[],limits:['Native FastQSP QtWebKit synthetic DOM click events, not physical mouse input.','Only report links, native close and existing room/profile/menu navigation are selected; no training or production action executes.','Diagnostic sessionStorage stores only per-process test progress across cached HTML reloads. No gameplay persistence key or source modification is added.','Source save files are read to prime isolated copies. This is not a claim of GUI native save-file loading compatibility.']};
assert.equal(c.hash(fs.readFileSync(task+'/candidate-final.qsp')),sourceHash);
assert.equal(c.hash(fs.readFileSync(game+'/css/base.css')),cssHash);
const prepared=json(milk+'/prepared.json');assert.equal(prepared.sourceHash,sourceHash);assert.equal(prepared.cases.length,7);
const results=json(milk+'/client-results.json');assert.equal(results.length,7);
const evidence=path.join(__dirname,'private-native-logs');fs.mkdirSync(evidence,{recursive:true});
for(const p of prepared.cases){
 const r=results.find(x=>x.name===p.name);assert(r&&r.pass,p.name+' engine marker');
 assert.equal(c.hash(fs.readFileSync(milk+'/css/base.css')),cssHash);
 const before=load(milk+'/'+p.name+'-before.sav'),after=load(milk+'/'+p.name+'-after.sav');
 assert.equal(before.vars.find(v=>v.name==='SLAVE_VARS').values.length,23);assertRolesPreserved(before,after);
 const m=meta(after);assert.equal(m.quantityMatched,true);assert.equal(m.closed,true);assert.equal(m.closeHit,true);assert.equal(m.closeHref,'api/closemsg');
 assert(new RegExp('\\(\\s*'+p.quantity+'\\s*\\)').test(m.quantityText));
 assert.equal(sc.value(after,'QA_MILK_CONTINUED')[0],'1');assert.equal(sc.value(after,'QA_MILK_UI_CLOSED')[0],'1');
 const log=fs.readFileSync(milk+'/'+p.name+'-stderr.log','utf8'),open=log.indexOf('msg $'+p.role+'_milk_quantity'),close=log.indexOf('http://qspgame.local/api/closemsg'),metrics=log.indexOf('exec:qa_milk_ui_closed=1'),marker=log.indexOf(p.marker);
 assert(open>=0&&close>open&&metrics>close&&marker>metrics,p.name+' original report, real close, no-message continuation and marker order');
 assert.equal(log.split('http://qspgame.local/api/closemsg').length-1,1,p.name+' closes once');assert(!log.includes('FAIL_PRIVATE_'));
 const item={name:p.name,pass:true,quantity:p.quantity,quantityText:m.quantityText,closeRect:m.closeRect,closeHit:true,closed:true,originalReportAndCloseOrder:true,realNativeCloseClicks:1,beforeRoleHash:hash(before),afterRoleHash:hash(after),roleSnapshotsPreserved:true,schemaEntries:23,durationMs:r.durationMs};
 if(p.bridge){const initial=load(milk+'/'+p.name+'-initial.sav'),returned=load(milk+'/'+p.name+'-returned.sav');report.ignoredNamedDifferences.push(...semanticRoundTrip(initial,returned,p.name));item.initialRoleHash=hash(initial);item.returnedRoleHash=hash(returned);item.roundTripStrictRoleHashesPreserved=false;item.roundTripNamedDifferences=3;item.originalRoomReturn=true;assert.equal(sc.value(returned,'SNK_ROOM_TARGET')[0],'0');assert.equal(sc.value(returned,'SNK_ROOM_INVENTORY')[0],'0');assert.equal(sc.value(returned,'SNK_PARKED_SLAVE_STATE')[0],'0');}
 report.cases.push(item);fs.writeFileSync(evidence+'/'+p.name+'-stderr.log',log);
}
const mp=json(menu+'/prepared.json');assert.equal(mp.sourceHash,sourceHash);assert.equal(mp.originalCss,true);assert.equal(mp.actions,0);
assert.equal(c.hash(fs.readFileSync(menu+'/css/base.css')),cssHash);const mr=json(menu+'/client-results.json');assert.equal(mr.length,1);assert(mr[0].pass);
const initial=load(menu+'/menu135-initial.sav'),entered=load(menu+'/menu135-entered.sav'),returned=load(menu+'/menu135-returned.sav');
const cp=json(control+'/prepared.json');assert.equal(cp.sourceHash,'38aaaaa5e7c424ec0f9b0b22f125bc2ca4966392ea42f982750375c4d982c0ed');assert.equal(cp.requestedMenu,134);assert(json(control+'/client-results.json')[0].pass);
const ci=load(control+'/menu135-initial.sav'),cr=load(control+'/menu135-returned.sav');assertRolesPreserved(initial,ci);assertRolesPreserved(returned,cr);
report.ignoredNamedDifferences.push(...semanticRoundTrip(initial,returned,'menu-navigation'));
report.strictRoleHashesAllCases=false;report.roleSnapshotsPreservedMeaning='Semantic preservation of owned actor state. All seven report-before/report-after pairs are strictly identical across all23 schema entries. The room-report round trip and menu135 round trip each differ only in RATE[NOTHING] and three default fields in an inactive empty parked role. The unmodified-baseline menu134 control exhibits these same named changes; menu135 also matches its complete before and after snapshots exactly. This review normalization is not applied to game data.';
report.control={name:'unmodified-baseline-menu134',pass:true,sourceHash:cp.sourceHash,initialRoleHash:hash(ci),returnedRoleHash:hash(cr),exactSameBeforeAndAfterAsNewMenu135:true,namedDifferences:semanticRoundTrip(ci,cr,'baseline-menu134')};
assert.equal(sc.value(entered,'MENU_FORM')[0],'135');assert.equal(sc.value(entered,'SNK_ROOM_TARGET')[0],'1');
for(const k of ['SNK_ROOM_TARGET','SNK_ROOM_INVENTORY','SNK_PARKED_SLAVE_STATE'])assert.equal(sc.value(returned,k)[0],'0');
const ml=fs.readFileSync(menu+'/menu-navigation-stderr.log','utf8');assert(ml.includes("menu_form = 135"));assert(ml.includes("'inventory_close'"));assert(ml.includes('JO9_QA_PRIVATE_menu_navigation_COMPLETE'));assert(!/Link clicked[^\r\n]*(?:interaction\s*=|gt\s+'interaction')/i.test(ml));
report.cases.push({name:'menu-navigation',pass:true,originalRoomPortrait:true,enteredMenu135:true,trainingActionExecuted:false,originalProfileCloseAndRoomReturn:true,initialRoleHash:hash(initial),returnedRoleHash:hash(returned),roleSnapshotsPreserved:true,strictRoleHashesPreserved:false,namedDifferences:3,unmodifiedControlExactlyEqual:true,schemaEntries:23,durationMs:mr[0].durationMs});fs.writeFileSync(evidence+'/menu-navigation-stderr.log',ml);fs.writeFileSync(evidence+'/menu134-control-stderr.log',fs.readFileSync(control+'/menu-navigation-stderr.log'));
report.summary={passed:report.cases.length,total:report.cases.length,milkPaths:7,menu135Paths:1,baselineMenu134Controls:1,allNativeClosesOnce:true,allOwnedActorAttributesPreserved:true,milkAll23SchemaStrictlyPreserved:true,menu135MatchesBaselineControl:true,strictRoleHashesAllCases:false,originalCssSha256:cssHash};
fs.writeFileSync(__dirname+'/private-native-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.summary));
