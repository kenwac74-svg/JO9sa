'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),z=require('node:zlib'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',root='G:/Codex/tmp/jo9-catfight-wins-20261024',rec=repo+'/records/catfight-win-limit-20261024';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const beforeHash='bf3c77ae27fde193c2ca3e2f7733c96f99b75bb40eeb22a61c3491f6db618d9f';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'),cr=s=>s.replace(/\r?\n/g,'\r\n');
const body=(d,n)=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),set=(d,n,s)=>d.lines[d.locations.find(x=>x.name===n).body]=c.shift(cr(s),-5);
const phase=process.argv[2];
function addLoc(d,name,text){const count=c.parse(c.serialize(d)).locations.length;d.lines.splice(-1,0,c.shift(name,-5),c.shift('',-5),c.shift(cr(text),-5),c.shift('0',-5));d.lines[3]=c.shift(String(count+1),-5);}
function protect(){return [game+'/jack.qsp',game+'/css/base.css',game+'/FastQSP.ini',game+'/../FastQSP.ini','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/css/base.css',...fs.readdirSync(game+'/save').filter(n=>/\.sav$/i.test(n)).map(n=>game+'/save/'+n)].map(p=>({path:p,sha256:c.hash(fs.readFileSync(p))}));}
function cases(){const out=[];
 for(const hero of [1,101]){
  for(const wins of [0,1,2,4])out.push({name:`win-${hero}-${wins}`,type:'finish',hero,wins,outcome:'победа',want:wins+1,money:1300,event:103005});
  for(const outcome of ['бегство','вырубился'])for(const wins of [0,1,2,3,5])out.push({name:`loss-${hero}-${outcome==='бегство'?'retreat':'ko'}-${wins}`,type:'finish',hero,wins,outcome,want:wins,money:700});
  for(const wins of [0,1,2,3,4,99])out.push({name:`menu-${hero}-${wins}`,type:'menu',hero,wins,allowed:wins<3});
  for(const wins of [0,1,2,3,4,99])out.push({name:`start-${hero}-${wins}`,type:'start',hero,wins,allowed:wins<3});
  for(const wins of [0,2,5])out.push({name:`result-only-${hero}-${wins}`,type:'result',hero,wins,want:wins});
 }
 out.push({name:'menu-no-energy',type:'menu',hero:1,wins:0,energy:3,allowed:false});
 out.push({name:'menu-colosseum-veteran',type:'menu',hero:1,wins:0,arena:4,allowed:false});
 out.push({name:'menu-absent',type:'menu',hero:1,wins:0,absent:true,allowed:false});
 out.push({name:'role-swap',type:'swap',hero:1,wins:2});
 return out;
}
function probe(raw,dir,name){const d=c.parse(raw),xs=cases();let assertions=0;
 const check=(s,label)=>{assertions++;return `if (${s}) = 0: msg 'FAIL_CF_${label}' & exit\n`;};
 let next='jo9_qa_case += 1\n';
 for(let i=0;i<xs.length;i++){
  const x=xs[i];next+=`if jo9_qa_case = ${i+1}:\nkillvar 'slave'\nkillvar '$slave'\nkillvar 'slave_rate'\nkillvar 'assistant'\nkillvar '$assistant'\nkillvar 'assistant_rate'\nkillvar 'jo9_fog'\nkillvar 'jo9_combat'\nhero_choice=${x.hero}\nslave_state=${x.absent?0:1}\nassistant_state=1\n$slave_name='CF Probe'\n$assistant_name='Other Probe'\nslave['catfight_level']=${x.wins}\nassistant['catfight_level']=9\nslave['arena_level']=${x.arena??2}\nslave['energy']=${x.energy??5}\nassistant['energy']=5\nslave['calories']=500\nslave['stamina']=6\nslave['age']=2\nslave['temper']=10\nslave['loser_rating']=0\nslave['winning_series']=7\nslave['gladiatrix']=2\nslave['totalEarned']=77\nslave['sensitivity']=2\nslave_rate['fame']=23\nassistant_rate['fame']=61\n$slave['trademark_style']='retained_style'\n$place='catfightclub'\nmaster_energy=10\nmaster_half_action=0\nis_home=1\nsparks=1000\ncombatant=1\ncolosseum_fight=0\nsp_txt_is_set_from_save=0\nsp_txt=1\nskip_to=0\nsnk_room_target=0\n$g_type='dimacherus'\n$toplay=''\n$city_sounds=''\n`;
  if(x.type==='finish')next+=`$fight_return='Start1'\n$итог_боя='${x.outcome}'\ngt 'выход_из_боя'\n`;
  if(x.type==='result')next+="interaction_city=103005\ngt 'interaction_city'\n";
  if(x.type==='menu'){
   next+="$text_display=''\ndynamic $catfightclub_options[1]\n";
   next+=check(`(instr($text_display, 'combatant = 1') > 0) = ${x.allowed?1:0}`,x.name+'_eligibility');
   next+=check(`slave['catfight_level'] = ${x.wins}`,x.name+'_count');
   next+="gt 'jo9_qa_cf_next'\n";
  }
  if(x.type==='start')next+=(x.allowed?'':'sp_txt=3\nskip_to=14\n')+"$fight_return='qa_sentinel'\narena_mode=7\nколичество_врагов=1\n$враг[1]='gladiatrix1_ava'\ngt '$catfight_fight_start'\n";
  if(x.type==='swap'){
   next+="dynamic $swap_slave_instances, 'slave', 'assistant'\n";
   next+=check("slave['catfight_level'] = 9 and assistant['catfight_level'] = 2",'swap_counts');
   next+="dynamic $swap_slave_instances, 'slave', 'assistant'\n";
   next+=check("slave['catfight_level'] = 2 and assistant['catfight_level'] = 9",'swap_roundtrip');
   next+="gt 'jo9_qa_cf_next'\n";
  }
  next+='end\n';
 }
 next+="msg 'JO9_QA_CF_boundaries_COMPLETE'\n";
 let endpoint='';
 for(let i=0;i<xs.length;i++){
  const x=xs[i];if(!['finish','result','start'].includes(x.type))continue;
  endpoint+=`if jo9_qa_case = ${i+1}:\n`;
  if(x.type==='finish'||x.type==='result'){
   endpoint+=check("$args[0] = 'result'",x.name+'_endpoint');
   endpoint+=check(`slave['catfight_level'] = ${x.want}`,x.name+'_wins');
   endpoint+=check(`sparks = ${x.money??1300}`,x.name+'_purse');
   endpoint+=check(`slave['totalEarned'] = ${(x.outcome==='победа'||x.type==='result')?377:77}`,x.name+'_earned');
   endpoint+=check(`slave['winning_series'] = ${x.type==='result'?7:x.outcome==='победа'?8:0}`,x.name+'_series');
   if(x.event)endpoint+=check('interaction_city = '+x.event,x.name+'_event');
   if(x.outcome==='вырубился')endpoint+=check("slave['loser_rating'] = 1",x.name+'_ko');
  }else{
   endpoint+=check(`$args[0] = '${x.allowed?'battle':'club'}'`,x.name+'_endpoint');
   endpoint+=check(`slave['catfight_level'] = ${x.wins}`,x.name+'_wins');
   endpoint+=check(`slave['calories'] = ${x.allowed?495:500}`,x.name+'_calories');
   endpoint+=check("slave['energy'] = 5 and sparks = 1000",x.name+'_no_cost');
   if(!x.allowed){endpoint+=check("$fight_return = 'qa_sentinel'",x.name+'_no_battle_init');endpoint+=check('sp_txt = 1 and skip_to = 0 and interaction_city = 10201',x.name+'_club_page');}
  }
  endpoint+=check("assistant['catfight_level'] = 9",x.name+'_other_actor');
  endpoint+=check(`slave['arena_level'] = ${x.arena??2}`,x.name+'_arena');
  endpoint+=check("slave_rate['fame'] = 23 and assistant_rate['fame'] = 61",x.name+'_fame');
  endpoint+=check("$slave['trademark_style'] = 'retained_style'",x.name+'_style');
  endpoint+="gt 'jo9_qa_cf_next'\nend\n";
 }
 endpoint+="msg 'FAIL_CF_unexpected_endpoint'\n";
 set(d,'Start',"usehtml=1\n$onnewloc=''\n$counter=''\ngs 'refresh_database'\n$onnewloc=''\n$counter=''\nCONST_INT['slave_exist']=1\njo9_qa_case=0\ngt 'jo9_qa_cf_next'");
 set(d,'interaction_screen_city',"gt 'jo9_qa_cf_endpoint', 'result'");
 set(d,'shop_general',"gt 'jo9_qa_cf_endpoint', 'club'");
 set(d,'боевой_интерфейс',"gt 'jo9_qa_cf_endpoint', 'battle'");
 addLoc(d,'jo9_qa_cf_next',next);addLoc(d,'jo9_qa_cf_endpoint',endpoint);
 fs.mkdirSync(dir,{recursive:true});const out=c.serialize(d);qa.inspectWorld(out);fs.writeFileSync(dir+'/'+name+'.qsp',out);
 write(dir+'/plan.json',[{name,file:dir+'/'+name+'.qsp',marker:'JO9_QA_CF_boundaries_COMPLETE',checkpoint:'Full production finish / interaction result / battle start; only final UI endpoints intercepted'}]);
 write(rec+'/cases.json',{scenarios:xs.length,assertions,cases:xs,instrumentation:'Start/runner; final city/club/battle UI endpoints intercepted. Production finish, result effects, menu builders, battle initialization and swap macro unchanged. No save primer.'});
 const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',dir+'/plan.json','-TimeoutSeconds','45'],{encoding:'utf8',windowsHide:true,timeout:60000});
 const results=read(dir+'/client-results.json'),log=new TextDecoder('euc-kr').decode(fs.readFileSync(dir+'/'+name+'-stderr.log'));
 return {exit:r.status,results,scenarios:xs.length,assertions,diagnosticFailure:(log.match(/FAIL_CF_[^"\r\n]+/)||[])[0],rawLog:dir+'/'+name+'-stderr.log'};
}
if(phase==='prepare'){
 assert(!fs.existsSync(root));assert(!fs.existsSync(rec));fs.mkdirSync(root+'/inputs',{recursive:true});fs.mkdirSync(root+'/patches');fs.mkdirSync(rec+'/scripts',{recursive:true});fs.mkdirSync(rec+'/evidence');
 const raw=fs.readFileSync(game+'/jack.qsp');assert.equal(c.hash(raw),beforeHash);qa.inspectWorld(raw);assert.deepEqual(c.serialize(c.parse(raw)),raw);
 fs.writeFileSync(root+'/inputs/before.qsp',raw);fs.writeFileSync(rec+'/before.qsp.gz',z.gzipSync(raw,{level:9}));assert.deepEqual(z.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz')),raw);write(rec+'/inputs.json',protect());
 fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');
 fs.writeFileSync(repo+'/docs/superpowers/plans/2026-10-24-catfight-win-limit.md',`# 캣파이트 누적3승 제한 수리 계획\r\n\r\n**Goal:** 승리1회당1승, 패배시 누적승수 보존,3승달성후 출전금지.\r\n**Architecture:** 기존 catfight_level을 전투종료 한 곳에서만 가산. 결과화면 중복과 콜로세움식5승분기 제거. 기존 메뉴 <3 유지, 전투시작에서 재확인. 새 저장키/함수/이관 없음.\r\n**Spec:** 사용자2026-10-24 지시 및 기존3승후금지 결정. WORK만, 다음 미구현은 보고후승인대기.\r\n**Review Focus:** 양 주인공분기/승리보상300/패배와기존높은값/낡은준비세이브/역할교환/다른경기보존.\r\n\r\n- [ ] 실제엔진에서기존0→2 오류RED.\r\n- [ ] 선언형수리후동일검사GREEN.\r\n- [ ] 문법·줄/주석경계·정확재생/재적용·공식9경로검사.\r\n- [ ] 독립검토후WORK반영및세이브보존확인.\r\n- [ ] 설명서/작업묶음/감사상태갱신,진단사본정리.\r\n- [ ] 결과보고후다음미구현승인대기. 커밋/푸시없음.\r\n`);
 console.log(JSON.stringify({prepared:true,before:beforeHash,protected:read(rec+'/inputs.json').length}));
}else if(phase==='build'){
 const d=c.parse(fs.readFileSync(root+'/inputs/before.qsp')),edits=[];
 function edit(location,old,newText,count,id){old=cr(old);newText=cr(newText);const t=body(d,location);assert.equal(t.split(old).length-1,count,'Exact edit count '+id);set(d,location,t.split(old).join(newText));edits.push({location,field:'body',old,new:newText,count,patchId:id});}
 edit('выход_из_боя',"        if slave['catfight_level'] > 0: slave['catfight_level'] -= 1",`        ! JO9 MOD START CATFIGHT_CUMULATIVE_LOSS | 2026-10-24_catfight_win_limit
        ! catfight_level은 누적 승수이므로 패배로 감소하지 않는다.
        ! JO9 MOD END CATFIGHT_CUMULATIVE_LOSS`,1,'CATFIGHT_CUMULATIVE_LOSS');
 edit('выход_из_боя',`        if slave['catfight_level'] < 5:
            slave['catfight_level'] += 1
            if slave['catfight_level'] = 5:
                if slave['loser_rating'] = 0:
                    interaction_city = 103004
                else
                    interaction_city = 103005
                end
            end
        end
        if slave['catfight_level'] >= 5 and $slave['trademark_style'] = '': $slave['trademark_style'] = $g_type`,
`        ! JO9 MOD START CATFIGHT_SINGLE_WIN | 2026-10-24_catfight_win_limit
        ! 전투 종료에서만 승리당 한 번 가산한다. 기존 저장 승수는 역산하지 않는다.
        slave['catfight_level'] += 1
        ! JO9 MOD END CATFIGHT_SINGLE_WIN`,1,'CATFIGHT_SINGLE_WIN');
 edit('interaction_city',"\t slave['catfight_level'] += 1",`\t ! JO9 MOD START CATFIGHT_RESULT_NO_DUPLICATE | 2026-10-24_catfight_win_limit
\t ! 승수는 выход_из_боя에서 이미 정산했다. 결과 화면에서 다시 가산하지 않는다.
\t ! JO9 MOD END CATFIGHT_RESULT_NO_DUPLICATE`,2,'CATFIGHT_RESULT_NO_DUPLICATE');
 edit('interaction_city','우리 투기장에서 세 번 넘게 이긴 여자를','우리 투기장에서 세 번 이상 이긴 여자를',2,'CATFIGHT_RULE_TEXT');
 edit('$catfight_fight_start',"$fight_return = 'Start1'",`! JO9 MOD START CATFIGHT_ENTRY_LIMIT | 2026-10-24_catfight_win_limit
! 저장된 경기 직전 링크도 전투 초기화 전에 누적3승 제한을 다시 확인한다.
if slave['catfight_level'] >= 3:
 sp_txt = 1
 skip_to = 0
 interaction_city = 10201
 gt 'interaction_city'
end
! JO9 MOD END CATFIGHT_ENTRY_LIMIT
$fight_return = 'Start1'`,1,'CATFIGHT_ENTRY_LIMIT');
 const raw=c.serialize(d);qa.inspectWorld(raw);assert.equal(c.parse(raw).locations.length,267);
 const patch={id:'2026-10-24_catfight_win_limit',description:'누적3승달성후출전금지:승리1회한번가산,패배승수보존,결과화면중복/5승분기제거,낡은준비세이브재확인. 기존승수이관/명성변경없음.',before_sha256:beforeHash,after_sha256:c.hash(raw),edits};
 fs.writeFileSync(root+'/inputs/candidate.qsp',raw);write(root+'/patches/2026-10-24_catfight_win_limit.json',patch);write(rec+'/patch.json',patch);fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');
 console.log(JSON.stringify({candidate:patch.after_sha256,edits:edits.length,editedLocations:[...new Set(edits.map(x=>x.location))],addedLocations:0,newPersistentKeys:0}));
}else if(phase==='restore-fixtures'){
 assert(!fs.existsSync(root),'Refuse existing scratch');const p=read(rec+'/patch.json'),raw=z.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz'));assert.equal(c.hash(raw),p.before_sha256);
 fs.mkdirSync(root+'/inputs',{recursive:true});fs.mkdirSync(root+'/patches');fs.writeFileSync(root+'/inputs/before.qsp',raw);const d=c.parse(raw);
 for(const e of p.edits){const t=body(d,e.location);assert.equal(t.split(e.old).length-1,e.count);set(d,e.location,t.split(e.old).join(e.new));}
 const candidate=c.serialize(d);assert.equal(c.hash(candidate),p.after_sha256);fs.writeFileSync(root+'/inputs/candidate.qsp',candidate);write(root+'/patches/2026-10-24_catfight_win_limit.json',p);console.log('Restored diagnostics from exact rollback and patch; WORK unchanged.');
}else if(phase==='red'||phase==='green'){
 const r=probe(fs.readFileSync(root+'/inputs/'+(phase==='red'?'before':'candidate')+'.qsp'),root+'/'+phase,'boundaries');
 fs.copyFileSync(r.rawLog,rec+'/evidence/'+phase+'.log');write(rec+'/'+phase+'-results.json',{status:r.results.every(x=>x.pass)?'PASS':'FAIL',...r});
 console.log(JSON.stringify(r));
 if(phase==='red')assert(r.diagnosticFailure&&r.results.every(x=>!x.pass),'Expected behavior failure, not infrastructure error');else assert(r.results.every(x=>x.pass));
 fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');
}else if(phase==='install'){
 const p=read(rec+'/patch.json');assert.equal(read(rec+'/green-results.json').status,'PASS');
 const releaseRoot='G:/Codex/tmp/jo9-catfight-wins-release-20261024',runs=fs.readdirSync(releaseRoot).filter(n=>n.startsWith('run-'));assert.equal(runs.length,1);const report=read(releaseRoot+'/'+runs[0]+'/report.json');assert.equal(report.verdict,'PASS');assert.equal(report.client.probes.length,9);assert(report.client.probes.every(x=>x.pass));
 for(const x of read(rec+'/inputs.json'))assert.equal(c.hash(fs.readFileSync(x.path)),x.sha256,'Protected input before install '+x.path);
 const oldNames=new Set(fs.readdirSync(game));const result=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',root+'/patches'],{encoding:'utf8',windowsHide:true,timeout:90000});
 fs.writeFileSync(rec+'/install.log',result.stdout+'\n'+result.stderr);assert.equal(result.status,0);assert.deepEqual(fs.readFileSync(game+'/jack.qsp'),fs.readFileSync(root+'/inputs/candidate.qsp'));assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),p.after_sha256);
 fs.copyFileSync(rec+'/patch.json',repo+'/mods/2026-10-24_catfight_win_limit.json');fs.copyFileSync(releaseRoot+'/'+runs[0]+'/report.json',rec+'/release-validation.json');
 write(rec+'/install-backups.json',fs.readdirSync(game).filter(n=>!oldNames.has(n)&&n.startsWith('jack.qsp')).map(n=>game+'/'+n));
 const protectedAfter=read(rec+'/inputs.json').map(x=>({...x,expected:x.path===game+'/jack.qsp'?p.after_sha256:x.sha256,after:c.hash(fs.readFileSync(x.path))}));for(const x of protectedAfter)assert.equal(x.after,x.expected,'Protected after install '+x.path);
 write(rec+'/preservation.json',{status:'PASS',files:protectedAfter.length,unchanged:protectedAfter.length-1,onlyChanged:game+'/jack.qsp',userSavesUnchanged:76,results:protectedAfter});fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');
 console.log(JSON.stringify({installed:true,sha256:p.after_sha256,protectedUnchanged:protectedAfter.length-1,savesUnchanged:76,fullChanged:false}));
}
