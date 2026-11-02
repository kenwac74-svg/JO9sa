'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),a=require('assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',T=process.env.JO9_IC_NATIVE_ROOT||'G:/Codex/tmp/image-cut-conditions-native-20261101';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),sc=require(R+'/tools/qa/save-codec.cjs'),rules=require('./image-cut-condition-rules.cjs');
const q=s=>"'"+String(s).replaceAll("'","''")+"'",cr=s=>s.replace(/\r?\n/g,'\r\n');
const base='content/pic/scene/qa_conditions.png',money='content/pic/bg/qa_money.jpg',actor='content/pic/characters/qa_actor.png',plain='content/pic/scene/qa_plain.png',limit='content/pic/scene/qa_limit.png',registered='content/pic/bg/beach.png';
const cut=(b,n)=>b.replace(/(\.[^.]+)$/,' ('+n+')$1');
const rule=(b,n,v)=>({base:b,path:cut(b,n),morality:null,money:null,rank:null,reputation:null,...v});
const configured=[rule(base,2,{morality:{min:-10,max:-0.5},money:{op:'ge',value:100},rank:2,reputation:3}),rule(base,3,{morality:{min:0.5,max:10}}),rule(base,5,{money:{op:'ge',value:200}}),rule(money,2,{money:{op:'le',value:500}}),rule(money,3,{money:{op:'ge',value:501}}),rule(actor,2,{rank:0,reputation:0}),rule(limit,2,{money:{op:'ge',value:2147483647}}),rule(registered,2,{money:{op:'le',value:0}})];
const assertion=(expr,key)=>"qa_checks+=1\nif ("+expr+")=0: qa_failures+=1 & $qa_failed+="+q(key+'|')+'\n';
function prepare(){
 a(!fs.existsSync(T));qa.assertOutside(T,[R,W]);fs.mkdirSync(T,{recursive:true});
 const raw=fs.readFileSync(W+'/jack.qsp');fs.writeFileSync(T+'/baseline.qsp',raw);
 const doc=c.parse(raw),loc=doc.locations.find(x=>x.name==='interior_change'),old=c.shift(doc.lines[loc.body],5),inert=rules.installBaseBody(old),next=rules.buildBody(inert,configured);a.equal(rules.buildBody(next,[]),inert);
 const inertDoc=c.parse(raw);inertDoc.lines[inertDoc.locations.find(x=>x.name==='interior_change').body]=c.shift(inert,-5);const inertRaw=c.serialize(inertDoc);qa.inspectWorld(inertRaw);fs.writeFileSync(T+'/inert-baseline.qsp',inertRaw);
 doc.lines[loc.body]=c.shift(next,-5);const candidate=c.serialize(doc);qa.inspectWorld(candidate);fs.writeFileSync(T+'/candidate.qsp',candidate);
 const patch={id:'2026-11-01_image_cut_conditions_diagnostic',description:'Owned fixture appearance rules for actual engine verification',before_sha256:c.hash(raw),after_sha256:c.hash(candidate),edits:[{location:'interior_change',field:'body',old,new:next,count:1}]};fs.mkdirSync(T+'/mods');fs.writeFileSync(T+'/mods/'+patch.id+'.json',JSON.stringify(patch,null,2));
 const lines=["killall","usehtml=0","$counter=''","$ongload=''","$onnewloc=''","settimer 0","sound_on=0","autosave=0","decadesave=0","snk_room_target=0","qa_checks=0","qa_failures=0","$qa_failed=''","guild_reputation=2","brand_reputation=3","sparks=100","jo9_cruel_mercy=0","jo9_cruel_mercy_half=0"];
 const choice=(b,n,mode=0)=>"$qa_path=func('interior_change','jo9_path',"+q(b)+','+mode+")\n"+assertion('$qa_path='+q(n?cut(b,n):b),'path-'+b.split('/').pop()+'-'+n+'-'+mode);
 function test(name,setup,b,n){lines.push('! '+name,...setup,choice(b,n));}
 test('No condition met',["jo9_cut_choice["+q(base)+']=0'],base,0);
 test('All four conditions', ['jo9_cruel_mercy=-1'],base,2);
 test('Negative half-point boundary',['jo9_cruel_mercy=0','jo9_cruel_mercy_half=-1'],base,2);
 test('Insufficient money',['sparks=99'],base,0);
 test('Wrong rank',['sparks=100','guild_reputation=1'],base,0);
 test('Wrong reputation',['guild_reputation=2','brand_reputation=2'],base,0);
 test('Excluded neutral gap',['brand_reputation=3','jo9_cruel_mercy_half=0'],base,0);
 test('Positive half-point boundary',['jo9_cruel_mercy_half=1'],base,3);
 test('Positive upper threshold',['jo9_cruel_mercy=10','jo9_cruel_mercy_half=0'],base,3);
 test('Above configured range is not clamped',['jo9_cruel_mercy_half=1'],base,0);
 lines.push(assertion('jo9_cruel_mercy=10 and jo9_cruel_mercy_half=1','morality-unchanged'));
 test('Negative lower threshold',['jo9_cruel_mercy=-10','jo9_cruel_mercy_half=0'],base,2);
 test('Below configured range',['jo9_cruel_mercy_half=-1'],base,0);
 test('Overlapping B and fifth cut chooses B',['jo9_cruel_mercy=-2','jo9_cruel_mercy_half=0','sparks=250'],base,2);
 test('New fifth cut without old registry entry',['jo9_cruel_mercy=0'],base,5);
 test('Old unconfigured saved choice remains available',['sparks=100','jo9_cut_choice['+q(base)+']=10004'],base,4);
 lines.push('jo9_cut_choice['+q(base)+']=0',choice(base,4,1),assertion('jo9_image_count=2','manual-only-eligible-count'),choice(base,0,1));
 lines.push('jo9_cut_choice['+q(base)+']=10002',choice(base,2,2),choice(base,0),assertion('jo9_cut_choice['+q(base)+']=0','failed-saved-choice-falls-back'));
 test('JPG money below boundary',['sparks=499'],money,2);
 test('JPG money inclusive boundary',['sparks=500'],money,2);
 test('JPG above boundary',['sparks=501'],money,3);
 test('Zero rank and reputation are valid',['guild_reputation=0','brand_reputation=0'],actor,2);
 test('Zero rank and reputation mismatch',['brand_reputation=1'],actor,0);
 test('Largest native integer minus one',['sparks=2147483646'],limit,0);
 test('Largest native integer exact comparison',['sparks=2147483647'],limit,2);
 test('Existing registered cut preserves its original selection ID',['sparks=0'],registered,2);
 lines.push(assertion('jo9_cut_choice['+q(registered)+']=1','registered-id-remains-one'));
 test('Existing registered condition failure',['sparks=1'],registered,0);
 test('Unconfigured family saved ID',['jo9_cut_choice['+q(plain)+']=10003'],plain,3);
 lines.push(choice(plain,4,1),assertion('jo9_image_count=4','legacy-cycle-count'),choice(plain,0,1));
 lines.push("$qa_rule_unknown=str(func('interior_change','jo9_cut_condition',"+q(base)+','+q(cut(base,4))+'))',assertion("$qa_rule_unknown='-1'",'unconfigured-state'));
 const pureSetup=["sparks=250","guild_reputation=2","brand_reputation=3","jo9_cruel_mercy=-1","jo9_cruel_mercy_half=0",'jo9_cut_choice['+q(base)+']=10004','jo9_cut_choice['+q(money)+']=10003','jo9_cut_choice['+q(plain)+']=10004',"$jo9_visible_top='qa-kept-visible'","$jo9_last_button='<qa-kept-button>'","$jo9_clean_overlay='<qa-kept-overlay>'","jo9_clean_hidden=17","jo9_image_count=19"];
 const unchanged=()=>assertion("$jo9_visible_top='qa-kept-visible' and $jo9_last_button='<qa-kept-button>' and $jo9_clean_overlay='<qa-kept-overlay>' and jo9_clean_hidden=17 and jo9_image_count=19 and jo9_cut_choice["+q(base)+']=10004 and jo9_cut_choice['+q(money)+']=10003 and jo9_cut_choice['+q(plain)+']=10004','pure-keeps-ui-and-saved-choices');
 const doubleHtml='<div class="keep" data-keep="same"><img title="K" src = "'+base+'" width="795"><span>Keep text</span></div>',doubleExpected=doubleHtml.replace(base,cut(base,2));
 const singleHtml="<p><IMG alt='K' SRC = '"+base+"' class='same'></p>",singleExpected=singleHtml.replace(base,cut(base,2));
 const multiHtml='<section><img src="'+base+'"><img src=\''+money+'\'><img class="unchanged" src="'+plain+'"></section>',multiExpected=multiHtml.replace(base,cut(base,2)).replace(money,cut(money,2));
 const attributeHtml='<img data-src="'+base+'" src = "'+plain+'" width="44">';
 lines.push('! Pure conditional HTML and path cases',...pureSetup,
  '$qa_html=func(\'interior_change\',\'jo9_condition_html\','+q(doubleHtml)+')',assertion('$qa_html='+q(doubleExpected),'pure-double-quoted-html'),unchanged(),
  '$qa_html=func(\'interior_change\',\'jo9_condition_html\','+q(singleHtml)+')',assertion('$qa_html='+q(singleExpected),'pure-single-quoted-html'),unchanged(),
  '$qa_html=func(\'interior_change\',\'jo9_condition_html\','+q(multiHtml)+')',assertion('$qa_html='+q(multiExpected),'pure-multiple-image-tags'),unchanged(),
  '$qa_html=func(\'interior_change\',\'jo9_condition_html\','+q(attributeHtml)+')',assertion('$qa_html='+q(attributeHtml),'pure-does-not-change-data-src'),
  '$qa_html=func(\'interior_change\',\'jo9_condition_html\','+q('<div>No images & same text</div>')+')',assertion('$qa_html='+q('<div>No images & same text</div>'),'pure-no-image-unchanged'),
  '$qa_path=func(\'interior_change\',\'jo9_condition_path\','+q(plain)+')',assertion('$qa_path='+q(plain),'pure-unconfigured-path-unchanged'),
  '$qa_path=func(\'interior_change\',\'jo9_condition_path\','+q('content/pic/ui/approved_main_v1/tool_room.png')+')',assertion('$qa_path='+q('content/pic/ui/approved_main_v1/tool_room.png'),'pure-ui-path-unchanged'),
  '$qa_html_input='+q(doubleHtml),'$qa_html_expected='+q(doubleExpected),"gt 'main_screen'");
 const mainAdapter=['! Diagnostic entry to the real jo9_html current-location exclusion branch.','qa_screen_visits+=1',assertion("$curloc='main_screen'",'main-current-location'),"$qa_html=func('interior_change','jo9_html',$qa_html_input)",assertion('$qa_html=$qa_html_expected','main-exclusion-applies-conditions'),assertion("instr($qa_html,'jo9_image_cycle')=0 and instr($qa_html,'jo9_cutscene_view')=0",'main-no-added-cycle-ui'),unchanged(),"gt 'боевой_интерфейс'"].join('\n');
 const battleHtml='<div id="fight_bg"><img src = "'+money+'" style="width:795px;height:596px"></div>',battleExpected=battleHtml.replace(money,cut(money,2));
 const battleAdapter=['! Diagnostic current-location adapter; actual jo9_html function remains intact.','qa_screen_visits+=1',assertion("$curloc='боевой_интерфейс'",'battle-current-location'),'$qa_html=func(\'interior_change\',\'jo9_html\','+q(battleHtml)+')',assertion('$qa_html='+q(battleExpected),'battle-exclusion-applies-conditions'),assertion("instr($qa_html,'jo9_image_cycle')=0 and instr($qa_html,'jo9_cutscene_view')=0",'battle-no-added-cycle-ui'),unchanged(),"gt 'start_refresh'"].join('\n');
 const expectedAssertions=lines.filter(x=>x.includes('qa_checks+=1')).length+(mainAdapter.match(/qa_checks\+=1/g)||[]).length+(battleAdapter.match(/qa_checks\+=1/g)||[]).length+1;
 const plan=[];
 for(const phase of ['red','green']){
  const dir=T+'/'+phase;fs.mkdirSync(dir);for(const name of ['css','fonts','json'])fs.symlinkSync(fs.realpathSync(W+'/'+name),dir+'/'+name,'junction');fs.copyFileSync(W+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
  for(const b of [base,money,actor,plain,limit,registered])for(const n of [1,2,3,4,5]){const p=path.join(dir,n===1?b:cut(b,n));fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64'));}
  const d=c.parse(phase==='green'?candidate:inertRaw),start=d.locations.find(x=>x.name==='Start'),marker='JO9_QA_IMAGECOND_'+phase+'_COMPLETE';d.lines[start.body]=c.shift(cr(lines.join('\n')),-5);
  d.lines[d.locations.find(x=>x.name==='main_screen').body]=c.shift(cr(mainAdapter),-5);d.lines[d.locations.find(x=>x.name==='боевой_интерфейс').body]=c.shift(cr(battleAdapter),-5);
  const completion=[assertion('qa_screen_visits=2','both-excluded-screen-adapters-visited'),"savegame 'result.sav'","msg "+q(marker)].join('\n');d.lines[d.locations.find(x=>x.name==='start_refresh').body]=c.shift(cr(completion),-5);
  const fixture=c.serialize(d);qa.inspectWorld(fixture);fs.writeFileSync(dir+'/diagnostic.qsp',fixture);fs.writeFileSync(dir+'/plan.json',JSON.stringify([{name:'image-conditions',file:dir+'/diagnostic.qsp',marker,checkpoint:'Original jo9_path37 cases plus pureHTML/path and actual main/battle curloc exclusion dispatch; diagnostic screen adapters, not full gameplay renderer'}],null,2));
 }
 fs.writeFileSync(__dirname+'/native-prepared.json',JSON.stringify({baseline:c.hash(raw),inertBaseline:c.hash(inertRaw),candidate:c.hash(candidate),configured,world:qa.inspectWorld(candidate),existingV2Assertions:37,expectedAssertions,root:T,limits:['main_screen and battle locations use owned diagnostic adapters to establish real CURLoc and invoke the unmodified jo9_html function; unrelated full gameplay screen rendering is not tested.','All file and native operations are diagnostic-only.']},null,2));console.log('Native fixtures prepared: '+expectedAssertions+' assertions');
}
function run(phase){
 const dir=T+'/'+phase,p=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/qa/run-client-smoke.ps1','-Engine',W+'/engine/jack.exe','-Plan',dir+'/plan.json','-TimeoutSeconds','30'],{encoding:'utf8',windowsHide:true,timeout:45000});fs.writeFileSync(__dirname+'/native-'+phase+'-runner.log',(p.stdout||'')+(p.stderr||''));const client=JSON.parse(fs.readFileSync(dir+'/client-results.json','utf8').replace(/^\uFEFF/,'')),result={phase,processExit:p.status,client,completed:p.status===0&&client.every(x=>x.pass)};
 if(fs.existsSync(dir+'/result.sav')){const s=sc.parse(fs.readFileSync(dir+'/result.sav'));Object.assign(result,{checks:+sc.value(s,'qa_checks')[0],failures:+sc.value(s,'qa_failures')[0],failedKeys:sc.value(s,'qa_failed')[1]});}
 result.pass=result.completed&&(phase==='red'?result.failures>0:result.failures===0);fs.writeFileSync(__dirname+'/native-'+phase+'-report.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(!result.pass)process.exitCode=1;
}
if(process.argv[2]==='prepare')prepare();else run(process.argv[2]);
