'use strict';
// SHOW HTML is data, never executable markup. No QSP/save-state evaluation.
const indexed=new WeakMap();
function entities(s){return s.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp|laquo|raquo|mdash|ndash);/gi,(m,n)=>{if(n[0]==='#'){const v=n[1].toLowerCase()==='x'?parseInt(n.slice(2),16):parseInt(n.slice(1),10);return v>0&&v<=0x10ffff?String.fromCodePoint(v):' ';}return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',laquo:'«',raquo:'»',mdash:'—',ndash:'–'}[n.toLowerCase()]||m;});}
const scrub=s=>String(s||'').replace(/<!--[^]*?-->/g,'').replace(/<(script|style)\b[^>]*>[^]*?<\/\1\s*>/gi,'');
const normal=s=>entities(s).replace(/[\u200b\u00ad]/g,'').replace(/\s+/g,' ').trim();
const plain=s=>normal(scrub(s).replace(/<[^>]*>/g,' '));
function parse(html){
 if(typeof html!=='string'||Buffer.byteLength(html)>4*1024*1024)throw Error('SHOW HTML 크기가 유효하지 않습니다.');
 const clean=scrub(html),stack=[],panels={},resources=[],seen=new Set();
 for(const token of clean.matchAll(/<[^>]*>|[^<]+/g)){
  const s=token[0];if(!s.startsWith('<')){for(const frame of stack)if(frame.id)panels[frame.id]+=s;continue;}
  const close=s.match(/^<\/\s*([\w:-]+)/);if(close){let i=stack.length-1;while(i>=0&&stack[i].tag!==close[1].toLowerCase())i--;if(i>=0)stack.splice(i);for(const frame of stack)if(frame.id)panels[frame.id]+=' ';continue;}
  const start=s.match(/^<\s*([\w:-]+)/);if(!start)continue;const tag=start[1].toLowerCase(),id=s.match(/\bid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i),key=id&&(id[1]??id[2]??id[3]);
  for(const frame of stack)if(frame.id&&['br','p','div','li'].includes(tag))panels[frame.id]+=' ';
  if(key&&['text','side_panel_text','side_panel_location','side_panel_location_2'].includes(key.toLowerCase()))panels[key.toLowerCase()]='';
  if(!['br','img','meta','link','hr','input','source','wbr'].includes(tag)&&!s.endsWith('/>'))stack.push({tag,id:key&&Object.hasOwn(panels,key.toLowerCase())?key.toLowerCase():null});
 }
 for(const m of clean.matchAll(/content[\\/]+pic[\\/]+[^"'<>\r\n]*?\.(?:png|jpe?g|webp|gif)/gi)){
  const p=entities(m[0]).replace(/\\/g,'/');if(p.split('/').includes('..')||seen.has(p))continue;seen.add(p);resources.push({path:p});
 }
 return {text:normal(panels.text||''),referenceText:normal(panels.side_panel_text||''),title:normal(panels.side_panel_location||panels.side_panel_location_2||''),resources};
}
function imageKey(p){return String(p||'').replace(/\\/g,'/').replace(/^content\/pic\//i,'').replace(/^\/+/, '');}
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function index(entries){
 if(indexed.has(entries))return indexed.get(entries);
 const result=[];for(const e of entries){if(!e.dialogue)continue;const text=plain(e.text.replace(/<<[^]*?>>/g,'\u0007'));const parts=text.split('\u0007'),staticLength=parts.join('').length;if(staticLength<12||text.length>12000)continue;
 result.push({entry:e,text,staticLength,pattern:parts.map(escape).join('.{0,160}?')});}
 indexed.set(entries,result);return result;
}
function match(snapshot,entries,resolve){
 const text=normal(snapshot.text||snapshot.referenceText||''),observed=new Set((snapshot.resources||[]).map(x=>imageKey(x.path)));if(text.length<12)return {candidates:[],confident:false};
 const matches=[];for(const item of index(entries)){const full=new RegExp('^'+item.pattern+'$','u').test(text),partial=full?null:text.match(new RegExp(item.pattern,'u'));if(!full&&!partial)continue;
 const coverage=(full?text.length:partial[0].length)/text.length;if(coverage<0.35)continue;matches.push({...item,full,coverage,base:(full?1000:400)+Math.min(item.staticLength,800)});}
 matches.sort((a,b)=>b.base-a.base);const candidates=[],unique=new Set();let incomplete=matches.length>40;
 for(const item of matches.slice(0,40)){
  let base;try{base=resolve(item.entry);}catch{continue;}
  if(base.flow?.usages?.length>80)incomplete=true;
  const uses=base.flow?.usages?.length>1?base.flow.usages.slice(0,80).map(u=>u.id):[base.flow?.usage?.id||null];
  for(const usageId of uses){let c=base;try{if(usageId)c=resolve(item.entry,usageId);}catch{continue;}
   const pics=[...(c.images||[]),...(c.flow?.stageImages||[])],imageMatches=new Set(pics.map(p=>imageKey(typeof p==='string'?p:p.path)).filter(p=>observed.has(p))).size;
   const key=[item.entry.location,item.entry.fieldIndex,item.entry.start,usageId||''].join(':');if(unique.has(key))continue;unique.add(key);
   candidates.push({selection:c.selection||item.entry,sceneId:c.scene.id,sceneTitle:c.flow?.usage?.title||c.scene.title,usageId,score:item.base+Math.min(imageMatches,3)*200,exact:item.full,coverage:item.coverage,imageMatches});
  }
 }
 candidates.sort((a,b)=>b.score-a.score);const first=candidates[0],second=candidates[1];const confident=!incomplete&&!!first&&(first.exact||first.coverage>0.9)&&(!second||first.score-second.score>=150);
 return {candidates:candidates.slice(0,30),total:candidates.length,incomplete,confident};
}
module.exports={parse,match,plain,imageKey};
