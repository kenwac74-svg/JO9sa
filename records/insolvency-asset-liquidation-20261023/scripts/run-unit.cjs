const fs=require('fs'),path=require('path'),cp=require('child_process');const repo='G:/somi/JO9sa';
const files=['tools/qa','tools/state-editor'].flatMap(d=>fs.readdirSync(repo+'/'+d).filter(x=>x.endsWith('.test.cjs')).map(x=>repo+'/'+d+'/'+x));
const r=cp.spawnSync(process.execPath,['--test',...files],{cwd:repo,encoding:'utf8',maxBuffer:6e6});
fs.writeFileSync('G:/Codex/tmp/jo9-insolvency-20261023/unit-tests.log',r.stdout+'\n'+r.stderr);
const lines=r.stdout.split(/\r?\n/).filter(x=>/^# (tests|pass|fail|cancelled|skipped|duration_ms)/.test(x));console.log(lines.join('\n'));process.exitCode=r.status;
