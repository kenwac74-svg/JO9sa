'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs'),json=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const m=json(__dirname+'/candidate.json'),staged=json(__dirname+'/STAGED.json'),backup='G:/somi/JO9_work_backups/shop-text-quest-20261026',record=staged.record,normal=p=>path.resolve(p).toLowerCase();
assert.equal(staged.status,'VERIFIED_READY_TO_APPLY');assert.equal(c.hash(fs.readFileSync(m.game+'/jack.qsp')),m.after);
const inputs=json(__dirname+'/inputs.json');for(const x of inputs)if(normal(x.path)!==normal(m.game+'/jack.qsp'))assert.equal(c.hash(fs.readFileSync(x.path)),x.sha256,x.path);
const written=[];
try{
 for(const f of m.runtime.filter(x=>x.path!=='jack.qsp')){assert.equal(c.hash(fs.readFileSync(m.game+'/'+f.path)),f.before);assert.equal(c.hash(fs.readFileSync(backup+'/'+f.path)),f.before);assert.equal(c.hash(fs.readFileSync(m.stage+'/'+f.path)),f.after);fs.copyFileSync(m.stage+'/'+f.path,m.game+'/'+f.path);written.push(f);assert.equal(c.hash(fs.readFileSync(m.game+'/'+f.path)),f.after);}
 const changed=new Set(m.runtime.map(x=>normal(m.game+'/'+x.path))),protectedFiles=[];
 for(const x of inputs)if(!changed.has(normal(x.path))){assert.equal(c.hash(fs.readFileSync(x.path)),x.sha256,x.path);protectedFiles.push(x.path);}
 for(const f of m.runtime)assert.equal(c.hash(fs.readFileSync(m.game+'/'+f.path)),f.after);qa.inspectWorld(fs.readFileSync(m.game+'/jack.qsp'));JSON.parse(fs.readFileSync(m.game+'/json/menu_icon.json','utf8').replace(/^\uFEFF/,''));new Function(fs.readFileSync(m.game+'/content/js/jo9_word_wrap.js','utf8'));
 const bundle='G:/somi/JO9sa/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md',marker='SHOP_TEXT_QUEST_UI_APPLIED_20261026';let text=fs.readFileSync(bundle,'utf8');assert(!text.includes(marker));
 text+='\r\n\r\n## WORK 적용 — 상점 UI·설명 공백·파멜라 재방문 ('+marker+')\r\n\r\n우유 질문 가격꼬리·보유숫자, 약국 회색11아이콘/옛아이콘캐시, 노예·조수 마법약 두열 높이, 특성 설명의 실제공백 표시를 수정했다. 건강체질 입수처와 명성 보상정확수치는 문구에서숨기고 기존로드안내를갱신한다. 파멜라30045 원본의 대입기호누락만 한글자 수리. 랠리추첨/명성보상/아그라바조건/물약효과는불변.\r\n\r\n다음패치 필수파일: jack.qsp, json/menu_icon.json, css/base.css, content/js/jo9_word_wrap.js. 공식실제엔진9/구캐시1, UI8, 공백가독성native 및 원본·수정 대조27결과와 독립리뷰 확인. 기존세이브151/원본/Full/설정보존,WORK만미배포·커밋푸시없음. [동작과 검증한계](../records/shop-text-quest-20261026/MANUAL_KO.md), [최종결과](../records/shop-text-quest-20261026/FINAL_RESULT.json), [추가관찰·미승인](../records/shop-text-quest-20261026/FOLLOW_UPS_KO.md).\r\n';fs.writeFileSync(bundle,text,'utf8');
 const result={status:'APPLIED_AND_VERIFIED',runtimeWritten:true,record,patch:staged.patch,runtimeFiles:m.runtime.map(x=>({...x,path:m.game+'/'+x.path})),backup,checks:{deliveredBytesMatchTestedCandidates:true,officialNative:9,ui:8,cache:1,spacing:staged.spacing,quest:'Expected outcomes matched; original inherited failure fixed by one equals',protectedChecks:protectedFiles.length,existingSavesUnchanged:protectedFiles.filter(x=>/\.sav$/i.test(x)).length,newLocations:0,newPersistentKeys:0},limits:['Native QtWebKit DOM/Range and synthetic events; not physical mouse or screenshot pixel comparison.','GUI Save/Load/CRC and actual reporter save are unverified.','Gameover vertical metrics and untested trailing-space-free long tokens are documented in spacing report.'],fullSynced:false,zipUpdated:false,committed:false,pushed:false,temporaryDiagnostics:'Cleanup pending'};
 fs.writeFileSync(record+'/FINAL_RESULT.json',JSON.stringify(result,null,2)+'\n');fs.writeFileSync(__dirname+'/FINAL_RESULT.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}catch(e){
 for(const f of written)if(c.hash(fs.readFileSync(m.game+'/'+f.path))===f.after)fs.copyFileSync(backup+'/'+f.path,m.game+'/'+f.path);
 if(c.hash(fs.readFileSync(m.game+'/jack.qsp'))===m.after)fs.copyFileSync(backup+'/jack.qsp',m.game+'/jack.qsp');throw e;
}
