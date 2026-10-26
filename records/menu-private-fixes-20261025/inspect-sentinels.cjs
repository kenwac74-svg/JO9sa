const fs=require('node:fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const d=c.parse(fs.readFileSync('G:/Codex/tmp/menu-private-fixes-20261025/candidate-final.qsp'));
let count=0;
for(const l of d.locations){const lines=c.shift(d.lines[l.body],5).split(/\r?\n/);for(let i=0;i<lines.length;i++)if(/rate\[["']nothing["']\]|jo9_meiki_initialized|ero_rwd_cnt\] = 1/i.test(lines[i])){if(count++<35)console.log(l.name+':'+(i+1)+': '+lines[i].slice(0,500));}}
