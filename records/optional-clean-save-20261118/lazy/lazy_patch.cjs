'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const BASELINE_SHA256='3619a251981de236ea7aa9f803f8f4b0159f6dc16ab6035751a7b49c79a505a6';
const MARKER='JO9_SAVE_VOICE_LAZY_20261118';
const NL='\r\n';
const LAZY_ENSURE=" ! "+MARKER+NL+" if voice_fragment_revision ! 8 or arrsize('$voice_fragment_ids') ! 9120: gs '#txt_man','jo9_voice_fragment_data'"+NL;
const PICKER_OLD_PREFIX=" $result=''"+NL+" killvar '$jo9_vfp_candidates'";
const PICKER_NEW_PREFIX=" $result=''"+NL+LAZY_ENSURE+" killvar '$jo9_vfp_candidates'";
const mark=(id,lines)=>'! JO9 MOD START '+id+NL+lines.join(NL)+NL+'! JO9 MOD END '+id;
const occurrences=(text,needle)=>text.split(needle).length-1;
function buildPatch(raw){
 assert.equal(core.hash(raw),BASELINE_SHA256,'re-read current WORK before applying: baseline changed');
 const doc=core.parse(raw),baseline=new Map(doc.locations.map(loc=>[loc.name,core.shift(doc.lines[loc.body],5)]));
 const edits=[];
 function edit(location,old,replacement,role){
  const loc=doc.locations.find(item=>item.name===location);assert(loc,'missing location '+location);
  const body=core.shift(doc.lines[loc.body],5);
  assert.equal(occurrences(body,old),1,'exact old anchor count: '+role);
  const next=body.replace(old,replacement);doc.lines[loc.body]=core.shift(next,-5);
  edits.push({location,field:'body',old,new:replacement,count:1,role,baselineLine:baseline.get(location).slice(0,baseline.get(location).indexOf(old)).split(NL).length});
 }
 edit('#txt_man',':jo9_voice_fragment_data'+NL,
  ':jo9_voice_fragment_data'+NL+mark(MARKER+'_ENTRY',[
   "if $args[0] ! 'jo9_voice_fragment_data': jump 'jo9_voice_fragment_small_fact'",
  ])+NL,'ordinary refresh skips heavy bank');
 edit('#txt_man',"killvar '$voice_fact_emotion'"+NL,'','relocate small fact reset');
 edit('#txt_man',"$voice_fact_emotion['fear_0']",
  mark(MARKER+'_FACT',[
   ':jo9_voice_fragment_small_fact',"killvar '$voice_fact_emotion'",
  ])+NL+"$voice_fact_emotion['fear_0']",'small fact table entry');
 edit('#txt_man',"killvar 'voice_fragment_question'"+NL,
  mark(MARKER+'_QUESTIONS',[
   "if $args[0] ! 'jo9_voice_fragment_data': jump 'jo9_voice_fragment_small_flow'",
  ])+NL+"killvar 'voice_fragment_question'"+NL,'ordinary refresh skips heavy question bank');
 edit('#txt_man',"killvar '$voice_flow_override'"+NL+"killvar '$voice_flow_original'"+NL,'','relocate small flow resets');
 edit('#txt_man',"$voice_flow_original['body_obed_2_detail_a_1']",
  mark(MARKER+'_FLOW',[
   ':jo9_voice_fragment_small_flow',"killvar '$voice_flow_override'","killvar '$voice_flow_original'",
  ])+NL+"$voice_flow_original['body_obed_2_detail_a_1']",'small flow tables entry');
 edit('#txt_man',NL+'voice_fragment_revision=8'+NL,
  NL+mark(MARKER+'_REVISION',[
   "if $args[0] = 'jo9_voice_fragment_data': voice_fragment_revision=8",
  ])+NL,'only full bank marks revision current');
 edit('#dynamic',PICKER_OLD_PREFIX,PICKER_NEW_PREFIX,'central picker ensures bank before first read');
 const staticBody=baseline.get('#static_base'),orphan=staticBody.split(NL).find(line=>/^\$masters_vars\[\] = 'instance_mood'/.test(line));
 assert(orphan,'missing exact orphan producer');
 edit('#static_base',orphan,mark(MARKER+'_ORPHAN',[
  "killvar '$masters_vars' &! Exact unused plural array; the singular $master_vars definition above is preserved.",
 ]),'remove unused plural accumulation without retargeting singular');
 const candidate=core.serialize(doc),changed=[];
 for(const loc of doc.locations){const after=core.shift(doc.lines[loc.body],5);if(after!==baseline.get(loc.name))changed.push(loc.name);}
 assert.deepEqual(new Set(changed),new Set(['#txt_man','#dynamic','#static_base']));
 const patch={id:'2026-11-18_save_voice_lazy_source',description:'Regenerable voice bank is loaded on picker use; ordinary text refresh keeps only small fact/flow tables. Stop the unused plural masters-vars append.',before_sha256:BASELINE_SHA256,after_sha256:core.hash(candidate),edits:edits.map(({role,baselineLine,...item})=>item)};
 const inventory={baselineSha256:BASELINE_SHA256,candidateSha256:core.hash(candidate),baselineBytes:raw.length,candidateBytes:candidate.length,changedLocations:changed,editCount:edits.length,anchors:edits.map(({location,role,baselineLine,old,new:replacement})=>({location,role,baselineLine,oldCountInBaseline:occurrences(baseline.get(location),old),oldCountInCandidate:occurrences(core.shift(doc.lines[doc.locations.find(item=>item.name===location).body],5),old),newCountInCandidate:replacement?occurrences(core.shift(doc.lines[doc.locations.find(item=>item.name===location).body],5),replacement):0})),preservation:'All authored data assignment rows remain byte-identical and in their original relative order. No dialogue values copied, changed or added. No actor values, balance, callback registrations or save hooks changed in this module.',helper:{marker:MARKER,oldPrefix:PICKER_OLD_PREFIX,newPrefix:PICKER_NEW_PREFIX,lazyEnsure:LAZY_ENSURE}};
 return {patch,edits:patch.edits,inventory,candidate};
}
module.exports={BASELINE_SHA256,MARKER,LAZY_ENSURE,PICKER_OLD_PREFIX,PICKER_NEW_PREFIX,buildPatch};
if(require.main===module){
 const source=process.argv[2]||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
 const result=buildPatch(fs.readFileSync(source));
 fs.writeFileSync(path.join(__dirname,'source-lazy.patch.json'),JSON.stringify(result.patch,null,2)+'\n');
 fs.writeFileSync(path.join(__dirname,'inventory.json'),JSON.stringify(result.inventory,null,2)+'\n');
 process.stdout.write(JSON.stringify({editCount:result.edits.length,changedLocations:result.inventory.changedLocations,candidateSha256:result.inventory.candidateSha256,bytesDelta:result.candidate.length-fs.statSync(source).size})+'\n');
}
