'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const temp='G:/Codex/tmp/audio-format-normalize-20261108';
const core=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const inv=JSON.parse(fs.readFileSync(__dirname+'/inventory.json','utf8'));
const raw=fs.readFileSync(game+'/jack.qsp'),doc=core.parse(raw);assert.equal(doc.hash,inv.workQspSha256);assert(core.serialize(doc).equals(raw));
const id='2026-11-08_audio_formats_mp3_bgm_wav_sfx';
const mod={id,status:'APPROVED',description:'사용자 지시: 기존 BGM은 MP3, 효과음은 WAV. 기존 세이브의 음악 경로와 캐시된 음악 호출을 갱신한다. 음악 선택 조건과 효과음 역할은 유지한다.',before_sha256:doc.hash,after_sha256:'',edits:[],add_locations:[]};
const names=new Map(inv.files.filter(x=>x.role==='bgm').map(x=>[x.name.toLowerCase(),x.name.replace(/\.wav$/i,'.mp3')]));
names.set('city.wav','city.mp3');
const re=/content[\\/]+snd[\\/]+([\w .-]+\.wav)/gi;
let replaced=0;
for(const loc of doc.locations){
 const old=core.shift(doc.lines[loc.body],5),lines=old.split('\r\n');const changed=[];
 const after=lines.map((line,i)=>{let hit=false;const s=line.replace(re,(all,name)=>{
  const next=names.get(name.toLowerCase());if(!next)return all;hit=true;replaced++;return all.slice(0,all.length-name.length)+next;
 });if(hit)changed.push(i);return s;});
 if(!changed.length)continue;
 let groups=[];for(const i of changed){const last=groups[groups.length-1];if(last&&i-last.end<=8)last.end=i;else groups.push({start:i,end:i});}
 for(let g=groups.length-1;g>=0;g--){
  const x=groups[g];let start=x.start,end=x.end,oldPart=lines.slice(start,end+1).join('\r\n');
  while(old.split(oldPart).length-1!==1){start=Math.max(0,start-1);end=Math.min(lines.length-1,end+1);oldPart=lines.slice(start,end+1).join('\r\n');}
  const marker='AUDIO_FORMAT_BGM_MP3_20261108_'+mod.edits.length;
  const newPart='! JO9 MOD START '+marker+'\r\n'+after.slice(start,end+1).join('\r\n')+'\r\n! JO9 MOD END '+marker;
  mod.edits.push({location:loc.name,field:'body',old:oldPart,new:newPart,count:1,patchId:marker});
 }
}
const helper=[
 '! JO9 MOD START AUDIO_FORMAT_SAVE_PATHS_20261108',
 "if $args[0]='path':",
 ' local $jo9_audio_norm',
 " $jo9_audio_norm=lcase(replace($args[1],'\\','/'))",
 ' $result=$args[1]',
 ...[...names].map(([old,next])=>` if $jo9_audio_norm='content/snd/${old}': $result='content/snd/${next}'`),
 ' exit','end',
 'local jo9_audio_i',
 'local $jo9_audio_old, $jo9_audio_new',
 "for jo9_audio_i=0 to arrsize('$music')-1:",
 " $music[jo9_audio_i]=$func('jo9_audio_formats','path',$music[jo9_audio_i])",'end',
 "$fogs_options[2]=replace($fogs_options[2],'fight_master.wav','fight_master.mp3')",
 "$display_options[2]=replace($display_options[2],'fight_master.wav','fight_master.mp3')",
 '$jo9_audio_old=$music_now',
 "$jo9_audio_new=$func('jo9_audio_formats','path',$music_now)",
 'if $jo9_audio_old!$jo9_audio_new:',
 ' $music_now=$jo9_audio_new',
 " if sound_on=1 and $music_now!'':",
 "  play $music_now,music_volume,'only, loop'",
 ' else',
 '  close $jo9_audio_old',
 ' end','end',
 '! JO9 MOD END AUDIO_FORMAT_SAVE_PATHS_20261108'
].join('\r\n');
mod.add_locations.push({name:'jo9_audio_formats',description:'',body:helper,actions:[]});
const load=doc.locations.find(x=>x.name==='$ongload'),loadBody=core.shift(doc.lines[load.body],5),anchor=loadBody.split('\r\n').slice(0,3).join('\r\n');assert.equal(loadBody.split(anchor).length-1,1);
mod.edits.push({location:'$ongload',field:'body',old:anchor,new:"! JO9 MOD START AUDIO_FORMAT_LOAD_20261108\r\ngs 'jo9_audio_formats'\r\n! JO9 MOD END AUDIO_FORMAT_LOAD_20261108\r\n"+anchor,count:1,patchId:'AUDIO_FORMAT_LOAD_20261108'});
for(const edit of mod.edits){const loc=doc.locations.find(x=>x.name===edit.location),body=core.shift(doc.lines[loc.body],5);assert.equal(body.split(edit.old).length-1,1,edit.location);doc.lines[loc.body]=core.shift(body.replace(edit.old,edit.new),-5);}
doc.lines[3]=core.shift(String(doc.locations.length+1),-5);
doc.lines.splice(doc.lines.length-1,0,core.shift('jo9_audio_formats',-5),'',core.shift(helper,-5),core.shift('0',-5));
const candidate=core.serialize(doc);qa.inspectWorld(candidate);mod.after_sha256=core.parse(candidate).hash;
fs.mkdirSync(temp+'/mods',{recursive:true});fs.writeFileSync(temp+'/mods/'+id+'.json',JSON.stringify(mod,null,2)+'\n');fs.writeFileSync(temp+'/candidate.qsp',candidate);
const before=core.shift(core.parse(raw).lines[core.parse(raw).locations.find(x=>x.name==='#dynamic').body],5);
const afterDoc=core.parse(candidate),afterDynamic=core.shift(afterDoc.lines[afterDoc.locations.find(x=>x.name==='#dynamic').body],5);
assert.equal(before,afterDynamic,'Music selection and original noble/reputation priority must remain unchanged');
fs.writeFileSync(__dirname+'/patch-summary.json',JSON.stringify({id,beforeSha256:inv.workQspSha256,afterSha256:mod.after_sha256,replacedReferences:replaced,edits:mod.edits.length,addedLocations:1,unchangedOriginalMusicSelection:true,missingMusicPreserved:['content/snd/city.mp3']},null,2));
console.log(JSON.stringify({references:replaced,edits:mod.edits.length,after:mod.after_sha256}));
