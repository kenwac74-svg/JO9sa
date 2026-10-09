'use strict';
const fs=require('node:fs'),path=require('node:path'),core=require('./cut-addition/core.cjs');
const project='C:/Users/Ken Choung/Documents/Codex/2026-10-06/task/JO9sa',game='C:/MOVE/Jack O Nine Tails v2.3 Kor_nosex/game',target=path.join(game,'jack.qsp');
const raw=fs.readFileSync(target),backup=fs.readFileSync(path.join(game,'jack.qsp.bak_20261008_060023')),mod=JSON.parse(fs.readFileSync(path.join(project,'mods/2026-10-08_persistent_image_cycle.json'),'utf8')),doc=core.parse(raw),edits=[];
if(!core.serialize(doc).equals(raw))throw Error('Roundtrip failed');
for(const e of mod.edits){const loc=doc.locations.find(l=>l.name===e.location),body=core.shift(doc.lines[loc.body],5),count=body.split(e.new).length-1;if(count!==e.count)throw Error('Rollback count mismatch: '+e.location);const inverse={...e,old:e.new,new:e.old};doc.lines[loc.body]=core.shift(body.split(e.new).join(e.old),-5);edits.push(inverse);}
const candidate=core.serialize(doc);if(!candidate.equals(backup))throw Error('Rollback would not match exact pre-feature backup. Stop.');
const record={id:'2026-10-08_rollback_image_cycle_startup',description:'시작 화면 표시 장애: 이미지 출력 순환 패치만 제거하여 적용 직전 SHA로 복구',before_sha256:core.hash(raw),after_sha256:core.hash(candidate),edits};
const dir=path.resolve(__dirname,'../tmp/image-cycle-rollback/mods');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,record.id+'.json'),JSON.stringify(record,null,2));
console.log(JSON.stringify({mods:dir,before:record.before_sha256,after:record.after_sha256,edits:edits.length,exactPreFeatureBackup:true}));
