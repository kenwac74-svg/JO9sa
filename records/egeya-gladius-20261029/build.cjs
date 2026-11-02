const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),a=require('assert/strict');
const root='G:/Codex/tmp/egeya-gladius-20261029',game='G:/somi/Jack O Nine Tails v2.4_work/game';
fs.mkdirSync(root+'/mods',{recursive:true});
const raw=fs.readFileSync(game+'/jack.qsp'),d=c.parse(raw),l=d.locations.find(x=>x.name==='#противники'),s=c.shift(d.lines[l.body],5);
const replacement=[
["$атака_1_текст","에게야는 글라디우스로 당신의 다리를 <font color='purple'>날카롭게</font> 베었다."],
["$атака_2_текст","에게야는 글라디우스를 <font color='green'>빠르게</font> 휘둘러 연달아 베어 왔다."],
["$атака_3_текст","에게야는 글라디우스를 치켜들고 당신을 향해 <font color='red'>힘껏</font> 내리쳤다."],
["$суператака_1_текст","에게야가 글라디우스로 <font color='red'>강력한</font> 일격을 가해 당신의 몸을 깊이 베었다."],
["$суператака_1_кратко","[글라디우스 강타]"]];
const edits=replacement.map(([key,text])=>{const old=s.split('\r\n').find(x=>x.startsWith(key+"['egeya'] ="));a(old);return{location:l.name,field:'body',old,new:'! JO9 MOD START EGEYA_GLADIUS_TEXT_20261029\r\n'+key+"['egeya'] = "+JSON.stringify(text)+'\r\n! JO9 MOD END EGEYA_GLADIUS_TEXT_20261029',count:1};});
let updated=s;for(const e of edits)updated=updated.split(e.old).join(e.new);
a(!updated.split('\n').some(x=>x.includes("['egeya']")&&x.includes('톱니채찍')));
d.lines[l.body]=c.shift(updated,-5);const out=c.serialize(d);a(c.serialize(c.parse(out)).equals(out));
const patch={id:'2026-10-29_egeya_gladius_text',description:'Egeya gladius combat descriptions; no combat numeric changes',before_sha256:c.hash(raw),after_sha256:c.hash(out),edits};
fs.writeFileSync(root+'/baseline.qsp',raw);fs.writeFileSync(root+'/candidate.qsp',out);
fs.writeFileSync(root+'/mods/'+patch.id+'.json',JSON.stringify(patch,null,2));
fs.writeFileSync(__dirname+'/patch.json',JSON.stringify(patch,null,2));
console.log({before:patch.before_sha256,after:patch.after_sha256,edits:edits.length});
