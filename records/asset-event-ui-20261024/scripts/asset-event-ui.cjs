'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib'),cp=require('child_process'),assert=require('assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',root='G:/Codex/tmp/jo9-asset-event-ui-20261024',rec=repo+'/records/asset-event-ui-20261024';
const c=require(repo+'/tools/text-workshop/core.cjs'),s=require(repo+'/tools/qa/save-codec.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'),cr=s=>s.replace(/\r?\n/g,'\r\n');
const body=(d,n)=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),set=(d,n,t)=>d.lines[d.locations.find(x=>x.name===n).body]=c.shift(cr(t),-5);
const saveName='JO9_TEST_20261023_06_ISABELLA.sav',phase=process.argv[2],before='da6b23880a93e5850c981ed74e668f34dc7fd247b1913e2adcb5b6df19eaa1c9';
if(phase==='prepare'){
 for(const d of [root+'/inputs',root+'/patches',root+'/ui',rec+'/scripts',rec+'/evidence'])fs.mkdirSync(d,{recursive:true});const raw=fs.readFileSync(game+'/jack.qsp');assert.equal(c.hash(raw),before);qa.inspectWorld(raw);fs.writeFileSync(root+'/inputs/before.qsp',raw);fs.writeFileSync(rec+'/before.qsp.gz',zlib.gzipSync(raw,{level:9}));assert.equal(c.hash(zlib.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz'))),before);
 write(rec+'/inputs.json',[game+'/jack.qsp',game+'/css/base.css','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp',...fs.readdirSync(game+'/save').filter(x=>/\.sav$/i.test(x)).map(x=>game+'/save/'+x)].map(p=>({path:p,sha256:c.hash(fs.readFileSync(p))})));
 fs.writeFileSync(rec+'/PLAN_KO.md',`# 6번 복귀·7번 자산 처분 이벤트 UI

사용자2026-10-24:6번그림확인후복귀배경누락점검,7번별도이벤트페이지상단그림/우측정보/하단선택지로수정,압류딱지저택배경제작,돈부족시게임오버대신이벤트진입.

- [ ] 6번실내복원누락실제엔진재현,원본유지후시험세이브만최소수정.
- [ ] 7번현재렌더RED,jo9_liquidation본문렌더구간만 _layout/bg/text/side_panel로교체. 기존처분/급매/정산/입주조건/가격유지.
- [ ] 붉은압류딱지저택신규배경제작/적용. 하단18px/검정텍스트/선택지,우측청구/환급/부족정보.
- [ ] 실제엔진15페이지/선택지/부족금진입/중복차감및환급/입주보호검사,공식9경로/문법/재생/재적용PASS.
- [ ] 독립검토후WORK/6번시험세이브반영,7번저장화면갱신,기록/이미지체크리스트/패치묶음갱신.
- [ ] 기존세이브보존·최소복구본·핵심기록유지,이번임시QSP/JSON/중복백업정리.커밋·푸시없음。
`);fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');console.log('Pinned WORK baseline and protected inputs.');
}else if(phase==='build'){
 const raw=fs.readFileSync(root+'/inputs/before.qsp'),d=c.parse(raw),t=body(d,'jo9_liquidation'),at=t.indexOf('*clr & cla & killobj');assert(at>0);const end=t.indexOf('! JO9 MOD END INSOLVENCY_FLOW_20261023',at);assert(end>at);const old=t.slice(at,end);
 const replacement=`! JO9 MOD START INSOLVENCY_EVENT_UI_20261024 | 2026-10-24_asset_event_ui
*clr & cla & killobj
killvar '$menu_links'
gs '_layout'
*p '<div id="bg"><img style="width:795px;height:595px;" src="content/pic/bg/jo9_bankruptcy_seizure.png"><div style="position:absolute;top:24px;left:0;width:795px;text-align:center;"><span style="font-size:42px;font-weight:bold;color:#ffe0bb;background-color:#511b16;padding:8px 24px;">파산 위기</span></div></div>'
*p '<div id="side_panel_main"><center><div style="font-size:32px;">당장의 고비</div><<$jo9_lq_title>><br>자산 확인 <<jo9_lq["page"] + 1>> / 15</center></div>'
*p '<div id="side_panel_text" style="color:#20160e;font-size:20px;line-height:1.3;overflow:auto;"><b>밀린 비용</b> <<jo9_lq["bill"]>>스파크<br><b>가진 돈</b> <<sparks>>스파크<br><b>부족한 돈</b> <<jo9_lq_missing>>스파크<br><br>'
if $jo9_lq_notice ! '': *p '<<$jo9_lq_notice>><br><br>'
if jo9_lq['page'] <= 11:
 if jo9_lq_available[$jo9_lq_key] = 1:
  *p '지금 처분하면 <b><<jo9_lq_value[$jo9_lq_key]>>스파크</b>를 회수할 수 있다.<br>'
  if jo9_lq_value[$jo9_lq_key] = 0: *p '이번 청구액은 그대로지만, 다음 결산부터 유지비가 들지 않는다.<br>'
 else
  *p '<<$jo9_lq_reason[$jo9_lq_key]>><br>'
 end
elseif jo9_lq['page'] = 12 or jo9_lq['page'] = 13:
 if jo9_lq_sale_price[$jo9_lq_key] > 0:
  *p '경쟁 노예상에게 급매하면 <b><<jo9_lq_sale_price[$jo9_lq_key]>>스파크</b>를 받을 수 있다.<br>'
 else
  *p '<<$jo9_lq_sale_reason[$jo9_lq_key]>><br>'
 end
end
*p '<br>처분할 자산을 한 가지씩 살펴보자. 사람이 들어 있는 시설은 먼저 직접 비워야 한다. 비용을 마련할 때까지 다음 날로 넘어갈 수 없다.</div>'
*p '<div id="text" style="color:#20160e;font-size:18px;line-height:1.2;overflow:auto;"><<$jo9_lq_prose>><br>'
if sparks >= jo9_lq['bill']: *p '▶ <a style="color:#6a2904;font-weight:bold;" href="EXEC:gt ''jo9_liquidation'',''finish''">청구액을 지불하고 돌아간다</a><br>'
if jo9_lq['page'] <= 11:
 if jo9_lq_available[$jo9_lq_key] = 1: *p '▶ <a style="color:#6a2904;font-weight:bold;" href="EXEC:gt ''jo9_liquidation'',''dispose'',''<<$jo9_lq_key>>''"><<$jo9_lq_choice>></a><br>'
elseif jo9_lq['page'] = 12 or jo9_lq['page'] = 13:
 if jo9_lq_sale_price[$jo9_lq_key] > 0: *p '▶ <a style="color:#6a2904;font-weight:bold;" href="EXEC:gt ''jo9_liquidation'',''sell_person'',''<<$jo9_lq_key>>'',<<jo9_lq_sale_price[$jo9_lq_key]>>,<<jo9_lq_sale_type[$jo9_lq_key]>>,''<<$jo9_lq_sale_id[$jo9_lq_key]>>'',$jo9_lq_sale_actor[''<<$jo9_lq_key>>'']"><<$jo9_lq_choice>></a><br>'
end
if jo9_lq['page'] < 14: *p '▶ <a style="color:#6a2904;font-weight:bold;" href="EXEC:gt ''jo9_liquidation'',''next''">다음 자산을 살펴본다</a><br>'
if jo9_lq['page'] > 0: *p '▶ <a style="color:#6a2904;font-weight:bold;" href="EXEC:gt ''jo9_liquidation'',''previous''">이전 자산을 다시 살펴본다</a><br>'
*p '▶ <a style="color:#6a2904;font-weight:bold;" href="EXEC:gt ''jo9_liquidation'',''manual''">다른 방법으로 자금을 마련한다</a><br>'
if jo9_lq['page'] = 14:
 *p '▶ <a style="color:#6a2904;font-weight:bold;" href="EXEC:gt ''jo9_liquidation'',''restart''">처분할 자산을 처음부터 다시 살펴본다</a><br>'
end
*p '</div>'
! JO9 MOD END INSOLVENCY_EVENT_UI_20261024
`;
 const edits=[{location:'jo9_liquidation',field:'body',old,new:cr(replacement),count:1,patchId:'INSOLVENCY_EVENT_UI_20261024'}];
 const manual="if $jo9_lq_action = 'manual':\r\n jo9_lq['manual'] = 1\r\n is_home = 1\r\n city_form = estate_location[$estate]\r\n city_district = -1\r\n menu_form = 0\r\n gt 'menu_form'\r\nend\r\n";
 const abandon="if $jo9_lq_action = 'abandon' and jo9_lq['page'] = 14:\r\n dynamic $death, '당신은 남은 자산으로도 자금을 마련하지 못했고, 결국 청구서를 해결하지 못한 채 조련사 길드에서 추방되었다.'\r\n exit\r\nend\r\n";
 edits.push({location:'jo9_liquidation',field:'body',old:manual,new:'! JO9 MOD START INSOLVENCY_MANUAL_ORDER_20261024\r\n! 수동 복귀는 처분 후 남은 자산을 확인한 뒤 처리한다.\r\n! JO9 MOD END INSOLVENCY_MANUAL_ORDER_20261024\r\n',count:1});
 edits.push({location:'jo9_liquidation',field:'body',old:abandon,new:'! JO9 MOD START INSOLVENCY_EXHAUSTION_ONLY_20261024\r\n! 오래된 포기 콜백도 아래의 실제 자산 소진 판정을 따른다.\r\n! JO9 MOD END INSOLVENCY_EXHAUSTION_ONLY_20261024\r\n',count:1});
 const anchor="if sparks >= jo9_lq['bill'] and ($jo9_lq_action = 'dispose' or $jo9_lq_action = 'sell_person'): gt 'jo9_liquidation', 'finish'";
 const exhaustion=`! JO9 MOD START INSOLVENCY_EXHAUSTED_ENDING_20261024 | 2026-10-24_asset_event_ui
local jo9_lq_remaining = 0
gs 'jo9_liquidation_assets', 'quote'
if jo9_lq_value['decor'] > 0: jo9_lq_remaining = 1
if kulaconstruct > 0: jo9_lq_remaining = 1
if lab > 0 or boudoir > 0 or dungeon > 0 or barn > 0 or pen > 0 or stasis_tank > 0: jo9_lq_remaining = 1
if $estate ! 'slum_house': jo9_lq_remaining = 1
if (slave_state = CONST_INT['slave_exist'] or slave_state = CONST_INT['slave_faint']) and slave['brand'] ! 4: jo9_lq_remaining = 1
if (assistant_state = CONST_INT['slave_exist'] or assistant_state = CONST_INT['slave_faint']) and assistant['brand'] ! 4: jo9_lq_remaining = 1
if sparks < jo9_lq['bill'] and jo9_lq_remaining = 0:
 dynamic $death, '가구도 집도, 함께했던 이들까지 모두 떠나보냈다. 그러나 남은 빚을 갚기에는 끝내 모자랐다.<br><br>채권자들은 마지막으로 당신의 몸값을 계산했다. 한때 노예를 사고팔던 당신은 이제 경매장 위에 서서, 자신에게 매겨지는 값을 듣는다.<br><br>빚을 갚지 못한 노예상의 마지막 상품은 자기 자신이었다.'
 exit
end
! JO9 MOD END INSOLVENCY_EXHAUSTED_ENDING_20261024
`;
 edits.push({location:'jo9_liquidation',field:'body',old:anchor,new:anchor+'\r\n'+cr(exhaustion)+manual,count:1});
 let next=t;for(const e of edits){assert.equal(next.split(e.old).length-1,e.count);next=next.replace(e.old,e.new);}set(d,'jo9_liquidation',next);const candidate=c.serialize(d);qa.inspectWorld(candidate);const patch={id:'2026-10-24_asset_event_ui',description:'자산처분이벤트:압류그림/파산위기제목·우측금액·하단선택지. 자산소진시기존게임오버컷에채무매각엔딩원고. 거래/정산/입주보호유지.',before_sha256:before,after_sha256:c.hash(candidate),edits:[{location:'jo9_liquidation',field:'body',old:t,new:next,count:1,patchId:'INSOLVENCY_EVENT_UI_20261024'}],logicalChangeBlocks:edits.length,recordingNote:'Moved manual block retains its old text at a new position. Record one exact location replacement so reapplication cannot match the relocated original anchor.'};fs.writeFileSync(root+'/inputs/candidate.qsp',candidate);write(root+'/patches/2026-10-24_asset_event_ui.json',patch);write(rec+'/patch.json',patch);console.log(JSON.stringify({candidate:patch.after_sha256,editedLocations:['jo9_liquidation'],edits:1,logicalChangeBlocks:edits.length}));
}else if(phase==='probe'){
 const which=process.argv[3]||'candidate',d=c.parse(fs.readFileSync(root+'/inputs/'+which+'.qsp')),state=s.parse(fs.readFileSync(game+'/save/JO9_TEST_20261023_07_ASSETS.sav'));
 const keep=/^(JO9_LQ|SLAVE($|_)|ASSISTANT($|_)|ROOM[1-4]($|_)|PRISONER($|_)|COW($|_)|FARMHAND($|_)|HARPY($|_)|PIG($|_)|ICED_\d+($|_)|CONST_INT$|ESTATE($|_)|OWNER$|STUDY$|BED$|BATH$|DUNGEON$|KITCHEN$|BOUDOIR$|LAB$|BARN$|PEN$|STASIS_TANK$|KULACONSTRUCT$|SPARKS$|FINAL_PAYMENT$|DAY$|MASTER($|_)|HERO_CHOICE$|DIFFICULTY_SETTING$|NSFW$|UI_STYLE$|INTERIOR$|CONTRACT$|DEBT($|_)|CELL_STATE$|IS_HOME$|CITY_FORM$|CITY_DISTRICT$)/;
 const prime=qa.primeState({...state,vars:state.vars.filter(x=>keep.test(x.name))}),dir=root+'/ui/'+which;fs.mkdirSync(dir,{recursive:true});
 let code="killall\nsettimer 0\n"+prime.code+"\n$onnewloc=''\n$ongload=''\n$ongsave=''\n$counter=''\ngs 'refresh_database'\n$onnewloc=''\n$ongload=''\n$ongsave=''\n$counter=''\n";
 for(let page=0;page<15;page++)code+="jo9_lq['page']="+page+"\ngs 'jo9_liquidation','view'\n$jo9_ui_html["+page+"]=$maintxt\n";
 code+="savegame 'render.sav'\nmsg 'JO9_QA_ASSET_pages_COMPLETE'";
 if(!fs.existsSync(dir+'/json'))fs.cpSync(game+'/json',dir+'/json',{recursive:true});fs.copyFileSync(game+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 set(d,'Start',code);fs.writeFileSync(dir+'/pages.qsp',c.serialize(d));write(dir+'/plan.json',[{name:'pages',file:dir+'/pages.qsp',marker:'JO9_QA_ASSET_pages_COMPLETE',checkpoint:'All15productionassetpages'}]);const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',dir+'/plan.json','-TimeoutSeconds','30'],{encoding:'utf8',windowsHide:true,timeout:45000});const result=read(dir+'/client-results.json');assert(result.every(x=>x.pass),JSON.stringify(result));const save=s.parse(fs.readFileSync(dir+'/render.sav')),html=save.vars.find(x=>x.name==='JO9_UI_HTML');assert(html&&html.values.length===15,'Native MAINTXT captures all15pages');let checks=0;
 const reports=html.values.map(([_,text],i)=>{const findings=[];for(const token of ['id="bg"','id="text"','id="side_panel_main"','id="side_panel_text"','jo9_bankruptcy_seizure.png']){checks++;if(!text.includes(token))findings.push('Missing '+token);}let bg=s.value(save,'BACKIMAGE')[1];checks++;if(!bg.endsWith('/grimdark/bg.png'))findings.push('Wrong event parchment '+bg);return {page:i,pass:!findings.length,findings,htmlLength:text.length};});
 for(let i=0;i<html.values.length;i++)fs.writeFileSync(dir+'/page-'+i+'.html',html.values[i][1]);write(rec+'/'+which+'-ui-results.json',{status:reports.every(x=>x.pass)?'PASS':'FAIL',pages:reports,checks,engineExit:r.status,results:result});fs.copyFileSync(dir+'/pages-stderr.log',rec+'/evidence/'+which+'-pages.log');console.log(JSON.stringify({phase:which,status:reports.every(x=>x.pass)?'PASS':'EXPECTED_FAILURE',pages:reports.length,checks}));if(which==='candidate')assert(reports.every(x=>x.pass));else assert(reports.some(x=>!x.pass));
}else throw Error('Unknown phase '+phase);
