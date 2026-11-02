'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const repo='G:/somi/JO9sa',rec=repo+'/records/battle-ui-test-v01-20261027',tmp='G:/Codex/tmp/battle-ui-v01-20261027',work='G:/somi/Jack O Nine Tails v2.4_work/game';
const c=require(repo+'/tools/text-workshop/core.cjs'),j=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),before=j(rec+'/before.json'),applied=j(rec+'/applied.json');
const workRaw=fs.readFileSync(work+'/jack.qsp'),base=c.parse(fs.readFileSync(before.backup+'/jack.qsp')),current=c.parse(workRaw);
a.equal(c.hash(workRaw),applied.qsp);a.equal(c.hash(fs.readFileSync(work+'/css/base.css')),applied.css);a.equal(c.hash(fs.readFileSync(repo+'/assets/css-2.4/base.css')),applied.css);a(c.serialize(current).equals(workRaw));
const changed=[];for(let i=0;i<base.locations.length;i++){const x=base.locations[i],y=current.locations[i];a.equal(x.name,y.name);a.equal(base.lines[x.desc],current.lines[y.desc]);if(base.lines[x.body]!==current.lines[y.body])changed.push(x.name);}a.deepEqual(changed.sort(),['боевой_интерфейс','конец_боя','раскладка_бой'].sort());
const oldCss=fs.readFileSync(before.backup+'/css/base.css'),newCss=fs.readFileSync(work+'/css/base.css');a(newCss.subarray(0,oldCss.length).equals(oldCss));
const native=j(rec+'/native-ui-results.json');a.equal(c.hash(fs.readFileSync(work+'/save/1.sav')),native.hashes.save);
const oldFullHash=c.hash(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp'));
// No recursive operations may follow a directory junction or escape this one disposable task folder.
const root=path.resolve(tmp),parent=path.resolve('G:/Codex/tmp');a.equal(path.dirname(root),parent);a.equal(path.basename(root),'battle-ui-v01-20261027');
let files=0,links=0,bytes=0;
function remove(p){const absolute=path.resolve(p);a(absolute===root||absolute.startsWith(root+path.sep));const st=fs.lstatSync(absolute);if(st.isSymbolicLink()){links++;try{fs.unlinkSync(absolute);}catch(e){if(!['EPERM','EISDIR'].includes(e.code))throw e;fs.rmdirSync(absolute);}return;}const real=fs.realpathSync(absolute);a(real===root||real.startsWith(root+path.sep),'Unexpected external target '+real);if(st.isDirectory()){for(const n of fs.readdirSync(absolute))remove(path.join(absolute,n));fs.rmdirSync(absolute);}else{files++;bytes+=st.size;fs.unlinkSync(absolute);}}
if(fs.existsSync(root))remove(root);
// One reproducible CSS duplicate from staging is no longer needed; the tracked source is authoritative.
if(fs.existsSync(rec+'/base.candidate.css')){a.equal(c.hash(fs.readFileSync(rec+'/base.candidate.css')),applied.css);fs.unlinkSync(rec+'/base.candidate.css');}
a.equal(c.hash(fs.readFileSync(work+'/jack.qsp')),applied.qsp);a.equal(c.hash(fs.readFileSync(before.backup+'/jack.qsp')),before.qsp);a.equal(c.hash(fs.readFileSync(work+'/save/1.sav')),native.hashes.save);a.equal(c.hash(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp')),oldFullHash);
const handoff=repo+'/docs/SESSION_HANDOFF_INDEX.md',text=fs.readFileSync(handoff,'utf8');if(!text.includes('battle-ui-test-v01-20261027/MANUAL_KO.md'))fs.appendFileSync(handoff,'\r\n## 2026-10-27 전투 UI 시험판 v01\r\n\r\n- 사용자 승인 시안의 테스트 버전을 WORK에만 적용. [사용·복구·구성 설명](../records/battle-ui-test-v01-20261027/MANUAL_KO.md).\r\n- 외부 QSP/CSS 백업 보존. 기존 세이브·배포 폴더 수정 및 커밋·푸시 없음.\r\n- 공식 native 9경로 PASS, 추가 전투 UI 11경로 PASS. 최근 행동 기록이며 누적 전체 로그는 미추가. 일부 원본 본체 누락은 기존 배경 유지.\r\n');
fs.copyFileSync(__filename,rec+'/scripts/finish.cjs');
const result={status:'VERIFIED',qsp:applied.qsp,css:applied.css,changedLocations:changed,sourcePrefixPreserved:true,representativeSaveUnchanged:true,backupVerified:true,fullNotWritten:true,temporaryFolderRemoved:root,filesRemoved:files,junctionsUnlinkedWithoutFollowing:links,bytesFreed:bytes};fs.writeFileSync(rec+'/final-verification.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
