'use strict';
const fs=require('fs'),path=require('path'),a=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const repo='G:/somi/JO9sa',target=repo+'/records/priscilla-followup-20261116';
const test=JSON.parse(fs.readFileSync(__dirname+'/test-save.json','utf8')),installed=JSON.parse(fs.readFileSync(__dirname+'/installed.json','utf8'));
a.equal(c.hash(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp')),installed.after);
a.equal(c.hash(fs.readFileSync(repo+'/assets/runtime/2.4.1/jack.qsp')),installed.after);
a.equal(c.hash(fs.readFileSync(test.file)),test.sha256);a.equal(c.hash(fs.readFileSync(test.base)),test.baseHash);
for(const i of installed.imageCopies){a.equal(c.hash(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/'+i.runtimePath)),i.sha256);a.equal(c.hash(fs.readFileSync(repo+'/assets/'+i.runtimePath)),i.sha256);}
for(const name of ['REPORT_KO.md','installed-results.json','installed.json','make-test-save.cjs','test-save.json','verify-test-launcher.cjs','test-save-verification.json','finalize-records.cjs'])fs.copyFileSync(__dirname+'/'+name,target+'/'+name);
const draft=repo+'/records/priscilla-story-audit-20261116/POST_PORTAL_DRAFT_KO.md';let text=fs.readFileSync(draft,'utf8');
text=text.replace('# 프리실라 포털 이후 대화 시안 — 확인 대기','# 프리실라 포털 이후 대화 원고 — 승인·반영 완료');
text=text.replace('게임 반영 전 원고 확인용.','사용자가 원고와 연결 방식을 승인하여 2026-11-16 WORK에 반영했다.');
text=text.replace('grand_final은 엔딩 출력 전에0으로 지워지는 임시값이므로 재방문 판정에 쓰지 않는다.','grand_final은 엔딩 출력 전에0으로 지워지는 임시값이다. 실제 구현은 6220 방문 이력과 grand_final=0을 함께 검사해 포털 장면 진행 도중을 제외한다.');
text=text.replace('## 확인할 설정','## 승인 및 구현 기록');
text=text.replace('책은 당분간 프리실라가 보관하고 후속 이벤트에서 정식으로 인계한다는 제안이다. 현재6025에는 책 아이템 지급 처리가 없다는 사실을 바탕으로 했으며, 사용자가 확정한 설정은 아니다. 이 원고와 연결 방식을 확인받은 후 실제 분기·문구를 반영한다.','사용자는 이 원고로 반영하고, 책 전달·의뢰 완료는 후속 이벤트로 남기도록 승인했다. 추가 지시에 따라 대화 뒤 후반4페이지는 포털 귀환 상황에 맞게 새로 썼으며, 기존 그림3종은 별도 priscilla_post_portal_* 파일로 복사해 연결했다. 총15페이지와 1회 방문 처리는 ../priscilla-followup-20261116/REPORT_KO.md 및 approved-pages.json을 기준으로 한다. 원본 이미지·기존6025는 보존했다. 사용자 조율용 테스트 세이브도 WORK save 폴더에 별도 제공했다.');
fs.writeFileSync(draft,text);
const deferred=repo+'/records/deferred-discussions-20261024/index.json',raw=fs.readFileSync(deferred,'utf8'),data=JSON.parse(raw),items=Array.isArray(data)?data:Object.values(data).find(Array.isArray),item=items.find(x=>x.id==='PRISCILLA_AFTER_BARBARIAN_20261116');a(item);
item.title='프리실라 책 인계·전달·최종 의뢰 완료 후속 이벤트';
item.decision='반란 후 재촉 제거·포털 귀환 대화·전용 그림·후반 장면은 사용자 승인으로 WORK 반영 완료. 책의 실제 인계·수령인·전달 결과·최종 의뢰 완료 판정만 후속 개발로 보류.';
item.facts='현재 WORK는 반란 이후6021~6024의 오래된 야만왕 안내를 교체한다. 포털6220 이력+grand_final=0, 새6026 미방문이면15페이지 대화로 이어지고, 재방문은 책 보관 안내다. 기존6025 길드 보상·원고·이미지는 보존한다.';
item.constraints=['책 인계·수령인·전달 결과·최종 완료를 독자적으로 구현하지 않음','기존 반란·보상 수령 기록 보존'];
if(!item.evidence.includes('records/priscilla-followup-20261116/REPORT_KO.md'))item.evidence.push('records/priscilla-followup-20261116/REPORT_KO.md');
const eol=raw.includes('\r\n')?'\r\n':'\n';fs.writeFileSync(deferred,(JSON.stringify(data,null,2)+'\n').replace(/\n/g,eol));
const index=repo+'/docs/SESSION_HANDOFF_INDEX.md';let ix=fs.readFileSync(index,'utf8');const marker='<!-- PRISCILLA_FOLLOWUP_APPLIED_20261116 -->';if(!ix.includes(marker)){ix+='\n\n'+marker+'\n- 2026-11-16: 사용자 승인 프리실라 반란 후 안내·포털 귀환 새 대화15페이지·별도 이미지3개를 WORK/추적 소스에 반영. 책 전달·최종 완료만 후속 개발. 설치본16조건과 테스트 저장의 시작 링크4개 실행 확인. WORK save/프리실라_분기테스트_20261116.sav에서 네 단계 직접 비교 가능. 기존 세이브·Full·ZIP·커밋푸시 없음. [보고서](../records/priscilla-followup-20261116/REPORT_KO.md).\n';fs.writeFileSync(index,ix);}
const scoped=path.resolve(__dirname,'scoped.qsp');a.equal(path.dirname(scoped),path.resolve(__dirname));if(fs.existsSync(scoped)){a(!fs.lstatSync(scoped).isSymbolicLink());fs.unlinkSync(scoped);}
process.stdout.write(JSON.stringify({qsp:installed.after,testSave:test.file,testSaveHash:test.sha256,sourceAndWorkMatch:true,imageCopies:3,recordsUpdated:true,temporaryScopedQspRemoved:!fs.existsSync(scoped)})+'\n');
