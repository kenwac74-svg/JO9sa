'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const W='G:/somi/Jack O Nine Tails v2.4_work/game',T=process.argv[2]||'G:/Codex/tmp/erza-death-choices-20261101';
const raw=fs.readFileSync(process.argv[3]||W+'/jack.qsp'),d=c.parse(raw),id='ERZA_DEATH_CHOICES_20261101';
if(!c.serialize(d).equals(raw))throw Error('roundtrip');
const get=n=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5);
const edits=[];
function edit(n,old,newText){const l=d.locations.find(x=>x.name===n),s=get(n);if(s.split(old).length!==2)throw Error('edit uniqueness '+n);d.lines[l.body]=c.shift(s.replace(old,newText),-5);edits.push({location:n,field:'body',old,new:newText,count:1});}
const wrap=s=>'! JO9 MOD START '+id+'\r\n'+s+'\r\n! JO9 MOD END '+id;
const city=get('interaction_city'),start=city.indexOf('IF interaction_city = 6667792:'),end=city.indexOf('\r\nEND',start)+5;
if(start<0||end<=start)throw Error('death branch missing');
const death=city.slice(start,end);
for(const n of [66677921,66677922])for(const l of d.locations)if(new RegExp('\\b'+n+'\\b').test(c.shift(d.lines[l.body],5)))throw Error('ID used '+n+' '+l.name);
const results=[
 'IF interaction_city = 66677921:',
 ' npc = 0'," $npc_id = ''", " $place = 'erza_battle'", " $return_lock = 'menu_form'",
 " $special_image[1] = 'scene\\others\\erza_dead_after.png'", ' txt_count = 1',
 " $text[1] = '#긍정적 선택 결과'",'END','',
 'IF interaction_city = 66677922:',
 ' npc = 0'," $npc_id = ''", " $place = 'erza_battle'", " $return_lock = 'menu_form'",
 " $special_image[1] = 'scene\\others\\erza_dead_after.png'", ' txt_count = 1',
 " $text[1] = '#부정적 선택 결과'",'END'
].join('\r\n');
edit('interaction_city',death,death+'\r\n'+wrap(results));
const output='*p \'<div id = "text"><<$jo9_gold_result_text>></div>\'';
const choices=[
 'if interaction_city = 6667792:',
 ' ! Append choices to the rendered local copy; keep saved dialogue and author edits intact.',
 ' $jo9_gold_result_text += \'<br><br><a id="jo9-erza-positive-choice" href="EXEC: interaction_city = 66677921 & gt \'\'interaction_city\'\'">\'',
 " $jo9_gold_result_text += '#긍정적 선택지'",
 ' $jo9_gold_result_text += \'</a><br><a id="jo9-erza-negative-choice" href="EXEC: interaction_city = 66677922 & gt \'\'interaction_city\'\'">\'',
 " $jo9_gold_result_text += '#부정적 선택지'",
 " $jo9_gold_result_text += '</a>'",'end'
].join('\r\n');
edit('interaction_screen_city',output,wrap(choices)+'\r\n'+output);
const nav=['if txt > 1:',"\taddobj '<img src = \"content/pic/ui/buttons/legacy/back_button.png\">'",'else',"\taddobj '<img src = \"content/pic/ui/buttons/legacy/noback_button.png\">'",'end',"addobj '<img src = \"content/pic/ui/buttons/legacy/forward_button.png\">'"].join('\r\n');
edit('interaction_screen_city',nav,wrap('if interaction_city = 6667792:\r\n killobj\r\nelse\r\n'+nav+'\r\nend'));
const after=c.serialize(d),world=qa.inspectWorld(after);
const patch={id:'2026-11-01_erza_death_choices',description:'Add two editable reaction choices to Erza death dialogue and one shared-image follow-up scene with separate editable positive/negative text. Preserve original settlement and return path; no new numerical effects or save fields.',before_sha256:c.hash(raw),after_sha256:c.hash(after),edits};
const entries=c.entries(c.parse(after));for(const label of ['#긍정적 선택지','#부정적 선택지','#긍정적 선택 결과','#부정적 선택 결과']){if(!entries.some(e=>e.text===label&&e.dialogue))throw Error('not editable dialogue '+label);}
const original=fs.readFileSync(W+'/content/pic/scene/others/erza_dead.png'),target='content/pic/scene/others/erza_dead_after.png';
if(fs.existsSync(W+'/'+target))throw Error('target exists; do not overwrite');
fs.mkdirSync(T+'/mods',{recursive:true});fs.mkdirSync(T+'/assets/content/pic/scene/others',{recursive:true});
fs.writeFileSync(T+'/before.qsp',raw);fs.writeFileSync(T+'/candidate.qsp',after);fs.writeFileSync(T+'/mods/'+patch.id+'.json',JSON.stringify(patch,null,2)+'\n');
fs.writeFileSync(T+'/assets/'+target,original);
const prepared={before:c.hash(raw),after:c.hash(after),world,image:{source:W+'/content/pic/scene/others/erza_dead.png',target,sha256:c.hash(original),width:795,height:596,purpose:'Independent follow-up cut placeholder; intentionally identical to current art until the user supplies replacement art.',sharedBy:[66677921,66677922]},choices:[{id:66677921,label:'#긍정적 선택지',result:'#긍정적 선택 결과'},{id:66677922,label:'#부정적 선택지',result:'#부정적 선택 결과'}],newSaveFields:0,newLocations:0};
fs.writeFileSync(T+'/prepared.json',JSON.stringify(prepared,null,2)+'\n');
console.log(JSON.stringify(prepared));
