'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),z=require('node:zlib');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const tmp='G:/Codex/tmp/gold-balance-20261026',rec=repo+'/records/gold-balance-display-20261026';
const id='2026-10-26_gold_balance_exchange',expected='ed7f14b5a892f2dc695e8b90a29dfd1331c31536b604911fb2fddd9af8107648';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const get=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),set=(d,n,b)=>d.lines[d.locations.find(l=>l.name===n).body]=c.shift(b.replace(/\r?\n/g,'\r\n'),-5);
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'),q=s=>"'"+s.replaceAll("'","''")+"'";
const save=game+'/save/JO9_GOLD_AP_CHECK_20261026.sav';
if(process.argv[2]==='prepare'){
 assert(!fs.existsSync(tmp)&&!fs.existsSync(rec));
 const before=fs.readFileSync(game+'/jack.qsp');assert.equal(c.hash(before),expected);qa.inspectWorld(before);
 const d=c.parse(before),edits=[];
 function replace(loc,old,next){const b=get(d,loc);assert.equal(b.split(old).length,2);set(d,loc,b.replace(old,next));edits.push({location:loc,field:'body',old,new:next,count:1});}
 replace('shop_general',"*p '<div id = \"text\"><<$jo9_shop_narrative>></div>'",[
  '! JO9 MOD START GOLD_BALANCE_MENU_20261026 | '+id,
  "if $place = 'balsam_boutique' and sp_txt = 2: $jo9_shop_narrative = '보유 금화: <<gold>>개'",
  "*p '<div id = \"text\"><<$jo9_shop_narrative>></div>'",
  '! JO9 MOD END GOLD_BALANCE_MENU_20261026'].join('\r\n'));
 replace('interaction_screen_city',"*p '<div id = \"text\"><<$text[txt]>></div>'",[
  '! JO9 MOD START GOLD_BALANCE_RESULT_20261026 | '+id,
  'local $jo9_gold_result_text = $text[txt]',
  "if $place = 'balsam_boutique' and interaction_city >= 302110 and interaction_city <= 302114:",
  " $jo9_gold_result_text += '<br><br>보유 금화: <<gold>>개'",
  'end',
  "*p '<div id = \"text\"><<$jo9_gold_result_text>></div>'",
  '! JO9 MOD END GOLD_BALANCE_RESULT_20261026'].join('\r\n'));
 const after=c.serialize(d);qa.inspectWorld(after);assert(c.serialize(c.parse(after)).equals(after));
 fs.mkdirSync(tmp,{recursive:true});fs.mkdirSync(rec,{recursive:true});fs.mkdirSync(tmp+'/patches');
 fs.writeFileSync(tmp+'/before.qsp',before);fs.writeFileSync(rec+'/before.qsp.gz',z.gzipSync(before));fs.writeFileSync(tmp+'/candidate.qsp',after);
 const patch={id,before_sha256:expected,after_sha256:c.hash(after),edits};write(tmp+'/patches/'+id+'.json',patch);write(rec+'/patch.json',patch);write(repo+'/mods/'+id+'.json',patch);
 fs.copyFileSync(__filename,rec+'/reproduce.cjs');
 const protectedFiles=[save,game+'/config.xml',game+'/css/base.css','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp','G:/somi/JO9O/game/jack.qsp'];
 write(rec+'/protected.json',protectedFiles.map(file=>({file,sha256:c.hash(fs.readFileSync(file))})));
 const dir=tmp+'/native';fs.mkdirSync(dir);for(const n of ['content','css','fonts'])fs.symlinkSync(game+'/'+n,dir+'/'+n,'junction');fs.cpSync(game+'/json',dir+'/json',{recursive:true});fs.copyFileSync(game+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 const prime=qa.primeState(sc.parse(fs.readFileSync(save))),plan=[];
 for(const [name,loc,amount,screen,city,want]of [
  ['menu-zero','shop_general',0,2,3021,true],['menu-positive','shop_general',17,2,3021,true],
  ['result-positive','interaction_screen_city',10,2,302110,true],['result-zero','interaction_screen_city',0,2,302114,true],
  ['ordinary-dialogue','shop_general',17,1,3021,false]]){
  const probe=c.parse(after),marker='JO9_QA_GOLDBAL_'+name.replaceAll('-','_')+'_COMPLETE';
  const assertion="msg $iif(gold = "+amount+" and sparks = 5000, '"+marker+"', 'FAIL_GOLD_BALANCE_STATE_CHANGED')";
  const js='setTimeout(function(){var e=document.getElementById("text"),s=e?e.textContent:"",ok='+(want?'s.indexOf('+JSON.stringify('보유 금화: '+amount+'개')+')>=0':'e&&s.indexOf("보유 금화:")<0')+';var a=document.createElement("a");a.href="EXEC:"+(ok?'+JSON.stringify(assertion)+':"msg \'FAIL_GOLD_BALANCE_DISPLAY\'");document.body.appendChild(a);var ev=document.createEvent("MouseEvents");ev.initMouseEvent("click",true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(ev);},350);';
  set(probe,loc,get(probe,loc)+'\r\n*p '+q('<script type="text/javascript">'+js+'</script>'));
  set(probe,'Start',['killall','settimer 0',prime.code,"$counter=''","$ongload=''","$onnewloc=''","gs 'refresh_database'","$counter=''","$ongload=''","$onnewloc=''",'settimer 0','autosave=0','decadesave=0','autosave_day=0','autosave_decade=0','sound_on=0','usehtml=1','nsfw=1','snk_room_target=0','is_home=0','sparks=5000','gold='+amount,"$place='balsam_boutique'","copyarr '$display_options','$balsam_boutique_options'",'sp_txt='+screen,'interaction_city='+city,'txt=1',"killvar '$special_image'","killvar '$special_action'","$text[1]='환전을 마쳤다.'","gt "+q(loc)].join('\r\n'));
  const file=dir+'/'+name+'.qsp',bytes=c.serialize(probe);qa.inspectWorld(bytes);fs.writeFileSync(file,bytes);plan.push({name,file,marker,checkpoint:'Native lower-description gold text and unchanged currency; manual physical play deferred to user.'});
 }
 write(dir+'/plan.json',plan);write(rec+'/prepared.json',{before:expected,after:c.hash(after),changedLocations:edits.map(e=>e.location),nativeCases:plan.length,newLocations:0,newPersistentFields:0,save});
 console.log(JSON.stringify({candidate:tmp+'/candidate.qsp',before:expected,after:c.hash(after),nativeCases:plan.length}));
}else if(process.argv[2]==='install'){
 const release=JSON.parse(fs.readFileSync(process.argv[3],'utf8')),native=JSON.parse(fs.readFileSync(tmp+'/native/client-results.json','utf8').replace(/^\uFEFF/,''));assert.equal(release.verdict,'PASS');assert.equal(native.length,5);assert(native.every(v=>v.pass));
 const patch=JSON.parse(fs.readFileSync(rec+'/patch.json','utf8')),candidate=fs.readFileSync(tmp+'/candidate.qsp');assert.equal(c.hash(candidate),patch.after_sha256);assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),expected);
 for(const p of JSON.parse(fs.readFileSync(rec+'/protected.json','utf8')))assert.equal(c.hash(fs.readFileSync(p.file)),p.sha256,p.file);
 fs.copyFileSync(process.argv[3],rec+'/release-report.json');fs.copyFileSync(tmp+'/native/client-results.json',rec+'/native-results.json');for(const p of native)fs.copyFileSync(tmp+'/native/'+p.name+'-stderr.log',rec+'/'+p.name+'-stderr.log');
 fs.writeFileSync(game+'/jack.qsp',candidate);assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),patch.after_sha256);
 write(rec+'/FINAL_RESULT.json',{status:'WORK_APPLIED',before:expected,after:patch.after_sha256,releaseVerdict:release.verdict,nativeCases:5,saveUnchanged:true,fullSynced:false,committed:false,pushed:false,manualPlay:'Left to user; native checks do not prove physical layout.'});
 fs.writeFileSync(rec+'/MANUAL_KO.md','# 환전 화면 보유 금화\n\n입력은 기존 gold이며 출력은 환전 화면 하단의 “보유 금화: N개”다. shop_general의 GOLD_BALANCE_MENU_20261026은 발삼 환전 메뉴(sp_txt=2)에서만 로컬 대사 문자열을 설정한다. interaction_screen_city의 GOLD_BALANCE_RESULT_20261026은 발삼 환전 결과302110~302114에서 기존 대사 뒤에 잔액을 덧붙인다. 역환전 후에는 0개를 표시한다. 기존 div#text와 폰트·배치를 사용하며 새 UI·CSS·저장 변수·금액 변경은 없다. 기존 세이브의 메뉴 캐시도 그대로 사용한다. 삭제하려면 patch.json의 두 블록을 역적용하면 된다.\n\n공식 출고 검사 PASS(실제 엔진9경로, 구조/개행/주석 경계, 패치 재생/재적용), 별도 실제 엔진5경로(0/양수 메뉴, 0/양수 결과, 일반 대화 제외) PASS. 이 검사는 DOM 문구와 통화 불변을 확인하며 물리적 화면 배치·실제 플레이는 사용자가 확인한다. 기존 확인용 세이브는 변경하지 않았다. WORK QSP만 반영, Full·ZIP·커밋·푸시 없음.\n');
 fs.appendFileSync(repo+'/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md','\n\n## WORK 적용 — GOLD_BALANCE_EXCHANGE_APPLIED_20261026\n\n아그라바 발삼 환전 화면 하단 설명칸과 환전 결과 대사에 보유 금화를 표시한다. 0개도 표시하며 기존 금화·스파크 산식과 저장 값은 유지한다. QSP 한 파일, 공식 엔진9·표시5경로 PASS. 수동 화면 확인은 사용자 담당. 기존 확인용 세이브 유지, Full·ZIP·커밋·푸시 없음. [동작·검증 한계](../records/gold-balance-display-20261026/MANUAL_KO.md).\n');
 console.log(JSON.stringify({installed:true,hash:patch.after_sha256,saveUnchanged:true}));
}else throw Error('prepare or install <release report>');
