'use strict';
const fs=require('node:fs'),a=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const rec='G:/somi/JO9sa/records/battle-font-reference-saves-20261027',file='G:/Codex/tmp/battle-font-reference-saves-20261027/candidate/css/base.css',meta=JSON.parse(fs.readFileSync(rec+'/candidate.json','utf8'));
const old=fs.readFileSync(file,'utf8');a.equal(c.hash(Buffer.from(old)),meta.cssAfter);
let css=old;const from='.jo9-battle-result #fight_txt{left:258px;top:646px;width:763px;height:150px;font-size:18px;line-height:23px;text-align:center;}',to=from.replace('text-align:center','text-align:left');a.equal(css.split(from).length-1,1);css=css.replace(from,to);
const logFont=' font-family:"Sandoll 미생";\r\n font-size:23px;';a.equal(css.split(logFont).length-1,1);css=css.replace(logFont,' text-align:left;\r\n'+logFont);
fs.writeFileSync(file,css);meta.cssBeforeAlignment=meta.cssAfter;meta.cssAfter=c.hash(Buffer.from(css));meta.alignment='left';meta.wrap='normal; full-width panel, natural wrapping for long sentences';fs.writeFileSync(rec+'/candidate.json',JSON.stringify(meta,null,2)+'\n');fs.copyFileSync(__filename,rec+'/scripts/align-left.cjs');console.log(JSON.stringify(meta));
