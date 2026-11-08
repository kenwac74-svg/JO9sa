'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),z=require('zlib'),vm=require('vm'),cp=require('child_process');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/sfx-runtime-fix-20261108',O=R+'/records/sfx-runtime-fix-20261108';
const c=require(R+'/tools/text-workshop/core.cjs'),hash=b=>c.hash(b),read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),json=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const p=read(O+'/installed.json'),assets=read(O+'/assets.json'),monsters=read(O+'/monsters.json');
a.equal(hash(fs.readFileSync(G+'/jack.qsp')),p.after);a.equal(hash(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')),p.after);
const manifest=R+'/assets/runtime-source-2.4.1.json',m=read(manifest),qsp=m.files.find(x=>x.runtimePath==='jack.qsp');qsp.sha256=p.after;qsp.bytes=fs.statSync(G+'/jack.qsp').size;m.latestQspFix={id:'2026-11-08_adopted_combat_monster_sfx',record:'records/sfx-runtime-fix-20261108/REPORT_KO.md',qspSha256:p.after};json(manifest,m);
const approval=R+'/tools/sound-audition/approved-selections.json',approved=read(approval);
for(const [i,file]of [approval,R+'/tools/sound-audition/청취_목록.html'].entries())fs.writeFileSync(O+'/sound-ui-before-'+i+'.gz',z.gzipSync(fs.readFileSync(file),{level:9}));
function selection(e,key){const value={key,role:e.role,label:'WORK 재생 연결 완료',sourceName:path.basename(e.source),filename:e.filename,sourcePage:e.sourcePage||null,source:e.source,sourceSha256:e.sourceSha256,sha256:e.sha256,bytes:e.bytes};const i=approved.entries.findIndex(x=>x.key===key);if(i<0)approved.entries.push(value);else approved.entries[i]={...approved.entries[i],...value};}
for(const e of assets.filter(x=>x.role!=='monster'))selection(e,e.key);
for(const entry of monsters)selection(assets.find(x=>x.filename===entry.filename),entry.key);
json(approval,approved);cp.execFileSync(process.execPath,[R+'/tools/sound-audition/build.cjs'],{windowsHide:true});
const soundHtml=fs.readFileSync(R+'/tools/sound-audition/청취_목록.html','utf8');for(const s of soundHtml.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/\bsrc\s*=/.test(s[1]))new vm.Script(s[2]);
for(const e of assets){a.equal(hash(fs.readFileSync(e.source)),e.sourceSha256);for(const root of [G+'/content/snd',R+'/assets/content/snd'])a.equal(hash(fs.readFileSync(root+'/'+e.filename)),e.sha256);}
const log=fs.readFileSync(O+'/runtime-stderr.log','utf8'),audioCounts={};for(const k of ['jo9_monster_405454','jo9_execution','jo9_release','jo9_victory','jo9_defeat','jo9_critical']){audioCounts[k]=(log.match(new RegExp(k+'\\.wav','g'))||[]).length;a.equal(audioCounts[k],1,k);}
const temp=T+'/catalog-refresh';cp.execFileSync(process.execPath,[R+'/tools/scene-image-conditions/generate.cjs','--repo',R,'--game',G,'--out',temp],{windowsHide:true});
const generation=read(R+'/tools/scene-image-conditions/generation.json'),metadata=read(temp+'/metadata.json');
a.equal(metadata.qspSha256,p.after);
const block=/<!-- JO9_SCENE_CONDITIONS_START -->[\s\S]*?<!-- JO9_SCENE_CONDITIONS_END -->\s*/g,rows=/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/;
const strip=s=>s.replace(block,'').replace(rows,(_,data)=>'var D = '+JSON.stringify(JSON.parse(data))+';\nvar MR').trimEnd();
for(const [i,f]of generation.catalogs.entries()){
 const before=fs.readFileSync(f.file),next=fs.readFileSync(f.candidate),html=next.toString('utf8');a.equal(hash(before),f.before);a.equal(hash(next),f.after);a.equal(strip(before.toString('utf8')),strip(html));
 for(const s of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/\bsrc\s*=/.test(s[1]))new vm.Script(s[2]);
 const backup=O+'/catalog-before-'+i+'.html.gz';fs.writeFileSync(backup,z.gzipSync(before,{level:9}));a(z.gunzipSync(fs.readFileSync(backup)).equals(before));fs.writeFileSync(f.file,next);
}
fs.copyFileSync(temp+'/metadata.json',O+'/scene-metadata.json');
json(O+'/verification.json',{qspSha256:p.after,trackedQspMatches:true,structureAndMarkersPassed:true,patchReplayAndIdempotencyPassed:true,nativeEngine:read(O+'/client-results.json'),nativeAudioCommandsOnce:audioCounts,monsterMappings:monsters.length,convertedOrPreservedWavs:assets.length,newWavs:assets.filter(e=>e.filename!=='gsid.wav').length,sourceAudioHashesPreserved:true,sceneMetadataQsp:metadata.qspSha256,sceneCounts:metadata.counts,fullTouched:false,heardByAgent:false});
fs.copyFileSync(__filename,O+'/finalize.cjs');
const report=[
'# 채택 효과음 실제 재생 누락 수정 — 2026-11-08','',
'원인: 설정(4)의 채택 기록과 실제 게임 연결이 분리돼 있었다. 기존 런타임에는 가르시드·둔기만 연결돼 있었고, 처형/석방/승패/치명타의 PLAY 호출과 다른 몬스터 파일 설치·매핑이 없었다. 청취용 원본은 이 PC 프로젝트 output/jo9-sound-preview-20261106에 실제로 존재한다. 이전 인계의 파일 부재 기록은 현재 상태와 다르다.','',
'## 반영','',
'- 채택 전투 효과음 5종(승리, 전투 패배, 처형, 석방, 기존 코드가 치명타로 표시하는 졸개 확정 타격)과 몬스터18종을 실제 WAV/재생 코드로 연결. WAV 22파일 중 gsid.wav는 보존, 신규21파일 설치. assets.json·monsters.json에 원본·해시·역할을 기록했다.',
'- 처형/석방은 jo9_battle_fate choose의 모든 유효성/연습 처형 금지 검사와 장부 처리가 끝난 후 1회 호출한다. 반복 클릭은 기존 phase 방어로 소리가 나지 않는다. 기존 안개 전투의 석방 불가 조건 등 선택 규칙은 바꾸지 않았다.',
'- 몬스터는 새 전투에서 대기 후 기존 BGM 호출 다음 flush에서 한 번 재생한다. 안개 이어하기/로드/화면 재표시에서는 재시작하지 않는다. 여러 적이면 첫 등록 몬스터의 대표 등장음 한 번, 가르시드가 있으면 가르시드 우선. 검투/캣파이트 별도 시작 위치에도 초기화를 연결했다.',
'- 승패음은 안개 조수/노예 릴레이가 계속되는 분기 이후 최종 전투 결과에서 1회. 도주에는 패배음을 넣지 않았다. 치명타음은 원래 게임이 [치명타]로 출력하는 타격에서만 예약하며 일반 둔기음보다 우선한다.',
'- 기존 sound_on/sound_volume을 사용하며 gameover 전용 음악/효과음과 기존 BGM 우선순위는 유지했다. 음악 선택·능력치·승패·확률·처형/석방 허용 규칙은 변경하지 않았다.',
'- WORK와 추적 QSP/음원/원장, 청취 도구의 설치본 연결 표시를 갱신했다. 원본 MP3·설정 JSON·기존 체크는 보존했다. 씬 분석도 새 QSP 기준으로 갱신해 변경 경고가 남지 않게 했다.','',
'## 검증과 사용','',
'QSP SHA256 '+p.after+'. 구조/줄/주석 경계, 기존 적용기로 이번6개 편집 재생 및 재적용 멱등성 통과. WAV22개 디코딩 통과. 설치 엔진의 짧은 격리 검사에서 몬스터18종 매핑, 새전투/이어하기, 정상 처형·석방, 중복 클릭·연습 처형 차단, 음소거를 확인했다. 실제 파일 PLAY 명령6개가 각1회 로그에 남았다. 청감과 사용자 세이브의 전체 플레이는 수행하지 않았다.',
'',
'실행 중 게임은 이전 QSP를 메모리에 보유한다. 진행을 저장하고 게임을 완전히 종료한 뒤 다시 실행하여 기존 세이브를 불러와야 새 코드가 로드된다. 새 전투에서 몬스터 등장음, 전투 종료 후 허용된 처형/석방 선택에서 소리를 확인한다.','',
'## 코드/복구','',
'jo9_combat_sfx: intro(적키→파일), start(이어하기 여부), reset, hit(피해 종류), critical, flush, result(기존 결과키), fate(선택1/2). 반환은 intro의 $result만 사용한다. 대기 배열과 등장 경로를 쓰고 reset/로드에서 초기화한다. 기존 helper호출8곳+새6개 편집의 위치는 mods/2026-11-08_adopted_combat_monster_sfx.json에 있다. 제거 시 해당 호출과 파일 매핑도 함께 제거해야 한다.',
'before.qsp.gz와 runtime-source-before.json.gz, catalog-before-0/1.html.gz, sound-ui-before-0/1.gz가 작업 전 복구 자료다. task.cjs/helper.qsrc/test.qsrc/finalize.cjs가 재현 자료다. 이후 변경이 있으면 전체 복구본을 그대로 덮어쓰지 않는다. Full·배포 ZIP·커밋·푸시 없음.',''
].join('\n');fs.writeFileSync(O+'/REPORT_KO.md',report);
const index=R+'/docs/SESSION_HANDOFF_INDEX.md',text=fs.readFileSync(index,'utf8'),header='# JO9 통합 대화 인계';
a(text.startsWith(header));fs.writeFileSync(index,header+'\n\n## 2026-11-08 채택 효과음 실제 연결 누락 수정\n\n[원인·적용·검증](../records/sfx-runtime-fix-20261108/REPORT_KO.md). 처형·석방을 포함한 전투5종과 몬스터18종을 실제 연결했다. 채택 원본에서 신규WAV21개 설치, 기존gsid 보존. 실제 엔진 파일 재생 명령·중복/음소거·연습 처형 방어 확인, QSP60f8bc40… WORK/추적 일치. 플레이/청감은 사용자 확인, 게임 완전 종료 후 재실행 필요. 씬 분석도 새 해시 갱신. Full/배포/커밋푸시 없음.'+text.slice(header.length));
// Remove only this task's verified regenerable files; never follow links.
function cleanup(dir){const root=path.resolve(dir);a(root===path.resolve(T)||root.startsWith(path.resolve(T)+path.sep));const stat=fs.lstatSync(root);a(!stat.isSymbolicLink());if(stat.isDirectory()){for(const e of fs.readdirSync(root))cleanup(path.join(root,e));fs.rmdirSync(root);}else {a(stat.isFile());fs.unlinkSync(root);}}
cleanup(T);console.log(JSON.stringify({verified:true,qsp:p.after,monsters:18,newWavs:21,sceneAnalysisRefreshed:true,tmpRemoved:!fs.existsSync(T)}));
