'use strict';
const fs=require('node:fs'),a=require('node:assert/strict'),z=require('node:zlib'),cp=require('node:child_process');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/jo9-private-sex-menu-20261111',rec=repo+'/records/private-sex-menu-20261111';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const id='2026-11-11_private_room_original_menu',baseline='ab34a14466348807883fb06ab65e43ad507f892cf148696f38b3aebcac7b216d';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'),hash=p=>c.hash(fs.readFileSync(p)),nl=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+s.replaceAll("'","''")+"'";
const raw=fs.readFileSync(game+'/jack.qsp'),d=c.parse(raw),body=(doc,n)=>c.shift(doc.lines[doc.locations.find(l=>l.name===n).body],5);
function apply(target){return cp.execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-Command',"[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)\r\n& "+q(repo+'/tools/apply_mods.ps1')+' -Qsp '+q(target)+' -ModsDir '+q(tmp+'/mods')],{encoding:'utf8',windowsHide:true});}
fs.mkdirSync(rec,{recursive:true});fs.mkdirSync(tmp,{recursive:true});
const mode=process.argv[2];
if(mode==='prepare'){
 a.equal(d.hash,baseline,'WORK changed; review baseline again');a(c.serialize(d).equals(raw));a.equal(hash(repo+'/assets/runtime/2.4.1/jack.qsp'),baseline);a(read(tmp+'/before/client-results.json').some(x=>!x.pass));
 const edits=[];
 function edit(location,old,next,patchId){const b=body(d,location);a.equal(b.split(old).length-1,1,location+' '+patchId+' unique anchor');const l=d.locations.find(l=>l.name===location);d.lines[l.body]=c.shift(b.replace(old,next),-5);edits.push({location,field:'body',old,new:next,count:1,patchId});}
 for(let r=1;r<=4;r++){
  const b=body(d,'slave_private_room'+r),start=b.indexOf(`if room${r}_state > CONST_INT['no_slave'] and master_excitement >= 0:`),end=b.indexOf('\r\nend',start)+5;a(start>=0&&end>start);
  const mark='PRIVATE_ROOM_ORIGINAL_MENU_'+r+'_20261111';
  const next=nl(`! JO9 MOD START ${mark}
if room${r}_state = CONST_INT['slave_exist'] and room${r}['energy'] > -4:
$text_display += $menu_item_sex + '<a class="snk_menu_label" tooltip-data="원래 행동 선택 메뉴" href="EXEC: gs ''snk_room_bridge'', ''enter'', ${r}, menu_sex & gt ''menu_form''">섹스한다</a></li>'
else
$text_display += $replace($menu_item_sex_gray, '<li', '<li class="snk_disabled"') + '<span class="snk_menu_label" aria-disabled="true" tooltip-data="행동 가능한 상태와 충분한 행동력이 필요합니다.">섹스 불가</span></li>'
end
! JO9 MOD END ${mark}`);
  edit('slave_private_room'+r,b.slice(start,end),next,mark);
 }
 const mf=body(d,'menu_form'),mb=mf.indexOf('! SNK_ROOM_SEX_BEGIN'),me=mf.indexOf("\t\tif snk_room_target = 0: func('$menu', 'menu_form', $menu_item_sex, menu_sex,",mb),men=mf.indexOf('\r\n',me);a(mb>=0&&me>mb&&men>me);
 const originalButton=mf.slice(me,men).replace('if snk_room_target = 0: ','');
 edit('menu_form',mf.slice(mb,men),nl('! JO9 MOD START PRIVATE_ROOM_SHARED_MENU_20261111\n'+originalButton+'\n! JO9 MOD END PRIVATE_ROOM_SHARED_MENU_20261111'),'PRIVATE_ROOM_SHARED_MENU_20261111');
 const grey="\t\tif snk_room_target = 0: func('$menu', 'exec', $menu_item_sex_gray, empty, '섹스 불가', $text_exhausted)";
 edit('menu_form',grey,nl("! JO9 MOD START PRIVATE_ROOM_SHARED_DISABLED_20261111\n"+grey.replace('if snk_room_target = 0: ','')+'\n! JO9 MOD END PRIVATE_ROOM_SHARED_DISABLED_20261111'),'PRIVATE_ROOM_SHARED_DISABLED_20261111');
 const sb=body(d,'snk_room_bridge'),sx=sb.indexOf("if $args[0] = 'room_sex' and snk_room_target > 0:"),se=sb.indexOf("if $args[0] = 'guard'",sx);a(sx>=0&&se>sx);
 edit('snk_room_bridge',sb.slice(sx,se),nl(`! JO9 MOD START PRIVATE_ROOM_LEGACY_MENU_20261111
! Keep old callbacks on the same original menu without releasing the subject.
if $args[0] = 'room_sex' and snk_room_target > 0:
 menu_form = menu_sex
 gt 'menu_form'
end
! JO9 MOD END PRIVATE_ROOM_LEGACY_MENU_20261111
`),'PRIVATE_ROOM_LEGACY_MENU_20261111');
 const entry=" if (args[2] = 12 or args[2] = 13 or args[2] = 17) and snk_room_energy <= -4:\r\n  msg '행동력이 부족해서 교육을 시작할 수 없습니다.'";
 edit('snk_room_bridge',entry,nl("! JO9 MOD START PRIVATE_ROOM_MENU_ENTRY_ENERGY_20261111\n if (args[2] = menu_sex or args[2] = 12 or args[2] = 13 or args[2] = 17) and snk_room_energy <= -4:\n  msg '행동력이 부족해서 활동을 시작할 수 없습니다.'"),'PRIVATE_ROOM_MENU_ENTRY_ENERGY_20261111');
 // Place END after the existing guard closes, keeping every comment on its own line.
 edit('snk_room_bridge',"  gt 'slave_private_room' + str(args[1])\r\n end\r\n if args[2] = 17",nl("  gt 'slave_private_room' + str(args[1])\n end\n! JO9 MOD END PRIVATE_ROOM_MENU_ENTRY_ENERGY_20261111\n if args[2] = 17"),'PRIVATE_ROOM_MENU_ENTRY_ENERGY_20261111');
 const guard="  if (menu_form = 12 or menu_form = 13 or menu_form = 17) and slave['energy'] <= -4: menu_form = 1";
 edit('snk_room_bridge',guard,nl("! JO9 MOD START PRIVATE_ROOM_MENU_GUARD_ENERGY_20261111\n"+guard.replace('(menu_form = 12','(menu_form = menu_sex or menu_form = 12')+'\n! JO9 MOD END PRIVATE_ROOM_MENU_GUARD_ENERGY_20261111'),'PRIVATE_ROOM_MENU_GUARD_ENERGY_20261111');
 edit('snk_room_bridge','  if menu_form = 15: exit\r\n  if menu_form = 17: exit',nl('  if menu_form = 15: exit\n! JO9 MOD START PRIVATE_ROOM_MENU_GUARD_ALLOW_20261111\n  if menu_form = menu_sex: exit\n! JO9 MOD END PRIVATE_ROOM_MENU_GUARD_ALLOW_20261111\n  if menu_form = 17: exit'),'PRIVATE_ROOM_MENU_GUARD_ALLOW_20261111');
 const next=c.serialize(d),structure=qa.inspectWorld(next),mod={id,status:'APPROVED',description:'Use the original action menu and original costs/effects for private room subjects, retaining bridge ownership and return handling.',before_sha256:baseline,after_sha256:c.hash(next),edits};
 const backup='G:/somi/JO9_work_backups/private-sex-menu-20261111-'+baseline.slice(0,12);fs.mkdirSync(backup,{recursive:true});const gz=z.gzipSync(raw);a(z.gunzipSync(gz).equals(raw));fs.writeFileSync(backup+'/before.qsp.gz',gz,{flag:'wx'});fs.copyFileSync(repo+'/assets/runtime-source-2.4.1.json',backup+'/runtime-source-before.json');
 const protectedHashes={};for(const p of [game+'/modtools/catalog/catalog_status.js',game+'/modtools/catalog/patch-schedule.json',game+'/json/menu_item.json',game+'/json/slaves/3040_chunhyang.json'])protectedHashes[p]=hash(p);
 const originalBodies={};for(const n of ['interaction','interaction_result','sex_initiate','sex_end','sex_addup','#dynamic','#sex_options','#sex_texts'])originalBodies[n]=c.hash(Buffer.from(body(c.parse(raw),n)));
 fs.mkdirSync(tmp+'/mods',{recursive:true});write(tmp+'/mods/'+id+'.json',mod);write(repo+'/mods/'+id+'.json',mod);fs.writeFileSync(tmp+'/candidate.qsp',next);write(rec+'/prepared.json',{before:baseline,after:mod.after_sha256,backup,edits:edits.length,structure,protectedHashes,originalBodies});console.log(JSON.stringify({candidate:tmp+'/candidate.qsp',hash:mod.after_sha256,edits:edits.length}));
}
if(mode==='replay'){
 const s=read(rec+'/prepared.json'),target=tmp+'/replay.qsp';fs.writeFileSync(target,z.gunzipSync(fs.readFileSync(s.backup+'/before.qsp.gz')));a.equal(hash(target),s.before);
 fs.writeFileSync(rec+'/replay.log',apply(target));a.equal(hash(target),s.after);fs.writeFileSync(rec+'/replay-again.log',apply(target));a.equal(hash(target),s.after);write(rec+'/replay.json',{pass:true,before:s.before,after:s.after,repeatedApplyUnchanged:true});console.log('Isolated official replay and reapply passed.');
}
if(mode==='install'){
 const s=read(rec+'/prepared.json');for(const stage of ['after','integration']){a(read(tmp+'/'+stage+'/client-results.json').every(x=>x.pass),stage);for(const f of fs.readdirSync(tmp+'/'+stage).filter(n=>n.endsWith('-stderr.log'))){const log=fs.readFileSync(tmp+'/'+stage+'/'+f,'utf8');a(!log.includes('FAIL_PRIVATE'),f);a.equal((log.match(/showMessage\(\)/g)||[]).length,1,f);}}a(read(rec+'/replay.json').pass);a.equal(hash(game+'/jack.qsp'),s.before);a.equal(hash(repo+'/assets/runtime/2.4.1/jack.qsp'),s.before);
 fs.writeFileSync(rec+'/apply.log',apply(game+'/jack.qsp'));a.equal(hash(game+'/jack.qsp'),s.after);fs.writeFileSync(rec+'/reapply.log',apply(game+'/jack.qsp'));a.equal(hash(game+'/jack.qsp'),s.after);fs.copyFileSync(game+'/jack.qsp',repo+'/assets/runtime/2.4.1/jack.qsp');
 const mp=repo+'/assets/runtime-source-2.4.1.json',m=read(mp);a.equal(m.sourceQspSha256,s.before);m.sourceQspSha256=s.after;m.snapshotDate='2026-11-11';for(const x of m.files)if(x.repositoryPath==='assets/runtime/2.4.1/jack.qsp'){x.sha256=s.after;x.bytes=fs.statSync(game+'/jack.qsp').size;}m.latestPrivateRoomOriginalMenu={date:'2026-11-11',mod:id,report:'records/private-sex-menu-20261111/REPORT_KO.md'};write(mp,m);
}
if(mode==='install'||mode==='verify'){
 const s=read(rec+'/prepared.json');a.equal(hash(game+'/jack.qsp'),s.after);a.equal(hash(repo+'/assets/runtime/2.4.1/jack.qsp'),s.after);a.equal(read(repo+'/assets/runtime-source-2.4.1.json').sourceQspSha256,s.after);const final=c.parse(fs.readFileSync(game+'/jack.qsp')),prior=c.parse(z.gunzipSync(fs.readFileSync(s.backup+'/before.qsp.gz')));
 const changed=prior.locations.filter(l=>prior.lines[l.body]!==final.lines[l.body]).map(l=>l.name);a.deepEqual([...changed].sort(),['menu_form','slave_private_room1','slave_private_room2','slave_private_room3','slave_private_room4','snk_room_bridge'].sort());
 for(const [n,h]of Object.entries(s.originalBodies))a.equal(c.hash(Buffer.from(body(final,n))),h,n);for(const [p,h]of Object.entries(s.protectedHashes))a.equal(hash(p),h,p);
 for(const stage of ['before','after','integration']){fs.copyFileSync(tmp+'/'+stage+'/client-results.json',rec+'/native-'+stage+'.json');for(const f of fs.readdirSync(tmp+'/'+stage).filter(n=>n.endsWith('-stderr.log')))fs.copyFileSync(tmp+'/'+stage+'/'+f,rec+'/'+stage+'-'+f);}
 write(rec+'/verification.json',{...s,changedLocations:changed,structure:qa.inspectWorld(fs.readFileSync(game+'/jack.qsp')),workSourceMatch:true,originalCostsAndEffectBodiesUnchanged:true,nativeLifeCases:28,roomMainPresenceCases:8,roomButtonStateEnergyCases:36,guardEnergyBoundaryValues:[-4,-3],newSavedFields:0,saveSchemaChanged:false,userSaveGuiTested:false,fullTouched:false,commit:false,push:false});console.log('WORK original menu installed and source aligned.');
}
