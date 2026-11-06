'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const doc=core.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
const bodies=new Map(doc.locations.map(l=>[l.name,core.shift(doc.lines[l.body],5)]));
for(const e of require('./mods.json')){const old=bodies.get(e.location);assert.equal(old.split(e.old).length-1,e.count);bodies.set(e.location,old.split(e.old).join(e.new));}
const out=path.join(__dirname,'native'),marker='JO9_QA_GIRLCONSUMERS_display_click_COMPLETE',code=[],manifest=[];
const png=fs.readFileSync(path.resolve(__dirname,'../../localhost-pic/fixture-a.png'));
let tests=0;
function scenario(name,setup,run,checks){
 const slug='consumer'+String(manifest.length+1).padStart(2,'0'),caseRoot=path.join(out,'files',slug);
 for(const match of setup.matchAll(/jo9_test_files\['([^']+)'\]=1/g)){const target=path.join(caseRoot,match[1]);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,png);}
 code.push('killall',`$jo9_native_fixture_root='files/${slug}/'`,setup,run);
 for(const [expr,wanted]of checks){tests++;const value=typeof wanted==='string'?"'"+wanted.replaceAll("'","''")+"'":wanted;code.push(`if ${expr} ! ${value}: msg 'JO9_GIRL_CONSUMERS_FAIL_${tests}' & exit`);}
 manifest.push({name,checks:checks.length});
}
const setup="CONST_INT['slave_exist']=1 & assistant_state=1 & assistant_type=1 & assistant['moral']=4 & assistant['arousal']=4 & $assistant['cloth']='голая' & $assistant['fullimage']='legacy/base' & $fullimage[1]='legacy/base' & $indpack_title[1]='pack/base'";
const call="$probe=func('display_fullimage','assistant','center_image')";
const html=stem=>'<div id="center_image"><img src="content\\pic\\'+stem+'.png"></div>';
for(const [mode,key,pack]of [[0,'fullimage','indpack_naked'],[1,'fullmistress','indpack_dom'],[2,'fullmade','indpack_maid'],[3,'fullsecretary','indpack_secr']]){
 const state=setup+` & assistant['image_mode']=${mode} & $${key}[1]='legacy/outfit' & $${pack}[1]='pack/outfit' & jo9_test_files['content/pic/legacy/outfit.png']=1`;
 scenario(`assistant mode ${mode} pack priority`,state+" & jo9_test_files['content/pic/pack/outfit.png']=1",call,[['$probe',html('pack/outfit')]]);
 scenario(`assistant mode ${mode} legacy fallback`,state,call,[['$probe',html('legacy/outfit')]]);
}
scenario('arousal priority over rebellion',setup+" & assistant['image_mode']=2 & assistant['moral']=1 & assistant['arousal']=5 & $indpack_maid[1]='pack/maid' & $indpack_maid_horny[1]='pack/horny' & $indpack_maid_rebel[1]='pack/rebel' & jo9_test_files['content/pic/pack/horny.png']=1 & jo9_test_files['content/pic/pack/rebel.png']=1",call,[['$probe',html('pack/horny')]]);
scenario('new-only with empty actor cache',setup+" & $assistant['fullimage']='' & $indpack_naked[1]='pack/naked' & jo9_test_files['content/pic/pack/naked.png']=1",call,[['$probe',html('pack/naked')]]);
scenario('valid custom actor cache after missing role',setup+" & assistant['image_mode']=2 & $assistant['fullimage']='custom/valid' & $fullmade[1]='legacy/maid' & $indpack_maid[1]='pack/missing' & jo9_test_files['content/pic/custom/valid.png']=1 & jo9_test_files['content/pic/legacy/maid.png']=1",call,[['$probe',html('custom/valid')]]);
scenario('same pack normal after missing mood',setup+" & assistant['image_mode']=2 & assistant['arousal']=5 & $fullmade[1]='legacy/maid' & $indpack_maid[1]='pack/maid' & $indpack_maid_horny[1]='pack/missing' & jo9_test_files['content/pic/pack/maid.png']=1 & jo9_test_files['content/pic/legacy/maid.png']=1",call,[['$probe',html('pack/maid')]]);
const clicks=core.literals(bodies.get('assistant_stat')).filter(x=>x.text.includes('EXEC:')&&x.text.includes("$assistant['fullimage'] = func('jo9_seed_role_images'"));
assert.equal(clicks.length,4);
for(const [mode,key,pack]of [[0,'fullimage','indpack_title'],[1,'fullmistress','indpack_dom'],[2,'fullmade','indpack_maid'],[3,'fullsecretary','indpack_secr']]){
 const literal=clicks.find(x=>x.text.includes(`assistant['image_mode'] = ${mode}`)).text;
 const actual=literal.match(/EXEC: (.*?) & gt \$curloc/)[1];
 scenario(`actual new-only assistant click ${mode}`,`assistant_type=1 & $${pack}[1]='pack/click' & jo9_test_files['content/pic/pack/click.png']=1`,actual,[["$assistant['fullimage']",'pack/click'],["assistant['image_mode']",mode]]);
}
scenario('read-only registry/custom and locals',"$fullimage[1]='legacy/base' & $indpack_title[1]='pack/base' & $assistant['fullimage']='custom/valid' & jo9_test_files['content/pic/custom/valid.png']=1 & $jo9_lookup_candidates='sentinel'","$probe=func('jo9_seed_role_images','resolve',1,$assistant['fullimage'],'fullimage')",[["$assistant['fullimage']",'custom/valid'],['$fullimage[1]','legacy/base'],['$indpack_title[1]','pack/base'],['$jo9_lookup_candidates','sentinel']]);
scenario('display local key restores saved caller value',setup+" & $jo9_full_old_key='sentinel' & $indpack_naked[1]='pack/naked' & jo9_test_files['content/pic/pack/naked.png']=1",call,[['$jo9_full_old_key','sentinel']]);
code.push(`msg '${marker}'`);
const nativePathLine="$jo9_lookup_path='content/pic/'+$jo9_lookup_candidates[jo9_lookup_k]+'.png'";
const helper=bodies.get('jo9_seed_role_images').replace(nativePathLine,"$jo9_lookup_path=$jo9_native_fixture_root+'content/pic/'+$jo9_lookup_candidates[jo9_lookup_k]+'.png'");
const shift=x=>core.shift(x.replace(/\r?\n/g,'\r\n'),-5);
const records=new Map([['Start',code.join('\r\n')],['jo9_seed_role_images',helper],['display_fullimage',bodies.get('display_fullimage')],['interior_change','$result=$args[1]']]);
const data=Buffer.from(['QSPGAME','','',shift(String(records.size)),...[...records].flatMap(([n,b])=>[shift(n),'',shift(b),shift('0')]),''].join('\r\n'),'utf16le');
assert.ok(core.serialize(core.parse(data)).equals(data));
const file=path.join(out,'girl-image-consumers.qsp');fs.writeFileSync(file,data);
fs.writeFileSync(path.join(out,'consumer-plan.json'),JSON.stringify([{name:'girl-image-consumers',file,marker,checkpoint:'actual display_fullimage and assistant click code with production resolver'}],null,2));
fs.writeFileSync(path.join(out,'consumer-fixture-manifest.json'),JSON.stringify({file,marker,tests,scenarios:manifest,hash:core.hash(data),adapter:'Only native fixture relative content-root prefix; actual display and click code. Interior HTML helper stub is unused for tested center_image slot.'},null,2)+'\n');
console.log(JSON.stringify({file,marker,tests,launched:false}));
