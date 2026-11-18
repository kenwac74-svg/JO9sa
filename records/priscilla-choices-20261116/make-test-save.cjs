'use strict';
const fs=require('fs'),path=require('path'),a=require('node:assert/strict'),save=require('G:/somi/JO9sa/tools/qa/save-codec.cjs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const work='G:/somi/Jack O Nine Tails v2.4_work/game',base=work+'/save/22talk.sav',file=work+'/save/프리실라_분기테스트_20261116.sav';
const raw=fs.readFileSync(base),baseHash=c.hash(raw),doc=save.parse(raw),original=save.parse(raw);a(save.serialize(doc).equals(raw));
const refresh=process.argv.includes('--refresh-owned');
if(fs.existsSync(file)){a(refresh,'Do not overwrite an existing test save');const previous=JSON.parse(fs.readFileSync(__dirname+'/test-save.json','utf8'));a.equal(previous.file,file);a.equal(c.hash(fs.readFileSync(file)),previous.sha256,'Test save changed since creation; preserve it');a.equal(baseHash,previous.baseHash,'Source save changed since creation');}
const current=JSON.parse(fs.readFileSync(__dirname+(fs.existsSync(__dirname+'/current.json')?'/current.json':'/installed.json'),'utf8'));
const qsp=c.parse(fs.readFileSync(work+'/jack.qsp'));a.equal(qsp.hash,current.after);
const city=c.shift(qsp.lines[qsp.locations.find(l=>l.name==='interaction_city').body],5);a(city.includes('PRISCILLA_POST_PORTAL_SCENE_20261116'));
const onload=doc.vars.find(v=>v.name==='ONGLOAD');a(onload&&onload.values.length);onload.values[0][1]='';
const boot="$ongload = '$ongload' & saved_game_loaded = 1 & snk_room_target = 0 & exam_in_progress = 0 & lost_quest_slave = 0 & lost_quest_slave_jasmine = 0 & temporary_cell_state = 0 & txt_is_set_from_save = 0 & sp_txt_is_set_from_save = 0 & txt = 1 & sp_txt = 1 & wpn_price = 0 & skip_to = 0 & killobj & killact & gs '#options' & SETTIMER 500 & ";
const shared="revolution = 1 & witch_text = 2 & active[$quest[14]] = 2 & active[$quest[15]] = 2 & grand_final = 0 & ";
const enter="copyarr '$display_options', '$slums_options' & $place = 'slum_house' & $return_lock = 'shop_general' & interaction_city = 6021 & gt 'interaction_city'";
const stages=[
 {label:'① 반란 직후 · 기존 보상 전',reward:0,portal:0,seen:0,expected:6024,note:'야만왕 재촉 대신 길드에서 만나자는 안내'},
 {label:'② 반란 직후 · 포털 진행 안내',reward:1,portal:0,seen:0,expected:6024,note:'포털을 향하라는 안내'},
 {label:'③ 포털 귀환 · 새 대화와 귀환 보상',reward:0,portal:1,seen:0,expected:6026,expectedPages:current.dialoguePages||15,rewardStartPage:current.rewardStartPage||14,rewardSecondPage:current.rewardSecondPage||15,pageImages:current.pageImages||null,note:current.choicePage?`귀환 대화 뒤 ${current.choicePage}페이지에서 마법 / 봉사 보상 선택`:current.userWritesRewardDialogue?`귀환 대화 ${current.introPages}페이지 + 대사·컷신 입력용 보상 ${current.rewardPageCount}페이지`:`총${current.dialoguePages||15}페이지 · 귀환 보상 후반은${current.rewardStartPage||14}페이지부터`},
 {label:'④ 새 대화 이후 · 책 보관 안내',reward:1,portal:1,seen:1,expected:6024,note:'책을 보관 중이라는 후속 대기 안내'},
 {label:'⑤ 기존 길드 · 마녀의 보상',reward:0,portal:0,seen:0,expected:6025,note:'기존22페이지 전체 · 보상 후반은19~22페이지',entry:"interaction_city = 6025 & gt 'interaction_city'"}
].map(s=>({...s,code:boot+shared+`witch_talk = ${s.reward} & city_already_done_ever['6220'] = ${s.portal} & city_already_done_ever['6026'] = ${s.seen} & `+(s.entry||enter)}));
const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const html='<div style="position:absolute;left:24px;top:22px;width:710px;padding:20px;background:#eee4cd;color:#191919;font:19px sans-serif;line-height:1.5"><h2>프리실라 분기 확인</h2><p>테스트용 복사본입니다. 원래 저장은 보존했습니다.<br>확인할 단계를 누르세요. 다른 단계를 비교하려면 이 파일을 다시 불러오세요.</p>'+stages.map(s=>'<p><a style="color:#154e88;font-weight:bold" href="EXEC: '+esc(s.code)+'">'+s.label+'</a><br><span style="font-size:16px">'+s.note+'</span></p>').join('')+'<p style="font-size:15px">책 전달과 최종 의뢰 완료는 후속 이벤트로 남아 있습니다.</p></div>';
doc.lines[4]=save.enc(-1);doc.lines[5]=save.enc(-1);doc.lines[8]=save.enc(html);doc.lines[9]='';doc.lines[10]=save.enc('main_screen');doc.lines[15]=save.enc(0);
// Remove stale action/object lists from the disposable launcher, retaining all variables.
let p=17;p+=Number(save.dec(doc.lines[16]));p+=1+Number(save.dec(doc.lines[p]));const actionStart=p,actions=Number(save.dec(doc.lines[p++]));
for(let i=0;i<actions;i++){p+=2;const n=Number(save.dec(doc.lines[p++]));p+=2*n+4;}
const objects=Number(save.dec(doc.lines[p++]));p+=objects*2;a.equal(p,doc.start);
doc.lines=doc.lines.slice(0,actionStart).concat([save.enc(0),save.enc(0)]);doc.start=doc.lines.length;
const result=save.serialize(doc),check=save.parse(result);a(save.serialize(check).equals(result));a.equal(check.lines[2],original.lines[2]);
a.equal(check.vars.length,original.vars.length);for(let i=0;i<check.vars.length;i++)if(check.vars[i].name!=='ONGLOAD')a.deepEqual(check.vars[i],original.vars[i]);
a.equal(save.value(check,'ONGLOAD')[1],'');a.equal(save.dec(check.lines[15]),'0');a.equal(save.dec(check.lines[10]),'main_screen');
for(const v of check.vars)for(const [index]of v.idx)a(index>=0&&index<v.values.length);
a.equal(c.hash(fs.readFileSync(base)),baseHash);fs.writeFileSync(file,result,{flag:refresh?'w':'wx'});a.equal(c.hash(fs.readFileSync(file)),c.hash(result));
const manifest={file,bytes:result.length,sha256:c.hash(result),base,baseHash,qspHash:qsp.hash,allVariablesPreservedExcept:['ONGLOAD (launcher only; restored by start button)'],staleActionsRemoved:actions,staleObjectsRemoved:objects,stages,verified:{saveRoundtrip:true,indexBounds:true,baseUnchanged:true,questProgressOnlyConfiguredOnButton:true},limitations:['Configured test copy, not a save of a gameplay-completed portal escape.','FastQSP GUI load/appearance is for user review; target existing ignoreCRC=true setting is retained.']};
fs.writeFileSync(__dirname+'/test-save.json',JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({file,bytes:result.length,stages:stages.length,roundtrip:true,originalUnchanged:true}));
