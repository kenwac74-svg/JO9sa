'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),zlib=require('node:zlib'),cp=require('node:child_process');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/enemy-balance-20261111',record=repo+'/records/enemy-balance-20261111';
const core=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const baseline='a08546afd58aff978c1b29b54ca00dcaf53654981ac8c05d1e7a357e4deceb53',id='2026-11-11_erza_guardian_defense';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\ufeff/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'),hash=p=>core.hash(fs.readFileSync(p)),quote=s=>"'"+s.replaceAll("'","''")+"'";
const body=(d,n)=>core.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
const put=(d,n,s)=>{const l=d.locations.find(l=>l.name===n);assert(l,n);d.lines[l.body]=core.shift(s.replace(/\r?\n/g,'\r\n'),-5);};
const expected={"модификатор_колющий['erza']":-10,"модификатор_рубящий['erza']":-10,"модификатор_дробящий['erza']":-5,"модификатор_огонь['erza']":-5,"модификатор_холод['erza']":-5,"модификатор_психический['erza']":10,"бесстрашный['strazhnik']":1};
const apply=target=>cp.execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-Command',"[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)\r\n& "+quote(repo+'/tools/apply_mods.ps1')+' -Qsp '+quote(target)+' -ModsDir '+quote(tmp+'/mods')],{encoding:'utf8',windowsHide:true});
fs.mkdirSync(record,{recursive:true});fs.mkdirSync(tmp,{recursive:true});
const mode=process.argv[2];
if(mode==='prepare'){
 const raw=fs.readFileSync(game+'/jack.qsp'),doc=core.parse(raw);assert.equal(doc.hash,baseline);assert(core.serialize(doc).equals(raw));assert.equal(hash(repo+'/assets/runtime/2.4.1/jack.qsp'),baseline);
 const backup=tmp+'/before.qsp.gz';assert(!fs.existsSync(backup),'Do not overwrite recovery');const gz=zlib.gzipSync(raw);assert(zlib.gunzipSync(gz).equals(raw));fs.writeFileSync(backup,gz,{flag:'wx'});fs.copyFileSync(repo+'/assets/runtime-source-2.4.1.json',tmp+'/runtime-source-before.json');
 const edits=[];function edit(old,next,patchId){const oldBody=body(doc,'#противники');assert.equal(oldBody.split(old).length-1,1);put(doc,'#противники',oldBody.replace(old,next));edits.push({location:'#противники',field:'body',old,new:next,count:1,patchId});}
 const erzaMark='ERZA_RESISTANCE_20261111';edit("базовый_вред['erza'] = 10","базовый_вред['erza'] = 10\r\n! JO9 MOD START "+erzaMark+"\r\n"+Object.entries(expected).filter(([k])=>k.includes("['erza']")).map(([k,v])=>k+' = '+v).join('\r\n')+'\r\n! JO9 MOD END '+erzaMark,erzaMark);
 const guardianMark='PORTAL_GUARDIAN_MORALE_IMMUNITY_20261111';edit("бесстрашный['strazhnik'] = 0",'! JO9 MOD START '+guardianMark+"\r\nбесстрашный['strazhnik'] = 1\r\n! JO9 MOD END "+guardianMark,guardianMark);
 const candidate=core.serialize(doc),after=core.hash(candidate),structure=qa.inspectWorld(candidate),mod={id,status:'APPROVED',description:'Add the six approved Erza fixed damage modifiers and portal guardian morale-damage immunity; no other combat definitions changed.',before_sha256:baseline,after_sha256:after,edits};
 const prior=core.parse(raw);assert.deepEqual(prior.locations.filter(l=>prior.lines[l.body]!==doc.lines[l.body]).map(l=>l.name),['#противники']);
 fs.mkdirSync(tmp+'/mods',{recursive:true});write(tmp+'/mods/'+id+'.json',mod);write(repo+'/mods/'+id+'.json',mod);fs.writeFileSync(tmp+'/candidate.qsp',candidate);
 write(record+'/prepared.json',{before:baseline,after,edits:2,changedValues:expected,backup,structure,saveSchemaChanged:false,gameplayCodeUnchanged:true});console.log(JSON.stringify({after,structure,edits:2}));
}
if(mode==='replay'){
 const prepared=read(record+'/prepared.json');fs.writeFileSync(tmp+'/replay.qsp',zlib.gunzipSync(fs.readFileSync(prepared.backup)));fs.writeFileSync(record+'/replay.log',apply(tmp+'/replay.qsp'));assert.equal(hash(tmp+'/replay.qsp'),prepared.after);fs.writeFileSync(record+'/reapply.log',apply(tmp+'/replay.qsp'));assert.equal(hash(tmp+'/replay.qsp'),prepared.after);write(record+'/replay.json',{pass:true,after:prepared.after,repeatedApplyUnchanged:true});console.log('Official replay and repeated apply passed.');
}
if(mode==='native'){
 const input=process.argv[3]||tmp+'/candidate.qsp',out=tmp+'/native-'+(process.argv[4]||'candidate');assert(!fs.existsSync(out),'Use a fresh diagnostic output');const raw=fs.readFileSync(input),doc=core.parse(raw),original=doc.lines.slice(),marker='JO9_QA_ENEMYDEFENSE_damage_COMPLETE';
 let start="killall\nusehtml=1\nautosave=0\ndecadesave=0\nsound_on=0\n$onnewloc=''\n$ongload=''\n$counter=''\nsettimer 0\nsnk_room_target=0\ngs '#противники'\nqa_checks=0\n";
 const check=(condition,label)=>"if ("+condition+") = 0: msg 'FAIL_ENEMYDEFENSE_"+label+"' & exit\nqa_checks += 1\n";
 for(const [key,value]of Object.entries(expected))start+=check(key+' = '+value,'definition_'+Object.keys(expected).indexOf(key));
 // True damage calculation location is retained, neutral stance/status avoids random minimum damage.
 start+="atk=0\ndef=1\n$враг[1]='erza'\n$защита[1]=''\n$атака[0]=''\n$jo9_trait_combat_actor=''\n";
 const damages={колющий:20,рубящий:20,дробящий:25,огонь:25,холод:25,психический:40,молния:30};
 for(const [type,want]of Object.entries(damages)){start+="вред_на_рассчет=30\n$рассчетный_тип_вреда='"+type+"'\ngs 'рассчет_вреда'\n";start+=check('нанесенный_вред[0] = '+want,'damage_'+type);}
 start+="qa_case=0\ngt 'боевой_интерфейс'\n";
 put(doc,'Start',start);
 // Keep end-round product body. Replace only final UI renderers with harness dispatch.
 put(doc,'боевое_меню','exit');
 let dispatcher="qa_case += 1\n";
 dispatcher+="if qa_case > 3:\n"+check('qa_checks=23','total')+"msg '"+marker+"'\nexit\nend\n";
 dispatcher+="количество_врагов=1\nтекущий=1\n$враг[1]='strazhnik'\n$класс_врага[1]='элитный'\nвраг[1]=1\nповерженные_враги=0\nздоровье_врага[1]=100\nвыносливость_врага[1]=100\nдух_врага[1]=100\nздоровье_игрока=100\nвыносливость_игрока=100\nдух_игрока=100\n$наложение=''\n$наложение[1]=''\nнанесенный_вред[0]=20\nнанесенный_вред[1]=0\nэто_суперудар=0\n$состояние[1]=''\n";
 dispatcher+="if qa_case=1: $тип_нанесенного_вреда[0]='психический'\nif qa_case=2: $тип_нанесенного_вреда[0]='дробящий'\nif qa_case=3: $тип_нанесенного_вреда[0]='рубящий'\ngt 'конец_раунда'";
 put(doc,'боевой_интерфейс',dispatcher);
 const round=body(doc,'конец_раунда'),last="gs 'боевое_меню'\r\ngt 'боевой_интерфейс'";assert.equal(round.split(last).length-1,1);
 let tail=check('дух_врага[1] = 100','guardian_morale');tail+=check("(qa_case=1 and здоровье_врага[1]=100 and выносливость_врага[1]=100) or (qa_case=2 and здоровье_врага[1]=100 and выносливость_врага[1]=80) or (qa_case=3 and здоровье_врага[1]=80 and выносливость_врага[1]=80)",'guardian_other_resources');tail+=check('враг[1]=1 and поверженные_враги=0','guardian_survives');tail+="gt 'боевой_интерфейс'";
 put(doc,'конец_раунда',round.replace(last,tail));
 const generated=core.serialize(doc);qa.inspectWorld(generated);fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/damage.qsp',generated);fs.copyFileSync(game+'/config.xml',out+'/config.xml');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');write(out+'/plan.json',[{name:'damage',file:out+'/damage.qsp',marker,checkpoint:'23 assertions: 7 definitions, 7 actual fixed-modifier damage calculations, and 3 actual end-round damage types x3 guardian resource/survival checks.'}]);
 write(record+'/native-'+(process.argv[4]||'candidate')+'-instrumentation.json',{input,sourceSha256:core.hash(raw),probeSha256:core.hash(generated),changedLocations:doc.locations.filter(l=>original[l.body]!==doc.lines[l.body]).map(l=>l.name),actualLocations:['#противники','рассчет_вреда','jo9_traits_combat'],roundBody:'Only final render call pair replaced by assertions and dispatcher.',syntheticOnly:true,userSaveLoaded:false,userSaveWritten:false});console.log(out+'/plan.json');
}
if(mode==='install'){
 const p=read(record+'/prepared.json');assert(read(record+'/replay.json').pass);const results=read(tmp+'/native-candidate/client-results.json');assert(results.every(r=>r.pass));assert.equal(hash(game+'/jack.qsp'),p.before);assert.equal(hash(repo+'/assets/runtime/2.4.1/jack.qsp'),p.before);assert.equal(read(repo+'/assets/runtime-source-2.4.1.json').sourceQspSha256,p.before);
 fs.writeFileSync(record+'/apply.log',apply(game+'/jack.qsp'));assert.equal(hash(game+'/jack.qsp'),p.after);fs.copyFileSync(game+'/jack.qsp',repo+'/assets/runtime/2.4.1/jack.qsp');const metaPath=repo+'/assets/runtime-source-2.4.1.json',meta=read(metaPath);meta.sourceQspSha256=p.after;meta.snapshotDate='2026-11-11';for(const x of meta.files)if(x.repositoryPath==='assets/runtime/2.4.1/jack.qsp'){x.sha256=p.after;x.bytes=fs.statSync(game+'/jack.qsp').size;}meta.latestEnemyDefense={date:'2026-11-11',mod:id,report:'records/enemy-balance-20261111/REPORT_KO.md'};write(metaPath,meta);console.log(JSON.stringify({workInstalled:true,sourceAligned:true,hash:p.after}));
}
if(mode==='verify'){
 const p=read(record+'/prepared.json'),raw=fs.readFileSync(game+'/jack.qsp'),doc=core.parse(raw),prior=core.parse(zlib.gunzipSync(fs.readFileSync(p.backup)));assert.equal(doc.hash,p.after);assert.equal(hash(repo+'/assets/runtime/2.4.1/jack.qsp'),p.after);assert.equal(read(repo+'/assets/runtime-source-2.4.1.json').sourceQspSha256,p.after);const changed=prior.locations.filter(l=>prior.lines[l.body]!==doc.lines[l.body]).map(l=>l.name);assert.deepEqual(changed,['#противники']);for(const [key,value]of Object.entries(expected))assert(body(doc,'#противники').includes(key+' = '+value));
 const log=fs.readFileSync(tmp+'/native-installed/damage-stderr.log','utf8');assert(!log.includes('FAIL_ENEMYDEFENSE'));assert.equal((log.match(/showMessage\(\)/g)||[]).length,1);assert(read(tmp+'/native-installed/client-results.json').every(r=>r.pass));
 fs.copyFileSync(tmp+'/native-installed/client-results.json',record+'/native-installed.json');fs.copyFileSync(tmp+'/native-installed/damage-stderr.log',record+'/native-installed-stderr.log');fs.copyFileSync(tmp+'/native-candidate/client-results.json',record+'/native-candidate.json');
 write(record+'/verification.json',{...p,changedLocations:changed,structure:qa.inspectWorld(raw),nativeAssertions:23,workSourceMetadataMatch:true,allOtherLocationBodiesUnchanged:true,saveSchemaChanged:false,userSaveGuiTested:false,fullTouched:false,commit:false,push:false});console.log(JSON.stringify({pass:true,hash:p.after,changedLocations:changed,nativeAssertions:23}));
}
