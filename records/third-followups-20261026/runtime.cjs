'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),z=require('node:zlib');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',rec=repo+'/records/third-followups-20261026',tmp='G:/Codex/tmp/third-followups-20261026';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const expected='060295923fd646e87148dc0e900ef7acce92e1086b6376e1f1fc9d12298513b7',id='2026-10-26_rally_ap_status_text';
const get=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),set=(d,n,s)=>d.lines[d.locations.find(l=>l.name===n).body]=c.shift(s.replace(/\r?\n/g,'\r\n'),-5),q=s=>"'"+s.replaceAll("'","''")+"'",write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const descriptions={
 '$Нет_клейма':'[상표 없음]<br>노예에게 낙인이 없어 일부 거래가 제한된다. 새로운 생활을 받아들이는 데도 시간이 더 걸릴 수 있다. 필요하다면 표식을 새길 방법을 찾아보자.',
 '$sanity_broken':'[정신분열]<br>정신이 크게 손상되어 스스로 의욕을 보이지 않는다. 지시에는 저항하지 않지만 평가와 여러 활동에 불이익을 받을 수 있다. 안정을 찾고 자아와 기질을 회복할 수 있는 여건을 마련해 주자.',
 '$sanity_low':'[신경 쇠약]<br>정신 상태가 불안정해지고 있다. 자존심이 상하거나 자아와 기질이 약해지면 더욱 흔들릴 수 있다. 상태를 주의 깊게 살피고 회복할 여건을 마련해 주자.'
};
if(process.argv[2]==='prepare'){
 assert(!fs.existsSync(tmp)&&!fs.existsSync(rec+'/patch.json'));fs.mkdirSync(tmp,{recursive:true});fs.mkdirSync(tmp+'/patches');
 const before=fs.readFileSync(game+'/jack.qsp');assert.equal(c.hash(before),expected);qa.inspectWorld(before);const d=c.parse(before),edits=[];
 function edit(loc,old,next){const b=get(d,loc);assert.equal(b.split(old).length,2,loc+' unique replacement');set(d,loc,b.replace(old,next));edits.push({location:loc,field:'body',old,new:next,count:1});}
 const ap=JSON.parse(fs.readFileSync(rec+'/rally-ap-edits.json','utf8')).edits[0];edit(ap.location,ap.old,ap.new);
 let textSerial=0;for(const loc of ['#static_txt','#txt_woman'])for(const [name,description]of Object.entries(descriptions)){
  const line=get(d,loc).split('\r\n').filter(s=>s.startsWith(name+' = '));assert.equal(line.length,1,loc+name);textSerial++;
  const next=['! JO9 MOD START STATUS_HINT_TEXT_'+textSerial+'_20261026 | '+id,name+' = '+q(description),'! JO9 MOD END STATUS_HINT_TEXT_'+textSerial+'_20261026'].join('\r\n');edit(loc,line[0],next);
 }
 const newCondition='IF slave_state = CONST_INT[\'slave_exist\'] and (slave["energy"] * 2 - slave["half_action"]) >= 6 and sparks >= 100:';
 const loadBlock=['! JO9 MOD START RALLY_AP_STATUS_CACHE_20261026 | '+id,
  "$erosalon_options[4] = replace($erosalon_options[4], "+q(ap.old)+', '+q(newCondition)+')',
  "if $place = 'erosalon': $display_options[4] = replace($display_options[4], "+q(ap.old)+', '+q(newCondition)+')',
  ...Object.entries(descriptions).map(([name,t])=>name+' = '+q(t)),
  '! JO9 MOD END RALLY_AP_STATUS_CACHE_20261026'].join('\r\n');
 const anchor='! JO9 MOD START PROFILE_POLISH_20261025_R3\r\n';edit('$ongload',anchor,anchor+loadBlock+'\r\n');
 const after=c.serialize(d);qa.inspectWorld(after);assert(c.serialize(c.parse(after)).equals(after));assert.equal(c.parse(before).locations.length,d.locations.length);
 const patch={id,before_sha256:expected,after_sha256:c.hash(after),edits};write(rec+'/patch.json',patch);write(repo+'/mods/'+id+'.json',patch);write(tmp+'/patches/'+id+'.json',patch);fs.writeFileSync(rec+'/before.qsp.gz',z.gzipSync(before));fs.writeFileSync(tmp+'/before.qsp',before);fs.writeFileSync(tmp+'/candidate.qsp',after);fs.copyFileSync(__filename,rec+'/runtime.cjs');
 write(rec+'/runtime-prepared.json',{before:expected,after:c.hash(after),edits:edits.length,changedLocations:[...new Set(edits.map(e=>e.location))],oldCondition:ap.old,newCondition,loadBlock,descriptions,newLocations:0,newPersistentKeys:0});
 const protectedFiles=[game+'/save/27_private_reports.sav',game+'/save/9999.sav',game+'/config.xml',game+'/FastQSP.ini',game+'/json/slaves/212.json',game+'/json/slaves/178.json','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp','G:/somi/JO9O/game/jack.qsp'];write(rec+'/runtime-protected.json',protectedFiles.map(file=>({file,sha256:c.hash(fs.readFileSync(file))})));
 console.log(JSON.stringify({candidate:tmp+'/candidate.qsp',hash:c.hash(after),edits:edits.length}));
}else if(process.argv[2]==='probes'){
 const candidate=fs.readFileSync(tmp+'/candidate.qsp'),before=fs.readFileSync(tmp+'/before.qsp'),info=JSON.parse(fs.readFileSync(rec+'/runtime-prepared.json','utf8')),dir=tmp+'/native';assert(!fs.existsSync(dir));fs.mkdirSync(dir);fs.copyFileSync(game+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 function fragment(raw,loc,begin,end){const b=get(c.parse(raw),loc),a=b.indexOf(begin),z=b.indexOf(end,a);assert(a>=0&&z>a);return b.slice(a,z+end.length)}
 function menu(raw){return fragment(raw,'#options',"$erosalon_options[4] = {",'\r\n}');}
 function probe(name,raw,start,marker,red=false){const d=c.parse(raw);set(d,'$menu',"if $args[0] = 'interaction_city' and args[2] = 102102: qa_rally_enabled = 1\r\n$result = ''");set(d,'Start',start.join('\r\n'));const bytes=c.serialize(d);qa.inspectWorld(bytes);const file=dir+'/'+name+'.qsp';fs.writeFileSync(file,bytes);return{name,file,marker,checkpoint:red?'Expected baseline failure: 2AP participant is incorrectly enabled':'Actual rally menu gate and scoped cache/text restoration; no physical UI.'};}
 const cases=[[0,0,1,100,0],[2,0,1,100,0],[2,1,1,100,0],[3,1,1,100,0],[3,0,1,100,1],[4,1,1,100,1],[5,0,1,100,1],[3,0,0,100,0],[3,0,1,99,0]],plan=[];
 for(const mode of ['fresh','cached','cached-other-place']){const name=mode,marker='JO9_QA_FOLLOWUP_'+name.replaceAll('-','_')+'_COMPLETE',start=['killall','settimer 0','usehtml=1',"CONST_INT['slave_exist']=1",'difficulty_setting=0'];start.push(menu(mode==='fresh'?candidate:before));if(mode!=='fresh'){start.push("copyarr '$display_options', '$erosalon_options'",'$place='+q(mode==='cached'?'erosalon':'balsam_boutique'),info.loadBlock);if(mode==='cached')start.push("if instr($display_options[4], "+q(info.oldCondition)+") > 0: msg 'FAIL_RALLY_CACHE_OLD' & exit");else start.push("if instr($display_options[4], "+q(info.oldCondition)+") = 0: msg 'FAIL_OTHER_PLACE_CACHE_CHANGED' & exit");start.push(info.loadBlock);}
  for(const hero of [1,101])for(const [energy,half,state,cash,want]of cases){start.push('hero_choice='+hero,'slave_state='+state,"slave['energy']="+energy,"slave['half_action']="+half,'sparks='+cash,'qa_rally_enabled=0',"dynamic $erosalon_options[4]",'if qa_rally_enabled ! '+want+": msg 'FAIL_RALLY_GATE_"+mode+'_'+hero+'_'+energy+'_'+half+'_'+state+'_'+cash+"' & exit","if slave['energy'] ! "+energy+" or slave['half_action'] ! "+half+" or sparks ! "+cash+": msg 'FAIL_RALLY_MENU_MUTATES' & exit");}
  start.push("msg '"+marker+"'");plan.push(probe(name,candidate,start,marker));}
 {
  const name='status-text',marker='JO9_QA_FOLLOWUP_status_text_COMPLETE',start=['killall','settimer 0','usehtml=1'];
  for(const loc of ['#static_txt','#txt_woman']){const body=get(c.parse(candidate),loc);for(const name of Object.keys(descriptions)){const line=body.split('\r\n').find(s=>s.startsWith(name+' = '));assert(line);start.push(line,'if '+name+' ! '+q(descriptions[name])+": msg 'FAIL_STATUS_DEFINITION' & exit");}}
  start.push(info.loadBlock);for(const [name,text]of Object.entries(descriptions))start.push('if '+name+' ! '+q(text)+": msg 'FAIL_STATUS_CACHE' & exit");start.push("msg '"+marker+"'");plan.push(probe(name,candidate,start,marker));
 }
 {
  const marker='JO9_QA_FOLLOWUP_red_gate_COMPLETE',start=['killall','settimer 0',"CONST_INT['slave_exist']=1",menu(before),'slave_state=1',"slave['energy']=2","slave['half_action']=0",'sparks=100','qa_rally_enabled=0',"dynamic $erosalon_options[4]","if qa_rally_enabled ! 0: msg 'FAIL_RALLY_BASELINE_GATE' & exit","msg '"+marker+"'"];write(dir+'/red-plan.json',[probe('red-gate',before,start,marker,true)]);
 }
 {
  const d=c.parse(candidate),b=get(d,'#npc_base'),a=b.indexOf("$buyer_demand['egeya'] = {"),end=b.indexOf('\r\n}',a);assert(a>=0&&end>a);const definition=b.slice(a,end+3),name='egeya-demand',marker='JO9_QA_FOLLOWUP_egeya_demand_COMPLETE';
  const start=['killall','settimer 0',definition,"killvar 'demand'","dynamic $buyer_demand['egeya']","if demand['min_stamina'] ! 4 or demand['min_exotic'] ! 0: msg 'FAIL_EGEYA_DEMAND_MEANING' & exit","demand['min_exotic']=2","dynamic $buyer_demand['egeya']","if demand['min_exotic'] ! 2: msg 'FAIL_EGEYA_DEMAND_ASSIGNED' & exit","msg '"+marker+"'"];plan.push(probe(name,candidate,start,marker));
 }
 write(dir+'/plan.json',plan);write(rec+'/native-spec.json',{candidateSha256:c.hash(candidate),menuCasesPerMode:18,menuModes:3,groups:plan.length,descriptions:6,expectedBaselineFailure:'2 AP participant enabled',normalDifficulty:0,limits:['Only actual menu fragment and cached strings; $menu display helper is a diagnostic observer stub.','Egeya requirement is observation only, not changed.','No physical clicks or save loading.']});console.log(dir+'/plan.json');
}else if(process.argv[2]==='install'){
 const report=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));assert.equal(report.verdict,'PASS');const native=JSON.parse(fs.readFileSync(tmp+'/native/client-results.json','utf8').replace(/^\uFEFF/,''));assert.equal(native.length,5);assert(native.every(x=>x.pass));assert.equal(JSON.parse(fs.readFileSync(rec+'/red-result.json')).expectedFailureConfirmed,true);
 const patch=JSON.parse(fs.readFileSync(rec+'/patch.json')),candidate=fs.readFileSync(tmp+'/candidate.qsp');assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),expected);assert.equal(c.hash(candidate),patch.after_sha256);for(const p of JSON.parse(fs.readFileSync(rec+'/runtime-protected.json')))assert.equal(c.hash(fs.readFileSync(p.file)),p.sha256,p.file);
 fs.copyFileSync(process.argv[3],rec+'/release-report.json');fs.copyFileSync(tmp+'/native/client-results.json',rec+'/native-results.json');for(const x of native)fs.copyFileSync(tmp+'/native/'+x.name+'-stderr.log',rec+'/'+x.name+'-stderr.log');
 fs.writeFileSync(game+'/jack.qsp',candidate);assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),patch.after_sha256);write(rec+'/FINAL_RESULT.json',{status:'WORK_APPLIED',before:expected,after:patch.after_sha256,approvedRallyAPGateFixed:true,effectiveAPRequired:3,costChanged:false,stateDescriptionsUnified:true,newLocations:0,newPersistentKeys:0,releaseVerdict:'PASS',nativeGroups:5,catfightBugReclassified:true,imagesApplied:false,refusalApplied:false,aboveFiveApplied:false,fullSynced:false,packaged:false,committed:false,pushed:false});console.log(JSON.stringify({installed:true,hash:patch.after_sha256}));
}else if(process.argv[2]==='reproduce'){
 assert(!fs.existsSync(tmp));const p=JSON.parse(fs.readFileSync(rec+'/patch.json')),before=z.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz')),d=c.parse(before);assert.equal(c.hash(before),p.before_sha256);for(const e of p.edits){const b=get(d,e.location);assert.equal(b.split(e.old).length,2);set(d,e.location,b.replace(e.old,e.new));}const after=c.serialize(d);assert.equal(c.hash(after),p.after_sha256);fs.mkdirSync(tmp,{recursive:true});fs.mkdirSync(tmp+'/patches');fs.writeFileSync(tmp+'/before.qsp',before);fs.writeFileSync(tmp+'/candidate.qsp',after);fs.copyFileSync(rec+'/patch.json',tmp+'/patches/'+id+'.json');console.log(tmp+'/candidate.qsp');
}else throw Error('prepare/probes/install <release-report>/reproduce');
