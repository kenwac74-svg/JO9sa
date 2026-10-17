'use strict';
const fs=require('node:fs'),core=require('../text-workshop/core.cjs');
function inspect(raw){
 const doc=core.parse(raw),issues=[];
 for(const loc of doc.locations){const body=core.shift(doc.lines[loc.body],5);for(let i=0;i<body.length;i++){if(body[i]==='\r'&&body[i+1]!=='\n'||body[i]==='\n'&&body[i-1]!=='\r')issues.push({location:loc.name,offset:i,line:body.slice(0,i).split(/\r\n|\r|\n/).length,kind:body[i]==='\r'?'loneCR':'loneLF'});}}
 return{sha256:core.hash(raw),locations:doc.locations.length,issues};
}
if(require.main===module){if(!process.argv[2]){console.error('Usage: node tools/qa/check-qsp-line-endings.cjs game.qsp');process.exitCode=2;}else{const result=inspect(fs.readFileSync(process.argv[2]));console.log(JSON.stringify(result,null,2));if(result.issues.length)process.exitCode=1;}}
module.exports={inspect};
