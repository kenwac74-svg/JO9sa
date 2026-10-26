'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const repo='G:/somi/JO9sa',rec=repo+'/records/golden-collar-fix-20261025',root='G:/Codex/tmp/jo9-golden-collar-fix-20261025',release=path.dirname(JSON.parse(fs.readFileSync(rec+'/installed.json','utf8')).releasePath);
fs.mkdirSync(rec+'/evidence',{recursive:true});
for(const n of ['PLAN_KO.md','REPORT_KO.md','MANUAL_KO.md'])fs.copyFileSync(__dirname+'/'+n,rec+'/'+n);
for(const n of ['build.cjs','preserve-scope.cjs','tests-native.cjs','other-roles-test.cjs','ui-load-tests.cjs','install.cjs','finish.cjs','cleanup.ps1'])fs.copyFileSync(__dirname+'/'+n,rec+'/scripts/'+n);
for(const [from,to] of [[root+'/native-fixtures/results.json','native-results.json'],[root+'/ui-load/report.json','native-ui-load-results.json'],[release+'/report.json','release-report.json'],[release+'/report.md','release-report.md']])fs.copyFileSync(from,rec+'/'+to);
fs.copyFileSync(root+'/other-roles/report.json',rec+'/other-roles-results.json');
for(const dir of [root+'/native-fixtures',root+'/ui-load',release])for(const n of fs.readdirSync(dir))if(/(?:stderr\.log|client.*\.log|patch.*\.log)$/.test(n))fs.copyFileSync(dir+'/'+n,rec+'/evidence/'+path.basename(dir)+'-'+n);
for(const p of [repo+'/docs/SESSION_HANDOFF_INDEX.md',repo+'/docs/PENDING_ISSUES_20261015.md']){
 if(fs.existsSync(p)){const text=fs.readFileSync(p,'utf8');if(!text.includes('golden-collar-fix-20261025'))fs.appendFileSync(p,'\n\n금장 목줄 거부 정지 A안(2026-10-25): WORK 적용·문법/실제 엔진 검증 완료. 구형 질문 복구, 중복 피해/반환 방지. 기존 조사 기록의 승인 대기는 이 적용 기록으로 대체한다. [결과](../records/golden-collar-fix-20261025/REPORT_KO.md). Full/ZIP/커밋/푸시 없음.\n');}
}
const report=fs.readFileSync(repo+'/records/pendant-refusal-review-20261025/REPORT_KO.md','utf8');
if(!report.includes('golden-collar-fix-20261025'))fs.appendFileSync(repo+'/records/pendant-refusal-review-20261025/REPORT_KO.md','\n\n후속: 사용자가 A안을 승인했고, WORK 적용 및 검증을 완료했다. [적용 결과](../golden-collar-fix-20261025/REPORT_KO.md)가 위 조사 당시의 승인 대기 상태를 대체한다.\n');
const installed=JSON.parse(fs.readFileSync(rec+'/installed.json','utf8'));a.equal(c.hash(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp')),installed.after);
console.log('Reports and reproducible scripts retained; WORK verified '+installed.after);
