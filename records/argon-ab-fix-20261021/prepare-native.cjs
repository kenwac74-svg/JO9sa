'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),repo='G:/somi/JO9sa',core=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),codec=require(repo+'/tools/qa/save-codec.cjs');
const root=__dirname,mode=process.argv[2];assert(['baseline','candidate'].includes(mode));
const raw=fs.readFileSync(mode==='baseline'?root+'/inputs/baseline.qsp':root+'/candidate.qsp'),dir=root+'/'+mode+'-native',game='G:/somi/Jack O Nine Tails v2.4_work/game';
fs.mkdirSync(dir,{recursive:true});fs.cpSync(game+'/json',dir+'/json',{recursive:true});fs.copyFileSync(game+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const prime=qa.primeState(codec.parse(fs.readFileSync(root+'/inputs/state.sav'))).code,quote=s=>"'"+s.replaceAll("'","''")+"'",plan=[];
const common="killall\r\nusehtml=1\r\nsettimer 0\r\n"+prime+"\r\ngs 'refresh_database'\r\n$onnewloc=''\r\n$ongload=''\r\nautosave=0\r\ndecadesave=0\r\nautosave_day=0\r\nautosave_decade=0\r\nsound_on=0\r\nsnk_room_target=0\r\n";
function make(name,code){
 const d=core.parse(raw),marker='JO9_QA_ABDISPLAY_'+name.replaceAll('-','_')+'_COMPLETE';
 d.lines[d.locations.find(l=>l.name==='Start').body]=core.shift(common+code+'\r\nmsg '+quote(marker),-5);
 const out=core.serialize(d);qa.inspectWorld(out);const file=dir+'/'+name+'.qsp';fs.writeFileSync(file,out);plan.push({name,file,marker,checkpoint:'Actual '+name+' '+mode});
}
const roles=['slave','assistant','prisoner','cow','room1','room2','room3','room4'];let code="qa_ab_bad=0\r\nqa_ab_icons_bad=0\r\nqa_ab_inputs_bad=0\r\ncroom2['milk_summ']=7\r\ncroom3['milk_summ']=8\r\nqa_ab_sparks=sparks\r\nqa_ab_day=day\r\n";
for(const n of [49,50,64,65]){
 code+=roles.map(r=>r+"['milk_summ']="+n).join('\r\n')+"\r\ngs '#var_base'\r\n";
 for(const r of roles){
  code+="if instr($"+r+"_milk_quantity,'( "+n+" )')=0: qa_ab_bad+=1\r\n";
  const image=n===49?'03':n===65?'05':'04';code+="if instr($"+r+"_milk_quantity,'milk_"+image+".png')=0: qa_ab_icons_bad+=1\r\n";
  code+="if "+r+"['milk_summ'] ! "+n+": qa_ab_inputs_bad+=1\r\n";
 }
}
code+="if qa_ab_bad ! 0: msg 'JO9_QA_ABDISPLAY_MILK_VALUE_MISMATCH' & exit\r\nif qa_ab_icons_bad ! 0: msg 'JO9_QA_ABDISPLAY_MILK_ICON_MISMATCH' & exit\r\nif qa_ab_inputs_bad ! 0 or croom2['milk_summ'] ! 7 or croom3['milk_summ'] ! 8 or sparks ! qa_ab_sparks or day ! qa_ab_day: msg 'JO9_QA_ABDISPLAY_MILK_STATE_CHANGED' & exit";
make('milk-boundaries',code);
code="gs '#npc_base'\r\n";
code+="if instr($quinta_pref[3],'<font color="+String.fromCharCode(34)+"#EA0090"+String.fromCharCode(34)+">')=0: msg 'JO9_QA_ABDISPLAY_QUINTA_BAD_COLOR' & exit\r\n";
for(let i=1;i<=5;i++){code+="if instr($barman_pref["+i+"],'</b>')=0 or instr($barman_pref["+i+"],'<b>')=0: msg 'JO9_QA_ABDISPLAY_BARMAN_BAD_BOLD' & exit\r\n";for(const color of ['#6b0084','#0000D8','#EA0090'])code+="if instr($barman_pref["+i+"],'<font color="+String.fromCharCode(34)+color+String.fromCharCode(34)+"></b>')>0: msg 'JO9_QA_ABDISPLAY_BARMAN_BAD_OPEN' & exit\r\n";}
make('npc-format',code);
fs.writeFileSync(dir+'/plan.json',JSON.stringify(plan,null,2));console.log(JSON.stringify({mode,probes:plan.length,milkChecks:96,otherStateChecks:4}));