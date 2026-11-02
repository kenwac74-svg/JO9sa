'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),z=require('zlib'),vm=require('vm'),H=__dirname,v=JSON.parse(fs.readFileSync(H+'/generation.json','utf8')),core=require(v.repo+'/tools/text-workshop/core.cjs');
const source=v.repo+'/tools/scene-image-conditions',record=v.repo+'/records/scene-image-conditions-20261030',backup='G:/somi/JO9_work_backups/scene-image-conditions-20261030';
function scripts(html){for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/\bsrc\s*=/.test(m[1]))new vm.Script(m[2]);}
for(const x of Object.values(v.preserved))a.equal(core.hash(fs.readFileSync(x.path)),x.sha256,x.path);
for(const f of v.catalogs){const raw=fs.readFileSync(f.file),next=fs.readFileSync(f.candidate),html=next.toString('utf8');a.equal(core.hash(raw),f.before);a.equal(core.hash(next),f.after);scripts(html);const oldRows=JSON.parse(raw.toString('utf8').match(/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/)[1]),newRows=JSON.parse(html.match(/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/)[1]);a.deepEqual(newRows.slice(0,oldRows.length),oldRows);a.equal(newRows.length-oldRows.length,f.added.length);}
const metadata=JSON.parse(fs.readFileSync(v.tmp+'/metadata.json','utf8'));a.equal(Object.keys(metadata.entries).length,v.total);a.equal(metadata.qspSha256,v.qspSha256);const included=new Set(JSON.parse(fs.readFileSync(v.catalogs[0].candidate,'utf8').match(/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/)[1]).map(x=>x[0].replaceAll('\\','/').toLowerCase()));for(const key of Object.keys(metadata.entries))a(included.has(key),key);
fs.mkdirSync(source,{recursive:true});fs.mkdirSync(record,{recursive:true});fs.mkdirSync(backup,{recursive:true});
for(const [i,f]of v.catalogs.entries()){const b=backup+'/catalog-'+i+'.html.gz';fs.writeFileSync(b,z.gzipSync(fs.readFileSync(f.file),{level:9}),{flag:'wx'});a(z.gunzipSync(fs.readFileSync(b)).equals(fs.readFileSync(f.file)));fs.copyFileSync(f.candidate,f.file);a.equal(core.hash(fs.readFileSync(f.file)),f.after);}
for(const name of ['analyse.cjs','analyse.test.cjs','catalog-scene-conditions.js','catalog.test.cjs','generate.cjs','install.cjs','PLAN_KO.md'])fs.copyFileSync(H+'/'+name,source+'/'+name);
fs.copyFileSync(v.tmp+'/metadata.json',record+'/metadata.json');fs.copyFileSync(H+'/generation.json',record+'/installation.json');
fs.writeFileSync(source+'/README_KO.md',[
'# Scene 이미지 등장·재현 조건','',
'현재 WORK scene 폴더를 읽어 이미지 체크리스트의 각 카드에 요약과 펼침 상세를 삽입한다. 게임 QSP/이미지/세이브/체크 상태는 쓰지 않는다. build 함수는 정적 입력을 받고 경로별 조건 메타데이터를 반환한다. generate는 현재 QSP, runtime JSON, CSS, 실제 씬 목록을 읽고 후보 HTML과 JSON을 만든다. install은 전후 해시·JS문법·기존 목록 보존·전파일 포함을 검사한 후보만 WORK/seed에 적용하고 원본 HTML gzip 복구본을 남긴다.','',
'표시는 직접 연결, 명시적 난수/번호 선택, 동적 후보, 정의부, 수동 전환 컷, 실행 연결 미확인을 구분한다. 메뉴 가용 조건, 이벤트 내부 조건, 페이지 슬롯, 상위 이벤트 번호 지정 지점과 코드 위치를 볼 수 있다. 조건은 실시간 세이브값이 아니며 그림 내용으로 조건을 추측하지 않는다.','',
'재분석: node tools/scene-image-conditions/generate.cjs --game "<WORK/game>" --repo "<JO9sa>" --out "G:/Codex/tmp/<새 작업명>". 후보 생성 후 generation.json을 검토해 설치한다. 설치 스크립트는 실행 파일과 생성 명세를 같은 폴더에서 읽으므로 generation.json과 함께 실행해야 한다. 기존 날짜 백업이 있으면 덮어쓰지 않고 중단한다.','',
'의존: tools/text-workshop/core.cjs의 QSP/문자열 코덱, scenes.cjs의 주석·분기 분석. 브라우저는 기존 rowHtml과 JO9_CATALOG_BRIDGE, 선택적으로 /api/state를 사용한다. 표시 모듈을 빼면 조건 표시만 사라지며 게임 동작은 바뀌지 않는다. 새 서버 API나 서버 재시작은 없다. QSP 해시가 달라지면 화면에 오래된 분석임을 알린다.','',
'한계: 상위 진행은 이벤트 번호를 지정하는 소스 근거이고, 이후 덮어쓰기·동적 호출·저장 상태를 완전히 실행해 검증한 재현 경로가 아니다. 현재 연결을 못 찾았다고 미사용/삭제 가능으로 단정하지 않는다. 단독 번호명에 근거해 형제 파일을 자동 연결하지 않는다. 카탈로그 밖 게임 참조 경로는 metadata.json의 unresolved에 별도로 남긴다.',''].join('\r\n'));
for(const x of Object.values(v.preserved))a.equal(core.hash(fs.readFileSync(x.path)),x.sha256,x.path);
console.log(JSON.stringify({installed:true,total:v.total,counts:v.counts,source,record,backup,gameAndStatusPreserved:true}));
