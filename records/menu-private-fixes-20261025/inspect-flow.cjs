const fs=require('node:fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const d=c.parse(fs.readFileSync('G:/Codex/tmp/menu-private-fixes-20261025/candidate-quota.qsp'));
for(const n of ['interaction','interaction_result','interaction_screen']){
 const l=d.locations.find(x=>x.name===n),lines=c.shift(d.lines[l.body],5).split(/\r?\n/);
 console.log(n);
 for(let i=0;i<lines.length;i++)if(/dynamic \$special_part|dynamic \$common_part|gt 'interaction_result'|gs 'interaction_result'|interaction_result.*args|^if args|^if interaction_result|^if.*success|^\s*(if|elseif).*\$interaction_type/.test(lines[i]))console.log((i+1)+': '+lines[i]);
}
