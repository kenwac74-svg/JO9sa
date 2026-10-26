'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib'),assert=require('assert/strict'),cp=require('child_process');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',root='G:/Codex/tmp/jo9-cow-genius-20261024',record=repo+'/records/cow-genius-balance-20261024';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const phase=process.argv[2],write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n'),read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),q=x=>"'"+String(x).replaceAll("'","''")+"'",cr=x=>x.replace(/\r?\n/g,'\r\n');
const body=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),set=(d,n,b)=>d.lines[d.locations.find(l=>l.name===n).body]=c.shift(cr(b),-5);
if(phase==='prepare'){
 fs.mkdirSync(root+'/inputs',{recursive:true});fs.mkdirSync(record+'/scripts',{recursive:true});fs.mkdirSync(record+'/evidence',{recursive:true});const raw=fs.readFileSync(game+'/jack.qsp');qa.inspectWorld(raw);fs.writeFileSync(root+'/inputs/before.qsp',raw);fs.writeFileSync(record+'/before.qsp.gz',zlib.gzipSync(raw,{level:9}));assert.deepEqual(zlib.gunzipSync(fs.readFileSync(record+'/before.qsp.gz')),raw);
 const paths=[game+'/jack.qsp',game+'/css/base.css','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/css/base.css',...fs.readdirSync(game+'/save').filter(n=>/\.sav$/i.test(n)).map(n=>game+'/save/'+n)];write(record+'/inputs.json',paths.map(p=>({path:p,sha256:c.hash(fs.readFileSync(p))})));
 fs.writeFileSync(record+'/DECISIONS_KO.md',`사용자 확정: 미련한 소의 최종 일일 우유 생산량×1.5, 천재의 pet/dressage/cowSK는 일반의75%, 그 밖의 기존2배 및 stamina 제외 유지. 다재다능은 변경하지 않고 별도 논의. 우유는 질병·체형 보정 후 배율을 한 번 적용하고 수유 등급을 산정한다. 누적 우유와 랜덤 증감은 재배율하지 않는다. 75%는 기존 인물 배열 안에 분야별 사분의 일XP 잔여를 저장하여 작은 경험치도 합계가 맞게 한다. 새 로케이션·형식 변환은 없다. 기존 세이브·CSS·Full·ZIP 보존, 커밋·푸시 금지.\n`);
 fs.mkdirSync(repo+'/docs/superpowers/plans',{recursive:true});fs.writeFileSync(repo+'/docs/superpowers/plans/2026-10-24-cow-genius-balance.md',`# 우유 적성·천재 동물역 균형 구현 계획\n\nGoal: 사용자 확정의 우유1.5배와 동물역 경험치75%를 WORK에 반영한다.\nArchitecture: 기존 next_day 생산식과 jo9_learning_xp를 확장하며 선택 호출17곳에 역할 인자를 연결한다. 전체 인물 배열 복사 규약을 따라 소수점 잔여3키를 유지한다.\nSpec: records/cow-genius-balance-20261024/DECISIONS_KO.md\n\n- [ ] 실제 기존 생산식·helper에서 실패를 재현한다.\n- [ ] 기존 기본 생산식 이후1.5배를 추가하고3분야75%를 구현한다. 다른2배·백치·육체단련 규칙은 유지한다.\n- [ ] 직접/공용/역할 교환/잔여 저장/작은 XP 및 다른 분야·특성 경계를 실제 엔진에서 검사한다.\n- [ ] 동적 호출과 캐시·설명 두 원천을 맞추고 독립 검토한다.\n- [ ] 출고9경로·문법·정확 재생·재적용 후 WORK만 반영한다. 임시 진단 자료를 정리한다. 커밋·푸시하지 않는다.\n`);
 fs.writeFileSync(record+'/scripts/reproduce.cjs',fs.readFileSync(__filename));console.log('Prepared baseline '+c.hash(raw));
}else if(phase==='test'){
 const label=process.argv[3],src=process.argv[4],raw=fs.readFileSync(src),d=c.parse(raw),dir=root+'/'+label;fs.mkdirSync(dir,{recursive:true});const cases=[];
 let code="usehtml=1\r\n";let count=0;const assertQ=(condition,name)=>{count++;return `if (${condition})=0: msg 'JO9_QA_FAIL_${name}_${count}' & exit\r\n`;};
 const roles=['slave','assistant','cow','prisoner','room1','room2','room3','room4','farmhand','stock','iced','dynslave'];
 for(const role of roles){code+=`killvar ${q(role)}\r\n`;for(const skill of['pet','dressage','cowSK']){let rem=0;for(const amount of[1,1,1,1,2,3,4,7,25,11,0,-3,1]){let expected=amount;if(amount>0){const v=rem+amount*3;expected=Math.trunc(v/4);rem=v%4;}code+=`qa_result=func('jo9_learning_xp',${amount},1,${q(skill)},${q(role)})\r\n`;code+=assertQ(`qa_result=${expected} and ${role}[${q('jo9_g75_'+skill)}]=${rem}`,'ANIMAL');}}}
 for(const field of['cook','secretary','service','nurse','alchemy','enchanter','intellect','calisthenics','gladiatrix','petting','roleplay','xenophily','sub_bestiality','oral','penetration','stamina','slave_rate["stamina"]','assistant_rate["stamina"]'])for(const trait of[-1,0,1])for(const amount of[-3,0,1,2,7,25]){let expected=amount;if(amount>0&&!field.includes('stamina'))expected=trait===1?amount*2:trait===-1?Math.max(1,Math.trunc(amount/2)):amount;code+=`qa_result=func('jo9_learning_xp',${amount},${trait},${q(field)},'slave')\r\n`+assertQ(`qa_result=${expected}`,'OTHER');}
 for(const role of['slave','assistant'])for(const skill of['pet','dressage','cowSK']){code+=`killvar ${q(role)}\r\nqa_sum=0\r\n`;for(let i=0;i<4;i++)code+=`qa_sum+=func('jo9_learning_xp',1,1,${q(role+'_rate["'+skill+'"]')},${q(role)})\r\n`;code+=assertQ(`qa_sum=3 and ${role}[${q('jo9_g75_'+skill)}]=0`,'FULLREF');}
 code+="killvar 'slave'\r\nkillvar 'assistant'\r\nqa_result=func('jo9_learning_xp',1,1,'pet','slave')\r\ncopyarr 'assistant','slave'\r\nkillvar 'slave'\r\nqa_result=func('jo9_learning_xp',1,1,'pet','assistant')\r\n"+assertQ("qa_result=1 and assistant['jo9_g75_pet']=2 and slave['jo9_g75_pet']=0",'COPY');
 code+="savegame 'credit.sav'\r\nmsg 'JO9_QA_BALANCE_genius_COMPLETE'";const xpDoc=c.parse(raw);set(xpDoc,'Start',code);qa.inspectWorld(c.serialize(xpDoc));fs.writeFileSync(dir+'/genius.qsp',c.serialize(xpDoc));cases.push({name:'genius',file:dir+'/genius.qsp',marker:'JO9_QA_BALANCE_genius_COMPLETE',checkpoint:'75% cumulative XP and existing rules'});
 const xpChecks=count;count=0;const milk=body(d,'next_day').match(/\$next_day_lactation_update = \{([^]*?)\r\n\}/)[1];let milkCode="usehtml=1\r\nCONST_INT['no_slave']=0\r\nCONST_INT['milf_age']=2\r\ndynslave_state=1\r\n$qa_milk_update={"+milk+"\r\n}\r\n";const specs=[];
 for(const aff of[0,1,2])for(const fat of[0,1,2,3,4,5])for(const illness of[0,1])for(const broken of[0,1]){const p={aff,fat,illness,broken,boobs:6,cowSK:5,impregnation:10,custom:4,mood:5,angst:0,rehabilitation:0,age:2};specs.push(p);}
 specs.push({aff:1,fat:1,illness:0,broken:0,boobs:0,cowSK:0,impregnation:0,custom:0,mood:-5,angst:5,rehabilitation:20,age:0});
 const t=Math.trunc;for(const p of specs){let value=p.boobs+p.cowSK+p.impregnation+Math.min(t(p.custom*3/2),5)+p.mood-p.angst*2-t(p.rehabilitation/2);if(p.age===2)value+=2;if(p.fat===2)value++;if(p.fat===3)value+=2;if(p.fat>3)value+=4;if(!p.fat)value=t(value/2);if(p.illness)value=t(value/3)*2;if(p.broken)value=t(value/3)*2;if(p.aff>0)value=t(Math.max(0,value)*3/2);value=Math.max(0,value);let lact=1;if(value>10)lact=2;if(value>16)lact=3;if(value>22)lact=4;if(value>35)lact=5;
  milkCode+="killvar 'dynslave'\r\n";for(const k of['boobs','cowSK','impregnation','custom','mood','angst','rehabilitation','age','fat'])milkCode+=`dynslave[${q(k)}]=${p[k]}\r\n`;milkCode+=`dynslave['cowSK_affinity']=${p.aff}\r\ndynslave['ill']=${p.illness}\r\ndynslave['energy']=4\r\ndynslave['lactation']=1\r\ndynslave['milk_summ']=0\r\n$dynslave_psy_status=${q(p.broken?'broken':'docile')}\r\ndynamic $qa_milk_update\r\n`;milkCode+=assertQ(`dynslave['milk_gain']=${value} and dynslave['lactation']=${lact} and dynslave['energy']=3 and dynslave['milk_summ']>=${value} and dynslave['milk_summ']<=${value+1}`,'MILK');}
 milkCode+="killvar 'dynslave'\r\ndynslave['cowSK_affinity']=1\r\ndynslave['energy']=4\r\ndynamic $qa_milk_update\r\n"+assertQ("dynslave['milk_gain']=0 and dynslave['energy']=4",'NO_LACTATION')+"msg 'JO9_QA_BALANCE_milk_COMPLETE'";set(d,'Start',milkCode);qa.inspectWorld(c.serialize(d));fs.writeFileSync(dir+'/milk.qsp',c.serialize(d));cases.push({name:'milk',file:dir+'/milk.qsp',marker:'JO9_QA_BALANCE_milk_COMPLETE',checkpoint:'Actual daily lactation dynamic function'});write(dir+'/plan.json',cases);
 const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',dir+'/plan.json','-TimeoutSeconds','30'],{encoding:'utf8',windowsHide:true,timeout:80000});const results=read(dir+'/client-results.json');write(record+'/'+label+'-results.json',{xpChecks,milkChecks:count,results});for(const a of cases)fs.copyFileSync(dir+'/'+a.name+'-stderr.log',record+'/evidence/'+label+'-'+a.name+'.log');console.log(JSON.stringify({label,xpChecks,milkChecks:count,results}));if(label==='red')assert(results.every(x=>!x.pass));else{assert.equal(r.status,0);assert(results.every(x=>x.pass));const saved=require(repo+'/tools/qa/save-codec.cjs').parse(fs.readFileSync(dir+'/credit.sav'));assert.equal(require(repo+'/tools/qa/save-codec.cjs').value(saved,'assistant','jo9_g75_pet')[0],'2');}
}else if(phase==='build'){
 const raw=fs.readFileSync(root+'/inputs/before.qsp'),d=c.parse(raw),patch={id:'2026-10-24_cow_genius_balance',description:'미련한소 일일 우유 생산량1.5배. 천재 pet/dressage/cowSK 양의XP75%, 인물·분야별 사분의일 잔여 보존. 다른2배/체력제외/백치/다재다능 유지.',target:'game\\jack.qsp',before_sha256:c.hash(raw),after_sha256:'',edits:[]};
 function edit(loc,old,next,marker,count=1){let b=body(d,loc);assert.equal(b.split(old).length-1,count,'Exact edit count '+loc+' '+marker);const marked='! JO9 MOD START '+marker+' | '+patch.id+'\r\n'+cr(next)+'\r\n! JO9 MOD END '+marker;patch.edits.push({location:loc,field:'body',old,new:marked,count});set(d,loc,b.split(old).join(marked));}
 const milkOld="\t\t\tif $dynslave_psy_status = 'broken': dynslave['milk_gain'] = (dynslave['milk_gain']/3)*2";
 edit('next_day',milkOld,milkOld+"\n\t\t\tif dynslave['cowSK_affinity'] > 0: dynslave['milk_gain'] = max(0, dynslave['milk_gain']) * 3 / 2\n\t\t\t! Base production comments below exclude this aptitude bonus; base37 becomes55, before lactation grade and existing food costs.",'COW_APTITUDE_MILK_150');
 const oldHelper=body(d,'jo9_learning_xp');
 const helper=`! args[0]: new XP, args[1]: learning trait, $args[2]: field, optional $args[3]: actor role.
! Animal75% carries quarters on the actor; other growth and the old stamina/idiot rules are unchanged.
result = args[0]
if args[0] > 0 and $args[2] ! 'stamina' and $args[2] ! 'slave_rate["stamina"]' and $args[2] ! 'assistant_rate["stamina"]':
 if args[1] = 1:
  $jo9_g75_field = replace($args[2], '"', '')
  $jo9_g75_field = replace($jo9_g75_field, "'", '')
  if instr($jo9_g75_field, '[') > 0: $jo9_g75_field = mid($jo9_g75_field, instr($jo9_g75_field, '[') + 1, len($jo9_g75_field))
  $jo9_g75_field = replace($jo9_g75_field, ']', '')
  if $jo9_g75_field = 'pet' or $jo9_g75_field = 'dressage' or $jo9_g75_field = 'cowSK':
   result = args[0] * 3 / 4
   if $args[3] ! '':
    $jo9_g75_role = $args[3]
    $jo9_g75_key = 'jo9_g75_' + $jo9_g75_field
    jo9_g75_credit = dyneval('result = ' + $jo9_g75_role + '["' + $jo9_g75_key + '"]')
    jo9_g75_total = args[0] * 3 + max(0, min(3, jo9_g75_credit))
    result = jo9_g75_total / 4
    dynamic $jo9_g75_role + '["' + $jo9_g75_key + '"] = ' + str(jo9_g75_total mod 4)
   end
  else
   result = args[0] * 2
  end
 elseif args[1] = -1:
  result = args[0] / 2
  if result < 1: result = 1
 end
end
killvar '$jo9_g75_field'
killvar '$jo9_g75_role'
killvar '$jo9_g75_key'
killvar 'jo9_g75_credit'
killvar 'jo9_g75_total'`;
 edit('jo9_learning_xp',oldHelper,helper,'GENIUS_ANIMAL_XP_75');
 const calls=[];const re=/func\('jo9_learning_xp',\s*\(([^\r\n]*?)\),\s*(\w+)\['jo9_learning_trait'\],\s*('(?:pet|dressage|cowSK)'|\$target_skill)\)/g;
 for(const l of d.locations){if(l.name==='jo9_learning_xp')continue;for(const line of body(d,l.name).split('\r\n')){const matches=[...line.matchAll(re)];if(!matches.length)continue;assert.equal(matches.length,1);const m=matches[0];assert(['slave','assistant','cow','prisoner','room1','room2','room3','room4','dynslave'].includes(m[2]));calls.push({location:l.name,role:m[2],field:m[3],old:line,new:line.replace(m[0],m[0].slice(0,-1)+', '+q(m[2])+')')});}}
 assert.equal(calls.length,17,'Only 16 explicit animal calls plus common skill pipeline');const groups=new Map();for(const v of calls){const key=v.location+'\n'+v.old;if(groups.has(key))groups.get(key).count++;else groups.set(key,{...v,count:1});}let callerIndex=0;for(const v of groups.values())edit(v.location,v.old,v.new,'GENIUS_ANIMAL_ROLE_'+String(++callerIndex).padStart(2,'0'),v.count);write(record+'/callers.json',calls.map(({old,new:next,...rest})=>rest));
 for(const n of['#static_txt','#txt_woman']){const b=body(d,n),oldCow=b.split('\r\n').find(x=>x.startsWith('$Indolent = ')),oldGenius=b.split('\r\n').find(x=>x.startsWith('$jo9_genius_text = '));edit(n,oldCow,oldCow.slice(0,-1)+' 젖소 적성으로 하루 우유 생산량이 최종 계산값의 1.5배가 된다.\'','COW_APTITUDE_DESC_'+(n==='#static_txt'?'COMMON':'WOMAN'));edit(n,oldGenius,"$jo9_genius_text = '당신의 노예는 천재적인 학습 능력을 타고났다. 생성 시 지성은 최고 등급이며, 육체단련을 제외한 분야에서 새로 얻는 성장 경험치가 두 배가 된다. 다만 애완녀·망아지·젖소녀 기술의 성장 경험치는 일반의 75%이며, 소수점 나머지는 인물과 기술별로 누적된다. 지성은 이후 기존 규칙에 따라 변할 수 있다.'",'GENIUS_ANIMAL_DESC_'+(n==='#static_txt'?'COMMON':'WOMAN'));}
 const cacheOld="if jo9_learning_revision < 2:\r\n jo9_learning_revision = 2\r\n gs '#static_base'\r\n gs '#dynamic'\r\n gs '#static_txt'\r\n gs '#txt'\r\n code_defined['newloc_update_iced_features_list'] = 0\r\nend";
 const cacheNew=cacheOld.replace('revision < 2','revision < 3').replace('revision = 2','revision = 3').replace(" code_defined['newloc_update_iced_features_list'] = 0"," code_defined['newloc_update_iced_features_list'] = 0\r\n code_defined['interaction_result_milking_slave'] = 0");edit('$newloc',cacheOld,cacheNew,'GENIUS_ANIMAL_CACHE_REV3');
 const candidate=c.serialize(d);qa.inspectWorld(candidate);patch.after_sha256=c.hash(candidate);fs.mkdirSync(root+'/patches',{recursive:true});write(root+'/patches/'+patch.id+'.json',patch);write(record+'/patch.json',patch);fs.writeFileSync(root+'/inputs/candidate.qsp',candidate);
 const beforeDoc=c.parse(raw);for(const n of['generate_stock','jo9_traits_value','jo9_traits','jo9_traits_personality','jo9_traits_combat'])assert.equal(body(d,n),body(beforeDoc,n),'Unrelated trait module changed');assert.equal(d.locations.length,beforeDoc.locations.length);console.log(JSON.stringify({after:patch.after_sha256,edits:patch.edits.length,callerCount:calls.length,newLocations:0}));
}else if(phase==='integrate'){
 const raw=fs.readFileSync(root+'/inputs/candidate.qsp'),doc=c.parse(raw),dir=root+'/integration';fs.mkdirSync(dir,{recursive:true});let code='usehtml=1\r\n',checks=0;
 const check=(condition,label)=>{checks++;return `if (${condition})=0: msg 'JO9_QA_FAIL_${label}_${checks}' & exit\r\n`;};
 const pattern=/func\('jo9_learning_xp',\s*\(([^\r\n]*?)\),\s*(\w+)\['jo9_learning_trait'\],\s*('(?:pet|dressage|cowSK)'|\$target_skill),\s*'\w+'\)/g;let routes=0;let mainLine='';
 for(const l of doc.locations)for(const line of body(doc,l.name).split('\r\n')){const m=[...line.matchAll(pattern)][0];if(!m)continue;routes++;const role=m[2],field=m[3][0]==="'"?m[3].slice(1,-1):'cowSK',base=Number.isFinite(Number(m[1]))?Number(m[1]):1;
  code+=`killvar ${q(role)}\r\nkillvar ${q(role+'_rate')}\r\n${role}['jo9_learning_trait']=1\r\nskill_rise=1\r\nskill_adv_mul=1\r\n$target_skill=${q(field)}\r\n`;
  for(let i=0;i<4;i++)code+=line+'\r\n';code+=check(`${role}_rate[${q(field)}]=${base*3} and ${role}[${q('jo9_g75_'+field)}]=0`,'ROUTE');if(l.name==='#dynamic')mainLine=line;
 }
 assert.equal(routes,17);assert(mainLine);
 for(const role of['slave','assistant','cow'])for(const field of['pet','dressage','cowSK']){code+=`killvar ${q(role)}\r\nkillvar ${q(role+'_rate')}\r\n${role}['jo9_learning_trait']=1\r\n$target_skill=${q(field)}\r\nskill_rise=1\r\nskill_adv_mul=1\r\n`;
  for(let i=0;i<4;i++)code+="dynamic $replace({"+mainLine+"}, 'dynslave', "+q(role)+")\r\n";
  code+=check(`${role}_rate[${q(field)}]=3 and ${role}[${q('jo9_g75_'+field)}]=0`,'ROLE_TEMPLATE');
 }
 for(const field of['pet','dressage','cowSK'])for(const trait of[-1,0])for(const amount of[-3,0,1,2,3,7,25]){const expected=amount>0&&trait===-1?Math.max(1,Math.trunc(amount/2)):amount;code+=`qa_result=func('jo9_learning_xp',${amount},${trait},${q(field)},'slave')\r\n`+check(`qa_result=${expected}`,'ANIMAL_OTHER_TRAIT');}
 for(const focus of[-1,1]){code+="killvar 'slave'\r\nslave['jo9_focus_active']="+focus+"\r\nqa_sum=0\r\n";for(let i=0;i<4;i++)code+="qa_sum+=func('jo9_traits_personality','xp','slave','cowSK',func('jo9_learning_xp',4,1,'cowSK','slave'))\r\n";code+=check('qa_sum='+(focus===1?13:11),'FOCUS_STACK');}
 code+="msg 'JO9_QA_BALANCE_routes_COMPLETE'";set(doc,'Start',code);qa.inspectWorld(c.serialize(doc));fs.writeFileSync(dir+'/routes.qsp',c.serialize(doc));
 const cacheDoc=c.parse(raw),cache=body(cacheDoc,'$newloc').match(/if jo9_learning_revision < 3:\r\n[^]*?\r\nend/)[0];let cacheCode="usehtml=1\r\nhero_choice=0\r\njo9_learning_revision=2\r\ncode_defined['interaction_result_milking_slave']=1\r\ncode_defined['newloc_update_iced_features_list']=1\r\n"+cache+"\r\n";cacheCode+=check("jo9_learning_revision=3 and code_defined['interaction_result_milking_slave']=0 and code_defined['newloc_update_iced_features_list']=0",'CACHE');cacheCode+="if instr($jo9_genius_text,'75%')=0 or instr($Indolent,'1.5배')=0: msg 'JO9_QA_FAIL_DESCRIPTIONS' & exit\r\ngs '#txt_woman'\r\nif instr($jo9_genius_text,'75%')=0 or instr($Indolent,'1.5배')=0: msg 'JO9_QA_FAIL_WOMAN_DESCRIPTIONS' & exit\r\nmsg 'JO9_QA_BALANCE_cache_COMPLETE'";set(cacheDoc,'Start',cacheCode);qa.inspectWorld(c.serialize(cacheDoc));fs.writeFileSync(dir+'/cache.qsp',c.serialize(cacheDoc));
 const plan=[{name:'routes',file:dir+'/routes.qsp',marker:'JO9_QA_BALANCE_routes_COMPLETE',checkpoint:'17 exact caller lines and real role substitution'},{name:'cache',file:dir+'/cache.qsp',marker:'JO9_QA_BALANCE_cache_COMPLETE',checkpoint:'Existing revision2 and both description sources'}];write(dir+'/plan.json',plan);const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',dir+'/plan.json','-TimeoutSeconds','30'],{encoding:'utf8',windowsHide:true,timeout:80000});const results=read(dir+'/client-results.json');write(record+'/integration-results.json',{exactRoutes:routes,checks,results});for(const p of plan)fs.copyFileSync(dir+'/'+p.name+'-stderr.log',record+'/evidence/integration-'+p.name+'.log');console.log(JSON.stringify({exactRoutes:routes,checks,results}));assert.equal(r.status,0);assert(results.every(x=>x.pass));
}else if(phase==='install'){
 const p=read(record+'/patch.json'),runs=fs.readdirSync(root+'/release').map(n=>read(root+'/release/'+n+'/report.json')),report=runs.at(-1);assert.equal(report.verdict,'PASS');assert(read(record+'/green-results.json').results.every(x=>x.pass));assert(read(record+'/integration-results.json').results.every(x=>x.pass));assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),p.before_sha256,'WORK changed since baseline');const oldBackups=new Set(fs.readdirSync(game));
 const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',root+'/patches'],{encoding:'utf8',windowsHide:true,timeout:30000});fs.writeFileSync(record+'/install.log',r.stdout+'\n'+r.stderr);assert.equal(r.status,0);assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),p.after_sha256);fs.copyFileSync(root+'/patches/'+p.id+'.json',repo+'/mods/'+p.id+'.json');write(record+'/release-validation.json',report);
 const inputs=read(record+'/inputs.json');for(const v of inputs)assert.equal(c.hash(fs.readFileSync(v.path)),v.path===game+'/jack.qsp'?p.after_sha256:v.sha256,'Protected input '+v.path);write(record+'/install-backups.json',fs.readdirSync(game).filter(n=>!oldBackups.has(n)&&n.startsWith('jack.qsp.bak_')).map(n=>game+'/'+n));
 write(record+'/FINAL_RESULT.json',{status:'WORK_APPLIED',id:p.id,before:p.before_sha256,after:p.after_sha256,edits:p.edits.length,callerCount:17,newLocations:0,geniusXpChecks:799,milkChecks:74,integrationChecks:71,releaseNativePaths:9,qaRegressionTests:27,cowMultiplier:'1.5 after condition reductions and before lactation grade',geniusAnimalMultiplier:'75% with per-actor/skill remainder',otherGeniusXp:'existing2x with stamina exclusion unchanged',versatileUnchanged:true,protectedSaves:inputs.length-4,cssFullAndSavesUnchanged:true,commitPush:false});console.log('WORK applied; all protected files preserved');
}else if(phase==='finish'){
 const r=read(record+'/FINAL_RESULT.json');assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),r.after);fs.writeFileSync(record+'/scripts/reproduce.cjs',fs.readFileSync(__filename));
 write(record+'/independent-review.json',{status:'PASS',reviewer:'/root/milk_layout_audit',locations:266,changedBodies:9,newLocations:0,patchEdits:23,exactReplacements:24,animalCallers:17,missedAnimalCallers:0,creationAndVersatileUnchanged:true,descriptionsMatch:true,roleCopyCompatible:true,limit:'Actual older mid-interaction GUI save was not tested; its saved three-argument call can lack one fractional carry, then new interactions use updated callers.'});
 fs.writeFileSync(record+'/MANUAL_KO.md',`# 미련한 소 우유 보너스·천재 동물역 성장 — 2026-10-24

사용자 확정대로 WORK에 반영했다. 천재의 기존 경험치2배가 종합 성장 효과를 포함한 구현이라는 확인을 따랐다. 개별 적성 플래그를 추가 부여하거나 성실도·선호·성격을 바꾸지 않았다. 다재다능은 기존 전체 표시 지식·기술/ST A 이상 영구 획득과 기본 가치+25%를 유지한다.

## 효과와 계산 순서

미련한 소(cowSK_affinity>0)는 기존 일일 milk_gain에서 가슴·기술·수태율·습관·기분·불안·회복·연령·체형·질병·정신 상태 보정을 모두 마친 뒤 max(0,값)×3÷2를 한 번 적용한다. 정수 절사이며 기본37점이면55점이다. 이전에 쌓인 milk_summ과 랜덤 증감에는 배율을 적용하지 않는다. 이후 기존 수유 등급 판정에 이 생산량을 사용하므로 등급에 따른 기존 식비·열량 소모도 따라온다. 착유 병 전환식과 저장량·판매가는 바꾸지 않았다.

천재는 pet/dressage/cowSK의 새 양의 경험치에만75%를 적용한다. 그 밖의 기존2배, stamina 제외, 0·음수와 백치 규칙은 유지한다. 성애기술/ST는 기존2배이며 동물역 감점은 승인한 세 기술에 한정한다. 다른 성격·체질 보정은 기존 중첩 순서를 유지한다.

## 입력·반환·저장 부작용

기존 jo9_learning_xp의 args[0]=새 경험치, args[1]=학습 특성, $args[2]=항목 이름은 유지한다. 세 동물 기술에 도달하는17개 호출만 $args[3]=실제 역할을 추가했다. 다른235개 호출은 그대로다. 반환값 result가 지급할 경험치다. 기존 전체 변수 참조도 정규화하여 petting을 pet으로 오인하지 않는다.

천재의 동물 기술에서만 인물 숫자 배열 안의 jo9_g75_pet/dressage/cowSK에0~3의 사분의일 경험치 잔여를 쓴다. 새기여량=기존잔여+기본XP×3, 지급량=기여량÷4, 잔여=기여량 mod4다. 기본1XP 네 번은0·1·1·1, 합계3XP다. 기존 누적 경험치·등급은 재계산하지 않는다. 다른 분야·다른 특성·0/음수 입력은 이 잔여를 건드리지 않는다.

누락 키는 기존 엔진의0값으로 시작한다. 인물 배열 전체를 복사·교환·저장하므로 잔여도 인물을 따라간다. 특성 해제 후의 잔여는 보존되며 다시 천재로 돌아오면 해당 분야에서 이어진다. 세이브 파일 형식·별도 파일·새 로케이션·일괄 이관은 없다. 일시 jo9_g75_* 전역 변수는 반환 전에 지우며 인물 배열의 잔여는 지우지 않는다.

## 호출과 제거 시 영향

next_day의 $next_day_lactation_update 공통 루틴이 우유를 계산한다. #dynamic의 $dyn_skill_rise, 직접 착유/개인실/외양간 성장, 경주 보상 등의17경로가 새 역할 인자를 전달한다. callers.json과 패치 GENIUS_ANIMAL_ROLE 표식으로 찾는다. helper가 없어지면 모든 기존 학습 호출이 실패한다. 역할 인자만 제거하면75% 정수 계산은 되지만 소수점 이월이 없어져 작은 경험치가 사라질 수 있다. 우유 보너스만 제거하면 적성에 따른1.5배가 사라진다.

jo9_learning_revision을2→3으로 올려 정의·설명을 읽고 기존 착유 결과 코드 캐시를 해제한다. 정상 로드의 refresh_database도 기존대로 동작한다. #static_txt와 #txt_woman 두 설명 원천을 같이 갱신했다. 캐시 갱신은 인물·수치·특성을 재추첨하지 않는다.

## 검증과 한계

기존 helper/생산식에서 새 기대값이 실패하는 RED를 확인했다. 수정 후 실제 FastQSP에서 경험치799조건, 실제 일일 생산식74조건, 실제 호출17곳·역할 치환·일반/백치·성격 보정·캐시 갱신71조건을 통과했다. 1XP 누적, 슬롯별·기술별 분리, 배우 역할 복사, 실제 진단 세이브에 잔여2가 남는 것도 확인했다. 기존 세이브를 GUI로 불러와 플레이한 검사는 아니다.

구조266locations·왕복·CRLF/주석 경계·인물 등록·정확 패치 재생/재적용·공식 설치엔진9경로 PASS. 검사기 회귀27건 PASS. 독립 검토에서9개 본문 외 필드와 생성·다재다능·전투·체력 모듈이 그대로임을 확인했다. 최초 후보 생성은 같은 문장이2회 존재해 고유문장 검사에서 멈췄고, 이를 명시적 count2로 기록한 뒤 정확 재생을 통과했다.

이미 행동 중간에 저장된 옛 문자열이 남은 세이브는 직접 GUI 검사하지 않았다. 그 문자열이 예전3인자 동물 호출을 한 번 실행하면75% 정수값은 적용되지만 그 한 번의 소수점 잔여는 보존되지 않을 수 있다. 다음 새 행동은 갱신된 역할 인자를 사용한다. 새 게임·모든 교육 상황·모든 GUI 저장/로드를 전수 플레이한 결과로 표현하지 않는다.

WORK만 반영했고 기존 세이브·CSS·이미지·JSON·Full·배포 ZIP·커밋·푸시는 변경하지 않았다. before.qsp.gz는 해제 바이트 일치를 확인한 최소 원본이며, patch.json과 재현 스크립트·검사 보고서를 남기고 진단 QSP/세이브·복제 JSON을 정리했다.
`,'utf8');
 const docPath=repo+'/docs/INNATE_LEARNING_TRAITS_20261016.md';let doc=fs.readFileSync(docPath,'utf8');assert(!doc.includes('GENIUS_ANIMAL_XP_75'));const headerEnd=doc.indexOf('\n')+1;doc=doc.slice(0,headerEnd)+'\n> 2026-10-24 변경(GENIUS_ANIMAL_XP_75): 천재의 pet/dressage/cowSK는 일반75%로 변경했고 작은 경험치는 인물·분야별로 누적한다. 다른 기존2배와 stamina 제외는 유지한다. 아래는 최초 사양이며 최신 계약·저장 부작용은 [이번 설명](../records/cow-genius-balance-20261024/MANUAL_KO.md)을 우선한다.\n'+doc.slice(headerEnd);fs.writeFileSync(docPath,doc);
 const bundle=repo+'/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md';let b=fs.readFileSync(bundle,'utf8');assert(!b.includes('COW_GENIUS_BALANCE_20261024'));b+='\r\n\r\n## WORK 수정 완료 — 미련한 소 생산량·천재 동물역 성장 (COW_GENIUS_BALANCE_20261024)\r\n\r\n- 미련한 소는 최종 일일 우유 생산량1.5배. 누적 우유/랜덤 증감은 재배율하지 않고 수유 등급·기존 식비 계산은 결과를 따른다.\r\n- 천재는 pet/dressage/cowSK만 일반75%, 다른 기존2배·stamina 제외 유지. 작은XP는인물·기술별로이월하며기존세이브일괄이관없음. 다재다능·생성·기존능력치보존.\r\n- 실제 엔진799XP/74생산/71통합·캐시 및 공식9경로, 문법·정확 재생/재적용·독립 검토 PASS. 기존세이브·CSS·Full보존. WORK만반영, ZIP/커밋/푸시없음.\r\n- [동작·의존성·검증 한계](../records/cow-genius-balance-20261024/MANUAL_KO.md), [결과](../records/cow-genius-balance-20261024/FINAL_RESULT.json).\r\n';fs.writeFileSync(bundle,b);
 const plan=repo+'/docs/superpowers/plans/2026-10-24-cow-genius-balance.md';fs.writeFileSync(plan,fs.readFileSync(plan,'utf8').replaceAll('- [ ]','- [x]'));
 assert.equal(c.hash(zlib.gunzipSync(fs.readFileSync(record+'/before.qsp.gz'))),r.before);for(const p of read(record+'/install-backups.json')){assert.equal(path.dirname(path.resolve(p)),path.resolve(game));assert(path.basename(p).startsWith('jack.qsp.bak_'));assert.equal(c.hash(fs.readFileSync(p)),r.before);assert(!fs.lstatSync(p).isSymbolicLink());fs.unlinkSync(p);}
 const abs=path.resolve(root);assert.equal(abs,path.resolve('G:/Codex/tmp/jo9-cow-genius-20261024'));let files=0,bytes=0;function check(p){assert(p===abs||p.startsWith(abs+path.sep));const st=fs.lstatSync(p);assert(!st.isSymbolicLink(),'Never traverse links');if(st.isDirectory())for(const n of fs.readdirSync(p))check(path.join(p,n));else{files++;bytes+=st.size;}}check(abs);fs.rmSync(abs,{recursive:true});write(record+'/cleanup.json',{temporaryRoot:abs,removedFiles:files,removedMiB:Math.round(bytes/1048576),compressedOriginalPreserved:true});assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),r.after);console.log('Finished records and temporary cleanup');
}else throw Error('Unknown phase');
