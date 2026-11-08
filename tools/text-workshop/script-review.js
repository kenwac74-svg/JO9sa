/* JO9 MOD START SCRIPT_REVIEW_20261108 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.JO9ScriptReview=api;})(typeof window==='undefined'?this:window,function(){
 'use strict';
 const number=(v,fallback,min,max)=>Number.isFinite(Number(v))?Math.min(max,Math.max(min,Number(v))):fallback;
 function dimensions(v){return {width:number(v.width,720,320,1400),height:number(v.height,480,120,1000),font:number(v.font,18,12,36)};}
 function overflow(e){return {horizontal:e.scrollWidth>e.clientWidth+1,vertical:e.scrollHeight>e.clientHeight};}
 function displayText(s){return String(s).replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/^([^:\n]{1,40}):\s*/,'$1\n');}
 function createGate(){let version=0;return {begin:()=>++version,invalidate:()=>{version++;},current:v=>v===version};}
 function replaceBlock(text,id,replacement){
  text=String(text);replacement=String(replacement);
  const normalized=line=>line.replace(/^\\(?=(?:={2,}|-{2,})\s*\[S\d+)/,'').replace(/\\$/,'');
  const mark=line=>line.match(/^-{2,}\s*\[(S\d+-P\d+)\]/)||line.match(/^\(\s*(S\d+-P\d+-V\d+)\b[^)]*\)\s*대체문/)||line.match(/^\[(S\d+-L\d+)\b[^\]]*\]\s*$/);
  const structure=line=>/^(?:={2,}\s*\[S\d+\]|\[대사 묶음[\s\]]|▶ |\s+\d+\)\s|\s+·\s|#|\[실행 중 결정|\(진입 조건:|\(이 장면에는|\(이 배열의|```)/.test(line);
  if(replacement.split(/\r\n?|\n/).some(line=>mark(normalized(line))||structure(normalized(line))||/^\(조건:.*\)$/.test(line.trim())))throw Error('대사 본문에 페이지 구분선이나 메타데이터를 넣을 수 없습니다.');
  const ranges=[];let current=null,bodyStart=null,bodyEnd=null,insert=0,afterPage=false;
  const flush=()=>{if(current===id)ranges.push({start:bodyStart??insert,end:bodyEnd??insert,empty:bodyStart===null});current=null;};
  const rows=/[^\r\n]*(?:\r\n|\r|\n|$)/g;let row;
  while((row=rows.exec(text))&&row[0]){
   const raw=row[0].replace(/(?:\r\n|\r|\n)$/,''),line=normalized(raw.replace(/\s+$/,'')),m=mark(line);
   if(m){flush();current=m[1];bodyStart=bodyEnd=null;insert=rows.lastIndex;afterPage=/^-/.test(line);continue;}
   if(structure(line)){flush();continue;}
   if(!current)continue;
   if(afterPage&&bodyStart===null&&/^\(조건:.*\)$/.test(line.trim())){insert=rows.lastIndex;continue;}
   if(line.trim()){if(bodyStart===null)bodyStart=row.index;bodyEnd=row.index+raw.length;afterPage=false;}
  }
  flush();if(ranges.length!==1)throw Error(ranges.length?'같은 페이지 번호가 중복되었습니다.':'수정할 페이지 번호를 찾지 못했습니다.');
  const r=ranges[0],eol=(text.match(/\r\n|\r|\n/)||['\n'])[0],body=replacement.replace(/\r\n?|\n/g,eol);
  const separator=r.empty&&body&&r.start>0&&!/[\r\n]/.test(text[r.start-1])?eol:'';
  return text.slice(0,r.start)+separator+body+(r.empty&&body?eol:'')+text.slice(r.end);
 }
 function draw(document,host,changes,size){
  const results=[];
  for(const c of changes.filter(c=>!c.excluded)){
   const card=document.createElement('details'),label=document.createElement('summary'),view=document.createElement('div'),box=document.createElement('div');
   card.className='scriptLayoutCard';card.open=true;label.textContent=c.id+' · 화면 분량';view.className='scriptLayoutViewport';box.className='scriptLayoutText';
   view.style.width=(size.width+2)+'px';view.style.height=(size.height+2)+'px';box.style.width=size.width+'px';box.style.fontSize=size.font+'px';box.textContent=displayText(c.newPlain);view.append(box);card.append(label,view);host.append(card);
   const o=overflow(view);results.push({id:c.id,...o,width:view.scrollWidth,height:box.scrollHeight});label.textContent+=' · '+(o.horizontal||o.vertical?'넘침 경고':'텍스트 영역 내 표시')+' · '+box.scrollHeight+'px / '+size.height+'px';if(o.horizontal||o.vertical)label.className='warn';card.open=results.length===1;
  }
  return results;
 }
 return {dimensions,overflow,displayText,createGate,draw,replaceBlock};
});
/* JO9 MOD END SCRIPT_REVIEW_20261108 */
