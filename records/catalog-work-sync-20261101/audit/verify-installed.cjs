/* Final read-only check, using audit.json's 242-slot WORK snapshot. No API calls. */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const audit = JSON.parse(fs.readFileSync(path.join(__dirname,'audit.json'),'utf8'));
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const norm = p => String(p || '').replaceAll('\\','/');
function parseAfter(html, marker) {
  let i = html.indexOf(marker);
  if (i < 0) throw Error('Missing marker '+marker);
  i += marker.length; while (/\s/.test(html[i])) i++;
  const open=html[i],close=open==='['?']':'}';let depth=0,str=false,esc=false;
  for(let j=i;j<html.length;j++) {let c=html[j];if(str){if(esc)esc=false;else if(c==='\\')esc=true;else if(c==='"')str=false;}
    else if(c==='"')str=true;else if(c===open)depth++;else if(c===close&&!--depth)return JSON.parse(html.slice(i,j+1));}
  throw Error('Invalid JSON '+marker);
}
const paths=[audit.sources.catalogPath,'G:/somi/JO9sa/tools/local-workspace/catalog-seed/catalog_merge_vs_original.html'];
const reports=paths.map(file=>{
  const raw=fs.readFileSync(file),html=raw.toString('utf8'),rows=parseAfter(html,'var D='),mob=parseAfter(html,'window.JO9_MOB_SETS='),scenes=parseAfter(html,'window.JO9_SCENE_CONDITIONS=');
  const slots=new Map();for(const e of mob.entries)for(const s of ['portrait','standing','defeat'])slots.set(e.key+'|'+s,e[s]);
  for(const e of mob.groups||[])slots.set(e.key+'|defeat',e.defeat);
  const dmap=new Map();for(const r of rows){const key=norm(r[0]).toLowerCase();if(!dmap.has(key))dmap.set(key,[]);dmap.get(key).push(r);}
  let differences=[];
  for(const cached of audit.slotChecks){
    const s=slots.get(cached.key+'|'+cached.slot),a=cached.actual;
    if(!s){differences.push({key:cached.key,slot:cached.slot,reason:'missing-slot'});continue;}
    if(norm(s.path)!==cached.path)differences.push({key:cached.key,slot:cached.slot,reason:'path-changed',from:cached.path,to:s.path});
    for(const field of ['exists','bytes','sha256','width','height']){
      const expected=a[field];if(expected!==undefined&&s[field]!==expected)differences.push({key:cached.key,slot:cached.slot,field,expected,actual:s[field]});
    }
    const dr=dmap.get(cached.path.toLowerCase())||[];
    if(dr.length!==1)differences.push({key:cached.key,slot:cached.slot,reason:'catalog-row-count',count:dr.length});
    else if(a.exists&&(dr[0][3]!==a.bytes||dr[0][5]!==a.width||dr[0][6]!==a.height))differences.push({key:cached.key,slot:cached.slot,reason:'catalog-row-stale',row:dr[0]});
    else if(!a.exists&&dr[0][3]!==0)differences.push({key:cached.key,slot:cached.slot,reason:'missing-file-nonzero-size',row:dr[0]});
  }
  let recent=[];for(const r of audit.recent){const dr=dmap.get(r.path.toLowerCase())||[];recent.push({path:r.path,valid:dr.length===1&&dr[0][3]===r.bytes&&dr[0][5]===r.width&&dr[0][6]===r.height&&!!scenes.entries[r.path]});}
  return {path:file,sha256:hash(raw),qspSha256:scenes.qspSha256,qspMatchesSnapshot:scenes.qspSha256===audit.sources.qspSha256,
    entries:mob.entries.length,groups:(mob.groups||[]).length,mobSummary:mob.summary,
    slotComparisons:audit.slotChecks.length,differences,recent,recentPass:recent.every(x=>x.valid),
    previewOnlyStillUnregistered:audit.previewOnly.every(x=>!rows.some(r=>norm(r[0]).endsWith('/'+path.basename(x.path)))),
    productionUntouched:true};
});
const result={generatedAt:new Date().toISOString(),verification:'FS-only-no-catalog-API',snapshotQspSha256:audit.sources.qspSha256,
  liveQspUnchanged:hash(fs.readFileSync(audit.sources.workRoot+'/jack.qsp'))===audit.sources.qspSha256,
  reports,pass:reports.every(x=>x.qspMatchesSnapshot&&x.differences.length===0&&x.recentPass&&x.previewOnlyStillUnregistered)};
fs.writeFileSync(path.join(__dirname,'installed-verification.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify({pass:result.pass,liveQspUnchanged:result.liveQspUnchanged,reports:reports.map(x=>({path:x.path,differences:x.differences.length,recentPass:x.recentPass,qspMatchesSnapshot:x.qspMatchesSnapshot,previewOnlyStillUnregistered:x.previewOnlyStillUnregistered}))},null,2));
