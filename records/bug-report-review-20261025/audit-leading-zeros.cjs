'use strict';
// Read-only: report JSON image paths whose only filename difference is leading zeros.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(process.argv[2] || 'G:/somi/Jack O Nine Tails v2.4_work/game');
const hash = raw => crypto.createHash('sha256').update(raw).digest('hex');
const stripZeros = name => name.toLowerCase().replace(/^0+(?=\d)/, '');
const dirCache = new Map();
const candidates = [];
let jsonCount = 0;
let imagePathCount = 0;
for (const file of fs.readdirSync(path.join(root, 'json/slaves')).filter(name => name.endsWith('.json')).sort()) {
  const raw = fs.readFileSync(path.join(root, 'json/slaves', file));
  const object = JSON.parse(raw.toString('utf8').replace(/^\uFEFF/, ''));
  jsonCount++;
  for (const [key, value] of Object.entries(object)) {
    if (typeof value !== 'string' || !/^(?:content[\\/]pic[\\/]|girls[\\/](?:full|face)[\\/])/.test(value)) continue;
    imagePathCount++;
    const relative = (value.startsWith('content') ? '' : 'content/pic/') + value + '.png';
    const target = path.join(root, relative);
    if (fs.existsSync(target)) continue;
    const directory = path.dirname(target);
    if (!fs.existsSync(directory)) continue;
    if (!dirCache.has(directory)) dirCache.set(directory, fs.readdirSync(directory));
    const base = path.basename(target);
    const alternatives = dirCache.get(directory).filter(name => stripZeros(name) === stripZeros(base));
    if (alternatives.length) candidates.push({file, key, value, missingPath: relative, alternatives, jsonSha256: hash(raw)});
  }
}
const qspPath = path.join(root, 'jack.qsp');
console.log(JSON.stringify({root, qspSha256: fs.existsSync(qspPath) ? hash(fs.readFileSync(qspPath)) : null, jsonCount, imagePathCount, leadingZeroOnlyCount: candidates.length, candidates}, null, 2));
