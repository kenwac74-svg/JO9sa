'use strict';
const fs=require('node:fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const input='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',before=fs.readFileSync(input),d=c.parse(before);
if(c.hash(before)!=='545a59dda6374a1e79fac283cebb80b00cc8892bf23d145bd8ac9c1c6ea76ff2')throw Error('Work changed');
const names=[['구강 선호','펠라 중독'],['구역반사','반사적 구역질'],['항문 선호','애널섹스 중독'],['항문 기피','애널섹스 혐오'],['불복종','거센 반항심'],['선천적 발화 불가','선천적 벙어리']];
const edits=[],audit=[];
function change(n,fn){const l=d.locations.find(l=>l.name===n),old=c.shift(d.lines[l.body],5);let next=fn(old);if(old===next)throw Error('No change: '+n);next='! JO9 MOD START TRAIT_NAMES_DEFERRAL_'+n.replace(/[^a-z_]/gi,'').toUpperCase()+' | 2026-10-19_trait_names_tongue_deferral\r\n'+next+'\r\n! JO9 MOD END TRAIT_NAMES_DEFERRAL_'+n.replace(/[^a-z_]/gi,'').toUpperCase();d.lines[l.body]=c.shift(next,-5);edits.push({location:n,field:'body',old,new:next,count:1});}
change('jo9_traits',body=>{
 let rows=body.split('\r\n');
 const desc=rows.findIndex(r=>r.startsWith(" if $args[1] = 'tongue_loss':"));if(desc<0)throw Error('Missing tongue description');rows.splice(desc,1);
 const list=rows.findIndex(r=>r.includes("''tongue_loss''"));if(list<0)throw Error('Missing tongue list');rows.splice(list,1);
 const gen=rows.findIndex(r=>r.trim()==="if jo9_trait_registry_roll = 2: stock['jo9_voice_trait'] = 2");if(gen<0)throw Error('Missing tongue generation');rows.splice(gen,1);
 const editor=rows.findIndex(r=>r.includes("''jo9_voice_trait'', 2 & gt"));if(editor<0||!rows[editor+1].includes("= 2:")||!rows[editor+2].includes('! 2:'))throw Error('Missing tongue editor block');rows.splice(editor,4);
 body=rows.join('\r\n');
 for(const [old,label]of names){
  for(const [a,b]of [['>'+old+'</a><br>', '>'+label+'</a><br>'],['">'+old+': ', '">'+label+': ']]){
   if(body.split(a).length!==2)throw Error('Label anchor missing/ambiguous '+old+' '+a);body=body.replace(a,()=>b);
  }
 }
 if(/tongue_loss|혀 손실/.test(body))throw Error('Active tongue trait remains');
 audit.push({location:'jo9_traits',renames:names,removed:['describe/tongue_loss','list/tongue_loss','editor/voice2','random generation/voice2']});return body;
});
change('interaction',body=>{
 let count=0;
 for(const r of ['slave','assistant'])for(const q of ["'",'"']){const old='('+r+'['+q+'jo9_voice_trait'+q+']=1 or '+r+'['+q+'jo9_voice_trait'+q+']=2)',next='('+r+'['+q+'jo9_voice_trait'+q+']=1)';count+=body.split(old).length-1;body=body.replaceAll(old,next);}
 if(count!==6)throw Error('Expected six voice2 guards, got '+count);
 audit.push({location:'interaction',removedVoiceTwoConditions:count,preserved:'voice1 question/training/nod effects'});return body;
});
change('get_stock_seed',body=>{const old="stock['jo9_voice_trait'] = seed_jo9_voice_trait[stock_type]",next="stock['jo9_voice_trait'] = iif(seed_jo9_voice_trait[stock_type]=1,1,0)";if(body.split(old).length!==2)throw Error('Seed anchor');audit.push({location:'get_stock_seed',old,new:next});return body.replace(old,()=>next);});
change('get_special_assistant_quest',body=>{const old='assistant["jo9_voice_trait"] = seed_jo9_voice_trait[assistant_type]',next='assistant["jo9_voice_trait"] = iif(seed_jo9_voice_trait[assistant_type]=1,1,0)';if(body.split(old).length!==2)throw Error('Assistant seed anchor');audit.push({location:'get_special_assistant_quest',old,new:next});return body.replace(old,()=>next);});
const after=c.serialize(d);require('G:/somi/JO9sa/tools/qa/release-check.cjs').inspectWorld(after);
fs.mkdirSync(__dirname+'/build/mods',{recursive:true});fs.writeFileSync(__dirname+'/build/before.qsp',before);fs.writeFileSync(__dirname+'/build/candidate.qsp',after);
const mod={id:'2026-10-19_trait_names_tongue_deferral',description:'User-selected six trait names and defer tongue-loss implementation to future command expansion.',before_sha256:c.hash(before),after_sha256:c.hash(after),edits};
fs.writeFileSync(__dirname+'/build/mods/'+mod.id+'.json',JSON.stringify(mod,null,2));fs.writeFileSync(__dirname+'/build/audit.json',JSON.stringify({before:c.hash(before),after:c.hash(after),locations:edits.map(x=>x.location),audit},null,2));console.log(JSON.stringify({before:c.hash(before),after:c.hash(after),locations:edits.map(x=>x.location),renames:names,activeTraits:6,deferred:'tongue_loss'}));
