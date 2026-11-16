'use strict';
// Read-only reproduction: no QSP, save, draft, or server state is written.
const fs = require('node:fs');
const path = require('node:path');
const root = process.argv[2] || 'G:/somi/JO9sa/tools/text-workshop';
const core = require(path.join(root, 'core.cjs'));
const scenes = require(path.join(root, 'scenes.cjs'));
const raw = fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp');
const doc = core.parse(raw);
const entries = core.entries(doc);
const entry = entries.find(e => e.location === 'jo9_slave_death' && /jo9_sd_choice\s*=\s*1\b/.test(e.text));
if (!entry) throw Error('Menu entry not found');
const nav = scenes.buildNavigator(doc, entries);
const context = nav.context({...entry, hash:doc.hash}, undefined, 'text');
const stages = context.flow?.stages || [];
const branches = context.branches.map(b => ({
  line:b.line,
  states:b.states,
  destinations:b.destinations.map(d => ({line:d.line,sceneId:d.sceneId,title:d.title}))
}));
console.log(JSON.stringify({qsp:doc.hash,pages:stages.map(p=>({number:p.number,title:p.title,line:p.scope?.line,sceneId:p.sceneId,entries:p.variants.map(v=>({line:v.entry.line,multiline:/\r?\n/.test(v.entry.text)}))})),branches},null,2));
