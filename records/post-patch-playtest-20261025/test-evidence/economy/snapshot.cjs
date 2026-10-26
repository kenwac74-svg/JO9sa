const fs=require('fs'),sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
for(const f of process.argv.slice(2)){
 const s=sc.parse(fs.readFileSync(f));
 console.log(JSON.stringify({file:f,vars:Object.fromEntries(['QA_MENU','QA_XP_CALLS','QA_MAIN','MENU_FORM','DECADECOUNT','DAY','SPARKS','SNK_ROOM_TARGET','JO9_LQ','SLAVE_STATE','SLAVE','SLAVE_RATE','QA_DOM_HREF','QA_RUMOR_CONSULT','QA_RUMOR_VIEW'].map(n=>{const v=s.vars.find(v=>v.name===n);return[n,v?{values:v.values.slice(0,10),idx:v.idx.slice(0,10)}:null]})),slave:Object.fromEntries(['stamina','energy','fat','jo9_overwork_half','pet','obedience'].map(k=>[k,sc.value(s,'slave',k)])),headers:s.lines.slice(0,17)}));
}
