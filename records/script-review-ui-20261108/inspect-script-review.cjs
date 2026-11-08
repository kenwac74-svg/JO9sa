const fs=require('node:fs'),tmp='G:/Codex/tmp/script-review-ui-20261108',record='G:/somi/JO9sa/records/script-review-ui-20261108';
const core=require(tmp+'/core.cjs'),imp=require(tmp+'/script-import.cjs'),qsp='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const doc=core.parse(fs.readFileSync(qsp)),source=JSON.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/modtools/text-workshop/runtime/script-exports/dc59990424962453.json','utf8')),text=fs.readFileSync(record+'/USER_REVISION_GLORIA.txt','utf8');
const r=imp.revalidateRecord(doc,source),p=imp.prepare(doc,r,text),result={sourceHash:source.hash,currentHash:doc.hash,blocks:imp.parse(text).blocks.size,normalized:imp.parse(text).normalizedMarkers,changes:p.chosen.length,warnings:p.changes.map(c=>({id:c.id,warnings:c.warnings})),maxCharacters:Math.max(...p.chosen.map(c=>c.newPlain.length)),structureRoundTrip:true};
fs.writeFileSync(record+'/content-review.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
