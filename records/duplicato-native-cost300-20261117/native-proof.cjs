'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const source='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',doc=core.parse(fs.readFileSync(source)),patch=JSON.parse(fs.readFileSync(path.join(__dirname,'2026-11-17_duplicato_qsp57_token_scan.json'),'utf8'));assert.equal(doc.hash,patch.before_sha256);
const body=name=>core.shift(doc.lines[doc.locations.find(l=>l.name===name).body],5),bodies=new Map(['jo9_duplicato','jo9_duplicato_traits','jo9_activity_stage','$menu'].map(name=>[name,body(name)]));for(const item of patch.edits){const before=bodies.get(item.location);assert.equal(before.split(item.old).length-1,1);bodies.set(item.location,before.replace(item.old,()=>item.new));}
const start=`qa_native_pass=0
$qa_native_fail=''
gs 'qa_reset'
gs 'qa_assert','empty_list',len($func('jo9_duplicato_traits','list'))=0
gs 'jo9_duplicato','choose'
gs 'qa_assert','empty_picker',instr($text_display,'복사할 재능 없음')>0
gs 'qa_reset'
assistant['cook_affinity']=1
assistant['cook_affinity_revealed']=2
gs 'qa_assert','cook_eligible',func('jo9_duplicato_traits','eligible','cook_affinity')=1
gs 'qa_assert','cook_list',$func('jo9_duplicato_traits','list')='cook_affinity'
gs 'jo9_duplicato','choose'
gs 'qa_assert','cook_picker',instr($text_display,'예민한 미각')>0 and instr($text_display,'복사할 재능 없음')=0
assistant['cook_affinity_revealed']=1
gs 'qa_assert','pending_hidden',len($func('jo9_duplicato_traits','list'))=0
assistant['cook_affinity_revealed']=2
slave['0']=39
gs 'qa_assert','friendship_gate',len($func('jo9_duplicato','reason'))>0
slave['0']=80
sparks=299
gs 'qa_assert','funds_gate',instr($func('jo9_duplicato','reason'),'300스파크')>0
sparks=300
gs 'qa_assert','funds_boundary',len($func('jo9_duplicato','reason'))=0
already_done_today['jo9_duplicato']=1
gs 'qa_assert','daily_gate',len($func('jo9_duplicato','reason'))>0
already_done_today['jo9_duplicato']=0
slave['jo9_duplicato_received']=1
gs 'qa_assert','recipient_gate',len($func('jo9_duplicato','reason'))>0
gs 'qa_reset'
assistant['sport_affinity']=1
assistant['sport_affinity_revealed']=2
assistant['cook_affinity']=1
assistant['cook_affinity_revealed']=2
assistant['secretary_affinity']=1
assistant['secretary_affinity_revealed']=2
gs 'qa_assert','first_middle_last',$func('jo9_duplicato_traits','list')='sport_affinity|cook_affinity|secretary_affinity'
gs 'jo9_duplicato','choose'
gs 'qa_assert','three_picker_order',instr($text_display,'운동광')>0 and instr($text_display,'운동광')<instr($text_display,'예민한 미각') and instr($text_display,'예민한 미각')<instr($text_display,'보좌관')
gs 'qa_reset'
assistant['cook_affinity']=1
assistant['cook_affinity_revealed']=2
slave['cook_affinity']=-1
slave['cook_affinity_revealed']=2
$qa_target=$func('jo9_duplicato','actor_token','slave')
$qa_donor=$func('jo9_duplicato','actor_token','assistant')
gt 'jo9_duplicato','preview','cook_affinity',$qa_target,$qa_donor
`;
const stage=Number(process.argv.find(arg=>arg.startsWith('--stage='))?.split('=')[1]||4);assert(stage>=1&&stage<=4);const resetPoints=[...start.matchAll(/gs 'qa_reset'/g)].map(match=>match.index);
bodies.set('Start',stage===4?start:start.slice(0,resetPoints[stage])+"msg 'JO9_DUP_FINAL pass='+$str(qa_native_pass)+';fail='+$qa_native_fail+';version='+$qspver+';stage="+stage+"'\n");
bodies.set('qa_reset',`killvar 'slave'
killvar 'assistant'
CONST_INT['slave_exist']=1
slave_state=1
assistant_state=1
slave_type=2583
assistant_type=1214
$slave['name']='Galateya'
$assistant['name']='미스티'
slave['0']=80
assistant['0']=80
master_mage=3
master_energy=4
master_half_action=0
slave['energy']=4
assistant['energy']=4
slave['sentinel']=777
assistant['sentinel']=888
sparks=1000
cheat_inf_en=0
spell_revelio=0
npc_progress['Priscilla_duplicato']=1
already_done_today['jo9_duplicato']=0
$text_display=''
$menu_item_Revelio='Revelio.png'
$menu_item_Revelio_gray='Revelio_gray.png'
`);
bodies.set('qa_assert',`if args[1]=0:
 $qa_native_fail+=$args[0]+'|'
else
 qa_native_pass+=1
end
`);
bodies.set('choice_screen',`gs 'qa_assert','conflict_label',instr($text[1],'예민한 미각 (기존 값 -1)')>0
gs 'qa_assert','preview_cost',instr($text[1],'300스파크')>0
dynamic $yes
`);
bodies.set('interaction_screen',`gs 'qa_assert','transfer',slave['cook_affinity']=1 and slave['cook_affinity_revealed']=2
gs 'qa_assert','donor_preserved',assistant['cook_affinity']=1 and assistant['cook_affinity_revealed']=2
gs 'qa_assert','cost300',sparks=700
gs 'qa_assert','all_three_AP',master_energy=3 and slave['energy']=3 and assistant['energy']=3
gs 'qa_assert','locks',slave['jo9_duplicato_received']=1 and already_done_today['jo9_duplicato']=1
gs 'qa_assert','unrelated_fields',slave['sentinel']=777 and assistant['sentinel']=888
msg 'JO9_DUP_FINAL pass='+$str(qa_native_pass)+';fail='+$qa_native_fail+';version='+$qspver+';candidate=${patch.after_sha256}'
`);
bodies.set('menu_form',"msg 'JO9_DUP_FINAL UNEXPECTED_MENU_RETURN'");
const ordered=new Map([['Start',bodies.get('Start')],...[...bodies].filter(([name])=>name!=='Start')]);const lines=['QSPGAME','','',core.shift(String(ordered.size),-5)];for(const [name,text]of ordered)lines.push(core.shift(name,-5),'',core.shift(text.replace(/\r?\n/g,'\r\n'),-5),core.shift('0',-5));lines.push('');const fixture=Buffer.from(lines.join('\r\n'),'utf16le');core.parse(fixture);
const out=path.join(__dirname,'native-proof');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'probe.qsp'),fixture);fs.writeFileSync(path.join(out,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');console.log(out);
