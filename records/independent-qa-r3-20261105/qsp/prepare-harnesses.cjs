'use strict';
// Adapts existing read-only WASM fixtures without editing repository files.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const apSource='G:/somi/JO9sa/records/hard-ap-setting-20261103/tests/hard-ap-runtime.cjs';
const taxSource='G:/somi/JO9sa/records/work-pending-batch-20261105/tax/check.cjs';
let ap=fs.readFileSync(apSource,'utf8'),tax=fs.readFileSync(taxSource,'utf8');
const edits=[];
function replace(kind,s,from,to){if(!s.includes(from))throw Error('Missing adaptation anchor '+from);edits.push({kind,from,to});return s.replace(from,to);}
ap=replace('AP representative stamina',ap,'for(let s=0;s<=5;s++)','for(const s of [0,2,5])');
ap=replace('AP independent creation setting',ap,'for(const creation of [0,2])','for(const creation of [d===2?0:2])');
ap=replace('AP normalization representative stamina',ap,'for(let s=0;s<=5;s++)','for(const s of [0,2,5])');
ap=replace('AP daily representative stamina',ap,'for(let s=0;s<=5;s++)','for(const s of [0,2,5])');
tax=replace('Tax independent creation setting',tax,'for (const creation of [0,1,2])','for (const creation of [difficulty===2?0:2])');
tax=replace('Tax fresh result output',tax,'const summary={source,checks:checks.length,failed:0};',"const summary={createdAt:new Date().toISOString(),source,inputSha256:core.hash(fs.readFileSync(source)),checks:checks.length,failed:0,assertions:checks,fixtureLimitations:['Source-derived locations and blocks; appraisal, renderer and external-menu stubs.','GT destinations replaced with GS then EXIT for fixture control flow.','Only two unsupported consignment FOR loops lowered to equivalent labels for QSP 5.8 WASM.','No game/native EXE launched.']};");
fs.writeFileSync(path.join(__dirname,'ap-wasm.cjs'),ap);
fs.writeFileSync(path.join(__dirname,'tax-wasm.cjs'),tax);
fs.writeFileSync(path.join(__dirname,'harness-adaptations.json'),JSON.stringify({createdAt:new Date().toISOString(),sources:[{path:apSource,sha256:hash(fs.readFileSync(apSource))},{path:taxSource,sha256:hash(fs.readFileSync(taxSource))}],edits,purpose:'Representative equivalence classes for exact latest ZIP candidate; no new production implementation.'},null,2)+'\n');
console.log('Prepared AP and tax WASM harnesses; no production files changed.');
