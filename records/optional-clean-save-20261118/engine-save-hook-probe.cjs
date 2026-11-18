'use strict';
const fs=require('node:fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const root='G:/Codex/tmp/save-autoclean-20261118/hook';fs.mkdirSync(root,{recursive:true});
const d=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
const lines=d.lines.slice(0,3),cr=s=>s.replace(/\r?\n/g,'\r\n');
const locs=[['Start',`$onnewloc='' & $counter=''
$ongsave='qa_before_save'
probe_dirty=9 & probe_hook=0
savegame '${root}/probe.sav'
msg 'JO9_HOOK_DONE_<<probe_hook>>_<<probe_dirty>>'`],['qa_before_save','probe_hook=1 & probe_dirty=0']];
lines.push(c.shift(String(locs.length),-5));
for(const [name,body] of locs)lines.push(...[name,'',cr(body),'0'].map(s=>c.shift(s,-5)));
lines.push('');fs.writeFileSync(root+'/hook.qsp',Buffer.from(lines.join('\r\n'),'utf16le'));fs.writeFileSync(root+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');console.log(root+'/hook.qsp');
