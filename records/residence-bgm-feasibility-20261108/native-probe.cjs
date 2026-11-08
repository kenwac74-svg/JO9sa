'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const repo='G:/somi/JO9sa';
const game='G:/somi/Jack O Nine Tails v2.4_work/game';
const core=require(repo+'/tools/text-workshop/core.cjs');
const qa=require(repo+'/tools/qa/release-check.cjs');
const out=path.resolve(__dirname);
const temp='G:/Codex/tmp/residence-bgm-feasibility-20261108';
const raw=fs.readFileSync(game+'/jack.qsp');
const doc=core.parse(raw);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function wave(seconds){
 const size=Math.round(seconds*22050)*2,b=Buffer.alloc(44+size);
 b.write('RIFF');b.writeUInt32LE(36+size,4);b.write('WAVEfmt ',8);
 b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);
 b.writeUInt32LE(22050,24);b.writeUInt32LE(44100,28);b.writeUInt16LE(2,32);
 b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(size,40);return b;
}
function fixture(start,counter){
 const lines=doc.lines.slice(0,4);lines[3]=core.shift('2',-5);
 for(const [name,body] of [['Start',start],['qa_counter',counter]]){
  lines.push(core.shift(name,-5),'',core.shift(body.join('\r\n'),-5),core.shift('0',-5));
 }
 lines.push('');const b=core.serialize({lines});core.parse(b);qa.inspectWorld(b);return b;
}
fs.mkdirSync(temp,{recursive:true});
fs.writeFileSync(temp+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=false\r\n');
fs.copyFileSync(game+'/config.xml',temp+'/config.xml');
fs.writeFileSync(temp+'/tone-a.wav',wave(2));
fs.writeFileSync(temp+'/tone-b.wav',wave(1));
const probes=[
 {name:'playlist',checkpoint:'Four native tracks wait for their full duration using Date.now; a page move preserves the first track',marker:'JO9_QA_BGM_playlist_COMPLETE',
  start:['usehtml=1',"$qa_session='"+crypto.randomUUID()+"'","$qa_tracks[0]='tone-a.wav' & $qa_tracks[1]='tone-b.wav' & $qa_tracks[2]='tone-a.wav' & $qa_tracks[3]='tone-b.wav'",'qa_lengths[0]=2000 & qa_lengths[1]=1000 & qa_lengths[2]=2000 & qa_lengths[3]=1000','qa_index=0 & qa_moves=0 & qa_plays=1',"play $qa_tracks[0],100,'only'","gs 'qa_counter','draw'"],
  counter:[
   'if qa_index>=4: exit',
   "if $args[0]='storage_fail': msg 'JO9_QA_BGM_storage_FAILED' & exit",
   "if $args[0]='move':",
   " if qa_index!0 or qa_plays!1: msg 'JO9_QA_BGM_move_FAILED' & exit",
   ' qa_moves+=1',
   "elseif $args[0]='step':",
   ' if args[1]!qa_index: exit',
   " $qa_trace+=' '+str(qa_index)+':'+str(args[2])",
   ' qa_index+=1',
   ' if qa_index=4:',
   '  close',
   "  if qa_moves=1 and qa_plays=4 and args[2]>=6000: msg 'JO9_QA_BGM_playlist_COMPLETE' & msg 'TRACE <<$qa_trace>>' & exit",
   "  msg 'JO9_QA_BGM_duration_FAILED' & exit",
   ' end',
   " play $qa_tracks[qa_index],100,'only'",' qa_plays+=1','end',
   '*clr',
   "*p '<a id=\"qa_step\" href=\"EXEC: gs ''qa_counter'',''step''\">step</a><a id=\"qa_move\" href=\"EXEC: gs ''qa_counter'',''move''\">move</a>'",
   "*p '<script>(function(){var key=\"jo9-bgm-qa-<<$qa_session>>\",idx=<<qa_index>>,len=<<qa_lengths[qa_index]>>,now=Date.now(),st;try{st=JSON.parse(sessionStorage.getItem(key)||\"null\");if(!st){st={first:now,start:now,index:idx};}if(st.index!==idx){st.index=idx;st.start=now;}sessionStorage.setItem(key,JSON.stringify(st));}catch(e){var bad=document.getElementById(\"qa_step\");bad.setAttribute(\"href\",\"EXEC: gs \\x27qa_counter\\x27,\\x27storage_fail\\x27\");bad.click();return;}if(window.qaTimer){clearTimeout(window.qaTimer);}window.qaTimer=setTimeout(function(){var a=document.getElementById(\"qa_step\");a.setAttribute(\"href\",\"EXEC: gs \\x27qa_counter\\x27,\\x27step\\x27,\"+idx+\",\"+(Date.now()-st.first));a.click();},Math.max(50,len-(now-st.start)+70));})();</script>'",
   "if qa_moves=0: *p '<script>setTimeout(function(){document.getElementById(\"qa_move\").click();},700);</script>'"
  ]},
 {name:'control',checkpoint:'Minimal diagnostic reaches Start and reports normally',marker:'JO9_QA_BGM_control_COMPLETE',
  start:["msg 'JO9_QA_BGM_control_COMPLETE'"],counter:[]},
 {name:'jsdispatch',checkpoint:'QtWebKit timer dispatches an EXEC link without user input',marker:'JO9_QA_BGM_jsdispatch_COMPLETE',
  start:['usehtml=1',`*p '<a id="qa_dispatch" href="EXEC: msg ''JO9_QA_BGM_jsdispatch_COMPLETE''">probe</a><script>setTimeout(function(){document.getElementById("qa_dispatch").click();},500);</script>'`],counter:[]},
 {name:'endstatus',checkpoint:'Native playback status after the two-second silent file ends',marker:'JO9_QA_BGM_endstatus_COMPLETE',
  start:['usehtml=1',"qa_before=isplay('tone-a.wav')","play 'tone-a.wav',100,'only'","qa_during=isplay('tone-a.wav')",`*p '<a id="qa_dispatch" href="EXEC: gs ''qa_counter''">probe</a><script>setTimeout(function(){document.getElementById("qa_dispatch").click();},3500);</script>'`],
  counter:["qa_after=isplay('tone-a.wav')",'if qa_before=0 and qa_during=1 and qa_after=0:'," msg 'JO9_QA_BGM_endstatus_COMPLETE'",'else'," msg 'JO9_QA_BGM_status before=<<qa_before>> during=<<qa_during>> after=<<qa_after>>'",'end']},
 {name:'timer',checkpoint:'Native periodic QSP counter runs without user input',marker:'JO9_QA_BGM_timer_COMPLETE',
  start:["$counter='qa_counter'",'qa_tick=0','settimer 100'],
  counter:['qa_tick+=1','if qa_tick>=5:'," $counter=''",' settimer 0'," msg 'JO9_QA_BGM_timer_COMPLETE'",'end']},
 {name:'playback',checkpoint:'ISPLAY observes first file playing and ending, then second file playing and ending',marker:'JO9_QA_BGM_playback_COMPLETE',
  start:["$counter='qa_counter'",'qa_tick=0',"qa_before=isplay('tone-a.wav')","play 'tone-a.wav',100,'only'",'settimer 100'],
  counter:[
   'qa_tick+=1',
   'if qa_phase=0:',
   " if isplay('tone-a.wav'): qa_seen_a=1",
   " if qa_seen_a=1 and isplay('tone-a.wav')=0:",
   '  qa_phase=1',"  play 'tone-b.wav',100,'only'",' end',
   'elseif qa_phase=1:',
   " if isplay('tone-b.wav'): qa_seen_b=1",
   " if qa_seen_b=1 and isplay('tone-b.wav')=0:",
   "  $counter=''",'  settimer 0',
   "  if qa_before=0: msg 'JO9_QA_BGM_playback_COMPLETE'",
   "  if qa_before!0: msg 'JO9_QA_BGM_probe_FAILED before=<<qa_before>> a=<<qa_seen_a>> b=<<qa_seen_b>> ticks=<<qa_tick>>'",
   ' end','end',
   'if qa_tick>=80:'," $counter=''",' settimer 0',
   " msg 'JO9_QA_BGM_probe_FAILED before=<<qa_before>> phase=<<qa_phase>> a=<<qa_seen_a>> b=<<qa_seen_b>> ticks=<<qa_tick>>'",'end'
  ]}
];
for(const p of probes){p.file=temp+'/'+p.name+'.qsp';fs.writeFileSync(p.file,fixture(p.start,p.counter));}
fs.writeFileSync(temp+'/plan.json',JSON.stringify(probes.map(({start,counter,...p})=>p),null,2));
fs.writeFileSync(temp+'/followup-plan.json',JSON.stringify(probes.filter(p=>['control','jsdispatch','endstatus'].includes(p.name)).map(({start,counter,...p})=>p),null,2));
fs.writeFileSync(temp+'/playlist-plan.json',JSON.stringify(probes.filter(p=>p.name==='playlist').map(({start,counter,...p})=>p),null,2));
const files=fs.readdirSync(temp).filter(n=>fs.statSync(temp+'/'+n).isFile()).map(n=>({name:n,sha256:sha(fs.readFileSync(temp+'/'+n))}));
fs.writeFileSync(out+'/probe-inputs.json',JSON.stringify({workQspSha256:sha(raw),engine:game+'/engine/jack.exe',temp,files},null,2));
console.log(JSON.stringify({temp,probes:probes.length,workSha256:sha(raw)}));
