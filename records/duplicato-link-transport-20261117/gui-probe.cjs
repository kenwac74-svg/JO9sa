'use strict';
const fs=require('fs'),path=require('path'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),s=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp')),body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),save=s.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/save/듀플리카토_친밀도테스트_20261117.sav')),q=x=>"'"+String(x).replaceAll("'","''")+"'";
const output=path.join(__dirname,'gui-probe');fs.mkdirSync(output,{recursive:true});
let spell=body('jo9_duplicato');
if(process.argv.includes('--candidate')){const mod=JSON.parse(fs.readFileSync(path.join(__dirname,'../duplicato-token-transport-20261117/2026-11-17_duplicato_safe_link_token.json'),'utf8'));for(const e of mod.edits){if(spell.split(e.old).length-1!==e.count)throw Error('Stale GUI candidate');spell=spell.replace(e.old,()=>e.new);}}
spell="if $args[0]='preview': msg 'JO9_TOKEN_TRACE IN_T='+$args[2]+';EXP_T='+$func('jo9_duplicato','actor_token','slave')+';IN_D='+$args[3]+';EXP_D='+$func('jo9_duplicato','actor_token','assistant')\r\n"+spell;
let setup=`usehtml=1
CONST_INT['slave_exist']=1
slave_state=1
assistant_state=1
slave_type=2583
assistant_type=1214
slave['0']=80
assistant['0']=80
master_mage=6
master_energy=5
slave['energy']=4
assistant['energy']=5
sparks=997487
npc_progress['Priscilla_duplicato']=1
assistant['cook_affinity']=1
assistant['cook_affinity_revealed']=2
$menu_item_Revelio='<li>'
$menu_item_Revelio_gray='<li>'
`;
for(const role of ['slave','assistant'])for(const key of ['name','ava'])setup+='$'+role+'['+q(key)+']='+q(s.value(save,role,key)[1])+'\r\n';
setup+="gs 'jo9_duplicato','choose'\r\n*pl '<h1>JO9 isolated token test</h1>'\r\n*pl $text_display\r\n";
const bodies=new Map([['Start',setup],['jo9_duplicato',spell],...['jo9_duplicato_traits','jo9_activity_stage','$menu'].map(n=>[n,body(n)]),['choice_screen',"*clr\r\n*pl '<h1>PREVIEW OK</h1>'\r\n*pl $text[1]\r\n*pl '<a href=\"EXEC:dynamic $yes\">CONFIRM COPY</a>'"],['interaction_screen',"*clr\r\n*pl '<h1>COPY OK</h1>'\r\n*pl $text[1]\r\nmsg 'JO9_GUI_FINAL pass='+$str(iif(sparks=997187 and master_energy=4 and slave['energy']=3 and assistant['energy']=4 and slave['cook_affinity']=1 and assistant['cook_affinity']=1 and slave['jo9_duplicato_received']=1 and already_done_today['jo9_duplicato']=1,1,0))+';sparks='+$str(sparks)+';AP='+$str(master_energy)+','+$str(slave['energy'])+','+$str(assistant['energy'])"],['menu_form',"*clr\r\n*pl '<h1>RETURNED TO MENU</h1>'"]]),lines=['QSPGAME','','',c.shift(String(bodies.size),-5)];
for(const[n,b]of bodies)lines.push(c.shift(n,-5),'',c.shift(b.replace(/\r?\n/g,'\r\n'),-5),c.shift('0',-5));lines.push('');fs.writeFileSync(path.join(output,'probe.qsp'),Buffer.from(lines.join('\r\n'),'utf16le'));fs.writeFileSync(path.join(output,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');process.stdout.write(output+'\n');
