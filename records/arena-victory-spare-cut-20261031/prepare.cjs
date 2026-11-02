'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',F='G:/somi/Jack O Nine Tails v2.4 Kor_Full/game',T='G:/Codex/tmp/arena-victory-spare-cut-20261031',B='G:/somi/JO9_work_backups/arena-victory-spare-cut-20261031',c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),id='2026-10-31_arena_victory_spare_cut';
const raw=fs.readFileSync(W+'/jack.qsp'),before=c.hash(raw);a.equal(before,'90af7f9115544ef1ec83048212ee283ba00f78119b9522a58c122a2ab1300617');a.deepEqual(raw,fs.readFileSync(F+'/jack.qsp'));const d=c.parse(raw);a.deepEqual(c.serialize(d),raw);
const source=W+'/content/modworkpic/승리의 검투사와 콜로세움_795x596.png',image=fs.readFileSync(source),imageSha='639f8c50ee7920376d1aa6e328596c7e79f8e6f39923487514ea3e1d78b0d525',relative='content/pic/scene/arena_victory_spare.png';a.equal(c.hash(image),imageSha);a.equal(image.readUInt32BE(16),795);a.equal(image.readUInt32BE(20),596);const targets=[W+'/'+relative,F+'/'+relative,R+'/resources/new/'+relative];for(const f of targets)a(!fs.existsSync(f),f);
const edits=[],cr=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+s.replaceAll("'","''")+"'",wrap=(label,s)=>'! JO9 MOD START '+label+'\n'+s+'\n! JO9 MOD END '+label;function body(n){return c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);}function edit(location,old,next){old=cr(old);next=cr(next);const b=body(location);a.equal(b.split(old).length,2,location);d.lines[d.locations.find(l=>l.name===location).body]=c.shift(b.replace(old,next),-5);edits.push({location,field:'body',old,new:next,count:1});}
const condition="jo9_fate['mode'] = 2 and jo9_fate['phase'] = 3 and jo9_fate['choice'] = 2",b=body('interaction_city'),start=b.indexOf('if interaction_city = 1294:'),end=b.indexOf('if interaction_city = 1295:',start),old=b.slice(start,end).split('\r\n').find(s=>s.trim().startsWith('$text[1] = '));a(old);const literal=old.match(/\$text\[1\] = '(.*)'$/)[1],suffix=literal.slice(literal.indexOf('<br><br>'));a(suffix.startsWith('<br><br>'));
const prose='당신이 상대를 살려주겠다는 뜻을 전하자 <<$slave_name>>(은)는 무기를 거두고 물러섰다. 대기하던 일꾼들이 쓰러진 상대를 들것에 옮겨 경기장 밖으로 나갔다. 관중석의 함성이 채 잦아들지 않은 가운데, 그녀는 고개를 들어 당신이 있는 쪽을 바라보았다. 오늘의 승리는 그녀의 이름과 당신의 명예를 관중들의 기억에 남겼다.';
edit('interaction_city',old,old+'\n'+wrap('ARENA_SPARE_VICTORY_RESULT_20261031',` if ${condition}:
  $bg_path = ''
  $special_image_full[1] = '${relative}'
  $special_image_full[2] = $special_image_full[1]
  $text[1] = ${q(prose+suffix)}
 end`));
const header="if interaction_city = 1295:\r\n\t$place = 'colosseum_arena'\r\n\tcity_form = 1\r\n\t$return_lock = 'city_menu_form'";edit('interaction_city',header,header+'\n'+wrap('ARENA_SPARE_CHAMPION_FIRST_CUT_20261031',` if ${condition}:
  $bg_path = ''
  $special_image_full[1] = '${relative}'
 end`));
const anchor='! JO9 MOD END ARENA_SLAVE_EXECUTION_INSTRUCTION_20261031';edit('jo9_battle_fate',anchor,anchor+'\n'+wrap('ARENA_SLAVE_SPARE_INSTRUCTION_20261031',`  if jo9_fate['mode'] = 2 and $place = 'colosseum_arena' and $fight_return = 'Start' and jo9_fate['choice'] = 2:
   $jo9_bf_message = '당신의 신호에 승리한 <<$slave_name>>(이)가 무기를 거두고 물러섰다. 일꾼들이 쓰러진 상대를 들것에 옮긴다.'
  end`));
const bytes=c.serialize(d);qa.inspectWorld(bytes);fs.mkdirSync(T+'/mods',{recursive:true});fs.mkdirSync(B,{recursive:true});a(!fs.existsSync(B+'/before.qsp'));fs.writeFileSync(B+'/before.qsp',raw);const mod={id,description:'Formal arena spared-opponent victory: user cut and completed victory prose in 1294; first-page cut only in champion1295, actor-correct spare confirmation. Existing numeric effects/save schema unchanged.',before_sha256:before,after_sha256:c.hash(bytes),edits};fs.writeFileSync(T+'/mods/'+id+'.json',JSON.stringify(mod,null,2)+'\n');fs.writeFileSync(T+'/candidate.qsp',bytes);
for(const target of targets){fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target,fs.constants.COPYFILE_EXCL);a.equal(c.hash(fs.readFileSync(target)),imageSha);}a.equal(c.hash(fs.readFileSync(source)),imageSha);for(const root of [W,F])a.equal(c.hash(fs.readFileSync(root+'/jack.qsp')),before);
const info={id,before,after:mod.after_sha256,candidate:T+'/candidate.qsp',backup:B,edits:3,source,relative,imageSha,bytes:image.length,width:795,height:596,targets,prose,legacyGrowthSuffix:suffix,newPersistentFields:0};fs.writeFileSync(__dirname+'/prepared.json',JSON.stringify(info,null,2)+'\n');console.log(JSON.stringify({candidate:info.after,edits:3,imageStagedAtRuntime:true,imageSha,newPersistentFields:0}));
