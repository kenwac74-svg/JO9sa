'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),cp=require('child_process'),a=require('assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',F='G:/somi/Jack O Nine Tails v2.4 Kor_Full/game';
const T='G:/Codex/tmp/group-defeat-single-cut-20261101',B='G:/somi/JO9_work_backups/group-defeat-single-cut-20261101',REC=R+'/records/group-defeat-single-cut-20261101';
const REL='G:/Codex/tmp/group-defeat-single-cut-release-20261101',ID='2026-11-01_group_defeat_single_cut';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),j=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),hash=p=>c.hash(fs.readFileSync(p));
function prepare(){
 const red=j(__dirname+'/red-report.json');a.equal(red.nativeCompleted,true);a.equal(red.loadedGroups,8);a.equal(red.overlappingGroups.length,8);
 const raw=fs.readFileSync(W+'/jack.qsp');a.equal(c.hash(raw),red.sourceSha256);const d=c.parse(raw);a.deepEqual(c.serialize(d),raw);
 const loc=d.locations.find(x=>x.name==='конец_боя'),body=c.shift(d.lines[loc.body],5);
 const outer=body.indexOf('! JO9 MOD START MOB_GROUP_SETS_20261029'),start=body.indexOf("if $jo9_mg_image ! '':",outer),end=body.indexOf('\r\nelse\r\n local $jo9_bv_image',start);
 a(outer>0&&start>outer&&end>start);const old=body.slice(start,end);a(old.includes('jo9_bv_group_loop'));a(old.includes('nextElementSibling.style.display='));a.equal(body.split(old).length-1,1);
 const next=["if $jo9_mg_image ! '':",'! JO9 MOD START GROUP_DEFEAT_SINGLE_CUT_20261101',
 ' *p \'<div class="jo9-battle-monster-wrap" id="jo9-group-defeat"><img id="jo9-battle-group-image" style="width:100%;height:100%;object-fit:contain;border:0" src="<<$jo9_mg_image>>" onerror="this.style.visibility=String.fromCharCode(104,105,100,100,101,110)"></div>\'',
 '! JO9 MOD END GROUP_DEFEAT_SINGLE_CUT_20261101'].join('\r\n');
 const updated=body.replace(old,next);a(!updated.includes('jo9_bv_group_loop'));a(!updated.includes('jo9-battle-defeated-group'));a(!updated.includes('nextElementSibling.style.display='));
 a.equal(updated.slice(updated.indexOf('\r\nelse\r\n local $jo9_bv_image',start)),body.slice(end));
 d.lines[loc.body]=c.shift(updated,-5);const candidate=c.serialize(d),world=qa.inspectWorld(candidate);
 const inv=c.parse(candidate),il=inv.locations.find(x=>x.name==='конец_боя');inv.lines[il.body]=c.shift(c.shift(inv.lines[il.body],5).replace(next,old),-5);a.deepEqual(c.serialize(inv),raw);
 a(!fs.existsSync(T+'/candidate.qsp'));a(!fs.existsSync(B));fs.mkdirSync(T+'/mods',{recursive:true});fs.mkdirSync(B,{recursive:true});
 fs.writeFileSync(T+'/before.qsp',raw);fs.writeFileSync(B+'/before.qsp.gz',z.gzipSync(raw),{flag:'wx'});a.deepEqual(z.gunzipSync(fs.readFileSync(B+'/before.qsp.gz')),raw);fs.writeFileSync(T+'/candidate.qsp',candidate);
 const patch={id:ID,description:'When a defeated group image is selected, render exactly that image without emitting the individual-image fallback collage. Leave single/unmatched/defeat branches and fate bookkeeping untouched; hide only the image if it fails to load.',before_sha256:c.hash(raw),after_sha256:c.hash(candidate),edits:[{location:'конец_боя',field:'body',old,new:next,count:1}]};
 fs.writeFileSync(T+'/mods/'+ID+'.json',JSON.stringify(patch,null,2)+'\n');
 const info={id:ID,before:patch.before_sha256,after:patch.after_sha256,world,backup:B+'/before.qsp.gz',baseline:T+'/before.qsp',candidate:T+'/candidate.qsp',cssSha256:hash(W+'/css/base.css'),fullQsp:hash(F+'/jack.qsp'),changedLocation:'конец_боя',newSaveFields:0};
 fs.writeFileSync(T+'/prepared.json',JSON.stringify(info,null,2)+'\n');console.log(JSON.stringify({status:'PREPARED',before:info.before,after:info.after,edits:1,newSaveFields:0}));
}
function install(){
 const p=j(T+'/prepared.json'),green=j(__dirname+'/green-report.json'),reg=j(__dirname+'/regression-report.json');
 a.equal(green.pass,true);a.equal(green.sourceSha256,p.after);a.equal(green.loadedGroups,8);a.equal(green.singleGroupOnly,8);a.equal(reg.pass,true);a.equal(reg.sourceSha256,p.after);
 const runs=fs.readdirSync(REL).filter(n=>n.startsWith('run-')).map(n=>({path:REL+'/'+n,r:j(REL+'/'+n+'/report.json')})),gate=runs.find(x=>x.r.verdict==='PASS');a(gate,'Official gate missing');a.equal(gate.r.checks.find(x=>x.name==='inputs-readable').detail.candidate,p.after);
 a.equal(hash(W+'/jack.qsp'),p.before,'WORK has changed; preserve current edits and rebase the narrow patch.');a.equal(hash(W+'/css/base.css'),p.cssSha256);a.equal(hash(F+'/jack.qsp'),p.fullQsp);
 const existing=new Set(fs.readdirSync(W).filter(n=>n.startsWith('jack.qsp.bak_'))),r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/apply_mods.ps1','-Qsp',W+'/jack.qsp','-ModsDir',T+'/mods'],{encoding:'utf8',windowsHide:true,timeout:30000});a.equal(r.status,0,(r.stdout||'')+(r.stderr||''));a.equal(hash(W+'/jack.qsp'),p.after);qa.inspectWorld(fs.readFileSync(W+'/jack.qsp'));
 a.equal(hash(W+'/css/base.css'),p.cssSha256);a.equal(hash(F+'/jack.qsp'),p.fullQsp);fs.mkdirSync(REC,{recursive:true});
 fs.copyFileSync(T+'/mods/'+ID+'.json',R+'/mods/'+ID+'.json');fs.copyFileSync(T+'/prepared.json',REC+'/prepared.json');
 for(const name of fs.readdirSync(__dirname))if(fs.statSync(path.join(__dirname,name)).isFile())fs.copyFileSync(path.join(__dirname,name),path.join(REC,name));
 for(const n of ['report.json','report.md'])fs.copyFileSync(gate.path+'/'+n,REC+'/release-'+n);
 const v={status:'PASS',id:ID,before:p.before,after:p.after,backup:p.backup,groupCases:8,regressionCases:reg.cases.length,enginePaths:gate.r.checks.find(x=>x.name==='installed-client-smoke').detail.passed,newSaveFields:0,newLocations:0,changedLocations:[p.changedLocation],cssUnchanged:p.cssSha256,fullQspUnchanged:p.fullQsp,createdInGameBackups:fs.readdirSync(W).filter(n=>n.startsWith('jack.qsp.bak_')&&!existing.has(n)),humanManualPlay:false};
 fs.writeFileSync(REC+'/verification.json',JSON.stringify(v,null,2)+'\n');
 fs.writeFileSync(REC+'/MANUAL_KO.md',[
 '# 그룹 패배 컷신 단일 출력',
 '사용자 승인으로 WORK의 конец_боя 그룹 결과 출력 한 조각을 수정했다. 알려진 그룹의 패배 컷이 선택되면 단체 PNG 한 장만 만들고, 개별 패배 컷 반복 출력과 onload 숨김 코드를 제거했다. 이미지 오류 시에는 해당 img 자신만 visibility:hidden으로 처리하여 전투 프레임과 기본 배경을 보존한다.',
 '입력은 기존 jo9_battle_fate(group) 조회 결과와 승패다. 그룹8종은 검은 의사+하인3, 성기사+병사2, 고블린2/3, 가르시드+수인4, 탈옥수5, 무작위 수인4, 무작위 부랑자5이다. 출력은795×596 단체 이미지 하나이며 새 저장 변수·로케이션·이미지는 없다. CSS와 원본/개별 PNG를 수정하거나 삭제하지 않았다.',
 '공통 CSS의 display:block!important가 개별 wrapper의 inline display:none을 덮었던 것이 원인이다. 같은 wrapper를 숨기는 보완 대신 불필요한 개별 wrapper를 생성하지 않도록 하여 충돌 원인을 제거했다. 단독 적, 매칭되지 않는 편성 및 플레이어 패배의 기존 else 분기는 바이트 그대로이며 전투 판정·선택·처형 필터·성향·보상·종료 가드도 바꾸지 않았다.',
 '최신 WORK에서 바뀐 NPC 편집을 기준본에 그대로 포함했다. 최소 old/new/count 패치는 mods/'+ID+'.json이며 원문/수정문·전후SHA가 있다. 외부 gzip 복구본은 prepared.json의 backup 경로다. patch old/new를 역방향으로 적용하면 기준본과 바이트가 같다. 오래된 전체 QSP로 현재 WORK를 덮어쓰면 이후 사용자 편집을 잃으므로 반드시 최소 조각을 검토한다.',
 '실제 설치 엔진의8그룹에서 수정 전 겹침을 재현했고 수정 후 단체 이미지1개·개별 fallback DOM0·795×596 로드를 검사했다. 추가 회귀 검사의 실제 범위는 regression-report.json을 따른다. 공식 구조·줄/주석 경계·패치 재생·재적용·인물 JSON·설치 엔진9경로도 PASS다. 개인 SAV를 GUI에서 불러와 모든 전투 턴을 플레이한 검사는 아니다.',
 '이미 결과 화면에서 저장된 $jo9_fate[page] 또는 화면 HTML에는 과거 표현이 남을 수 있다. 이 패치는 새 결과 화면부터 적용되며 기존 결과를 강제 재정산하거나 선택 가드를 초기화하지 않는다. 기존 세이브 형식은 유지한다.',
 'WORK와 추적 패치/검증 기록에만 반영했다. 배포 폴더·ZIP·커밋·푸시는 변경하지 않았다. 이미지 목록의 가르시드/수인 등장조건 표기 문제는 이번 공용 렌더러 수정 범위가 아니다.'
 ].join('\n\n')+'\n');
 console.log(JSON.stringify(v));
}
if(process.argv[2]==='prepare')prepare();else if(process.argv[2]==='install')install();else throw Error('Use prepare or install');
