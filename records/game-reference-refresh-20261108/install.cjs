'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),z=require('zlib'),vm=require('vm'),cp=require('child_process');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/game-reference-refresh-20261108/tools/game-reference',O=R+'/records/game-reference-refresh-20261108';
const core=require(R+'/tools/text-workshop/core.cjs'),sha=b=>core.hash(b),json=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const raw=fs.readFileSync(G+'/jack.qsp'),qsp=sha(raw);const html=fs.readFileSync(T+'/jo9-reference.html','utf8'),data=JSON.parse(html.match(/id="reference-data" type="application\/json">([^\n]+)<\/script>/)[1]);
a.equal(data.meta.qspSha256,qsp);a.equal(data.traits.hash,qsp);a.equal(data.items.hash,qsp);
for(const old of JSON.parse(fs.readFileSync(R+'/tools/game-reference/traits.json','utf8')).rows)a(data.traits.rows.some(x=>x.name===old.name&&(x.id===old.id||(['색정광','불감증'].includes(old.name)&&x.id.startsWith('nymphomania = ')))),old.name);
for(const old of JSON.parse(fs.readFileSync(R+'/tools/game-reference/items.json','utf8')).rows)a(data.items.rows.some(x=>x.id===old.id),old.name);
for(const kind of ['traits','items'])a.deepEqual(JSON.parse(fs.readFileSync(T+'/'+kind+'.json','utf8')),data[kind]);
for(const s of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/application\/json/.test(s[1]))new vm.Script(s[2]);
fs.mkdirSync(O+'/before',{recursive:true});const backups=[];
function backup(file){if(!fs.existsSync(file))return;const bytes=fs.readFileSync(file),hash=sha(bytes),payload=O+'/before/'+hash+'.gz';if(!fs.existsSync(payload))fs.writeFileSync(payload,z.gzipSync(bytes,{level:9}));a(z.gunzipSync(fs.readFileSync(payload)).equals(bytes));backups.push({file,hash,payload});}
for(const name of fs.readdirSync(R+'/tools/game-reference')){const file=R+'/tools/game-reference/'+name;if(fs.statSync(file).isFile())backup(file);}
for(const name of ['serve.cjs','README.md'])fs.copyFileSync(__dirname+'/'+name,T+'/'+name);
const ps=fs.readFileSync(__dirname+'/Start-Game-Reference.ps1');fs.writeFileSync(T+'/Start-Game-Reference.ps1',Buffer.concat([Buffer.from([239,187,191]),ps]));
for(const name of fs.readdirSync(T)){const file=T+'/'+name;if(!fs.statSync(file).isFile())continue;if(/\.cjs$/.test(name))new vm.Script(fs.readFileSync(file,'utf8'));fs.copyFileSync(file,R+'/tools/game-reference/'+name);}
const dest=G+'/modtools/game-reference';fs.mkdirSync(dest,{recursive:true});
for(const name of ['jo9-reference.html','serve.cjs','Start-Game-Reference.ps1','README.md']){const file=dest+'/'+name;if(fs.existsSync(file))backup(file);fs.copyFileSync(T+'/'+name,file);}
const launcher=R+'/tools/local-workspace/Open-Modding-Tools.ps1';backup(launcher);let launch=fs.readFileSync(launcher,'utf8');
const anchor=" Write-Output ('Dialogue: '+$editorUrl";
a.equal(launch.split(anchor).length-1,1);
launch=launch.replace(anchor,()=>[
" # JO9 MOD START GAME_REFERENCE_TOOL_20261108",
" $referenceSource=Join-Path (Split-Path -Parent $PSScriptRoot) 'game-reference'",
" $referenceTarget=Join-Path $root 'game-reference'",
" New-Item -ItemType Directory -Path $referenceTarget -Force | Out-Null",
" foreach ($referenceName in @('jo9-reference.html','serve.cjs','Start-Game-Reference.ps1','README.md')) {",
"  $referenceFrom=Join-Path $referenceSource $referenceName;$referenceTo=Join-Path $referenceTarget $referenceName",
"  if (!(Test-Path -LiteralPath $referenceTo) -or (Get-FileHash -LiteralPath $referenceFrom).Hash -ne (Get-FileHash -LiteralPath $referenceTo).Hash) {Copy-Item -LiteralPath $referenceFrom -Destination $referenceTo -Force}",
" }",
" $referenceUrl=(& (Join-Path $referenceTarget 'Start-Game-Reference.ps1') -NoBrowser | Select-Object -Last 1)",
" if ([string]$referenceUrl -notmatch '^http://127\\.0\\.0\\.1:\\d+/$') {throw 'Reference tool did not return a local URL.'}",
" # JO9 MOD END GAME_REFERENCE_TOOL_20261108",
anchor].join('\r\n'));
launch=launch.replace("' | SoundAudition: '+$soundUrl)","' | SoundAudition: '+$soundUrl+' | GameReference: '+$referenceUrl)");
a(launch.includes("' | GameReference: '+$referenceUrl)"));
const list="$workshopUrl,$reviewUrl,$soundUrl,'https://";a.equal(launch.split(list).length-1,1);launch=launch.replace(list,"$workshopUrl,$reviewUrl,$soundUrl,$referenceUrl,'https://");
fs.writeFileSync(launcher,Buffer.concat([Buffer.from([239,187,191]),Buffer.from(launch.replace(/^\uFEFF/,''))]));
const snapshot={recordedDate:'2026-11-08',dataCreated:data.meta.generatedAt,source:'WORK',sourceQspSha256:qsp,traits:data.traits.rows.length,items:data.items.rows.length,itemInputRows:196,recipesAddedByAssembly:75,sourceCommit:'41c1a6409e89b1cccac50f1c033d16a5043030d2',files:[]};
for(const name of fs.readdirSync(R+'/tools/game-reference').filter(x=>x!=='snapshot.json'&&!x.startsWith('.'))){const f=R+'/tools/game-reference/'+name;if(fs.statSync(f).isFile())snapshot.files.push({file:name,sha256:sha(fs.readFileSync(f)),bytes:fs.statSync(f).size});}
json(R+'/tools/game-reference/snapshot.json',snapshot);fs.copyFileSync(R+'/tools/game-reference/snapshot.json',dest+'/snapshot.json');
const docs=R+'/docs/modding/MOD_TOOLS_OPEN_20261021.md';backup(docs);fs.appendFileSync(docs,'\n\n## 2026-11-08 — 현재 WORK 특성·아이템 열람표\n\nGAME_REFERENCE_TOOL_20261108. 모드툴 열기에는 특성128개·아이템271개 열람표를 포함한다. Open-Modding-Tools.ps1은 WORK/modtools/game-reference의 읽기 전용 서버를 시작·재사용하고 GameReference URL을 출력하며 일반 실행에서는 탭을 함께 연다. HTML 단독 열람도 가능하다. 데이터와 출처는 tools/game-reference/snapshot.json, 갱신·다운로드 기록은 records/game-reference-refresh-20261108/REPORT_KO.md. 사운드 정리는 사용자 지시로 취소했으며 파일 이동은 하지 않았다.\n');
json(O+'/installation.json',{qspSha256:qsp,qspUnchanged:sha(fs.readFileSync(G+'/jack.qsp'))===qsp,traits:snapshot.traits,items:snapshot.items,backups,source:R+'/tools/game-reference',installed:dest,soundCleanupCancelled:true});
fs.copyFileSync(__filename,O+'/install.cjs');
console.log(JSON.stringify({traits:snapshot.traits,items:snapshot.items,qspUnchanged:true,installed:dest,launcher:launcher}));
