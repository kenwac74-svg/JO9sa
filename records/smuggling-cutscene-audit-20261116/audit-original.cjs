'use strict';
// Read-only audit: archive input is an in-memory base64 stream, never extracted.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { parse, shift } = require('G:/somi/JO9sa/tools/cut-addition/core.cjs');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const versions = [
  ['JO9O installed', 'G:/somi/JO9O/game/jack.qsp'],
  ['Source snapshot', 'G:/somi/JO9sa/source/jack_2026-10-01.qsp'],
  ['WORK', 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'],
].map(([label, file]) => ({label, file, raw:fs.readFileSync(file)}));
const archiveInput = fs.readFileSync(0, 'utf8').trim();
if (archiveInput) versions.unshift({
  label:'Archived v2.3 Kor_nosex',
  file:'G:/somi/JO9O/Jack O Nine Tails v2.3 Kor_nosex.zip :: game/jack.qsp',
  raw:Buffer.from(archiveInput, 'base64'),
});
const audit = versions.map(({label, file, raw}) => {
  const d = parse(raw);
  const loc = name => {
    const entry = d.locations.find(x => x.name === name);
    return entry ? shift(d.lines[entry.body], 5).split(/\r?\n/) : [];
  };
  const city = loc('interaction_city');
  const start = city.findIndex(x => /^\s*if interaction_city = 6229:/i.test(x));
  const stop = city.findIndex((x,i) => i > start && /^\s*if interaction_city = 6230:/i.test(x));
  const branch = city.slice(start, stop).join('\n').trim();
  const logic = branch.split('\n').filter(x => !/^\s*!/.test(x) && !/^\s*\$text\[1\]\s*=/.test(x)).join('\n');
  const screen = loc('interaction_screen_city');
  const imageAt = screen.findIndex(x => x.includes('elseif $npc_image[$npc_id]'));
  const npcBase = loc('#npc_base');
  const mappingAt = npcBase.findIndex(x => x.includes("$npc_image['master_skups']"));
  const result = loc('interaction_result_city');
  const staticBase = loc('#static_base');
  const helperAt = staticBase.findIndex(x => x.includes('$clear_slave_instance ='));
  const helperStop = staticBase.findIndex((x,i) => i > helperAt && x.startsWith('!!!!! core game function'));
  const helper = staticBase.slice(helperAt,helperStop).join('\n').trim();
  const exactText = new RegExp('\\$text(?:\\[|\\s|[\'\"])','i');
  const exactNpc = new RegExp('(?:\\$npc_id\\b|(?:^|[&:\\s])npc\\s*=)','i');
  const callees = ['#var_base','#txt_man','#txt_2_man'].map(name => {
    const rows = loc(name);
    return {name,lineCount:rows.length,
      exactTextReferences:rows.map((text,i)=>({line:i+1,text})).filter(x=>exactText.test(x.text)),
      npcAssignments:rows.map((text,i)=>({line:i+1,text})).filter(x=>exactNpc.test(x.text)),
      killvars:rows.map((text,i)=>({line:i+1,text})).filter(x=>/^\s*killvar\b/i.test(x.text)),
    };
  });
  return {label, file, sha256:d.hash, locationCount:d.locations.length,
    branchStartLine:start+1, branchEndLine:stop, branch, logicSha256:hash(Buffer.from(logic)),
    dedicatedSpecialImageInBranch:/\$special_(image|bg)/.test(branch),
    masterScoopsMapping:{line:mappingAt+1, text:npcBase[mappingAt]},
    npcImageRendering:{line:imageAt+1, lines:screen.slice(Math.max(0,imageAt-5),imageAt+5)},
    cityEnd:city.slice(-5), resultEnd:result.slice(-13),
    clearHelper:{line:helperAt+1,text:helper,sha256:hash(Buffer.from(helper)),callees},
  };
});
const imagePaths = [
  'G:/somi/JO9O/game/content/pic/characters/master_scoops.png',
  'G:/somi/Jack O Nine Tails v2.4_work/game/content/pic/characters/master_scoops.png',
];
const images = imagePaths.map(file => {
  const exists = fs.existsSync(file);
  if(!exists) return {file,exists};
  const raw = fs.readFileSync(file);
  const png = raw.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  return {file,exists,bytes:raw.length,sha256:hash(raw),png,width:png?raw.readUInt32BE(16):null,height:png?raw.readUInt32BE(20):null};
});
const report = {created:'2026-11-16',method:'Read-only QSP parse/shift; no game/source changes; archived target QSP held in memory only',
  findings:[
    '6229 detection has no dedicated special image or background assignment. It sets NPC master_skups, text[1], return_lock guild while leaving place smugglers_den.',
    'WORK branch logic, excluding dialogue formatting and provenance comments, is compared byte-for-byte after line normalization below.',
    'The common city interaction screen resolves master_skups through the master_scoops NPC image and renders content/pic/characters/master_scoops.png when nsfw is not 1.',
  ],versions:audit,images,
  equalLogicAcrossComparedVersions:new Set(audit.map(x=>x.logicSha256)).size===1,
  equalClearHelperAcrossComparedVersions:new Set(audit.map(x=>x.clearHelper.sha256)).size===1};
const out = path.join(__dirname, 'original-comparison.json');
fs.writeFileSync(out, JSON.stringify(report,null,2)+'\n','utf8');
console.log(JSON.stringify({report:out,equalLogicAcrossComparedVersions:report.equalLogicAcrossComparedVersions,
  equalClearHelperAcrossComparedVersions:report.equalClearHelperAcrossComparedVersions,
  versions:audit.map(({label,sha256,branchStartLine,branchEndLine,logicSha256,dedicatedSpecialImageInBranch,clearHelper})=>({label,sha256,branchStartLine,branchEndLine,logicSha256,dedicatedSpecialImageInBranch,
    clearHelperLine:clearHelper.line,clearHelperSha256:clearHelper.sha256,callees:clearHelper.callees.map(x=>({name:x.name,lineCount:x.lineCount,exactTextReferences:x.exactTextReferences,npcAssignments:x.npcAssignments,killvarCount:x.killvars.length}))})),images},null,2));
