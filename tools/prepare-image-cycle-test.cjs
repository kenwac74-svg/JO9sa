'use strict';
// Prepare a separate manual engine test. Never launch the game or write its saves.
const fs=require('node:fs'),path=require('node:path');
const core=require('./cut-addition/core.cjs');
const root=path.resolve(__dirname,'..'),source='C:/MOVE/Jack O Nine Tails v2.3 Kor_nosex/game';
const dir=path.join(root,'tmp/image-cycle-manual-test'),game=path.join(dir,'game'),engine=path.join(game,'engine');
fs.mkdirSync(game,{recursive:true});fs.mkdirSync(engine,{recursive:true});
const copy=(a,b)=>{fs.mkdirSync(path.dirname(b),{recursive:true});fs.copyFileSync(a,b);};
for(const name of ['config.xml','icon.ico'])copy(path.join(source,name),path.join(game,name));
for(const name of ['css','fonts','json'])fs.cpSync(path.join(source,name),path.join(game,name),{recursive:true});
const assets=path.join(game,'content');
if(!fs.existsSync(assets))fs.symlinkSync(path.join(source,'content'),assets,'junction');
if(fs.realpathSync(assets).toLowerCase()!==fs.realpathSync(path.join(source,'content')).toLowerCase())throw Error('Unexpected asset reference');
for(const e of fs.readdirSync(path.join(source,'engine'),{withFileTypes:true})){
 if(e.isFile()&&(/\.dll$/i.test(e.name)||e.name==='jack.exe'||e.name==='qt_ko.qm'))copy(path.join(source,'engine',e.name),path.join(engine,e.name));
}
for(const e of fs.readdirSync(path.join(source,'engine'),{withFileTypes:true}))if(e.isDirectory()&&e.name!=='exebackup')fs.cpSync(path.join(source,'engine',e.name),path.join(engine,e.name),{recursive:true});
copy(path.join(source,'../Jack-o-nine-tails.exe'),path.join(dir,'Jack-o-nine-tails.exe'));
fs.writeFileSync(path.join(dir,'FastQSP.ini'),'[General]\r\nAutosaveWhenExiting=false\r\nignoreCRC=false\r\n');
const production=fs.readFileSync(path.join(root,'tmp/image-cycle/candidate.qsp'));
copy(path.join(root,'tmp/image-cycle/candidate.qsp'),path.join(game,'candidate.qsp'));
const doc=core.parse(production),start=doc.locations.find(l=>l.name==='Start'),helper=doc.locations.find(l=>l.name==='interior_change');
let body=core.shift(doc.lines[helper.body],5);
const registryEnd='\r\n if jo9_selected >= jo9_count:';
if(!body.includes(registryEnd))throw Error('Registry anchor missing');
// Diagnostic-only fixture reuses existing background files; the production
// registry contains Windows-copy cuts only and is not modified here.
const fixture=`\r\n if $jo9_base = 'content/pic/bg/stasis_bank.png':
  jo9_count = 2
  if jo9_selected = 0: $jo9_path = 'content/pic/bg/stasis_bank.png'
  if jo9_selected = 1: $jo9_path = 'content/pic/bg/stasis_bank_2.png'
 end`.replace(/\r?\n/g,'\r\n');
