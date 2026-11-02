'use strict';
// Isolated native event/counter checks. Never renders source narrative or images.
const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game';
const T='G:/Codex/tmp/erza-branches-traits-20261101-events';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs');
const source=process.argv[2]||'G:/Codex/tmp/erza-branches-traits-20261101/candidate.qsp';
const expectedPrefix=process.argv[3]||'9a4bba24';
const raw=fs.readFileSync(source),sourceHash=c.hash(raw);assert(sourceHash.startsWith(expectedPrefix),'candidate SHA changed');
const d=c.parse(raw),cr=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+String(s).replaceAll("'","''")+"'";
const body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
const originals={interaction_city:body('interaction_city'),interaction_result_city:body('interaction_result_city'),interaction_screen_city:body('interaction_screen_city')};
const normalizationEnd='! JO9 MOD END ERZA_BRANCH_IMAGES_TRAITS_20261101';
assert(originals.interaction_screen_city.startsWith('! JO9 MOD START ERZA_BRANCH_IMAGES_TRAITS_20261101'));
const normalization=originals.interaction_screen_city.slice(0,originals.interaction_screen_city.indexOf(normalizationEnd)+normalizationEnd.length);
assert(normalization.includes('erza_dead_after.png')&&normalization.includes('66677921')&&normalization.includes('66677922'));
function set(n,s){const l=d.locations.find(l=>l.name===n);assert(l);d.lines[l.body]=c.shift(cr(s),-5);}
function add(n,s){d.lines.splice(-1,0,c.shift(n,-5),'',c.shift(cr(s),-5),c.shift('0',-5));d.lines[3]=c.shift(String(d.locations.length+1),-5);d.locations=c.parse(c.serialize(d)).locations;}
const lines=[],cases=[];let assertions=0,model={score:0,a:0,b:0,ta:0,tb:0};
const emit=(...x)=>lines.push(...x);
function reset({whole=0,half=0,old21=0,old22=0,missingHalf=false}={}){
 model={score:whole*2+half,a:old21,b:old22,ta:0,tb:0};
 emit('jo9_cruel_mercy = '+whole,missingHalf?"killvar 'jo9_cruel_mercy_half'":'jo9_cruel_mercy_half = '+half,
  "city_already_done_ever['66677921'] = "+old21,"city_already_done_ever['66677922'] = "+old22,
  "city_already_done_today['66677921'] = 0","city_already_done_today['66677922'] = 0",
  "city_already_done_ever['6667792'] = 1","unique_slave['erza'] = 1",
  "$text[1] = 'QA cached-page placeholder'","snk_room_target = 0","is_home = 0");
}
function run(id,label){
 if(model.a===0&&model.b===0)model.score+=id===66677921?6:-2;
 if(id===66677921){model.a++;model.ta++;}else{model.b++;model.tb++;}
 const image='scene\\others\\erza_dead_after_'+(id===66677921?'1':'2')+'.png';
 cases.push({id,label,expectedHalfUnits:model.score,ever:[model.a,model.b],today:[model.ta,model.tb],image});
 emit('qa_erza_case = '+cases.length,'qa_erza_expected_score = '+model.score,
  'qa_erza_expected_a = '+model.a,'qa_erza_expected_b = '+model.b,
  'qa_erza_expected_ta = '+model.ta,'qa_erza_expected_tb = '+model.tb,
  '$qa_erza_expected_image = '+q(image),'interaction_city = '+id,"gt 'interaction_city'");
}
function cached(id,label,initialImage,expectedImage){
 cases.push({id,label,mode:'cached-renderer-only',expectedHalfUnits:model.score,ever:[model.a,model.b],today:[model.ta,model.tb],image:expectedImage});
 emit('qa_erza_case = '+cases.length,'qa_erza_expected_score = '+model.score,
  'qa_erza_expected_a = '+model.a,'qa_erza_expected_b = '+model.b,
  'qa_erza_expected_ta = '+model.ta,'qa_erza_expected_tb = '+model.tb,
  '$qa_erza_expected_image = '+q(expectedImage),'interaction_city = '+id,
  '$special_image[1] = '+q(initialImage),'txt_count = 1',"gt 'interaction_screen_city'");
}
emit('killall','usehtml = 0','SHOWOBJS 0','SHOWACTS 0','SHOWINPUT 0','SHOWSTAT 0',
 "gs 'refresh_database'","gs 'init_game'","$onnewloc = ''","$counter = ''",'settimer 0',
 'sound_on = 0','autosave = 0','decadesave = 0',"gs '#static_base'","gs '#dynamic'","gs '#options'",
 '$master_name = '+q('QA'),'hero_choice = 13','master_energy = 10','master_mood = 0',
 "slave_state = CONST_INT['no_slave']","assistant_state = CONST_INT['no_slave']",
 'one_time_conversion_of_interaction_counter_arrays = 1','newloc_do_once_per_game = 1',
 'qa_erza_renders = 0','qa_erza_assertions = 0');
