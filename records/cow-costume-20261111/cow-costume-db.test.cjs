'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createRequire}=require('node:module');
const root='G:/somi/JO9sa';
const extractor=root+'/tools/game-reference/extract-items.cjs';
const backup='G:/somi/JO9_work_backups/cow-costume-20261111-396abb21437e/extract-items-before.cjs';
const qsp=process.argv[2]||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const out='G:/Codex/tmp/jo9-cow-costume-20261111/db-probe';
const core=require(root+'/tools/text-workshop/core.cjs');
const protectedFiles=[root+'/tools/game-reference/items.input.json',root+'/tools/game-reference/items.json'];
const before=protectedFiles.map(f=>core.hash(fs.readFileSync(f)));
const originalRequire=createRequire(extractor);
function extract(script,mode){
 const target=path.join(out,mode);fs.mkdirSync(target,{recursive:true});
 const customRequire=id=>id==='../text-workshop/core.cjs'?{...core,parse(bytes){
  const doc=core.parse(bytes);
  const loc=doc.locations.find(l=>l.name==='jo9_cow_costume');
  if(mode.includes('without'))doc.locations=doc.locations.filter(l=>l.name!=='jo9_cow_costume');
  if(mode==='variant'){
   assert(loc,'The live costume helper must exist');
   let text=core.shift(doc.lines[loc.body],5);
   const name=/\$item_name\['cow_costume'\]\s*=\s*'[^'\r\n]*'/;
   const price=/item_price\['cow_costume'\]\s*=\s*\d+/;
   const description=/\$item_description\['cow_costume'\]\s*=\s*'[^'\r\n]*'/;
   assert(name.test(text)&&price.test(text)&&description.test(text));
   text=text.replace(name,"$item_name['cow_costume'] = '이름 변경 검증 의상'")
    .replace(price,"item_price['cow_costume'] = 37")
    .replace(description,"$item_description['cow_costume'] = '<br>변경 설명 검증.<br>독특함 +1.'");
   doc.lines[loc.body]=core.shift(text,-5);
  }
  return doc;
 }}:originalRequire(id);
 new Function('require','__dirname','process','console',script)(customRequire,target,{argv:['node',extractor,qsp]},{log(){}});
 return JSON.parse(fs.readFileSync(path.join(target,'items.input.json'),'utf8'));
}
const code=fs.readFileSync(extractor,'utf8');
const live=extract(code,'live');
const rows=live.rows.filter(row=>row.id==='cow_costume');
assert.equal(rows.length,1,'DB regeneration must retain the new costume exactly once');
const row=rows[0];
assert.equal(row.name,'젖소 코스튬');assert.equal(row.price,25);assert.equal(row.category,'의상');
assert.match(row.description,/독특함 \+1/);assert.match(row.description,/매일 사육 상승/);
assert.match(row.description,/젖소녀 교육효율 상승/);assert.match(row.description,/세련됨 -1/);
assert.match(row.description,/기본 가격 25스파크/);assert.match(row.source,/^jo9_cow_costume \d+행$/);
const changed=extract(code,'variant').rows.find(row=>row.id==='cow_costume');
assert.equal(changed.name,'이름 변경 검증 의상');assert.equal(changed.price,37);
assert.match(changed.description,/변경 설명 검증/);assert.match(changed.description,/기본 가격 37스파크/);
const absent=extract(code,'without');assert(!absent.rows.some(row=>row.id==='cow_costume'));
assert(fs.existsSync(backup),'Preserve the original extractor before completion');
const baseline=extract(fs.readFileSync(backup,'utf8'),'original-without');
assert.deepEqual(absent,baseline,'A QSP without the helper must preserve all previous extraction output');
assert.deepEqual(protectedFiles.map(f=>core.hash(fs.readFileSync(f))),before,'Do not overwrite the curated DB files');
const report={pass:true,qspSha256:core.hash(fs.readFileSync(qsp)),row,variant:{name:changed.name,price:changed.price,description:changed.description},helperAbsentPreservesOriginal:true,curatedDbUnchanged:true};
fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
