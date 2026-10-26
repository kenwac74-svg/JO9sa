'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib'),assert=require('assert/strict'),cp=require('child_process');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',root='G:/Codex/tmp/jo9-versatile-fame-20261024',record=repo+'/records/versatile-fame-20261024';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const phase=process.argv[2],write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n'),read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),q=x=>"'"+String(x).replaceAll("'","''")+"'",cr=x=>x.replace(/\r?\n/g,'\r\n');
const body=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),set=(d,n,b)=>d.lines[d.locations.find(l=>l.name===n).body]=c.shift(cr(b),-5);
const skills=['service','cook','secretary','expression','nurse','alchemy','enchanter','stamina','gladiatrix','calisthenics','music','art','pet','dressage','cowSK','petting','oral','penetration','orgy','roleplay','fetishism','xenophily','nipplefuck','lesbiansex'];
if(phase==='prepare'){
 fs.mkdirSync(root+'/inputs',{recursive:true});fs.mkdirSync(record+'/scripts',{recursive:true});fs.mkdirSync(record+'/evidence',{recursive:true});const raw=fs.readFileSync(game+'/jack.qsp');qa.inspectWorld(raw);assert.equal(c.hash(raw),'6ac1d81489320b5211c03e9e2b36436d15ed4a7ebf47768f384802f469cfccdb');fs.writeFileSync(root+'/inputs/before.qsp',raw);fs.writeFileSync(record+'/before.qsp.gz',zlib.gzipSync(raw,{level:9}));assert.deepEqual(zlib.gunzipSync(fs.readFileSync(record+'/before.qsp.gz')),raw);
 write(record+'/inputs.json',[game+'/jack.qsp',game+'/css/base.css','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/css/base.css',...fs.readdirSync(game+'/save').filter(n=>/\.sav$/i.test(n)).map(n=>game+'/save/'+n)].map(p=>({path:p,sha256:c.hash(fs.readFileSync(p))})));
 fs.writeFileSync(repo+'/docs/superpowers/plans/2026-10-24-versatile-fame.md','# 다재다능 부여 시 명성 한 단계\n\n사용자 확정: 다재다능을 부여하는 순간 노예 명성1 상승. 기존 표시등급 기준으로 다음등급의 최소 fame 원천값까지 올린다. 상한5, 기존 보유자는 소급하지 않고 반복 refresh/가격평가로 중복 지급하지 않는다. 새 영구키·로케이션 없이 공통 부여 mode를 기존 helper에 추가한다. 특성 해제는 명성을 회수하지 않고, 다시 부여하면 새 부여로 취급한다. 기존 모든 기술A 획득조건 및 기본값25%는 유지한다.\n\n- [ ] 실제 엔진에서 기존 코드의 미지급 실패 확인\n- [ ] 자동·수동 부여 공통화와 명성 원천/표시 동기화\n- [ ] 경계·상한·반복·기존 보유자·실제 재계산·저장 확인\n- [ ] 독립 검토·공식9경로·문법·정확 재생 통과 후 WORK만 적용\n- [ ] 핵심 기록 보존과 임시자료 정리. 커밋·푸시 없음\n');
 console.log('Prepared pinned baseline and protected input hashes');
}else if(phase==='build'){
 const raw=fs.readFileSync(root+'/inputs/before.qsp'),d=c.parse(raw),patch={id:'2026-10-24_versatile_fame',description:'다재다능 0→1 부여 시 fame 표시 한 단계 상승(상한5). 원천 rate 동기화, 기존 보유자 소급/반복 refresh 중복 없음. 기존 획득조건·가치25% 유지.',target:'game\\jack.qsp',before_sha256:c.hash(raw),after_sha256:'',edits:[]};
 function edit(loc,old,next,marker){let b=body(d,loc);assert.equal(b.split(old).length-1,1,loc+' '+marker);const marked='! JO9 MOD START '+marker+' | '+patch.id+'\r\n'+cr(next)+'\r\n! JO9 MOD END '+marker;patch.edits.push({location:loc,field:'body',old,new:marked,count:1});set(d,loc,b.replace(old,marked));}
 edit('jo9_traits_value',"if $jo9_trait_value_actor = '': jump 'jo9_trait_value_done'","if $jo9_trait_value_actor = '': jump 'jo9_trait_value_done'\nif $jo9_trait_value_mode = 'grant_versatile': jump 'jo9_trait_value_grant_versatile'",'VERSATILE_GRANT_DISPATCH');
 const auto=body(d,'jo9_traits_value').split('\r\n').find(s=>s.includes("if dynslave['jo9_versatile'] = 0 and"));
 edit('jo9_traits_value',auto,auto.replace("dynslave['jo9_versatile'] = 1","$jo9_trait_value_mode = 'grant_versatile'"),'VERSATILE_AUTO_GRANT');
 const done=" }, 'dyn'+'slave', $jo9_trait_value_actor)\r\n jump 'jo9_trait_value_done'\r\nend\r\nif $jo9_trait_value_mode = 'base_price':";
 edit('jo9_traits_value',done,done.replace(" jump 'jo9_trait_value_done'"," if $jo9_trait_value_mode = 'grant_versatile': jump 'jo9_trait_value_grant_versatile'\r\n jump 'jo9_trait_value_done'"),'VERSATILE_AUTO_DISPATCH');
 const grade=Array.from({length:5},(_,i)=>`  if jo9_trait_value_rate >= cont_atr_threshold[${i+1}]: jo9_trait_value_grade = ${i+1}`).join('\n');
 edit('jo9_traits_value',':jo9_trait_value_done',`jump 'jo9_trait_value_done'
:jo9_trait_value_grant_versatile
dynamic $replace({
 if dynslave['jo9_versatile'] = 0:
  dynslave['jo9_versatile'] = 1
  ! Grant one displayed fame grade through the original continuous attribute source.
  jo9_trait_value_rate = max(cont_atr_min, min(cont_atr_max, dynslave_rate['fame'])) + dynslave_rate['temp_fame']
  jo9_trait_value_grade = 0
${grade}
  if jo9_trait_value_grade < 5: dynslave_rate['fame'] = max(cont_atr_min, min(cont_atr_max, max(dynslave_rate['fame'], cont_atr_threshold[jo9_trait_value_grade + 1] - dynslave_rate['temp_fame'])))
  jo9_trait_value_rate = max(cont_atr_min, min(cont_atr_max, dynslave_rate['fame'])) + dynslave_rate['temp_fame']
  jo9_trait_value_grade = 0
${grade}
  dynslave['fame'] = jo9_trait_value_grade
 end
}, 'dyn'+'slave', $jo9_trait_value_actor)
:jo9_trait_value_done`,'VERSATILE_FAME_GRANT');
 const assignment="  else\r\n   dynslave[$args[0]] = args[1]\r\n  end";
 edit('jo9_traits',assignment,`  else
   if $args[0] = 'jo9_versatile' and args[1] = 1:
    gs 'jo9_traits_value', 'grant_versatile', 'dynslave'
   else
    dynslave[$args[0]] = args[1]
   end
  end`,'VERSATILE_MANUAL_GRANT');
 const desc=body(d,'jo9_traits').split('\r\n').find(s=>s.includes("if $args[1] = 'versatile': msg"));
 edit('jo9_traits',desc,desc.replace('기본 가치 +25%.','기본 가치 +25%. 새로 부여되는 순간 명성이 한 단계 오른다(최고 등급 유지).'),'VERSATILE_FAME_DESCRIPTION');
 const candidate=c.serialize(d);qa.inspectWorld(candidate);patch.after_sha256=c.hash(candidate);fs.mkdirSync(root+'/patches',{recursive:true});write(root+'/patches/'+patch.id+'.json',patch);write(record+'/patch.json',patch);fs.writeFileSync(root+'/inputs/candidate.qsp',candidate);
 assert.equal(d.locations.length,c.parse(raw).locations.length);console.log(JSON.stringify({after:patch.after_sha256,edits:patch.edits.length,newLocations:0}));
}else if(phase==='red'||phase==='green'){
 const raw=fs.readFileSync(root+'/inputs/'+(phase==='red'?'before':'candidate')+'.qsp'),d=c.parse(raw),dir=root+'/'+phase;fs.mkdirSync(dir,{recursive:true});let code="usehtml=1\r\ncont_atr_min=0\r\ncont_atr_max=200\r\n",checks=0;
 const check=(s,l)=>{checks++;return `if (${s})=0: msg 'JO9_QA_FAIL_${l}_${checks}' & exit\r\n`;};
 [0,10,20,40,80,160].forEach((v,i)=>code+=`cont_atr_threshold[${i}]=${v}\r\n`);
 function init(role,rate,trait=0,all=true,temp=0){let out=`killvar ${q(role)}\r\nkillvar ${q(role+'_rate')}\r\n${role}['jo9_versatile']=${trait}\r\n${role}_rate['fame']=${rate}\r\n${role}_rate['temp_fame']=${temp}\r\n${role}_rate['beauty']=37\r\n`;if(all)for(const k of skills)out+=`${role}[${q(k)}]=4\r\n`;return out;}
 const thresholds=[0,10,20,40,80,160],grade=r=>thresholds.filter(v=>r>=v).length-1;
 for(const role of['slave','assistant','room1'])for(const rate of[0,1,9,10,19,20,39,40,79,80,159,160,199,200])for(const temp of[-5,0,5]){
  const g=Math.max(0,grade(rate+temp)),expectedRate=g<5?Math.min(200,Math.max(rate,thresholds[g+1]-temp)):rate,expectedGrade=Math.max(0,grade(expectedRate+temp));
  code+=init(role,rate,0,true,temp)+`gs 'jo9_traits_value','refresh',${q(role)}\r\n`+check(`${role}['jo9_versatile']=1 and ${role}_rate['fame']=${expectedRate} and ${role}['fame']=${expectedGrade}`,'GRANT');
  code+=`gs 'jo9_traits_value','refresh',${q(role)}\r\nqa_price=func('jo9_traits_value','base_price',${q(role)},100)\r\n`+check(`${role}_rate['fame']=${expectedRate} and qa_price=125 and ${role}['beauty']=2`,'REFRESH_PRICE');
 }
 for(const role of['slave','assistant']){
  code+=init(role,19,1)+`gs 'jo9_traits_value','refresh',${q(role)}\r\n`+check(`${role}_rate['fame']=19`,'OLD_HOLDER');
  for(const missing of skills){code+=init(role,19)+`${role}[${q(missing)}]=3\r\ngs 'jo9_traits_value','refresh',${q(role)}\r\n`+check(`${role}_rate['fame']=19 and ${role}['jo9_versatile']=0`,'MISSING_A');}
  code+=init(role,19)+`${role}['jo9_versatile_manual_off']=1\r\ngs 'jo9_traits_value','refresh',${q(role)}\r\n`+check(`${role}_rate['fame']=19 and ${role}['jo9_versatile']=0`,'MANUAL_OFF');
  code+=init(role,19,0,false)+`gs 'jo9_traits','edit',${q(role)},'jo9_versatile',1\r\n`+check(`${role}_rate['fame']=20 and ${role}['fame']=2 and ${role}['jo9_versatile']=1`,'MANUAL_ON');
  code+=`gs 'jo9_traits','edit',${q(role)},'jo9_versatile',1\r\n`+check(`${role}_rate['fame']=20 and ${role}['jo9_versatile']=0 and ${role}['jo9_versatile_manual_off']=1`,'MANUAL_REMOVE');
  code+=`gs 'jo9_traits','edit',${q(role)},'jo9_versatile',1\r\n`+check(`${role}_rate['fame']=40 and ${role}['fame']=3 and ${role}['jo9_versatile']=1`,'MANUAL_REGRANT');
  code+=`gs 'jo9_traits','edit',${q(role)},'jo9_athlete',1\r\n`+check(`${role}_rate['fame']=40 and ${role}['jo9_athlete']=1`,'OTHER_TRAIT');
 }
 // Exercise the actual continuous-attribute grade loop, not a second test implementation.
 const stat=body(d,'#static_base'),start=stat.indexOf("\t\ti = 0\r\n\t\tn = arrsize('$cont_atr')",stat.indexOf('$dyn_calc_slave_attrs'));
 assert(start>=0,'Find actual attribute loop');const end=stat.indexOf("\tif dynslave['jo9_",start);let loop=stat.slice(start,end>start?end:stat.indexOf('\r\n\t! ',start));
 // Only its continuous-attribute loop, ending at original jump, is needed for fame persistence.
 const match=loop.match(/^[\s\S]*?jump 'slave_cont_loop'[^\r\n]*\r\n/);assert(match,'Native attribute loop ending');loop=match[0];
 code+=init('slave',19)+"gs 'jo9_traits_value','refresh','slave'\r\n$cont_atr[0]='fame'\r\n"+loop.replaceAll('dynslave','slave')+'\r\n'+check("slave_rate['fame']=20 and slave['fame']=2",'REAL_RECALC');
 code+="copyarr 'assistant','slave'\r\ncopyarr 'assistant_rate','slave_rate'\r\nsavegame 'fame.sav'\r\nmsg 'JO9_QA_FAME_grant_COMPLETE'";
 set(d,'Start',code);qa.inspectWorld(c.serialize(d));fs.writeFileSync(dir+'/grant.qsp',c.serialize(d));const plan=[{name:'grant',file:dir+'/grant.qsp',marker:'JO9_QA_FAME_grant_COMPLETE',checkpoint:'Actual auto/manual grant, boundaries, refresh, original grade loop and saved actor sources'}];write(dir+'/plan.json',plan);
 const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',dir+'/plan.json','-TimeoutSeconds','30'],{encoding:'utf8',windowsHide:true,timeout:50000});const results=read(dir+'/client-results.json');write(record+'/'+phase+'-results.json',{checks,results});fs.copyFileSync(dir+'/grant-stderr.log',record+'/evidence/'+phase+'-grant.log');console.log(JSON.stringify({phase,checks,results}));
 if(phase==='red')assert(results.every(v=>!v.pass));else{assert.equal(r.status,0);assert(results.every(v=>v.pass));const s=require(repo+'/tools/qa/save-codec.cjs'),saved=s.parse(fs.readFileSync(dir+'/fame.sav'));for(const role of['slave','assistant']){assert.equal(s.value(saved,role,'fame')[0],'2');assert.equal(s.value(saved,role+'_rate','fame')[0],'20');}write(record+'/save-persistence.json',{status:'PASS',roles:['slave','assistant'],fame:2,sourceRate:20});}
}else if(phase==='install'){
 const p=read(record+'/patch.json'),reports=fs.readdirSync(root+'/release').map(n=>read(root+'/release/'+n+'/report.json')),r=reports.at(-1);assert.equal(r.verdict,'PASS');assert(read(record+'/green-results.json').results.every(x=>x.pass));assert.equal(read(record+'/independent-review.json').status,'PASS');assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),p.before_sha256);const old=new Set(fs.readdirSync(game));
 const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',root+'/patches'],{encoding:'utf8',windowsHide:true,timeout:30000});fs.writeFileSync(record+'/install.log',run.stdout+'\n'+run.stderr);assert.equal(run.status,0);assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),p.after_sha256);fs.copyFileSync(root+'/patches/'+p.id+'.json',repo+'/mods/'+p.id+'.json');write(record+'/release-validation.json',r);
 for(const v of read(record+'/inputs.json'))assert.equal(c.hash(fs.readFileSync(v.path)),v.path===game+'/jack.qsp'?p.after_sha256:v.sha256,'Protected '+v.path);write(record+'/install-backups.json',fs.readdirSync(game).filter(n=>!old.has(n)&&n.startsWith('jack.qsp.bak_')).map(n=>game+'/'+n));write(record+'/FINAL_RESULT.json',{status:'WORK_APPLIED',id:p.id,before:p.before_sha256,after:p.after_sha256,edits:p.edits.length,newLocations:0,newPersistentKeys:0,focusedChecks:read(record+'/green-results.json').checks,nativeReleasePaths:9,protectedSaves:read(record+'/inputs.json').length-4,commitPush:false});console.log('WORK applied, protected saves/CSS/Full preserved');
}else if(phase==='finish'){
 const r=read(record+'/FINAL_RESULT.json');assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),r.after);fs.writeFileSync(record+'/scripts/reproduce.cjs',fs.readFileSync(__filename));
 fs.writeFileSync(record+'/MANUAL_KO.md',`# 다재다능 부여 순간 명성 상승\n\n사용자 확정대로 신규 부여 시 개인 명성이 한 단계 오른다. 주인공의 상표·길드·지역 평판과 별개다. 기준 누적값은0·10·20·40·80·160이며 최고 표시5를 유지한다. 다음 등급의 최소값으로 올려 기존 진행을 지우지 않는다.\n\n기존 jo9_traits_value에 grant_versatile 모드를 추가했다. 입력 $args[1]은 기존 인물 역할(slave/assistant/room 등), 반환 result는 기존0이다. 자동 refresh는 모든24기술이A 이상인 기존 조건이 성립할 때 공통 라벨로 이동한다. 편집기 jo9_traits/edit는0→1에만 같은 helper를 호출한다. 자기 자신을 재귀 호출하지 않는다.\n\n부작용은 인물의 jo9_versatile=1과 원천 role_rate[fame]·표시 role[fame] 갱신이다. temp_fame가 있으면 이를 반영하여 기존 재계산과 일치시키며 원천0~200·표시0~5를 유지한다. 새 로케이션·영구키·세이브 형식 이관이 없다. 이미 보유한 기존 인물은 소급하지 않는다. 반복 refresh/판매가 평가에서는 추가 보상이 없다. 편집기로 해제해도 이미 얻은 명성은 회수하지 않으며 다시 부여하면 새 부여로 취급한다. 평생1회 제한을 새로 추가하지 않았다.\n\n기존 기본 가치+25%, 전체 기술A 획득 조건, manual_off, 외모·절세미인 계산은 그대로다. 명성 원천이 판매가에 미치는 기존 영향은 정상적으로 따라온다. helper를 삭제하면 가치·특성의 기존 호출들도 실패하므로 분리 삭제하면 안 된다. 명성 블록만 제거하면 신규 명성 보너스만 사라진다. QSP의 VERSATILE_* 표식과 patch.json으로 변경 지점을 찾는다. 설명문은 jo9_traits/describe에 있으며 매 호출 실행되므로 별도 문자열 캐시 변경이 없다.\n\n실제 FastQSP에서 자동/수동 부여, 명성 경계·임시값·상한, 기존 보유자·반복·24개 조건 누락·수동 해제/재부여·다른 특성 불변·원래 연속속성 재계산·COPYARR·진단 세이브 저장을 검사했다(${r.focusedChecks}조건 PASS). 공식 출고9경로, 구조·줄/주석 경계·정확 패치 재생/재적용 PASS. 기존 GUI 저장파일 불러오기와 모든 게임 화면 플레이를 전수 확인한 결과는 아니다.\n\n기존 사용자 세이브·CSS·이미지·JSON·Full·ZIP은 보존했다. WORK만 적용했고 커밋·푸시하지 않았다. before.qsp.gz와 패치·재현 스크립트·검사 결과를 남기고 임시진단 자료는 정리했다.\n`);
 const p=repo+'/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md';fs.appendFileSync(p,'\r\n\r\n## WORK 수정 완료 — 다재다능 명성 (VERSATILE_FAME_20261024)\r\n\r\n- 다재다능을 새로 부여하는 순간 개인 명성 한 단계 상승, 최고등급5 유지. 자동/편집기 공통 처리, 기존 보유자 소급·refresh 중복 없음. 기존 전체A조건과 기본가치25% 보존.\r\n- 기존 세이브 형식/새 저장키/로케이션 추가 없음. 실제 명성 원천·표시·저장·경계검사와 공식9경로·문법·재생/재적용·독립검토 PASS. WORK만 반영, Full/ZIP/커밋/푸시 없음.\r\n- [동작·호출·검증 한계](../records/versatile-fame-20261024/MANUAL_KO.md).\r\n');
 const plan=repo+'/docs/superpowers/plans/2026-10-24-versatile-fame.md';fs.writeFileSync(plan,fs.readFileSync(plan,'utf8').replaceAll('- [ ]','- [x]'));
 assert.equal(c.hash(zlib.gunzipSync(fs.readFileSync(record+'/before.qsp.gz'))),r.before);for(const p of read(record+'/install-backups.json')){assert.equal(path.dirname(path.resolve(p)),path.resolve(game));assert(path.basename(p).startsWith('jack.qsp.bak_'));assert(!fs.lstatSync(p).isSymbolicLink());assert.equal(c.hash(fs.readFileSync(p)),r.before);fs.unlinkSync(p);}
 const abs=path.resolve(root);assert.equal(abs,path.resolve('G:/Codex/tmp/jo9-versatile-fame-20261024'));let count=0,bytes=0;function inspect(p){assert(p===abs||p.startsWith(abs+path.sep));const st=fs.lstatSync(p);assert(!st.isSymbolicLink());if(st.isDirectory())for(const n of fs.readdirSync(p))inspect(path.join(p,n));else{count++;bytes+=st.size;}}inspect(abs);fs.rmSync(abs,{recursive:true});write(record+'/cleanup.json',{root:abs,removedFiles:count,removedMiB:Math.round(bytes/1048576),minimalOriginalPreserved:true});console.log('Recorded and cleaned task temporary files');
}else throw Error('Unknown phase');
