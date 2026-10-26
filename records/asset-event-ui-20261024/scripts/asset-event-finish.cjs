'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),zlib=require('zlib'),assert=require('assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',root='G:/Codex/tmp/jo9-asset-event-ui-20261024',rec=repo+'/records/asset-event-ui-20261024';
const c=require(repo+'/tools/text-workshop/core.cjs'),read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const phase=process.argv[2],patch=read(rec+'/patch.json'),source='C:/Users/User/.codex/generated_images/01a0f55f-a7b2-7ac3-905b-647154c5943b/exec-73f64445-6930-4261-8938-24a220cb56c7.png';
if(phase==='install'){
 const gatePath=root+'/release-final/'+fs.readdirSync(root+'/release-final').find(x=>x.startsWith('run-'))+'/report.json';assert.equal(read(gatePath).verdict,'PASS');assert.equal(read(rec+'/candidate-ui-results.json').status,'PASS');const flow=read(root+'/flows/flow-result.json');assert(flow.native.every(x=>x.pass));assert.equal(flow.sourceHash,patch.after_sha256);const repair=read(root+'/isabella/report.json');
 for(const x of read(rec+'/inputs.json'))assert.equal(c.hash(fs.readFileSync(x.path)),x.sha256,'Preinstall '+x.path);
 const icon=fs.readFileSync(source),assetRepo=repo+'/assets/asset-event-ui/jo9_bankruptcy_seizure.png',assetGame=game+'/content/pic/bg/jo9_bankruptcy_seizure.png';fs.mkdirSync(path.dirname(assetRepo),{recursive:true});for(const p of [assetRepo,assetGame]){assert(!fs.existsSync(p),'Refuse overwrite '+p);fs.writeFileSync(p,icon);}
 write(rec+'/assets.json',[{path:'content/pic/bg/jo9_bankruptcy_seizure.png',sha256:c.hash(icon),bytes:icon.length,width:icon.readUInt32BE(16),height:icon.readUInt32BE(20),runtime:assetGame,repository:assetRepo,source,tool:'built-in image_gen',titleOverlay:'파산 위기 — QSP text overlay keeps Korean text readable',prompt:'빈 고전 판타지 저택 서재, 가구·액자·상자에 붉은 압류 딱지와 봉인, 청구서, 사람 없음, 따뜻한 갈색 회화풍 4:3. 별도 엔딩 그림 추가 없음.'}]);
 const old=new Set(fs.readdirSync(game));const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',root+'/patches'],{encoding:'utf8',windowsHide:true,timeout:90000});fs.writeFileSync(rec+'/install.log',r.stdout+'\n'+r.stderr);assert.equal(r.status,0);assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),patch.after_sha256);write(rec+'/install-backups.json',fs.readdirSync(game).filter(x=>!old.has(x)&&x.startsWith('jack.qsp')).map(x=>game+'/'+x));fs.copyFileSync(rec+'/patch.json',repo+'/mods/2026-10-24_asset_event_ui.json');
 const save='JO9_TEST_20261023_06_ISABELLA.sav',oldSave=fs.readFileSync(game+'/save/'+save),newSave=fs.readFileSync(root+'/isabella/candidate.sav');assert.equal(c.hash(newSave),'d94721a77a28ea4b100354618c1baa9ddfed7c27600aded5f9d991cde1d1cad9');fs.writeFileSync(rec+'/isabella-original.sav.gz',zlib.gzipSync(oldSave,{level:9}));assert.deepEqual(zlib.gunzipSync(fs.readFileSync(rec+'/isabella-original.sav.gz')),oldSave);fs.copyFileSync(root+'/isabella/candidate.sav',game+'/save/'+save);write(rec+'/isabella-repair.json',repair);
 fs.copyFileSync(gatePath,rec+'/release-validation.json');fs.copyFileSync(root+'/flows/flow-result.json',rec+'/flow-result.json');fs.copyFileSync(root+'/flows/prepared.json',rec+'/flow-instrumentation.json');for(const p of ['.asset-event-ui.cjs','.asset-event-finish.cjs','.asset-flow-tests.cjs','.isabella-save-repair.cjs'])fs.copyFileSync(p,rec+'/scripts/'+p.slice(1));fs.copyFileSync(root+'/flows/flows-stderr.log',rec+'/evidence/flows.log');fs.copyFileSync(root+'/preview/event.png',rec+'/preview.png');
 const specPath=repo+'/records/ready-test-saves-20261023/spec.json',spec=read(specPath),entry=spec.all.find(x=>x.key==='isabella'),last=entry.steps.findIndex(x=>x==="gt 'end_day_screen'");assert(last>=0);if(entry.steps[last-1]!=="gs 'interior_storage'")entry.steps.splice(last,0,"gs 'interior_storage'");write(specPath,spec);
 write(rec+'/independent-review.json',{status:'PASS',reviewer:'asset_event_final_review',candidate:patch.after_sha256,findings:[],saveRepair:'Exactly8existing snapshot slots; header/CRC/order/count unchanged',limits:'Independent static review; native flow/render/gate tests separately recorded.'});
 for(const x of read(rec+'/inputs.json'))assert.equal(c.hash(fs.readFileSync(x.path)),x.path===game+'/jack.qsp'?patch.after_sha256:x.path.endsWith('/'+save)?c.hash(newSave):x.sha256,'Postinstall '+x.path);
 console.log(JSON.stringify({installed:true,workSha256:patch.after_sha256,repairedTestSave:save,other75SavesUnchanged:true,newImage:assetGame,official:'PASS'}));
}else if(phase==='catalog'){
 const mod=require(repo+'/tools/text-workshop/catalog.cjs'),catroot='G:/somi/IMGMG',rel='content\\pic\\bg\\jo9_bankruptcy_seizure.png',htmlPath=catroot+'/catalog_merge_vs_original.html',statusPath=catroot+'/catalog_status.js',idsPath=catroot+'/catalog_work_ids.json',progressPath=catroot+'/image_work/progress.json';
 const html=fs.readFileSync(htmlPath,'utf8'),m=html.match(/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/);assert(m);const rows=JSON.parse(m[1]);assert(!rows.some(x=>x[0]===rel));const oldIds=read(idsPath),oldStatus=mod.parseStatus(fs.readFileSync(statusPath,'utf8')),progress=read(progressPath),progressBefore=JSON.stringify(progress.items);const asset=read(rec+'/assets.json')[0];
 fs.mkdirSync(rec+'/catalog-before',{recursive:true});for(const p of [htmlPath,statusPath,idsPath,progressPath])fs.writeFileSync(rec+'/catalog-before/'+path.basename(p)+'.gz',zlib.gzipSync(fs.readFileSync(p),{level:9}));
 rows.push([rel,'a','etc',asset.bytes,0,asset.width,asset.height,'']);assert.equal(fs.readFileSync(htmlPath,'utf8'),html);mod.atomic(htmlPath,html.replace(m[1],JSON.stringify(rows)));
 const cat=mod.create(catroot);cat.load();const ids=read(idsPath);for(const [k,v]of Object.entries(oldIds.items))assert.equal(ids.items[k],v);assert.equal(Object.keys(ids.items).length,Object.keys(oldIds.items).length+1);cat.update([{path:rel,flag:'done',checked:true,expected:false}]);const status=cat.state();for(const [k,v]of Object.entries(oldStatus.items))assert.deepEqual(status.items[k],v);
 const meta=cat.meta(rel),event=require(repo+'/tools/text-workshop/personal-patch.cjs').create(game,catroot).record({id:'20261024_asset_event_ui_bankruptcy_seizure',created:new Date().toISOString(),files:[{path:'bg/jo9_bankruptcy_seizure.png',before:null,after:asset.sha256}]},'create');
 assert.equal(JSON.stringify(progress.items),progressBefore);progress.items.push({relative_path:rel,work_code:meta.code,catalog_tags:meta.flags,work_status:'placed',completed_at:new Date().toISOString(),sha256_before:null,sha256_after:asset.sha256,game_path:asset.runtime,backup_paths:[],gameplay_verified_by_user:false,input_image:source});progress.updated_at=new Date().toISOString();mod.atomic(progressPath,JSON.stringify(progress,null,2)+'\n');const snap=cat.snapshot();mod.atomic(catroot+'/catalog_work_codes.js','window.JO9_WORK_CODES='+JSON.stringify(snap.codes)+';window.JO9_WORK_UNITS='+JSON.stringify(snap.unitCodes)+';\n');write(rec+'/catalog-registration.json',{status:'PASS',path:rel,workCode:meta.code,flags:meta.flags,oldRows:rows.length-1,newRows:rows.length,oldWorkIdsUnchanged:true,oldFlagsUnchanged:true,oldProgressEntriesUnchanged:true,event});console.log(JSON.stringify({registered:rel,code:meta.code,priorFlagsPreserved:true,personalImageLedger:true}));
}else if(phase==='finalize'){
 assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),patch.after_sha256);const flow=read(rec+'/flow-result.json');assert(flow.native.every(x=>x.pass));assert.equal(read(rec+'/release-validation.json').verdict,'PASS');assert.equal(read(rec+'/catalog-registration.json').status,'PASS');
 const save='JO9_TEST_20261023_06_ISABELLA.sav';for(const x of read(rec+'/inputs.json'))assert.equal(c.hash(fs.readFileSync(x.path)),x.path===game+'/jack.qsp'?patch.after_sha256:x.path.endsWith('/'+save)?'d94721a77a28ea4b100354618c1baa9ddfed7c27600aded5f9d991cde1d1cad9':x.sha256);
 fs.writeFileSync(rec+'/MANUAL_KO.md',`# 파산 위기 이벤트·6번 시험 세이브 복귀

## 바뀐 화면

기존의 어두운 홈용 main_layout 대신 이벤트용 _layout을 사용한다. 위쪽795×595에는 새 붉은 압류 딱지 저택 그림과 '파산 위기' 제목, 오른쪽에는 청구/보유/부족액·처분가능금액·차단사유, 아래쪽740×185에는 설명과 선택지를 표시한다.18px의 어두운 글씨와 굵은 선택지로 표시하고 긴 내용은 하단 안에서 스크롤된다. CSS 파일은 바꾸지 않았다. 원래15개 자산 페이지와 거래 인수/입주보호/가격/환급/청구처리 함수를 보존했다.

직접 처분 메뉴로 나가도 jo9_lq active/bill은 남는다. 돈이 부족한 상태의 다음날 시도는 이 화면으로 돌아오고, 불러오기도 같은 미납을 복원한다. 충분히 모으면 원래 정산 함수가 한 번 차감한다. 같은 청구가 사라지거나 재차 청구되는 새 경로는 없다.

팔 수 있는 장식·시설·개인실·집·소유 인물이 모두 없고 청구액이 부족하면 기존 게임오버 컷으로 간다. 엔딩 이미지는 새로 만들지 않고, 채무를 갚지 못한 주인공이 노예로 팔려간다는 문구만 전달한다. 원래 임의 포기 버튼은 제거했고 오래된 포기 링크도 실제 자산 여부를 따른다. 입주자 때문에 일시적으로 처분 불가한 시설, 환급0인 임대 시설, 기절한 소유 인물은 남은 자산으로 인정한다. 시설의 캐릭터를 자동 해제하지 않는다.

## 6번 원인·수정

시험용6번이 정상 next_day의 interior_storage를 거치지 않고 경고 화면에 직접 들어갔다. 끝날 때 interior_restore가 빈 previous_*를 복원해 방 장식과 배경이 비었다. 시험 세이브의 기존8개 복원 슬롯에 원래 장식값만 넣었다. 헤더·CRC·저장 화면·인물·재산·다른 슬롯은 동일하다. 원본은 isabella-original.sav.gz로 보관했다. 생성 레시피에도 storage 호출을 추가했다. 기존 게임의 전역 복원 함수를 임의로 바꾸지 않았다.

## 코드 입력·반환·의존성

변경 로케이션은 jo9_liquidation 하나. args0(begin/view/next/previous/dispose/sell_person/finish/manual 등), 기존 jo9_lq 청구상태와 자산·인물·보유금을 읽는다. 원래 인수와 정산 반환은 유지한다. 새 영구 저장키/로케이션 없음. 자산 소진은 지역 변수 jo9_lq_remaining으로 매번 계산한다. 임시값을 저장하거나 기존 세이브를 이관하지 않는다.

INSOLVENCY_EVENT_UI_20261024는 _layout 및 base.css의 bg/text/side_panel_main/side_panel_text와 신규 그림에 의존한다. 그림만 빼면 상단 이미지가 없어진다. INSOLVENCY_EXHAUSTED_ENDING_20261024는 원래 quote와 시설·인물 상태, 원래 death/exit를 사용한다. 이를 빼고 수동 복귀 순서만 남기면 소진 자동 엔딩이 작동하지 않는다. 모듈을 제거할 때는 패치 전체를 복원한다. 금융 함수/원래 게임오버 이미지는 수정하지 않았다.

## 검증

- 원래 화면15페이지/90개 조건 실패를 확인한 후 후보15페이지/90개 실제 엔진 출력 조건PASS.
- 수동탈출/다음날/불러오기함수/오래된finish·abandon/시설점유/급매/중복차감·환급 등17상황46조건 실제엔진PASS. 저장·불러오기는 제어된 기존함수 실행으로 검사했으며 실제 UI 클릭 왕복은 미검증이다.
- 6번 원래 restore에서 빈 배경 재현, 수정후 lux 및 실제 배경 경로 유지 실제엔진PASS.
- 공식 출고9경로·구조/줄/주석경계·정확패치재생/재적용·JSON등록검사PASS. 처음의 분리된 이동코드 패치가 재적용 검사에서 실패해 단일 로케이션 치환 기록으로 고쳤고, 실행 후보 해시는 동일하다.
- 독립 검토 실제 결함 없음. 브라우저 preview.png는 실제 엔진 출력 HTML을 렌더링한 배치 참고용이며 실제 게임 스크린샷은 아니다.
- 기존75세이브·Full·CSS 보존.6번만 별도 원본 보관후 수정. 체크리스트 bg-1108 등록·완료, 기존작업번호/체크/진행항목 보존. 이미지제작 원장에 추가.

WORK: ${patch.after_sha256}
`);
 const bundle=repo+'/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md';let t=fs.readFileSync(bundle,'utf8');if(!t.includes('ASSET_EVENT_UI_20261024'))t+='\n\n## WORK 적용 — 파산 위기 이벤트·6번 시험 세이브 (ASSET_EVENT_UI_20261024)\n\n- 압류딱지저택신규배경/파산위기제목,기존이벤트틀상단그림·우측정보·하단선택지. 미납수동탈출/다음날차단유지,자산소진뒤기존게임오버컷의채무매각원고.\n- 6번시험세이브복원슬롯8개수정·원본압축보존·레시피수리. 인물/재산/다른75세이브보존.\n- 실제엔진15페이지90조건·17흐름46조건·공식9경로/문법/재생/재적용·독립검토PASS. UI실제클릭검증별도. 이미지체크리스트bg-1108/제작원장등록. WORK만,Full/ZIP/커밋/푸시없음. [설명·검증](../records/asset-event-ui-20261024/MANUAL_KO.md).\n';fs.writeFileSync(bundle,t);
 const guide=repo+'/records/ready-test-saves-20261023/MANUAL_KO.md';t=fs.readFileSync(guide,'utf8');if(!t.includes('06_RESTORE_FIXED_20261024'))fs.writeFileSync(guide,t+'\n\n2026-10-24 보완 (06_RESTORE_FIXED_20261024):6번의 일일경고 종료 후 실내장식 복원값 누락을 수정했다. WORK 게임을 다시 실행하고 같은6번을 다시 불러온다.7번은 새 파산위기 이벤트 화면을 사용한다. 기존 깨진6번 원본은 별도 압축보관했다.\n');
 write(rec+'/final-verification.json',{status:'PASS',workSha256:patch.after_sha256,repairedTestSave:save,other75SavesUnchanged:true,uiPages:15,uiChecks:90,flowScenarios:17,flowChecks:46,officialEnginePaths:9,independentReview:'PASS',fullUnchanged:true,cssUnchanged:true,assetCode:'bg-1108',newImages:1,newEndingImages:0,newPersistentKeys:0,newLocations:0,manualGuiClicks:'NOT_VERIFIED',commitPush:false});console.log('UI/save/flow final verification PASS');
}else throw Error('phase');
