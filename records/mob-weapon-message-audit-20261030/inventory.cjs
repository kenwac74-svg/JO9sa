'use strict';
const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),G='G:/somi/Jack O Nine Tails v2.4_work/game',H=__dirname,d=c.parse(fs.readFileSync(G+'/jack.qsp'));
const names=d.locations.filter(l=>/оруж|враг|против|удар|атака|бой|fight|combat|battle/i.test(l.name)).map(l=>l.name),get=n=>{const l=d.locations.find(x=>x.name===n);return l?c.shift(d.lines[l.body],5):'';};
const opponent=get('#противники'),lines=opponent.split('\r\n'),assignments=[];
for(let i=0;i<lines.length;i++){const m=lines[i].match(/^\s*(\$?[\p{L}_][\p{L}\p{N}_]*)\[([^\]]+)\]\s*=\s*(.*)$/u);if(m)assignments.push({line:i+1,field:m[1],index:m[2],value:m[3]});}
const fields={};for(const x of assignments){fields[x.field]=(fields[x.field]||0)+1;}
const title=lines.map((text,i)=>({line:i+1,text})).filter(x=>/название_моба|тип_оружия|оружие_моба|оружие\[/i.test(x.text));
const keyMatches=[];for(const l of d.locations){const b=get(l.name).split('\r\n');for(let i=0;i<b.length;i++)if(/(?:тип_оружия|оружие_моба|mob_weapon|weapon_type)/i.test(b[i]))keyMatches.push({location:l.name,line:i+1,text:b[i]});}
const html=fs.readFileSync(G+'/modtools/catalog/catalog_merge_vs_original.html','utf8'),manifest=JSON.parse(html.match(/window\.JO9_MOB_SETS\s*=\s*(.*?);<\/script>/)[1]);
const result={qspSha256:d.hash,locations:d.locations.length,relevantLocations:names,opponentFieldCounts:fields,opponentAssignments:assignments,titles:title,weaponTypeReferences:keyMatches,catalogEntries:manifest.entries.map(e=>({key:e.key,name:e.name,enemyKey:e.enemyKey,portrait:e.portrait?.path,standing:e.standing?.path}))};fs.writeFileSync(H+'/inventory.json',JSON.stringify(result,null,2));console.log(JSON.stringify({qsp:d.hash,relevantLocations:names,fields,titles:title.slice(0,8),weaponTypeReferences:keyMatches.slice(0,10),opponentLines:lines.length,catalogEntries:manifest.entries.length},null,2));
