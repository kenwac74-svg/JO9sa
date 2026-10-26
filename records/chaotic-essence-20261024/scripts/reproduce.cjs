'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib'),assert=require('assert/strict'),cp=require('child_process');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',root='G:/Codex/tmp/jo9-chaotic-essence-20261024',record=repo+'/records/chaotic-essence-20261024';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'),read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),cr=s=>s.replace(/\r?\n/g,'\r\n');
const body=(d,n)=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),set=(d,n,s)=>d.lines[d.locations.find(x=>x.name===n).body]=c.shift(cr(s),-5);
const phase=process.argv[2];
if(phase==='prepare'){
 fs.mkdirSync(root+'/inputs',{recursive:true});fs.mkdirSync(root+'/patches',{recursive:true});fs.mkdirSync(record+'/scripts',{recursive:true});fs.mkdirSync(record+'/evidence',{recursive:true});
 const raw=fs.readFileSync(game+'/jack.qsp');assert.equal(c.hash(raw),'f2d5a9c2970bd7cbc7479f80901204b8fcdcaeab6cff83019a4a3ece6f8a9775');qa.inspectWorld(raw);fs.writeFileSync(root+'/inputs/before.qsp',raw);fs.writeFileSync(record+'/before.qsp.gz',zlib.gzipSync(raw,{level:9}));assert.deepEqual(zlib.gunzipSync(fs.readFileSync(record+'/before.qsp.gz')),raw);
 write(record+'/inputs.json',[game+'/jack.qsp',game+'/css/base.css','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/css/base.css',...fs.readdirSync(game+'/save').filter(x=>/\.sav$/i.test(x)).map(x=>game+'/save/'+x)].map(p=>({path:p,sha256:c.hash(fs.readFileSync(p))})));
 fs.writeFileSync(repo+'/docs/superpowers/plans/2026-10-24-chaotic-essence.md',`# 카오틱 에센스 구현 계획

> 실행: writing-plans / executing-plans. 사용자 명시 추가 지시로 진행하며 커밋·푸시 없음.

**Goal:** 중앙구역 물약점의 스테로이드와 탕제에서900스파크로1회분을 구매하고, 노예/조수의 부정 일반 특성1개를 무작위 삭제한다.
**Architecture:** 기존 약품 재고에 숫자 chaotic_essence를 추가하고, 구매·재고·사용 메뉴를 연결한다. 독립 jo9_chaotic helper는23개 부정 축만 동등 확률로 고르며 선택 축과 필요한 보조값만 정리한다.
**Tech Stack:** QSP 선언형 mods, FastQSP, Node.js QA,59×66 PNG.

## 확정 범위

- 가격900 / 구매1개 / 성공사용1개 소비 / 부정 대상없음 무소모.
- 긍정·다재다능·투기장/경주 등 성취·기본 능력치·임신/문신없음 등 상태 보호.
- 숨은 부정 보유도 후보. 선택된 발현 누적값만 정리해 즉시 재획득 방지. 일반 기술XP·지성·명성·수술/승수/초기화 이력 유지.
- 일반8칸 강제·경기 칭호통합·새 배제/확률은 이번 기능에 포함하지 않는다.
- WORK만 적용, 기존 세이브/Full/CSS 보존. sources/ 읽기전용.

## 검토 초점

- 정확히900일 때 구매 가능하며899는 재고/자금 무변경.
- 조수 메뉴가 노예를 수정하지 않음. 한 번 성공에 한 축/한 병만 변경.
- 대상0/재고0/빈 역할은 무변경. 긍정과 성취·상태는 무작위 후보가 될 수 없음.
- 산만함 활성 캐시와 옹졸함 분수 잔여치, 해당9종 발현XP 중 선택된1개만 정리.
- 기존 세이브는 새 숫자 재고0으로 호환. 새 게임 초기화와 실험실 수량 일치.

- [ ] Baseline 실제 엔진 RED 및 보호 입력 캡처
- [ ] 상품·부정23종 helper·노예/조수 메뉴·재고 통합
- [ ] 생성 아이콘59×66 활성/비활성 리소스 준비
- [ ] 실제 엔진 집중검사·문법/재생/재적용·공식9경로 PASS
- [ ] 독립 검토 후 WORK 적용·자연어 설명서/작업묶음 갱신
- [ ] 최소 복구본/검사 기록 보존, 임시 QSP·JSON·시험 사본 정리
`);
 write(record+'/scope.json',{price:900,quantity:1,negativeOnly:true,protectAchievements:true,protectedStatuses:true,roleSupport:['slave','assistant'],runtimeSlotCapIncluded:false,combinedTitleIncluded:false,commitPush:false});
 console.log('Prepared pinned baseline, minimal rollback, plan and protected inputs');
}else if(phase==='red'){
 const d=c.parse(fs.readFileSync(root+'/inputs/before.qsp')),dir=root+'/red';fs.mkdirSync(dir,{recursive:true});
 set(d,'Start',"usehtml=1\nCONST_INT['no_slave']=0\nslave_state=1\nslave['grace']=-1\nchaotic_essence=1\nlocal ce_test=func('jo9_chaotic','apply','slave')\nif ce_test ! 1 or slave['grace'] ! 0 or chaotic_essence ! 0: msg 'FAIL_CHAOTIC_MISSING' & exit\nmsg 'JO9_QA_CHAOTIC_remove_COMPLETE'");
 fs.writeFileSync(dir+'/remove.qsp',c.serialize(d));write(dir+'/plan.json',[{name:'remove',file:dir+'/remove.qsp',marker:'JO9_QA_CHAOTIC_remove_COMPLETE',checkpoint:'Negative removal is not implemented in baseline'}]);
 const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',dir+'/plan.json','-TimeoutSeconds','15'],{encoding:'utf8',windowsHide:true,timeout:25000});const result=read(dir+'/client-results.json');assert(result.every(x=>!x.pass));assert(!d.locations.some(x=>x.name==='jo9_chaotic'));write(record+'/red-results.json',{status:'EXPECTED_FAILURE',result});fs.copyFileSync(dir+'/remove-stderr.log',record+'/evidence/red-remove.log');console.log(JSON.stringify({status:'EXPECTED_FAILURE',engineExit:r.status,result}));
}else if(phase==='build'){
 const raw=fs.readFileSync(root+'/inputs/before.qsp'),d=c.parse(raw),shop=read(root+'/shop-edits.json'),helper=read(root+'/helper.json');
 for(const e of shop.edits){const old=body(d,e.location),count=old.split(e.old).length-1;assert.equal(count,e.count,e.location+' exact count');set(d,e.location,old.split(e.old).join(e.new));}
 const labDef=body(d,'#dynamic').match(/\$get_lab_space = \{[\s\S]*?\r\n\}/)[0],loadName='$ongload',oldLoad=body(d,loadName),anchor=oldLoad.split('\r\n')[0]+'\r\n';assert.equal(oldLoad.split(anchor).length-1,1);
 const loadGuard="! JO9 MOD START CHAOTIC_ESSENCE_LOAD_CACHE | 2026-10-24_chaotic_essence\r\nif instr($get_lab_space, 'chaotic_essence') = 0:\r\n"+labDef+"\r\nend\r\n! JO9 MOD END CHAOTIC_ESSENCE_LOAD_CACHE\r\n";
 const loadEdit={location:loadName,field:'body',old:anchor,new:loadGuard+anchor,count:1};shop.edits.push(loadEdit);set(d,loadName,oldLoad.replace(anchor,loadEdit.new));
 assert(!d.locations.some(x=>x.name===helper.name));d.lines.splice(-1,0,c.shift(helper.name,-5),c.shift(helper.desc||'',-5),c.shift(cr(helper.body),-5),c.shift('0',-5));d.lines[3]=c.shift(String(d.locations.length+1),-5);
 const candidate=c.serialize(d);qa.inspectWorld(candidate);fs.writeFileSync(root+'/inputs/candidate.qsp',candidate);
 const patch={id:'2026-10-24_chaotic_essence',description:'중앙구역 스테로이드와 탕제에 카오틱 에센스900/1회 추가; 부정23축 중무작위1개만제거. 성취·긍정·상태·기존세이브보존.',before_sha256:c.hash(raw),after_sha256:c.hash(candidate),edits:shop.edits,add_locations:[helper]};
 write(root+'/patches/2026-10-24_chaotic_essence.json',patch);write(record+'/patch.json',patch);fs.copyFileSync(root+'/generate-helper.cjs',record+'/scripts/generate-helper.cjs');write(record+'/helper-meta.json',read(root+'/helper-meta.json'));write(record+'/scope-diff.json',{before:patch.before_sha256,after:patch.after_sha256,editedLocations:[...new Set(shop.edits.map(x=>x.location))],edits:shop.edits.length,addedLocations:[helper.name],oldLocations:d.locations.length,newLocations:c.parse(candidate).locations.length});console.log(JSON.stringify(read(record+'/scope-diff.json')));
}else if(phase==='green'){
 const d=c.parse(fs.readFileSync(root+'/inputs/candidate.qsp')),dir=root+'/green';fs.mkdirSync(dir,{recursive:true});let code="usehtml=1\r\nCONST_INT['no_slave']=0\r\nslave_state=1\r\nassistant_state=1\r\n$estate='test'\r\nestate_size['test']=1000\r\n";let checks=0;
 const quote=s=>"'"+s.replaceAll("'","''")+"'",check=(cond,label)=>{const terms=cond.split(' and ');let text='';for(let i=0;i<terms.length;i+=8){checks++;text+='if ('+terms.slice(i,i+8).join(' and ')+") = 0: msg 'FAIL_CE_"+label+'_'+i+"' & exit\r\n";}return text;};
 const negative=[['grace',-3],['dexterity',-2],['sport_affinity',-1],['masochism',-1,'masochism_xp'],['exhibitionism',-1,'exhibitionism_xp'],['meekness',-6],['selfesteem',-2],['abuse_attitude',-1,'abuse_xp'],['darkness_attitude',-1,'darkness_xp'],['blood_attitude',-1,'blood_xp'],['fire_attitude',-1,'fire_xp'],['water_attitude',-1,'water_xp'],['vermin_attitude',-1,'vermin_xp'],['deprivation_attitude',-1,'deprivation_xp'],['jo9_gag_reflex',1],['anal_affinity',-1],['defiant',1],['jo9_voice_trait',1],['jo9_work_ethic',-1],['jo9_focus',-1],['jo9_grudge',1],['jo9_constitution',-1],['jo9_learning_trait',-1]];
 const xps=negative.filter(x=>x[2]).map(x=>x[2]);
 const protectedValues={jo9_versatile:1,arena_level:9,has_ride_win:7,intellect:5,stamina:4,beauty:5,fame:3,jo9_real_wins:20,jo9_slave_nature:1,jo9_slave_nature_initialized:1,jo9_defiant_resolved:1,brand:0,pregnancy:2,pregnancy_days:44,wounds:3,scars:2,bruises:4,neg_pain:9,service:4,oral:4,jo9_peerless:1,jo9_g75_pet:3};
 const init=role=>{let s="killvar '"+role+"'\r\n"+role+"_state=1\r\nchaotic_essence=1\r\n";for(const [k,v]of Object.entries(protectedValues))s+=role+'['+quote(k)+']='+v+'\r\n';for(const xp of xps)s+=role+'['+quote(xp)+']=123\r\n';return s;};
 const protect=role=>Object.entries(protectedValues).map(([k,v])=>role+'['+quote(k)+']='+v).join(' and ');
 const labMatch=body(d,'#dynamic').match(/\$get_lab_space = \{[\s\S]*?\r\n\}/);assert(labMatch);code+=labMatch[0]+'\r\n';
 for(const role of ['slave','assistant']){
  const other=role==='slave'?'assistant':'slave';
  for(const [key,val,xp]of negative){code+=init(role)+other+"['grace']=-5\r\n"+role+'['+quote(key)+']='+val+"\r\n$jo9_chaotic_removed='UNCHANGED'\r\n"+role+'['+quote(key+'_revealed')+']=2\r\n';
   if(key==='jo9_focus')code+=role+"['jo9_focus_active']=-1\r\n"+role+"['jo9_focus_xp_credit']=-7\r\n$"+role+"['jo9_focus_subject']='art'\r\n";
   if(key==='jo9_grudge')for(const suffix of ['neg_pain','neg_abuse','neg_disgust','neg_no_praise','neg_shame','neg_prisoner','neg_job','neg_forced','neg_raped','neg_defloration','neg_artifact','neg_cheap_gift','neg_cheap_reward','neg_pony_died','neg_sa_catfight','neg_sa_love_lost2','neg_sa_demote','neg_sa_friend_prisoned','neg_sa_friend_punished','neg_sa_love_lost1','neg_another_sleep_together'])code+=role+'['+quote('jo9_memory_'+suffix)+']=2\r\n';
   code+="qa_count=func('jo9_chaotic','count',"+quote(role)+")\r\n"+check("qa_count=1 and chaotic_essence=1 and $jo9_chaotic_removed='UNCHANGED'",role+'_'+key+'_COUNT');
   code+="qa_used=func('jo9_chaotic','apply',"+quote(role)+")\r\n"+check('qa_used=1 and '+role+'['+quote(key)+']=0 and chaotic_essence=0 and lab_items=0 and '+other+"['grace']=-5",role+'_'+key+'_REMOVE')+check(protect(role),role+'_'+key+'_PROTECT');
   for(const x of xps)code+=check(role+'['+quote(x)+']='+(x===xp?0:123),role+'_'+key+'_'+x);
   if(key==='jo9_focus')code+=check(role+"['jo9_focus_active']=0 and "+role+"['jo9_focus_xp_credit']=0 and $"+role+"['jo9_focus_subject']=''",role+'_FOCUS_CACHE');
   if(key==='jo9_grudge')code+=check(role+"['jo9_memory_neg_pain']=0 and "+role+"['jo9_memory_neg_another_sleep_together']=0 and "+role+"['neg_pain']=9",role+'_GRUDGE_CACHE');
  }
  code+=init(role)+"qa_count=func('jo9_chaotic','count',"+quote(role)+")\r\nqa_used=func('jo9_chaotic','apply',"+quote(role)+")\r\n"+check('qa_count=0 and qa_used=0 and chaotic_essence=1 and '+protect(role),role+'_NO_NEGATIVE');
  code+=init(role)+role+"['grace']=-1\r\nchaotic_essence=0\r\nqa_used=func('jo9_chaotic','apply',"+quote(role)+")\r\n"+check('qa_used=0 and chaotic_essence=0 and '+role+"['grace']=-1",role+'_NO_STOCK');
  for(let i=0;i<30;i++){code+=init(role);for(const [key,val]of negative)code+=role+'['+quote(key)+']='+val+'\r\n';code+="qa_before=func('jo9_chaotic','count',"+quote(role)+")\r\nqa_used=func('jo9_chaotic','apply',"+quote(role)+")\r\nqa_after=func('jo9_chaotic','count',"+quote(role)+")\r\n"+check('qa_before=23 and qa_after=22 and qa_used=1 and chaotic_essence=0 and '+protect(role),role+'_RANDOM_'+i);}
  code+=init(role)+role+"['jo9_voice_trait']=2\r\n"+role+"['passion_fame']=2\r\nqa_used=func('jo9_chaotic','apply',"+quote(role)+")\r\n"+check('qa_used=0 and chaotic_essence=1 and '+role+"['jo9_voice_trait']=2 and "+role+"['passion_fame']=2",role+'_LEGACY_INERT');
 }
 code+="qa_used=func('jo9_chaotic','apply','prisoner')\r\n"+check('qa_used=0 and chaotic_essence=1','INVALID_ROLE');
 code+="savegame 'chaotic.sav'\r\nmsg 'JO9_QA_CHAOTIC_effect_COMPLETE'";
 set(d,'Start',code);qa.inspectWorld(c.serialize(d));fs.writeFileSync(dir+'/effect.qsp',c.serialize(d));
 const p=c.parse(fs.readFileSync(root+'/inputs/candidate.qsp')),patch=read(record+'/patch.json');let integration="usehtml=1\r\nCONST_INT['no_slave']=0\r\n$estate='test'\r\nestate_size['test']=1000\r\n$save_link={}\r\n"+labMatch[0]+'\r\n';let integrationChecks=0;const ic=(cond,label)=>{integrationChecks++;return check(cond,'I_'+label);};
 const purchase=patch.edits.find(x=>x.new.includes('CHAOTIC_ESSENCE_SHOP_PURCHASE')).new.split("$text[txt] =")[0];
 for(const money of [899,900,1800]){integration+='sparks='+money+"\r\nchaotic_essence=0\r\nsp_txt=125\r\n$text_display=''\r\n"+purchase+'\r\n'+ic('sparks='+(money>=900?money-900:money)+' and chaotic_essence='+(money>=900?1:0),'BUY_'+money);}
 for(const role of ['slave','assistant']){const e=patch.edits.find(x=>x.new.includes('CHAOTIC_ESSENCE_USE_'+role.toUpperCase()));const block=e.new.slice(e.new.indexOf('! JO9 MOD START CHAOTIC_ESSENCE_USE_'),e.new.indexOf('! JO9 MOD END CHAOTIC_ESSENCE_USE_'));
  integration+=init(role)+role+"['grace']=-1\r\n$text_display=''\r\n"+block+'\r\n'+ic("instr($text_display,'카오틱 에센스')>0 and instr($text_display,"+quote("''use'', ''"+role+"''")+")=0",role+'_MENU_RENDER');
  // Actual HTML uses single-quoted EXEC arguments after QSP literal unescaping.
  integration+=ic("instr($text_display,"+quote("'use', '"+role+"'")+")>0 and instr($text_display,'chaotic essence.png')>0",role+'_MENU_ROLE');
  integration+=init(role)+"$text_display=''\r\n"+block+'\r\n'+ic("instr($text_display,'삭제할 부정 특성이 없습니다')>0 and instr($text_display,'chaotic essence_gray.png')>0",role+'_MENU_DISABLED');
 }
 for(const e of patch.edits.filter(x=>x.location==='master_stat'))integration+="chaotic_essence=7\r\n$middle_text_list=''\r\n"+e.new+'\r\n'+ic("instr($middle_text_list,'카오틱 에센스 *7')>0",'INVENTORY_'+integrationChecks);
 const guard=patch.edits.find(x=>x.location==='$ongload').new.split('! JO9 MOD END CHAOTIC_ESSENCE_LOAD_CACHE')[0];integration+="$get_lab_space={lab_items=0 & lab_space=1000}\r\nchaotic_essence=7\r\ndynamic $get_lab_space\r\n"+ic('lab_items=0','OLD_CACHE_REPRO')+guard+'\r\ndynamic $get_lab_space\r\n'+ic('lab_items=7 and lab_space=993','LOAD_CACHE_REPAIRED')+"$qa_cache_before=$get_lab_space\r\n"+guard+'\r\n'+ic('$qa_cache_before=$get_lab_space','LOAD_CACHE_IDEMPOTENT');
 integration+="msg 'JO9_QA_CHAOTIC_integration_COMPLETE'";set(p,'Start',integration);fs.writeFileSync(dir+'/integration.qsp',c.serialize(p));
 const plan=[{name:'effect',file:dir+'/effect.qsp',marker:'JO9_QA_CHAOTIC_effect_COMPLETE',checkpoint:'23 negatives on both roles, preservation, no targets, random one-axis removal, save'},{name:'integration',file:dir+'/integration.qsp',marker:'JO9_QA_CHAOTIC_integration_COMPLETE',checkpoint:'Actual purchase/menu/inventory fragments and existing $menu renderer'}];write(dir+'/plan.json',plan);
 const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',dir+'/plan.json','-TimeoutSeconds','45'],{encoding:'utf8',windowsHide:true,timeout:105000});const results=read(dir+'/client-results.json');write(record+'/green-results.json',{checks,integrationChecks,results});for(const x of plan)fs.copyFileSync(dir+'/'+x.name+'-stderr.log',record+'/evidence/green-'+x.name+'.log');console.log(JSON.stringify({checks,integrationChecks,engineExit:r.status,results}));assert.equal(r.status,0);assert(results.every(x=>x.pass));
}else if(phase==='probe'){
 const dir=root+'/probe';fs.mkdirSync(dir,{recursive:true});const plan=[];
 for(const [name,src]of [['simple',"CONST_INT['no_slave']=0\nslave_state=1\nslave['grace']=-1\nchaotic_essence=1\nqa_count=func('jo9_chaotic','count','slave')\nqa_used=func('jo9_chaotic','apply','slave')\nif qa_used ! 1 or qa_count ! 1 or chaotic_essence ! 0 or slave['grace'] ! 0: msg 'FAIL_SIMPLE' & exit\n"],['nosave',body(c.parse(fs.readFileSync(root+'/green/effect.qsp')),'Start').split("savegame 'chaotic.sav'")[0]],['first',body(c.parse(fs.readFileSync(root+'/green/effect.qsp')),'Start').split("killvar 'slave'")[0]+body(c.parse(fs.readFileSync(root+'/green/effect.qsp')),'Start').split("killvar 'slave'")[1].replace(/^/,"killvar 'slave'")]]){
  const d=c.parse(fs.readFileSync(root+'/inputs/candidate.qsp')),marker='JO9_QA_CHAOTIC_'+name+'_COMPLETE';set(d,'Start',src+"\nmsg '"+marker+"'");fs.writeFileSync(dir+'/'+name+'.qsp',c.serialize(d));plan.push({name,file:dir+'/'+name+'.qsp',marker,checkpoint:'Isolate timeout: '+name});
 }
 write(dir+'/plan.json',plan);const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',dir+'/plan.json','-TimeoutSeconds','12'],{encoding:'utf8',windowsHide:true,timeout:50000});console.log(r.stdout);console.log(JSON.stringify(read(dir+'/client-results.json')));
}else if(phase==='probe-prefix'){
 const dir=root+'/probe-prefix';fs.mkdirSync(dir,{recursive:true});const src=body(c.parse(fs.readFileSync(root+'/green/effect.qsp')),'Start'),starts=[...src.matchAll(/killvar '(?:slave|assistant)'/g)].map(x=>x.index),plan=[];
 for(const [i,n]of [21,22,23,24,25].entries()){const name=String.fromCharCode(97+i),d=c.parse(fs.readFileSync(root+'/inputs/candidate.qsp')),marker='JO9_QA_CHAOTIC_'+name+'_COMPLETE';set(d,'Start',src.slice(0,starts[n])+"\r\nmsg '"+marker+"'");fs.writeFileSync(dir+'/'+name+'.qsp',c.serialize(d));plan.push({name,file:dir+'/'+name+'.qsp',marker,checkpoint:'Prefix '+n+' of '+starts.length});}
 write(dir+'/plan.json',plan);const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',dir+'/plan.json','-TimeoutSeconds','6'],{encoding:'utf8',windowsHide:true,timeout:45000});console.log(r.stdout);console.log(JSON.stringify(read(dir+'/client-results.json')));
}else if(phase==='use-messages'){
 const dir=root+'/use';fs.mkdirSync(dir,{recursive:true});const cases=[['use-slave',"CONST_INT['no_slave']=0\nslave_state=1\nslave['grace']=-1\nchaotic_essence=1\ngs 'jo9_chaotic','use','slave'",'카오틱 에센스를 사용해 촌뜨기 특성을 제거했습니다. 남은 수량: 0개.'],['use-assistant',"CONST_INT['no_slave']=0\nassistant_state=1\nassistant['jo9_focus']=-1\nchaotic_essence=1\ngs 'jo9_chaotic','use','assistant'",'카오틱 에센스를 사용해 산만함 특성을 제거했습니다. 남은 수량: 0개.'],['use-empty',"CONST_INT['no_slave']=0\nslave_state=1\nslave['jo9_versatile']=1\nslave['arena_level']=9\nslave['has_ride_win']=7\nchaotic_essence=1\ngs 'jo9_chaotic','use','slave'",'제거할 부정 특성이 없습니다. 카오틱 에센스는 소모되지 않았습니다.'],['use-stockless',"CONST_INT['no_slave']=0\nslave_state=1\nslave['grace']=-1\nchaotic_essence=0\ngs 'jo9_chaotic','use','slave'",'카오틱 에센스가 없습니다.'],['use-absent',"CONST_INT['no_slave']=0\nslave_state=0\nslave['grace']=-1\nchaotic_essence=1\ngs 'jo9_chaotic','use','slave'",'사용할 대상이 없습니다.']];
 const plan=[];for(const [name,src,marker]of cases){const d=c.parse(fs.readFileSync(root+'/inputs/candidate.qsp'));set(d,'Start',src);fs.writeFileSync(dir+'/'+name+'.qsp',c.serialize(d));plan.push({name,file:dir+'/'+name+'.qsp',marker,checkpoint:'Actual production use message, no dialog instrumentation'});}write(dir+'/plan.json',plan);
 let runner=fs.readFileSync(repo+'/tools/qa/run-client-smoke.ps1','utf8').replace(" -or $probe.marker -notmatch '^JO9_QA_[A-Z0-9]+_[a-z_]+_COMPLETE$'",'');fs.writeFileSync(dir+'/run-message-probes.ps1','\uFEFF'+runner.replace(/^\uFEFF/,''));
 const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',dir+'/run-message-probes.ps1','-Engine',game+'/engine/jack.exe','-Plan',dir+'/plan.json','-TimeoutSeconds','15'],{encoding:'utf8',windowsHide:true,timeout:95000});const results=read(dir+'/client-results.json');for(const x of results){const expected=plan.find(p=>p.name===x.name).marker,log=new TextDecoder('euc-kr').decode(fs.readFileSync(dir+'/'+x.name+'-stderr.log')),actual=(log.match(/showMessage\(\), str:\s*"([^"\r\n]*)"/)||[])[1];x.rawRunnerPass=x.pass;x.rawRunnerReason=x.reason;x.actualMessage=actual;x.pass=actual===expected;x.reason=x.pass?'Exact expected production message verified from CP949 log after process exit':'Production message mismatch';}write(record+'/use-results.json',{status:results.every(x=>x.pass)?'PASS':'FAIL',rawRunnerExit:r.status,logEncoding:'CP949 decoded after diagnostic process stopped',results});for(const x of plan)fs.copyFileSync(dir+'/'+x.name+'-stderr.log',record+'/evidence/'+x.name+'.log');console.log(JSON.stringify({pass:results.every(x=>x.pass),results}));assert(results.every(x=>x.pass));
 const save=require(repo+'/tools/qa/save-codec.cjs'),saved=save.parse(fs.readFileSync(root+'/green/chaotic.sav'));for(const role of ['slave','assistant']){assert.equal(save.value(saved,role,'jo9_versatile')[0],'1');assert.equal(save.value(saved,role,'arena_level')[0],'9');assert.equal(save.value(saved,role,'has_ride_win')[0],'7');assert.equal(save.value(saved,role,'intellect')[0],'5');}assert.equal(save.value(saved,'CHAOTIC_ESSENCE')[0],'1');write(record+'/save-persistence.json',{status:'PASS',newStockCount:1,roleAchievementsPreserved:true,baseAttributesPreserved:true,existingUserSavesNotEdited:true});
}else if(phase==='install'){
 const patch=read(record+'/patch.json'),releaseDirs=fs.readdirSync(root+'/release').filter(x=>x.startsWith('run-'));assert.equal(releaseDirs.length,1);const gate=read(root+'/release/'+releaseDirs[0]+'/report.json');assert.equal(gate.verdict,'PASS');assert(read(record+'/green-results.json').results.every(x=>x.pass));assert.equal(read(record+'/use-results.json').status,'PASS');assert.equal(read(record+'/save-persistence.json').status,'PASS');
 for(const x of read(record+'/inputs.json'))assert.equal(c.hash(fs.readFileSync(x.path)),x.sha256,'Pre-install protected input: '+x.path);
 const runtimeDir=game+'/content/pic/ui overhaul',assetDir=repo+'/assets/chaotic-essence';fs.mkdirSync(assetDir,{recursive:true});const manifest=[];
 for(const name of ['chaotic essence.png','chaotic essence_gray.png']){const raw=fs.readFileSync(record+'/assets/'+name);assert.equal(raw.readUInt32BE(16),59);assert.equal(raw.readUInt32BE(20),66);for(const target of [runtimeDir+'/'+name,assetDir+'/'+name]){if(fs.existsSync(target))assert.deepEqual(fs.readFileSync(target),raw,'Do not overwrite an unrelated existing icon');else fs.writeFileSync(target,raw);}manifest.push({type:'UI item icon',file:name,width:59,height:66,sha256:c.hash(raw),runtime:runtimeDir+'/'+name,repository:assetDir+'/'+name});}
 const oldNames=new Set(fs.readdirSync(game));const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',root+'/patches'],{encoding:'utf8',windowsHide:true,timeout:90000});fs.writeFileSync(record+'/install.log',r.stdout+'\n'+r.stderr);assert.equal(r.status,0);assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),patch.after_sha256);fs.copyFileSync(record+'/patch.json',repo+'/mods/2026-10-24_chaotic_essence.json');write(record+'/install-backups.json',fs.readdirSync(game).filter(x=>!oldNames.has(x)&&x.startsWith('jack.qsp')).map(x=>game+'/'+x));write(record+'/assets.json',manifest);fs.copyFileSync(root+'/release/'+releaseDirs[0]+'/report.json',record+'/release-validation.json');
 write(record+'/image-generation.json',{tool:'built-in image_gen',source:'C:/Users/User/.codex/generated_images/01a0f55f-a7b2-7ac3-905b-647154c5943b/exec-b8de5705-6f4e-4b42-b023-e62ec3e7c382.png',brief:'카오틱 에센스: 고전 판타지 물약 버튼, 청록·보라 소용돌이 유리병과 황동 프레임, 글자 없음, 투명 모서리',integration:'Generated original resampled to existing59×66; grayscale disabled derivative. Source original preserved.',variants:manifest});
 for(const x of read(record+'/inputs.json'))assert.equal(c.hash(fs.readFileSync(x.path)),x.path===game+'/jack.qsp'?patch.after_sha256:x.sha256,'Installed protected input: '+x.path);
 write(record+'/independent-review.json',{status:'PASS',reviewer:'chaotic_review',reviewedCandidateSha256:patch.after_sha256,findings:[],resolved:[{priority:2,issue:'Old pharmacy save could run a cached lab formula before first newloc',resolution:'Load guard refreshes only get_lab_space when new stock name is missing; old-cache/idempotence tests pass'}],limits:'Read-only static review; native checks are separately recorded'});console.log(JSON.stringify({installed:true,workSha256:patch.after_sha256,icons:manifest.length,gate:gate.verdict}));
}else if(phase==='finalize'){
 const patch=read(record+'/patch.json'),raw=fs.readFileSync(game+'/jack.qsp');assert.equal(c.hash(raw),patch.after_sha256);const structure=qa.inspectWorld(raw);assert.deepEqual(zlib.gunzipSync(fs.readFileSync(record+'/before.qsp.gz')),fs.readFileSync(root+'/inputs/before.qsp'));const protectedInputs=read(record+'/inputs.json');for(const x of protectedInputs)assert.equal(c.hash(fs.readFileSync(x.path)),x.path===game+'/jack.qsp'?patch.after_sha256:x.sha256);
 fs.writeFileSync(record+'/MANUAL_KO.md',`# 카오틱 에센스 — 적용 기록과 설명

## 플레이 방법

중앙구역 물약상점 → 스테로이드와 탕제에서900스파크로1회분을 산다. 노예 또는 조수의 같은 약품 메뉴에서 사용한다. 보유량은 연구실 물약 목록에도 표시한다. 성공하면 실제 부정 일반 특성 중 하나가 같은 확률로 삭제되고1회분을 소모한다. 숨은 부정 보유도 후보이며, 후보0·재고0·대상없음은 무소모다.

성취(다재다능·투기장·경주), 긍정 특성, 기본 능력치·명성·임신·문신 없음·상처 등 상태는 후보에 없다. 원본14개+추가9개, 총23종의 정확한 키/값은 helper-meta.json에 있다.8칸 제한·경기 칭호통합·새 배제/발생률은 이번 구현에 포함하지 않았다.

## 호출과 반환

- jo9_chaotic count(role): 현재 부정 후보 수. 인물/재고/결과문자열 변경 없음.
- jo9_chaotic apply(role): 유효한 slave/assistant만 허용. 성공1, 무처리0. 성공 시 선택 축과 필요한 보조값만 중립0으로 돌리고 chaotic_essence를1개 줄인다. 선택된 표시명은 $jo9_chaotic_removed에 둔다.
- jo9_chaotic use(role): 위 apply를 호출하고 성공/미사용 메시지를 보여준다. menu_form의 노예·조수 약품 메뉴가 각 역할을 명시해서 호출한다.

pharmacy sp_txt125가900을 차감하고 재고1개를 더한다. $get_lab_space와 $newloc의 합계, master_stat의 두 보유 목록, 새 게임 초기화2곳을 연결했다. $ongload의 단독 계산식 갱신 guard는 약국 화면을 저장한 옛 세이브에서도 연구실 합계가 즉시 맞도록 한다. 새 revision 키는 없다.

## 부수 처리와 보존

선택된 원본 특성의 발견표시와 대응하는 발현 XP만 정리한다. 해당 XP는9종 중 선택된1종이며 다른 기술 경험치나 무관한 성향 누적은 보존한다. 산만함은 활성 캐시/분수/분야 문자열, 옹졸함은21종 분수 잔여치만 정리한다. 실제 기억·지성·이미 얻은 능력치·명성·수술·승수·초기화 완료 이력은 보존한다. 영구 면역을 만들지 않아 원래 발생 경로가 있다면 이후 다시 얻을 수 있다.

이 함수는 기존 편집기·가격·전체 갱신을 직접 호출하지 않는다. 사용 후 원래 화면 재진입 경로를 그대로 이용한다. 기본 재고 변수 chaotic_essence는 예전 세이브에서0으로 취급된다. 파일 형식 이관이나 기존 인물의 일괄 변경은 없다.

## 파일과 의존성

QSP 패치: mods/2026-10-24_chaotic_essence.json. 신규 로케이션 jo9_chaotic과 기존8개 로케이션11개 수정이다. JO9 MOD START/END CHAOTIC_ESSENCE_* 경계로 변경을 식별한다. 메뉴·연구실·불러오기 연결을 제거할 경우 helper와 재고 변수 및 아이콘 참조를 함께 검토해야 한다. helper만 제거하면 사용 링크가 존재하지 않는 로케이션을 호출한다. 아이콘만 제거하면 상품/사용 버튼 그림이 빠진다.

아이콘은 assets/chaotic-essence와 WORK content/pic/ui overhaul에 활성/비활성59×66 PNG로 저장했다. 원본은 image-generation.json의 built-in image_gen 경로에 보존했다. 추가 JSON 리소스 정의는 없다. 기존 CSS·개인 세이브·Full과 ZIP은 수정하지 않았다.

## 검증

실제 엔진 부정23종×두 역할의 선택·보존·발현 누적 처리, 혼합 후보60회에서정확히1종 제거, 무재고/무부정/유효하지않은 역할, 보류값 보존을 검사했다. 집중915개 검증과14개 통합 검사(14는915에포함), 실제 사용 메시지5경로, 진단 저장의재고/성취 유지, 공식9경로·구조·줄/주석 경계·정확 패치 재생/재적용이 PASS다. 아이콘 두 파일은 실제 크기로시각검사했다. 독립검토에서 발견한옛약국캐시 누락도수정후검증했다.

첫 집중시간초과는진단식의긴AND표현식에서발생했고8항목씩나눈동일대조식으로해소했다. 한국어사용메시지는엔진CP949로그를프로세스종료뒤정확히해독해검사했다. 범용ASCII완료마커판정결과와구분해 use-results에원시판정도보존했다.

화면의실제사용동선과모든진행상황을수동플레이한것은아니다. 전체게임무결함인증은아니며, 커밋·푸시·배포ZIP/Full동기화는하지않았다. 핵심복구본은 before.qsp.gz, 이번패치는 patch.json이며 원본 해시와대조한 뒤격리된복제본에서재생할수있다.
`);
 const bundle=repo+'/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md';let b=fs.readFileSync(bundle,'utf8');if(!b.includes('CHAOTIC_ESSENCE_APPLIED_20261024'))b+='\r\n\r\n## WORK 적용 완료 — 카오틱 에센스 (CHAOTIC_ESSENCE_APPLIED_20261024)\r\n\r\n- 중앙구역 물약상점 → 스테로이드와 탕제:900스파크/1회분. 노예·조수의 부정 일반특성23종중무작위1개삭제. 긍정·성취·상태·기본속성보존, 대상없음/재고없음무소모.\r\n- 연구실보유목록·저장량·새게임초기화·옛약국세이브캐시대응. 카오틱아이콘1종(활성/비활성2PNG) 추가.\r\n- 집중915검증(통합14포함)·사용알림5·진단저장·공식9경로/문법/패치재생·재적용·독립검토PASS. 기존76세이브·CSS·Full보존.\r\n- 앞선양음전체랜덤삭제기획은이항목에대해폐기. 일반8칸강제·경기칭호통합·분류기타수치는미적용. WORK만, ZIP/커밋/푸시없음.\r\n- [사용법·호출·보존·검증한계](../records/chaotic-essence-20261024/MANUAL_KO.md).\r\n';fs.writeFileSync(bundle,b);
 const previous=repo+'/docs/superpowers/specs/2026-10-24-trait-slots-and-random-removal-design.md';let spec=fs.readFileSync(previous,'utf8');if(!spec.includes('최신 확정: 카오틱 에센스'))spec=spec.replace('\n\n','\n\n> 최신 확정: 카오틱 에센스는900스파크/1회분으로 **부정 특성만** 무작위 삭제한다. 아래의양음전체랜덤초안은이아이템에대해폐기했다. [적용기록](../../../records/chaotic-essence-20261024/MANUAL_KO.md). 슬롯/칭호개별분류는계속제안이다.\n\n');fs.writeFileSync(previous,spec);
 const previousJson=repo+'/records/trait-slot-proposal-20261024/proposal.json',prior=read(previousJson);prior.randomRemovalSupersededBy='../chaotic-essence-20261024/MANUAL_KO.md';prior.currentRemovalRule={item:'카오틱 에센스',price:900,quantity:1,negativeOnly:true,achievementProtected:true,runtimeApplied:true,slotAndTitleProposalStillUnapplied:true};write(previousJson,prior);
 const planFile=repo+'/docs/superpowers/plans/2026-10-24-chaotic-essence.md';fs.writeFileSync(planFile,fs.readFileSync(planFile,'utf8').replaceAll('- [ ]','- [x]'));
 const result={status:'PASS',workSha256:patch.after_sha256,structure,focusedChecks:read(record+'/green-results.json').checks,integrationChecks:14,useMessagePaths:5,releaseVerdict:read(record+'/release-validation.json').verdict,independentReview:'PASS',protectedSaveFiles:protectedInputs.filter(x=>/\.sav$/i.test(x.path)).length,cssFullAndSavesUnchanged:true,icons:read(record+'/assets.json'),qspEdits:11,addedLocations:1,stockPrice:900,stockQuantity:1,negativeOnly:true,slotCapApplied:false,combinedTitleApplied:false,commitPush:false,cleanupPending:true};write(record+'/FINAL_RESULT.json',result);console.log(JSON.stringify(result));
}else if(phase==='cleanup-preflight'){
 assert.equal(read(record+'/FINAL_RESULT.json').workSha256,c.hash(fs.readFileSync(game+'/jack.qsp')));assert.deepEqual(zlib.gunzipSync(fs.readFileSync(record+'/before.qsp.gz')),fs.readFileSync(root+'/inputs/before.qsp'));
 for(const name of ['shop-edits.json','helper.json'])fs.copyFileSync(root+'/'+name,record+'/scripts/'+name);
 const generation=read(record+'/image-generation.json');generation.prompt='Create one finished raster inventory icon for a dark fantasy RPG potion called Chaotic Essence (no written title). Square composition, designed to remain clearly legible when reduced to 60 by 60 pixels. Single squat faceted glass potion bottle, pale ivory cork at upper left, three-quarter angle tilted slightly right. Inside: a bright swirling violet-and-cyan magical liquid with a small contrasting pink spark at its center, visibly turbulent but readable, no floating particles outside the icon. Hand-painted old fantasy game item illustration, restrained highlights, subtle glass texture, clear silhouette. Surround it with one slim weathered bronze/gold square frame, rounded bevel corners, dark charcoal-brown interior; the frame and dark interior fit almost the whole square, very similar to classic parchment-and-brass RPG button icons. Outer area outside rounded corners genuinely transparent. Bottle occupies about 75 percent of interior. No text, letters, numbers, watermarks, logos, extra icons or UI, and no surrounding scene. This is a brand new original game asset.';write(record+'/image-generation.json',generation);
 let files=0,bytes=0;function walk(p){const st=fs.lstatSync(p);assert(!st.isSymbolicLink(),'No link traversal: '+p);if(st.isDirectory())for(const n of fs.readdirSync(p))walk(path.join(p,n));else{files++;bytes+=st.size;}}
 assert.equal(path.resolve(root).toLowerCase(),'g:\\codex\\tmp\\jo9-chaotic-essence-20261024');walk(root);const backups=read(record+'/install-backups.json');for(const p of backups){assert.equal(path.dirname(path.resolve(p)).toLowerCase(),path.resolve(game).toLowerCase());assert(path.basename(p).startsWith('jack.qsp.bak_'));assert(!fs.lstatSync(p).isSymbolicLink());assert.equal(c.hash(fs.readFileSync(p)),read(record+'/patch.json').before_sha256);bytes+=fs.statSync(p).size;files++;}
 write(record+'/cleanup-plan.json',{root,backups,verifiedFiles:files,reclaimBytes:bytes,noLinks:true,compressedRollbackVerified:true});console.log(JSON.stringify(read(record+'/cleanup-plan.json')));
}else if(phase==='verify-final'){
 assert(!fs.existsSync(root));const p=read(record+'/patch.json'),rollback=zlib.gunzipSync(fs.readFileSync(record+'/before.qsp.gz'));assert.equal(c.hash(rollback),p.before_sha256);assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),p.after_sha256);for(const x of read(record+'/inputs.json'))assert.equal(c.hash(fs.readFileSync(x.path)),x.path===game+'/jack.qsp'?p.after_sha256:x.sha256);for(const x of read(record+'/assets.json')){assert.equal(c.hash(fs.readFileSync(x.runtime)),x.sha256);assert.equal(c.hash(fs.readFileSync(x.repository)),x.sha256);}
 const clean=read(record+'/cleanup-plan.json');assert(clean.backups.every(x=>!fs.existsSync(x)));write(record+'/cleanup.json',{status:'PASS',temporaryRootRemoved:true,generatedWorkBackupsRemoved:true,reclaimBytes:clean.reclaimBytes,reclaimMiB:Math.round(clean.reclaimBytes/1048576),minimumRollbackPreserved:true,generatedOriginalPreserved:true});const final=read(record+'/FINAL_RESULT.json');final.cleanupPending=false;final.cleanup='PASS';final.finalProtectionCheck='PASS';write(record+'/FINAL_RESULT.json',final);console.log(JSON.stringify({status:'PASS',workSha256:p.after_sha256,protectedSaves:final.protectedSaveFiles,cleanup:read(record+'/cleanup.json')}));
}else throw Error('Unknown phase: '+phase);
fs.copyFileSync(__filename,record+'/scripts/reproduce.cjs');
