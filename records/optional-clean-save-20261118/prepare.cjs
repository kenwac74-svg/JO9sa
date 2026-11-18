'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),a=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const {buildHelper}=require('./maintenance/maintenance.cjs');
const H=__dirname,T='G:/Codex/tmp/save-autoclean-20261118',WORK='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const NL='\r\n',q=s=>"'"+s.replaceAll("'","''")+"'",cr=s=>s.replace(/\r?\n/g,NL);
const raw=fs.readFileSync(WORK),d=core.parse(raw),tracked=fs.readFileSync('G:/somi/JO9sa/assets/runtime/2.4.1/jack.qsp'),td=core.parse(tracked);
a(raw.equals(core.serialize(d)));
const sourcePatch=JSON.parse(fs.readFileSync(H+'/lazy/source-lazy.patch.json','utf8')),get=(doc,n)=>{const l=doc.locations.find(x=>x.name===n);a(l,n);return core.shift(doc.lines[l.body],5);};
// Concurrent manual city manuscript edits are preserved; all source-lazy targets must match the reviewed baseline.
for(const name of new Set(sourcePatch.edits.map(e=>e.location)))a.equal(get(d,name),get(td,name),'Reviewed source changed: '+name);
const edits=[];
function edit(location,old,replacement){const l=d.locations.find(x=>x.name===location),text=get(d,location);a.equal(text.split(old).length-1,1,location+' exact anchor');d.lines[l.body]=core.shift(text.replace(old,replacement),-5);edits.push({location,field:'body',old,new:replacement,count:1});}
for(const e of sourcePatch.edits){
 // Retain adjacent context for moves/deletions so the standard patcher remains idempotent.
 if(e.new===''){
  const text=get(d,e.location),at=text.indexOf(e.old),rest=text.slice(at+e.old.length),next=rest.split(NL)[0]+NL;
  a(at>=0&&next.length>NL.length);edit(e.location,e.old+next,next);
 }else edit(e.location,e.old,e.new);
}
const install="! JO9 MOD START SAVE_MAINTENANCE_REGISTER_20261118\r\ngs 'jo9_save_maintenance','install'\r\n! JO9 MOD END SAVE_MAINTENANCE_REGISTER_20261118";
const sb=get(d,'#static_base'),tail=sb.split(NL).slice(-8).join(NL);edit('#static_base',tail,tail+NL+install+NL);
const loadAnchor='! JO9 MOD END AUTO_LOAD_COMPAT242_ENTRY_20261114';edit('$ongload',loadAnchor,loadAnchor+NL+"! JO9 MOD START SAVE_MAINTENANCE_LOAD_20261118\r\ngs 'jo9_save_maintenance','load'\r\n! JO9 MOD END SAVE_MAINTENANCE_LOAD_20261118");
for(const name of ['menu_form','city_menu_form']){
 const anchor="\t$setting_display_r += '<div id=\"under\">< < 컨텐츠 옵션 > ><br></div>'";
 edit(name,anchor,"\t! JO9 MOD START CLEAN_SAVE_OPTION_20261118\r\n\t$setting_display += $func('jo9_save_maintenance','clean_link')\r\n\t! JO9 MOD END CLEAN_SAVE_OPTION_20261118\r\n"+anchor);
}
const link='<br><div id="under"><a class="tooltip-right" tooltip-data="업데이트 전후에 새 이름으로 저장하세요. 진행은 보존하고 대사 캐시는 다음 대화에서 다시 만듭니다." href="EXEC: gs \'jo9_save_maintenance\',\'make_clean\'">클린 세이브 만들기</a></div>';
const ui=cr(`! JO9 MOD START CLEAN_SAVE_ACTION_20261118
if $args[0]='clean_link':
 $result=${q(link)}
 exit
end
if $args[0]='can_clean':
 result=0
 if ($curloc='main_screen' or $curloc='menu_form') and menu_form=2000: result=1
 if ($curloc='city_screen' or $curloc='city_menu_form') and city_form=1000: result=1
 if mode=1 or get_weapon>0 or exam_in_progress>0: result=0
 exit
end
if $args[0]='make_clean':
 if func('jo9_save_maintenance','can_clean')=0:
  msg '전투나 이벤트를 마친 뒤 일반 화면의 설정에서 사용하세요.'
  exit
 end
 gs 'jo9_save_maintenance','clean'
 if arrsize('$voice_fragment_ids')>0 or arrsize('$voice_fragment_text')>0: msg '현재 대사 함수의 원형을 확인할 수 없어 대사 캐시는 유지합니다. 확인된 임시 데이터만 정리한 파일을 저장합니다.'
 savegame
 exit
end
! JO9 MOD END CLEAN_SAVE_ACTION_20261118
`);
const helper=buildHelper();helper.body=ui+helper.body;
const fields=[helper.name,'',helper.body,'0'];d.lines.splice(d.lines.length-1,0,...fields.map(x=>core.shift(x,-5)));d.lines[3]=core.shift(String(d.locations.length+1),-5);
const after=core.serialize(d),parsed=core.parse(after);a.equal(parsed.locations.length,d.locations.length+1);
const mod={id:'2026-11-18_optional_clean_save_maintenance',description:'Keep normal save dialogue caches; offer explicit clean Save As with lazy rebuild and conservative legacy housekeeping',before_sha256:core.hash(raw),after_sha256:core.hash(after),edits,add_locations:[{name:helper.name,desc:'',body:helper.body,actions:[]}]};
fs.mkdirSync(T,{recursive:true});fs.writeFileSync(T+'/candidate.qsp',after);fs.writeFileSync(H+'/patch.json',JSON.stringify(mod,null,2)+'\n');fs.writeFileSync(H+'/before.qsp.gz',zlib.gzipSync(raw));fs.writeFileSync(H+'/tracked-before.qsp.gz',zlib.gzipSync(tracked));
const originalDoc=core.parse(raw),changed=new Set(edits.map(e=>e.location));for(const l of originalDoc.locations){if(!changed.has(l.name))a.equal(get(originalDoc,l.name),get(parsed,l.name),'Untouched location '+l.name);const dest=parsed.locations.find(x=>x.name===l.name);a.equal(originalDoc.lines[l.desc],parsed.lines[dest.desc]);const acts=Number(core.shift(originalDoc.lines[l.body+1],5));a.deepEqual(originalDoc.lines.slice(l.body+1,l.body+2+acts*3),parsed.lines.slice(dest.body+1,dest.body+2+acts*3));}
const proof={before:mod.before_sha256,trackedBefore:core.hash(tracked),after:mod.after_sha256,normalSavesKeepVoiceCache:true,changedLocations:[...changed],added:helper.name,unchangedBodies:originalDoc.locations.length-changed.size,preservedManualCityBody:get(originalDoc,'interaction_city')===get(parsed,'interaction_city'),helperMeta:{savedFields:helper.savedOwnVariables,mode:helper.modes},rebase:'Only interaction_city differed from reviewed tracked baseline; all3 lazy source bodies identical'};
fs.writeFileSync(H+'/prepared.json',JSON.stringify(proof,null,2)+'\n');console.log(JSON.stringify(proof));
