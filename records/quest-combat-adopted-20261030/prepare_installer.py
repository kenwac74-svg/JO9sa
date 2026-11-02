"""Derive the approved nine-existing-file installer from the audited prior installer."""
from pathlib import Path
HERE=Path(__file__).resolve().parent
s=(HERE.parent/'catfight-combat-adopted-20261030/adopt_work.cjs').read_text(encoding='utf8')
s=s.replace('CATFIGHT_COMBAT_ADOPTION_20261030','QUEST_COMBAT_ADOPTION_20261030').replace('catfight-combat-adopted-20261030','quest-combat-adopted-20261030')
for old,new in [('files.length,6','files.length,9'),('affected.size,6','affected.size,9'),('rowCount,6','rowCount,9'),('slotCount,6','slotCount,9'),('newDefeats,1','newDefeats,0'),('files:6,entrySlots:6','files:9,entrySlots:9')]:
    assert old in s,old;s=s.replace(old,new)
s=s.replace("record:id,files:6,standingAndDefeatOnly", "record:id,files:9,standingAndDefeatOnly")
a=s.index("const first=files.find(");b=s.index('function updateCatalog(',a)
s=s[:a]+'''for(const f of files){
 a(f.path.startsWith('content/pic/mob/')&&!f.path.split('/').some(x=>x==='..'||x==='.'||!x));
 const b=read(f.source);a.equal(hash(b),f.after);a.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');a.equal(b.readUInt32BE(16),795);a.equal(b.readUInt32BE(20),596);a.equal(b.length,f.bytes);
 const p=game+'/'+f.path;a.equal(currentSha(p),apply?f.after:f.before,'WORK changed: '+f.path);
 a(fs.realpathSync(p).toLowerCase().startsWith(fs.realpathSync(game).toLowerCase()+path.sep));
 a.equal(currentSha(repo+'/resources/new/'+f.path),f.trackedBefore,'Tracked original changed: '+f.path);
 if(apply)a.equal(sha(f.beforePath),f.before,'Original not archived: '+f.path);
}
if(apply){
 const receipt=JSON.parse(read(here+'/runtime-original-swap.json'));a.equal(receipt.status,'SWAPPED');a.equal(receipt.files.length,9);
 for(const f of files){const x=receipt.files.find(x=>norm(x.path)===norm(f.path));a(x,'Missing swap receipt '+f.path);a.equal(x.before,f.before);a.equal(x.after,f.after);a.equal(norm(x.archive),norm(f.beforePath));}
}
''' + s[b:]
a=s.index('let planExisting=');b=s.index('const context=',a)
s=s[:a]+'''let planExisting=0;for(const row of plan.files){const f=affected.get(norm(row.path).replace(/^game\\//,''));if(f){a.equal(row.sha256,f.before);row.bytes=f.bytes;row.sha256=f.after;planExisting++;}}
a.equal(planExisting,9);a.equal(plan.files.length,oldPlan.files.length);
plan.summary.includedBytes=plan.files.reduce((sum,f)=>sum+f.bytes,0);
a.equal(plan.summary.includedFiles,oldPlan.summary.includedFiles);
''' + s[b:]
old="const summary={files:6,subjects:3,standing:3,defeat:3,replacedRuntimeFiles:5,newRuntimeFiles:1,entrySlots:6,groupSlots:0,missingDefeatBefore:workUpdate.summary.missingDefeat+1,missingDefeatAfter:workUpdate.summary.missingDefeat,planExisting:5,planAdded:1,portraitsAffected:0,qspUnchanged:true};"
new="const summary={files:9,subjects:5,standing:5,defeat:4,replacedRuntimeFiles:9,newRuntimeFiles:0,entrySlots:9,groupSlots:0,missingDefeatBefore:workUpdate.summary.missingDefeat,missingDefeatAfter:workUpdate.summary.missingDefeat,planExisting:9,planAdded:0,portraitsAffected:0,qspUnchanged:true};"
assert old in s;s=s.replace(old,new)
s=s.replace('originalArchive:v.archiveRoot};','originalArchive:v.archiveRoot,heldRetained:v.heldRetained};')
old="a.equal(currentSha(p),f===first?f.after:f.before);a.equal(currentSha(t),f.trackedBefore);\n if(f!==first)ct.atomic(p,b);fs.mkdirSync(path.dirname(t),{recursive:true});ct.atomic(t,b);"
new="a.equal(currentSha(p),f.after);a.equal(currentSha(t),f.trackedBefore);\n fs.mkdirSync(path.dirname(t),{recursive:true});ct.atomic(t,b);"
assert old in s;s=s.replace(old,new)
a=s.index("ct.atomic(docp,");b=s.index("\nfs.appendFileSync",a)
s=s[:a]+"""ct.atomic(docp,originals.get(docp).toString('utf8')+'\\n\\n## 2026-10-30 퀘스트 전투·패배 재작화 반영\\n\\n에게야·성기사·포털 가디언·그린치·엘자의 승인 시안9장(전투5·패배4)을 WORK와 resources/new에 반영했다. 에게야 패배1장은 기존 그림·경로·표시를 유지했다. 각 장소의 환경, 기존 무기·초상·등장 조건·Mage Edit 프롬프트·QSP·세이브는 변경하지 않았다. 기존9원본은 G:/somi/JO9resource/mob_body/quest_originals_20261030에 실제 이동 보관했다. 성기사의 옛 무기명 대사5곳은 별도 미결 항목이며 이번 이미지 반영에서는 코드를 수정하지 않았다. 상세 해시 및 복구 경로: records/'+id+'/installation.json.\\n');"""+s[b:]
assert 'first' not in s
(HERE/'adopt_work.cjs').write_text(s,encoding='utf8')
print('Prepared nine-image installer; no runtime writes')
