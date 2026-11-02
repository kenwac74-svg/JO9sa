/* Read-only WORK/catalog audit. Writes only this directory's audit.json. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const core = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const WORK = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const REPO = 'G:/somi/JO9sa';
const catalogPath = WORK + '/modtools/catalog/catalog_merge_vs_original.html';
const catalogRaw = fs.readFileSync(catalogPath);
const html = catalogRaw.toString('utf8');
const qspRaw = fs.readFileSync(WORK + '/jack.qsp');
const decoded = core.parse(qspRaw);
const qspBodies = new Map(decoded.locations.map(l => [l.name, core.shift(decoded.lines[l.body], 5)]));
const qspAll = [...qspBodies.values()].join('\n').replaceAll('\\', '/');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const norm = p => String(p || '').replaceAll('\\', '/');
function literalAfter(marker) {
  let i = html.indexOf(marker);
  if (i < 0) throw new Error('Missing marker ' + marker);
  i += marker.length;
  while (/\s/.test(html[i])) i++;
  const open = html[i], close = open === '[' ? ']' : '}';
  let depth = 0, inString = false, escaped = false;
  for (let j = i; j < html.length; j++) {
    const c = html[j];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === open) depth++;
    else if (c === close && --depth === 0) return JSON.parse(html.slice(i, j + 1));
  }
  throw new Error('Unterminated marker ' + marker);
}
const D = literalAfter('var D=');
const mob = literalAfter('window.JO9_MOB_SETS=');
const scenes = literalAfter('window.JO9_SCENE_CONDITIONS=');
const rowsByPath = new Map();
for (const row of D) {
  const p = norm(row[0]).toLowerCase();
  if (!rowsByPath.has(p)) rowsByPath.set(p, []);
  rowsByPath.get(p).push(row);
}
const cache = new Map();
function disk(p) {
  p = norm(p);
  if (cache.has(p)) return cache.get(p);
  const full = path.join(WORK, p), value = {path: p, exists: fs.existsSync(full)};
  if (value.exists) {
    const b = fs.readFileSync(full);
    Object.assign(value, {bytes: b.length, sha256: hash(b)});
    if (b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
      value.width = b.readUInt32BE(16); value.height = b.readUInt32BE(20);
    }
  }
  cache.set(p, value); return value;
}
function dCheck(p) {
  const actual = disk(p), rows = rowsByPath.get(norm(p).toLowerCase()) || [];
  return {rows, rowCount: rows.length, workSizeMatches: rows.length === 1 && rows[0][3] === actual.bytes,
    dimensionsMatch: rows.length === 1 && rows[0][5] === actual.width && rows[0][6] === actual.height};
}
const recentNames = ['coldef1','coldef2','coldef3','practice_master_loss','practice_master_win',
  'practice_slave_loss','practice_slave_win','arena_victory_execute','arena_victory_spare',
  'catfdef1','catdef2','catfight_loss_death','catfight_loss_survive','catfight_watch'];
const recent = recentNames.map(n => {
  const p = 'content/pic/scene/' + n + '.png', actual = disk(p), c = scenes.entries[p];
  return {...actual, catalog: dCheck(p), qspLiteralPresent: qspAll.includes(p) || qspAll.includes(p.slice(12,-4)),
    conditionPresent: !!c, conditionSummary: c && c.summary,
    references: (c && c.references || []).map(r => ({location:r.location,line:r.line,conditions:r.conditions,slot:r.slot,lhs:r.lhs,note:r.note}))};
});
const slotChecks = [], metadataMismatches = [], missingMobImages = [], outsideMobPaths = [], unreferencedPaths = [];
function addSlot(entry, slotName, slot, group = false) {
  if (!slot || !slot.path) return;
  const p = norm(slot.path), actual = disk(p), row = dCheck(p), problems = [];
  if (slot.exists !== undefined && slot.exists !== actual.exists) problems.push('exists');
  if (actual.exists) for (const field of ['bytes','sha256','width','height']) {
    if (slot[field] !== undefined && slot[field] !== actual[field]) problems.push(field);
  }
  const check = {key:entry.key,name:entry.name,slot:slotName,path:p,runtimePath:norm(slot.runtimePath || p),
    actual,metadataDifferences:problems,catalog:row,group};
  slotChecks.push(check);
  if (problems.length) metadataMismatches.push(check);
  if (!actual.exists) missingMobImages.push(check);
  if (!p.startsWith('content/pic/mob/')) outsideMobPaths.push(check);
  const runtime = norm(slot.runtimePath || p);
  if (!qspAll.includes(runtime)) unreferencedPaths.push({key:entry.key,slot:slotName,path:p,runtimePath:runtime,group});
}
for (const entry of mob.entries) for (const slot of ['portrait','standing','defeat']) addSlot(entry,slot,entry[slot]);
for (const group of mob.groups || []) addSlot(group,'defeat',group.defeat,true);
const bgData = JSON.parse(fs.readFileSync(REPO + '/tools/mob-image-sets/background-contexts.json','utf8'));
const backgroundPathChecks = [];
for (const entry of [...mob.entries, ...(mob.groups || [])]) {
  for (const ctx of entry.appearanceContexts || []) for (const field of ['battleBackground','resultBackground']) {
    if (ctx[field]) backgroundPathChecks.push({key:entry.key,context:ctx.id,kind:ctx.kind,field,...disk(ctx[field])});
  }
}
const draftsRoot = path.resolve(__dirname,'../champion-liberation-cutscenes-20261031');
const drafts = ['champion_return_795x596.png','champion_departure_795x596.png'].map(n => {
  const b = fs.readFileSync(path.join(draftsRoot,n));
  const sha256 = hash(b), sameWorkImages = [...cache.values()].filter(x => x.sha256 === sha256).map(x => x.path);
  return {path:path.join(draftsRoot,n),bytes:b.length,sha256,qspFilenamePresent:qspAll.includes(n),
    catalogFilenamePresent:D.some(r=>norm(r[0]).endsWith('/'+n)),sameInspectedWorkImages:sameWorkImages,status:'preview-only-not-adopted'};
});
const allDProblems = slotChecks.filter(x=>x.catalog.rowCount!==1 || !x.catalog.workSizeMatches || !x.catalog.dimensionsMatch)
  .map(x=>({key:x.key,slot:x.slot,path:x.path,exists:x.actual.exists,catalog:x.catalog}));
const result = {schema:1,audit:'read-only-production-untouched',generatedAt:new Date().toISOString(),
  sources:{workRoot:WORK,qspSha256:hash(qspRaw),qspRoundtripExact:core.serialize(decoded).equals(qspRaw),
    catalogPath,catalogSha256:hash(catalogRaw),sceneConditionsQspSha256:scenes.qspSha256,
    sceneConditionsMatchLiveQsp:scenes.qspSha256 === hash(qspRaw),
    mobProvenance:{qspBefore:mob.qspBefore,qspAfter:mob.qspAfter,created:mob.created,
      backgroundContextAudit:mob.backgroundContextAudit},
    provenanceNote:'MOB qspBefore/qspAfter and historical audit hash are prior task provenance, not current WORK synchronization stamps.'},
  summary:{recentSceneImages:recent.length,recentPresent:recent.filter(x=>x.exists).length,
    recentCatalogRowsValid:recent.filter(x=>x.catalog.rowCount===1&&x.catalog.workSizeMatches&&x.catalog.dimensionsMatch).length,
    recentConditionEntries:recent.filter(x=>x.conditionPresent).length,mobEntries:mob.entries.length,
    groupEntries:(mob.groups||[]).length,inspectedMobSlots:slotChecks.length,
    uniqueMobPaths:new Set(slotChecks.map(x=>x.path)).size,metadataMismatches:metadataMismatches.length,
    missingMobImages:missingMobImages.length,outsideMobPaths:outsideMobPaths.length,mobCatalogProblems:allDProblems.length,
    noLiteralQspPath:unreferencedPaths.length},
  recent,slotChecks,metadataMismatches,missingMobImages,outsideMobPaths,mobCatalogProblems:allDProblems,
  noLiteralQspPath:unreferencedPaths,backgroundPathChecks,previewOnly:drafts,
  semanticChecks:{
    formalArenaLoss:{death:'scene/coldef1',execution:'scene/coldef2',survival:'scene/coldef3',events:[1291,1292,1293]},
    formalArenaVictory:{ordinaryEvent:1294,championEvent:1295,mode:2,phase:3,executionChoice:1,spareChoice:2,
      ordinaryImagePages:[1,2],championImagePages:[1],championLaterPages:'existing arena scene background'},
    practice:{masterEvent:1296,slaveEvent:1297,assistantEvent:1298,assistantSharesSlaveImages:true},
    catfight:{victoryEvent:103005,execution:'catfdef1.png',spare:'catdef2.png',prize:100,prizeInResultPage:true,
      deathEvents:[103002,103003],deathImage:'catfight_loss_death.png',survivalEvent:103004,
      survivalImage:'catfight_loss_survive.png',watchEvent:102019,watchImagePage:2},
    prisoners:{missingIndividualFallback:'content/pic/mob/defeated/gladiator_prisoners.png',
      currentNormalRoster:['fugituive_a','fugituive_b','fugituive_c','fugituive_d','fugituive_e'],
      rosterSource:'$gladiator_setup:70-74',groupGuardSource:'jo9_battle_fate:25',
      normalVictoryImage:'content/pic/mob/defeated/groups/prisoners_group.png',
      conclusion:'Normal five-prisoner victory uses existing group image; missing individual fallback is not confirmed as a currently reachable missing scene.'},
    existingRendererSetting:'$special_image_full images are subject to existing nsfw=0 rendering rule; coldef pic_png paths use the ordinary picture renderer.'},
  limits:['Static path/metadata audit; no GUI or rendered-image quality assessment.',
    'Absence of a literal path is a candidate only; dynamic runtime path construction can still resolve the file.',
    'Scene image visibility retains the existing renderer NSFW setting condition.',
    'Catalog may be edited concurrently by the designated catalog writer; hashes record this read snapshot.'],
  unchangedChecks:{qspUnchangedSinceStart:hash(fs.readFileSync(WORK+'/jack.qsp'))===hash(qspRaw),
    catalogUnchangedSinceStart:hash(fs.readFileSync(catalogPath))===hash(catalogRaw)}};
fs.writeFileSync(path.join(__dirname,'audit.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify({summary:result.summary,metadataMismatches:metadataMismatches.map(x=>({key:x.key,slot:x.slot,path:x.path,fields:x.metadataDifferences})),
  missing:missingMobImages.map(x=>({key:x.key,slot:x.slot,path:x.path})),outside:outsideMobPaths.map(x=>({key:x.key,path:x.path})),
  noLiteralQspPath:unreferencedPaths,catalogProblems:allDProblems,unchangedChecks:result.unchangedChecks},null,2));
