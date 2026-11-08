'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),{test}=require('node:test');
const root=process.env.JO9_WORKSHOP_UI_ROOT||'G:/somi/Jack O Nine Tails v2.4_work/game/modtools/text-workshop';
const html=fs.readFileSync(root+'/index.html','utf8'),initial=html.split('<script')[0];
test('탭·각본·고급출력·저널·AI 영역을 초기 HTML에서 만든다',()=>{
 for(const id of ['workshopApp','workshopScroll','rangeTaskTabs','workshopScriptTab','workshopEditTab','workshopScriptPanel','workshopEditPanel','scriptRangeBox','scriptExportBox','journalKeywords','dialogueAI','aiBody'])a.ok(initial.includes('id="'+id+'"'),id);
 const ids=[...initial.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);a.equal(new Set(ids).size,ids.length);
});
test('기능 모듈이 화면을 다시 만들거나 강제 숨김 CSS를 추가하지 않는다',()=>{
 for(const name of ['script-range.js','script-export.js','dialogue-ai.js']){const s=fs.readFileSync(root+'/'+name,'utf8');a.ok(!/createElement\('style'\)|node\('style'\)|document\.head\.append|\.innerHTML\s*=|\.paddingBottom/.test(s),name);}
 const css=fs.readFileSync(root+'/workshop.css','utf8');a.ok(!css.includes('!important'));a.ok(!css.includes('data-jo9-workshop-mode'));a.ok(!/body[^}]*padding-bottom/.test(css));a.ok(!/#dialogueAI[^}]*position:fixed/.test(css));
});
test('기존 수정·검색·반영·복원·각본 입력 ID를 보존한다',()=>{
 for(const id of ['query','location','viewMode','search','results','editor','original','replacement','additionText','additionMode','additionPreview','variableBox','variableCopy','preview','approved','apply','navigation','backScene','nextScene','prevText','nextText','game','shots','gameLines','sceneTextsBox','sourceBox','bulkQuery','bulkPreview','bulkApproved','bulkApply','history','refresh','historyPrev','historyNext','scriptPreview','scriptAdapted','scriptApproved','scriptApply','aiCommand','aiReply','aiSave','aiUse','aiImage'])a.ok(initial.includes('id="'+id+'"'),id);
});
