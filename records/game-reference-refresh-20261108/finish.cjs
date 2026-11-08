'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',O=R+'/records/game-reference-refresh-20261108',W=__dirname,T='G:/Codex/tmp/game-reference-refresh-20261108',core=require(R+'/tools/text-workshop/core.cjs');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const snapshot=read(R+'/tools/game-reference/snapshot.json'),sha=core.hash(fs.readFileSync(G+'/jack.qsp'));a.equal(sha,snapshot.sourceQspSha256);
const source=fs.readFileSync(R+'/tools/game-reference/jo9-reference.html');a(source.equals(fs.readFileSync(G+'/modtools/game-reference/jo9-reference.html')));
for(const f of snapshot.files)a.equal(core.hash(fs.readFileSync(R+'/tools/game-reference/'+f.file)),f.sha256);
const sound=read(W+'/../sound-cleanup-20261108/audit.json');for(const f of sound.files)a.equal(core.hash(fs.readFileSync(G+'/content/snd/'+f.name)),f.sha256);a.equal(fs.readdirSync(G+'/content/snd').filter(f=>/\.(wav|mp3|ogg|flac|m4a)$/i.test(f)).length,sound.files.length);
const zip=read(W+'/package-verification.json');a.equal(core.hash(fs.readFileSync(zip.zip)),zip.sha256);
const status=read(G+'/modtools/game-reference/runtime/server.json');
const verification={qspSha256:sha,qspUnchanged:true,traits:128,items:271,oldTraitNamesPreserved:true,oldItemIdsPreserved:true,newTraits:['정액 중독','석녀'],specialFoodPricesChecked:true,sourceAndWorkHtmlMatch:true,scriptSyntax:true,psSyntax:true,serverReusedUrl:status.url,serverPid:status.pid,browser:['128/271 tab totals','new trait acquisition/treatment text','fruit 50 gold or 500 sparks /10 portions','tab/search redraw'],zip,soundCleanupCancelled:true,soundFilesUnchanged:sound.files.length,fullTouched:false,committed:false,pushed:false};
fs.writeFileSync(O+'/verification.json',JSON.stringify(verification,null,2)+'\n');
for(const f of ['prepare.cjs','install.cjs','package.py','finish.cjs'])fs.copyFileSync(W+'/'+f,O+'/'+f);
fs.copyFileSync(W+'/package-verification.json',O+'/package-verification.json');
fs.copyFileSync(W+'/reference-current.jpg',O+'/reference-current.jpg');
fs.writeFileSync(O+'/REPORT_KO.md',[
'# 현재 WORK 특성·아이템 열람표 갱신·모드툴 연결·ZIP — 2026-11-08','',
'사운드 정리는 사용자 지시로 취소했다. 이동은 실행하지 않았으며 게임 사운드127개 모두 조사 전 해시와 같다.','',
'원격 41c1a6409e89b1cccac50f1c033d16a5043030d2의 tools/game-reference 폴더만 가져왔다. 현재 WORK QSP '+sha+'로 다시 추출했다. 특성126→128(정액 중독·석녀), 아이템270→271(특등급 처녀고기), 기본196+조리음식75. 기존 특성 이름과 아이템ID를 보존하고 색정광/불감증의 ID 조건은 현재의 정확한 등급으로 분리했다.','',
'신규 특성은 무작위 생성이라고 잘못 추정하던 문구를 현재 발현·승급·치료·기존 시루 보정 코드로 보완했다. 과일은50금화 또는500스파크/10회분, 와인은50금화/10회분. 특별요리 한 단계 개선·재료 우선순위와 특등급 처녀고기의 현재 획득 이벤트 미연결을 표시했다. 미확인 경로를 임의로 채우지 않았다. 별도 마법DB는 원래 도구 범위에 없다.','',
'items.input.json을 추출·획득처 보완 입력으로 구분하고 traits.json/items.json은 HTML과 같은 최종 데이터로 저장한다. assemble 재실행 때 조리 음식이 중복 추가되지 않음을 확인했다. 새 수동 보완은 refresh-current.cjs에서 현 QSP의 조건/수치를 검증한 뒤 붙인다.','',
'Open-Modding-Tools.ps1의 GAME_REFERENCE_TOOL_20261108 구간은 4개 도구 파일을 WORK/modtools/game-reference로 동기화하고 전용 읽기 서버를 시작/재사용한다. GameReference URL을 출력하고 일반 실행에서는 해당 탭도 연다. 서버는127.0.0.1만 접속하며 game-reference/Start-Game-Reference.ps1은 실제 PID·스크립트 경로·상태를 확인한다. 본문 갱신은 서버 재시작 없이 다음 요청에 반영된다. 제거하면 통합 열기에서 해당 도구만 빠진다.','',
'검증: QSP읽기 왕복, 구버전 항목 보존, 현재128/271개, 완성JSON과HTML 데이터 일치, JS/PowerShell문법, 재생성 음식 중복 없음, 실행기 연속호출 시같은서버 재사용, 실제 브라우저 탭·검색·신규특성·가격 표시 확인. ZIP17항목 전체 바이트 대조와 CRC 검사 통과. UI 화면은 reference-current.jpg, 압축 해시는 package-verification.json.','',
'다운로드 ZIP에는 단독HTML, 같은 데이터JSON과 생성기·템플릿·의존 core.cjs·서버·사용법을 포함한다. 게임QSP·음원·세이브·키·개인설정·runtime은 제외한다. game-reference/README.md에 단독 열람과 재생성 방법을 기록했다. 최신 WORK 기반의 정적 열람표이며 게임 실행을 자동 추적하지 않는다.','',
'게임QSP와사운드·세이브·Full·배포게임ZIP·커밋·푸시는 변경하지 않았다. 이번 ZIP은 사용자 요청한 도구 다운로드용이며 정식 게임 패치가 아니다. 작업 전 도구/통합 실행기/문서의 복구 자료는 before/와 installation.json, 원격 제작본은 원본 커밋에 보존됐다. 재생성 가능한 G:/Codex/tmp 작업 사본은 검사 후 정리했다.',''
].join('\n'));
const index=R+'/docs/SESSION_HANDOFF_INDEX.md',old=fs.readFileSync(index,'utf8'),header='# JO9 통합 대화 인계';a(old.startsWith(header));
fs.writeFileSync(index,header+'\n\n## 2026-11-08 특성·아이템 열람표 최신화·모드툴·다운로드 ZIP\n\n[작업/검증/복구](../records/game-reference-refresh-20261108/REPORT_KO.md). 최신 원격 제작본을 현재WORK60f8bc40…로 갱신, 특성128·아이템271. 신규2특성 발현/치료와 특별요리 가격·수량/입수 미연결 보완. 모드툴 통합 실행기에 GameReference 추가, 실제 화면과 읽기서버 재사용 확인. 단독HTML·JSON·생성기 ZIP17항목 대조 완료. 사운드 정리는 사용자 취소,127개 전부 해시 불변. 게임/Full/커밋푸시 변경 없음.'+old.slice(header.length));
function cleanup(dir){const resolved=path.resolve(dir),root=path.resolve(T);a(resolved===root||resolved.startsWith(root+path.sep));const st=fs.lstatSync(resolved);a(!st.isSymbolicLink());if(st.isDirectory()){for(const n of fs.readdirSync(resolved))cleanup(path.join(resolved,n));fs.rmdirSync(resolved);}else{a(st.isFile());fs.unlinkSync(resolved);}}
cleanup(T);console.log(JSON.stringify({verified:true,zip:zip.zip,zipBytes:zip.bytes,traits:128,items:271,soundFilesUnchanged:sound.files.length,url:status.url,tempRemoved:true}));
