'use strict';
// Delete only this task's reproducible diagnostic copies. Never follow a junction.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve('G:/Codex/tmp/shop-text-quest-20261026/ui'),report={root,targets:[],files:0,bytes:0,junctions:[]};
assert.equal(path.resolve(fs.realpathSync(root)),root);
for(const name of ['before','after']){
 const target=path.resolve(root,name);assert.equal(path.dirname(target),root);if(!fs.existsSync(target))continue;
 assert(!fs.lstatSync(target).isSymbolicLink());assert.equal(path.resolve(fs.realpathSync(target)),target);report.targets.push(target);
 function remove(p){const rel=path.relative(target,p);assert(p===target||rel&&!rel.startsWith('..')&&!path.isAbsolute(rel));const stat=fs.lstatSync(p);if(stat.isSymbolicLink()){report.junctions.push({path:p,target:fs.readlinkSync(p)});try{fs.unlinkSync(p)}catch(e){if(e.code!=='EPERM'&&e.code!=='EISDIR')throw e;fs.rmdirSync(p)}return;}if(stat.isDirectory()){for(const entry of fs.readdirSync(p))remove(path.join(p,entry));fs.rmdirSync(p);}else{report.files++;report.bytes+=stat.size;fs.unlinkSync(p);}}
 remove(target);assert(!fs.existsSync(target));
}
report.remaining=fs.readdirSync(root);fs.writeFileSync(__dirname+'/ui-cleanup.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
