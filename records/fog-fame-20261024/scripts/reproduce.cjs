'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),zlib=require('zlib'),assert=require('assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',root='G:/Codex/tmp/jo9-fog-fame-20261024',record=repo+'/records/fog-fame-20261024';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'),cr=s=>s.replace(/\r?\n/g,'\r\n');
const body=(d,n)=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),set=(d,n,s)=>d.lines[d.locations.find(x=>x.name===n).body]=c.shift(cr(s),-5);
const expectedBefore='738443e5e33db32bb42495a1cd6cfe89ecef9d16f3a164517f1ff0bfa46aa3dc';
const encounters=[
 ['어린 안개 괴물',['исчадие_молодь'],0,0],['일반 안개 괴물',['исчадие'],1,0],['거대 안개 괴물',['чудовщиное_исчадие'],3,1],
 ['검은 의사와 하인',['черный_медик','подручный','подручный','подручный'],1,0],['성기사와 병사',['паладин','пехотинец','пехотинец'],1,0],
 ['수인 네 명',['козлорогий','свинорылый','жабован','крысолюд'],1,0],['늑대인간',['вервольф'],3,1],['흡혈귀',['вампир'],3,1],['리치',['лич'],3,1],
 ['하급 인간 다섯',['канибал','калека','нищеброд','безумец','изможденный'],0,0],['오우거',['ogre'],3,1],['고블린 둘 또는 셋',['goblin','goblin','goblin'],1,0],['와그',['warg'],3,1],['오크',['orc'],1,0],
 ['가르시드와 수인',['козлорогий','свинорылый','жабован','крысолюд','garsid'],5,2]
];
const phase=process.argv[2];
function protectedInputs(){return [game+'/jack.qsp',game+'/css/base.css','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/css/base.css',...fs.readdirSync(game+'/save').filter(x=>/\.sav$/i.test(x)).map(x=>game+'/save/'+x)].map(p=>({path:p,sha256:c.hash(fs.readFileSync(p))}));}
function runProbe(d,dir,name,code,marker){fs.mkdirSync(dir,{recursive:true});set(d,'Start',code);const file=dir+'/'+name+'.qsp';qa.inspectWorld(c.serialize(d));fs.writeFileSync(file,c.serialize(d));write(dir+'/plan.json',[{name,file,marker,checkpoint:'Actual installed FastQSP, fog combat fame settlement'}]);const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',dir+'/plan.json','-TimeoutSeconds','20'],{encoding:'utf8',windowsHide:true,timeout:35000});return {exit:r.status,results:read(dir+'/client-results.json')};}
const baseState=`usehtml=1
CONST_INT['slave_exist']=1
slave_state=1
assistant_state=1
$place='edge_patrol'
$итог_боя='победа'
здоровье_игрока=100
выносливость_игрока=100
дух_игрока=100
slave['energy']=5
assistant['energy']=5
jo9_fog['active']=1
jo9_fog['actor']=1
combatant=1
jo9_fog['settled']=0
jo9_fog['switched']=0
slave_rate['fame']=0
assistant_rate['fame']=0
количество_врагов=1
$враг[1]='чудовщиное_исчадие'
`;
if(phase==='prepare'){
 assert(!fs.existsSync(root),'Unique task scratch must not already exist');fs.mkdirSync(root+'/inputs',{recursive:true});fs.mkdirSync(root+'/patches');fs.mkdirSync(record+'/scripts',{recursive:true});fs.mkdirSync(record+'/evidence');
 const raw=fs.readFileSync(game+'/jack.qsp');assert.equal(c.hash(raw),expectedBefore);qa.inspectWorld(raw);assert.deepEqual(c.serialize(c.parse(raw)),raw);fs.writeFileSync(root+'/inputs/before.qsp',raw);fs.writeFileSync(record+'/before.qsp.gz',zlib.gzipSync(raw,{level:9}));assert.deepEqual(zlib.gunzipSync(fs.readFileSync(record+'/before.qsp.gz')),raw);write(record+'/inputs.json',protectedInputs());write(record+'/approved-encounters.json',encounters.map((x,i)=>({event:61101+i,name:x[0],enemies:x[1],below40:x[2],from40To79:x[3],from80:0,witnessPercent:20})));
 fs.copyFileSync(__filename,record+'/scripts/reproduce.cjs');
 fs.writeFileSync(repo+'/docs/superpowers/plans/2026-10-24-fog-fame.md',`# 안개경계 개인 명성 구현 계획

> 실행: writing-plans / executing-plans / test-driven-development. 사용자 승인한 설계로 직접 구현 후 독립 검토. 커밋·푸시 없음.

**Goal:** 승인한 안개경계15전투의 목격20% 개인명성 보상을 WORK에 적용한다.
**Architecture:** 기존 jo9_fog_relay settle의 한 번 정산 방어를 유지한다. 실제 적 목록의 최고 보상 등급을 지역 변수로 계산하고, 승리한 역할의 개인명성 원천에만 적용한 뒤 기존 능력치 계산을 이용한다. 새 영구 저장키·로케이션은 없다.
**Tech Stack:** 선언형 mods JSON, Node 코덱, 실제 FastQSP, 공식 출고 검사.
**Spec:** records/fog-fame-20261024/approved-encounters.json 및 사용자2026-10-24 승인.

## Global Constraints

- 전투당20%한번, 명성40/80감쇠,80상한. 기존80이상/기존세이브보존.
- 실제 승리 동료만. 패배 후 주인공 교대 승리/주인공 단독/다른 지역 제외.
- 적별합산·첫승추가기록 없음. 목격담은 주인공명성 대신 승리동료명시.
- 랠리/캣파이트/아이템/Full/CSS/ZIP 수정 없음. sources/읽기전용.

## Review Focus

- 39/40/79/80/160경계에서 상한과기존값보존.
- 적5번슬롯가르시드,다수전중복지급,상위보상우선.
- settle재호출·finish재호출·주인공교대의중복/오지급.
- 지역·패배·사망·빈역할·랜덤20/21경계.
- 목격문구의실제출전자이름/실제증가량과기존표시등급갱신.

### Task1: 정확한 한 번 지급 구현

- [ ] 보호입력/바이트왕복/최소복구본확인.
- [ ] 실제엔진에서baseline거대괴물명성3조건RED확인.
- [ ] jo9_fog_relay단일로케이션에식별주석과계산/역할별지급추가.
- [ ] 실제엔진15전투·역할·경계·비대상·중복·목격문구검사GREEN.

### Task2: 출고 및 보존

- [ ] 후보문법/구조·패치재생·재적용·공식9경로PASS.
- [ ] 독립검토중요결함해결후동일후보WORK반영.
- [ ] 설명서·규칙/작업묶음갱신,보호입력재확인.
- [ ] 재생성임시QSP/JSON/중복백업정리,핵심기록·재현스크립트보존.
`);console.log(JSON.stringify({prepared:true,before:expectedBefore,protectedInputs:read(record+'/inputs.json').length,encounters:encounters.length}));
}else if(phase==='red'){
 const d=c.parse(fs.readFileSync(root+'/inputs/before.qsp'));const r=runProbe(d,root+'/red','missing',baseState+"gs 'jo9_fog_relay','settle'\nif slave_rate['fame'] ! 3: msg 'FAIL_FOG_FAME_MISSING' & exit\nmsg 'JO9_QA_FOG_missing_COMPLETE'",'JO9_QA_FOG_missing_COMPLETE');assert(r.results.every(x=>!x.pass));const log=fs.readFileSync(root+'/red/missing-stderr.log');assert(new TextDecoder('euc-kr').decode(log).includes('FAIL_FOG_FAME_MISSING'));fs.copyFileSync(root+'/red/missing-stderr.log',record+'/evidence/red.log');write(record+'/red-results.json',{status:'EXPECTED_FAILURE',...r});console.log(JSON.stringify({status:'EXPECTED_FAILURE',...r}));
}else if(phase==='build'){
 const d=c.parse(fs.readFileSync(root+'/inputs/before.qsp')),original=body(d,'jo9_fog_relay'),edits=[];
 const selection=`! JO9 MOD START FOG_FAME_TIER | 2026-10-24_fog_fame
 ! 안개경계 승리의 실제 적 목록에서 가장 높은 보상만 선택한다. 전투당 한 번 정산한다.
 local jo9_fame_low = 0
 local jo9_fame_high = 0
 if $place = 'edge_patrol' and $итог_боя = 'победа' and jo9_fog['switched'] = 0:
  local jo9_fame_i = 1
  local $jo9_fame_enemy = ''
  :jo9_fame_scan
  if jo9_fame_i <= количество_врагов:
   $jo9_fame_enemy = '|' + $враг[jo9_fame_i] + '|'
   if instr('|исчадие|черный_медик|паладин|козлорогий|свинорылый|жабован|крысолюд|goblin|orc|', $jo9_fame_enemy) > 0:
    jo9_fame_low = max(jo9_fame_low, 1)
   end
   if instr('|чудовщиное_исчадие|вервольф|вампир|лич|ogre|warg|', $jo9_fame_enemy) > 0:
    jo9_fame_low = max(jo9_fame_low, 3)
    jo9_fame_high = max(jo9_fame_high, 1)
   end
   if $враг[jo9_fame_i] = 'garsid':
    jo9_fame_low = 5
    jo9_fame_high = 2
   end
   jo9_fame_i += 1
   jump 'jo9_fame_scan'
  end
 end
 ! JO9 MOD END FOG_FAME_TIER`;
 const anchor=" jo9_fog['settled'] = 1";edits.push({location:'jo9_fog_relay',field:'body',old:anchor,new:anchor+'\r\n '+cr(selection),count:1,patchId:'FOG_FAME_TIER'});
 for(const role of ['slave','assistant']){
  const anchor='   ! JO9 MOD END FOG_VICTORY_GROWTH_'+role.toUpperCase();
  const addition=`! JO9 MOD START FOG_FAME_${role.toUpperCase()} | 2026-10-24_fog_fame
   ! 기존 settled 방어 안에서만 지급. 이미80이상인 명성과 다른 역할은 변경하지 않는다.
   local jo9_fame_gain = 0
   if ${role}_state = CONST_INT['slave_exist'] and ${role}_rate['fame'] < 80:
    if ${role}_rate['fame'] < 40:
     jo9_fame_gain = jo9_fame_low
    else
     jo9_fame_gain = jo9_fame_high
    end
    if jo9_fame_gain > 0:
     if rand(1, 100) <= 20:
      jo9_fame_gain = min(jo9_fame_gain, 80 - ${role}_rate['fame'])
      ${role}_rate['fame'] += jo9_fame_gain
      msg '안개 너머에서 싸움을 지켜보던 여행자가 감탄하며 고개를 끄덕였다.<br>“이런 상대를 쓰러뜨리다니. 도시로 돌아가면 이 싸움 이야기를 전해야겠군.”<br><br><<$${role}_name>>의 무용담이 퍼지기 시작했다. (개인 명성 +<<jo9_fame_gain>>)'
     end
    end
   end
   ! JO9 MOD END FOG_FAME_${role.toUpperCase()}`;
  edits.push({location:'jo9_fog_relay',field:'body',old:anchor,new:anchor+'\r\n   '+cr(addition),count:1,patchId:'FOG_FAME_'+role.toUpperCase()});
 }
 let next=original;for(const e of edits){assert.equal(next.split(e.old).length-1,1);next=next.replace(e.old,e.new);}set(d,'jo9_fog_relay',next);
 const raw=c.serialize(d);qa.inspectWorld(raw);const patch={id:'2026-10-24_fog_fame',description:'승인한 안개경계15전투의 개인명성:20%목격,40/80감쇠,80상한,실제승리동료만한번지급. 새영구저장키없음.',before_sha256:expectedBefore,after_sha256:c.hash(raw),edits};
 fs.writeFileSync(root+'/inputs/candidate.qsp',raw);write(root+'/patches/2026-10-24_fog_fame.json',patch);write(record+'/patch.json',patch);fs.copyFileSync(__filename,record+'/scripts/reproduce.cjs');
 console.log(JSON.stringify({candidate:patch.after_sha256,editedLocations:['jo9_fog_relay'],edits:edits.length,addedLocations:0,newPersistentKeys:0}));
}else if(phase==='green'){
 const d=c.parse(fs.readFileSync(root+'/inputs/candidate.qsp'));let code=baseState+'\n',checks=0,cases=0;
 const quote=s=>"'"+s.replaceAll("'","''")+"'",check=(condition,label)=>{checks++;code+="if ("+condition+") = 0: msg 'FAIL_FOG_"+label+"' & exit\n";};
 let helper=body(d,'jo9_fog_relay');assert.equal(helper.split('rand(1, 100)').length-1,2);helper=helper.replaceAll('rand(1, 100)',"func('jo9_qa_fame_roll')");helper=helper.replace(/msg '안개 너머[^\r\n]+/g,s=>"$jo9_test_message = "+s.slice(4)+"\r\njo9_test_messages += 1");helper=helper.replace(/msg '<<\$(slave|assistant)_name>>이\(가\) 전투에서 사망했습니다\.'/g,'jo9_test_death = 1');set(d,'jo9_fog_relay',helper);
 // Diagnostic-only random source, independent of all production parameters and save state.
 d.lines.splice(-1,0,c.shift('jo9_qa_fame_roll',-5),c.shift('',-5),c.shift("jo9_test_rolls += 1\r\nresult = jo9_test_roll",-5),c.shift('0',-5));d.lines[3]=c.shift(String(d.locations.length+1),-5);
 function scenario(name,enemies,startFame,expectedGain,opts={}){
  cases++;const role=opts.role||'slave',other=role==='slave'?'assistant':'slave',actor=opts.actor??(role==='slave'?1:2);
  code+=`killvar 'jo9_fog'\nkillvar '$враг'\n$place=${quote(opts.place||'edge_patrol')}\n$итог_боя=${quote(opts.outcome||'победа')}\nздоровье_игрока=${opts.health??100}\nвыносливость_игрока=100\nдух_игрока=100\n${role}['energy']=5\n${role}_state=${opts.absent?0:1}\n${other}_state=1\n${role}_rate['fame']=${startFame}\n${other}_rate['fame']=123\n${role}_rate['ego']=10\n${role}_rate['temper']=20\n${other}_rate['ego']=99\njo9_fog['active']=${opts.inactive?0:1}\njo9_fog['actor']=${actor}\njo9_fog['settled']=${opts.settled?1:0}\njo9_fog['switched']=${opts.switched?1:0}\ncombatant=${actor}\nколичество_врагов=${enemies.length}\njo9_test_roll=${opts.roll??1}\njo9_test_rolls=0\njo9_test_messages=0\n$jo9_test_message=''\n`;
  enemies.forEach((e,i)=>code+='$враг['+(i+1)+']='+quote(e)+'\n');code+="gs 'jo9_fog_relay','settle'\n";
  check(`${role}_rate['fame'] = ${startFame+expectedGain}`,'gain_'+name);check(`${other}_rate['fame'] = 123`,'other_'+name);check(`jo9_test_messages = ${expectedGain?1:0}`,'message_count_'+name);
  if(opts.rollCount!==undefined)check('jo9_test_rolls = '+opts.rollCount,'rolls_'+name);
  if(opts.health===0)check('jo9_test_death = 1','death_branch_'+name);
  if(expectedGain){check("instr($jo9_test_message, '"+(role==='slave'?'테스트노예':'테스트조수')+"') > 0",'actor_name_'+name);check("instr($jo9_test_message, '개인 명성 +"+expectedGain+"') > 0",'gain_text_'+name);}
  if(opts.takeover)code+="combatant=0\n$итог_боя='победа'\n";
  code+="gs 'jo9_fog_relay','settle'\ngs 'jo9_fog_relay','finish'\n";check(`${role}_rate['fame'] = ${startFame+expectedGain}`,'repeat_'+name);check(`jo9_test_messages = ${expectedGain?1:0}`,'repeat_message_'+name);
 }
 code+="$slave_name='테스트노예'\n$assistant_name='테스트조수'\n";
 for(const role of ['slave','assistant'])for(let i=0;i<encounters.length;i++)for(const fame of [0,39,40,79,80,160]){const e=encounters[i],gain=fame>=80?0:Math.min(fame<40?e[2]:e[3],80-fame);scenario(role+'_'+i+'_'+fame,e[1],fame,gain,{role,rollCount:gain?1:0});}
 for(const role of ['slave','assistant']){
  scenario(role+'_roll20',['warg'],0,3,{role,roll:20,rollCount:1});scenario(role+'_roll21',['warg'],0,0,{role,roll:21,rollCount:1});scenario(role+'_roll100',['warg'],0,0,{role,roll:100,rollCount:1});
  scenario(role+'_otherplace',['warg'],0,0,{role,place:'arena',rollCount:0});scenario(role+'_loss',['warg'],0,0,{role,outcome:'поражение',rollCount:0});scenario(role+'_takeover',['warg'],0,0,{role,outcome:'поражение',takeover:true,rollCount:0});scenario(role+'_switched',['warg'],0,0,{role,switched:true,rollCount:0});scenario(role+'_inactive',['warg'],0,0,{role,inactive:true,rollCount:0});scenario(role+'_settled',['warg'],0,0,{role,settled:true,rollCount:0});scenario(role+'_absent',['warg'],0,0,{role,absent:true,rollCount:0});scenario(role+'_unknown',['grinch'],0,0,{role,rollCount:0});
  scenario(role+'_death',['warg'],0,0,{role,health:0,rollCount:0});scenario(role+'_protagonist',['warg'],0,0,{role,actor:0,inactive:true,rollCount:0});scenario(role+'_no_enemies',[],0,0,{role,rollCount:0});scenario(role+'_goblin2',['goblin','goblin'],0,1,{role,rollCount:1});scenario(role+'_duplicate_beasts',['козлорогий','козлорогий','козлорогий','козлорогий'],0,1,{role,rollCount:1});scenario(role+'_garsid_first',['garsid','козлорогий','свинорылый','жабован','крысолюд'],0,5,{role,rollCount:1});
 }
 // Real database initializes the calculator and its continuous-attribute thresholds together.
 code+="gs 'refresh_database'\n";
 scenario('real_calc_slave',['warg'],39,3,{role:'slave',rollCount:1});check("slave['fame'] = 3",'real_grade_slave');scenario('real_calc_assistant',['warg'],79,1,{role:'assistant',rollCount:1});check("assistant['fame'] = 4",'real_grade_assistant');
 code+="msg 'JO9_QA_FOG_boundaries_COMPLETE'\n";
 const r=runProbe(d,root+'/green','boundaries',code,'JO9_QA_FOG_boundaries_COMPLETE');write(record+'/green-results.json',{status:r.results.every(x=>x.pass)?'PASS':'FAIL',cases,assertions:checks,randomInstrumentation:'Only diagnostic helper replaces rand with configured source and captures witness messages. Production untouched.',...r});fs.copyFileSync(root+'/green/boundaries-stderr.log',record+'/evidence/green.log');assert(r.results.every(x=>x.pass));console.log(JSON.stringify({cases,assertions:checks,...r}));
}else if(phase==='messages'){
 // Run the unmodified production helper. Loop diagnostic settlements until real RNG emits a witness.
 const results=[];for(const role of ['slave','assistant']){
  const d=c.parse(fs.readFileSync(root+'/inputs/candidate.qsp')),dir=root+'/messages-'+role;let code=baseState+`\n$slave_name='테스트노예'\n$assistant_name='테스트조수'\njo9_fog['actor']=${role==='slave'?1:2}\ncombatant=${role==='slave'?1:2}\nlocal jo9_qa_attempt = 0\n:jo9_qa_retry\njo9_fog['settled']=0\n${role}_rate['fame']=79\n${role}['energy']=5\ngs 'jo9_fog_relay','settle'\njo9_qa_attempt += 1\nif jo9_qa_attempt < 100: jump 'jo9_qa_retry'\nmsg 'JO9_QA_FOG_no_witness_COMPLETE'`;
  runProbe(d,dir,'witness',code,'JO9_QA_FOG_no_witness_COMPLETE');const log=new TextDecoder('euc-kr').decode(fs.readFileSync(dir+'/witness-stderr.log')),actual=(log.match(/showMessage\(\), str:\s*"([^"\r\n]*)"/)||[])[1];assert(actual,'Actual witness message');assert(actual.includes(role==='slave'?'테스트노예':'테스트조수'));assert(actual.includes('개인 명성 +1'));assert(actual.startsWith('안개 너머'));results.push({role,actual,status:'PASS',instrumentation:'Start only; production helper and real RNG unchanged'});fs.copyFileSync(dir+'/witness-stderr.log',record+'/evidence/message-'+role+'.log');
 }write(record+'/message-results.json',{status:'PASS',results});console.log(JSON.stringify({status:'PASS',productionMessages:results.length}));
}else if(phase==='restore-fixtures'){
 assert(!fs.existsSync(root),'Refuse to overwrite existing scratch');const p=read(record+'/patch.json'),raw=zlib.gunzipSync(fs.readFileSync(record+'/before.qsp.gz'));assert.equal(c.hash(raw),p.before_sha256);fs.mkdirSync(root+'/inputs',{recursive:true});fs.mkdirSync(root+'/patches');fs.writeFileSync(root+'/inputs/before.qsp',raw);const d=c.parse(raw);for(const e of p.edits){let t=body(d,e.location);assert.equal(t.split(e.old).length-1,e.count);set(d,e.location,t.split(e.old).join(e.new));}const candidate=c.serialize(d);assert.equal(c.hash(candidate),p.after_sha256);fs.writeFileSync(root+'/inputs/candidate.qsp',candidate);write(root+'/patches/2026-10-24_fog_fame.json',p);console.log('Baseline and candidate regenerated from minimal rollback + exact patch; WORK untouched.');
}else if(phase==='install'){
 const patch=read(record+'/patch.json');assert.equal(read(record+'/green-results.json').status,'PASS');assert.equal(read(record+'/message-results.json').status,'PASS');
 const runDirs=fs.readdirSync(root+'/release-current').filter(x=>x.startsWith('run-'));assert.equal(runDirs.length,1);const reportPath=root+'/release-current/'+runDirs[0]+'/report.json',gate=read(reportPath);assert.equal(gate.verdict,'PASS');assert.equal(gate.client.probes.length,9);assert(gate.client.probes.every(x=>x.pass));
 for(const x of read(record+'/inputs.json'))assert.equal(c.hash(fs.readFileSync(x.path)),x.sha256,'Pre-install protected input '+x.path);
 const priorNames=new Set(fs.readdirSync(game));const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',root+'/patches'],{encoding:'utf8',windowsHide:true,timeout:90000});fs.writeFileSync(record+'/install.log',r.stdout+'\n'+r.stderr);assert.equal(r.status,0);assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),patch.after_sha256);assert.deepEqual(fs.readFileSync(game+'/jack.qsp'),fs.readFileSync(root+'/inputs/candidate.qsp'));
 fs.copyFileSync(record+'/patch.json',repo+'/mods/2026-10-24_fog_fame.json');fs.copyFileSync(reportPath,record+'/release-validation.json');write(record+'/install-backups.json',fs.readdirSync(game).filter(x=>!priorNames.has(x)&&x.startsWith('jack.qsp')).map(x=>game+'/'+x));
 const oldRuns=fs.readdirSync(root+'/release').filter(x=>x.startsWith('run-'));for(const x of oldRuns)fs.copyFileSync(root+'/release/'+x+'/report.json',record+'/release-legacy-save-failed.json');
 write(record+'/independent-review.json',{status:'PASS',reviewer:'fog_fame_final_review',candidateSha256:patch.after_sha256,changedFields:['jo9_fog_relay.body'],findings:[],suggestedTestsAdded:['death branch no reward','protagonist solo no reward'],reviewLimits:'Static independent review, not manual UI play. Native checks and official gate separately recorded.'});
 fs.copyFileSync(__filename,record+'/scripts/reproduce.cjs');console.log(JSON.stringify({installed:true,workSha256:patch.after_sha256,officialGate:gate.verdict,nativeCases:read(record+'/green-results.json').cases,savesPreserved:76}));
}else if(phase==='finalize'){
 const patch=read(record+'/patch.json'),raw=fs.readFileSync(game+'/jack.qsp'),green=read(record+'/green-results.json');assert.equal(c.hash(raw),patch.after_sha256);qa.inspectWorld(raw);
 for(const x of read(record+'/inputs.json'))assert.equal(c.hash(fs.readFileSync(x.path)),x.path===game+'/jack.qsp'?patch.after_sha256:x.sha256,'Final protected input '+x.path);assert.equal(c.hash(zlib.gunzipSync(fs.readFileSync(record+'/before.qsp.gz'))),patch.before_sha256);
 const d=c.parse(raw),lines=body(d,'jo9_fog_relay').split('\r\n'),markers=lines.map((x,i)=>({line:i+1,text:x})).filter(x=>/MOD START FOG_FAME/.test(x.text));
 fs.writeFileSync(record+'/MANUAL_KO.md',`# 안개경계 개인 명성 — 승인 규칙과 WORK 반영

## 동작

안개경계 전투에서 실제로 승리한 노예 또는 조수에게만 목격확률20%를 전투당 한 번 판정한다. 정확한15전투 구성/수치는 approved-encounters.json을 따른다. 일반 보상은 명성40미만+1/40이상0, 강적은+3/+1, 가르시드 고유전은+5/+2다. 어린 개체와 약한 인간 무리는0이다. 현재 개인 명성80부터는 보상0이고, 직전79일 때도80까지만 지급한다. 이미80~200인 기존 명성은 낮추지 않는다.

적수에 따른 합산/첫승 추가보상은 없다. 실제 적 목록 모든 슬롯을 읽고 가장 높은 보상 하나만 쓴다. 가르시드5번슬롯도 고유전으로 판정한다. 안개경계 밖의 전투·주인공 단독·동료 패배 후 주인공 대타승리·사망한 동료는 명성을 받지 않는다. 기존 전투의 승리 판정을 그대로 쓰므로 적의 도주가 승리로 처리되는 경우도 포함한다.

성공하면 익명 여행자의 목격담 알림에 출전자 이름과 실제 증가량을 출력한다. 전투 결과 정산 시 보여주므로 다음 화면의 텍스트로 덮이지 않는다. 새 NPC·그림·메뉴는 추가하지 않는다.

## 입력·반환·부수 효과

변경 로케이션은 jo9_fog_relay 하나다. settle 입력은 기존 jo9_fog의 active/actor/settled/switched, 현재장소, 전투결과, 출전자의 생존/역할상태/명성원천, $враг와 количество_врагов다. 새 인수나 반환값은 없다. 기존 settled를 먼저1로 바꾸는 방어 안에서 지역변수로 보상만 계산한다. 명성 지급은 slave_rate['fame'] 또는 assistant_rate['fame'] 한 곳뿐이고, 원래 있던 능력치 계산 호출이 표시등급을 갱신한다. 다른 역할·주인공·길드 평판은 건드리지 않는다.

새 저장키·영구 승수·로케이션은 추가하지 않는다. 기존 세이브 형식 변환이나 일괄 수정이 없다. 원래 전투 행동력·사기·자아·기분·상처 정산과 퀘스트 진행 코드는 보존했다. 일반8칸/랠리/캣파이트/드롭·물약은 이번 패치에 포함되지 않는다.

## 호출·의존성과 제거 영향

выход_из_боя의 finish→settle은 적배열삭제와close보다 먼저다. handoff도 패배 동료를 먼저settle해서 대타승리로 다시지급하지 않는다. begin/close/reset의 기존 jo9_fog초기화 규칙과 settle한번정산 방어가 필수 의존성이다. 조각을 별도 호출 가능한 지급함수로 분리하지 않았다.

FOG_FAME_TIER는 공통 지역변수를 계산하고 FOG_FAME_SLAVE/ASSISTANT는 각 역할에 지급한다. 지급구간을 남긴채 TIER만 지우면 필요한 값이 없어 보상이 사라지거나 잘못된 변수를 참조한다. 되돌릴 때는 세 구간을 함께 원복한다. 기존 settled 방어를 제거하면 중복정산 위험이 있다. 전체 복구자료는 before.qsp.gz와 선언형 patch.json이고, 압축복원 해시를 검증했다.

현재 줄번호(조각 수정 후 바뀔 수 있음): ${markers.map(x=>x.text.trim()+' — '+x.line).join('; ')}.

## 검증과 한계

- 실제 설치 FastQSP: ${green.cases}상황/${green.assertions}단언 PASS. 15전투×두역할×0/39/40/79/80/160,20/21/100추첨경계,빈대상/다른지역/패배/사망/주인공단독/교대승리,중복settle/finish,가르시드5번,다수전한번,실제능력치표시계산을 확인했다. 진단복제본에서만 난수를 제어하고 알림을 포착했으며, 실제 사망 뒤 전체 인물정리 자체는 이번 기능 검사 범위가 아니다.
- 수정하지 않은 실제 지급함수와 실제 난수로 노예/조수 목격알림2건을 확인했다.79→80에서 문구도+1이다.
- 공식 출고9경로·구조/줄/주석경계·정확패치재생/재적용·인물JSON검사 PASS. 기존2.4대표24TEST.sav 상태사용. QA 도구 회귀35건 PASS.
- 첫 출고검사는 대표7.sav가2.3.2.5이어서 업데이트 알림으로 중단됐다. 실패 보고서 release-legacy-save-failed.json을 보존한다. 이 결과를 통과로 취급하지 않았다.2.4대표로 재검사한 결과가 release-validation.json이다.
- 기존76세이브와CSS/Full의 해시보존 확인. 실제 세이브 UI불러오기·모든 구버전 이관·실제 전투 전과정/화면배치·전체 게임문법을 증명한 것은 아니다.

WORK SHA256: ${patch.after_sha256}
`);
 const rulesPath=repo+'/records/fame-expansion-20261024/rules.json',rules=read(rulesPath);if(rules.approved.fog.onlyUniqueOrBoss){rules.supersededFogRule=rules.approved.fog;rules.approved.fog={scope:'approved all Fog Border encounter table 2026-10-24',triggerOnVictory:true,witnessProbabilityPercent:20,thresholds:[40,80],maximumFromFog:80,preserveExistingAbove80:true,perFightOnce:true,actualWinningCompanionOnly:true,groupReward:'maximum enemy tier once; not per-enemy sum',encounters:'../fog-fame-20261024/approved-encounters.json',legacyRuleSupersededBy:'User approved full 15-encounter proposal'}}rules.status='FOG_IMPLEMENTED_WORK_RALLY_CATFIGHT_PENDING';rules.sourceWorkSha256=patch.after_sha256;rules.otherPending=rules.otherPending.filter(x=>!/fog target/i.test(x));rules.implementation={runtimeApplied:true,appliedFeatures:['fog'],unimplementedFeatures:['rally','catfight'],qspWritten:true,savesWritten:false,commitPush:false};rules.witnessDialogue=['안개 너머에서 싸움을 지켜보던 여행자가 감탄하며 고개를 끄덕였다.','“이런 상대를 쓰러뜨리다니. 도시로 돌아가면 이 싸움 이야기를 전해야겠군.”','[출전자 이름]의 무용담이 퍼지기 시작했다. (개인 명성 +[실제 증가량])'];write(rulesPath,rules);
 const decisionPath=repo+'/records/fame-expansion-20261024/DECISIONS_KO.md';let decisions=fs.readFileSync(decisionPath,'utf8');const heading='## 2026-10-24 최종 승인·반영 — 안개경계 전체 적';if(!decisions.includes(heading))fs.writeFileSync(decisionPath,decisions+'\n\n'+heading+'\n\n사용자가15전투 전체표와20%·40/80감쇠·80상한을 승인했다. 앞선 고유/보스만+5·대상지정대기는 이 규칙으로 대체한다. WORK에 안개경계만 반영했고 랠리/캣파이트의 기존세이브기록정책은 여전히 미확정·미적용이다. [설명·검증](../fog-fame-20261024/MANUAL_KO.md), [확정표](../fog-fame-20261024/approved-encounters.json).\n');
 const oldVerification=read(repo+'/records/fame-expansion-20261024/verification.json');write(repo+'/records/fame-expansion-20261024/verification-before-fog-implementation.json',oldVerification);write(repo+'/records/fame-expansion-20261024/verification.json',{status:'PASS',documentChecksOnly:false,sourceWorkSha256:patch.after_sha256,fogTargetSelectionPending:false,runtimeAppliedFeatures:['fog'],unimplementedFeatures:['rally','catfight'],qspSyntaxTestsRun:true,actualEnginePaths:9,detail:'../fog-fame-20261024/final-verification.json',commitPush:false});
 const bundlePath=repo+'/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md';let bundle=fs.readFileSync(bundlePath,'utf8');bundle=bundle.replace('## 수치 확정·세부 확인 대기 — 명성 확장 (FAME_EXPANSION_RULES_20261024)','## 이전 결정 — 명성 확장 (안개 규칙은 아래 최종 적용 항목으로 대체)');if(!bundle.includes('FOG_FAME_APPLIED_20261024'))bundle+='\n\n## WORK 적용 완료 — 안개경계 개인 명성 (FOG_FAME_APPLIED_20261024)\n\n- 승인한15전투전체표 반영. 전투당20%목격,명성40미만 일반1/강적3/고유5,40~79 일반0/강적1/고유2,80상한. 어린괴물·약한인간무리0. 다수전합산없음.\n- 실제승리노예·조수만,대타승리/주인공단독/사망제외. 기존settled중복방어,새저장키·로케이션없음. 목격알림에이름·실제증가량표시.\n- 실제엔진'+green.cases+'상황/'+green.assertions+'단언,원래난수목격문구2건,공식9경로·문법/재생/재적용·독립검토PASS. 기존76세이브·CSS·Full보존.2.3대표세이브의업데이트알림에의한첫검사실패는별도기록.\n- 랠리/캣파이트확장은이번변경에미포함. WORK만,ZIP/커밋/푸시없음. [규칙·호출·검증한계](../records/fog-fame-20261024/MANUAL_KO.md).\n';fs.writeFileSync(bundlePath,bundle);
 let plan=fs.readFileSync(repo+'/docs/superpowers/plans/2026-10-24-fog-fame.md','utf8');plan=plan.replaceAll('- [ ]','- [x]').replace('- [x] 재생성임시','- [ ] 재생성임시');fs.writeFileSync(repo+'/docs/superpowers/plans/2026-10-24-fog-fame.md',plan);
 fs.copyFileSync(__filename,record+'/scripts/reproduce.cjs');write(record+'/final-verification.json',{status:'PASS',workSha256:patch.after_sha256,beforeSha256:patch.before_sha256,nativeCases:green.cases,nativeAssertions:green.assertions,officialNativePaths:9,productionMessages:2,regressionTests:35,protectedInputFiles:80,userSavesUnchanged:76,changedRuntimeFields:['jo9_fog_relay.body'],addedLocations:0,addedPersistentKeys:0,fullUnchanged:true,cssUnchanged:true,commitPush:false,legacySaveSmoke:'First7.sav(2.3.2.5)gate failed on update message; retained failure. 24TEST.sav(2.4.0.0)gate PASS.',manualUiPlay:'Not performed'});console.log(JSON.stringify({finalized:true,...read(record+'/final-verification.json')}));
}else if(phase==='cleanup'){
 const patch=read(record+'/patch.json');assert.equal(read(record+'/final-verification.json').status,'PASS');assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),patch.after_sha256);assert.equal(c.hash(zlib.gunzipSync(fs.readFileSync(record+'/before.qsp.gz'))),patch.before_sha256);
 const resolved=path.resolve(root),allowed=path.resolve('G:/Codex/tmp');assert(resolved.startsWith(allowed+path.sep));assert.equal(path.basename(resolved),'jo9-fog-fame-20261024');assert.equal(fs.realpathSync(resolved).toLowerCase(),resolved.toLowerCase());let bytes=0,files=0;
 function inspect(p){const st=fs.lstatSync(p);assert(!st.isSymbolicLink(),'Refuse links/junctions '+p);if(st.isDirectory())for(const n of fs.readdirSync(p))inspect(path.join(p,n));else{bytes+=st.size;files++;}}
 inspect(resolved);const backups=read(record+'/install-backups.json');for(const p of backups){assert.equal(path.dirname(path.resolve(p)).toLowerCase(),path.resolve(game).toLowerCase());assert(fs.lstatSync(p).isFile()&&!fs.lstatSync(p).isSymbolicLink());assert.equal(c.hash(fs.readFileSync(p)),patch.before_sha256);bytes+=fs.statSync(p).size;}
 fs.copyFileSync(__filename,record+'/scripts/reproduce.cjs');write(record+'/cleanup.json',{status:'VALIDATED_FOR_REMOVAL',scratch:resolved,files,bytes,backupFiles:backups,retained:['before.qsp.gz','patch.json','approved-encounters.json','native/gate reports','manual','scripts/reproduce.cjs'],noLinksOrJunctions:true});
 const psquote=s=>"'"+s.replaceAll("'","''")+"'";const commands=backups.map(p=>'Remove-Item -LiteralPath '+psquote(path.resolve(p))+' -Force');commands.push('Remove-Item -LiteralPath '+psquote(resolved)+' -Recurse -Force');const r=cp.spawnSync('powershell.exe',['-NoProfile','-Command',commands.join('\n')],{encoding:'utf8',windowsHide:true,timeout:120000});assert.equal(r.status,0,r.stderr);assert(!fs.existsSync(root));for(const p of backups)assert(!fs.existsSync(p));write(record+'/cleanup.json',{...read(record+'/cleanup.json'),status:'COMPLETE',scratchRemoved:true,workDuplicateBackupsRemoved:true,freedBytes:bytes});
 let plan=fs.readFileSync(repo+'/docs/superpowers/plans/2026-10-24-fog-fame.md','utf8').replace('- [ ] 재생성임시','- [x] 재생성임시');fs.writeFileSync(repo+'/docs/superpowers/plans/2026-10-24-fog-fame.md',plan);console.log(JSON.stringify({cleanup:'COMPLETE',freedBytes:bytes,files,keptCompressedRollback:fs.statSync(record+'/before.qsp.gz').size}));
}else throw Error('Unknown phase '+phase);
