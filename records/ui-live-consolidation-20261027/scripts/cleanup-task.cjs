'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root='G:/Codex/tmp/ui-live-consolidation-20261027',rec='G:/somi/JO9sa/records/ui-live-consolidation-20261027',core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const resolved=path.resolve(root),real=fs.realpathSync(root);assert.equal(real.toLowerCase(),resolved.toLowerCase());assert(!fs.lstatSync(root).isSymbolicLink());assert.equal(resolved.toLowerCase(),path.resolve('G:/Codex/tmp/ui-live-consolidation-20261027').toLowerCase());
for(const report of ['installation.json','installed-verification.json','battle-font-native-results.json','official-report.json','final-preservation-check.json']){const r=JSON.parse(fs.readFileSync(rec+'/'+report,'utf8'));assert.equal(r.status||r.verdict,report==='installation.json'?'complete':'PASS',report);}
const result={root:resolved,status:'running',files:0,directories:0,linksUnlinked:0,bytesRemoved:0,failures:[]};
function remove(file){const abs=path.resolve(file);assert(abs===resolved||abs.startsWith(resolved+path.sep));const s=fs.lstatSync(abs);if(s.isSymbolicLink()){try{fs.unlinkSync(abs)}catch(e){if(['EPERM','EISDIR'].includes(e.code))fs.rmdirSync(abs);else throw e;}result.linksUnlinked++;return;}if(s.isDirectory()){for(const e of fs.readdirSync(abs))remove(path.join(abs,e));fs.rmdirSync(abs);result.directories++;}else{fs.unlinkSync(abs);result.files++;result.bytesRemoved+=s.size;}}
// Original assets and saves behind links are not traversed.
try{remove(root);}catch(e){result.failures.push(String(e.stack||e));}
const dup='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp.bak_20261027_180957',backup='G:/somi/JO9_work_backups/ui_resources_20261027082318/jack.qsp';
if(fs.existsSync(dup)){assert(!fs.lstatSync(dup).isSymbolicLink());assert.equal(core.hash(fs.readFileSync(dup)),core.hash(fs.readFileSync(backup)));result.redundantTaskBackupBytes=fs.statSync(dup).size;fs.unlinkSync(dup);}
result.status=result.failures.length?'INCOMPLETE':'PASS';result.completedAt=new Date().toISOString();result.tempRootExists=fs.existsSync(root);fs.writeFileSync(rec+'/cleanup.json',JSON.stringify(result,null,2)+'\n');fs.copyFileSync(__filename,rec+'/scripts/cleanup-task.cjs');console.log(JSON.stringify(result));if(result.failures.length)process.exitCode=1;
