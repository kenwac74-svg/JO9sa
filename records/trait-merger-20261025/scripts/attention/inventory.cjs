'use strict';
// Read-only runtime inventory. Run with `node inventory.cjs`; only this artifact directory is written.
const fs = require('node:fs');
const path = require('node:path');
const core = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const input = 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const doc = core.parse(fs.readFileSync(input));
const rawKey = /abuse_attitude|passion_fame/i;
const alias = /Истеричка|Тщеславная|Хикикомори|Пси_мазохистка|연극성 인격장애|인지욕구/;
const hits = [];
for (const loc of doc.locations) {
  const body = core.shift(doc.lines[loc.body], 5).split(/\r?\n/);
  for (let i = 0; i < body.length; i++) {
    if (!rawKey.test(body[i]) && !alias.test(body[i])) continue;
    hits.push({location:loc.name, line:i+1, rawKey:rawKey.test(body[i]), comment:/^\s*!/.test(body[i]), text:body[i]});
  }
}
const result = { input, hash:doc.hash, rawKeyReferences:hits.filter(x=>x.rawKey).length, hits };
fs.writeFileSync(path.join(__dirname, 'inventory.json'), JSON.stringify(result, null, 2)+'\n', 'utf8');
const md = ['# Attention merger runtime inventory', '', `Input: ${input}`, '', `SHA-256: ${doc.hash}`, '', `Raw-key lines: ${result.rawKeyReferences}. All line numbers are one-based decoded location body lines.`, ''];
for (const name of [...new Set(hits.map(x=>x.location))]) {
  md.push(`## ${name}`, '', '```qsp');
  for (const hit of hits.filter(x=>x.location===name)) md.push(`${hit.line}: ${hit.text}`);
  md.push('```', '');
}
fs.writeFileSync(path.join(__dirname, 'inventory.md'), md.join('\n'), 'utf8');
console.log(JSON.stringify({hash:doc.hash, rawKeyReferences:result.rawKeyReferences, totalKeyAndAliasReferences:hits.length, locations:[...new Set(hits.map(x=>x.location))]}));
