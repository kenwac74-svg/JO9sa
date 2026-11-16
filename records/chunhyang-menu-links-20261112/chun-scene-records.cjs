'use strict';
const fs=require('fs'),assert=require('assert/strict'),z=require('zlib');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',rec=repo+'/records/chunhyang-menu-links-20261112',tmp='G:/Codex/tmp/chunhyang-menu-links-20261112';const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),json=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const p=read(rec+'/scene-plan.json'),raw=fs.readFileSync(game+'/jack.qsp'),m=read(repo+'/assets/runtime-source-2.4.1.json');assert.equal(c.hash(raw),p.afterSha256);assert(raw.equals(fs.readFileSync(repo+'/assets/runtime/2.4.1/jack.qsp')));assert.equal(m.sourceQspSha256,p.afterSha256);qa.inspectWorld(raw);assert.equal(c.hash(z.gunzipSync(fs.readFileSync(rec+'/baseline.qsp.gz'))),p.combinedBeforeSha256);
const routes=read(rec+'/installed-routes.json');assert.equal(routes.length,7);assert(routes.every(r=>r.pass));
const expectations={about:'대쥬신제국',pref:'체력이 A 이상',duel:'무장을 고르십시오',style:'익숙한 무장을',supply:'[춘향]',watch:'시작하십시오'};
const renders=[];for(const route of routes){const s=sc.parse(fs.readFileSync(tmp+'/'+route.name+'.sav')),html=sc.value(s,'qa_render')[1];assert(html.length>0);const key=route.name.slice('installed-'.length);if(expectations[key]){assert(html.includes(expectations[key]),key+' final dialogue');assert(html.includes('content/pic/bg/chunhyang.png'),key+' background');assert(html.includes('width="795" height="596"'),key+' size');}fs.writeFileSync(rec+'/'+route.name+'-render.html',html);renders.push({route:key,html:route.name+'-render.html',dialogueChecked:!!expectations[key]});}
const textResults=read(tmp+'/text-probe/client-results.json');assert(textResults.length===1&&textResults[0].pass);const text=sc.parse(fs.readFileSync(tmp+'/text-probe/scene-text.sav')),checks=Number(sc.value(text,'qa_checks')[0]);assert.equal(checks,16);for(const [v,file]of [['qa_intro','regular-intro.html'],['qa_win','regular-mercy-win.html']])fs.writeFileSync(rec+'/'+file,sc.value(text,v)[1]);fs.copyFileSync(tmp+'/text-probe/scene-text-stderr.log',rec+'/installed-scene-text-native.log');
const image=fs.readFileSync(p.imageTarget);assert.equal(c.hash(image),p.imageHash);assert(image.equals(fs.readFileSync(p.imageSource)));assert(image.equals(fs.readFileSync(repo+'/assets/content/pic/bg/chunhyang.png')));json(rec+'/final-verification.json',{qspSha256:p.afterSha256,workTrackedMetadataMatch:true,roundtrip:true,structureAndBoundaries:true,nativeRoutes:routes,renderedScenes:renders,additionalNativeTextAssertions:checks,actualRegularIntroAndMercyWin:true,legacyAndOtherBuyerTextPreserved:true,image:{path:p.imageTarget,sha256:p.imageHash,source:p.imageSource,pixelsChanged:false,displayWidth:795,displayHeight:596},realUserSaveTouched:false,guiVisualVerified:false});
const prior=fs.readFileSync(rec+'/REPORT_KO.md','utf8');fs.writeFileSync(rec+'/INITIAL_LINK_AUDIT_KO.md',prior);const report=`# 춘향 메뉴·장면 문구·배경 표시 수정

2026-11-12 사용자 승인 “수정하고 각 장면에 들어갈 텍스트도 춘향에 맞게 바꿔”와 후속 이미지 지시를 WORK·추적 소스에 반영했다. 최초 원인 조사는 [초기 기록](INITIAL_LINK_AUDIT_KO.md), 최종 검증은 [final-verification.json](final-verification.json)을 참조한다.

## 수정 내용

- 춘향 메뉴가 작은따옴표 HTML 속성에 같은 작은따옴표 GT 명령을 넣어 7개 주소가 EXEC:gt 에서 끊기던 오류를 고쳤다. 대화·결투·출전·조건·공급·영입·영입대기 연결을 큰따옴표 명령으로 통일했다.
- 클럽 소개·배경 설명·공급 조건·공급 수요 마감·보스 승패·영입 대기 문구를 짧고 담담한 춘향 말투로 조정했다. 선수 소개·관전 2페이지·출전 무장 선택·일반전 승패·공급 검사·실제 거래 완료에도 전용 대사를 연결했다. 기존 상금/가격/처형/석방 사실은 유지한다.
- 사용자가 만든 배경 포함 원본 거대한 클레이모어와 전쟁의 방.png를 에게야 배경과 같은 폴더인 content/pic/bg/chunhyang.png로 복사했다. 원본과 같은 RGB 1447×1087 PNG이며 게임에서는 에게야와 같은 #bg 영역 795×596으로 표시한다. 픽셀은 수정하지 않았다. 원본과 투명 title 파일은 보존했다.
- 클럽 주 화면·대화·조건·일반전 무장 선택·결투 무기 선택·공급 검사·선수 소개·관전 첫 장에 완성 배경을 연결했다. 투명 center_Isabella 전경을 제거해 중복 캐릭터를 막았다. 관전 두 번째 전용 컷과 승패/처형/석방 결과 이미지는 보존했다.
- 무기 선택 화면을 재표시해도 결투 안내가 한 번만 붙도록 했다. 새 메뉴가 기존 에게야 장면·다른 구매자 화면을 바꾸지 않도록 표시 조건을 한정했다.

## 입력·출력·부작용·연결

기존 jo9_chun_club의 args 모드와 egeya_lose/interaction_city/현재 place를 읽어 동일한 메뉴·전투·공급 함수로 보낸다. 변경 출력은 HTML href, 기존 $text/$sp_text 표시문과 화면 배경이다. jo9_chun_club(place)는 기존 $bg['chunhyang_battle']에 전용 배경 키 chunhyang을 설정한다. 새 진행 변수·세이브 필드·마이그레이션은 없다. 가격·전투·6회 참가 한도·CM·영입 처리 자체는 변경하지 않았다.

공급 대사는 기존 slave_sell 분기에서 만들어진 사실/가격 설명 뒤에 붙는다. 거래 완료 발언은 기존 slave_sold 계열 상태에서만 붙는다. 사망 결과는 killslave 전에 완성된 원래 사건 서술을 유지하고, 이름을 새로 읽지 않는 정리 발언만 더한다. 일반전 승리는 기존 처형/석방 선택 및 purse 표시 뒤에 붙는다.

기존 저장에 남은 display_options도 메뉴 호출 시 최신 helper를 사용하며, 일반전 무장 선택 문구는 shop_general의 실제 렌더링에서 갱신하므로 오래된 캐시의 문구를 그대로 표시하지 않는다. 이미 출력된 게임 창은 QSP를 재로드해야 한다.

## 코드와 리소스

- mods/2026-11-12_chunhyang_menu_links.json: CHUNHYANG_MENU_LINK_QUOTES_20261112, helper 본문 전체의 선언된 진화.
- mods/2026-11-12_chunhyang_scene_presentation.json: 8개 표시 edit, 5개 로케이션(jo9_chun_club, shop_general, interaction_city, slave_sell, interaction_screen_city). CHUNHYANG_SCENE_PRESENTATION_20261112 및 각 내부 CHUNHYANG_* 마커로 조회한다.
- WORK/game/jack.qsp, assets/runtime/2.4.1/jack.qsp, assets/runtime-source-2.4.1.json을 맞췄고 새 배경의 경로·해시·크기를 원장에 추가했다.
- WORK/content/pic/bg/chunhyang.png와 assets/content/pic/bg/chunhyang.png는 지정한 원본과 동일 해시 ${p.imageHash}다.

현재 QSP SHA-256: ${p.afterSha256}.

## 확인한 범위

공식 적용기로 두 패치의 재생·재적용, 정확한 변경 범위, QSP 바이트 왕복·CRLF·주석/마커 경계를 확인했다. 설치본에서 실제 생성된 HTML을 표준 HTMLParser로 읽고 그 href 명령으로 대화·결투·출전·조건·공급·귀환·관전 7개 경로를 실제 엔진에서 실행했다. 6개 관련 화면의 최종 HTML에 새 이미지 경로·795×596 크기·각 대사가 들어 있는 것도 검사했다. 결투 화면 재진입 안내 중복 방지를 포함한다.

별도 설치본 엔진 진단 16개 단언에서 기존 에게야/타 구매자 문구 보존·9개 공급 대사 조건·실제 일반전 선수 소개·석방 승리와 상금100 보존을 확인했다. 보스 전투 AI와 영입 전체는 이번 표시 수정에서 재실행하지 않았다. 기존 구현 검증을 대체하는 전체 출고 PASS로 보고하지 않는다.

실제 사용자 SAV를 열거나 수정하지 않았다. 실제 게임 창의 육안 품질·마우스 클릭은 사용자 확인 전이다. 최초 후보의 독립 검토에서 발견한 재표시 안내 누적은 수정하고 실제 재진입을 검사했다.

## 게임에서 확인

게임을 완전히 종료하고 다시 실행한 뒤 춘향 클럽에 다시 들어간다. (1) 대화/조건 메뉴가 열리고 집무실 배경의 춘향이 보이는지, (2) 일반전 무장 선택과 춘향 결투의 무기 선택에도 같은 완성 이미지와 전용 안내가 나오는지, (3) 관전/선수 소개 대사가 춘향 말투로 나오는지 확인한다.

## 제거·복구·보관

baseline.qsp.gz는 이번 두 패치 직전 QSP ${p.combinedBeforeSha256}의 검증된 복구본이다. 복구 시 이후 사용자 수정을 먼저 대조한다. 두 패치를 함께 역변경하거나 이 백업을 사용하면 이전 동작으로 돌아간다. 배경 파일은 관련 QSP 참조를 제거한 뒤에만 제거한다. 파일만 지우면 춘향 선택 화면이 비게 된다. 문구/표시만 변경해 별도 세이브 초기화는 필요 없다.

최소 압축 기준본·이전 메타·선언형 패치·재현 스크립트·HTML·엔진 로그를 보존하고 대량 임시 QSP·가상 SAV·중복 공식 .bak은 정리한다. Full·음원·커밋·푸시는 변경하지 않았다.
`;
fs.writeFileSync(rec+'/REPORT_KO.md',report);
const local='C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7';for(const file of ['chun-scenes.cjs','chun-scene-text-probe.cjs','chun-scene-records.cjs'])fs.copyFileSync(local+'/'+file,rec+'/'+file);
const idx=repo+'/docs/SESSION_HANDOFF_INDEX.md',intro=`## 2026-11-12 Codex: 춘향 메뉴 클릭·장면 문구·완성 배경 반영

[원인·적용·사용·검증·복구](../records/chunhyang-menu-links-20261112/REPORT_KO.md). 사용자 승인으로 7개 메뉴 href 따옴표를 고치고 각 장면의 춘향 말투를 연결했다. 배경 포함 기존 원본을 에게야와 같은 bg/chunhyang.png로 등록하고 선택 화면에795×596으로 표시, 투명 전경 제거·재표시 안내 누적 방지. 조건/전투/금액/처형·석방·기존 에게야와 타NPC 보존. 설치본 실제 HTML→href 실행7경로·표시/리소스·추가16단언 통과. WORK/추적/메타 ${p.afterSha256.slice(0,8)} 일치. 실제 사용자 SAV/게임 창 외형은 확인 전. Full·음원·커밋푸시 없음.

`;
fs.writeFileSync(idx,intro.replace(/\n/g,'\r\n')+fs.readFileSync(idx,'utf8'));fs.appendFileSync(repo+'/records/chunhyang-club-20261112/REPORT_KO.md','\n\n2026-11-12 후속: 메뉴 href 오류·춘향 장면 문구·배경 포함 이미지 선택 화면 연결은 [수정 기록](../chunhyang-menu-links-20261112/REPORT_KO.md)에 반영했다. 초기 검사의 실제 HTML 파싱 누락을 보완했다.\n');console.log(JSON.stringify({hash:p.afterSha256,routes:7,textAssertions:checks,imageUnchanged:true,reportsSaved:true}));
