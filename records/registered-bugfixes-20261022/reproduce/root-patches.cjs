'use strict';
const fs=require('node:fs'),path=require('node:path');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const work='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const out='G:/Codex/tmp/jo9-bugfixes-20261022/root';
const raw=fs.readFileSync(work),doc=core.parse(raw);
if(core.hash(raw)!=='c6701e3ab130b1a762d0b1a523d52cd53cee846f71c3d7899a4c369389aa853d')throw Error('WORK changed');
const get=n=>core.shift(doc.lines[doc.locations.find(l=>l.name===n).body],5);
const wrap=(id,s)=>'! JO9 MOD START '+id+' | 2026-10-22_registered_bugfixes\r\n'+s+'\r\n! JO9 MOD END '+id;
const edits=[];
function edit(location,old,value,count=1){const body=get(location);if(body.split(old).length-1!==count)throw Error('Count '+location+' '+old);edits.push({location,field:'body',old,new:value,count});}
function line(location,needle,fn,id,count=1){const lines=get(location).split('\r\n').filter(s=>s.includes(needle)&&!s.trimStart().startsWith('!'));if(lines.length!==count||new Set(lines).size!==1)throw Error('Line '+needle);edit(location,lines[0],wrap(id,fn(lines[0])),count);}
// Use the event's existing dedicated menu. Combat stats/rewards are unchanged.
edit('interaction_city',"IF interaction_city = 10384:\r\n $fight_return  = 'city_menu_form'\r\n skip_to = 14",wrap('GRINCH_DEDICATED_MENU',"IF interaction_city = 10384:\r\n $fight_return  = 'city_menu_form'\r\n skip_to = 10384"));
line('interaction_city'," $sp_text[14] = '[그린치]",s=>s.replace('$sp_text[14]','$sp_text[10384]'),'GRINCH_INTRO_INDEX');
const savedRepair=wrap('GRINCH_SAVED_MENU',[
"! Repair only the old pre-combat Grinch page; do not change weapon selection or battle state.",
"if $place = 'Grinch_battle' and interaction_city = 10384 and get_weapon = 0:",
" if skip_to = 14: skip_to = 10384",
" if sp_txt = 14: sp_txt = 10384",
" $display_options[10384] = $edge_of_mists[10384]",
" if $sp_text[10384] = '': $sp_text[10384] = $sp_text[14]",
"end"].join('\r\n'));
edit('shop_general','!Common interface for selecting options in different places',savedRepair+'\r\n!Common interface for selecting options in different places');
const loadRepair=wrap('GRINCH_SAVED_MENU_LOAD',"! Re-render only a loaded obsolete Grinch pre-combat page.\r\nif $curloc = 'shop_general' and $place = 'Grinch_battle' and interaction_city = 10384 and get_weapon = 0 and (skip_to = 14 or sp_txt = 14): gt 'shop_general'");
edit('$ongload',"if $curloc = 'main_screen': gt 'menu_form'",loadRepair+"\r\nif $curloc = 'main_screen': gt 'menu_form'");
line('menu_form',"'Dog mating'",s=>s.replace("'Dog mating', 'You don’t own a dog'","'개 교미 불가', '개를 기르고 있지 않다.'"),'CHOICE_KO_DOG');
line('menu_form',"'Spider mating'",s=>s.replace("'Spider mating', 'You don’t have access to a spider'","'거미 교미 불가', '이용할 수 있는 거미가 없다.'"),'CHOICE_KO_SPIDER');
line('menu_form',"'Sea Tentacle mating'",s=>s.replace("'Sea Tentacle mating', 'You don’t have access to a sea tentacle'","'바다 촉수 교미 불가', '이용할 수 있는 바다 촉수 생물이 없다.'"),'CHOICE_KO_TENTACLE');
line('menu_form','<<$slave_name>> example of punishment',s=>s.replace('<<$slave_name>> example of punishment','<<$slave_name>>에게 다른 노예가 처벌받는 모습을 보여 준다.'),'CHOICE_KO_PUNISHMENT_HINT');
line('warning',"act '1 agree'",s=>s.replace("'1 agree'","'동의합니다'"),'CHOICE_KO_WARNING');
line('teach_screen','>Vaginal Sex</font>',s=>s.replace('>Vaginal Sex</font>','>질 섹스</font>'),'CHOICE_KO_MAX_SKILL');
line('teach_screen','>Dance Lesson</font>',s=>s.replace('>Dance Lesson</font>','>무용 수업</font>'),'CHOICE_KO_DANCE');
edit('#quest_base','>Back</a>','>뒤로</a>',2);
line('#dynamic','input (\'Give your character a name.',s=>s.replace('Give your character a name. Please try to keep this shorter than 14 characters.','주인공의 이름을 입력하세요. 이름은 14자 미만을 권장합니다.'),'CHOICE_KO_NAME_PROMPT');
line('$menu','>Пить кровь</font>',s=>s.replace('>Пить кровь</font>','>피를 마신다</font>'),'CHOICE_KO_VAMPIRE',4);
line('debug_info','노예 훈련을 위한 Tip',s=>s.replace('노예 훈련을 위한 Tip','노예 훈련 도움말'),'CHOICE_KO_SLAVE_HELP',6);
line('debug_info_assistant','노예 훈련을 위한 Tip',s=>s.replace('노예 훈련을 위한 Tip','노예 훈련 도움말'),'CHOICE_KO_ASSISTANT_HELP');
edit('#quest_base','전공자를 만드는 Tip','전공자를 만드는 요령');
const questFirst=get('#quest_base').split('\r\n')[0];
edit('#quest_base',questFirst,wrap('CHOICE_KO_QUEST_TEXT','! Translate visible labels without splitting continued string expressions.')+'\r\n'+questFirst);
// A short replacement like >Back</a> has many already-Korean peers after editing.
// Record this location as one exact body edit so apply_mods can prove idempotence.
const questOld=get('#quest_base');let questNew=questOld;
for(const e of edits.filter(e=>e.location==='#quest_base'))questNew=questNew.split(e.old).join(e.new);
for(let i=edits.length-1;i>=0;i--)if(edits[i].location==='#quest_base')edits.splice(i,1);
edits.push({location:'#quest_base',field:'body',old:questOld,new:questNew,count:1});
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'edits.json'),JSON.stringify(edits,null,2));
for(const e of edits){const l=doc.locations.find(l=>l.name===e.location),old=core.shift(doc.lines[l.body],5);doc.lines[l.body]=core.shift(old.split(e.old).join(e.new),-5);}
const candidate=core.serialize(doc);qa.inspectWorld(candidate);fs.writeFileSync(path.join(out,'candidate.qsp'),candidate);
console.log(JSON.stringify({out,edits:edits.length,before:core.hash(raw),after:core.hash(candidate),world:qa.inspectWorld(candidate)}));
