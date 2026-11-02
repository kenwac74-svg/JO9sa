'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',REC=R+'/records/group-defeat-layer-audit-20261101',T='G:/Codex/tmp/group-defeat-layer-audit-20261101';
const c=require(R+'/tools/text-workshop/core.cjs'),j=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),hash=p=>c.hash(fs.readFileSync(p));
const report=j(__dirname+'/all-report.json'),source=j(__dirname+'/source-audit.json');
a.equal(report.nativeCompleted,true);a.equal(report.loadedGroups,8);a.equal(report.overlappingGroups.length,8);a.equal(report.productionUnchanged,true);a.equal(hash(W+'/jack.qsp'),source.sourceSha256);a.equal(report.sourceSha256,source.sourceSha256);
for(const row of report.results){a(row.payload.expectedImageLoaded&&row.payload.overlap);a.equal(row.payload.fallback.inlineStyle,'display: none;');a.equal(row.payload.fallback.computed.display,'block');}
const css=fs.readFileSync(W+'/css/base.css','utf8');a(css.includes('.jo9-battle-v01,.jo9-battle-v01 div{display:block!important;}'));
fs.mkdirSync(REC,{recursive:true});
for(const name of fs.readdirSync(__dirname))if(fs.statSync(path.join(__dirname,name)).isFile())fs.copyFileSync(path.join(__dirname,name),path.join(REC,name));
fs.writeFileSync(REC+'/REPORT_KO.md',[
 '# 그룹 승리 결과 레이어 겹침 조사',
 '조사 대상 WORK QSP: '+source.sourceSha256+'。실제 설치 엔진에서 이미 패배한 편성을 구성하여 원래 конец_боя 결과 렌더러를 실행했다. 전체 전투 턴이나 개인 SAV 불러오기를 재현한 검사는 아니다. 생산 QSP·CSS·이미지·세이브는 수정하지 않았다.',
 '단체 전투8종 모두 단체 PNG가 정상 로드됐지만 개별 fallback이 함께 보이는 현상을 관찰했다. 성기사+병사2(개별3장), 검은의사+하인3(4장), 고블린2(2장), 고블린3(3장), 가르시드+수인4(5장), 아레나 탈옥수5(5장), 무작위 수인4(4장), 무작위 부랑자5(5장)다. all-report.json은8개 완료마커와 실제 DOM 상태를 포함한다. 개별 이미지8개가 아니라 그룹종류8개이며, 무작위 구성은 이번에는 대표 편성만 화면 검사했다.',
 '원인: конец_боя83~97에서 단체 이미지와 개별 이미지 wrapper를 함께 출력한다. 단체 PNG의 onload는 다음 sibling의 inline display:none을 정상 설정했다. 그러나 css/base.css10163의 .jo9-battle-v01,.jo9-battle-v01 div{display:block!important;}가 모든 하위 div에 직접 매칭되어 그 숨김을 덮는다. 실제 측정에서도 inlineStyle=display:none와 computed.display=block, 가시 개별 이미지가 동시에 기록됐다. onload 타이밍은 초기 가설이었으며 이번 관찰의 원인은 CSS 우선순위 충돌이다. 그룹 이미지 오류 시 wrapper를 숨기는 기존 onerror도 같은 규칙의 영향을 받을 수 있다.',
 '워크샵: Show html 원문을 수집하는 JO9_Detect.ps1은 숨김 여부와 src/data-standing 용도를 구분하지 않고 content/pic 경로를 모은다. 따라서 원래 그림과 패배 그림이 함께 목록에 표시된다. 목록 수집만으로 화면상 가시성을 판정할 수 없으나 이번에는 실제 엔진의 중첩 표시도 별도로 확인했다.',
 '수정 제안: 단체 그림 경로가 선택되면 그 단체 이미지 하나만 출력하고 개별 fallback HTML을 생성하지 않도록 공용 결과 출력부를 수정한다. 일반 단일 적과 알려지지 않은 로스터의 기존 경로는 유지한다. 완성된 단체 컷을 개별 슬롯 CSS로 다시 나누거나 기존 전신/패배 PNG를 삭제할 필요가 없다. 그룹8장의 경로·이미지는 모두 존재하며795×596이다. 새 저장 변수·UI·추가 이미지 제작은 필요 없다. 이번 조사에서 해당 수정은 적용하지 않았다.',
 '초기 진단의 재렌더/완료 실패는 별도 paladin-initial-render-report 및 paladin-rerender-incomplete-report로 보존했다. 추적 진단은 관찰 속성만 추가했고 실제 일괄 관찰은 original group handler를 유지했다. 일부 진단 화면이 기록한 msg.style 오류는 완료창 환경 문제로 레이어 원인과 분리한다. 관찰용 콜백 원본과 정리된 재현기는 각각 보존하며8그룹 실제 DOM 원시 관측은 all-report.json에 있다.',
 '별도 메타데이터 메모: 이미지 목록의 가르시드/수인 등장 조건 표시에61106/61115가 함께 들어간 부분이 보고됐다. 실제 QSP는 수인4=61106,가르시드+수인4=61115로 구별한다. 레이어 겹침과는 별개이며 이번 작업에서는 수정하지 않았다.'
 ].join('\n\n')+'\n');
const cleaned={files:0,bytes:0,junctions:0};const root=path.resolve(T);a.equal(path.dirname(root),path.resolve('G:/Codex/tmp'));a(!fs.lstatSync(root).isSymbolicLink());const allowed=new Set(['content','css','fonts','json'].map(n=>fs.realpathSync(W+'/'+n).toLowerCase()));
function clean(p){const resolved=path.resolve(p);a(resolved===root||resolved.startsWith(root+path.sep));const s=fs.lstatSync(resolved);if(s.isSymbolicLink()){a(allowed.has(fs.realpathSync(resolved).toLowerCase()));try{fs.unlinkSync(resolved);}catch(e){if(!['EPERM','EISDIR'].includes(e.code))throw e;fs.rmdirSync(resolved);}cleaned.junctions++;return;}if(s.isDirectory()){for(const n of fs.readdirSync(resolved))clean(path.join(resolved,n));fs.rmdirSync(resolved);}else{cleaned.files++;cleaned.bytes+=s.size;fs.unlinkSync(resolved);}}
clean(root);a.equal(hash(W+'/jack.qsp'),source.sourceSha256);
const final={status:'AUDIT_COMPLETE_REPRODUCED_8_OF_8',sourceSha256:source.sourceSha256,groupsObserved:8,groupsOverlapping:8,allGroupImagesLoaded:true,cssSha256:c.hash(Buffer.from(css)),productionWrites:false,fixApplied:false,cleanup:cleaned};fs.writeFileSync(REC+'/verification.json',JSON.stringify(final,null,2)+'\n');console.log(JSON.stringify(final));
