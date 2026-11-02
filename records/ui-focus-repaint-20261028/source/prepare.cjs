'use strict';
// D15 원인 비교용 QA 화면 한 개만 준비한다. 엔진을 실행하거나 WORK에 쓰지 않는다.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const {primeState}=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const work='G:/somi/Jack O Nine Tails v2.4_work/game';
const out=path.resolve('G:/Codex/tmp/jo9-ui-focus-repaint-20261028/baseline');
const engine=work+'/engine/jack.exe',gold=work+'/save/JO9_GOLD_AP_CHECK_20261026.sav';
const raw=fs.readFileSync(work+'/jack.qsp'),doc=c.parse(raw),saveRaw=fs.readFileSync(gold),save=sc.parse(saveRaw);
assert.equal(doc.hash,'f6520ef11a720f6d15127738032be960acc1153eb653e2760495b880e85cef97');
assert.equal(c.hash(fs.readFileSync(engine)),'f75032d79ecb58eeb7b969cd3f774d66b091fca38a360acdabd782e03a46c6e6');
assert(sc.serialize(save).equals(saveRaw));
assert.equal(out,path.resolve('G:/Codex/tmp/jo9-ui-focus-repaint-20261028/baseline'));
assert(!fs.existsSync(out),'기존 fixture는 덮어쓰지 않는다.');
const protectedPaths=[work+'/jack.qsp',engine,gold,work+'/config.xml',...fs.readdirSync(work+'/css').filter(x=>x.endsWith('.css')).map(n=>work+'/css/'+n),work+'/content/js/jo9_traits_view.js',work+'/content/js/jo9_word_wrap.js'];
const protectedInputs=protectedPaths.map(p=>({path:p,sha256:c.hash(fs.readFileSync(p))}));
const originalBodies=new Map(doc.locations.map(l=>[l.name,doc.lines[l.body]]));
const changed=[];
function put(name,source){const l=doc.locations.find(l=>l.name===name);assert(l,name);doc.lines[l.body]=c.shift(source.replace(/\r?\n/g,'\r\n'),-5);changed.push(name);}
const primer=primeState(save);
const q=s=>"'"+String(s).replace(/'/g,"''")+"'";
const baseProfile=c.shift(doc.lines[doc.locations.find(l=>l.name==='slave_stat').body],5);
// 탭을 고정해 속성/특성 관찰 중 설정·소지품 동작으로 들어가지 않게 한다.
put('slave_stat',"! QA 전용: 실제 프로필 렌더러 앞에서 탭만 고정한다.\r\nslave_stat_screen=0\r\npresets_list=0\r\n"+baseProfile);
// 기존 UI가 직접 호출하는 계산과 날짜 lifecycle을 격리한다.
put('$newloc',"! QA 전용: 계산하지 않고 특성 전체보기의 원래 다시 열기 상태만 기억한다.\ngs 'jo9_traits_view','remember'");
put('$slave_price',"! QA 전용: GOLD prime의 표시 등급을 사용하며 가격·능력을 재계산하지 않는다.");
put('$slave_traits',"! QA 전용: 발견/XP 검사를 생략하고 원래 특성 목록 HTML builder만 사용한다.\ndynamic $do_for_each_slave_in_list,'$update_slave_features_list','$main_screen_slave_characters'");
put('display_fullimage',"! QA 전용: 원래 중앙 이미지 wrapper와 현행 CSS를 유지하고 단색 파일만 표시한다.\n$result='<div id=\"<<$args[1]>>\"><img src=\"qa_blank.svg\"></div>'");
const blocked=['menu_form','city_menu_form','interaction','interaction_city','main_screen','next_day'];
for(const name of blocked)put(name,"! QA 전용: 계산·교육·날짜·거래에 진입하지 않고 테스트 프로필로 돌아간다.\ngt 'slave_stat'");
const setup=[
 'killall','usehtml=1','SHOWOBJS 0','SHOWACTS 0','SHOWINPUT 0','SHOWSTAT 0',"$FNAME='Sandoll 미생'",primer.code,
 "gs 'refresh_database'", "$onnewloc=''", "$ongload=''", "$onobjsel=''", "$counter=''",'settimer 0','sound_on=0','autosave=0','autosave_day=0','autosave_decade=0','decadesave=0',
 'is_home=1','city_district=-1','menu_form=0','snk_room_target=0','snk_room_inventory=0','exam_in_progress=0','nsfw=0','use_custom_data=0',
 'slave_state=1','slave_type=2579',"$slave_name='에게야 (UI 검증)'","$slave_psy_status='obedient'","slave['age']=2","slave['age_count']=100", "$slave['cloth']='maid_dress'","$slave['ava_clear']='content/pic/blank_ava'","$slave['ava']='content/pic/blank_ava'",
 'slave_stat_screen=0','presets_list=0','rating=4','relative_rating=2',"$rating_help=$rank_help", "$info_text='좌측 속성 설명 또는 특성 전체보기를 선택하세요.'", "$equip_choice=''",
 "slave['grace']=1","slave['dexterity']=-1","slave['sport_affinity']=1","slave['jo9_ambition']=1","slave['jo9_ambition_known']=1","slave['jo9_focus']=-1","slave['jo9_focus_known']=1","slave['jo9_grudge']=1","slave['jo9_grudge_known']=1","slave['jo9_constitution']=1","slave['jo9_learning_trait']=1",
 "slave['nymphomania']=0","slave['masochism']=0","slave['exhibitionism']=0","slave['perversion']=0","slave['homosexualism']=0","slave['metabolism']=3","slave['oral_affinity']=0","slave['anal_affinity']=0","slave['jo9_gag_reflex']=0","slave['jo9_voice_trait']=0","slave['defiant']=0","slave['jo9_ambition']=1","slave['pregnant']=0","slave['parasite']=0","slave['wounds']=0","slave['lactation']=0",
 "gt 'slave_stat'"
].join('\n');
put('Start',setup);
// HTML·도움말·특성 선택기와 스크립트는 원래 QSP 본문 그대로다.
for(const name of ['jo9_traits_view','stats_layout','$addon','#help_msg','jo9_traits']){const l=doc.locations.find(l=>l.name===name);assert.equal(doc.lines[l.body],originalBodies.get(name),name+' 원문 보존');}
const fixture=c.serialize(doc);assert(c.serialize(c.parse(fixture)).equals(fixture));
fs.mkdirSync(out,{recursive:true});
const junctions=[];
for(const rel of ['content','css','fonts','json']){const target=fs.realpathSync(work+'/'+rel),link=path.join(out,rel);fs.symlinkSync(target,link,'junction');junctions.push({path:link,target,readOnlyByTask:true});assert(fs.lstatSync(link).isSymbolicLink());}
const config=fs.readFileSync(work+'/config.xml');assert.equal(config[0],255);assert.equal(config[1],254);
fs.writeFileSync(path.join(out,'config.xml'),Buffer.from(config.toString('utf16le').replace(/title="[^"]*"/,'title="JO9 D15 포커스·재도색 QA baseline"'),'utf16le'));
fs.copyFileSync(work+'/icon.ico',path.join(out,'icon.ico'));
fs.writeFileSync(path.join(out,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
fs.writeFileSync(path.join(out,'qa_blank.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="500" height="720" viewBox="0 0 500 720"><rect width="500" height="720" fill="#d8d2c6"/></svg>\n');
const qsp=path.join(out,'focus-baseline.qsp');fs.writeFileSync(qsp,fixture);
for(const p of protectedInputs)assert.equal(c.hash(fs.readFileSync(p.path)),p.sha256,p.path+' 보호');
const report={status:'PREPARED_NOT_LAUNCHED',qsp,fixtureSha256:c.hash(fixture),workingDirectory:out,engine,launchArgs:[qsp],sourceWorkSha256:c.hash(raw),engineSha256:c.hash(fs.readFileSync(engine)),gold:{path:gold,sha256:c.hash(saveRaw),mode:'숫자와 짧은 문자열을 합성 prime. loadgame/GUI 세이브 로드는 없음.',assignments:primer.assignments},centralImage:'단색 qa_blank.svg; 원래 center_image wrapper 및 현행 CSS 사용',changedLocations:changed,unchangedRenderers:['jo9_traits_view','stats_layout','$addon','#help_msg','jo9_traits'],blockedDestinations:blocked,callbacksDisabled:['$onnewloc','$ongload','$onobjsel','$counter'],junctions,protectedInputs,workChanged:false,engineChanged:false,saveWritten:false,recordsWritten:false,automaticEngineRun:false,limitations:['현재 실제 slave_stat HTML을 엔진이 생성하도록 준비했으나 이 단계에서는 실행하지 않았다.','$newloc/가격/특성 발견 계산을 격리하여 도움말·색상·포커스/선택/전체보기 동작만 관찰한다.','중앙 이미지는 단색이며 프로필 탭은0으로 고정된다.','junction은 현행 WORK 리소스에 연결되므로 사용 중 CSS/JS를 변경하면 baseline도 바뀐다.'],repeatActions:['좌측 체력·지성·성격 등 등급 링크를 클릭하고 원래 도움말을 닫은 뒤 빈 중앙 영역으로 포인터를 옮긴다.','좌측 색상이 다른 특성을 차례로 클릭한다.','노예의 특성 제목(전체보기)을 열고 항목 선택·닫기·다른 속성 클릭을 반복한다.'],cleanup:'게임 창을 닫은 뒤 cleanup.ps1로 known fixture 파일과 junction 자체만 제거. junction 대상을 재귀 순회하지 않는다.'};
fs.writeFileSync(__dirname+'/prepared.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,qsp,workingDirectory:out,engine,launchArgs:report.launchArgs,changedLocations:changed,primeAssignments:primer.assignments,protectedUnchanged:true,automaticEngineRun:false}));
