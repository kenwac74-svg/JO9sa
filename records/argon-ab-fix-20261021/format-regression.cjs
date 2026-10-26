'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const root=__dirname,file=process.argv[2]||root+'/inputs/baseline.qsp',doc=core.parse(fs.readFileSync(file)),body=core.shift(doc.lines[doc.locations.find(l=>l.name==='#npc_base').body],5);
const results=[];
for(const variable of ['$quinta_pref[3]',...Array.from({length:5},(_,i)=>'$barman_pref['+(i+1)+']')]){
 const lines=body.split('\r\n').filter(s=>s.trimStart().startsWith(variable+' ='));
 assert.equal(lines.length,1);const literals=core.literals(lines[0]);assert.equal(literals.length,1);const text=literals[0].text;
 const problems=[];try{core.validateMarkup(text);}catch(e){problems.push(e.message);}
 const stack=[];for(const m of text.matchAll(/<(\/?)(b|font)(?:\s[^<>]*?)?>/gi)){if(m[1]){if(stack.pop()!==m[2].toLowerCase())problems.push('Invalid b/font nesting');}else stack.push(m[2].toLowerCase());}if(stack.length)problems.push('Unclosed b/font');
 results.push({variable,pass:problems.length===0,problems});
}
const report={file,sha256:doc.hash,results,passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length};
const name=process.argv[3]||'format-result.json';fs.writeFileSync(root+'/'+name,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,failed:report.failed}));process.exitCode=report.failed?1:0;