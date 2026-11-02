'use strict';
const fs=require('fs'),a=require('assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',T=process.argv[2]||'G:/Codex/tmp/erza-branches-traits-20261101';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs');
const raw=fs.readFileSync(process.argv[3]||W+'/jack.qsp'),d=c.parse(raw),edits=[],id='ERZA_BRANCH_IMAGES_TRAITS_20261101';a(c.serialize(d).equals(raw));
const cr=s=>s.replace(/\r?\n/g,'\r\n'),wrap=s=>`! JO9 MOD START ${id}\r\n${cr(s)}\r\n! JO9 MOD END ${id}`;
const body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
function edit(location,old,next){const l=d.locations.find(l=>l.name===location),b=body(location);a.equal(b.split(old).length,2,'unique edit '+location);d.lines[l.body]=c.shift(b.replace(old,()=>next),-5);edits.push({location,field:'body',old,new:next,count:1});}
// The current authored save contains one isolated LF. Preserve its words and line break,
// record the smallest byte edit, and correct only the QSP-required line-ending representation.
const lineEndingRepairs=[];
for(const location of ['interaction_city']){
 let b=body(location),offset=b.search(/(?<!\r)\n/);a((b.match(/(?<!\r)\n/g)||[]).length<=1,'unexpected multiple authored LF edits');
 if(offset>=0){const old=b.slice(offset-1,offset+2),next=old.replace('\n','\r\n');edit(location,old,next);lineEndingRepairs.push({location,line:b.slice(0,offset).split('\n').length,kind:'loneLF-to-CRLF',wordingUnchanged:true});}
}
for(const [event,delta,suffix] of [[66677921,6,1],[66677922,-2,2]]){
 const old=`IF interaction_city = ${event}:\r\n npc = 0\r\n $npc_id = ''\r\n $place = 'erza_battle'\r\n $return_lock = 'menu_form'\r\n $special_image[1] = 'scene\\others\\erza_dead_after.png'`;
 const next=old.replace('erza_dead_after.png',`erza_dead_after_${suffix}.png`)+ '\r\n'+wrap(` ! The two result counters together identify an already completed mutually exclusive choice.
 if city_already_done_ever['66677921'] = 0 and city_already_done_ever['66677922'] = 0:
  gs 'jo9_cruel_mercy_apply', ${delta}
 end`);
 edit('interaction_city',old,next);
}
const screenStart='! JO9 MOD START BG_DIRECTORY_PREFIX_FIX_20261027';
edit('interaction_screen_city',screenStart,wrap(`! Repair only the retired shared reference in cached result pages; do not replay choices.
if $replace($special_image[1], '\\', '/') = 'scene/others/erza_dead_after.png':
 if interaction_city = 66677921: $special_image[1] = 'scene\\others\\erza_dead_after_1.png'
 if interaction_city = 66677922: $special_image[1] = 'scene\\others\\erza_dead_after_2.png'
end`)+ '\r\n'+screenStart);
edit('jo9_traits_value',"if $jo9_trait_value_mode = 'refresh':\r\n dynamic $replace({\r\n  jo9_trait_value_rate", "if $jo9_trait_value_mode = 'refresh':\r\n dynamic $replace({\r\n"+wrap("  if dynslave_type = 2624: dynslave['jo9_peerless'] = 1")+"\r\n  jo9_trait_value_rate");
const found="local $jo9_meiki_found_name = ''\r\n! JO9 MOD END MEIKI_DISCOVERY_POPUP_LOCAL_20261026";
edit('jo9_meiki_state',found,found+'\r\n'+wrap(`! Erza has a fixed latent trait; unexperienced states stay unchanged and hidden.
local $jo9_erza_meiki_role = $args[0]
if instr('|slave|assistant|room1|room2|room3|room4|', '|' + $jo9_erza_meiki_role + '|') > 0:
 if dyneval('result = ' + $jo9_erza_meiki_role + '_type') = 2624:
  if func('jo9_meiki_checks', 'age', dyneval('result = ' + $jo9_erza_meiki_role + "['age']")) = 1:
   if dyneval('result = ' + $jo9_erza_meiki_role + "['virginity']") >= 2 and dyneval('result = ' + $jo9_erza_meiki_role + "['virginity']") ! 4 and dyneval('result = ' + $jo9_erza_meiki_role + "['jo9_meiki_known']") = 0:
    dynamic $jo9_erza_meiki_role + "['jo9_meiki_known'] = 1"
    jo9_meiki_found = 1
    $jo9_meiki_found_name = $dyneval('$result = $' + $jo9_erza_meiki_role + '_name')
   end
  end
 end
end`));
const bytes=c.serialize(d),world=qa.inspectWorld(bytes),out=c.parse(bytes),original=c.parse(raw);
const changed=[...new Set(edits.map(e=>e.location))];for(const l of original.locations.filter(l=>!changed.includes(l.name)))a.equal(original.lines[l.body],out.lines[out.locations.find(x=>x.name===l.name).body]);
// Preserve every existing Korean literal including author-edited dialogue; patches contain no narrative.
let kept=0;for(const n of changed){const old=c.shift(original.lines[original.locations.find(l=>l.name===n).body],5),next=c.shift(out.lines[out.locations.find(l=>l.name===n).body],5),ls=c.literals(next).map(x=>cr(x.text));for(const s of c.literals(old).filter(s=>/[가-힣]/.test(s.text))){a(ls.includes(cr(s.text)),'authored literal '+n+':'+s.line);kept++;}}
const assets=[1,2].map(i=>{const path=W+`/content/pic/scene/others/erza_dead_after_${i}.png`,v=fs.readFileSync(path);a.equal(v.subarray(0,8).toString('hex'),'89504e470d0a1a0a');const width=v.readUInt32BE(16),height=v.readUInt32BE(20);a.equal(width,795);a.equal(height,596);return{path,width,height,bytes:v.length,sha256:c.hash(v)};});a.notEqual(assets[0].sha256,assets[1].sha256);
const patch={id:'2026-11-01_erza_branches_traits',description:'Separate Erza result image references, settle each completed choice once using the existing half-point helper, and give unique Erza fixed peerless appearance with latent guaranteed discovery through existing state handling.',before_sha256:c.hash(raw),after_sha256:c.hash(bytes),edits};
fs.mkdirSync(T+'/mods',{recursive:true});fs.writeFileSync(T+'/before.qsp',raw);fs.writeFileSync(T+'/candidate.qsp',bytes);fs.writeFileSync(T+'/mods/'+patch.id+'.json',JSON.stringify(patch,null,2)+'\n');
const result={before:patch.before_sha256,after:patch.after_sha256,world,changedLocations:changed,existingKoreanLiteralsPreserved:kept,lineEndingRepairs,assets,newLocations:0,newSaveFields:0,jsonChanged:false,imagesEdited:false,cssChanged:false,fullChanged:false,seedType:2624,seedSource:W+'/json/slaves/2624_erza.json'};
fs.writeFileSync(T+'/prepared.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
