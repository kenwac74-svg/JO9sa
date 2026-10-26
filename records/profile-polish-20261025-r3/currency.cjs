'use strict';
// Pure display-token conversion. Call with an already decoded QSP literal.
// The caller owns QSP quote escaping, comments, patches and all file writes.
const GAP='(?:[ \\t\\u00a0]|&nbsp;)*';
const PH='\\uE000[A-Z]+\\uE001';
const NUM='\\d+(?:[,.]\\d+)*';
const ATOM='(?:'+PH+'|'+NUM+')';
// Build explicitly: format tags may surround the digits but are never reordered.
const ENDS='(?:'+GAP+'<\\/(?:b|strong|i|em|font|span|u)\\s*>)*';
const OPENS='(?:<(?:b|strong|i|em|font|span|u)(?:\\s[^<>]*?)?>'+GAP+')*';
const CHAIN=ATOM+ENDS+'(?:'+GAP+'[-–—~～]'+GAP+OPENS+ATOM+ENDS+')*';
const AMOUNT=new RegExp('([+−-]?)(\\$?)('+CHAIN+')'+GAP+'(스파크|\\$)','gu');
const LABEL=new RegExp('(^|[> \\t\\r\\n])스파크'+GAP+':'+GAP+'([+−-]?)(\\$?)('+CHAIN+')','gu');
const PURE=new RegExp('^[+−-]?\\$?'+NUM+'(?:'+GAP+'[-–—~～]'+GAP+'\\$?'+NUM+')*'+GAP+'(?:스파크|\\$)$','u');
function alpha(i){let out='';do{out=String.fromCharCode(65+i%26)+out;i=Math.floor(i/26)-1;}while(i>=0);return out;}
function quotedPrices(expr,changes){
 let out='',at=0;
 while(at<expr.length){
  const q=expr[at];if(q!=="'"&&q!=='"'){out+=q;at++;continue;}
  let end=at+1,value='';
  for(;end<expr.length;end++){
   if(expr[end]===q){if(expr[end+1]===q){value+=q;end++;continue;}break;}
   value+=expr[end];
  }
  if(end>=expr.length)return expr;
  let changed=value;
  if(PURE.test(value)){
   changed=convertMasked(value,[]);
   if(changed!==value)changes.push({kind:'interpolation-pure-price',before:value,after:changed});
  }
  out+=q+changed.replaceAll(q,q+q)+q;at=end+1;
 }
 return out;
}
function convertMasked(text,changes){
 LABEL.lastIndex=0;
 text=text.replace(LABEL,(whole,boundary,sign,already,chain)=>{
  const replacement=boundary+'보유금: '+sign+'$'+chain;
  changes.push({kind:'currency-label',before:whole,after:replacement});
  return replacement;
 });
 AMOUNT.lastIndex=0;
 return text.replace(AMOUNT,(whole,sign,already,chain,unit,index)=>{
  const prev=text[index-1]||'',next=text[index+whole.length]||'';
  // Never turn a numeric suffix in an identifier/path/version or $variable into money.
  if(/[\p{L}\p{N}_.\\/\uE000\uE001]/u.test(prev))return whole;
  if(unit==='$'&&/[A-Za-z0-9_\u0400-\u04ff]/u.test(next))return whole;
  const replacement=sign+'$'+chain;
  if(replacement!==whole)changes.push({kind:chain.includes('–')||chain.includes('-')||chain.includes('~')?'range-or-signed':'amount',before:whole,after:replacement});
  return replacement; // Callback is intentional: '$10' must not be a JS replacement template.
 });
}
function run(input){
 const text=String(input),parts=[],partMap=new Map(),changes=[];let masked='',at=0;
 while(at<text.length){
  if(!text.startsWith('<<',at)){masked+=text[at++];continue;}
  const start=at;let p=at+2,q='',end=-1;
  for(;p<text.length;p++){
   const ch=text[p];
   if(q){if(ch===q){if(text[p+1]===q){p++;continue;}q='';}continue;}
   if(ch==="'"||ch==='"'){q=ch;continue;}
   if(text.startsWith('>>',p)){end=p+2;break;}
  }
  if(end<0)return {text,changes:[],skipped:'Incomplete interpolation; caller must inspect this fragment'};
  const original=text.slice(start,end),updated=quotedPrices(original,changes);
  const token='\uE000'+alpha(parts.length)+'\uE001';parts.push({token,original,updated});partMap.set(token,updated);masked+=token;at=end;
 }
 let result=convertMasked(masked,changes);
 const restore=s=>s.replace(/\uE000[A-Z]+\uE001/g,t=>partMap.get(t));
 result=restore(result);
 for(const row of changes){row.before=restore(row.before);row.after=restore(row.after);}
 return {text:result,changes,skipped:null};
}
function transform(text){return run(text).text;}
function scan(text){
 const result=run(text);const remaining=[];
 // Keep the noun in abstract lore/dialogue; these are review hints, not automatic edits.
 for(const m of result.text.matchAll(/스파크/g)){
  const left=result.text.slice(Math.max(0,m.index-45),m.index);
  if(/\d|>>|<\/|[백천만억][ \t]*$/.test(left))remaining.push({at:m.index,left:left.slice(-45)});
 }
 return {changed:result.text!==String(text),changes:result.changes,skipped:result.skipped,remainingAmountUnits:remaining};
}
module.exports={transform,scan};
