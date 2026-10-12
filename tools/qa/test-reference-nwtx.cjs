'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const repo=process.argv[3]||'C:/Users/Ken Choung/.codex/worktrees/modding-tools-transfer/JO9sa',c=require(repo+'/tools/text-workshop/core.cjs');
const raw=fs.readFileSync(process.argv[2]),d=c.parse(raw),report=require(path.resolve(process.argv[4]||repo+'/records/reference-info/2026-10-13_reference_supplements_nwtx.json'));
const tag='<!-- #nwtx -->',body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),helper=body('jo9_reference_info');
assert(c.serialize(d).equals(raw));assert.equal(d.locations.length,248);
const marked=c.entries(d).filter(e=>e.dialogue&&e.text.includes(tag));assert.equal(marked.length,206,'all prior and newly authored prose searchable');
for(const e of marked){assert(!c.visibleText(e.text).includes('#nwtx'));assert.equal((e.text.match(/<!-- #nwtx -->/g)||[]).length,1,'one provenance comment per literal');}
for(const t of report.targets){const name='$'+t.kind+'_info[\''+t.id+'\']';assert(helper.includes(name+' = \''+(t.html+tag).replaceAll("'","''")+"'"),t.id+' marked assignment');if(t.old)assert(helper.includes(name+' = \''+t.old.replaceAll("'","''")+"':"),t.id+' custom-save overwrite guard');}
assert(body('$newloc').includes('if jo9_reference_info_revision < 2:'));assert(helper.includes('jo9_reference_info_revision = 2'));
const mod=require(repo+'/mods/2026-10-13_zzzz_reference_supplements_nwtx.json');
for(const e of mod.edits)if(!['jo9_reference_info','$newloc'].includes(e.location))assert.equal(e.new.split(tag).join(''),e.old,e.location+' only invisible comments changed');
assert(marked.some(e=>e.text.includes('죽음의 길을 가로막았다')));assert(marked.some(e=>e.text.includes('알료샤의 의뢰를 거쳐')));
console.log(JSON.stringify({checks:8,searchable:marked.length,hiddenMarkup:true,saveMigrationGuard:true,unrelatedLogicPreserved:true,qspSha256:c.hash(raw),nativeGameplayVerified:false}));
