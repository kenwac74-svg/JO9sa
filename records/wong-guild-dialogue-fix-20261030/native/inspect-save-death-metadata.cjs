'use strict';
const fs=require('fs'),sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const p='G:/somi/Jack O Nine Tails v2.4_work/game/save/JO9_GOLD_AP_CHECK_20261026.sav',raw=fs.readFileSync(p),s=sc.parse(raw),v=s.vars.find(z=>z.name.toUpperCase()==='DEATH');
if(!v)throw Error('DEATH absent');const t=v.values[0]?.[1]||'',aliases=v.idx.map(([index,key])=>({index,key,textLength:(v.values[index]?.[1]||'').length}));
const metadata={save:p,sha256:c.hash(raw),variable:v.name,indexZero:{textLength:t.length,hasNewline:/[\r\n]/.test(t),containsExitTarget:/gt\s+'exit'/i.test(t),containsDayZero:/day\s*=\s*0/i.test(t)},aliases:aliases.filter(x=>/egeya|erza/.test(x.key)),firstFiveAliases:aliases.slice(0,5),valueCount:v.values.length};
fs.writeFileSync(__dirname+'/save-death-metadata.json',JSON.stringify(metadata,null,2)+'\n');console.log(JSON.stringify(metadata));
