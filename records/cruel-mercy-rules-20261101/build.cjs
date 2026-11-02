'use strict';
const fs=require('fs'),a=require('assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),scenes=require(W+'/modtools/text-workshop/scenes.cjs');
const T=process.argv[2]||'G:/Codex/tmp/cruel-mercy-rules-20261101';
const raw=fs.readFileSync(process.argv[3]||W+'/jack.qsp'),d=c.parse(raw),id='CRUEL_MERCY_RULES_20261101',edits=[];
a(c.serialize(d).equals(raw));
const cr=s=>s.replace(/\r?\n/g,'\r\n'),wrap=s=>`! JO9 MOD START ${id}\r\n${cr(s)}\r\n! JO9 MOD END ${id}`;
const body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
function edit(location,old,next){a(old&&next&&old!==next);const l=d.locations.find(l=>l.name===location),b=body(location);a.equal(b.split(old).length,2,'unique edit '+location);d.lines[l.body]=c.shift(b.replace(old,()=>next),-5);edits.push({location,field:'body',old,new:next,count:1});}
function scene(id,fn){const b=body('interaction_city').replace(/\r\n/g,'\n'),s=scenes.analyse('interaction_city',b).scenes.find(s=>s.predicate?.value===String(id));a(s,'scene '+id);const old=cr(b.slice(s.start,s.end));a(new RegExp('^if interaction_city = '+id+':','i').test(old),'scene start '+id);edit('interaction_city',old,fn(old));}
function guard(s,condition,extra=''){const e=s.indexOf('\r\n');return s.slice(0,e+2)+wrap(` if ${condition}: ${extra}exit`)+ '\r\n'+s.slice(e+2);}
function sub(s,old,next){a.equal(s.split(old).length,2,'sub '+old);return s.replace(old,()=>next);}
function hook(s,anchor,code){return sub(s,anchor,anchor+'\r\n'+wrap(code));}
edit('init_game','jo9_cruel_mercy = 0','jo9_cruel_mercy = 0\r\n'+wrap('jo9_cruel_mercy_half = 0'));
edit('jo9_battle_fate',' if jo9_bf_choice = 1: jo9_cruel_mercy -= 1\r\n if jo9_bf_choice = 2: jo9_cruel_mercy += 1',wrap(` ! Only formal arena and catfight decisions count; fog and practice are zero.
 if jo9_fate['mode'] = 2 and (($place = 'colosseum_arena' and $fight_return = 'Start') or ($place = 'catfightclub' and $fight_return = 'Start1')):
  gs 'jo9_cruel_mercy_apply', iif(jo9_bf_choice = 1, -2, 2)
 end`));
// Nonterminal state 1 -> 2 is the existing once-per-prize action boundary.
scene(61121,s=>hook(guard(s,"stock_state ! CONST_INT['slave_exist'] or hunting_prize ! 1"),'\thunting_prize = 2 &! lust satisfied flag for following options menu'," gs 'jo9_cruel_mercy_apply', -1"));
scene(61132,s=>{
 const call=s.split('\r\n').find(x=>x.trimStart().startsWith("gs 'stock_to_slave_nogt'"));a(call);
 return sub(guard(s,"stock_state ! CONST_INT['slave_exist'] or hunting_prize < 1 or slave_state ! CONST_INT['no_slave']"),call,wrap(" if func('stock_to_slave_nogt') = 1: gs 'jo9_cruel_mercy_apply', 1"));
});
scene(61131,s=>{
 const call=s.split('\r\n').find(x=>x.trimStart().startsWith("gs 'stock_to_slave_nogt'"));a(call);
 return sub(guard(s,"stock_state ! CONST_INT['slave_exist'] or hunting_prize < 1 or slave_state ! CONST_INT['no_slave'] or pig_state ! CONST_INT['no_slave']",'interaction_city = 0 & '),call,wrap(" if func('stock_to_slave_nogt') ! 1: interaction_city = 0 & exit"));
});
for(const event of [61134,61135])scene(event,s=>{
 s=guard(s,"stock_state ! CONST_INT['slave_exist'] or hunting_prize < 1");
 const clear=s.split('\r\n').find(x=>/^\s*dynamic \$clear_slave_instance,\s*'stock'\s*$/.test(x));a(clear);
 return hook(s,clear," gs 'jo9_cruel_mercy_apply', -2");
});
for(const event of [115441,115451])scene(event,s=>{
 s=guard(s,"(slave_state ! CONST_INT['slave_exist'] and slave_state ! CONST_INT['slave_faint'])"+(event===115451?' or sparks < 5':''));
 return hook(s,"\tdynamic $clear_slave_instance, 'slave'"," gs 'jo9_cruel_mercy_apply', -2");
});
for(const [event,delta] of [[8994,2],[8995,0],[8996,-2]])scene(event,s=>{
 s=guard(s,'safari.slave ! -1');
 return delta?hook(s,' safari.slave = 0',` gs 'jo9_cruel_mercy_apply', ${delta}`):s;
});
scene(8998,s=>sub(guard(s,"safari.slave ! -1 or slave_state ! CONST_INT['no_slave']")," gs 'stock_to_slave'",wrap(` ! Keep the existing successful handoff and hard_return rule, settling before GT.
 if func('stock_to_slave_nogt') ! 1:
  safari.slave = -1
  exit
 end
 gs 'jo9_cruel_mercy_apply', 1
 if hunting_prize = 0 and farid_potential_debt <= 0: gt 'hard_return'`)));
// Prepared separately against the exact three existing delayed-action branches.
const pig=JSON.parse(fs.readFileSync(__dirname+'/candidate-snippets.json','utf8'));
const ib=body('interaction').replace(/\r\n/g,'\n'),ps=scenes.analyse('interaction',ib).scenes.find(s=>s.predicate?.value==='6007');a(ps);
const po=cr(ib.slice(ps.start,ps.end));let pn=po;
for(const e of pig.callbackReplacements)pn=sub(pn,e.old,wrap(e.newTemplate.replaceAll('{{LEDGER_MINUS_HALF}}',"gs 'jo9_cruel_mercy_apply', -1")));
pn=sub(pn,pig.originConsumption.old,'\tend\r\n'+wrap('\tif interaction_city = 61131: interaction_city = 0')+'\r\n\tif pig_state > CONST_INT[\'no_slave\']:');
edit('interaction',po,pn);
const helper=wrap('! Delta is in half-points. Missing legacy remainder reads as zero.\r\n'+fs.readFileSync(__dirname+'/cm-half-helper.qsp.txt','utf8').trim());
const loc={name:'jo9_cruel_mercy_apply',desc:'',body:helper,actions:[]};
a(!d.locations.some(l=>l.name===loc.name));d.lines.splice(-1,0,c.shift(loc.name,-5),'',c.shift(helper,-5),c.shift('0',-5));d.lines[3]=c.shift(String(d.locations.length+1),-5);
const bytes=c.serialize(d),out=c.parse(bytes),world=qa.inspectWorld(bytes);
const changed=[...new Set(edits.map(e=>e.location))];
const original=c.parse(raw);for(const l of original.locations.filter(l=>!changed.includes(l.name)))a.equal(original.lines[l.body],out.lines[out.locations.find(x=>x.name===l.name).body]);
// Every original display literal must survive unmodified; bookkeeping changes no narrative.
let protectedDisplayLiterals=0;
for(const name of ['interaction_city','interaction']){
 const prev=c.shift(original.lines[original.locations.find(l=>l.name===name).body],5),after=c.shift(out.lines[out.locations.find(l=>l.name===name).body],5);
 const labels=c.literals(prev).filter(x=>/[가-힣]/.test(x.text));
 const newLiterals=c.literals(after).map(x=>x.text);
 for(const x of labels){a(newLiterals.includes(x.text),'display literal preserved '+name+':'+x.line);protectedDisplayLiterals++;}
}
const patch={id:'2026-11-01_cruel_mercy_rules',description:'Apply approved protagonist cruel/mercy half-point ledger only at completed listed actions. Formal arena/catfight choices count; fog mandatory execution and practice do not. Preserve legacy whole scores and existing threshold readers.',before_sha256:c.hash(raw),after_sha256:c.hash(bytes),edits,add_locations:[loc]};
fs.mkdirSync(T+'/mods',{recursive:true});fs.writeFileSync(T+'/before.qsp',raw);fs.writeFileSync(T+'/candidate.qsp',bytes);fs.writeFileSync(T+'/mods/'+patch.id+'.json',JSON.stringify(patch,null,2)+'\n');
const report={before:patch.before_sha256,after:patch.after_sha256,world,changedLocations:changed,newLocation:loc.name,newSaveFields:['jo9_cruel_mercy_half'],newPendingFields:0,protectedDisplayLiterals,cssChanged:false,imagesChanged:false,fullChanged:false};
fs.writeFileSync(T+'/prepared.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