reset();run(66677921,'first-choice21');run(66677921,'same-choice-repeat');run(66677922,'opposite-after21');run(66677921,'back-return21');
reset();run(66677922,'first-choice22');run(66677921,'opposite-after22');run(66677922,'back-return22');
reset({whole:4,old21:1});run(66677922,'legacy-completed21');
reset({whole:-4,old22:1});run(66677921,'legacy-completed22');
reset({old21:1,old22:1});run(66677921,'legacy-both-completed');
for(const [half,id]of [[1,66677921],[-1,66677921],[1,66677922],[-1,66677922]]){reset({half});run(id,'half-remainder-'+half+'-'+id);}
reset({whole:2,missingHalf:true});run(66677922,'legacy-missing-half-positive');
reset({whole:-2,missingHalf:true});run(66677921,'legacy-missing-half-negative');
reset({whole:-2,half:-1});run(66677921,'negative-to-positive-half');
const retired='scene\\others\\erza_dead_after.png';
reset({whole:2,half:1,old21:1});cached(66677921,'cached21-retired-image',retired,'scene\\others\\erza_dead_after_1.png');
reset({whole:-2,half:-1,old22:1});cached(66677922,'cached22-retired-image',retired,'scene\\others\\erza_dead_after_2.png');
reset({whole:3,old21:1});cached(66677921,'cached-custom-image-retained','scene/others/qa_custom.png','scene/others/qa_custom.png');
const marker='JO9_QA_ERZA'+sourceHash.slice(0,8).toUpperCase()+'_events_COMPLETE';
emit('if qa_erza_renders ! '+cases.length+": msg 'FAIL_ERZA_render_count' & exit",
 'if qa_erza_assertions ! '+(cases.length*7)+": msg 'FAIL_ERZA_assertion_count' & exit",'msg '+q(marker));
