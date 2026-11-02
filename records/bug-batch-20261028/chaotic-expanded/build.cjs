'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const id='2026-10-28_chaotic_priority',input='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',raw=fs.readFileSync(input),doc=c.parse(raw);
assert.equal(doc.hash,'dbe2948f7c827d8fc82ccd32b2c3453626d181a59eb744e015fa66a3846280ae');
const get=n=>{const l=doc.locations.find(l=>l.name===n);assert(l,n);return c.shift(doc.lines[l.body],5);};
const edits=[],wrap=s=>'! JO9 MOD START CHAOTIC_PRIORITY_20261028 | '+id+'\r\n'+s+'\r\n! JO9 MOD END CHAOTIC_PRIORITY_20261028';
function edit(location,old,next){assert.equal(get(location).split(old).length-1,1,location+' original unique');edits.push({location,field:'body',old,new:next,count:1});}
const ambiguous=[
 {key:'metabolism',values:[1,2,4,5],labels:{1:'미약한 대사량',2:'낮은 대사량',4:'높은 대사량',5:'고도 대사량'},neutral:3,reason:'체중·열량 관리의 목표에 따라 유불리가 달라짐',refs:['next_day:1598','next_day:1618','__static_base:960-961']},
 {key:'nymphomania',values:[1,2],label:'색정광',xp:'nymphomania_xp',reason:'수용·명망 이점과 흥분 누적에 따른 관리 부담이 함께 있는 기존 상황형',refs:['next_day:2929-2931','next_day:4184','__static_base:1569']},
 {key:'perversion',values:[-1,2],labels:{'-1':'순수한 영혼',2:'이상성욕 선호'},xp:'perversion_xp',reason:'음수는 명망 이점과 수용 제약, 양수는 수용 이점과 일부 고객 거절 조건',refs:['__static_base:1575-1582','slave_sell_chek:43-45']},
 {key:'homosexualism',values:[-1,2],labels:{'-1':'동성애 혐오자',2:'레즈비언'},xp:'lesbian_xp',reason:'기존 상황형의 대상별 수용 차이. 이점 중심인 양성애자1은 보존',refs:['__dynamic:492-506','next_day:3867-3869']},
 {key:'courage',values:[-1,1,2],labels:{'-1':'겁쟁이',1:'용감함',2:'무모함'},reason:'복종·공포와 전투·경주 사이의 상반된 효과',refs:['__static_base:1326-1328','$ride_start:22-23']},
 {key:'selfesteem',values:[1],label:'과대망상',reason:'명망 이점과 공로 기대 증폭에 따른 보상 누락 부담',refs:['$newloc:163-165','next_day:1451-1457','__static_base:1586']},
 {key:'compassion',values:[-1,1],labels:{'-1':'가학성애자',1:'평화주의자'},xp:'compassion_xp',reason:'타인 고통 관찰에서 상반된 기분 반응, 양수 명망 이점',refs:['interaction_result:560-568','__static_base:1587']},
 {key:'passion_luxury',values:[-1,1],labels:{'-1':'구두쇠',1:'사치광'},reason:'선물 효과·기분·버릇없음 누적 및 보상 방식에 따른 차이',refs:['interaction_result:1170-1199']},
 {key:'passion_sweets',values:[-1,1],labels:{'-1':'까다로운 입맛',1:'당분 중독'},reason:'음식 보상 효과와 이에 연동되는 기분·버릇없음, 보상 방식 차이',refs:['interaction:6072-6074','interaction_result:1226-1248']},
 {key:'passion_fame',values:[-1],label:'은둔형 외톨이',reason:'기존 상황형의 칭찬·사교 보상 효율 차이. +1은 기존 관심추구 별칭과 통합',refs:['interaction:6008','__static_base:2203','jo9_traits:670']}
];
let old=get('jo9_chaotic'),next=old;
next=next.replace('! count: eligible negative axes. apply: remove one held axis and consume one chaotic_essence on success.','! count: candidate count in the current priority tier. apply: negatives first, then situational general traits; consume one only on success.');
next=next.replace("msg '제거할 부정 특성이 없습니다. 카오틱 에센스는 소모되지 않았습니다.'","msg '제거할 부정·상황형 특성이 없습니다. 카오틱 에센스는 소모되지 않았습니다.'");
for(const key of ['grace','dexterity','meekness','selfesteem','anal_affinity']){const from=`jo9ceactor['${key}'] < 0`;assert(next.includes(from));next=next.replace(from,`jo9ceactor['${key}'] = -1`);}
// The union remover resets jo9_attention itself. Preserve unknown union variants by skipping that axis.
next=next.replace("if func('jo9_traits', 'attention_has', 'jo9ceactor') = 1:","if func('jo9_traits', 'attention_has', 'jo9ceactor') = 1 and (jo9ceactor['jo9_attention'] = 0 or jo9ceactor['jo9_attention'] = 1):");
const poolEnd="}, 'jo9ceactor', $jo9_chaotic_role)\r\nif $jo9_chaotic_mode = 'count': result = jo9_chaotic_count & exit";
assert(next.includes(poolEnd));
const neg=[" if jo9ceactor['nymphomania'] = -1:","  $jo9_chaotic_keys[jo9_chaotic_count] = 'nymphomania'","  $jo9_chaotic_labels[jo9_chaotic_count] = '불감증'","  $jo9_chaotic_xps[jo9_chaotic_count] = 'nymphomania_xp'",'  jo9_chaotic_count += 1',' end'];
const amb=['if jo9_chaotic_count = 0:'," dynamic $replace({"];
for(const r of ambiguous){amb.push('  if '+r.values.map(v=>`jo9ceactor['${r.key}'] = ${v}`).join(' or ')+':',`   $jo9_chaotic_keys[jo9_chaotic_count] = '${r.key}'`);if(r.labels){for(const v of r.values)amb.push(`   if jo9ceactor['${r.key}'] = ${v}: $jo9_chaotic_labels[jo9_chaotic_count] = '${r.labels[v]}'`);}else amb.push(`   $jo9_chaotic_labels[jo9_chaotic_count] = '${r.label}'`);amb.push(`   $jo9_chaotic_xps[jo9_chaotic_count] = '${r.xp||''}'`,'   jo9_chaotic_count += 1','  end');}
amb.push(" }, 'jo9ceactor', $jo9_chaotic_role)",'end');
next=next.replace(poolEnd,neg.join('\r\n')+"\r\n}, 'jo9ceactor', $jo9_chaotic_role)\r\n"+amb.join('\r\n')+"\r\nif $jo9_chaotic_mode = 'count': result = jo9_chaotic_count & exit");
next=next.replace("jo9ceactor[$args[0]] = 0","jo9ceactor[$args[0]] = iif($args[0] = 'metabolism', 3, 0)");
const reveal="|grace|dexterity|sport_affinity|masochism|exhibitionism|meekness|selfesteem|abuse_attitude|darkness_attitude|blood_attitude|fire_attitude|water_attitude|vermin_attitude|deprivation_attitude|";
assert(next.includes(reveal));next=next.replace(reveal,reveal+'nymphomania|metabolism|perversion|homosexualism|courage|compassion|passion_luxury|passion_sweets|passion_fame|');
edit('jo9_chaotic',old,wrap(next));
const oldDescription='부정 특성 중 무작위 1개를 삭제합니다. 성취 특성과 그 외 특성·상태는 보존합니다.';
const newDescription='부정 특성을 우선 무작위로 하나 제거하며, 없으면 상황형 일반 특성에서 하나를 제거합니다. 확실한 긍정 특성과 성취·칭호·상태는 보존합니다.';
for(const location of ['menu_form','pharmacy']){const original=get(location);let at=0;for(const line of original.split('\r\n')){
 let replacement=null;
 if(line.includes(oldDescription))replacement=wrap(line.replace(oldDescription,newDescription));
 else if(line.includes('삭제할 부정 특성이 없습니다. 아이템을 소모하지 않습니다.'))replacement=wrap(line.replace('삭제할 부정 특성이 없습니다. 아이템을 소모하지 않습니다.','제거할 부정·상황형 특성이 없습니다. 아이템을 소모하지 않습니다.'));
 if(replacement!==null){const field=original.slice(0,at)+replacement+original.slice(at+line.length),piece=c.minimalEdit(original,field,at,at+line.length,at+replacement.length);edit(location,piece.old,piece.new);}
 at+=line.length+2;
}}
const changed={...doc,lines:doc.lines.slice()};for(const e of edits){const l=changed.locations.find(l=>l.name===e.location),b=c.shift(changed.lines[l.body],5);assert.equal(b.split(e.old).length-1,e.count);changed.lines[l.body]=c.shift(b.replace(e.old,()=>e.new),-5);}
const candidate=c.serialize(changed);assert(c.serialize(c.parse(candidate)).equals(candidate));assert.equal(changed.locations.length,doc.locations.length);
const patch={id,before_sha256:doc.hash,after_sha256:c.hash(candidate),edits};
fs.writeFileSync(__dirname+'/'+id+'.json',JSON.stringify(patch,null,2)+'\n');
const meta={id,status:'CANDIDATE_ONLY_NOT_APPLIED',baselineHash:doc.hash,candidateHash:patch.after_sha256,edits:edits.length,changedLocations:[...new Set(edits.map(e=>e.location))],newLocations:0,newPersistentKeys:0,price:900,consumption:1,negativeAxes:24,ambiguousAxes:ambiguous.length,ambiguousVariants:ambiguous.reduce((n,r)=>n+r.values.length,0),ambiguous:ambiguous.map(r=>({...r,refs:r.refs.map(s=>s.replace('__static_base','#static_base').replace('__dynamic','#dynamic'))})),positiveProtected:['천재','절세미인','명기','건강체질','전투 특성','일반 긍정 적성·성격','통증 내성/피학 성향2','노출 성향2','양성애1','긍정 환경 기호/내성'],protectedStateAndTitles:['virginity','pregnant','parasite','tattoo','wounds','lactation','arena_level','has_ride_win','jo9_versatile','jo9_real_wins','jo9_defiant_resolved','jo9_slave_nature_initialized'],unknownValueRule:'Only explicit recognized values are eligible. Standard signed legacy negative traits require -1; unknown attention union values skip that union axis.',sourceProvenanceLimit:'General trait fields can be innate or acquired by XP without a saved source flag. Protection is by existing achievement/title keys, not reconstructed acquisition history.',workUnchanged:fs.readFileSync(input).equals(raw)};
fs.writeFileSync(__dirname+'/manifest.json',JSON.stringify(meta,null,2)+'\n');
assert(meta.workUnchanged);console.log(JSON.stringify({id,edits:edits.length,changed:meta.changedLocations,negativeAxes:24,ambiguousAxes:ambiguous.length,ambiguousVariants:meta.ambiguousVariants,hash:patch.after_sha256,workUnchanged:true}));
