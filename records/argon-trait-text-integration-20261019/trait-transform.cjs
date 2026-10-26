'use strict';
// Workspace-only transform. The caller supplies decoded location bodies.
// All added displayed description text is taken unchanged from Argon's delivery.
const fs=require('node:fs'),path=require('node:path');
const mapping=JSON.parse(fs.readFileSync(path.join(__dirname,'trait-mapping.json'),'utf8'));
const ids=['oral_pref','gag_reflex','anal_pref','anal_averse','defiant','innate_mute','tongue_loss'];
const labels=['구강 선호','구역반사','항문 선호','항문 기피','불복종','선천적 발화 불가','혀 손실'];
const fields=['oral_affinity','jo9_gag_reflex','anal_affinity','anal_affinity','defiant','jo9_voice_trait','jo9_voice_trait'];
const values=[1,1,1,-1,1,1,2];
const quote=s=>"'"+s.replaceAll("'","''")+"'";
const block=(id,body)=>`! JO9 MOD START ${id} | 2026-10-19_argon_trait_text_integration\n${body}\n! JO9 MOD END ${id}`;
function transformLocations(input){
 const result=new Map([...input].map(([name,body])=>[name,body.replace(/\r\n/g,'\n')]));
 const edits=[];
 function replace(location,old,next,id,why){
  const body=result.get(location);if(body===undefined)throw Error('Missing location '+location);
  const count=body.split(old).length-1;if(count!==1)throw Error(`${location}/${id}: expected one anchor; got ${count}`);
  if(body.includes('JO9 MOD START '+id))throw Error('Already applied '+id);
  const replacement=block(id,next);result.set(location,body.replace(old,()=>replacement));
  edits.push({location,patchId:id,before:old,after:replacement,why,count:1});
 }
 let b=result.get('jo9_traits');
 if(b.includes('ARGON_RESTORED_REGISTRY'))throw Error('Already applied traits');
 const describe=ids.map((id,i)=>` if $args[1] = ${quote(id)}: msg ${quote(mapping.traits[i].argonDefinition.text)}`).join('\n');
 replace('jo9_traits',"if $args[0] = 'describe':","if $args[0] = 'describe':\n"+describe,'ARGON_RESTORED_DESCRIPTIONS','아르곤의 원문 그대로 7종 설명 등록; 기존 한국어 설명 교체 없음');
 const list=ids.map((id,i)=>{
  const cond=i===0?"dynslave['oral_affinity'] > 0":i===2?"dynslave['anal_affinity'] > 0":i===3?"dynslave['anal_affinity'] < 0":`dynslave[${quote(fields[i])}] = ${values[i]}`;
  return `  if ${cond}: $result += '<a href="EXEC: gs ''jo9_traits'', ''describe'', ''${id}''">${labels[i]}</a><br>'`;
 }).join('\n');
 const listAnchor=result.get('jo9_traits').split('\n').find(row=>row.startsWith("  if dynslave['jo9_ambition'] = 1 and dynslave['jo9_ambition_known'] = 1:"));
 if(!listAnchor)throw Error('Missing original list anchor');
 replace('jo9_traits',listAnchor,list+'\n'+listAnchor,'ARGON_RESTORED_LIST','특성 목록에 보유한 7종을 즉시 표시');
 // QSP dynamic owns a local RESULT scope. Explicitly return the string instead
 // of discarding it; this also preserves existing registry traits in the list.
 b=result.get('jo9_traits');
 const ls=b.indexOf("if $args[0] = 'list':"),le=b.indexOf("if $args[0] = 'generate':",ls);
 if(ls<0||le<0)throw Error('List branch boundaries missing');
 const listBefore=b.slice(ls,le).replace(/\n$/,'');
 const listAfter=listBefore.replace(" $result = ''\n dynamic $replace({",()=>" $result = $dyneval($replace({\n  $result = ''").replace(" }, 'dynslave', $args[1])",()=>" }, 'dynslave', $args[1]))");
 if(listAfter===listBefore||!listAfter.includes('$dyneval'))throw Error('List return rewrite failed');
 replace('jo9_traits',listBefore,listAfter,'ARGON_RESTORED_LIST_RETURN','원래 dynamic 내부 결과가 버려지는 문제를 실제 문자열 반환으로 수정; 기존 등록 특성도 함께 표시');
 const generate=[
 " stock['oral_affinity'] = 0", " if rand(1,100) <= 10: stock['oral_affinity'] = 1",
 " stock['jo9_gag_reflex'] = 0", " if rand(1,100) <= 10: stock['jo9_gag_reflex'] = 1",
 " stock['anal_affinity'] = 0", " jo9_trait_registry_roll = rand(1,100)",
 " if jo9_trait_registry_roll <= 10: stock['anal_affinity'] = 1", " if jo9_trait_registry_roll > 10 and jo9_trait_registry_roll <= 20: stock['anal_affinity'] = -1",
 " stock['defiant'] = 0", " if rand(1,100) <= 10: stock['defiant'] = 1",
 " stock['jo9_voice_trait'] = 0", " jo9_trait_registry_roll = rand(1,100)",
 " if jo9_trait_registry_roll = 1: stock['jo9_voice_trait'] = 1", " if jo9_trait_registry_roll = 2: stock['jo9_voice_trait'] = 2",
 " stock['jo9_oral_xp_credit'] = 0", " stock['jo9_anal_xp_credit'] = 0", " stock['jo9_defiant_resolved'] = 0"
 ].join('\n');
 replace('jo9_traits'," stock['jo9_ambition'] = 0",generate+"\n stock['jo9_ambition'] = 0",'ARGON_RESTORED_GENERATE','기존 새 무작위 인물 생성 호출에서만 추첨; 기존 세이브 재추첨 없음');
 const reset=[
 "  if $args[0] = 'oral_affinity': dynslave['jo9_oral_xp_credit'] = 0",
 "  if $args[0] = 'anal_affinity': dynslave['jo9_anal_xp_credit'] = 0",
 "  if $args[0] = 'defiant': dynslave['jo9_defiant_resolved'] = 0"
 ].join('\n');
 replace('jo9_traits',"  if $args[0] = 'jo9_ambition':",reset+"\n  if $args[0] = 'jo9_ambition':",'ARGON_RESTORED_EDIT_RESET','편집 시 해당 경험치 나머지와 불복종 해소 기록만 초기화');
 const editor=ids.map((id,i)=>{
  const col=i<4?'$setting_display':'$setting_display_r';
  return `  ${col} += '<div id="under_cheats"><a href="EXEC: gs ''jo9_traits'', ''edit'', ''dynslave'', ''${fields[i]}'', ${values[i]} & gt ''menu_form''">${labels[i]}: '\n  if dynslave[${quote(fields[i])}] = ${values[i]}: ${col} += '있음'\n  if dynslave[${quote(fields[i])}] ! ${values[i]}: ${col} += '없음'\n  ${col} += '</a></div>'`;
 }).join('\n');
 replace('jo9_traits',"  $setting_display += '<div id=\"under_cheats\"><a href=\"EXEC: gs ''jo9_traits'', ''edit'', ''dynslave'', ''jo9_ambition'', 1 & gt ''menu_form''\">야심가: '",editor+"\n  $setting_display += '<div id=\"under_cheats\"><a href=\"EXEC: gs ''jo9_traits'', ''edit'', ''dynslave'', ''jo9_ambition'', 1 & gt ''menu_form''\">야심가: '",'ARGON_RESTORED_EDITOR','기존 신규 특성 편집기에 7개 선택을 두 열로 추가');
 const effectCode=`
if $args[0] = 'restored_xp' or $args[0] = 'restored_acceptance':
 local $jo9_rt_subject = $lcase($args[2])
 if instr($jo9_rt_subject, '[') > 0: $jo9_rt_subject = $mid($jo9_rt_subject, instr($jo9_rt_subject, '[') + 1, len($jo9_rt_subject))
 $jo9_rt_subject = $replace($replace($replace($jo9_rt_subject, ']', ''), '"', ''), "'", '')
 if $args[0] = 'restored_xp':
  result = dyneval($replace({
   result = args[1]
   if args[1] > 0:
    local $jo9_rt_credit = ''
    if instr('|oral|sub_kiss|sub_tongue|sub_bj|sub_dt|sub_asslik|', '|' + $args[0] + '|') > 0 and jo9restored['oral_affinity'] > 0: $jo9_rt_credit = 'jo9_oral_xp_credit'
    if instr('|sub_anal|anal_stretch|', '|' + $args[0] + '|') > 0 and jo9restored['anal_affinity'] > 0: $jo9_rt_credit = 'jo9_anal_xp_credit'
    if $jo9_rt_credit ! '':
     jo9restored[$jo9_rt_credit] += args[1]
     result += jo9restored[$jo9_rt_credit] / 2
     jo9restored[$jo9_rt_credit] = jo9restored[$jo9_rt_credit] mod 2
    end
   end
  }, 'jo9restored', $args[1]), $jo9_rt_subject, args[3])
 else
  result = dyneval($replace({
   result = 0
   if instr('|oral|sub_kiss|sub_tongue|sub_bj|sub_dt|sub_asslik|', '|' + $args[0] + '|') > 0:
    if jo9restored['oral_affinity'] > 0: result += 2
    if instr('|sub_bj|sub_dt|', '|' + $args[0] + '|') > 0 and jo9restored['jo9_gag_reflex'] = 1: result -= 2
   end
   if instr('|sub_anal|anal_stretch|', '|' + $args[0] + '|') > 0:
    if jo9restored['anal_affinity'] > 0: result += 2
    if jo9restored['anal_affinity'] < 0: result -= 2
   end
  }, 'jo9restored', $args[1]), $jo9_rt_subject)
 end
end
if $args[0] = 'restored_refresh':
 dynamic $replace({
  if jo9restored['defiant'] = 1:
   if jo9restored['pride'] = 0 or $jo9restored_psy_status = 'broken':
    jo9restored['defiant'] = 0
    jo9restored['jo9_defiant_resolved'] = 1
   elseif jo9restored_rate['moral'] > 0:
    jo9restored_rate['moral'] = 0
   end
  end
 }, 'jo9restored', $args[1])
end`;
 const old=result.get('jo9_traits');result.set('jo9_traits',old+'\n'+block('ARGON_RESTORED_EFFECTS',effectCode));
 edits.push({location:'jo9_traits',patchId:'ARGON_RESTORED_EFFECTS',before:'',after:block('ARGON_RESTORED_EFFECTS',effectCode),why:'역할 분리 경험치·수용 보정·불복종 효과 함수',count:1});
 const seeds=[
 "stock['oral_affinity'] = seed_oral_affinity[stock_type]",
 "stock['anal_affinity'] = seed_anal_affinity[stock_type]",
 "stock['defiant'] = seed_defiant[stock_type]",
 "stock['jo9_gag_reflex'] = seed_jo9_gag_reflex[stock_type]",
 "stock['jo9_voice_trait'] = seed_jo9_voice_trait[stock_type]",
 "stock['jo9_oral_xp_credit'] = 0", "stock['jo9_anal_xp_credit'] = 0", "stock['jo9_defiant_resolved'] = 0"
 ].join('\n');
 replace('get_stock_seed',"stock['sport_affinity'] = seed_sport_affinity[stock_type]",seeds+"\nstock['sport_affinity'] = seed_sport_affinity[stock_type]",'ARGON_RESTORED_SEED','기존 고정 seed 설정 복원 및 새 필드 복사; 음수 oral도 그대로 보존');
 replace('get_special_assistant_quest','assistant["oral_affinity"] = seed_oral_affinity[slave_type]\nassistant["anal_affinity"] = seed_anal_affinity[slave_type]',
 'assistant["oral_affinity"] = seed_oral_affinity[assistant_type]\nassistant["anal_affinity"] = seed_anal_affinity[assistant_type]\nassistant["jo9_gag_reflex"] = seed_jo9_gag_reflex[assistant_type]\nassistant["jo9_voice_trait"] = seed_jo9_voice_trait[assistant_type]\nassistant["jo9_oral_xp_credit"] = 0\nassistant["jo9_anal_xp_credit"] = 0\nassistant["jo9_defiant_resolved"] = 0',
 'ARGON_RESTORED_ASSISTANT_SEED','같은 특수 조수의 템플릿 번호로 해당 특성 및 새 필드를 복사');
 replace('get_special_assistant_quest','assistant["defiant"] = seed_defiant[slave_type]','assistant["defiant"] = seed_defiant[assistant_type]','ARGON_RESTORED_ASSISTANT_DEFIANT','옛 복사 줄의 대상 번호를 해당 조수로 수정');
 replace('get_special_assistant_quest','assistant["oral_affinity_revealed"] = seed_oral_affinity_revealed[slave_type]\nassistant["anal_affinity_revealed"] = seed_anal_affinity_revealed[slave_type]',
 'assistant["oral_affinity_revealed"] = seed_oral_affinity_revealed[assistant_type]\nassistant["anal_affinity_revealed"] = seed_anal_affinity_revealed[assistant_type]',
 'ARGON_RESTORED_ASSISTANT_REVEALED','옛 발견 상태 복사도 같은 조수의 seed를 사용');
 replace('get_special_assistant_quest','assistant["defiant_revealed"] = seed_defiant_revealed[slave_type]','assistant["defiant_revealed"] = seed_defiant_revealed[assistant_type]','ARGON_RESTORED_ASSISTANT_DEFIANT_REVEALED','옛 발견 상태의 인물 참조 일치');
 const pre="\t\t!Discrete, field independence (stats - range and interpretation of rate variable depends on current primary value)";
 replace('#static_base',pre,"\t\tgs 'jo9_traits', 'restored_refresh', 'dynslave'\n"+pre,'ARGON_RESTORED_DEFIANT_BEFORE','기존 레이트 계산 전 양의 헌신 증가 억제; 보유 헌신과 음수 변화는 유지');
 const post="\t\t!for master moodlets";
 replace('#static_base',post,"\t\tgs 'jo9_traits', 'restored_refresh', 'dynslave'\n"+post,'ARGON_RESTORED_DEFIANT_AFTER','기존 자존심·정신 상태 계산 후 해소 조건을 영구 기록');
 for(const [interaction,minimum]of[[227581,2],[227582,3],[227583,3]]){
  const location='interaction_city',body=result.get(location),scope=`IF interaction_city = ${interaction}:`;
  const start=body.indexOf(scope),finish=body.indexOf('\nEND',start);
  const oldLine=` if slave["moral"] < ${minimum}: slave["moral"] = ${minimum}`;
  const index=body.indexOf(oldLine,start);
  if(start<0||finish<0||index<start||index>finish)throw Error('Direct moral scope '+interaction);
  const nextLine=` if slave["moral"] < ${minimum} and (slave['defiant'] ! 1 or slave['pride'] = 0 or $slave_psy_status = 'broken'): slave["moral"] = ${minimum}`;
  const id='ARGON_RESTORED_DIRECT_MORAL_'+interaction,replacement=block(id,nextLine);
  result.set(location,body.slice(0,index)+replacement+body.slice(index+oldLine.length));
  edits.push({location,patchId:id,before:oldLine,after:replacement,scope,why:'기존 유료 교육의 직접 헌신 증가도 불복종 조건을 따름; 자존심0 완료 서비스와 초기 생성은 유지',count:1});
 }
 const ac="\t\t\tinteraction_dynslave['sex_acceptance'] /= 2 &! final value is in range [-30, +48] but usually single digits";
 replace('#dynamic',ac,ac+"\n\t\t\tinteraction_dynslave['sex_acceptance'] += func('jo9_traits', 'restored_acceptance', 'dynslave', $subskill)",'ARGON_RESTORED_ACCEPTANCE','현재 행동의 실제 기술로만 수용 보정; 기존 stimulating/orgastic 분기 안에서 적용');
 const primary="     jo9_learning_gain = func('jo9_traits_personality', 'xp', 'dynslave', 'subskill', func('jo9_learning_xp', (jo9_learning_gain), dynslave['jo9_learning_trait'], 'subskill'))";
 replace('#dynamic',primary,primary+"\n     jo9_learning_gain = func('jo9_traits', 'restored_xp', 'dynslave', $subskill, jo9_learning_gain)",'ARGON_RESTORED_PRIMARY_XP','기존 주 기술 경험치에 실제 $subskill로 한 번만 +50% 적용');
 const sec="func(''jo9_traits_personality'', ''xp'', ''dynslave'', ''subskill'', func(''jo9_learning_xp'', (1), dynslave[''jo9_learning_trait''], ''subskill''))";
 const secNext="func(''jo9_traits'', ''restored_xp'', ''dynslave'', $subskill_two, "+sec+")";
 b=result.get('#dynamic');let secCount=b.split(sec).length-1;
 if(secCount!==2)throw Error('Expected 2 secondary XP hooks, got '+secCount);
 const secLines=b.split('\n');let n=0;
 for(let i=0;i<secLines.length;i++)if(secLines[i].includes(sec)){
  const before=secLines[i],after=before.replace(sec,()=>secNext),id='ARGON_RESTORED_SECONDARY_XP_'+(++n);
  secLines[i]=block(id,after);edits.push({location:'#dynamic',patchId:id,before,after:secLines[i],why:'실제 보조 기술 $subskill_two에 한 번만 보정',count:1});
 }
 result.set('#dynamic',secLines.join('\n'));
 // Ordinary skill-specific gain sites include daily rules and the separate sex screen.
 // Do not match the generic lesson wrappers already handled above.
 const gainRe=/func\('jo9_learning_xp', \(([^\r\n]*?)\), ([A-Za-z_]\w*)\['jo9_learning_trait'\], '(oral|sub_kiss|sub_tongue|sub_bj|sub_dt|sub_asslik|sub_anal|anal_stretch)'\)/g;
 const direct=[];
 for(const[location,body]of result){
  if(location==='jo9_traits'||location.endsWith('_woman'))continue;
  let lineNo=0,changed=false;
  const rows=body.split('\n').map(row=>{
   lineNo++;if(row.trimStart().startsWith('!'))return row;
   const calls=[...row.matchAll(gainRe)];if(!calls.length)return row;
   const after=row.replace(gainRe,(call,amount,role,skill)=>`func('jo9_traits', 'restored_xp', '${role}', '${skill}', ${call})`);
   const id='ARGON_RESTORED_DIRECT_XP_'+String(direct.length+1).padStart(3,'0');
   const item={location,patchId:id,line:lineNo,before:row,after:block(id,after),why:'역할과 기술이 명시된 기존 경험치 지급을 한 번 보정',count:1,calls:calls.length};
   direct.push(item);edits.push(item);changed=true;return item.after;
  });
  if(changed)result.set(location,rows.join('\n'));
 }
 if(direct.length===0)throw Error('No direct XP sites found');
 return{locations:result,edits,summary:{traits:7,newLocations:0,descriptionOverwrites:0,directXpSites:direct.length,directXpCalls:direct.reduce((n,x)=>n+x.calls,0),secondaryXpSites:2,fields:[...new Set(fields)],persistentAddedFields:['jo9_gag_reflex','jo9_voice_trait','jo9_oral_xp_credit','jo9_anal_xp_credit','jo9_defiant_resolved']}};
}
module.exports={transformLocations,ids,labels,fields,values};
