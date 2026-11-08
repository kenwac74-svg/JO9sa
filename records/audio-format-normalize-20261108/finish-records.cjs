'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',temp='G:/Codex/tmp/audio-format-normalize-20261108';
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const state=read(__dirname+'/installation.json');assert.equal(hash(game+'/jack.qsp'),state.workQspSha256);assert.equal(hash(temp+'/fresh-replay.qsp'),state.workQspSha256);
assert.equal(hash(temp+'/audition-final.html'),hash(repo+'/tools/sound-audition/청취_목록.html'));
const testLog=fs.readFileSync(__dirname+'/audition-tests.log','utf8');assert(/pass 12/.test(testLog)&&/fail 0/.test(testLog));
const v=read(__dirname+'/verification.json');v.status='TARGETED_VERIFICATION_PASS';v.nativeVerification='native-results.json';v.auditionTests={pass:12,fail:0};v.canonicalReplayMatches=true;v.canonicalReapplicationChangesNothing=true;v.manualAudioAndSaveUiVerified=false;v.notes='Game engine checks use silent diagnostics; no full-release or subjective listening claim.';fs.writeFileSync(__dirname+'/verification.json',JSON.stringify(v,null,2)+'\n');
let report=fs.readFileSync(__dirname+'/REPORT_KO.md','utf8');report=report.replace('- 현재 WORK QSP 왕복·구조·변경 범위 검사 통과.','- 현재 WORK QSP 왕복·구조·변경 범위 검사 통과. 적용 전 백업에서 두 모드를 처음부터 재생한 해시가 현재 WORK와 같고, 현재 QSP에 재적용해도 쓰기·중복이 없음을 확인했다.');fs.writeFileSync(__dirname+'/REPORT_KO.md',report);
fs.copyFileSync('G:/Codex/tools/ffmpeg-9.0.2/install.json',__dirname+'/ffmpeg-install.json');
for(const entry of fs.readdirSync(__dirname,{withFileTypes:true})){if(entry.isFile()){const dest=repo+'/records/audio-format-normalize-20261108/'+entry.name;fs.copyFileSync(__dirname+'/'+entry.name,dest);assert.equal(hash(__dirname+'/'+entry.name),hash(dest));}}
const roots=['G:/Codex/tmp/audio-format-normalize-20261108','G:/Codex/tmp/residence-bgm-feasibility-20261108'];let rows=[];
function inspect(root){let count=0,bytes=0;function walk(p){const s=fs.lstatSync(p);assert(!s.isSymbolicLink(),'No junction/symlink cleanup: '+p);if(s.isDirectory())for(const n of fs.readdirSync(p))walk(path.join(p,n));else{count++;bytes+=s.size;}}walk(root);return {count,bytes};}
for(const root of roots){const absolute=path.resolve(root);assert.equal(path.dirname(absolute),path.resolve('G:/Codex/tmp'));assert(roots.map(x=>path.resolve(x)).includes(absolute));if(fs.existsSync(absolute))rows.push({path:absolute,...inspect(absolute)});}
fs.writeFileSync(__dirname+'/cleanup-plan.json',JSON.stringify({regenerableDiagnosticsOnly:true,originalBackupPreserved:state.backup,portableFfmpegPreserved:'G:/Codex/tools/ffmpeg-9.0.2',roots:rows},null,2)+'\n');fs.copyFileSync(__dirname+'/cleanup-plan.json',repo+'/records/audio-format-normalize-20261108/cleanup-plan.json');console.log(JSON.stringify({currentQsp:state.workQspSha256,replayMatches:true,tests:12,cleanup:rows}));