const check=(bad,label)=>{assertions++;return "qa_erza_assertions += 1\nif "+bad+": msg 'FAIL_ERZA_"+label+"' & exit";};
set('interaction_screen_city',[
 normalization,
 'qa_erza_renders += 1',
 check('2 * jo9_cruel_mercy + jo9_cruel_mercy_half ! qa_erza_expected_score','score'),
 check("city_already_done_ever['66677921'] ! qa_erza_expected_a or city_already_done_ever['66677922'] ! qa_erza_expected_b",'ever-counters'),
 check("city_already_done_today['66677921'] ! qa_erza_expected_ta or city_already_done_today['66677922'] ! qa_erza_expected_tb",'today-counters'),
 check('$special_image[1] ! $qa_erza_expected_image','image-reference'),
 check("unique_slave['erza'] ! 1",'unique-state'),
 check('txt_count ! 1','page-count'),
 check("len($text[1]) < 1",'nonempty-result'),
 'gt $qa_erza_next'
].join('\n'));
let start=0,stage=0;
for(let i=0;i<lines.length;i++)if(lines[i]==="gt 'interaction_city'"||lines[i]==="gt 'interaction_screen_city'"){
 const chunk=lines.slice(start,i),next='qa_erza_stage_'+(stage+1);chunk.push('$qa_erza_next = '+q(next),lines[i]);
 add('qa_erza_stage_'+stage,chunk.join('\n'));start=i+1;stage++;
}
add('qa_erza_stage_'+stage,lines.slice(start).join('\n'));set('Start',"gt 'qa_erza_stage_0'");
assert.equal(body('interaction_city'),originals.interaction_city);assert.equal(body('interaction_result_city'),originals.interaction_result_city);
const bytes=c.serialize(d);qa.inspectWorld(bytes);
fs.mkdirSync(T,{recursive:true});for(const n of ['content','css','fonts','json'])if(!fs.existsSync(T+'/'+n))fs.symlinkSync(fs.realpathSync(W+'/'+n),T+'/'+n,'junction');
fs.copyFileSync(W+'/config.xml',T+'/config.xml');fs.writeFileSync(T+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
fs.writeFileSync(T+'/events.qsp',bytes);fs.writeFileSync(T+'/plan.json',JSON.stringify([{name:'erza-events',file:T+'/events.qsp',marker,checkpoint:'Actual city controller and actual common completion counters; scene renderer replaced by assertions only.'}],null,2));
const textHashes=[];for(const id of [66677921,66677922]){
 const s=originals.interaction_city,hs=[...s.matchAll(/^\s*(?:if|elseif)\s+interaction_city\s*=\s*(\d+)\s*:/gim)],k=hs.findIndex(h=>+h[1]===id),branch=s.slice(hs[k].index,hs[k+1]?.index);
 textHashes.push({id,branchSha256:c.hash(Buffer.from(branch,'utf8'))});
}
const targetAssets=[1,2].map(i=>{const relative='content/pic/scene/others/erza_dead_after_'+i+'.png',p=W+'/'+relative,exists=fs.existsSync(p),st=exists?fs.statSync(p):null;return{path:relative,exists,bytes:st?.size||0,contentRead:false};});
assert(body('interaction_screen_city').startsWith(cr(normalization)));
const setup={sourceSha256:sourceHash,diagnosticSha256:c.hash(bytes),cases,assertionsPerCase:assertions,totalAssertions:assertions*cases.length,sourceBranchHashes:textHashes,targetAssets,rendererNormalizationSha256:c.hash(Buffer.from(cr(normalization),'utf8')),
 actualCityControllerPreserved:true,actualCompletionControllerPreserved:true,sceneRendererOnlyStub:true,productionWrites:0,privateSavesRead:false,sensitiveTextRendered:false,imageContentReadOrRendered:false,
 limits:['Native control/state tests only. No screenshots of source scenes or actual image composition are examined.','Back/return is simulated by current-handler re-entry while completion counters are retained; this is not mouse-button navigation.','Source prose is represented only by branch hashes and nonempty-array assertions.']};
fs.writeFileSync(__dirname+'/native-events-setup.json',JSON.stringify(setup,null,2)+'\n');
if(process.argv.includes('--prepare-only')){console.log(JSON.stringify({prepared:true,sourceSha256:sourceHash,cases:cases.length,assertions:setup.totalAssertions}));process.exit(0);}
const runClient=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/qa/run-client-smoke.ps1','-Engine',W+'/engine/jack.exe','-Plan',T+'/plan.json','-TimeoutSeconds','30'],{windowsHide:true,encoding:'utf8',timeout:45000});
fs.writeFileSync(T+'/runner.log',(runClient.stdout||'')+(runClient.stderr||''));
let client=[];if(fs.existsSync(T+'/client-results.json'))client=JSON.parse(fs.readFileSync(T+'/client-results.json','utf8').replace(/^\uFEFF/,''));
const report={...setup,pass:runClient.status===0&&client.length>0&&client.every(x=>x.pass),runnerExit:runClient.status,client};
fs.writeFileSync(__dirname+'/report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,sourceSha256:sourceHash,cases:cases.length,assertions:setup.totalAssertions,client}));if(!report.pass)process.exitCode=1;