body=body.replace(registryEnd,fixture+registryEnd);
doc.lines[helper.body]=core.shift(body,-5);
const diagnostic=`killall
usehtml = 1
SHOWOBJS 0
SHOWACTS 0
SHOWINPUT 0
SHOWSTAT 0
INTEGRATED_ACTIONS = 1
$FNAME = 'Sandoll 미생'
MAINDESC_W = 1280
MAINDESC_H = 800
jo9_probe_failures = 0
$jo9_probe_log = ''
$jo9_probe = func('interior_change', 'jo9_path', 'content/pic/characters/Tsyuansu.png')
if $jo9_probe ! 'content/pic/characters/Tsyuansu.png': jo9_probe_failures += 1 & $jo9_probe_log += 'A컷 기본 선택 실패. '
jo9_cut_choice['content/pic/characters/tsyuansu.png'] = 1
$jo9_probe = func('interior_change', 'jo9_path', 'content/pic/characters/Tsyuansu.png')
if $jo9_probe ! 'content/pic/characters/Tsyuansu (2).png': jo9_probe_failures += 1 & $jo9_probe_log += 'B컷 선택 실패. '
jo9_cut_choice['content/pic/bg/stasis_bank.png'] = 1
jo9_cut_choice['content/pic/characters/tsyuansu.png'] = 0
*p func('interior_change', 'jo9_html', '<div id="bg"><img src="content/pic/bg/stasis_bank.png"></div>')
*p func('interior_change', 'jo9_html', '<div id="bg"><img src="content/pic/characters/Tsyuansu.png"></div>')
if $jo9_visible_top ! 'content/pic/characters/tsyuansu.png': jo9_probe_failures += 1 & $jo9_probe_log += '최상위 캐릭터 선택 실패. '
jo9_probe_button = instr($maintxt, 'id="jo9_image_cycle"')
if jo9_probe_button = 0: jo9_probe_failures += 1 & $jo9_probe_log += '전환 버튼 없음. '
if instr($mid($maintxt, jo9_probe_button + 1), 'id="jo9_image_cycle"') > 0: jo9_probe_failures += 1 & $jo9_probe_log += '배경 버튼 중복. '
gs 'interior_change', 'jo9_toggle'
if instr($maintxt, 'src="content/pic/characters/Tsyuansu (2).png"') = 0: jo9_probe_failures += 1 & $jo9_probe_log += '최상위 B컷 전환 실패. '
if instr($maintxt, 'src="content/pic/bg/stasis_bank_2.png"') = 0: jo9_probe_failures += 1 & $jo9_probe_log += '선택 배경 유지 실패. '
*clr
*p func('interior_change', 'jo9_html', '<div id="bg"><img src="content/pic/characters/Tsyuansu.png"></div>')
if instr($maintxt, 'src="content/pic/characters/Tsyuansu (2).png"') = 0: jo9_probe_failures += 1 & $jo9_probe_log += '재방문 컷 유지 실패. '
interior_num = 1
change_interior = 0
gs 'interior_change'
if $place ! 'bedroom_lux': jo9_probe_failures += 1 & $jo9_probe_log += '기존 방 전환 실패. '
if jo9_probe_failures = 0:
 $jo9_probe_log = 'PASS: A/B 선택 · 최상위 전환 · 배경 유지 · 재방문 · 기존 방 전환'
else
 $jo9_probe_log = 'FAIL ' + jo9_probe_failures + ': ' + $jo9_probe_log
end
*p '<div style="position:absolute;left:20px;top:625px;width:750px;padding:14px;background:#151515;color:white;z-index:10000;"><<$jo9_probe_log>><br>오른쪽 위 아이콘으로 A/B컷을 직접 전환하세요.<br><a href="EXEC: gt ''main_menu''">정상 시작 화면 확인</a></div>'
`.replace(/\r?\n/g,'\r\n');
doc.lines[start.body]=core.shift(diagnostic,-5);
const check=core.serialize(doc);if(!core.serialize(core.parse(check)).equals(check))throw Error('Diagnostic roundtrip mismatch');
fs.writeFileSync(path.join(game,'diagnostic.qsp'),check);
const launcher=`param([switch]$Normal)
$ErrorActionPreference = 'Stop'
$testRoot = $PSScriptRoot
$testName = if ($Normal) { 'candidate.qsp' } else { 'diagnostic.qsp' }
$testQsp = Join-Path $testRoot ('game\\' + $testName)
$testEngine = Join-Path $testRoot 'game\\engine\\jack.exe'
$alreadyRunning = Get-CimInstance Win32_Process -Filter "Name='jack.exe'" | Where-Object { $_.ExecutablePath -eq $testEngine }
if ($alreadyRunning) { throw '먼저 열려 있는 시험 게임을 종료하세요.' }
Copy-Item -LiteralPath $testQsp -Destination (Join-Path $testRoot 'game\\jack.qsp')
Start-Process -FilePath (Join-Path $testRoot 'Jack-o-nine-tails.exe') -WorkingDirectory $testRoot -WindowStyle Normal
`;
fs.writeFileSync(path.join(dir,'Start-JO9-Cycle-Test.ps1'),'\ufeff'+launcher.replace(/\r?\n/g,'\r\n'));
fs.writeFileSync(path.join(dir,'이미지전환 시험.cmd'),'@echo off\r\npowershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0Start-JO9-Cycle-Test.ps1"\r\n');
fs.writeFileSync(path.join(dir,'정상시작 시험.cmd'),'@echo off\r\npowershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0Start-JO9-Cycle-Test.ps1" -Normal\r\n');
const forbidden=['jack.qproj','locations','save','modtools'];for(const p of forbidden)if(fs.existsSync(path.join(game,p)))throw Error('Unexpected original game data: '+p);
const manifest={prepared:new Date().toISOString(),original:core.hash(fs.readFileSync(path.join(source,'jack.qsp'))),candidate:core.hash(production),diagnostic:core.hash(check),assetsReference:fs.realpathSync(assets),gameDirectory:game,launched:false};
fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2));
console.log(JSON.stringify(manifest));
