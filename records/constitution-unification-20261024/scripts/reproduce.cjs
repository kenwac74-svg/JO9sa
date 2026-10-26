'use strict';
const fs=require('node:fs'),cp=require('node:child_process'),z=require('node:zlib'),a=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',root='G:/Codex/tmp/jo9-constitution-unification-20261024',rec=repo+'/records/constitution-unification-20261024';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const beforeHash='5560055182d40dd856791dc948429beb7ba636e118e20b748ce0ad91d2546ea7',roles=['slave','assistant','room1','room2','room3','room4','prisoner','cow','farmhand','harpy','pig'];
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'),cr=s=>s.replace(/\r?\n/g,'\r\n');
const body=(d,n)=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),set=(d,n,s)=>d.lines[d.locations.find(x=>x.name===n).body]=c.shift(cr(s),-5);
const phase=process.argv[2];
function protect(){return [game+'/jack.qsp',game+'/css/base.css',game+'/FastQSP.ini',game+'/../FastQSP.ini','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/css/base.css',...fs.readdirSync(game+'/save').filter(n=>/\.sav$/i.test(n)).map(n=>game+'/save/'+n)].map(p=>({path:p,sha256:c.hash(fs.readFileSync(p))}));}
function run(d,dir,name,code){fs.mkdirSync(dir,{recursive:true});set(d,'Start',code);const raw=c.serialize(d);qa.inspectWorld(raw);fs.writeFileSync(dir+'/'+name+'.qsp',raw);write(dir+'/plan.json',[{name,file:dir+'/'+name+'.qsp',marker:'JO9_QA_CONST_'+name.replaceAll('-','_')+'_COMPLETE',checkpoint:'Actual production constitution functions in installed FastQSP'}]);const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',dir+'/plan.json','-TimeoutSeconds','45'],{encoding:'utf8',windowsHide:true,timeout:60000});const results=read(dir+'/client-results.json'),log=new TextDecoder('euc-kr').decode(fs.readFileSync(dir+'/'+name+'-stderr.log'));return {exit:r.status,results,failure:(log.match(/FAIL_CONST_[^"\r\n]+/)||[])[0],log:dir+'/'+name+'-stderr.log'};}
if(phase==='prepare'){
 a(!fs.existsSync(root));a(!fs.existsSync(rec));fs.mkdirSync(root+'/inputs',{recursive:true});fs.mkdirSync(root+'/patches');fs.mkdirSync(rec+'/scripts',{recursive:true});fs.mkdirSync(rec+'/evidence');const raw=fs.readFileSync(game+'/jack.qsp');a.equal(c.hash(raw),beforeHash);qa.inspectWorld(raw);a.deepEqual(c.serialize(c.parse(raw)),raw);fs.writeFileSync(root+'/inputs/before.qsp',raw);fs.writeFileSync(rec+'/before.qsp.gz',z.gzipSync(raw,{level:9}));a.deepEqual(z.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz')),raw);write(rec+'/inputs.json',protect());
 const source=repo+'/records/constitution-improvement-proposal-20261024/unification-proposal.json',spec=read(source);spec.confirmed.numericPackageApproved=true;spec.status='USER_APPROVED_2026_10_24';spec.next='IMPLEMENT_AND_TEST_WORK_ONLY';write(source,spec);write(rec+'/approved-scope.json',spec);
 fs.writeFileSync(repo+'/docs/superpowers/plans/2026-10-24-constitution-unification.md',cr(`# 건강체질·체질개선 통합 구현 계획\n\n**Goal:** 1000스파크1회시술로 기존 건강체질을 획득하고 전투1.2배·운동교육1.5배·영양휴식성장1.5배를 공유한다.\n**Architecture:** 기존 jo9_traits_combat에 시술/자연성장 분기, 기존 병원 메뉴2곳 연결. 기존jo9_constitution을 공유하고 개인별 시술이력과 자연성장반점 잔여만 저장한다. 후보는 G:/Codex/tmp에서 격리 생성하고 통과 후 기존 apply_mods로WORK만 적용.\n**Tech Stack:** QSP5.7/FastQSP, Node 코덱, JSON patch, PowerShell 검사기.\n**Spec:** records/constitution-unification-20261024/approved-scope.json. 사용자 진행 승인.\n\n## 제약과 판단\n- 새 별도 성장배율·성취특성·8칸제한·후유증/부상/재활기간을 추가하지 않음. 이미 다른 시술의 재활중이면 진입 불가.\n- 약골→건강 대체, 기존건강/시술완료/돈부족/부재·기절/재활중은 무결제. 확인과 결제 직전에 재검사.\n- 이미 보유한 건강도 새 전투수치 공유. 기존교육절사·약골패널티·원래 성장조건/한도 유지.\n- 영양+휴식3곳의 새 양수만 증폭. 기본체력교육은 기존1.5 유지하여 중복곱 금지. 공통누적rate정산 수정금지.\n- 신규직접생성3곳만 새키0. 역할교환·세이브·날짜·등급/특성변화에 이력/반점 유지.\n- 기존세이브보존, Full/ZIP/이미지/커밋/푸시 없음.\n\n## Review Focus\n중복결제/구메뉴콜백, 인물교체확인창, 하위역할배열보존, +1누적과음수보존, 기존교육/전투직업의독립배율, 신규생성부채상속금지.\n\n- [ ] 1. baseline 실제엔진 RED: 기본100의건강HP는120이어야하며현재150으로실패.\n- [ ] 2. 최소후보와패치생성: 건강전투/설명,3자연성장,2병원메뉴,구캐시/신규생성보완.\n- [ ] 3. GREEN: 11역할·3체질·전투직업조합·XP/잔여·범위/하한 검사.\n- [ ] 4. 병원성공/취소/거부/재진입/인물교환/신규생성/저장/구메뉴/일일경로 실제엔진 검사.\n- [ ] 5. 구조/줄/주석경계·정확재생/재적용·공식9경로·독립리뷰.\n- [ ] 6. 최신WORK해시확인후적용,82보호파일보존검사·설명서·묶음갱신·재생가능임시자료정리.\n- [ ] 7. 결과보고후다음항목사용자승인대기.\n`));fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');console.log(JSON.stringify({prepared:true,baseline:beforeHash,protectedFiles:read(rec+'/inputs.json').length}));
}else if(phase==='red'){
 const d=c.parse(fs.readFileSync(root+'/inputs/before.qsp')),r=run(d,root+'/red','missing',"usehtml=1\n$onnewloc=''\n$counter=''\ngs 'refresh_database'\nslave_state=1\nslave['jo9_constitution']=1\nslave['jo9_combat_trait']=0\nslave['courage']=0\ngs 'jo9_traits_combat','setup','slave',100,100,100\nif макс_здоровье_игрока ! 120: msg 'FAIL_CONST_hp_observed_<<макс_здоровье_игрока>>' & exit\nmsg 'JO9_QA_CONST_missing_COMPLETE'");fs.copyFileSync(r.log,rec+'/evidence/red.log');write(rec+'/red-results.json',{status:'EXPECTED_FAILURE',...r});a(r.failure&&r.failure.includes('observed_150'));console.log(JSON.stringify(r));
}else if(phase==='build'){
 const d=c.parse(fs.readFileSync(root+'/inputs/before.qsp')),edits=[];
 function edit(location,old,newText,id){old=cr(old);newText=cr(newText);const t=body(d,location);a.equal(t.split(old).length-1,1,id);set(d,location,t.split(old).join(newText));edits.push({location,field:'body',old,new:newText,count:1,patchId:id});}
 edit('jo9_traits_combat',"  jo9_trait_combat_hp_num *= 3 & jo9_trait_combat_hp_den *= 2\n  jo9_trait_combat_sta_num *= 3 & jo9_trait_combat_sta_den *= 2",`  ! JO9 MOD START CONST_HEALTHY_BATTLE_120 | 2026-10-24_constitution_unification
  jo9_trait_combat_hp_num *= 6 & jo9_trait_combat_hp_den *= 5
  jo9_trait_combat_sta_num *= 6 & jo9_trait_combat_sta_den *= 5
  ! JO9 MOD END CONST_HEALTHY_BATTLE_120`,'CONST_HEALTHY_BATTLE_120');
 edit('jo9_traits_combat','! Combine independent fractions before integer division: healthy + veteran = 9/4 once.','! Combine independent fractions before integer division: healthy + veteran = 9/5 once.','CONST_BATTLE_FRACTION_NOTE');
 edit('jo9_traits'," if $args[1] = 'healthy': msg '건강체질: 전투 최대 체력·스태미나 및 운동 관련 교육의 양의 경험치 ×1.5. 약골과 양립하지 않습니다.'",` ! JO9 MOD START CONST_HEALTHY_DESCRIPTION | 2026-10-24_constitution_unification
 if $args[1] = 'healthy': msg '건강체질: 전투 최대 체력·스태미나 +20%. 운동 관련 교육 경험치와 식사·보조식품·충분한 휴식으로 얻는 체력 성장량 +50%. 기존 성장 조건과 상한은 유지됩니다. 선천적으로 타고나거나 의료센터의 체질개선 시술로 얻습니다. 약골과 양립하지 않습니다.'
 ! JO9 MOD END CONST_HEALTHY_DESCRIPTION`,'CONST_HEALTHY_DESCRIPTION');
 const handlers=`! JO9 MOD START CONST_GROWTH_AND_CLINIC | 2026-10-24_constitution_unification
if $args[0] = 'natural_stamina_xp':
 result = args[2]
 if result > 0 and $args[1] ! '':
  local jo9_const_health = dyneval('result = ' + $args[1] + '["jo9_constitution"]')
  if jo9_const_health = 1:
   local jo9_const_half = dyneval('result = ' + $args[1] + '["jo9_constitution_half"]')
   local jo9_const_total = args[2] * 3 + max(0, min(1, jo9_const_half))
   result = jo9_const_total / 2
   dynamic $args[1] + '["jo9_constitution_half"] = ' + str(jo9_const_total mod 2)
  end
 end
 exit
end

if $args[0] = 'constitution_reason':
 $result = ''
 if $args[1] ! 'slave' and $args[1] ! 'assistant': $result = '시술 대상을 다시 선택해 주세요.' & exit
 if $place ! 'hospital': $result = '의료센터에서 시술을 신청해 주세요.' & exit
 local jo9_const_state = dyneval('result = ' + $args[1] + '_state')
 if jo9_const_state ! CONST_INT['slave_exist']: $result = '의식이 있는 노예나 조수만 시술받을 수 있습니다.' & exit
 local jo9_const_exam = dyneval('result = ' + $args[1] + '["health_issues_revealed"]')
 if jo9_const_exam ! 1: $result = '먼저 검진을 받아야 합니다.' & exit
 local jo9_const_health = dyneval('result = ' + $args[1] + '["jo9_constitution"]')
 if jo9_const_health = 1: $result = '이미 건강체질입니다.' & exit
 local jo9_const_done = dyneval('result = ' + $args[1] + '["jo9_constitution_treated"]')
 if jo9_const_done ! 0: $result = '이미 체질개선 시술을 받았습니다. 다시 시술받을 수 없습니다.' & exit
 local jo9_const_rehab = dyneval('result = ' + $args[1] + '["rehabilitation"]')
 if jo9_const_rehab > 0: $result = '다른 시술에서 회복 중입니다.' & exit
 if sparks < 1000: $result = '스파크가 부족합니다.' & exit
 exit
end

if $args[0] = 'constitution_menu':
 if $args[1] ! 'slave' and $args[1] ! 'assistant': exit
 local $jo9_const_icon = $menu_item_S_augmentation
 local $jo9_const_gray = $menu_item_S_augmentation_gray
 if $args[1] = 'assistant': $jo9_const_icon = $menu_item_A_augmentation & $jo9_const_gray = $menu_item_A_augmentation_gray
 if $func('jo9_traits_combat', 'constitution_reason', $args[1]) = '':
  local $jo9_const_command = 'gs ''jo9_traits_combat'', ''constitution_ask'', ''' + $args[1] + ''''
  func('$menu', 'exec', $jo9_const_icon, $jo9_const_command, '체질개선 (1000$)', '인물당 1회. 건강체질을 얻습니다. 약골은 건강체질로 바뀝니다. 체력 등급은 정상적인 육성으로 높아집니다.')
 else
  local $jo9_const_reason = $func('jo9_traits_combat', 'constitution_reason', $args[1])
  func('$menu', 'exec', $jo9_const_gray, empty, '체질개선 (1000$)', $jo9_const_reason)
 end
 exit
end

if $args[0] = 'constitution_ask':
 if $func('jo9_traits_combat', 'constitution_reason', $args[1]) ! '':
  local $jo9_const_reason = $func('jo9_traits_combat', 'constitution_reason', $args[1])
  msg $jo9_const_reason
  gt 'shop_general'
 end
 local jo9_const_id = dyneval('result = ' + $args[1] + '["id"]')
 local jo9_const_page = iif($args[1] = 'assistant', 3, 2)
 local $jo9_const_name = dyneval('$result = $' + $args[1] + '_name')
 $text[1] = $jo9_const_name + '에게 체질개선 시술을 받게 하시겠습니까?<br><br>비용: 1000스파크 · 인물당 1회<br><br>건강체질을 얻습니다. 전투 최대 체력·스태미나 +20%, 운동 관련 교육 경험치 및 식사·보조식품·충분한 휴식의 체력 성장량 +50%. 약골은 건강체질로 바뀝니다. 기존 성장 조건과 상한은 유지됩니다.'
 $yes = 'gs ''jo9_traits_combat'', ''constitution_finish'', ''' + $args[1] + ''', ' + str(jo9_const_id)
 $no = 'sp_txt = ' + str(jo9_const_page) + ' & killobj & gt ''shop_general'''
 txt = 1
 txt_count = 1
 npc = 0
 $picture_type = ''
 $special_image[1] = ''
 gt 'choice_screen'
end

if $args[0] = 'constitution_commit':
 result = 0
 $jo9_constitution_notice = ''
 if $func('jo9_traits_combat', 'constitution_reason', $args[1]) ! '':
  $jo9_constitution_notice = $func('jo9_traits_combat', 'constitution_reason', $args[1])
  exit
 end
 local jo9_const_id = dyneval('result = ' + $args[1] + '["id"]')
 if jo9_const_id ! args[2]: $jo9_constitution_notice = '시술 대상이 바뀌었습니다. 대상을 다시 선택해 주세요.' & exit
 sparks -= 1000
 dynamic $args[1] + '["jo9_constitution"] = 1 & ' + $args[1] + '["jo9_constitution_treated"] = 1'
 $jo9_constitution_notice = '체질개선 시술을 마쳤습니다. 이제 건강체질의 효과를 받습니다.'
 result = 1
 exit
end

if $args[0] = 'constitution_finish':
 local jo9_const_page = iif($args[1] = 'assistant', 3, 2)
 gs 'jo9_traits_combat', 'constitution_commit', $args[1], args[2]
 if $jo9_constitution_notice ! '': msg $jo9_constitution_notice
 sp_txt = jo9_const_page
 killobj
 gt 'shop_general'
end
! JO9 MOD END CONST_GROWTH_AND_CLINIC

`;
 edit('jo9_traits_combat',"if $args[0] = 'setup':",handlers+"if $args[0] = 'setup':",'CONST_GROWTH_AND_CLINIC');
 for(const [old,newText,id]of [
  ["if slave['well_rested'] >= slave['stamina'] and slave['stamina'] < 3: slave_rate['stamina'] += 2","if slave['well_rested'] >= slave['stamina'] and slave['stamina'] < 3: slave_rate['stamina'] += func('jo9_traits_combat', 'natural_stamina_xp', 'slave', 2)",'CONST_REST_GROWTH'],
  ["\t\t\tif dynslave['stamina'] < 3: dynslave_rate['stamina'] += min(dynslave['calories'], dynslave['metabolism'])","\t\t\tif dynslave['stamina'] < 3: dynslave_rate['stamina'] += func('jo9_traits_combat', 'natural_stamina_xp', 'dynslave', min(dynslave['calories'], dynslave['metabolism']))",'CONST_FOOD_GROWTH'],
  ["\tif slave['stamina'] < 3: slave_rate['stamina'] += iif(slave['diet_portion'] = 4, 2, 1) & !Added stamina bonus for supplements with nutritionist - crushboss","\tif slave['stamina'] < 3: slave_rate['stamina'] += func('jo9_traits_combat', 'natural_stamina_xp', 'slave', iif(slave['diet_portion'] = 4, 2, 1))",'CONST_SUPPLEMENTS_GROWTH']])edit('next_day',old,`! JO9 MOD START ${id} | 2026-10-24_constitution_unification\n${newText}\n! JO9 MOD END ${id}`,id);
 for(const [loc,actor]of [['get_demo_slave','slave'],['get_special_slave','slave'],['get_special_assistant_quest','assistant']]){const anchor='! JO9 MOD END MUSCULAR_OVERWORK_INIT_'+loc.toUpperCase(),id='CONST_FRESH_'+loc.toUpperCase();edit(loc,anchor,`${anchor}
! JO9 MOD START ${id} | 2026-10-24_constitution_unification
${actor}['jo9_constitution_treated'] = 0
${actor}['jo9_constitution_half'] = 0
! JO9 MOD END ${id}`,id);}
 const opts=body(d,'#options'),firstLine=opts.split('\r\n')[0];edit('#options',firstLine,`! JO9 MOD START CONST_MENU_RELOAD_ENTRY | 2026-10-24_constitution_unification
if $args[0] = 'constitution_menu_reload': jump 'jo9_const_clinic_menu'
! JO9 MOD END CONST_MENU_RELOAD_ENTRY
${firstLine}`,'CONST_MENU_RELOAD_ENTRY');
 edit('#options','$hospital_options[2] = {',`:jo9_const_clinic_menu
$hospital_options[2] = {`,'CONST_MENU_RELOAD_LABEL');
 for(const [page,next,actor]of [[2,3,'slave'],[3,31,'assistant']]){
  const s=body(d,'#options'),start=s.indexOf('$hospital_options['+page+'] = {'),end=s.indexOf('$hospital_options['+next+'] = {',start+1),last=s.lastIndexOf("\tfunc('$menu', '===END===')",end),old=s.slice(start,end),id='CONST_CLINIC_MENU_'+actor.toUpperCase();a(last>start&&end>last);const newText=old.replace("\tfunc('$menu', '===END===')\r\n}",`\t! JO9 MOD START ${id} | 2026-10-24_constitution_unification
\tgs 'jo9_traits_combat', 'constitution_menu', '${actor}'
\t! JO9 MOD END ${id}
\tfunc('$menu', '===END===')
}`);a(newText!==old);edit('#options',old,newText,id);
 }
 edit('#options','$hospital_options[31] = {',`! JO9 MOD START CONST_MENU_RELOAD_EXIT | 2026-10-24_constitution_unification
if $args[0] = 'constitution_menu_reload': exit
! JO9 MOD END CONST_MENU_RELOAD_EXIT
$hospital_options[31] = {`,'CONST_MENU_RELOAD_EXIT');
 const onload=body(d,'$ongload').split('\r\n')[0];edit('$ongload',onload,`! JO9 MOD START CONST_CLINIC_LOAD_CACHE | 2026-10-24_constitution_unification
if instr($hospital_options[2], 'CONST_CLINIC_MENU_SLAVE') = 0 or instr($hospital_options[3], 'CONST_CLINIC_MENU_ASSISTANT') = 0: gs '#options', 'constitution_menu_reload'
if $place = 'hospital':
 $display_options[2] = $hospital_options[2]
 $display_options[3] = $hospital_options[3]
end
! JO9 MOD END CONST_CLINIC_LOAD_CACHE
${onload}`,'CONST_CLINIC_LOAD_CACHE');
 const raw=c.serialize(d);qa.inspectWorld(raw);a.equal(c.parse(raw).locations.length,267);const replay=c.parse(fs.readFileSync(root+'/inputs/before.qsp'));for(const e of edits)set(replay,e.location,body(replay,e.location).split(e.old).join(e.new));a.deepEqual(c.serialize(replay),raw,'Literal replay must match before engine tests');a.equal((body(d,'jo9_traits_combat').match(/END TRAITS_COMBAT/g)||[]).length,1,'No duplicated module from replacement metacharacters');const p={id:'2026-10-24_constitution_unification',description:'건강체질 전투+20%,기존운동교육+50%유지,영양/보조식품/휴식 새체력성장+50%와반점누적. 医療센터1000스파크1회후천획득,약골대체,동일효과중복없음. 기존세이브보존.',before_sha256:beforeHash,after_sha256:c.hash(raw),edits};fs.writeFileSync(root+'/inputs/candidate.qsp',raw);write(root+'/patches/'+p.id+'.json',p);write(rec+'/patch.json',p);fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');console.log(JSON.stringify({candidate:p.after_sha256,edits:edits.length,bodies:[...new Set(edits.map(x=>x.location))],newLocations:0,newActorKeys:2}));
}else if(phase==='restore-fixtures'){
 a(!fs.existsSync(root));const p=read(rec+'/patch.json'),raw=z.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz'));a.equal(c.hash(raw),p.before_sha256);fs.mkdirSync(root+'/inputs',{recursive:true});fs.mkdirSync(root+'/patches');fs.writeFileSync(root+'/inputs/before.qsp',raw);const d=c.parse(raw);for(const e of p.edits){const t=body(d,e.location);a.equal(t.split(e.old).length-1,e.count);set(d,e.location,t.split(e.old).join(e.new));}const candidate=c.serialize(d);a.equal(c.hash(candidate),p.after_sha256);fs.writeFileSync(root+'/inputs/candidate.qsp',candidate);write(root+'/patches/'+p.id+'.json',p);console.log('Restored isolated inputs; WORK unchanged.');
}else if(phase==='install'){
 const p=read(rec+'/patch.json');a.equal(read(rec+'/green-all-results.json').status,'PASS');a.equal(read(rec+'/integration-results.json').status,'PASS');a.equal(read(rec+'/ui-flow-results.json').status,'PASS');for(const role of ['slave','assistant'])a.equal(read(rec+'/ui-ask-'+role+'-results.json').status,'PASS');
 const release='G:/Codex/tmp/jo9-constitution-unification-release-20261024',runs=fs.readdirSync(release).filter(n=>n.startsWith('run-'));a.equal(runs.length,1);const rd=release+'/'+runs[0],gate=read(rd+'/report.json');a.equal(gate.verdict,'PASS');a(gate.client.probes.length===9&&gate.client.probes.every(x=>x.pass));a.equal(gate.checks.find(x=>x.name==='inputs-readable').detail.candidate,p.after_sha256);
 for(const x of read(rec+'/inputs.json'))a.equal(c.hash(fs.readFileSync(x.path)),x.sha256,'Preinstall protected '+x.path);const oldNames=new Set(fs.readdirSync(game));
 const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',root+'/patches'],{encoding:'utf8',windowsHide:true,timeout:90000});fs.writeFileSync(rec+'/install.log',r.stdout+'\n'+r.stderr);a.equal(r.status,0);a.deepEqual(fs.readFileSync(game+'/jack.qsp'),fs.readFileSync(root+'/inputs/candidate.qsp'));a.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),p.after_sha256);
 p.description=p.description.split('医療센터').join('의료센터');write(rec+'/patch.json',p);write(repo+'/mods/'+p.id+'.json',p);fs.copyFileSync(rd+'/report.json',rec+'/release-validation.json');fs.copyFileSync(rd+'/report.md',rec+'/release-validation.md');write(rec+'/install-backups.json',fs.readdirSync(game).filter(n=>!oldNames.has(n)&&n.startsWith('jack.qsp')).map(n=>game+'/'+n));
 const xs=read(rec+'/inputs.json').map(x=>({...x,expected:x.path===game+'/jack.qsp'?p.after_sha256:x.sha256,after:c.hash(fs.readFileSync(x.path))}));for(const x of xs)a.equal(x.after,x.expected);write(rec+'/preservation.json',{status:'PASS',files:xs.length,unchanged:xs.length-1,userSavesUnchanged:76,onlyChanged:game+'/jack.qsp',results:xs});write(rec+'/independent-review.json',{status:'PASS',reviewers:['/root/overwork_rounding_review','/root/constitution_final_review'],mode:'Read-only independent exact replay and functional review; no separate engine execution',newBlockingFindings:[],resolved:['literal replacement source duplication','single string reason avoids native mixed RESULT type','button appended within existing column_1'],confirmed:['267 locations;8 changed bodies','guard and id revalidation before one payment','only3natural-growth sources','old user trait values/progress preserved','hospital-only display cache refresh','actor fields follow swaps']});fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');console.log(JSON.stringify({installed:true,work:p.after_sha256,userSavesUnchanged:76,otherProtectedFiles:81}));
}else if(phase==='archive-cleanup'){
 a.equal(c.hash(z.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz'))),beforeHash);fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');fs.writeFileSync(rec+'/scripts/cleanup.ps1','\uFEFF'+fs.readFileSync('.constitution-cleanup.ps1','utf8').replace(/^\uFEFF/,''));console.log('Reproduction and scoped cleanup script archived; recovery gzip verified.');
}else if(phase==='verify'){
 const p=read(rec+'/patch.json'),raw=fs.readFileSync(game+'/jack.qsp');a.equal(c.hash(raw),p.after_sha256);qa.inspectWorld(raw);a.deepEqual(c.serialize(c.parse(raw)),raw);a.equal(c.hash(z.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz'))),p.before_sha256);const inputs=read(rec+'/inputs.json');for(const x of inputs)a.equal(c.hash(fs.readFileSync(x.path)),x.path===game+'/jack.qsp'?p.after_sha256:x.sha256);a(!fs.existsSync(root));a(!fs.existsSync('G:/Codex/tmp/jo9-constitution-unification-release-20261024'));a.equal(read(rec+'/cleanup.json').status,'PASS');const result={final:'PASS',work:p.after_sha256,protectedFiles:inputs.length,oldUserSavesUnchanged:76,tempRootsAbsent:true,rollbackExact:true};write(rec+'/final-verification.json',result);console.log(JSON.stringify(result));
}else if(phase==='document'){
 const p=read(rec+'/patch.json'),g=read(rec+'/green-all-results.json'),it=read(rec+'/integration-results.json');a.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),p.after_sha256);const cases=g.cases+it.cases+6,checks=g.assertions+it.assertions+26;
 const manual=`# 건강체질·체질개선 통합

패치2026-10-24_constitution_unification. 사용자 승인으로 WORK에만 적용했다. 가격1000스파크, 인물당1회. 의료센터의 노예/조수 신체 개조 메뉴 오른쪽에서 ‘체질개선’을 고르고 기존 확인 화면에서 승인하거나 취소한다.

## 효과

선천 보유와 시술 획득은 같은 jo9_constitution=1 건강체질이다. 시술은 약골(-1)을 건강체질(1)로 교체하거나 무특성(0)에 건강체질을 부여한다. 별도 시술 배율·추가 성취/특성 슬롯은 없다.

| 항목 | 적용 후 |
|---|---|
| 전투 최대HP·스태미나 | +20%(기존+50%에서 조정). 다른 전투 직업 배율과 분수를 합친 뒤 한 번 정수 나눗셈 |
| 기존 운동 계열4과목 | stamina/calisthenics/gladiatrix/dressage의 양수 교육XP+50%, 기존 절사·약골 보정 유지 |
| 영양·보조식품·충분휴식의 기본 체력 성장 | 기존 조건을 충족한 새 양수 증가량에+50%. 인물별 반점 잔여로+1 네 번이면1,2,1,2=합계6 |
| 시술 순간 체력/AP | 현재 단계·진행도·행동력·부상·재활수치는 유지. 정상 육성으로 체력 단계 상승 |

기존 건강체질도 같은 새 효과를 받는다. 원래 식이·보조식품·충분휴식의 stamina<3 조건과 체형 상한은 유지한다. 이미 보정한 체력 교육에 자연성장 배율을 다시 곱하지 않는다. 약골 자체의0.5배 페널티는 그대로이며 시술받으면 같은 축의 건강체질로 바뀐다. 음수 손실·이전 누적 경험치·고정 단계 변경·스테로이드·의료 기절 회복·야간 활동 보상은 이번 자연성장 확대에 포함하지 않았다.

## 시술·저장·부작용 방어

이미 건강체질이거나 시술 이력이 있으면 구매할 수 없다. 대상 부재·기절/비정상 상태·미검진·재활 중·의료센터 밖·1000 미만도 거부한다. 확인 후 승인 시 같은 조건과 인물ID를 다시 검사한다. 돈 부족 또는 대상 교체가 생기면 결제와 효과를 모두 취소한다. 취소 버튼은 돈·특성을 바꾸지 않고 원래 노예/조수 병원 페이지로 돌아간다.

시술 성공은1000 차감, 건강체질1, 시술 이력1을 한 실행에서 기록한다. 재클릭·예전 확인 콜백 재실행은 중복 결제되지 않는다. 이후 편집 등으로 건강체질을 없애도 이력은 남아 재시술하지 못한다. 선천 보유자를 자동으로 ‘시술받음’으로 표시하지 않는다. 현재 건강체질 보유 자체로 시술을 차단한다.

새 인물별 숫자키는2개다. jo9_constitution_treated(0/1)은 시술 이력이고 jo9_constitution_half(0/1)는 아직 정산하지 않은 자연성장0.5점이다. 기존 세이브의 없는 키는0. 저장·역할 교환·냉동 보관·날짜·체질 변경에서 이력/잔여를 유지한다. 새 직접 생성3곳만0으로 초기화한다. 일반 stock 생성과 clone은 기존 전체 배열 clear를 따른다. 기존 생성자의 다른 체질값 복사 정책은 이번에 변경하지 않았다.

## 코드·입출력·의존성

| 안정된 패치ID/위치 | 입력 → 결과 | 호출·분리 영향 |
|---|---|---|
| CONST_HEALTHY_BATTLE_120 / jo9_traits_combat setup | 건강값·기본최대치 → 6/5배. 기존 직업·용기 배율과 조합 | 원래 전투 시작 경로가 호출. 설명과 함께 바꿔야 UI와 계산이 맞음 |
| CONST_GROWTH_AND_CLINIC / natural_stamina_xp | 역할·새XP → 숫자 반환, 건강일 때만1.5배와 반점 저장 | next_day의3연결에서만 호출. 현재 누적XP 자체는 수정하지 않음 |
| CONST_REST/FOOD/SUPPLEMENTS_GROWTH / next_day | 충분휴식+2, 양수열량 min, 보조식품1/2 → 위 반환값을 더함 | 식이 helper의 dynslave 치환은 기존 비동결 인물11역할 전체를 포함. 연결을 빼면 해당 원천만 보너스 누락 |
| constitution_reason | 역할 → 빈 문자열이면 허용, 아니면 거부 사유 | 문자열 $func로만 조회. 메뉴·확인·결제에서 동일 검사 사용 |
| constitution_menu/ask/commit/finish | 메뉴·확인 → 재검사 후 결제 또는 무변경 복귀 | 기존 $menu/choice_screen/yes·no/shop_general 사용. commit만 비용·개인키 변경. ask의 ID를 commit에 전달. notice는 일시적인 UI 문자열 |
| CONST_CLINIC_MENU_SLAVE/ASSISTANT / #options | 병원 메뉴2/3 → 기존 오른쪽 열 마지막에 항목 | 기존 S/A_augmentation 활성·회색PNG를 재사용. 새 이미지/CSS 변경 없음 |
| CONST_MENU_RELOAD_* + CONST_CLINIC_LOAD_CACHE | 저장된 메뉴표식 → 병원2/3 정의만 갱신 | $ongload에서 부분 재정의. 병원일 때만 display_options2/3도 갱신. 이를 제거하면 옛 병원 저장 메뉴가 남을 수 있음 |
| CONST_FRESH_* | 새 직접 생성 → 이력·잔여0 | get_demo_slave/get_special_slave/get_special_assistant_quest. 이를 빼면 이전 인물의 새키를 상속할 수 있음. 기존 인물 로드/교환에서는 초기화하지 않음 |
| CONST_HEALTHY_DESCRIPTION / jo9_traits | 기존 설명 요청 → 새 효과 설명 | 기존 한 항목만 표시. 일반8칸/성취3칸 강제는 별도 보류/미구현 범위 |

267로케이션 유지, 기존8본문16편집. 새 함수 로케이션·캐시 revision·저장 형식 변경은 없다. 기존 helper에 동작 분기와 개인키2개를 더했다. 새 분기를 제거하려면 next_day/메뉴/로드 연결도 함께 되돌려야 한다. 시술 연결만 제거하면 기존 건강 효과는 남지만 후천 획득만 사라진다. 롤백 뒤 남은 개인키는 참조되지 않으므로 기존 세이브를 임의로 편집할 필요가 없다.

## 검증과 한계

- 수정 전 실제 엔진에서 건강체질 기본HP100이150으로 나와 승인값120과 다른 것을 재현했다.
- 경계 ${g.cases}상황/${g.assertions}조건 PASS: 전투 체질·직업·용기·정수 경계, 기존 교육6과목/표현,11역할 자연성장·음수·잔여·체질 상실 후 복원.
- 통합 ${it.cases}상황/${it.assertions}조건 PASS: 성공·중복·기시술/건강/기절/미검진/재활/돈부족/장소/ID 거부, 메뉴 오른쪽 한 열, 구 병원 캐시와 타 상점 보호, 실제 식이 정산·보조식품·휴식·5생성자·역할 교환·11역할 native SAVEGAME의2키 직렬화/바이트 왕복.
- 확인 화면 이름·콜백·선결제 방지2사례/6조건, 실제 ask→choice_screen→yes/no→시술→shop_general4흐름/20조건 PASS. 합계 ${cases}상황/${checks}조건이다.
- 구조·바이트 왕복·줄/주석 경계·JSON등록·정확 패치 재생/재적용 및 공식 실제 엔진9경로 PASS. 두 독립 읽기 검토에서 최종 중요 결함 없음.
- 개발 중 발견한 후보 생성 문자열 치환, 숫자/문자 RESULT 혼합 반환, 중복 오른쪽 열은 설치 전에 고쳤고 실패/회귀 근거를 development-findings.json에 보존했다. 이름 dyneval은 실제 두 역할에서 정상 확인되어 불필요한 변경을 하지 않았다.

검사는 격리 진단 사본에서 Start를 바꾸어 실제 로직을 실행했다. UI 흐름은 마지막 안내 MSG 한 줄만 억제해 콜백 복귀를 확인했다. 실제 사용자 세이브의 UI 선택·CRC·마우스 클릭·화면 배치 전수 검사는 하지 않았다. 식이 helper와 휴식/보조식품 블록은 후보 원문 그대로 추출했다. 정식 전체 QSP 문법 컴파일러나 모든 동적 분기 증명은 아니다.

## 보존·재현

기존76개 사용자 세이브 및 Full/CSS/설정 등81보호 파일은 그대로다. WORK는 검증된 후보 ${p.after_sha256}와 바이트 일치한다. before.qsp.gz는 직전 ${beforeHash}의 정확 복구본이다.

scripts/reproduce.cjs restore-fixtures 후 red, green all, integration, ui-ask slave/assistant, ui-flows로 재현한다. 설치 엔진·Node 코덱·기존 QA·PowerShell 적용기에 의존한다. 격리 진단 QSP/복제 JSON/시험 저장은 정리하고 보고서·패치·재현 스크립트·압축 복구본만 남겼다. Full/ZIP/커밋/푸시는 하지 않았다. 지성별 할인은 사용자 보류를 유지하고 다음 미구현 항목은 사용자 승인 대기다.
`;
 fs.writeFileSync(rec+'/MANUAL_KO.md',cr(manual));const result={status:'PASS_APPLIED_WORK',patch:p.id,before:beforeHash,work:p.after_sha256,changedBodies:8,edits:16,locations:267,newActorKeys:2,newLocations:0,nativeFocusedCases:cases,nativeFocusedAssertions:checks,nativeReleaseProbes:9,nativeUserSaveUiLoadTested:false,nativeSavedRoles:11,preservedUserSaves:76,fullSync:false,packaged:false,committed:false,pushed:false,next:'WAIT_USER_APPROVAL'};write(rec+'/FINAL_RESULT.json',result);
 const audit=repo+'/records/post-patch-audit-20261024/findings.json',af=read(audit),u=af.unimplemented.find(x=>x.id==='U03');u.status='APPLIED_UNIFIED_HEALTHY_TRAIT_AND_CLINIC';u.evidence='../constitution-unification-20261024/FINAL_RESULT.json';u.note='1000스파크1회 건강체질획득. 전투1.2/기존운동교육1.5/자연성장3곳1.5. 기존세이브보존.';af.followup={patch:p.id,work:p.after_sha256,next:'WAITING_USER_APPROVAL'};write(audit,af);
 const ap=repo+'/docs/POST_PATCH_STATUS_AUDIT_20261024.md',lines=fs.readFileSync(ap,'utf8').split(/\r?\n/),at=lines.findIndex(x=>x.startsWith('| U03 |'));a(at>=0);lines[at]='| U03 | 의료센터 체질개선·건강체질 통합 | **WORK 적용 완료.** 1000스파크/1회 건강체질 획득. 전투+20%,기존운동교육+50%,영양/보조식품/휴식 새체력성장+50%. 기존세이브 보존. [상세](../records/constitution-unification-20261024/MANUAL_KO.md) |';fs.writeFileSync(ap,lines.join('\r\n'));
 const bundle=repo+'/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md';a(!fs.readFileSync(bundle,'utf8').includes('CONSTITUTION_UNIFICATION_APPLIED_20261024'));fs.appendFileSync(bundle,cr(`\n\n## WORK 적용 — 건강체질·체질개선 통합 (CONSTITUTION_UNIFICATION_APPLIED_20261024)\n\n- 의료센터 노예/조수 신체개조1000스파크/인물당1회. 건강체질 획득·약골대체,기건강/기시술금지,확인/취소/결제직전ID재검사. 선천/시술동일효과로중복없음.\n- 전투HP/스태미나1.2배,기존운동교육1.5배유지,식이·보조식품·충분휴식의새체력XP1.5배와반점누적. 기존성장한도·음수·누적·AP보존.\n- 실제엔진 ${cases}상황 ${checks}조건·공식9경로·구조/줄/주석경계·정확재생/재적용·독립검토PASS. 기존76세이브/Full/CSS/설정보존. UI콜백흐름은안내MSG만억제한진단본;사용자세이브UI로드/실제마우스검사는별도.\n- WORK만반영,Full/ZIP/커밋/푸시없음. U02지성할인보류유지. 다음미구현사용자승인대기. [설명·한계](../records/constitution-unification-20261024/MANUAL_KO.md),[결과](../records/constitution-unification-20261024/FINAL_RESULT.json).\n`));
 const legacy=repo+'/docs/TRAITS_BATCH_20261017.md',lt=fs.readFileSync(legacy,'utf8'),oldRow='| 건강체질 | 전투 최대 체력·스태미나 및 운동 관련 교육의 양의 경험치 ×1.5. 약골과 양립하지 않습니다. |';a(lt.includes(oldRow));fs.writeFileSync(legacy,lt.split(oldRow).join('| 건강체질 | 2026-10-24 통합: 전투 최대 체력·스태미나 ×1.2, 기존 운동 교육의 양의 경험치 ×1.5, 영양·보조식품·충분휴식의 새 체력 성장 ×1.5. 선천/시술 동일 효과, 약골과 양립하지 않습니다. [최신 설명](../records/constitution-unification-20261024/MANUAL_KO.md) |'));
 const plan=repo+'/docs/superpowers/plans/2026-10-24-constitution-unification.md';fs.writeFileSync(plan,fs.readFileSync(plan,'utf8').replaceAll('- [ ]','- [x]')+'\r\n결과: ../../../records/constitution-unification-20261024/FINAL_RESULT.json. 커밋·푸시 없음.\r\n');
 const findings=read(rec+'/development-findings.json');for(const x of findings.findings)x.status='FIXED_VERIFIED_BEFORE_INSTALL';findings.uiNameDyneval='Verified correct in actual slave/assistant choice screens; not changed';write(rec+'/development-findings.json',findings);if(fs.existsSync(rec+'/green-battle-results.json'))fs.renameSync(rec+'/green-battle-results.json',rec+'/failed-green-battle-timeout.json');
 const rd='G:/Codex/tmp/jo9-constitution-unification-release-20261024';let logs=0;function collect(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const file=dir+'/'+ent.name;if(ent.isDirectory())collect(file);else if(/-stderr\.log$|client-results\.json$/.test(ent.name)){fs.copyFileSync(file,rec+'/evidence/release-'+ent.name);logs++;}}}collect(rd);a.equal(logs,10);fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');console.log(JSON.stringify(result));
}else if(phase==='ui-flows'){
 const results=[];for(const actor of ['slave','assistant'])for(const action of ['yes','no']){
  const d=c.parse(fs.readFileSync(root+'/inputs/candidate.qsp')),page=actor==='slave'?2:3,name='flow-'+actor+'-'+action;
  set(d,'jo9_traits_combat',body(d,'jo9_traits_combat').replace(" if $jo9_constitution_notice ! '': msg $jo9_constitution_notice"," ! Diagnostic only: suppress the blocking notice popup; commit and return flow remain unchanged."));
  set(d,'choice_screen',body(d,'choice_screen')+`\nif sparks ! 1800: msg 'FAIL_CONST_flow_ask_paid' & exit\ndynamic $${action}\n`);
  set(d,'shop_general',body(d,'shop_general')+`\nif sparks ! ${action==='yes'?800:1800}: msg 'FAIL_CONST_flow_money' & exit\nif ${actor}['jo9_constitution_treated'] ! ${action==='yes'?1:0} or ${actor}['jo9_constitution'] ! ${action==='yes'?1:-1}: msg 'FAIL_CONST_flow_trait' & exit\nif sp_txt ! ${page}: msg 'FAIL_CONST_flow_return_page' & exit\nif ${actor}['energy'] ! 2 or ${actor}_rate['stamina'] ! 7: msg 'FAIL_CONST_flow_changed_stats' & exit\nsavegame 'flow.sav'\nmsg 'JO9_QA_CONST_${name.replaceAll('-','_')}_COMPLETE'\n`);
  const r=run(d,root+'/ui-flows/'+name,name,`usehtml=1\n$onnewloc=''\n$counter=''\ngs 'refresh_database'\n$place='hospital'\ncopyarr '$display_options','$hospital_options'\nsp_txt=${page}\nskip_to=0\nsparks=1800\n${actor}_state=1\n${actor}['id']=910001\n${actor}['health_issues_revealed']=1\n${actor}['rehabilitation']=0\n${actor}['jo9_constitution']=-1\n${actor}['jo9_constitution_treated']=0\n${actor}['energy']=2\n${actor}_rate['stamina']=7\n$${actor}_name='검증 인물'\ngs 'jo9_traits_combat','constitution_ask','${actor}'\n`);fs.copyFileSync(r.log,rec+'/evidence/'+name+'.log');results.push({actor,action,...r});console.log(JSON.stringify({name,...r}));a(r.results.every(x=>x.pass));
 }
 write(rec+'/ui-flow-results.json',{status:'PASS',cases:4,assertions:20,instrumentation:'Actual constitution_ask -> choice_screen -> saved yes/no callback -> constitution_finish/commit -> shop_general. Only the final blocking notice MSG suppressed in a diagnostic copy; original user save UI loading and mouse clicks not tested.',results});fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');
}else if(phase==='integration'){
 const d=c.parse(fs.readFileSync(root+'/inputs/candidate.qsp')),old=c.parse(fs.readFileSync(root+'/inputs/before.qsp'));let code="usehtml=1\n$onnewloc=''\n$counter=''\ngs 'refresh_database'\n",cases=0,checks=0;
 const check=(condition,label)=>{checks++;code+=`if (${condition}) = 0: msg 'FAIL_CONST_${label}' & exit\n`;};
 const reset=r=>{code+=`killvar '${r}'\nkillvar '${r}_rate'\n${r}_state=1\n${r}['id']=910001\n${r}['health_issues_revealed']=1\n${r}['rehabilitation']=0\n${r}['jo9_constitution']=0\n${r}['jo9_constitution_treated']=0\n${r}['jo9_constitution_half']=1\n${r}['stamina']=1\n${r}_rate['stamina']=7\n${r}['energy']=2\n${r}['half_action']=1\n${r}['wounds']=2\n$place='hospital'\nsparks=1800\n`;};
 for(const r of ['slave','assistant'])for(const health of [-1,0])for(const cash of [1000,1800]){
  cases++;reset(r);code+=`${r}['jo9_constitution']=${health}\nsparks=${cash}\ngs 'jo9_traits_combat','constitution_commit','${r}',910001\n`;const label='purchase_'+r+'_'+health+'_'+cash;check(`sparks = ${cash-1000} and ${r}['jo9_constitution'] = 1 and ${r}['jo9_constitution_treated'] = 1`,label+'_paid_once');check(`${r}['stamina'] = 1 and ${r}_rate['stamina'] = 7 and ${r}['energy'] = 2 and ${r}['half_action'] = 1 and ${r}['wounds'] = 2 and ${r}['rehabilitation'] = 0 and ${r}['jo9_constitution_half'] = 1`,label+'_preserve');code+=`gs 'jo9_traits_combat','constitution_commit','${r}',910001\n`;check(`sparks = ${cash-1000}`,label+'_duplicate');code+=`${r}['jo9_constitution']=0\nsparks=1800\ngs 'jo9_traits_combat','constitution_commit','${r}',910001\n`;check(`sparks = 1800 and ${r}['jo9_constitution'] = 0 and ${r}['jo9_constitution_treated'] = 1`,label+'_history_after_trait_removed');
 }
 for(const r of ['slave','assistant'])for(const [key,mutation,expectedHealth,expectedDone,cash,id]of [
  ['absent',`${r}_state=0`,0,0,1800,910001],['faint',`${r}_state=CONST_INT['slave_faint']`,0,0,1800,910001],['other_state',`${r}_state=99`,0,0,1800,910001],['exam',`${r}['health_issues_revealed']=0`,0,0,1800,910001],['rehab',`${r}['rehabilitation']=1`,0,0,1800,910001],['money','sparks=999',0,0,999,910001],['healthy',`${r}['jo9_constitution']=1`,1,0,1800,910001],['history',`${r}['jo9_constitution_treated']=1`,0,1,1800,910001],['place',"$place='market'",0,0,1800,910001],['identity','',0,0,1800,910002]]){
  cases++;reset(r);code+=mutation+`\ngs 'jo9_traits_combat','constitution_commit','${r}',${id}\n`;const label='guard_'+r+'_'+key;check(`sparks = ${cash} and ${r}['jo9_constitution'] = ${expectedHealth} and ${r}['jo9_constitution_treated'] = ${expectedDone}`,label+'_unchanged');check("len($jo9_constitution_notice) > 0",label+'_notice');check(`${r}_rate['stamina'] = 7 and ${r}['energy'] = 2`,label+'_no_heal');
 }
 cases++;reset('room1');code+="gs 'jo9_traits_combat','constitution_commit','room1',910001\n";check("sparks = 1800 and room1['jo9_constitution'] = 0",'invalid_role');
 for(const [r,page]of [['slave',2],['assistant',3]]){
  cases++;reset(r);code+="gs '#options','constitution_menu_reload'\n$text_display=''\n"+`dynamic $hospital_options[${page}]\n`;check("instr($text_display,'constitution_ask') > 0",'menu_enabled_'+r);check("(len($text_display)-len(replace($text_display,'menu_column_1','')))/13 = 1",'one_right_column_'+r);code+=`${r}['jo9_constitution']=1\n$text_display=''\ndynamic $hospital_options[${page}]\n`;check("instr($text_display,'constitution_ask') = 0 and instr($text_display,'1000$') > 0",'menu_disabled_'+r);
 }
 const opts=body(old,'#options'),st=opts.indexOf('$hospital_options[2] = {'),en=opts.indexOf('$hospital_options[31] = {',st);a(st>=0&&en>st);cases++;reset('slave');code+=opts.slice(st,en)+"\n$display_options[2]=$hospital_options[2]\n$display_options[3]=$hospital_options[3]\ngs '$ongload'\n";check("instr($display_options[2],'CONST_CLINIC_MENU_SLAVE') > 0 and instr($display_options[3],'CONST_CLINIC_MENU_ASSISTANT') > 0",'legacy_current_hospital_cache');check("slave['jo9_constitution_half'] = 1 and slave['energy'] = 2 and sparks = 1800",'load_no_actor_reset');cases++;code+=opts.slice(st,en)+"\n$place='market'\n$display_options[2]='outside-sentinel'\ngs '$ongload'\n";check("$display_options[2] = 'outside-sentinel' and instr($hospital_options[2],'CONST_CLINIC_MENU_SLAVE') > 0",'outside_cache_not_overwritten');
 const nd=body(d,'next_day'),f0=nd.indexOf('$next_day_resolve_previous_day_calorie_effects = {'),f1=nd.indexOf("dynamic $do_for_each_slave_in_list, '$next_day_resolve_previous_day_calorie_effects'",f0);a(f0>0&&f1>f0);code+=nd.slice(f0,f1)+'\ncheat_no_starve=0\n';
 for(const r of roles)for(const health of [-1,0,1])for(const grade of [1,2,3])for(const cal of [-1,1,2,5]){
  cases++;reset(r);code+=`${r}['jo9_constitution']=${health}\n${r}['jo9_constitution_half']=0\n${r}['stamina']=${grade}\n${r}['fat']=3\n${r}['metabolism']=2\n${r}['diet_portion']=2\n${r}['calories']=${cal}\ndynamic $replace($next_day_resolve_previous_day_calorie_effects,'dynslave','${r}')\n`;
  const rawGain=grade<3&&cal>0?Math.min(cal,2):0,loss=cal<0&&grade>1?1:0,gain=health===1?Math.floor(rawGain*3/2):rawGain,label='food_'+r+'_'+health+'_'+grade+'_'+cal;check(`${r}_rate['stamina'] = ${7+gain-loss}`,label+'_gain');check(`${r}['jo9_constitution_half'] = ${health===1?rawGain%2:0}`,label+'_half');check(`${r}['energy'] = 2 and ${r}['stamina'] = ${grade}`,label+'_no_refill');
 }
 const s0=nd.indexOf("if slave['diet_supplements'] = 1:"),s1=nd.indexOf('\r\nend',s0);a(s0>0&&s1>s0);const supp=nd.slice(s0,s1+5),rest=nd.slice(nd.indexOf('! JO9 MOD START CONST_REST_GROWTH'),nd.indexOf('! JO9 MOD END CONST_REST_GROWTH')+'! JO9 MOD END CONST_REST_GROWTH'.length);
 for(const health of [-1,0,1])for(const grade of [1,3])for(const enabled of [0,1])for(const portion of [2,4]){cases++;reset('slave');code+=`slave['jo9_constitution']=${health}\nslave['jo9_constitution_half']=0\nslave['stamina']=${grade}\nslave['diet_supplements']=${enabled}\nslave['diet_portion']=${portion}\ntotal_food_cost=10\n`+supp+'\n';const rawGain=enabled&&grade<3?(portion===4?2:1):0,gain=health===1?Math.floor(rawGain*3/2):rawGain;check(`slave_rate['stamina'] = ${7+gain} and total_food_cost = ${10+enabled}`,'supp_'+health+'_'+grade+'_'+enabled+'_'+portion);}
 for(const health of [-1,0,1])for(const grade of [1,2,3])for(const rested of [0,1,3]){cases++;reset('slave');code+=`slave['jo9_constitution']=${health}\nslave['jo9_constitution_half']=0\nslave['stamina']=${grade}\nslave['well_rested']=${rested}\n`+rest+'\n';const gain=grade<3&&rested>=grade?(health===1?3:2):0;check(`slave_rate['stamina'] = ${7+gain}`,'rest_'+health+'_'+grade+'_'+rested);}
 for(const ctor of ['generate_stock','generate_clone','get_demo_slave','get_special_slave']){cases++;const r=ctor.startsWith('generate_')?'stock':'slave';code+=`${r}['jo9_constitution_treated']=1\n${r}['jo9_constitution_half']=1\nstock_type=2571\nslave_type=2571\nspecial_stock=2571\nseed_age[2571]=2\nseed_stamina[2571]=4\nseed_metabolism[2571]=1\nseed_beauty[2571]=3\ngs '${ctor}'\n`;check(`${r}['jo9_constitution_treated'] = 0 and ${r}['jo9_constitution_half'] = 0`,'fresh_'+ctor);}
 cases++;code+="assistant_type=2606\nhero_choice=1\ncheat_i=0\npet_tentacle=0\nseed_age[2606]=2\nseed_stamina[2606]=4\n$seed_name[2606]='QA'\nassistant['jo9_constitution_treated']=1\nassistant['jo9_constitution_half']=1\ngs 'get_special_assistant_quest'\n";check("assistant['jo9_constitution_treated'] = 0 and assistant['jo9_constitution_half'] = 0",'fresh_quest_assistant');
 for(const dest of ['assistant','room1','cow']){cases++;reset('slave');reset(dest);code+=`slave['jo9_constitution']=1\nslave['jo9_constitution_treated']=1\n${dest}['id']=910002\n${dest}['jo9_constitution_half']=0\ndynamic $swap_slave_instances,'slave','${dest}'\n`;check(`${dest}['id'] = 910001 and ${dest}['jo9_constitution_treated'] = 1 and ${dest}['jo9_constitution_half'] = 1 and slave['jo9_constitution_treated'] = 0`,'swap_'+dest);}
 for(const r of roles)code+=`${r}['jo9_constitution_treated']=1\n${r}['jo9_constitution_half']=1\n`;cases++;code+="savegame 'constitution.sav'\nmsg 'JO9_QA_CONST_integration_COMPLETE'\n";
 const r=run(d,root+'/integration','integration',code);fs.copyFileSync(r.log,rec+'/evidence/integration.log');a(r.results.every(x=>x.pass));const sc=require(repo+'/tools/qa/save-codec.cjs'),saved=fs.readFileSync(root+'/integration/constitution.sav'),ss=sc.parse(saved);a.deepEqual(sc.serialize(ss),saved);for(const actor of roles)for(const key of ['jo9_constitution_treated','jo9_constitution_half']){a.equal(sc.value(ss,actor,key)[0],'1');checks++;}write(rec+'/integration-results.json',{status:'PASS',cases,assertions:checks,nativeSavedRoles:roles.length,saveSha256:c.hash(saved),uiOpenGameTested:false,instrumentation:'Start only; exact production clinic validation/commit and hospital menus, old hospital caches then actual $ongload, complete calorie resolver, original supplement/rest blocks, constructors, swaps and native SAVEGAME. Existing save UI loading not tested.',...r});fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');console.log(JSON.stringify({cases,assertions:checks,...r}));
}else if(phase==='archive-failures'){
 const d=c.parse(fs.readFileSync(root+'/inputs/candidate.qsp')),opts=body(d,'#options'),counts={};for(const page of [2,3]){const from=opts.indexOf('$hospital_options['+page+'] = {'),to=opts.indexOf('$hospital_options['+(page===2?3:31)+'] = {',from+1);counts[page]=(opts.slice(from,to).match(/'column_1'/g)||[]).length;}write(rec+'/development-findings.json',{candidateBeforeCorrections:c.hash(c.serialize(d)),findings:[{id:'P1_LITERAL_REPLACEMENT',observed:'JS replace expanded replacement metacharacter and duplicated module; large and battle probes timed out',fix:'split(old).join(newText), assert exact literal replay and one original module end',status:'FIXED_GREEN1404'},{id:'P2_RESULT_RETURN_TYPE',observed:'Native probe reached final numeric result=1 (trace9) but FUNC returned0 while $FUNC returned empty; QSP string result initialized in same function took precedence',fix:'Use one string-returning reason function; empty means allowed, nonempty means refused',status:'RED_REPRODUCED'},{id:'P3_DUPLICATE_COLUMN',observed:counts,expected:{2:1,3:1},fix:'Append within existing right column rather than creating a second one',status:'STATIC_RED_REPRODUCED'}]});for(const [from,to]of [[root+'/clinic-probe/clinic-stderr.log','clinic-return-red.log'],[root+'/ui-ask/slave/ask-slave-stderr.log','ask-before-corrections.log']])fs.copyFileSync(from,rec+'/evidence/'+to);if(fs.existsSync(rec+'/green-results.json'))fs.renameSync(rec+'/green-results.json',rec+'/failed-green-timeout.json');console.log(JSON.stringify({archived:true,columnCounts:counts}));
}else if(phase==='clinic-probe'){
 const d=c.parse(fs.readFileSync(root+'/inputs/candidate.qsp'));if(process.argv[3]==='trace'){let s=body(d,'jo9_traits_combat'),from=s.indexOf("if $args[0] = 'constitution_available':"),to=s.indexOf("if $args[0] = 'constitution_menu':",from);let t=s.slice(from,to);t=t.replace(" $result = ''"," $result = ''\r\n jo9_qa_trace=1");for(const [key,num]of [['state',2],['exam',3],['health',4],['done',5],['rehab',6]]){const at=t.indexOf(' local jo9_const_'+key+' ='),end=t.indexOf('\r\n',at);t=t.slice(0,end)+`\r\n jo9_qa_trace=${num}`+t.slice(end);}t=t.replace(' result = 1',' result = 1\r\n jo9_qa_trace=9');set(d,'jo9_traits_combat',s.slice(0,from)+t+s.slice(to));}
 const r=run(d,root+'/clinic-probe','clinic',"usehtml=1\n$onnewloc=''\n$counter=''\ngs 'refresh_database'\n$place='hospital'\nsparks=1500\nslave_state=1\nslave['id']=910001\nslave['health_issues_revealed']=1\nslave['rehabilitation']=0\nslave['jo9_constitution']=0\nslave['jo9_constitution_treated']=0\njo9_qa_ok=func('jo9_traits_combat','constitution_available','slave')\n$jo9_qa_reason=$func('jo9_traits_combat','constitution_available','slave')\nif jo9_qa_ok ! 1: msg 'FAIL_CONST_available_<<jo9_qa_ok>>_trace_<<jo9_qa_trace>>_exist_<<CONST_INT[''slave_exist'']>>_state_<<slave_state>>_reason_<<$jo9_qa_reason>>' & exit\nmsg 'JO9_QA_CONST_clinic_COMPLETE'");console.log(JSON.stringify(r));
}else if(phase==='ui-ask'){
 const role=process.argv[3]||'slave',d=c.parse(fs.readFileSync(root+'/inputs/candidate.qsp')),name='ask-'+role;set(d,'choice_screen',body(d,'choice_screen')+`\nif instr($text[1], '검증 인물') ! 1: msg 'FAIL_CONST_confirm_name_<<$text[1]>>' & exit\nif instr($yes, 'constitution_finish') = 0: msg 'FAIL_CONST_yes_callback' & exit\nif sparks ! 1500 or ${role}['jo9_constitution_treated'] ! 0: msg 'FAIL_CONST_ask_paid_early' & exit\nsavegame 'confirmation.sav'\nmsg 'JO9_QA_CONST_${name.replaceAll('-','_')}_COMPLETE'\n`);
 const r=run(d,root+'/ui-ask/'+role,name,`usehtml=1\n$onnewloc=''\n$counter=''\ngs 'refresh_database'\n$place='hospital'\nsparks=1500\n${role}_state=1\n${role}['id']=910001\n${role}['health_issues_revealed']=1\n${role}['rehabilitation']=0\n${role}['jo9_constitution']=0\n${role}['jo9_constitution_treated']=0\n$${role}_name='검증 인물'\ngs 'jo9_traits_combat','constitution_ask','${role}'\n`);fs.copyFileSync(r.log,rec+'/evidence/ui-'+name+'.log');write(rec+'/ui-'+name+'-results.json',{status:r.results.every(x=>x.pass)?'PASS':'FAIL',...r});console.log(JSON.stringify(r));
}else if(phase==='probe'){
 const d=c.parse(fs.readFileSync(root+'/inputs/candidate.qsp'));const r=run(d,root+'/probe','single',"usehtml=1\n$onnewloc=''\n$counter=''\ngs 'refresh_database'\nslave['jo9_constitution']=1\nslave['jo9_constitution_half']=0\njo9_qa_gain=func('jo9_traits_combat','natural_stamina_xp','slave',1)\nif jo9_qa_gain ! 1: msg 'FAIL_CONST_single_<<jo9_qa_gain>>' & exit\nmsg 'JO9_QA_CONST_single_COMPLETE'");console.log(JSON.stringify(r));
}else if(phase==='green'){
 const d=c.parse(fs.readFileSync(root+'/inputs/candidate.qsp')),group=process.argv[3]||'all';let code="usehtml=1\n$onnewloc=''\n$counter=''\ngs 'refresh_database'\n",cases=0,checks=0;
 const check=(condition,label)=>{checks++;code+=`if (${condition}) = 0: msg 'FAIL_CONST_${label}' & exit\n`;};
 if(group==='all'||group==='battle')for(const r of ['slave','assistant'])for(const health of [-1,0,1])for(let cls=0;cls<4;cls++)for(const courage of [-1,0,1])for(const [hp,sta,morale]of [[1,0,1],[7,3,5],[100,60,40]]){
  cases++;const label='battle_'+r+'_'+health+'_'+cls+'_'+courage+'_'+hp;code+=`${r}_state=1\n${r}['id']=910001\n${r}['jo9_constitution']=${health}\n${r}['jo9_combat_trait']=${cls}\n${r}['courage']=${courage}\n${r}['jo9_constitution_half']=1\ngs 'jo9_traits_combat','setup','${r}',${hp},${sta},${morale}\n`;
  const hm=health===1?1.2:health===-1?0.5:1,cm=cls===3?1.5:1,sm=cls===1||cls===3?1.5:1,mm=courage===1?1.5:courage===-1?0.5:1;
  check(`макс_здоровье_игрока = ${Math.max(1,Math.floor(hp*hm*cm+1e-9))}`,label+'_hp');check(`макс_выносливость_игрока = ${Math.floor(sta*hm*sm+1e-9)}`,label+'_stamina');check(`норм_дух_игрока = ${Math.floor(morale*sm*mm+1e-9)}`,label+'_morale');check(`${r}['jo9_constitution'] = ${health} and ${r}['jo9_constitution_half'] = 1`,label+'_actor');
 }
 const xpValues=[-2,0,1,2,3,4,8],healthy=[-2,0,1,3,4,6,12],frail=[-2,0,1,1,1,2,4];
 if(group==='all'||group==='education')for(const r of ['slave','assistant'])for(const health of [-1,0,1])for(const subject of ['stamina','calisthenics','gladiatrix','dressage','nurse','legacy'])for(let i=0;i<xpValues.length;i++){
  cases++;const field=subject==='legacy'?r+'_rate["stamina"]':subject,label='education_'+r+'_'+health+'_'+subject+'_'+i;code+=`${r}['jo9_constitution']=${health}\n${r}['jo9_constitution_half']=1\njo9_qa_gain=func('jo9_traits_combat','education_xp','${r}',${xpValues[i]},'${field}')\n`;
  check(`jo9_qa_gain = ${subject==='nurse'?xpValues[i]:health===1?healthy[i]:health===-1?frail[i]:xpValues[i]}`,label+'_xp');check(`${r}['jo9_constitution_half'] = 1`,label+'_no_double_carry');
 }
 if(group==='all'||group==='natural')for(const r of roles)for(const health of [-1,0,1])for(const gain of [-3,0,1,2,3,5,10])for(const carry of [-99,0,1,99]){
  cases++;const label='natural_'+r+'_'+health+'_'+gain+'_'+carry;code+=`${r}['jo9_constitution']=${health}\n${r}['jo9_constitution_half']=${carry}\n${r}_rate['stamina']=17\n${r}['energy']=2\njo9_qa_gain=func('jo9_traits_combat','natural_stamina_xp','${r}',${gain})\n`;
  const active=health===1&&gain>0,total=gain*3+Math.max(0,Math.min(1,carry));check(`jo9_qa_gain = ${active?Math.floor(total/2):gain}`,label+'_xp');check(`${r}['jo9_constitution_half'] = ${active?total%2:carry}`,label+'_carry');check(`${r}_rate['stamina'] = 17 and ${r}['energy'] = 2`,label+'_no_old_rate_or_ap');
 }
 if(group==='all'||group==='natural')for(const r of roles){cases++;code+=`${r}['jo9_constitution']=1\n${r}['jo9_constitution_half']=0\njo9_qa_sum=0\n`;for(let i=1;i<=8;i++){code+=`jo9_qa_sum+=func('jo9_traits_combat','natural_stamina_xp','${r}',1)\n`;check(`jo9_qa_sum = ${Math.floor(i*3/2)} and ${r}['jo9_constitution_half'] = ${i%2}`,'sequence_'+r+'_'+i);}}
 cases++;code+="slave['jo9_constitution_half']=1\nslave['jo9_constitution']=0\njo9_qa_gain=func('jo9_traits_combat','natural_stamina_xp','slave',1)\n";check("jo9_qa_gain = 1 and slave['jo9_constitution_half'] = 1",'lost_trait_preserves');code+="slave['jo9_constitution']=1\njo9_qa_gain=func('jo9_traits_combat','natural_stamina_xp','slave',1)\n";check("jo9_qa_gain = 2 and slave['jo9_constitution_half'] = 0",'restored_trait_carry');
 const name='boundaries-'+group;code+="msg 'JO9_QA_CONST_"+name.replaceAll('-','_')+"_COMPLETE'\n";const r=run(d,root+'/green/'+group,name,code);fs.copyFileSync(r.log,rec+'/evidence/green-'+group+'.log');write(rec+'/green-'+group+'-results.json',{status:r.results.every(x=>x.pass)?'PASS':'FAIL',cases,assertions:checks,instrumentation:'Only Start replaced; actual production setup, education_xp and natural_stamina_xp; independent contract values; no state primer.',...r});fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');console.log(JSON.stringify({group,cases,assertions:checks,...r}));a(r.results.every(x=>x.pass));
}else if(phase==='inspect'){
 const d=c.parse(fs.readFileSync(game+'/jack.qsp'));for(const [n,start,end]of [['next_day',1500,1570],['#options',1435,1460],['shop_general',1,34]]){const ls=body(d,n).split('\r\n');console.log(n+'\n'+ls.slice(start-1,end).map((v,i)=>`${start+i}: ${v}`).join('\n'));}
}
