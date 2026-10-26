'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),path=require('path');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const {transform}=require('./currency.cjs'),{buildTraitEdits}=require('./trait-edits.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',task='G:/Codex/tmp/profile-polish-20261025-r3';
const raw=fs.readFileSync(game+'/jack.qsp'),d=c.parse(raw),before=c.parse(raw);
assert.equal(c.hash(raw),'256293ff14b41ac19efd1bfb412f21066b227f86e1b61ea0e523820a86ebcb3a');
const edits=[];
const bodies=new Map();
function field(n,f){const at=d.locations.find(l=>l.name===n)[f];if(!bodies.has(at))bodies.set(at,c.shift(d.lines[at],5));return bodies.get(at);}
function update(n,field,next){
 const at=d.locations.find(l=>l.name===n)[field],old=bodies.has(at)?bodies.get(at):c.shift(d.lines[at],5);if(old===next)return;
 let a=0,b=old.length,z=next.length;while(a<b&&a<z&&old[a]===next[a])a++;while(b>a&&z>a&&old[b-1]===next[z-1]){b--;z--;}
 const fragment=c.minimalEdit(old,next,a,b,z),copy=s=>Buffer.from(s,'utf8').toString('utf8');
 edits.push({location:n,field,old:copy(fragment.old),new:copy(fragment.new),count:1});bodies.set(at,next);
}
const get=n=>field(n,'body'),set=(n,s)=>update(n,'body',s);
function replace(n,old,next){const b=get(n);assert.equal(b.split(old).length-1,1,'Unique match '+n+': '+old.slice(0,70));set(n,b.replace(old,()=>next));}
for(const e of buildTraitEdits(d))replace(e.location,e.old,e.new);
assert.equal(get('interaction_city').split('노예 목숨을 백 스파크에 걸고 도박하는 대신').length-1,2);
set('interaction_city',get('interaction_city').replaceAll('노예 목숨을 백 스파크에 걸고 도박하는 대신','노예 목숨을 $100에 걸고 도박하는 대신'));
replace('#npc_base_woman','그러면 오백 스파크를 주겠다.','그러면 $500을 주겠다.');
replace('hero_creation','size="7">스파크:</font>','size="7">보유금:</font>');
replace('hero_creation','size="6"><<sparks>></font>','size="6">$<<sparks>></font>');
set('exit',get('exit')+"\r\n*p '<script src=\"content/js/jo9_word_wrap.js?v=20261025r3\"></script>'\r\n");
for(const n of ['slave_stat','assistant_stat']){
 replace(n,'jo9_traits_view.css?v=20261025r2','jo9_traits_view.css?v=20261025r3');
 replace(n,'jo9_traits_view.js?v=20261025r2','jo9_traits_view.js?v=20261025r3');
 const old='<script src="content/js/jo9_traits_view.js?v=20261025r3"></script>';
 replace(n,old,old+'<script src="content/js/jo9_word_wrap.js?v=20261025r3"></script>');
}
for(const n of ['$ongload','$newloc']){
 const old="if jo9_profile_text_revision < 1:\r\n gs '#static_txt'\r\n jo9_profile_text_revision = 1";
 const next="if jo9_profile_text_revision < 2:\r\n gs '#static_base'\r\n gs '#static_txt'\r\n gs '#variative'\r\n jo9_profile_text_revision = 2";
 replace(n,old,next);
}
// Native saves include rendered profile HTML. Rebuild only these read-only
// pages after load so old metadata/resource URLs do not survive the update.
set('$ongload',get('$ongload')+"\r\nif $curloc = 'slave_stat': gt 'slave_stat'\r\nif $curloc = 'assistant_stat': gt 'assistant_stat'\r\n");
// The original list has one shared dance description. Match the clicked row's
// existing label at metadata time, without adding persistent character values.
replace('jo9_traits_view'," local $j9_href, $j9_action, $j9_expr, $j9_key, $j9_desc"," local $j9_href, $j9_action, $j9_expr, $j9_key, $j9_desc, $j9_label, $j9_tag");
replace('jo9_traits_view',"    j9_index += 1\r\n    $j9_meta += $func('jo9_traits_view', 'meta', j9_index, $j9_action, $j9_desc)",[
"    $j9_label = $strfind($j9_scan, '(?is)href\\s*=\\s*\"[^\"]*\"[^>]*>(.*?)</a>', 1)",
"    $j9_tag = $strfind($j9_label, '<[^>]*>')",
"    :j9_tv_label_strip",
"    if $j9_tag ! '':",
"     $j9_label = $replace($j9_label, $j9_tag, '')",
"     $j9_tag = $strfind($j9_label, '<[^>]*>')",
"     jump 'j9_tv_label_strip'",
"    end",
"    if $j9_label ! '' and $mid($j9_desc, 1, 1) = '[' and instr($j9_desc, '<br>') > 0:",
"     $j9_desc = '[' + $j9_label + ']<br>' + $mid($j9_desc, instr($j9_desc, '<br>') + 4)",
"    end",
"    j9_index += 1",
"    $j9_meta += $func('jo9_traits_view', 'meta', j9_index, $j9_action, $j9_desc)"
].join('\r\n'));
for(const [old,next]of [
 ['현재 회복 중임을 표시하는 상태입니다.','[회복]<br>현재 회복 중임을 표시하는 상태입니다.'],
 ['현재 확인된 임신 상태를 표시합니다.','[임신]<br>현재 확인된 임신 상태를 표시합니다.'],
 ['투기장에서 획득한 우승 경력을 나타내는 칭호입니다.','[아레나 챔피언]<br>투기장에서 획득한 우승 경력을 나타내는 칭호입니다.'],
 ['경주에서 획득한 우승 경력을 나타내는 칭호입니다.','[경주 챔피언]<br>경주에서 획득한 우승 경력을 나타내는 칭호입니다.'],
])replace('jo9_traits_view',old,next);
replace('jo9_traits_view'," j9_index += 1\r\n $j9_meta += $func('jo9_traits_view', 'meta', j9_index, '__arena__', '[아레나 챔피언]<br>투기장에서 획득한 우승 경력을 나타내는 칭호입니다.')",[
" local $j9_arena_caption = '아레나 챔피언'",
" if dyneval('result = ' + $j9_role + \"['arena_level']\") > 8: $j9_arena_caption = '아레나 그랜드 챔피언'",
" j9_index += 1",
" $j9_meta += $func('jo9_traits_view', 'meta', j9_index, '__arena__', '[' + $j9_arena_caption + ']<br>투기장에서 획득한 우승 경력을 나타내는 칭호입니다.')"
].join('\r\n'));
replace('jo9_traits_view'," j9_index += 1\r\n $j9_meta += $func('jo9_traits_view', 'meta', j9_index, '__race__', '[경주 챔피언]<br>경주에서 획득한 우승 경력을 나타내는 칭호입니다.')",[
" local $j9_race_caption = '경주 챔피언'",
" if dyneval('result = ' + $j9_role + \"['has_ride_win']\") > 6: $j9_race_caption = '경주 그랜드 챔피언'",
" j9_index += 1",
" $j9_meta += $func('jo9_traits_view', 'meta', j9_index, '__race__', '[' + $j9_race_caption + ']<br>경주에서 획득한 우승 경력을 나타내는 칭호입니다.')"
].join('\r\n'));
const currency=[];
for(const l of d.locations){
 for(const field of ['body','desc']){
  const at=l[field],body=bodies.has(at)?bodies.get(at):c.shift(d.lines[at],5);let next=body;
  const entries=field==='desc'?[{start:0,end:body.length,text:body,quote:''}]:c.literals(body);
  for(const e of [...entries].reverse()){
   const value=transform(e.text);if(value===e.text)continue;
   // Interpolation, command arguments and HTML attributes keep their bytes.
   const expressions=t=>t.match(/<<[\s\S]*?>>/g)||[];
   assert.deepEqual(expressions(value),expressions(e.text).map(transform),'Currency changed non-display expressions in '+l.name);
   const encoded=e.quote?value.replaceAll(e.quote,e.quote+e.quote):value;
   next=next.slice(0,e.start)+encoded+next.slice(e.end);update(l.name,field,next);
   currency.push({location:l.name,field,line:e.line||1,before:e.text,after:value});
  }
  assert.equal(bodies.has(at)?bodies.get(at):c.shift(d.lines[at],5),next);
 }
}
const changedFields=[];
for(const l of d.locations){const b=before.locations.find(v=>v.name===l.name);for(const f of ['body','desc']){
 const old=c.shift(before.lines[b[f]],5);let next=field(l.name,f);if(old===next)continue;
 if(f==='body'){
  set(l.name,'! JO9 MOD START PROFILE_POLISH_20261025_R3\r\n'+next);
  set(l.name,get(l.name)+'\r\n! JO9 MOD END PROFILE_POLISH_20261025_R3');
 }
 changedFields.push({location:l.name,field:f});
}}
let css=fs.readFileSync(game+'/css/jo9_traits_view.css','utf8');assert.equal(css.split('height:5px;line-height:0').length-1,1);css=css.replace('height:5px;line-height:0','height:10px;line-height:0');
css+='\r\n/* JO9 MOD START PROFILE_POLISH_20261025_R3 */\r\n#jo9_tv_root .jo9_tv_list{font-size:80%;line-height:inherit}\r\n/* JO9 MOD END PROFILE_POLISH_20261025_R3 */\r\n';
fs.writeFileSync(__dirname+'/jo9_traits_view.css',css);fs.copyFileSync(game+'/content/js/jo9_traits_view.js',__dirname+'/jo9_traits_view.js');
for(const [at,text]of bodies)d.lines[at]=c.shift(text,-5);
const bytes=c.serialize(d);qa.inspectWorld(bytes);assert(c.serialize(c.parse(bytes)).equals(bytes));
fs.writeFileSync(task+'/candidate.qsp',bytes);
const patch={id:'2026-10-25_profile_polish_r3',before_sha256:c.hash(raw),after_sha256:c.hash(bytes),edits};
fs.writeFileSync(task+'/mods/'+patch.id+'.json',JSON.stringify(patch,null,2));fs.writeFileSync(__dirname+'/patch.json',JSON.stringify(patch,null,2));
fs.writeFileSync(__dirname+'/currency-edits.json',JSON.stringify({count:currency.length,edits:currency},null,2));
fs.writeFileSync(__dirname+'/candidate.json',JSON.stringify({before:c.hash(raw),after:c.hash(bytes),locations:changedFields.map(e=>e.location),edits:edits.length,currencyLiterals:currency.length,cssHash:c.hash(Buffer.from(css)),task},null,2));
console.log(JSON.stringify({after:c.hash(bytes),changedFields:changedFields.length,patchEdits:edits.length,currencyLiterals:currency.length}));
