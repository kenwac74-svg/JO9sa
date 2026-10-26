'use strict';
const fs=require('node:fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const raw=fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'),d=c.parse(raw);
const body=n=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5);
console.log('WORK '+c.hash(raw));
if(process.argv[2]==='record'){
 const a=require('node:assert/strict'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');a.equal(c.hash(raw),'5560055182d40dd856791dc948429beb7ba636e118e20b748ce0ad91d2546ea7');qa.inspectWorld(raw);a.deepEqual(c.serialize(c.parse(raw)),raw);
 const report={status:'PROPOSAL_ONLY_NOT_APPLIED',date:'2026-10-24',workSha256:c.hash(raw),locations:d.locations.length,workStructure:'PASS',byteRoundtrip:true,nativeExecutionThisStage:false,gameEdits:0,saveEdits:0,fullSync:false,commit:false,push:false,
  confirmed:{intellect:[{value:0,label:'정신지체'},{value:1,label:'우둔함'},{value:2,label:'평범함'},{value:3,label:'영리함'},{value:4,label:'총명함'},{value:5,label:'지적임'}],baseAp:[0,2,3,4,5,5],existingIntellectApDiscount:false,existingXpModifiers:[-2,-2,-1,0,1,2],geniusOrdinaryXpMultiplier:2,geniusIntellectAtCreation:5},
  evidence:[{location:'#variative',lines:'330-335',fact:'intellect display labels'},{location:'#dynamic',lines:'1154-1161',fact:'existing intellect-based skill XP modifiers'},{location:'#dynamic',lines:'1295-1298 and 1395-1398',fact:'ordinary energy and easy half cost'},{location:'#static_base',lines:'750-753',fact:'pending half_action settlement also calls dynamic_energy_drop'},{location:'interaction_result',lines:'461-471',fact:'school escort directly accumulates half_action'}],
  alternatives:[{id:'all_paid_character_actions',recommended:true,scope:'Slave and assistant ordinary AP costs including education and work, without a knowledge-only rule. Protagonist costs and outcome HP/wound/exertion penalties remain separate.',reason:'Most directly follows the request that high intelligence can offset low stamina without funneling training into knowledge fields.'},{id:'education_only',recommended:false,scope:'All education subjects, all learners; ordinary work excluded.',tradeoff:'Smaller economic effect and simpler scope, but does not help low-stamina workers outside training.'}],
  proposedPercentByIntellect:[0,0,0,12.5,25,37.5],proposedPercentApproved:false,earlierUnapprovedPercentByHighIntellect:[12.5,25,50],ordinaryApCostPerEightActions:{none:8,smart:7,bright:6,intellectual:5},
  proposedStacking:'Use the stronger existing discount rather than adding discounts; an existing half-cost action stays half-cost.',
  structuralNotes:['Do not discount generic settlement recursively. Explicitly distinguish actual action charges from pending half_action normalization.','Do not infer eligibility from stale target_skill or interaction_type alone.','Any fractional savings must be accumulated per character and persist through save, role swaps, grade changes and days; initialize only for a newly created character.','Free and cheat-suppressed actions must not generate savings.','AP discount must not refill saved AP or alter the base stamina/AP curve.'],
  balance:{full50PercentApDiscountActionMultiplier:2,proposedTopActionMultiplier:1.6,geniusXpCombinedWithProposedTop:3.2,geniusXpCombinedWith50Percent:4,limits:'Long-run comparison of equal nominal 1AP costs and base XP. Existing XP modifiers, restrictions, exertion, money, rounding and actor roles change actual outcomes.'},
  next:'USER_CHOICE_OF_SCOPE_AND_RATE_REQUIRED_BEFORE_PRODUCT_EDITS'};
 const dir='G:/somi/JO9sa/records/intellect-ap-discount-proposal-20261024';fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/findings.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});fs.copyFileSync(__filename,dir+'/recon.cjs');a.deepEqual(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'),raw);console.log(JSON.stringify({report:dir+'/findings.json',status:report.status,workUnchanged:true}));
}else if(process.argv[2]==='search'){
 for(const l of d.locations){const lines=body(l.name).split('\r\n');for(let i=0;i<lines.length;i++){
  const s=lines[i];if(s.length<650&&(/intellect/.test(s)&&/energy|action|easy|영리|총명|지적/.test(s)||/영리|총명|지적/.test(s)&&/^\s*\$/.test(s)))console.log(l.name+':'+(i+1)+': '+s);
 }}
}else if(process.argv[2]==='costs'){
 for(const n of ['#dynamic','#static_base','interaction_result','interaction_result_city','jo9_learning_xp']){const ls=body(n).split('\r\n');for(let i=0;i<ls.length;i++)if(/easy_for_|energy_drop/.test(ls[i])&&ls[i].length<250){console.log(n+':'+(i+1)+': '+ls.slice(Math.max(0,i-2),Math.min(ls.length,i+3)).join('\n'));}}
}else if(process.argv[2]==='defs'){
 for(const n of ['#dynamic','#static_base']){const s=body(n);for(const m of s.matchAll(/^\s*(\$[\w_]+) = \{/gm)){if(/teach|study|skill|energy|action|learn|reset/.test(m[1]))console.log(n+':'+(s.slice(0,m.index).split('\r\n').length)+': '+m[1]);}}
}else if(process.argv[2]==='slice'){
 const ls=body(process.argv[3]).split('\r\n'),start=+process.argv[4],end=+process.argv[5];console.log(ls.slice(start-1,end).map((v,i)=>`${start+i}: ${v}`).join('\n'));
}
