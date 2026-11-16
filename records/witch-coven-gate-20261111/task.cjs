'use strict';
const fs=require('node:fs'),a=require('node:assert/strict'),cp=require('node:child_process'),z=require('node:zlib'),path=require('node:path');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/jo9-witch-coven-gate-20261111',rec=repo+'/records/witch-coven-gate-20261111';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const id='2026-11-11_witch_coven_entry',menuMark='WITCH_COVEN_MENU_20261111',entryMark='WITCH_COVEN_ENTRY_20261111',loadMark='WITCH_COVEN_LOAD_20261111';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,o)=>fs.writeFileSync(p,JSON.stringify(o,null,2)+'\n'),hash=p=>c.hash(fs.readFileSync(p));
const body=(doc,n)=>c.shift(doc.lines[doc.locations.find(l=>l.name===n).body],5),nl=s=>s.replace(/\r?\n/g,'\r\n');
const raw=fs.readFileSync(game+'/jack.qsp'),d=c.parse(raw);
const oldCall="FUNC('$menu', 'interaction_city', $menu_item_Unfamiliar, 6021, '마녀들의 모임')";
const qualified="(noble_status = 1 and npc_progress['Venera'] = 2 and npc_progress['Pelageya'] = 2)";
const legacy="(witch_text = 2 or active[$quest[14]] > 0 or active[$quest[15]] > 0 or revolution = 1)";
const unlock=qualified+' or '+legacy;
const reason='귀족 신분을 얻고 베네라와 펠라게야의 일반 의뢰를 모두 완료해야 합니다.';
const menu=nl(`! JO9 MOD START ${menuMark}
if ${unlock}:
 ${oldCall}
else
 FUNC('$menu', 'location_gray_tooltip', $menu_item_Unfamiliar_gray, empty, '마녀들의 모임', '${reason}')
end
! JO9 MOD END ${menuMark}`);
const entry=nl(`! JO9 MOD START ${entryMark}
! Existing visits and the special quest chain keep access; no new saved flag.
if interaction_city >= 6021 and interaction_city <= 6024:
 if witch_text ! 2 and active[$quest[14]] <= 0 and active[$quest[15]] <= 0 and revolution ! 1 and (noble_status ! 1 or npc_progress['Venera'] ! 2 or npc_progress['Pelageya'] ! 2): interaction_city = 6031
end
! JO9 MOD END ${entryMark}
`);
const quote=s=>"'"+s.replaceAll("'","''")+"'";
function apply(qsp){const command="[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)\r\n& "+quote(repo+'/tools/apply_mods.ps1')+' -Qsp '+quote(qsp)+' -ModsDir '+quote(tmp+'/mods');return cp.execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-Command',command],{encoding:'utf8',windowsHide:true});}
const load=nl(`! JO9 MOD START ${loadMark}
! Update only this saved menu call; retain unrelated menus and manual text.
local $jo9_coven_old = ${quote(oldCall)}
local $jo9_coven_new = {
${menu}
}
if instr($slums_options[1], '${menuMark}') = 0: $slums_options[1] = replace($slums_options[1], $jo9_coven_old, $jo9_coven_new)
local jo9_coven_i
for jo9_coven_i = 0 to arrsize('$display_options') - 1 step 1:
 if instr($display_options[jo9_coven_i], '${menuMark}') = 0: $display_options[jo9_coven_i] = replace($display_options[jo9_coven_i], $jo9_coven_old, $jo9_coven_new)
end
! JO9 MOD END ${loadMark}
`);
const assignment=(b,key)=>{const at=b.indexOf(key+' = {'),end=b.indexOf('\r\n}',at);a(at>=0&&end>at,key);return b.slice(at,end+3);};
const marked=(b,mark)=>{const start=b.indexOf('! JO9 MOD START '+mark),end=b.indexOf('! JO9 MOD END '+mark,start);return start<0?'':b.slice(start,end+('! JO9 MOD END '+mark).length);};
function saveNative(bytes,kind){
 const doc=c.parse(bytes),options=body(doc,'#options'),inter=body(doc,'interaction_city'),ongload=body(doc,'$ongload');
 const menuCode=assignment(options,'$slums_options[1]'),guard=marked(inter,entryMark),savedLoad=marked(ongload,loadMark);
 const room=inter.match(/^IF interaction_city = 6031:\r\n[\s\S]*?^END/m)?.[0];a(room);
 const dispatcher=inter.match(/^IF interaction_city = 6021:\r\n[\s\S]*?^END/m)?.[0];a(dispatcher);
 const enter=guard+'\r\n'+room.replace("gt 'shop_general'",'qa_denied += 1 & exit')+'\r\n'+dispatcher+"\r\nif interaction_city = 6022: witch_text = 2\r\nqa_destination = interaction_city";
 let code=nl(`qa_failed = 0
$quest[14] = 'qa-fourteen' & $quest[15] = 'qa-fifteen'
$save_link = {$qa_links[args[0]] = $args[1]}
$menu_item_Unfamiliar = '<li>' & $menu_item_Unfamiliar_gray = '<li id="grey">'
${menuCode}
qa_cases = 0
for qa_noble = 0 to 1 step 1:
 for qa_venera = 0 to 2 step 1:
  for qa_pelageya = 0 to 2 step 1:
   for qa_legacy = 0 to 7 step 1:
    noble_status = qa_noble & npc_progress['Venera'] = qa_venera & npc_progress['Pelageya'] = qa_pelageya
    witch_text = 0 & active[$quest[14]] = 0 & active[$quest[15]] = 0 & revolution = 0
    if qa_legacy = 1: witch_text = 2
    if qa_legacy = 2: active[$quest[14]] = 1
    if qa_legacy = 3: active[$quest[14]] = 2
    if qa_legacy = 4: active[$quest[14]] = 3
    if qa_legacy = 5: active[$quest[15]] = 1
    if qa_legacy = 6: active[$quest[15]] = 2
    if qa_legacy = 7: revolution = 1
    qa_expected = 0
    if (qa_noble = 1 and qa_venera = 2 and qa_pelageya = 2) or qa_legacy > 0: qa_expected = 1
    killvar '$qa_links' & $text_display = ''
    dynamic $slums_options[1]
    qa_link = 0
    for qa_i = 0 to arrsize('$qa_links') - 1 step 1:
     if instr($qa_links[qa_i], 'interaction_city=6021') > 0: qa_link = 1
    end
    if qa_link ! qa_expected: msg 'FAIL menu noble='+qa_noble+' v='+qa_venera+' p='+qa_pelageya+' old='+qa_legacy & exit
    if qa_expected = 0 and instr($text_display, '${reason}') = 0: msg 'FAIL locked tooltip' & exit
    qa_original_witch = witch_text
    for qa_entry = 6021 to 6024 step 1:
     witch_text = qa_original_witch & interaction_city = qa_entry & qa_denied = 0 & qa_destination = 0
     gs 'QA_entry'
     if qa_expected = 0 and (qa_denied ! 1 or interaction_city ! 6031 or witch_text ! qa_original_witch): msg 'FAIL entry locked '+qa_entry & exit
     if qa_expected = 1 and qa_denied ! 0: msg 'FAIL existing access '+qa_entry & exit
     if qa_expected = 1 and qa_entry = 6021:
      qa_stage = 6023
      if qa_original_witch ! 2: qa_stage = 6022
      if qa_original_witch = 2 and active[$quest[14]] = 2: qa_stage = 6024
      if qa_destination ! qa_stage: msg 'FAIL dialogue stage' & exit
     end
    end
    qa_cases += 1
   end
  end
 end
end
if qa_cases ! 144: msg 'FAIL case count' & exit
! Restore cached menu definitions from an old save, including the current copied menu.
$slums_options[1] = ${quote(oldCall)}
$display_options[0] = '사용자가 보존한 다른 메뉴'
$display_options[1] = ${quote(oldCall)}
$display_options[2] = '다른 장소의 선택지'
gs 'QA_load'
if instr($slums_options[1], '${menuMark}') = 0 or instr($display_options[1], '${menuMark}') = 0: msg 'FAIL saved menu update' & exit
if $display_options[0] ! '사용자가 보존한 다른 메뉴' or $display_options[2] ! '다른 장소의 선택지': msg 'FAIL unrelated menu changed' & exit
$qa_cache = $slums_options[1] & $qa_display_cache = $display_options[1]
gs 'QA_load'
if $qa_cache ! $slums_options[1] or $qa_display_cache ! $display_options[1]: msg 'FAIL repeated load' & exit
witch_text = 0 & noble_status = 0 & npc_progress['Venera'] = 0 & npc_progress['Pelageya'] = 0
active[$quest[14]] = 0 & active[$quest[15]] = 0 & revolution = 0
killvar '$qa_links' & $text_display = ''
dynamic $display_options[1]
if instr($text_display, '${reason}') = 0: msg 'FAIL loaded old save still unlocked' & exit
if qa_failed = 0: msg 'JO9_QA_COVENGATE_entry_matrix_COMPLETE'
exit`);
 code=code.replaceAll(": msg 'FAIL",": qa_failed = 1 & msg 'FAIL");
 const parts=['QSPGAME','','',c.shift('4',-5)];for(const [name,script]of [['Start',code],['QA_entry',enter],['QA_load',savedLoad],['$menu',body(doc,'$menu')]])parts.push(c.shift(name,-5),'',c.shift(script,-5),c.shift('0',-5));parts.push('');
 const dir=tmp+'/'+kind;fs.mkdirSync(dir,{recursive:true});const probe=c.serialize({lines:parts});qa.inspectWorld(probe);fs.writeFileSync(dir+'/gate.qsp',probe);fs.copyFileSync(game+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');write(dir+'/plan.json',[{name:'gate',file:dir+'/gate.qsp',marker:'JO9_QA_COVENGATE_entry_matrix_COMPLETE',checkpoint:'144 menu states x four entry IDs; real $menu; dialogue routing; saved menu targeted reload and idempotency. Final shop navigation is isolated.'}]);console.log(dir+'/plan.json');
}
const mode=process.argv[2];fs.mkdirSync(tmp,{recursive:true});fs.mkdirSync(rec,{recursive:true});
if(mode==='before')saveNative(raw,'before');
if(mode==='after')saveNative(fs.readFileSync(tmp+'/candidate.qsp'),'after');
if(mode==='red')saveNative(z.gunzipSync(fs.readFileSync(read(rec+'/prepared.json').backup+'/before.qsp.gz')),'before');
if(mode==='green')saveNative(raw,'after');
if(mode==='replay'){
 const s=read(rec+'/prepared.json'),target=tmp+'/replay.qsp';
 fs.writeFileSync(target,z.gunzipSync(fs.readFileSync(s.backup+'/before.qsp.gz')));a.equal(hash(target),s.before);
 fs.mkdirSync(tmp+'/mods',{recursive:true});fs.copyFileSync(repo+'/mods/'+id+'.json',tmp+'/mods/'+id+'.json');
 fs.writeFileSync(rec+'/replay.log',apply(target));a.equal(hash(target),s.after);
 fs.writeFileSync(rec+'/replay-again.log',apply(target));a.equal(hash(target),s.after);
 write(rec+'/replay.json',{pass:true,before:s.before,after:s.after,repeatedApplyUnchanged:true});console.log('Official isolated replay and reapply passed.');
}
if(mode==='prepare'){
 a.equal(d.hash,'f77a6aee3300761992a4fde84d8a8d2fba73b3781d8e2bed09e1546e1cd1d67c','WORK changed; re-audit before editing');a(c.serialize(d).equals(raw));a.equal(hash(repo+'/assets/runtime/2.4.1/jack.qsp'),d.hash);a(read(tmp+'/before/client-results.json').some(r=>!r.pass),'Expected regression must fail first');
 const edits=[{location:'#options',field:'body',old:'\t'+oldCall,new:menu,count:1,patchId:menuMark},{location:'interaction_city',field:'body',old:'IF interaction_city = 6031:\r\n',new:entry+'IF interaction_city = 6031:\r\n',count:1,patchId:entryMark},{location:'$ongload',field:'body',old:'! JO9 MOD START COW_COSTUME_LOAD_20261111',new:load+'! JO9 MOD START COW_COSTUME_LOAD_20261111',count:1,patchId:loadMark}];
 for(const e of edits){const l=d.locations.find(l=>l.name===e.location),b=body(d,e.location);a.equal(b.split(e.old).length-1,e.count,e.location);d.lines[l.body]=c.shift(b.replace(e.old,e.new),-5);}
 const next=c.serialize(d);qa.inspectWorld(next);const mod={id,status:'APPROVED',description:'Require noble status and both Venera/Pelageya normal requests completed for first coven entry; preserve existing visits/quest chains and refresh only this saved menu.',before_sha256:c.hash(raw),after_sha256:c.hash(next),edits};
 const backup='G:/somi/JO9_work_backups/witch-coven-gate-20261111-'+c.hash(raw).slice(0,12);fs.mkdirSync(backup,{recursive:true});const gz=z.gzipSync(raw);a(z.gunzipSync(gz).equals(raw));fs.writeFileSync(backup+'/before.qsp.gz',gz,{flag:'wx'});fs.copyFileSync(repo+'/assets/runtime-source-2.4.1.json',backup+'/runtime-source-before.json');
 const protectedHashes={};for(const p of [game+'/modtools/catalog/catalog_status.js',game+'/modtools/catalog/patch-schedule.json',game+'/json/slaves/3040_chunhyang.json'])if(fs.existsSync(p))protectedHashes[p]=hash(p);
 fs.mkdirSync(tmp+'/mods',{recursive:true});write(tmp+'/mods/'+id+'.json',mod);write(repo+'/mods/'+id+'.json',mod);fs.writeFileSync(tmp+'/candidate.qsp',next);write(rec+'/prepared.json',{before:mod.before_sha256,after:mod.after_sha256,backup,protectedHashes});saveNative(next,'after');
}
if(mode==='install'){
 const s=read(rec+'/prepared.json');a(read(tmp+'/after/client-results.json').every(r=>r.pass));a.equal(read(rec+'/replay.json').pass,true);a.equal(c.hash(raw),s.before);a.equal(hash(repo+'/assets/runtime/2.4.1/jack.qsp'),s.before);
 fs.writeFileSync(rec+'/apply.log',apply(game+'/jack.qsp'));a.equal(hash(game+'/jack.qsp'),s.after);fs.writeFileSync(rec+'/reapply.log',apply(game+'/jack.qsp'));a.equal(hash(game+'/jack.qsp'),s.after);fs.copyFileSync(game+'/jack.qsp',repo+'/assets/runtime/2.4.1/jack.qsp');
 const mp=repo+'/assets/runtime-source-2.4.1.json',m=read(mp);a.equal(m.sourceQspSha256,s.before);m.sourceQspSha256=s.after;m.snapshotDate='2026-11-11';for(const f of m.files)if(f.repositoryPath==='assets/runtime/2.4.1/jack.qsp'){f.sha256=s.after;f.bytes=fs.statSync(game+'/jack.qsp').size;}m.latestWitchCovenEntry={date:'2026-11-11',mod:id,report:'records/witch-coven-gate-20261111/REPORT_KO.md'};write(mp,m);
}
if(mode==='install'||mode==='verify'){
 const s=read(rec+'/prepared.json');a.equal(hash(game+'/jack.qsp'),s.after);a.equal(hash(repo+'/assets/runtime/2.4.1/jack.qsp'),s.after);a.equal(read(repo+'/assets/runtime-source-2.4.1.json').sourceQspSha256,s.after);
 const final=c.parse(fs.readFileSync(game+'/jack.qsp')),prior=c.parse(z.gunzipSync(fs.readFileSync(s.backup+'/before.qsp.gz'))),changed=prior.locations.filter(l=>prior.lines[l.body]!==final.lines[l.body]).map(l=>l.name);a.deepEqual(changed,['$ongload','interaction_city','#options']);for(const [p,h]of Object.entries(s.protectedHashes))a.equal(hash(p),h,p);
 for(const stage of ['before','after']){fs.copyFileSync(tmp+'/'+stage+'/client-results.json',rec+'/native-'+stage+'.json');fs.copyFileSync(tmp+'/'+stage+'/gate-stderr.log',rec+'/native-'+stage+'.log');}
 write(rec+'/verification.json',{...s,changedLocations:changed,structure:qa.inspectWorld(fs.readFileSync(game+'/jack.qsp')),nativeStates:144,nativeEntryCases:576,savedMenuRepair:true,repeatedLoadIdempotent:true,workSourceMatch:true,newSavedFlags:0,saveSchemaChanged:false,actualUserSaveGuiTested:false,fullTouched:false,commit:false,push:false});console.log('WORK gate installed; source aligned; repeated application unchanged.');
}
