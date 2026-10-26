const fs=require('node:fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const d=c.parse(fs.readFileSync('G:/Codex/tmp/menu-private-fixes-20261025/candidate.qsp'));
for(const n of ['jo9_buyer_rumors','interaction_city','interaction_screen_city']){
 const l=d.locations.find(x=>x.name===n),s=c.shift(d.lines[l.body],5).split(/\r?\n/);
 console.log(n);
 for(let i=0;i<s.length;i++)if(n==='jo9_buyer_rumors'&&/back|anes|npc_id/.test(s[i])||n==='interaction_city'&&/2991/.test(s[i]))console.log((i+1)+': '+s.slice(Math.max(0,i-2),i+6).join('\n'));
}
