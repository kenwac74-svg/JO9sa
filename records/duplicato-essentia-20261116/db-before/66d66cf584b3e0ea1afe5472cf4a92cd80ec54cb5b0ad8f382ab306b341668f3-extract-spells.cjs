'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require(process.env.JO9_REFERENCE_CORE||'../text-workshop/core.cjs');
function extract(raw,menuItems){
 const doc=core.parse(raw),sources=new Map(doc.locations.map(l=>[l.name,core.shift(doc.lines[l.body],5).replace(/\r\n/g,'\n')]));
 const menu=new Map(Object.entries(menuItems).map(([k,v])=>[k.toLowerCase(),v])),calls=new Map();
 const form=sources.get('menu_form').split('\n');
 const call=/func\('\$menu',\s*'goto',\s*[^,]+,\s*(menu_\w+),\s*'interaction',\s*'interaction',\s*'((?:''|[^'])*)'(?:,\s*'((?:''|[^'])*)')?/i;
 for(let i=0;i<form.length;i++){
  const m=call.exec(form[i]);if(!m)continue;const id=menu.get(m[1].toLowerCase());if(!Number.isInteger(id))continue;
  let before=i-1;while(before>=0&&!form[before].trim())before--;
  calls.set(id,{name:m[2].replaceAll("''", "'").replace(/\(\$\d+\)\s*$/,'').trim(),description:(m[3]||'').replaceAll("''", "'"),requirements:/^\s*if\b/i.test(form[before]||'')?form[before].trim():'직접 메뉴 조건 미확인',usage:'menu_form:'+(i+1)});
 }
 const code=sources.get('interaction'),rows=[];
 for(const start of code.matchAll(/^if\s+interaction\s*=\s*(\d+)\s*:[ \t]*$/gmi)){
  const tail=code.slice(start.index),end=/^end[ \t]*$/gmi.exec(tail);if(!end)continue;
  const block=tail.slice(0,end.index+end[0].length);if(!/^\s*\$interaction_type\s*=\s*'spell_cast'/mi.test(block))continue;
  const id=Number(start[1]),active=calls.get(id),costs=[...block.matchAll(/^\s*sparks\s*-=\s*(\d+)/gmi)].map(m=>Number(m[1]));assert(costs.length<=1,'Ambiguous spell cost '+id);
  const line=code.slice(0,start.index).split('\n').length;
  rows.push({id:'interaction:'+id,interactionId:id,name:active?.name||'주문 #'+id,category:[61,65,81].includes(id)?'주인공 버프·탐지':[69,70000].includes(id)?'회복·강화':'대상 시전',description:active?.description||'효과 코드를 확인하세요.',price:costs.length?costs[0]+'스파크':'소모 구문 미확인',sparkCost:costs[0]??null,acquisition:active?.requirements||'직접 메뉴 연결 미확인',requirements:active?.requirements||'',source:'interaction:'+line,usage:active?.usage||'호출 미확인',linked:!!active,code:block});
 }
 assert(rows.length>0,'No spell_cast definitions found');rows.sort((a,b)=>a.interactionId-b.interactionId);
 return{hash:doc.hash,created:new Date().toISOString(),coverage:'현재 WORK의 spell_cast 정의와 마법 메뉴를 대조한 자료입니다. 직접 메뉴 조건과 시전 코드를 표시합니다. 상위 메뉴의 전체 조건·모든 자동 시전 경로를 실행해 검증한 공략은 아닙니다.',rows};
}
if(require.main===module){const[qsp,menu,out]=process.argv.slice(2);assert(qsp&&menu,'Usage: node extract-spells.cjs <jack.qsp> <json/menu_item.json> [spells.json]');const data=extract(fs.readFileSync(qsp),JSON.parse(fs.readFileSync(menu,'utf8')));fs.writeFileSync(out||path.join(__dirname,'spells.json'),JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify({hash:data.hash,spells:data.rows.length,unlinked:data.rows.filter(r=>!r.linked).length}));}
module.exports={extract};
