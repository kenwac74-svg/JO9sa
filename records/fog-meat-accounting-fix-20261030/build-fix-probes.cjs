const fs=require('fs');
let x=fs.readFileSync(__dirname+'/audit.cjs','utf8');
x=x.replace('H=__dirname',"H='G:/Codex/tmp/fog-meat-accounting-fix-20261030/probes'")
.replace("T='G:/Codex/tmp/fog-meat-accounting-audit-20261030'","T='G:/Codex/tmp/fog-meat-accounting-fix-20261030/probes'")
.replace("raw=fs.readFileSync(G+'/jack.qsp')","raw=fs.readFileSync('G:/Codex/tmp/fog-meat-accounting-fix-20261030/candidate.qsp')")
.replaceAll('hidden:true','hidden:false');
fs.writeFileSync(__dirname+'/fix-probes.cjs',x);
require('./fix-probes.cjs');
