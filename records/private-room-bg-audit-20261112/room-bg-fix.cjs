'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib'),assert=require('assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',rec=repo+'/records/private-room-bg-audit-20261112',tmp='G:/Codex/tmp/private-room-bg-fix-20261112';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const id='2026-11-12_private_room_background_comment',modName=id+'.json',expectedBefore='376a35f58c8bb78b3bafc09f4da60f23f7c51a3462d4bd4d7e413d356f76dbe2';
const json=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const phase=process.argv[2],body=d=>c.shift(d.lines[d.locations.find(l=>l.name==='jo9_interior').body],5);
if(phase==='prepare'){
 const raw=fs.readFileSync(game+'/jack.qsp'),tracked=fs.readFileSync(repo+'/assets/runtime/2.4.1/jack.qsp');
 assert.equal(c.hash(raw),expectedBefore);assert(raw.equals(tracked));
 const d=c.parse(raw);assert(c.serialize(d).equals(raw));qa.inspectWorld(raw);
 const old=body(d);assert.equal(old,fs.readFileSync(rec+'/jo9_interior.before.txt','utf8'));assert.equal(old.split("Kula's shop").length,2);
 const fixed=old.replace("Kula's shop",'Kula shop');assert.equal(old.length-fixed.length,2);
 const original=JSON.parse(fs.readFileSync(repo+'/mods/2026-11-10_private_room_interior.json','utf8')).add_locations.find(l=>l.name==='jo9_interior').body;
 const scene=JSON.parse(fs.readFileSync(repo+'/mods/2026-11-10_private_room_scene_bg.json','utf8'));
 let evolved=original;for(const e of scene.edits.filter(e=>e.location==='jo9_interior')){assert(evolved.includes(e.old));evolved=evolved.replace(e.old,e.new);}assert.equal(evolved,old);
 d.lines[d.locations.find(l=>l.name==='jo9_interior').body]=c.shift(fixed,-5);const candidate=c.serialize(d);qa.inspectWorld(candidate);
 const mod={id,status:'APPROVED',description:"승인: jo9_interior 주석의 Kula's shop을 Kula shop으로 치환하여 닫히지 않은 작은따옴표로 함수가 주석 처리되는 오류를 수정한다. 기존 등급·구매·효과·이미지·저장 값은 변경하지 않는다. 첫 full-body edit는 기존 추가 로케이션의 선언된 진화를 연결하는 재생용 동일 상태 기록이다.",before_sha256:c.hash(raw),after_sha256:c.hash(candidate),edits:[{location:'jo9_interior',field:'body',old:original,new:old,count:1,patchId:'PRIVATE_ROOM_SCENE_BG_REPLAY_BRIDGE_20261112'},{location:'jo9_interior',field:'body',old,new:fixed,count:1,patchId:'PRIVATE_ROOM_BACKGROUND_COMMENT_20261112'}]};
 fs.mkdirSync(tmp+'/mods',{recursive:true});fs.mkdirSync(tmp+'/history-mods',{recursive:true});
 fs.writeFileSync(tmp+'/candidate.qsp',raw);json(tmp+'/mods/'+modName,mod);json(repo+'/mods/'+modName,mod);
 json(tmp+'/history-mods/2026-11-10_private_room_interior.json',{id:'jo9_interior_original_addition_only',add_locations:[{name:'jo9_interior',desc:'',body:original,actions:[]}],edits:[]});json(tmp+'/history-mods/2026-11-10_private_room_scene_bg.json',{id:'jo9_interior_scene_evolution_only',edits:scene.edits.filter(e=>e.location==='jo9_interior')});json(tmp+'/history-mods/'+modName,mod);
 const gz=zlib.gzipSync(raw,{level:9});assert(zlib.gunzipSync(gz).equals(raw));fs.writeFileSync(rec+'/baseline-jack.qsp.gz',gz);fs.copyFileSync(repo+'/assets/runtime-source-2.4.1.json',rec+'/runtime-source.before.json');
 json(rec+'/fix-plan.json',{id,mod:modName,beforeSha256:c.hash(raw),afterSha256:c.hash(candidate),beforeBytes:raw.length,afterBytes:candidate.length,location:'jo9_interior',field:'body',changedText:{old:"Kula's shop",new:'Kula shop'},removedCodeUnits:2,approval:'WORK에 수정 반영',tmp});
 console.log(JSON.stringify({phase,before:c.hash(raw),after:c.hash(candidate),deltaBytes:candidate.length-raw.length}));
}else if(phase==='history-prepare'){
 const original=JSON.parse(fs.readFileSync(repo+'/mods/2026-11-10_private_room_interior.json','utf8')).add_locations.find(l=>l.name==='jo9_interior');const scene=JSON.parse(fs.readFileSync(repo+'/mods/2026-11-10_private_room_scene_bg.json','utf8'));json(tmp+'/history-mods/2026-11-10_private_room_interior.json',{id:'jo9_interior_original_addition_only',add_locations:[original],edits:[]});json(tmp+'/history-mods/2026-11-10_private_room_scene_bg.json',{id:'jo9_interior_scene_evolution_only',edits:scene.edits.filter(e=>e.location==='jo9_interior')});
}else if(phase==='candidate'){
 const p=JSON.parse(fs.readFileSync(rec+'/fix-plan.json','utf8')),raw=fs.readFileSync(tmp+'/candidate.qsp'),baseline=zlib.gunzipSync(fs.readFileSync(rec+'/baseline-jack.qsp.gz'));assert.equal(c.hash(raw),p.afterSha256);qa.inspectWorld(raw);
 const a=c.parse(baseline),b=c.parse(raw);assert.equal(a.lines.length,b.lines.length);const diff=[];for(let i=0;i<a.lines.length;i++)if(a.lines[i]!==b.lines[i])diff.push(i);assert.deepEqual(diff,[a.locations.find(l=>l.name==='jo9_interior').body]);assert.equal(body(b),body(a).replace("Kula's shop",'Kula shop'));
 json(rec+'/static-verification.json',{beforeSha256:p.beforeSha256,afterSha256:p.afterSha256,roundtrip:true,structureAndBoundaries:true,changedFields:['jo9_interior.body'],onlyApprovedCommentReplacement:true,changedCodeUnits:2});console.log('Candidate scope, structure, roundtrip: PASS');
}else if(phase==='native-prepare'){
 const p=JSON.parse(fs.readFileSync(rec+'/fix-plan.json','utf8')),raw=fs.readFileSync(game+'/jack.qsp');assert.equal(c.hash(raw),p.afterSha256);const d=c.parse(raw);
 const code=`killall
autosave=0
decadesave=0
sound_on=0
$onnewloc=''
$ongload=''
$counter=''
settimer 0
jo9_room_tier[1]=1
jo9_room_tier[3]=2
jo9_room_tier[4]=3
for qa_room=1 to 4:
 $qa_name[qa_room]=func('jo9_interior','name',jo9_room_tier[qa_room])
 $qa_bg[qa_room]=func('jo9_interior','bg',qa_room)
 qa_exists[qa_room]=jo9_int_x
 $qa_scene[qa_room]=$bg['slave_private_room'+str(qa_room)]
 $qa_html[qa_room]=func('interior_change','jo9_html','<div id="snk_room_bg"><img src="'+$qa_bg[qa_room]+'"></div>')
end
savegame 'observe.sav'
msg 'JO9_QA_ROOMBG_INSTALLED_COMPLETE'
exit`.replace(/\n/g,'\r\n');
 d.lines[d.locations.find(l=>l.name==='Start').body]=c.shift(code,-5);const obs=c.serialize(d);qa.inspectWorld(obs);fs.writeFileSync(tmp+'/observe.qsp',obs);
 fs.mkdirSync(tmp+'/content/pic/bg/interiors',{recursive:true});for(const tier of ['basic','standard','quality','luxury'])fs.copyFileSync(game+'/content/pic/bg/interiors/'+tier+'_slave_room.png',tmp+'/content/pic/bg/interiors/'+tier+'_slave_room.png');fs.copyFileSync(game+'/content/pic/bg/sboudoir.png',tmp+'/content/pic/bg/sboudoir.png');fs.copyFileSync(game+'/config.xml',tmp+'/config.xml');fs.writeFileSync(tmp+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');json(tmp+'/plan.json',[{name:'observe',file:tmp+'/observe.qsp',marker:'JO9_QA_ROOMBG_INSTALLED_COMPLETE',checkpoint:'Installed helper: missing tier basic and standard/quality/luxury names, background and scene HTML'}]);console.log('Installed diagnostic ready');
}else if(phase==='native-report'){
 const p=JSON.parse(fs.readFileSync(rec+'/fix-plan.json','utf8')),s=sc.parse(fs.readFileSync(tmp+'/observe.sav')),get=(n,i)=>s.vars.find(v=>v.name===n.toUpperCase())?.values[i]||['0',''];const expected=[null,['1','standard','스탠다드'],['0','basic','베이직'],['2','quality','퀄리티'],['3','luxury','럭셔리']],rows=[];let checks=0;
 for(let i=1;i<=4;i++){const [tier,key,name]=expected[i],row={room:i,tier:get('jo9_room_tier',i)[0],name:get('qa_name',i)[1],background:get('qa_bg',i)[1],exists:get('qa_exists',i)[0],scene:get('qa_scene',i)[1],html:get('qa_html',i)[1]};assert.equal(row.tier,tier);assert.equal(row.name,name);assert.equal(row.background,'content/pic/bg/interiors/'+key+'_slave_room.png');assert.equal(row.exists,'1');assert.equal(row.scene,'interiors/'+key+'_slave_room');assert(row.html.includes('<div id="snk_room_bg"><img src="'+row.background+'"></div>'));checks+=6;rows.push(row);}
 assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),p.afterSha256);const client=JSON.parse(fs.readFileSync(tmp+'/client-results.json','utf8').replace(/^\uFEFF/,''));assert(client.length===1&&client[0].pass===true);json(rec+'/installed-native-verification.json',{qspSha256:p.afterSha256,checks,rows,client,userSavesTouched:false,guiVisuallyVerified:false});fs.copyFileSync(tmp+'/observe-stderr.log',rec+'/native-installed.log');console.log(JSON.stringify({phase,checks,rooms:4,passed:true}));
}else if(phase==='metadata'){
 const p=JSON.parse(fs.readFileSync(rec+'/fix-plan.json','utf8')),raw=fs.readFileSync(game+'/jack.qsp');assert.equal(c.hash(raw),p.afterSha256);assert.equal(c.hash(fs.readFileSync(repo+'/assets/runtime/2.4.1/jack.qsp')),p.beforeSha256);fs.copyFileSync(game+'/jack.qsp',repo+'/assets/runtime/2.4.1/jack.qsp');
 const file=repo+'/assets/runtime-source-2.4.1.json',m=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(m.sourceQspSha256,p.beforeSha256);m.sourceQspSha256=p.afterSha256;for(const f of m.files.filter(f=>f.runtimePath==='jack.qsp')){f.bytes=raw.length;f.sha256=p.afterSha256;}m.latestPrivateRoomBackgroundFix={date:'2026-11-12',mod:id,report:'records/private-room-bg-audit-20261112/REPORT_KO.md',qspSha256:p.afterSha256,tiersReset:false};fs.writeFileSync(file,JSON.stringify(m,null,2).replace(/\n/g,'\r\n')+'\r\n');assert(fs.readFileSync(repo+'/assets/runtime/2.4.1/jack.qsp').equals(raw));console.log('WORK and tracked QSP/metadata aligned');
}else throw Error('Unknown phase');
