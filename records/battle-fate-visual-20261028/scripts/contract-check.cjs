'use strict';
const fs=require('node:fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const game=process.argv[2]||'G:/somi/Jack O Nine Tails v2.4_work/game',qsp=process.argv[3]||game+'/jack.qsp';
const d=c.parse(fs.readFileSync(qsp)),loc=n=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),h=loc('jo9_battle_fate');
const checks={noTextContinue:!h.includes('[계속]'),spareHasClass:h.includes('class="jo9-battle-fate-spare"'),defeatLookup:loc('конец_боя').includes('content/pic/mob/defeated/glad_armored.png'),arenaBackgroundBoth:loc('конец_боя').includes('/arena.png')&&loc('боевой_интерфейс').includes('/arena.png'),redEffectBackground:h.includes('execution_red.png'),assetsInstalled:fs.existsSync(game+'/content/pic/mob/defeated/glad_armored.png')};
console.log(JSON.stringify({qspHash:d.hash,checks,status:Object.values(checks).every(Boolean)?'PASS':'FAIL'},null,2));
process.exitCode=Object.values(checks).every(Boolean)?0:1;
