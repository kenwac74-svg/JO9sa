'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),z=require('node:zlib');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',rec=repo+'/records/sale-cap-b-20261026',tmp='G:/Codex/tmp/sale-cap-b-20261026';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const expected='b8de16b088051eea5e51d8636f9ca3cc3975974129adf950ce122260ba2b5cf1',id='2026-10-26_sale_cap_b';
const write=(p,o)=>fs.writeFileSync(p,JSON.stringify(o,null,2)+'\n');
if(process.argv[2]==='reproduce'){
 assert(!fs.existsSync(tmp));const patch=JSON.parse(fs.readFileSync(rec+'/patch.json','utf8')),before=z.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz'));assert.equal(c.hash(before),patch.before_sha256);const d=c.parse(before);
 for(const e of patch.edits){const loc=d.locations.find(l=>l.name===e.location),b=c.shift(d.lines[loc.body],5);assert.equal(b.split(e.old).length,2);d.lines[loc.body]=c.shift(b.replace(e.old,e.new),-5);}
 const candidate=c.serialize(d);assert.equal(c.hash(candidate),patch.after_sha256);qa.inspectWorld(candidate);fs.mkdirSync(tmp,{recursive:true});fs.mkdirSync(tmp+'/patches');fs.writeFileSync(tmp+'/before.qsp',before);fs.writeFileSync(tmp+'/candidate.qsp',candidate);fs.copyFileSync(rec+'/patch.json',tmp+'/patches/'+id+'.json');console.log(JSON.stringify({reproduced:true,candidate:tmp+'/candidate.qsp',hash:c.hash(candidate)}));process.exit(0);
}
if(process.argv[2]==='prepare'){
 assert(!fs.existsSync(tmp));const before=fs.readFileSync(game+'/jack.qsp');assert.equal(c.hash(before),expected);qa.inspectWorld(before);
 const d=c.parse(before),edits=[...JSON.parse(fs.readFileSync(rec+'/proposed-edits.json')).edits,...JSON.parse(fs.readFileSync(rec+'/private-edits.json')).edits].map(({location,field,old,new:next,count})=>({location,field,old,new:next,count}));
 const old='local $jo9_gold_result_text = $text[txt]';
 const next=[old,'! JO9 MOD START SALE_CAP_B_SAVED_QUOTE_INFO_20261026 | '+id,
  "if (interaction_city = 911 or interaction_city = 912 or interaction_city = 913) and ($interaction_type = 'slave_sold' or $interaction_type = 'slave_sold_house') and slave_state = CONST_INT['slave_exist'] and sell_price > 8000:",
  " $jo9_gold_result_text += '<br><br>개인 거래의 최종 지급액은 최대 $8,000이다.'",'end',
  "if interaction_city = 931 and sparks_get > 6000: $jo9_gold_result_text += '<br><br>공개경매의 최종 지급액은 최대 $6,000이다.'",
  '! JO9 MOD END SALE_CAP_B_SAVED_QUOTE_INFO_20261026'].join('\r\n');
 edits.push({location:'interaction_screen_city',field:'body',old,new:next,count:1});
 for(const e of edits){const loc=d.locations.find(l=>l.name===e.location);assert(loc);const body=c.shift(d.lines[loc.body],5);assert.equal(body.split(e.old).length,2,e.location+' exact edit');d.lines[loc.body]=c.shift(body.replace(e.old,e.new),-5);}
 const after=c.serialize(d);qa.inspectWorld(after);assert(c.serialize(c.parse(after)).equals(after));assert.equal(d.locations.length,c.parse(before).locations.length);
 fs.mkdirSync(tmp,{recursive:true});fs.mkdirSync(tmp+'/patches');fs.writeFileSync(tmp+'/before.qsp',before);fs.writeFileSync(tmp+'/candidate.qsp',after);fs.writeFileSync(rec+'/before.qsp.gz',z.gzipSync(before));
 const patch={id,before_sha256:expected,after_sha256:c.hash(after),edits};write(rec+'/patch.json',patch);write(tmp+'/patches/'+id+'.json',patch);write(repo+'/mods/'+id+'.json',patch);fs.copyFileSync(__filename,rec+'/integrate.cjs');
 write(rec+'/prepared.json',{before:expected,after:c.hash(after),edits:edits.length,locations:[...new Set(edits.map(e=>e.location))],newLocations:0,newPersistentKeys:0,scope:'Final payout only: trader/public auction6000,private8000; fixed orders/emergency/difficulty formulas unchanged.'});
 const files=[game+'/save/JO9_GOLD_AP_CHECK_20261026.sav',game+'/config.xml',game+'/css/base.css',game+'/json/menu_icon.json','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp','G:/somi/JO9O/game/jack.qsp'];write(rec+'/protected.json',files.map(file=>({file,sha256:c.hash(fs.readFileSync(file))})));
 fs.writeFileSync(rec+'/PLAN_KO.md','# 판매 상한 B안 구현 계획\n\n사용자 선택: 상인·공개경매 최종 지급6000 / 개인 고객8000. 모든 옵션 난도에 같은 상한을 적용하며 난도별 산식·희귀 평가 배수·고정납품·파산 급매는 유지한다.\n\n1. 현재 WORK를 바이트 왕복 검사하고 압축 복구본을 보존한다.\n2. 기본 상인 견적·희귀 재제안·경매 최종 낙찰/지급·개인 흥정/정가/할인/지급에서 최종 금액만 제한한다. 공통 base_price, 휴면 판매, 일반 수입·환전·대출·정액 의뢰는 변경하지 않는다.\n3. 예전 웡의 초과 견적은 기존 재견적 경로로 안내한다. 개인·경매의 이미 저장된 초과 대사에는 조회 전용 지급 한도 안내만 붙이며 상태/콜백은 재실행하지 않는다.\n4. 격리 진단본에서 기존본 RED와 후보 GREEN, 경계/난도/희귀/옛 견적/고정의뢰 보존을 검사하고 공식 구조·개행·마커·패치 재생/재적용·실제 엔진9경로를 확인한다.\n5. 통과한 후보만 WORK에 적용하고 릴리즈 노트를 갱신한다. Full·ZIP·개인세이브·커밋·푸시는 변경하지 않는다.\n\n수동 플레이는 사용자 담당이며 이번 검사는 자동 엔진 경로만 실행한다. 진단 사본은 결과 추출 후 링크 대상을 따라가지 않고 정리한다.\n');
 console.log(JSON.stringify({candidate:tmp+'/candidate.qsp',baseline:tmp+'/before.qsp',hash:c.hash(after),edits:edits.length}));
}else if(process.argv[2]==='install'){
 const release=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));assert.equal(release.verdict,'PASS');
 const view=JSON.parse(fs.readFileSync(rec+'/view-results.json','utf8').replace(/^\uFEFF/,''));assert.equal(view.length,2);assert(view.every(x=>x.pass));
 for(const section of ['private-tests','trader-tests']){const r=JSON.parse(fs.readFileSync(rec+'/'+section+'/FINAL_RESULT.json','utf8'));assert.equal(r.status,'PASS',section);assert.equal(r.candidateSha256,JSON.parse(fs.readFileSync(rec+'/prepared.json','utf8')).after);}
 for(const p of JSON.parse(fs.readFileSync(rec+'/protected.json')))assert.equal(c.hash(fs.readFileSync(p.file)),p.sha256,p.file);
 const candidate=fs.readFileSync(tmp+'/candidate.qsp'),patch=JSON.parse(fs.readFileSync(rec+'/patch.json'));assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),expected);assert.equal(c.hash(candidate),patch.after_sha256);fs.copyFileSync(process.argv[3],rec+'/release-report.json');
 fs.writeFileSync(game+'/jack.qsp',candidate);assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),patch.after_sha256);
 write(rec+'/FINAL_RESULT.json',{status:'WORK_APPLIED',before:expected,after:patch.after_sha256,releaseVerdict:'PASS',traderAuctionCap:6000,privateBuyerCap:8000,allOptionDifficultiesSameCap:true,fixedOrdersAndEmergencyUnchanged:true,newLocations:0,newPersistentKeys:0,fullSynced:false,packaged:false,committed:false,pushed:false,manualPlay:'User handles physical manual verification.'});
 console.log(JSON.stringify({installed:true,hash:patch.after_sha256}));
}else throw Error('prepare or install <release report>');
