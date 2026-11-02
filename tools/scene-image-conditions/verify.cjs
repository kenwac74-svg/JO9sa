'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),z=require('zlib'),vm=require('vm'),cp=require('child_process');
const record='G:/somi/JO9sa/records/scene-image-conditions-20261030',source='G:/somi/JO9sa/tools/scene-image-conditions';
const v=JSON.parse(fs.readFileSync(record+'/installation.json','utf8')),m=JSON.parse(fs.readFileSync(record+'/metadata.json','utf8'));
const hash=b=>require('crypto').createHash('sha256').update(b).digest('hex');
for(const x of Object.values(v.preserved))a.equal(hash(fs.readFileSync(x.path)),x.sha256,x.path);
for(const [i,f] of v.catalogs.entries()){
 const b=fs.readFileSync(f.file);a.equal(hash(b),f.after);const html=b.toString('utf8');
 for(const s of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/\bsrc\s*=/.test(s[1]))new vm.Script(s[2]);
 const rows=t=>JSON.parse(t.match(/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/)[1]);
 const old=rows(z.gunzipSync(fs.readFileSync('G:/somi/JO9_work_backups/scene-image-conditions-20261030/catalog-'+i+'.html.gz')).toString('utf8')),now=rows(html);
 a.deepEqual(now.slice(0,old.length),old);a.equal(now.length-old.length,6);
 const included=new Set(now.map(x=>x[0].replaceAll('\\','/').toLowerCase()));for(const k of Object.keys(m.entries))a(included.has(k),k);
}
a.equal(Object.keys(m.entries).length,1109);
const save=v.game+'/save/JO9_GOLD_AP_CHECK_20261026.sav';a.equal(hash(fs.readFileSync(save)),'581fc472bfa5aedcbca85c379d0061ad8d28a9b928ef948a259dee7c800ad2ec');
const tests=cp.execFileSync(process.execPath,['--test',source+'/analyse.test.cjs',source+'/catalog.test.cjs'],{encoding:'utf8'});fs.writeFileSync(record+'/test-results.txt',tests);
fs.copyFileSync(__filename,source+'/verify.cjs');
fs.copyFileSync(__dirname+'/live-proof.png',record+'/live-proof.png');
const result={verified:true,total:1109,counts:v.counts,tests:12,fail:0,originalCatalogRowsPreserved:true,qspUnchanged:true,statusUnchanged:true,representativeSaveUnchanged:true,browser:['arena_end details and source conditions','public_use_9 unlinked label','cowshed_2 menu availability and random conditions','search redraw preserves annotations','user catalog refreshed'],limits:'Static source analysis. Not all scenes reproduced through gameplay.'};
fs.writeFileSync(record+'/verification.json',JSON.stringify(result,null,2));
fs.writeFileSync(record+'/REPORT_KO.md',`# scene 이미지 재현 조건 표시\n\n현재 WORK의 scene 이미지 ${v.total}개를 분석해 이미지 체크리스트 각 카드에 등장·재현 조건을 반영했다. 직접 연결 ${v.counts.direct}, 무작위 ${v.counts.random}, 동적 후보 ${v.counts.dynamic}, 이미지 전환용 ${v.counts.alternate}, 실행 연결 미확인 ${v.counts.unlinked}개다. 기존 카드와 상태값을 보존하고 실제 파일이 목록에서 빠졌던 6개만 추가했다.\n\n각 카드에서 상세 조건을 펼치면 진입 메뉴, 메뉴 표시 조건, 이벤트 분기, 이미지 슬롯·페이지, 코드 위치를 확인할 수 있다. 상위 이벤트로 이어지는 소스 조건도 별도로 펼친다. 전체 실행 경로를 보장하는 공략이 아닌 현재 코드의 정적 근거다. ELSE는 그 외 분기로 표시하며 동적 호출·세이브 상태를 모두 실행하지는 않았다. 실행 연결 미확인은 미사용 또는 삭제 가능 판정이 아니다.\n\n12개 자동 검사와 양쪽 HTML의 모든 인라인 JS 문법 검사, 기존 목록 보존, 1,109개 포함 검사를 통과했다. 실제 브라우저에서 콜로세움 종료 조건 펼침, 실행 연결 미확인 표시, 암소 제안 메뉴 조건, 검색 후 표시 유지와 사용자 탭 새로고침을 확인했다. 모든 씬을 플레이로 재현한 것은 아니다.\n\nQSP·체크 상태·대표 기존 세이브 해시는 변경 전과 같다. 이미지·게임 동작은 수정하지 않았다. 배포 폴더·커밋·푸시는 작업 범위에 포함하지 않았다. 도구 입력·출력·의존성과 제거 영향은 tools/scene-image-conditions/README_KO.md에 기록했다. 원본 카탈로그 gzip 복구본은 G:/somi/JO9_work_backups/scene-image-conditions-20261030 에 있다.\n`);
const temp=path.resolve(v.tmp),allowed=path.resolve('G:/Codex/tmp/scene-image-conditions-20261030');a.equal(temp,allowed);a.equal(path.dirname(temp),path.resolve('G:/Codex/tmp'));
const nodes=fs.readdirSync(temp,{withFileTypes:true});for(const n of nodes){const p=path.join(temp,n.name),st=fs.lstatSync(p);a(!st.isSymbolicLink()&&!st.isDirectory(),p);a(['metadata.json','catalog-0.html','catalog-1.html'].includes(n.name),n.name);}
let bytes=0;for(const n of nodes){const p=path.join(temp,n.name);bytes+=fs.statSync(p).size;fs.unlinkSync(p);}fs.rmdirSync(temp);fs.writeFileSync(record+'/cleanup.json',JSON.stringify({removedRegenerableTemporaryFiles:nodes.length,bytes,removedFolder:temp,originalBackupsPreserved:true},null,2));
console.log(JSON.stringify({...result,cleanedBytes:bytes}));
