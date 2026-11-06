'use strict';
// Read-only audit of the exact QSP extracted from the distribution ZIP.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const syntax=require('G:/somi/JO9sa/tools/check-image-cycle-syntax.cjs');
const {inspectMarkerBoundaries}=require('G:/somi/JO9sa/tools/qa/check-qsp-marker-boundaries.cjs');
const qsp='G:/Codex/tmp/jo9-independent-qa-r2-20261105/qsp/jack.qsp';
const raw=fs.readFileSync(qsp),doc=core.parse(raw),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const scripts=[];
for(const l of doc.locations){
 scripts.push({location:l.name,field:'body',text:core.shift(doc.lines[l.body],5)});
 const at=l.body-2,n=Number(core.shift(doc.lines[at+3],5));
 for(let i=0;i<n;i++)scripts.push({location:l.name,field:'action:'+i,text:core.shift(doc.lines[at+6+i*3],5)});
}
const checks=scripts.map(s=>{const r=syntax.checkSyntax(s.text);return{location:s.location,field:s.field,...r};});
const issues=checks.filter(c=>!c.ok);
const result={createdAt:new Date().toISOString(),candidate:qsp,sha256:hash(raw),scope:'all location bodies and built-in action scripts',qspLocations:doc.locations.length,scripts:scripts.length,roundtrip:core.serialize(doc).equals(raw),markerBoundaries:inspectMarkerBoundaries(raw),tool:'G:/somi/JO9sa/tools/check-image-cycle-syntax.cjs',toolSha256:hash(fs.readFileSync('G:/somi/JO9sa/tools/check-image-cycle-syntax.cjs')),linterSelfTests:syntax.runSelfTests(),checked:checks.length,passed:checks.filter(c=>c.ok).length,issueScripts:issues.length,issues,limits:['Source-derived lexer grouping and standalone multiline IF/FOR/ACT/ELSE/ELSEIF/END check; not a full grammar compiler.','Does not validate every expression, string-contained dynamic script, jump target, state persistence, or native GUI.','No game/native EXE is launched by this script.'],inputUnchanged:hash(fs.readFileSync(qsp))===hash(raw)};
fs.writeFileSync(path.join(__dirname,'static-syntax.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({sha256:result.sha256,locations:result.qspLocations,scripts:result.scripts,linterPassed:result.passed,issueScripts:result.issueScripts,issueKinds:[...new Set(issues.flatMap(x=>x.errors.map(e=>e.code)))],inputUnchanged:result.inputUnchanged}));
