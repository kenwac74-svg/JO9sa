'use strict';
const fs=require('node:fs'),path=require('node:path');
const input=process.argv[2]||path.resolve(__dirname,'../../docs/NEXT_PATCH_CHECKLIST_20261107_KO.md');
const output=path.resolve(__dirname,'../text-workshop');
const clean=s=>s.replace(/\*\*|`/g,'').trim();
const text=fs.readFileSync(input,'utf8');
const recheck=new Set('01 02 04 05 09 13 14 30 31 32 33 34 35 36'.split(' ').map(s=>'P'+s));
const phases=['1차 점검·도구','2차 콘텐츠 연결','3차 사운드','밸런스 결정','장기·별도 승인','출고 전 수동 확인','이력 보관'];
function phase(id){const n=Number(id.slice(1));if(n>=15&&n<=21)return phases[3];if(n>=22&&n<=29)return phases[4];if(n===10)return phases[2];if([3,4,6,7,8,9,13].includes(n))return phases[1];return phases[0];}
const tasks=[...text.matchAll(/^\| \[ \] (P\d+) \| ([^|]+)\|(.+)\|$/gm)].map((m,i)=>({id:m[1],title:clean(m[2]),detail:clean(m[3]),status:recheck.has(m[1])?'재파악':'보류',phase:phase(m[1]),order:i+1,startDate:'',dueDate:'',notes:''}));
for(const m of text.matchAll(/^- \[ \] (Q\d+) (.+)$/gm))tasks.push({id:m[1],title:clean(m[2]).split('。')[0],detail:'일반 게임 EXE에서 사람이 확인할 항목입니다. 실제 착수한 뒤 진행중으로 변경하세요.',status:'보류',phase:phases[5],order:tasks.length+1,startDate:'',dueDate:'',notes:''});
const done=text.split('## 6. 완료·검토 종료로 다음 미구현 목록에서 제외한 것')[1].split('## 추천 편성 순서')[0];
const lines=[...done.matchAll(/^- (.+)$/gm)].map(m=>clean(m[1]));
for(const [i,line] of lines.slice(0,9).entries())tasks.push({id:'C'+String(i+1).padStart(2,'0'),title:line,detail:'최신 적용·출고 기록에 따른 완료 이력입니다. 실제 게임 화면 전수 검증과는 구분합니다.',status:'완료',phase:phases[6],order:tasks.length+1,startDate:'',dueDate:'',notes:''});
for(const [id,title] of [['D01','일반 특성 8칸 제한·만석 획득 차단'],['D02','여성 주인공 신규 콘텐츠']])tasks.push({id,title,detail:'사용자 결정에 따라 작업 후보에서 제외했습니다. 폐기 상태는 이번 도구가 게임 구현이나 파일을 삭제한다는 뜻이 아닙니다.',status:'폐기',phase:phases[6],order:tasks.length+1,startDate:'',dueDate:'',notes:''});
if(tasks.length!==50||new Set(tasks.map(t=>t.id)).size!==50)throw Error('Checklist import count mismatch');
const seed={schema:1,id:'jo9-next-patch-20261107',title:'다음 패치 작업 일정',sourceDate:'2026-11-07',baseline:'2.4.1 · 3차 r2',phases,statuses:['완료','보류','재파악','폐기','진행중'],tasks};
fs.writeFileSync(path.join(output,'patch-schedule-data.cjs'),'// JO9 PATCH_SCHEDULE_20261107 — 체크리스트 기반 초기 자료\nmodule.exports='+JSON.stringify(seed,null,2)+';\n');
console.log('Seed',tasks.length,Object.fromEntries(seed.statuses.map(s=>[s,tasks.filter(t=>t.status===s).length])));

const template=fs.readFileSync(path.join(output,'patch-schedule.template.html'),'utf8');
const html=template.replace('__JO9_PATCH_SEED__',JSON.stringify(seed).replaceAll('<','\\u003c'));
fs.writeFileSync(path.join(output,'patch-schedule.html'),html);
fs.writeFileSync(path.resolve(__dirname,'../../docs/NEXT_PATCH_SCHEDULE_20261107.html'),html);
