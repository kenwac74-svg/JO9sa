'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),z=require('node:zlib');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',rec=repo+'/records/meiki-discovery-popup-20261026',tmp='G:/Codex/tmp/meiki-discovery-popup-20261026';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const expected='e4110fb537108326d0de680efa4a87d286f9b3a6e5bc0b6073e83d13e1ee97f0',id='2026-10-26_meiki_discovery_popup',roles=['slave','assistant','room1','room2','room3','room4'];
const q=s=>"'"+s.replaceAll("'","''")+"'",write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const get=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),set=(d,n,s)=>d.lines[d.locations.find(l=>l.name===n).body]=c.shift(s.replace(/\r?\n/g,'\r\n'),-5);
const popup="msg '[명기]<br><<$jo9_meiki_found_name>>의 숨겨진 재능을 발견했다. 관련 기술에 두각을 드러내며, 일부 거래와 특정 작업에서 남다른 강점을 보인다.'";
const added=/^[ \t]*! JO9 MOD START MEIKI_DISCOVERY_POPUP_[^\r\n]*\r\n[\s\S]*?^[ \t]*! JO9 MOD END MEIKI_DISCOVERY_POPUP_[^\r\n]*\r\n/gm;
const marker=(key,lines)=>['! JO9 MOD START MEIKI_DISCOVERY_POPUP_'+key+' | '+id,...lines,'! JO9 MOD END MEIKI_DISCOVERY_POPUP_'+key].join('\r\n')+'\r\n';
if(process.argv[2]==='prepare'){
 assert(!fs.existsSync(tmp)&&!fs.existsSync(rec+'/patch.json'));fs.mkdirSync(tmp,{recursive:true});fs.mkdirSync(tmp+'/patches');fs.mkdirSync(rec,{recursive:true});
 const before=fs.readFileSync(game+'/jack.qsp');assert.equal(c.hash(before),expected);qa.inspectWorld(before);const d=c.parse(before),edits=[];
 function replace(old,next){const body=get(d,'jo9_meiki_state');assert.equal(body.split(old).length,2);set(d,'jo9_meiki_state',body.replace(old,next));edits.push({location:'jo9_meiki_state',field:'body',old,new:next,count:1});}
 const anchor='! JO9_STATE_V2: state bookkeeping only; args[1]=1 permits the first-transition roll.\r\n';
 replace(anchor,anchor+marker('LOCAL_20261026',['local jo9_meiki_found = 0',"local $jo9_meiki_found_name = ''"]));
 for(const role of roles){const old="   if rand(1, 100) <= 5:\r\n    "+role+"['jo9_meiki_known'] = 1";
  replace(old,'   if rand(1, 100) <= 5:\r\n'+marker(role.toUpperCase()+'_20261026',[
   "    if "+role+"['jo9_meiki_known'] = 0:",'     jo9_meiki_found = 1','     $jo9_meiki_found_name = $'+role+'_name','    end'])+"    "+role+"['jo9_meiki_known'] = 1");
 }
 const tail='! JO9 MOD END J9M3027';replace(tail,marker('MESSAGE_20261026',['if jo9_meiki_found = 1:'," if $jo9_meiki_found_name = '': $jo9_meiki_found_name = '이 인물'",' '+popup,'end'])+tail);
 const after=c.serialize(d);qa.inspectWorld(after);assert(c.serialize(c.parse(after)).equals(after));assert.equal(get(d,'jo9_meiki_state').replace(added,''),get(c.parse(before),'jo9_meiki_state'),'Original conditions, random draws and state writes must be exact');
 assert.equal(d.locations.length,c.parse(before).locations.length);const patch={id,before_sha256:expected,after_sha256:c.hash(after),edits};
 fs.writeFileSync(tmp+'/before.qsp',before);fs.writeFileSync(tmp+'/candidate.qsp',after);fs.writeFileSync(rec+'/before.qsp.gz',z.gzipSync(before));write(rec+'/patch.json',patch);write(tmp+'/patches/'+id+'.json',patch);write(repo+'/mods/'+id+'.json',patch);fs.copyFileSync(__filename,rec+'/reproduce.cjs');
 const protectedFiles=[game+'/save/JO9_GOLD_AP_CHECK_20261026.sav',game+'/config.xml',game+'/FastQSP.ini',game+'/css/base.css',game+'/json/menu_icon.json','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp','G:/somi/JO9O/game/jack.qsp'];write(rec+'/protected.json',protectedFiles.map(file=>({file,sha256:c.hash(fs.readFileSync(file))})));
 write(rec+'/prepared.json',{before:expected,after:c.hash(after),changedLocations:['jo9_meiki_state'],edits:edits.length,newLocations:0,newPersistentKeys:0,localVariables:2,originalCodeExactAfterRemovingAdditions:true,popup,scope:'Only first discovered event notification; no unread state, no balance or generic trait-award helper calls.'});
 console.log(JSON.stringify({candidate:tmp+'/candidate.qsp',hash:c.hash(after),edits:edits.length}));
}else if(process.argv[2]==='probes'){
 const candidate=fs.readFileSync(tmp+'/candidate.qsp'),before=fs.readFileSync(tmp+'/before.qsp'),dir=tmp+'/native';assert(!fs.existsSync(dir));fs.mkdirSync(dir);fs.copyFileSync(game+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 const plan=[],nativePopupPlan=[];
 const init=['killall','settimer 0','usehtml=1','difficulty_setting=0',"CONST_INT['young_age']=0",'qa_notices=0'];
 function setup(role,name='검사 대상') {return ["killvar '"+role+"'",'$'+role+'_name='+q(name),role+"['age']=0",role+"['jo9_meiki_initialized']=1",role+"['jo9_meiki_prev']=0",role+"['jo9_meiki_checked']=0",role+"['jo9_meiki_known']=0",role+"['virginity']=2",role+"['sub_vaginal']=8"]}
 function call(role,arg=1){return "gs 'jo9_meiki_state', "+q(role)+', '+arg}
 function check(condition,label){return 'if '+condition+": msg 'FAIL_MEIKI_POPUP_"+label+"' & exit"}
 function probe(name,raw,start,random,counter=true){const d=c.parse(raw);let body=get(d,'jo9_meiki_state');assert.equal((body.match(/rand\(1, 100\) <= 5/g)||[]).length,6);body=body.replaceAll('rand(1, 100) <= 5',random+' <= 5');if(counter&&body.includes(popup))body=body.replace(popup,"qa_notices += 1\r\n$qa_message = "+popup.slice(4));set(d,'jo9_meiki_state',body);set(d,'Start',start.join('\r\n'));const bytes=c.serialize(d);qa.inspectWorld(bytes);const file=dir+'/'+name+'.qsp';fs.writeFileSync(file,bytes);return file}
 {
  const name='success',marker='JO9_QA_MEIKIPOP_success_COMPLETE',start=[...init];let count=0;
  for(const role of roles){count++;start.push(...setup(role,'검사 '+role),call(role),check('qa_notices ! '+count,role+'_first_count'),check(role+"['jo9_meiki_known'] ! 1 or "+role+"['virginity'] ! 4 or "+role+"['jo9_meiki_initialized'] ! 2",role+'_state'),check(role+"['sub_vaginal'] ! 8",role+'_existing_rank'),check("instr($qa_message, '[명기]<br>검사 "+role+"의 숨겨진 재능') = 0",role+'_name'),call(role),check('qa_notices ! '+count,role+'_repeat'));}
  start.push(...setup('slave',''),call('slave'),check('qa_notices ! 7 or instr($qa_message, \'이 인물의\') = 0','empty_name'),"msg '"+marker+"'");plan.push({name,file:probe(name,candidate,start,5),marker,checkpoint:'Six adult role discoveries and repeat silence, exact role names, existing higher ranks, empty-name fallback.'});
 }
 for(const [name,random,variant,arg]of [['failed',6,'fresh',1],['passive',5,'fresh',0],['backfill',5,'legacy',1],['already-known',5,'known',1],['already-checked',5,'checked',1],['old-nonvirgin',5,'uninitialized',1]]){
  const marker='JO9_QA_MEIKIPOP_'+name.replaceAll('-','_')+'_COMPLETE',start=[...init];
  for(const role of roles){start.push(...setup(role));if(variant==='legacy')start.push(role+"['virginity']=4");if(variant==='known')start.push(role+"['jo9_meiki_known']=1");if(variant==='checked')start.push(role+"['jo9_meiki_checked']=1");if(variant==='uninitialized')start.push(role+"['jo9_meiki_initialized']=0");start.push(call(role,arg),check('qa_notices ! 0',name+'_'+role));}
  start.push("msg '"+marker+"'");plan.push({name,file:probe(name,candidate,start,random),marker,checkpoint:'No notification for '+name+' in all six adult fixture roles.'});
 }
 {
  const name='red-missing',marker='JO9_QA_MEIKIPOP_red_missing_COMPLETE',start=[...init,...setup('slave'),call('slave'),check('qa_notices ! 1','baseline_missing'),"msg '"+marker+"'"];
  write(dir+'/red-plan.json',[{name,file:probe(name,before,start,5),marker,checkpoint:'Expected baseline failure: newly known state has no discovery notification.'}]);
 }
 for(const role of ['slave','assistant']){const name='popup-'+role;const d=c.parse(candidate),start=[...init,...setup(role,'검사 '+role),call(role)];const body=get(d,'jo9_meiki_state').replaceAll('rand(1, 100) <= 5','5 <= 5').replace(popup,check(role+"['virginity'] ! 4 or "+role+"['jo9_meiki_initialized'] ! 2",role+'_native_state')+'\r\n '+popup);set(d,'jo9_meiki_state',body);set(d,'Start',start.join('\r\n'));const file=dir+'/'+name+'.qsp';fs.writeFileSync(file,c.serialize(d));nativePopupPlan.push({name,file,expectedText:'[명기]<br>검사 '+role+'의 숨겨진 재능을 발견했다.'});}
 write(dir+'/plan.json',plan);write(dir+'/popup-plan.json',nativePopupPlan);write(rec+'/probe-spec.json',{candidateSha256:c.hash(candidate),normalDifficulty:0,greenGroups:plan.length,expectedRed:1,nativePopups:nativePopupPlan.length,cases:'7 fresh discoveries incl fallback + 6 repeat checks + 36 quiet paths',instrumentation:'Only diagnostic RAND and MSG counter; separate real native MSG probes preserve the production MSG.',manualGui:false});console.log(JSON.stringify({plan:dir+'/plan.json',red:dir+'/red-plan.json',popup:dir+'/popup-plan.json'}));
}else if(process.argv[2]==='install'){
 const release=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));assert.equal(release.verdict,'PASS');const native=JSON.parse(fs.readFileSync(tmp+'/native/client-results.json','utf8').replace(/^\uFEFF/,'')),popups=JSON.parse(fs.readFileSync(rec+'/popup-results.json','utf8').replace(/^\uFEFF/,''));assert.equal(native.length,7);assert(native.every(x=>x.pass));assert.equal(popups.length,2);assert(popups.every(x=>x.pass));assert.equal(JSON.parse(fs.readFileSync(rec+'/red-result.json','utf8')).expectedFailureConfirmed,true);
 const before=fs.readFileSync(game+'/jack.qsp'),candidate=fs.readFileSync(tmp+'/candidate.qsp'),patch=JSON.parse(fs.readFileSync(rec+'/patch.json','utf8'));assert.equal(c.hash(before),expected);assert.equal(c.hash(candidate),patch.after_sha256);for(const p of JSON.parse(fs.readFileSync(rec+'/protected.json')))assert.equal(c.hash(fs.readFileSync(p.file)),p.sha256,p.file);
 fs.copyFileSync(process.argv[3],rec+'/release-report.json');fs.copyFileSync(tmp+'/native/client-results.json',rec+'/native-results.json');for(const p of native)fs.copyFileSync(tmp+'/native/'+p.name+'-stderr.log',rec+'/'+p.name+'-stderr.log');
 fs.writeFileSync(game+'/jack.qsp',candidate);assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),patch.after_sha256);write(rec+'/FINAL_RESULT.json',{status:'WORK_APPLIED',before:expected,after:patch.after_sha256,releaseVerdict:'PASS',nativeGroups:7,nativePopups:2,baselineRedConfirmed:true,newLocations:0,newPersistentKeys:0,gameDifficultyChanged:false,fullSynced:false,packaged:false,committed:false,pushed:false,limits:['Existing MSG dismissal behavior is reused; no X-only or unread-save behavior.','Diagnostic adult fixture states; no full GUI save-load or physical click test.']});console.log(JSON.stringify({installed:true,hash:patch.after_sha256}));
}else if(process.argv[2]==='reproduce'){
 assert(!fs.existsSync(tmp));const patch=JSON.parse(fs.readFileSync(rec+'/patch.json')),before=z.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz')),d=c.parse(before);assert.equal(c.hash(before),patch.before_sha256);for(const e of patch.edits){const b=get(d,e.location);assert.equal(b.split(e.old).length,2);set(d,e.location,b.replace(e.old,e.new));}const after=c.serialize(d);assert.equal(c.hash(after),patch.after_sha256);fs.mkdirSync(tmp,{recursive:true});fs.mkdirSync(tmp+'/patches');fs.writeFileSync(tmp+'/before.qsp',before);fs.writeFileSync(tmp+'/candidate.qsp',after);fs.copyFileSync(rec+'/patch.json',tmp+'/patches/'+id+'.json');console.log(tmp+'/candidate.qsp');
}else throw Error('prepare/probes/install <release-report>/reproduce');
