'use strict';
const fs=require('node:fs'),z=require('node:zlib'),cp=require('node:child_process'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/jo9-trait-overview-20261025',rec=repo+'/records/trait-overview-ui-20261025',src=__dirname;
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const id='2026-10-25_trait_overview_ui',phase=process.argv[2],cr=s=>s.replace(/\r?\n/g,'\r\n');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const get=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),set=(d,n,s)=>d.lines[d.locations.find(l=>l.name===n).body]=c.shift(cr(s),-5);
function add(d,name,body){assert(!d.locations.some(l=>l.name===name));d.lines[3]=c.shift(String(d.locations.length+1),-5);d.lines.splice(d.lines.length-1,0,c.shift(name,-5),c.shift('',-5),c.shift(cr(body),-5),c.shift('0',-5));return c.parse(c.serialize(d));}
function inventory(){return [game+'/jack.qsp',game+'/css/base.css',game+'/FastQSP.ini',game+'/../FastQSP.ini','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/css/base.css',...fs.readdirSync(game+'/save').filter(n=>/\.sav$/i.test(n)).map(n=>game+'/save/'+n)].filter(fs.existsSync).map(path=>({path,sha256:c.hash(fs.readFileSync(path))}));}
if(phase==='prepare'){
 assert(!fs.existsSync(tmp),'Task temp exists');fs.mkdirSync(tmp+'/patches',{recursive:true});fs.mkdirSync(rec+'/scripts',{recursive:true});fs.mkdirSync(rec+'/evidence',{recursive:true});
 const raw=fs.readFileSync(game+'/jack.qsp');assert.deepEqual(c.serialize(c.parse(raw)),raw);qa.inspectWorld(raw);
 fs.writeFileSync(tmp+'/before.qsp',raw);fs.writeFileSync(rec+'/before.qsp.gz',z.gzipSync(raw,{level:9}));assert.deepEqual(z.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz')),raw);
 write(rec+'/inputs.json',inventory());fs.copyFileSync(src+'/PLAN_KO.md',rec+'/PLAN_KO.md');
 fs.copyFileSync(src+'/PLAN_KO.md',repo+'/docs/superpowers/plans/2026-10-25-trait-overview.md');
 const doc=c.parse(raw),missing={newHelper:!doc.locations.some(l=>l.name==='jo9_traits_view'),slaveHeading:!get(doc,'slave_stat').includes("'jo9_traits_view'"),assistantHeading:!get(doc,'assistant_stat').includes("'jo9_traits_view'")};
 assert(Object.values(missing).every(Boolean));write(rec+'/red-baseline.json',{expected:'FAIL before feature',missing,baseline:c.hash(raw)});
 console.log(JSON.stringify({prepared:true,baseline:c.hash(raw),protectedFiles:inventory().length}));
}else if(phase==='build'){
 const baseline=fs.readFileSync(tmp+'/before.qsp');let d=c.parse(baseline);const edits=[];
 function edit(location,old,nw){const body=get(d,location);assert.equal(body.split(old).length-1,1,location+' exact anchor');set(d,location,body.replace(old,nw));edits.push({location,field:'body',old,new:cr(nw),count:1});}
 const begin='! JO9 MOD START UI_TRAIT_OVERVIEW_20261025',end='! JO9 MOD END UI_TRAIT_OVERVIEW_20261025';
 const oldSlave='*p \'<div style="line-height:25%"><br></div>노예의 특성<div style="line-height:5%"><br></div><<$slave_features_list>></div>\'';
 edit('slave_stat',oldSlave,[begin,'*p \'<div style="line-height:25%"><br></div>\'',"gs 'jo9_traits_view', 'sidebar', 'slave', $slave_features_list","*p '</div>'",end].join('\n'));
 const oldAssistant="*nl '조수의 특성'\r\n*nl '<div style=\"line-height:5%\"><br></div><<$assistant_features_list>>'";
 edit('assistant_stat',oldAssistant,[begin,"gs 'jo9_traits_view', 'sidebar', 'assistant', $assistant_features_list",end].join('\n'));
 for(const location of ['slave_stat','assistant_stat']){
  const old=location==='slave_stat'?'*p \'<div id = "info"><<$info_text>></div>\'':'*p \'<div id="info"><<$info_text>></div>\'';
  edit(location,old,[begin,'*p \'<div id="info"><!--J9TV_INFO_BEGIN--><<$info_text>><!--J9TV_INFO_END--></div>\'','*p \'<link rel="stylesheet" href="css/jo9_traits_view.css"><script src="content/js/jo9_traits_view.js"></script>\'',end].join('\n'));
 }
 const traits=get(d,'jo9_traits'),start=traits.indexOf("if $args[0] = 'describe':"),stop=traits.indexOf("\r\nend",start)+5;
 assert(start>=0&&stop>start);const old=traits.slice(start,stop);
 let changed=old.replace("if $args[0] = 'describe':","if $args[0] = 'describe' or $args[0] = 'text':\r\n $result = ''").replace(/: msg /g,': $result = ');
 changed=changed.slice(0,-3)+" if $args[0] = 'describe' and $result ! '': msg $result\r\nend";
 assert.equal(c.literals(old).filter(x=>x.text.length>25).map(x=>x.text).join('\n'),c.literals(changed).filter(x=>x.text.length>25).map(x=>x.text).join('\n'),'Descriptions unchanged');
 edit('jo9_traits',old,begin+'\r\n'+changed+'\r\n'+end);
 const helper=cr(fs.readFileSync(src+'/jo9_traits_view.qsrc','utf8').replace(/^# jo9_traits_view\r?\n/,'').replace(/\r?\n--- jo9_traits_view[^\r\n]*(\r?\n)?$/,''));
 d=add(d,'jo9_traits_view',helper);const candidate=c.serialize(d);qa.inspectWorld(candidate);
 const patch={id,description:'승인된 기존 UI 기반 특성 전체보기. 상태 우선 혼합 목록/실측 넘침 링크/중앙 특성2열+칭호1열/하단 설명. 특성 값·획득·슬롯 제한·세이브 변환은 변경하지 않음.',before_sha256:c.hash(baseline),after_sha256:c.hash(candidate),edits,add_locations:[{name:'jo9_traits_view',desc:'',body:helper,actions:[]}]};
 fs.writeFileSync(tmp+'/candidate.qsp',candidate);write(tmp+'/patches/'+id+'.json',patch);write(rec+'/patch.json',patch);
 fs.copyFileSync(src+'/jo9_traits_view.js',rec+'/scripts/jo9_traits_view.js');fs.copyFileSync(src+'/jo9_traits_view.css',rec+'/scripts/jo9_traits_view.css');fs.copyFileSync(src+'/jo9_traits_view.qsrc',rec+'/scripts/jo9_traits_view.qsrc');
 const before=c.parse(baseline);for(const l of before.locations)if(!['slave_stat','assistant_stat','jo9_traits'].includes(l.name))assert.equal(get(d,l.name),get(before,l.name));
 write(rec+'/build.json',{baseline:c.hash(baseline),candidate:c.hash(candidate),changed:['slave_stat','assistant_stat','jo9_traits'],newLocation:'jo9_traits_view',newActorKeys:0,newAcquisitionRules:0,allOtherLocationsUnchanged:true});
 console.log(JSON.stringify({built:true,baseline:patch.before_sha256,candidate:patch.after_sha256,locations:d.locations.length}));
}else if(phase==='install'){
 const patch=read(rec+'/patch.json'),baseline=fs.readFileSync(tmp+'/before.qsp'),current=fs.readFileSync(game+'/jack.qsp');
 assert.deepEqual(current,baseline,'WORK changed: rebase and revalidate before installation');
 const releaseTemp='G:/Codex/tmp/jo9-trait-overview-release-20261025';
 const reports=fs.readdirSync(releaseTemp).map(n=>releaseTemp+'/'+n+'/report.json').filter(fs.existsSync).map(read);
 const report=reports.find(r=>r.verdict==='PASS'&&r.checks.some(x=>x.name==='inputs-readable'&&x.detail.candidate===patch.after_sha256));assert(report,'Release PASS required');
 assert.equal(read(rec+'/native-focused-results.json').status,'PASS');assert.equal(read(rec+'/browser-results.json').status,'PASS');
 const nativeDom=read(rec+'/native-dom-results.json');assert.equal(nativeDom.status,'PASS');
 assert.equal(nativeDom.productionJsSha256,c.hash(fs.readFileSync(src+'/jo9_traits_view.js')),'Native DOM must validate final JS');
 assert.equal(nativeDom.productionCssSha256,c.hash(fs.readFileSync(src+'/jo9_traits_view.css')),'Native DOM must validate final CSS');
 fs.mkdirSync(game+'/content/js',{recursive:true});
 for(const [from,to] of [['jo9_traits_view.js',game+'/content/js/jo9_traits_view.js'],['jo9_traits_view.css',game+'/css/jo9_traits_view.css']]){
  if(fs.existsSync(to))assert.deepEqual(fs.readFileSync(to),fs.readFileSync(src+'/'+from),'Unexpected existing runtime file '+to);
  fs.copyFileSync(src+'/'+from,to);
 }
 const oldBackups=new Set(fs.readdirSync(game).filter(n=>n.startsWith('jack.qsp.bak_')));
 const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',tmp+'/patches'],{encoding:'utf8',windowsHide:true,timeout:60000,maxBuffer:1024*1024});
 assert.equal(run.status,0,run.stdout+'\n'+run.stderr);assert.deepEqual(fs.readFileSync(game+'/jack.qsp'),fs.readFileSync(tmp+'/candidate.qsp'));
 fs.copyFileSync(rec+'/patch.json',repo+'/mods/'+id+'.json');fs.copyFileSync(report.output+'/report.json',rec+'/release-report.json');
 for(const name of ['application.cjs','focused-native.cjs','browser-qa.cjs','native-dom.cjs','jo9_traits_view.js','jo9_traits_view.css','jo9_traits_view.qsrc'])fs.copyFileSync(src+'/'+name,rec+'/scripts/'+name);
 fs.copyFileSync(src+'/MANUAL_KO.md',rec+'/MANUAL_KO.md');
 for(const p of report.client.probes){const f=report.output+'/client/'+p.name+'-stderr.log';if(fs.existsSync(f))fs.copyFileSync(f,rec+'/evidence/client-'+p.name+'.log');}
 const changed=[];for(const f of read(rec+'/inputs.json'))if(c.hash(fs.readFileSync(f.path))!==f.sha256)changed.push(f.path);
 assert.deepEqual(changed,[game+'/jack.qsp']);
 const newBackups=fs.readdirSync(game).filter(n=>n.startsWith('jack.qsp.bak_')&&!oldBackups.has(n)).map(n=>game+'/'+n);assert.equal(newBackups.length,1);assert.deepEqual(fs.readFileSync(newBackups[0]),baseline);
 write(rec+'/application-result.json',{status:'WORK_APPLIED_UNRELEASED',before:patch.before_sha256,after:patch.after_sha256,changedRuntime:['jack.qsp','css/jo9_traits_view.css','content/js/jo9_traits_view.js'],productionJsSha256:nativeDom.productionJsSha256,productionCssSha256:nativeDom.productionCssSha256,protectedSaveCount:read(rec+'/inputs.json').filter(x=>/\.sav$/i.test(x.path)).length,allOtherProtectedFilesUnchanged:true,newActorKeys:0,newUiGlobalStrings:['$jo9_tv_reopen_key'],traitAcquisitionOrSlotCapsChanged:false,releaseChecks:'PASS',nativeFocused:'PASS',nativeDom:'PASS',browserReplay:'PASS',commit:false,push:false,Full:false,temporaryDuplicateBackups:newBackups,applyLog:run.stdout.trim()});
 console.log(JSON.stringify(read(rec+'/application-result.json')));
}else if(phase==='restore-diagnostics'){
 assert(!fs.existsSync(tmp),'Existing task directory must be reviewed before restoring diagnostics');
 const patch=read(rec+'/patch.json'),baseline=z.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz'));assert.equal(c.hash(baseline),patch.before_sha256);
 fs.mkdirSync(tmp+'/patches',{recursive:true});fs.writeFileSync(tmp+'/before.qsp',baseline);fs.writeFileSync(tmp+'/candidate.qsp',baseline);fs.copyFileSync(rec+'/patch.json',tmp+'/patches/'+id+'.json');
 const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',tmp+'/candidate.qsp','-ModsDir',tmp+'/patches'],{encoding:'utf8',windowsHide:true,timeout:60000,maxBuffer:1024*1024});
 assert.equal(run.status,0,run.stdout+'\n'+run.stderr);assert.equal(c.hash(fs.readFileSync(tmp+'/candidate.qsp')),patch.after_sha256);qa.inspectWorld(fs.readFileSync(tmp+'/candidate.qsp'));
 console.log(JSON.stringify({restoredIsolatedCandidate:true,workWritten:false,candidate:patch.after_sha256}));
}else throw Error('prepare / build / install / restore-diagnostics');
