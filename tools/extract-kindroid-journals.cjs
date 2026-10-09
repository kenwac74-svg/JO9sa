'use strict';
const fs=require('node:fs'),path=require('node:path');
const core=require('C:/Users/Ken Choung/Documents/Codex/2026-10-06/task/JO9sa/tools/text-workshop/core.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'tmp/kindroid-journals');
fs.mkdirSync(out,{recursive:true});
const raw=fs.readFileSync('C:/MOVE/Jack O Nine Tails v2.3 Kor_nosex/game/jack.qsp'),doc=core.parse(raw);
function text(s){return s.replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/?(?:font|center|div|p|b|strong|i|em|span|a|u)(?:\s[^>]*)?>/gi,'').replace(/&nbsp;/gi,' ').replace(/&quot;/gi,'"').replace(/&amp;/gi,'&').replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();}
const entries=[],empty=[],issues=[];
const npcBody=core.shift(doc.lines[doc.locations.find(l=>l.name==='#npc_base').body],5),npcs=new Map();
for(const source of ['#npc_base','#masters_base']){
const npcBody=core.shift(doc.lines[doc.locations.find(l=>l.name===source).body],5), npcLits=core.literals(npcBody);
for(let index=0;index<npcLits.length;index++){
 const lit=npcLits[index];
 const m=npcBody.slice(Math.max(0,lit.start-250),lit.start-1).match(/\$(npc_name|npc_status|npc_info)\[\s*(['"])([^'"]+)\2\s*\]\s*=\s*$/);
 if(!m)continue;
 const item=npcs.get(m[3])||{id:m[3]};
 if(item[m[1]]!==undefined&&item[m[1]]!==lit.text)issues.push({type:'npc-reassignment',id:item.id,field:m[1],line:lit.line});
 let value=lit.text,last=lit;
 while(npcLits[index+1]&&/^\s*\+\s*_?\s*$/.test(npcBody.slice(last.end+1,npcLits[index+1].start-1))){last=npcLits[++index];value+=last.text;}
 item[m[1]]=value;item.location=source;npcs.set(item.id,item);
}
}
for(const item of npcs.values()){
 const info=text(item.npc_info||'');
 if(!info||/^[.·…\s]+$/.test(info)){empty.push({kind:'npc',id:item.id,name:text(item.npc_name||'')});continue;}
 const name=text(item.npc_name||''),status=text(item.npc_status||'');
 if(!name){issues.push({type:'missing-name',id:item.id});continue;}
 const content=[name,status,'참고 정보:',info].filter(Boolean).join('\n\n');
 entries.push({kind:'npc',id:item.id,name,keywords:[name],content,length:content.length,source:item.location,original:{name:item.npc_name,status:item.npc_status,info:item.npc_info}});
}
const placeBody=core.shift(doc.lines[doc.locations.find(l=>l.name==='#place_base').body],5),lits=core.literals(placeBody);
for(let i=0;i<lits.length;i++){
 const first=lits[i];
 if(!/dynamic\s+\$pb_cycle\s*,\s*$/i.test(placeBody.slice(Math.max(0,first.start-80),first.start-1)))continue;
 const vals=lits.slice(i,i+4);
 if(vals.length!==4||vals.slice(1).some((v,j)=>!/^\s*,\s*$/.test(placeBody.slice(vals[j].end+1,v.start-1)))){issues.push({type:'place-args',line:first.line});continue;}
 const [id,n,area,rawInfo]=vals.map(v=>v.text),name=text(n),info=text(rawInfo);
 if(!info||/^[.·…\s]+$/.test(info)){empty.push({kind:'place',id,name});continue;}
 const content=[name,text(area),info].filter(Boolean).join('\n\n');
 entries.push({kind:'place',id,name,keywords:[name],content,length:content.length,source:'#place_base',original:{name:n,area,info:rawInfo}});
}
const estate=core.shift(doc.lines[doc.locations.find(l=>l.name==='#estate_base').body],5);
for(const lit of core.literals(estate)){
 const m=estate.slice(Math.max(0,lit.start-150),lit.start-1).match(/\$interior_(study|bed)_info\['slum_house'\]\s*=\s*$/);
 if(!m)continue;
 const name=m[1]==='study'?'집무실':'침실',info=text(lit.text),content=name+'\n\n'+info;
 entries.push({kind:'place',id:'slum_house_'+m[1],name,keywords:[name,'빈민가 집'],content,length:content.length,source:'#estate_base',original:{info:lit.text}});
}
const seen=new Map(),unique=[],duplicates=[];
for(const entry of entries){
 entry.content=entry.content.replace(/\r\n/g,'\n');entry.length=entry.content.length;
 entry.keywords=entry.keywords.map(k=>k.length<2?k+' 소개':k);
 if(seen.has(entry.content)){duplicates.push({id:entry.id,sameAs:seen.get(entry.content)});continue;}
 seen.set(entry.content,entry.id);unique.push(entry);
}
const result={qspSha256:core.hash(raw),entries:unique,excludedEmpty:empty,duplicates,issues};
fs.writeFileSync(path.join(out,'entries.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({npc:entries.filter(e=>e.kind==='npc').length,place:entries.filter(e=>e.kind==='place').length,empty:empty.length,under20:entries.filter(e=>e.length<20).map(e=>({kind:e.kind,id:e.id,name:e.name,length:e.length})),over500:entries.filter(e=>e.length>500).map(e=>({kind:e.kind,id:e.id,name:e.name,length:e.length})),issues},null,2));
