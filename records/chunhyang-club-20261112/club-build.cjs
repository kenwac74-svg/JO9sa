'use strict';
const t=require('./club-task.cjs'),fs=require('fs'),assert=require('node:assert/strict');
const {tmp,rec,c,qa,write,body,put}=t,raw=fs.readFileSync(tmp+'/baseline.qsp'),d=c.parse(raw),edits=[];
const cr=s=>s.replace(/\r?\n/g,'\r\n').trimEnd();
function edit(n,old,next,id,count=1){const b=body(d,n);assert.equal(b.split(old).length-1,count,'anchor '+n+' '+id);put(d,n,b.replaceAll(old,cr(next)));edits.push({location:n,field:'body',old,new:cr(next),count,patchId:id});}
function append(n,code,id){const b=body(d,n),next=b.trimEnd()+'\r\n! JO9 MOD START '+id+'\r\n'+cr(code)+'\r\n! JO9 MOD END '+id+'\r\n';put(d,n,next);edits.push({location:n,field:'body',old:b,new:next,count:1,patchId:id});}
const cityGate=body(d,'city_menu_form').match(/IF egeya_lose = 0:[\s\S]*?캣파이트 클럽'\)\r\n\s*END/)[0];
edit('city_menu_form',cityGate,"! JO9 MOD START CHUNHYANG_CITY_GATE_20261112\ngs 'jo9_chun_club','city'\n! JO9 MOD END CHUNHYANG_CITY_GATE_20261112",'CHUNHYANG_CITY_GATE_20261112');
edit('interaction_city',"$interaction_type = 'basic'",`
! JO9 MOD START CHUNHYANG_CLUB_ENTRY_20261112
if egeya_lose ! 0 and instr('|10201|102011|102012|102013|102014|102015|102016|102017|102018|','|'+str(interaction_city)+'|') > 0:
 if interaction_city = 102011: gt 'jo9_chun_club','pref'
 if interaction_city = 102012: gt 'jo9_chun_club','supply'
 if interaction_city = 102014: gt 'jo9_chun_club','about'
 gt 'jo9_chun_club','enter'
end
if func('jo9_chun_club','stage') > 1 and (interaction_city = 102019 or interaction_city = 103001): gt 'jo9_chun_club','enter'
if interaction_city >= 103002 and interaction_city <= 103005: jo9_chun_match = 0
! JO9 MOD END CHUNHYANG_CLUB_ENTRY_20261112
$interaction_type = 'basic'`,'CHUNHYANG_CLUB_ENTRY_20261112');
edit('interaction_city',"$враг[1] = $ge",`$враг[1] = $ge
! JO9 MOD START CHUNHYANG_REGULAR_ID_20261112
if func('jo9_chun_club','stage') = 1:
 $ge = 'chun_'+$ge
 $враг[1] = $ge
end
! JO9 MOD END CHUNHYANG_REGULAR_ID_20261112`,'CHUNHYANG_REGULAR_ID_20261112',2);
edit('interaction_city','egeya_lose = 1',"egeya_lose = 1\n! JO9 MOD START CHUNHYANG_FOR_SALE_20261112\njo9_chunhyang['sale_seen'] = 1\njo9_chunhyang['sale_day'] = day\njo9_chunhyang['open'] = 0\n! JO9 MOD END CHUNHYANG_FOR_SALE_20261112",'CHUNHYANG_FOR_SALE_20261112',2);
edit('interaction_city',"gt 'interaction_result_city'\r\n\r\n! JO9 MOD END TRAIT_MERGE_EXCLUSIONS_20261025",`
! JO9 MOD START CHUNHYANG_CLUB_TEXT_20261112
if egeya_lose ! 0 and (interaction_city = 102019 or (interaction_city >= 103001 and interaction_city <= 103005)):
 for jo9_chun_page = 0 to arrsize('$text')-1:
  $text[jo9_chun_page] = replace($text[jo9_chun_page],'에게야','춘향')
 end
 $special_image[1] = 'characters\\3040_chunhyang_title.png'
end
! JO9 MOD END CHUNHYANG_CLUB_TEXT_20261112
gt 'interaction_result_city'

! JO9 MOD END TRAIT_MERGE_EXCLUSIONS_20261025`,'CHUNHYANG_CLUB_TEXT_20261112');
edit('shop_general',"!Common interface for selecting options in different places",`
! JO9 MOD START CHUNHYANG_SAVED_MENU_20261112
if $place = 'chunhyang_battle': gs 'jo9_chun_club','place'
if $place = 'catfightclub' and egeya_lose ! 0 and interaction_city ! 904030 and interaction_city ! 103001: gt 'jo9_chun_club','enter'
! JO9 MOD END CHUNHYANG_SAVED_MENU_20261112
!Common interface for selecting options in different places`,'CHUNHYANG_SAVED_MENU_20261112');
const cat=body(d,'$catfight_fight_start'),start=cat.indexOf('! JO9 MOD START CATFIGHT_ENTRY_LIMIT'),end=cat.indexOf('! JO9 MOD END CATFIGHT_ENTRY_LIMIT')+'! JO9 MOD END CATFIGHT_ENTRY_LIMIT'.length;
edit('$catfight_fight_start',cat.slice(start,end),`
! JO9 MOD START CHUNHYANG_REGULAR_ENTRY_20261112
if jo9_chun_match = 1 and $fight_return = 'Start1': gt 'боевой_интерфейс'
if func('jo9_chun_club','stage') > 1: gt 'jo9_chun_club','enter'
if func('jo9_chun_club','stage') = 1:
 if func('jo9_chun_club','regular_entry') ! 1: gt 'jo9_chun_club','enter'
else
 if slave['catfight_level'] >= 3 or slave_state ! CONST_INT['slave_exist'] or slave['energy'] <= 3 or slave['arena_level'] >= 4:
  interaction_city = 10201
  gt 'interaction_city'
 end
end
! JO9 MOD END CHUNHYANG_REGULAR_ENTRY_20261112`,'CHUNHYANG_REGULAR_ENTRY_20261112');
edit('$catfight_fight_start',"!Load Combat Database","if jo9_chun_match = 1 and mid($враг[1],1,5) ! 'chun_': $враг[1] = 'chun_'+$враг[1]\n!Load Combat Database",'CHUNHYANG_REGULAR_STALE_ID_20261112');
edit('выход_из_боя',"!CALCULATION OF COMBAT RESULTS",`
! JO9 MOD START CHUNHYANG_RESULT_ROUTE_20261112
if $враг[1] = 'chunhyang':
 local jo9_chun_won = iif($итог_боя='победа',1,0)
 gs 'jo9_chun_battle','finish'
 if jo9_chun_won = 1: gt 'jo9_chun_club','win'
 gt 'jo9_chun_club','loss'
end
! JO9 MOD END CHUNHYANG_RESULT_ROUTE_20261112
!CALCULATION OF COMBAT RESULTS`,'CHUNHYANG_RESULT_ROUTE_20261112');
edit('выход_из_боя',"slave['catfight_level'] += 1",`
! JO9 MOD START CHUNHYANG_REGULAR_WINS_20261112
if jo9_chun_match = 1:
 slave['jo9_chun_wins'] += 1
else
 slave['catfight_level'] += 1
end
! JO9 MOD END CHUNHYANG_REGULAR_WINS_20261112`,'CHUNHYANG_REGULAR_WINS_20261112');
edit('выход_из_боя',"if slave['catfight_level'] = 1: jo9_catfight_fame = 10\r\n        if slave['catfight_level'] = 2 or slave['catfight_level'] = 3: jo9_catfight_fame = 3",`
if jo9_chun_match = 1:
 if slave['jo9_chun_wins'] = 1: jo9_catfight_fame = 10
 if slave['jo9_chun_wins'] > 1: jo9_catfight_fame = 3
else
 if slave['catfight_level'] = 1: jo9_catfight_fame = 10
 if slave['catfight_level'] = 2 or slave['catfight_level'] = 3: jo9_catfight_fame = 3
end`,'CHUNHYANG_REGULAR_FAME_20261112');
edit('начать_бой',"gs 'боевое_меню'\r\ngt 'боевой_интерфейс'","! JO9 MOD START CHUNHYANG_BATTLE_INIT_20261112\ngs 'jo9_chun_battle','init'\n! JO9 MOD END CHUNHYANG_BATTLE_INIT_20261112\ngs 'боевое_меню'\ngt 'боевой_интерфейс'",'CHUNHYANG_BATTLE_INIT_20261112');
edit('конец_раунда','!make damage and create status effect',"! JO9 MOD START CHUNHYANG_EVADE_20261112\ngs 'jo9_chun_battle','before'\n! JO9 MOD END CHUNHYANG_EVADE_20261112\n!make damage and create status effect",'CHUNHYANG_EVADE_20261112');
edit('конец_раунда','i = 0\r\n:loop1',"! JO9 MOD START CHUNHYANG_AI_ACTION_20261112\ngs 'jo9_chun_battle','after_player'\n! JO9 MOD END CHUNHYANG_AI_ACTION_20261112\ni = 0\n:loop1",'CHUNHYANG_AI_ACTION_20261112');
edit('$combat_variable_reset',"!Combat variable reset","! JO9 MOD START CHUNHYANG_BATTLE_RESET_20261112\ngs 'jo9_chun_battle','reset'\n! JO9 MOD END CHUNHYANG_BATTLE_RESET_20261112\n!Combat variable reset",'CHUNHYANG_BATTLE_RESET_20261112');
let mob=`
$название_моба['chunhyang'] = '춘향'
$аватара_моба['chunhyang'] = 'content/pic/girls/face/3040_brown_long_milf.png'
$силуэт_моба['chunhyang'] = 'content/pic/characters/3040_chunhyang_title.png'
$описание_моба['chunhyang'] = '캣파이트 클럽의 새 주인, 산도 춘향.'
$склонение_моб['chunhyang'] = '춘향'
$склонение_моба['chunhyang'] = '춘향'
$склонение_мобу['chunhyang'] = '춘향'
$класс_моба['chunhyang'] = 'элитный'
базовое_здоровье['chunhyang'] = 200
базовая_выносливость['chunhyang'] = 300
базовый_дух['chunhyang'] = 200
базовый_вред['chunhyang'] = 15
$интеллект['chunhyang'] = 'искусственный_идиот'
хрупкий['chunhyang'] = 0
тонкое_тело['chunhyang'] = 0
бессмертный['chunhyang'] = 0
безустали['chunhyang'] = 0
бесстрашный['chunhyang'] = 1
$смерть['chunhyang'] = '춘향이 무릎을 꿇었다. 결투가 끝났다.'
$отключка['chunhyang'] = '춘향이 더는 무기를 들지 못한다. 결투가 끝났다.'
$бегство['chunhyang'] = '춘향이 패배를 인정했다.'
`;
for(const damage of ['колющий','рубящий','дробящий','огонь','холод','молния','свет','тьма','серебро','холодное_железо','психический'])mob+="модификатор_"+damage+"['chunhyang'] = "+(['огонь','холод'].includes(damage)?5:0)+"\n";
for(let n=1;n<=3;n++)mob+="$атака_"+n+"_тип['chunhyang'] = '"+['точная','быстрая','сильная'][n-1]+"'\n$атака_"+n+"_тип_вреда['chunhyang'] = '"+(n===3?'дробящий':'рубящий')+"'\n$атака_"+n+"_текст['chunhyang'] = '"+['춘향이 대검으로 빈틈을 찌른다.','춘향의 검이 빠르게 궤적을 그린다.','춘향이 철퇴손을 힘껏 내지른다.'][n-1]+"'\n$атака_"+n+"_штраф['chunhyang'] = ''\n$атака_"+n+"_бонус['chunhyang'] = ''\nатака_"+n+"_длительность['chunhyang'] = 0\n";
const db=body(d,'#противники');for(let n=1;n<=3;n++){
 const id='gladiatrix'+n,start=db.indexOf("$название_моба['"+id+"']"),last="модификатор_психический['"+id+"']";
 const stop=db.indexOf('\r\n',db.indexOf(last,start));assert(start>=0&&stop>start);let clone=db.slice(start,stop).split(/\r?\n/).filter(line=>!line.trimStart().startsWith('! JO9 MOD ')).join('\n').replaceAll("['"+id+"']","['chun_"+id+"']").replaceAll('[에게야]','[춘향]');
 for(const key of ['базовое_здоровье','базовая_выносливость','базовый_дух','базовый_вред']){const re=new RegExp('^'+key+"\\['chun_"+id+"'\\] = (\\d+)",'m');assert(re.test(clone));clone=clone.replace(re,(_,v)=>key+"['chun_"+id+"'] = "+(+v*2));}
 clone=clone.replace(/^(базовый_вред_суператаки_\d+\['chun_gladiatrix\d'\] = )(\d+)/gm,(_,prefix,value)=>prefix+(+value*2));
 mob+='\n'+clone+'\n';
}
append('#противники',mob,'CHUNHYANG_MOB_20261112');
const added=['jo9_chun_club','jo9_chun_battle'].map((name,i)=>({name,desc:'',body:cr(fs.readFileSync(i?'chun-battle.qsptxt':'chun-club.qsptxt','utf8')),actions:[]}));
for(const x of added){assert(!d.locations.some(l=>l.name===x.name));const lines=d.lines.slice(0,-1);lines[3]=c.shift(String(c.parse(c.serialize(d)).locations.length+1),-5);lines.push(c.shift(x.name,-5),c.shift('',-5),c.shift(x.body,-5),c.shift('0',-5),'');d.lines=lines;d.locations=c.parse(c.serialize(d)).locations;}
const candidate=c.serialize(d);qa.inspectWorld(candidate);const patch={id:'2026-11-12_chunhyang_successor_battle',status:'APPROVED',description:'User-confirmed Chunhyang club succession, fixed-stat boss duel with exact R/periodic finisher/dodge/3-or-6 balms, CM settlement once, protected acquisition and closure. Preserve Egeya phase and other fights.',before_sha256:c.hash(raw),after_sha256:c.hash(candidate),add_locations:added,edits};write(tmp+'/mods/'+patch.id+'.json',patch);fs.writeFileSync(tmp+'/candidate.qsp',candidate);write(rec+'/prepared.json',{before:patch.before_sha256,after:patch.after_sha256,changed:[...new Set(edits.map(x=>x.location))],added:added.map(x=>x.name)});console.log(JSON.stringify({candidate:patch.after_sha256,locations:c.parse(candidate).locations.length,edits:edits.length}));
