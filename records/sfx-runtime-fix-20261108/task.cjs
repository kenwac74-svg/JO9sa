'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),cp=require('child_process'),z=require('zlib');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/sfx-runtime-fix-20261108',OUT=R+'/records/sfx-runtime-fix-20261108';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs');
const hash=b=>c.hash(b),read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),json=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):e.isFile()?[path.join(dir,e.name)]:[]);
const crlf=s=>s.trim().replace(/\r?\n/g,'\r\n');
const mode=process.argv[2];
if(mode==='prepare'){
 fs.mkdirSync(T+'/mods',{recursive:true});fs.mkdirSync(T+'/content/snd',{recursive:true});fs.mkdirSync(OUT,{recursive:true});
 const before=fs.readFileSync(G+'/jack.qsp'),d=c.parse(before);a(c.serialize(d).equals(before));
 const settings=read(G+'/content/modworkpic/JO9_사운드_설정 (4).json'),md=fs.readFileSync(R+'/records/audio-planning-20261106/MONSTER_INTRO_SFX_KO.md','utf8');
 const preview=walk('C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/output/jo9-sound-preview-20261106');
 const local=G+'/content/modworkpic/sound',assigned=new Map(settings.files.map(f=>[f.id,f]));
 const assets=[],monsters=[];
 function convert(source,filename,details){
  const existing=assets.find(e=>e.filename===filename);if(existing)return existing;
  const dest=T+'/content/snd/'+filename;
  if(filename==='gsid.wav')fs.copyFileSync(G+'/content/snd/gsid.wav',dest);
  else cp.execFileSync('G:/Codex/tools/ffmpeg-9.0.2/ffmpeg.exe',['-nostdin','-hide_banner','-loglevel','error','-y','-i',source,'-vn','-map_metadata','-1','-c:a','pcm_s16le',dest],{windowsHide:true});
  cp.execFileSync('G:/Codex/tools/ffmpeg-9.0.2/ffmpeg.exe',['-nostdin','-hide_banner','-loglevel','error','-xerror','-i',dest,'-f','null','-'],{windowsHide:true});
  const b=fs.readFileSync(dest);a.equal(b.subarray(0,4).toString(),'RIFF');a.equal(b.subarray(8,12).toString(),'WAVE');
  const row={...details,source,sourceSha256:hash(fs.readFileSync(source)),filename,bytes:b.length,sha256:hash(b)};assets.push(row);return row;
 }
 function assignedFile(key){const f=assigned.get(settings.assignments[key]);if(!f)return null;const name=fs.readdirSync(local).find(x=>x.toLowerCase()===f.name.toLowerCase());a(name,key);return path.join(local,name);}
 for(const [label,role]of [['승리','victory'],['패배','defeat'],['처형','execution'],['석방','release'],['치명타','critical']]){
  const key='combat:'+label;a.equal(settings.reviews[key],'adopted');convert(assignedFile(key),'jo9_'+role+'.wav',{key,role,label});
 }
 for(const line of md.split(/\r?\n/).filter(x=>x.startsWith('| ')&&x.includes(String.fromCharCode(96)))){
  const cells=line.split('|').slice(1,-1).map(x=>x.trim()),enemy=cells[1].replaceAll(String.fromCharCode(96),'');
  for(const letter of ['a','b']){const key='monster:'+enemy+':'+letter;if(settings.reviews[key]!=='adopted')continue;
   const page=cells[letter==='a'?3:4].match(/\]\((https:[^)]+)\)/)?.[1];a(page,key);
   const id=page.match(/-(\d+)\/$/)[1],source=assignedFile(key)||preview.find(p=>p.endsWith('_'+id+'.mp3'));a(source,key);
   const filename=enemy==='garsid'?'gsid.wav':'jo9_monster_'+id+'.wav';
   convert(source,filename,{key,role:'monster',enemy,sourcePage:page});monsters.push({key,enemy,filename,sourcePage:page});
  }
 }
 a.equal(monsters.length,18);a.equal(new Set(monsters.map(x=>x.enemy)).size,18);
 const mappings=monsters.map(x=>" if $args[1]='"+x.enemy+"': $result='content/snd/"+x.filename+"' & exit").join('\n');
 const helper=crlf(fs.readFileSync(__dirname+'/helper.qsrc','utf8').replace('! INTRO_MAPPING',mappings));
 const mod={id:'2026-11-08_adopted_combat_monster_sfx',status:'APPROVED',description:'채택 전투5종·몬스터18종의 실제 재생 연결. 전투 판정과 처형/석방 선택 조건 유지.',before_sha256:d.hash,after_sha256:'',edits:[]};
 function edit(name,old,next,id){const l=d.locations.find(x=>x.name===name),body=c.shift(d.lines[l.body],5);a.equal(body.split(old).length-1,1,name+' '+id);mod.edits.push({location:name,field:'body',old,new:next,count:1,patchId:id});d.lines[l.body]=c.shift(body.replace(old,next),-5);}
 const get=name=>c.shift(d.lines[d.locations.find(x=>x.name===name).body],5);
 edit('jo9_combat_sfx',get('jo9_combat_sfx'),helper,'SFX_ADOPTED_RUNTIME_20261108');
 const choice=" jo9_fate['count'] = 0\r\n result = 1\r\n exit\r\nend\r\n\r\nif $args[0] = 'choices':";
 edit('jo9_battle_fate',choice,choice.replace(' result = 1',"! JO9 MOD START SFX_FATE_ACCEPTED_20261108\r\n gs 'jo9_combat_sfx','fate',jo9_bf_choice\r\n! JO9 MOD END SFX_FATE_ACCEPTED_20261108\r\n result = 1"),'SFX_FATE_ACCEPTED_20261108');
 for(const name of ['$gladiator_fight_start','$catfight_fight_start']){
  const anchor="gs 'jo9_battle_fate', 'init', '"+(name==='$gladiator_fight_start'?'arena':'catfight')+"'";
  edit(name,anchor,"! JO9 MOD START SFX_ARENA_START_20261108\r\ngs 'jo9_combat_sfx','start',0\r\n! JO9 MOD END SFX_ARENA_START_20261108\r\n"+anchor,'SFX_ARENA_START_20261108');
 }
 edit('конец_боя','arena_mode = 0',"! JO9 MOD START SFX_COMBAT_RESULT_20261108\r\ngs 'jo9_combat_sfx','result',$итог_боя\r\n! JO9 MOD END SFX_COMBAT_RESULT_20261108\r\narena_mode = 0",'SFX_COMBAT_RESULT_20261108');
 const crit='\t\t$действия_игрока += "[치명타]<br>"';
 edit('атака_игрока',crit,crit+"\r\n! JO9 MOD START SFX_CRITICAL_CONFIRMED_20261108\r\n  gs 'jo9_combat_sfx','critical'\r\n! JO9 MOD END SFX_CRITICAL_CONFIRMED_20261108",'SFX_CRITICAL_CONFIRMED_20261108');
 const next=c.serialize(d);qa.inspectWorld(next);mod.after_sha256=hash(next);
 fs.writeFileSync(T+'/before.qsp',before);fs.writeFileSync(T+'/candidate.qsp',next);json(T+'/mods/'+mod.id+'.json',mod);json(OUT+'/assets.json',assets);json(OUT+'/monsters.json',monsters);
 const checks=monsters.flatMap((x,i)=>["$actual=$func('jo9_combat_sfx','intro','"+x.enemy+"')","if $actual!'content/snd/"+x.filename+"': msg 'JO9_QA_SFX_fail_map_"+i+"' & exit"]);
 const test=crlf(fs.readFileSync(__dirname+'/test.qsrc','utf8').replace('! MAP_CHECKS',checks.join('\n')));
 const lines=d.lines.slice(0,4);lines[3]=c.shift('4',-5);
 for(const[n,b]of[['Start',test],['jo9_combat_sfx',helper],['jo9_battle_fate',get('jo9_battle_fate')],['jo9_cruel_mercy_apply','exit']])lines.push(c.shift(n,-5),'',c.shift(b,-5),c.shift('0',-5));lines.push('');
 fs.writeFileSync(T+'/runtime.qsp',c.serialize({lines}));fs.copyFileSync(G+'/config.xml',T+'/config.xml');fs.writeFileSync(T+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 json(T+'/plan.json',[{name:'runtime',file:T+'/runtime.qsp',checkpoint:'18 mappings; accepted/blocked fate; once-only/muted audio',marker:'JO9_QA_SFX_runtime_COMPLETE'}]);
 json(OUT+'/prepared.json',{before:c.parse(before).hash,after:mod.after_sha256,edits:mod.edits.length,assets:assets.length,monsters:monsters.length});console.log(JSON.stringify(read(OUT+'/prepared.json')));
}else if(mode==='install'){
 const p=read(OUT+'/prepared.json'),mod=read(T+'/mods/2026-11-08_adopted_combat_monster_sfx.json');a.equal(hash(fs.readFileSync(G+'/jack.qsp')),p.before);a.equal(hash(fs.readFileSync(T+'/candidate.qsp')),p.after);
 const native=read(T+'/client-results.json');a(native.length&&native.every(x=>x.pass));
 const backup=OUT+'/before.qsp.gz',before=fs.readFileSync(G+'/jack.qsp');fs.writeFileSync(backup,z.gzipSync(before,{level:9}),{flag:'wx'});a(z.gunzipSync(fs.readFileSync(backup)).equals(before));
 const assets=read(OUT+'/assets.json');
 for(const e of assets)for(const root of [G+'/content/snd',R+'/assets/content/snd']){
  const to=root+'/'+e.filename;fs.mkdirSync(root,{recursive:true});if(fs.existsSync(to))a.equal(hash(fs.readFileSync(to)),e.sha256,to);else fs.copyFileSync(T+'/content/snd/'+e.filename,to);a.equal(hash(fs.readFileSync(to)),e.sha256);
 }
 for(const root of [G+'/mods',R+'/mods']){fs.mkdirSync(root,{recursive:true});json(root+'/'+mod.id+'.json',mod);}
 for(const file of [G+'/jack.qsp',R+'/assets/runtime/2.4.1/jack.qsp']){a.equal(hash(fs.readFileSync(file)),p.before,file);fs.copyFileSync(T+'/candidate.qsp',file);a.equal(hash(fs.readFileSync(file)),p.after);}
 const mfile=R+'/assets/runtime-source-2.4.1.json',m=read(mfile);fs.writeFileSync(OUT+'/runtime-source-before.json.gz',z.gzipSync(fs.readFileSync(mfile),{level:9}));
 for(const e of assets){const entry={runtimePath:'content/snd/'+e.filename,repositoryPath:'assets/content/snd/'+e.filename,bytes:e.bytes,sha256:e.sha256};const i=m.files.findIndex(x=>x.runtimePath===entry.runtimePath);if(i<0)m.files.push(entry);else m.files[i]=entry;}
 m.sourceQspSha256=p.after;m.audioRuntimeFix={date:'2026-11-08',report:'records/sfx-runtime-fix-20261108/REPORT_KO.md',combatEvents:5,monsterMappings:18};json(mfile,m);
 for(const name of ['task.cjs','helper.qsrc','test.qsrc'])fs.copyFileSync(__dirname+'/'+name,OUT+'/'+name);
 fs.copyFileSync(T+'/runtime-stderr.log',OUT+'/runtime-stderr.log');json(OUT+'/client-results.json',native);json(OUT+'/installed.json',{...p,backup,qspAndTrackedMatch:true,fullTouched:false});console.log(JSON.stringify({installed:true,...p}));
}else throw Error('prepare | install');
