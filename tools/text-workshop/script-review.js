/* JO9 MOD START SCRIPT_REVIEW_20261108 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.JO9ScriptReview=api;})(typeof window==='undefined'?this:window,function(){
 'use strict';
 const number=(v,fallback,min,max)=>Number.isFinite(Number(v))?Math.min(max,Math.max(min,Number(v))):fallback;
 function dimensions(v){return {width:number(v.width,720,320,1400),height:number(v.height,480,120,1000),font:number(v.font,18,12,36)};}
 function overflow(e){return {horizontal:e.scrollWidth>e.clientWidth+1,vertical:e.scrollHeight>e.clientHeight};}
 function displayText(s){return String(s).replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/^([^:\n]{1,40}):\s*/,'$1\n');}
 function createGate(){let version=0;return {begin:()=>++version,invalidate:()=>{version++;},current:v=>v===version};}
 // JO9 MOD SCRIPT_GAME_LAYOUT_20261110: native-size stage, measured after game fonts load.
 function gameOverflow(profile,content){return {horizontal:content.scrollWidth>profile.rect.width+1,vertical:content.scrollHeight>profile.visibleHeight};}
 async function loadGameFonts(document,layout){
  if(!layout||!document.fonts)return false;
  let style=document.getElementById('scriptGameFonts');if(!style){style=document.createElement('style');style.id='scriptGameFonts';document.head.append(style);}
  const profiles=Object.values(layout.profiles),unique=[...new Map(profiles.map(p=>[p.fontFamily,p])).values()];
  style.textContent=unique.map(p=>'@font-face{font-family:"'+p.fontFamily+'";src:url("'+p.fontUrl+'");font-style:normal;font-weight:normal;font-display:block}').join('\n');
  try{const loaded=await Promise.all(unique.map(p=>document.fonts.load(p.fontSize+'px "'+p.fontFamily+'"')));return loaded.every(fonts=>fonts.length>0);}catch{return false;}
 }
 function gameText(document,host,raw){
  const template=document.createElement('template');template.innerHTML=String(raw).replace(/<<([\s\S]*?)>>/g,'〈$1〉');
  const allowed=new Set(['B','I','U','EM','STRONG','BR','FONT','SPAN','P','DIV','SMALL','BIG','CENTER']);
  function copy(from,to){for(const child of from.childNodes){if(child.nodeType===3){to.append(document.createTextNode(child.textContent));continue;}if(child.nodeType!==1||/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED)$/.test(child.tagName))continue;if(child.tagName==='IMG'){to.append(document.createTextNode('[그림]'));continue;}let next=to;
   if(allowed.has(child.tagName)||child.tagName==='A'){next=document.createElement(child.tagName==='A'?'span':child.tagName.toLowerCase());if(child.tagName==='A')next.style.color='#0000ff';for(const property of ['color','fontSize','fontWeight','fontStyle','textDecoration','lineHeight','textAlign'])if(child.style[property])next.style[property]=child.style[property];if(child.tagName==='FONT'){for(const name of ['color','size'])if(child.hasAttribute(name))next.setAttribute(name,child.getAttribute(name));}to.append(next);}copy(child,next);
  }}copy(template.content,host);
 }
 function drawGame(document,host,changes,layout,mode){
  const profile=layout.profiles[mode],results=[];
  for(const c of changes.filter(c=>!c.excluded)){
   const card=document.createElement('details'),label=document.createElement('summary'),scroller=document.createElement('div'),stage=document.createElement('div'),frame=document.createElement('img'),box=document.createElement('div'),content=document.createElement('div');
   card.className='scriptLayoutCard';card.open=true;scroller.className='scriptGameScroll';stage.className='scriptGameStage';stage.style.width=layout.canvas.width+'px';stage.style.height=layout.canvas.height+'px';stage.dataset.layout=mode;frame.className='scriptGameFrame';frame.src=layout.frameUrl;frame.alt='현재 WORK 게임 UI';stage.append(frame);
   if(profile.paperUrl){const paper=document.createElement('img');paper.className='scriptGamePaper';paper.src=profile.paperUrl;paper.alt='게임 종이 배경';stage.append(paper);}
   else{const image=document.createElement('div');image.className='scriptGameImageGuide';image.textContent='장면 이미지 영역 · 795×595px';stage.append(image);}
   box.className='scriptGameText';Object.assign(box.style,{left:profile.rect.left+'px',top:profile.rect.top+'px',width:profile.rect.width+'px',height:profile.rect.height+'px',fontFamily:'"'+profile.fontFamily+'"',fontSize:profile.fontSize+'px',lineHeight:profile.lineHeight,color:profile.color});
   content.className='scriptGameContent';const raw=c.previewText??displayText(c.newPlain).replace(/\n/g,'<br>');gameText(document,content,mode==='dialogue'?raw.replace(/^(?:\s|&nbsp;|<br\s*\/?>)+/i,''):raw);box.append(content);stage.append(box);scroller.append(stage);card.append(label,scroller);host.append(card);
   const o=gameOverflow(profile,content),measured=content.scrollHeight;results.push({id:c.id,...o,width:content.scrollWidth,height:measured});label.textContent=c.id+' · 실제 게임 UI 1:1 · '+profile.name+' · '+profile.rect.width+'×'+profile.rect.height+'px · '+(o.horizontal||o.vertical?'넘침 경고':'텍스트 영역 내 표시')+' · '+measured+'px / '+profile.visibleHeight+'px';if(o.horizontal||o.vertical)label.className='warn';card.open=results.length===1;
  }return results;
 }
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
 function draw(document,host,changes,size,layout,mode='dialogue'){
  if(layout?.profiles?.[mode])return drawGame(document,host,changes,layout,mode);
  const results=[];
  for(const c of changes.filter(c=>!c.excluded)){
   const card=document.createElement('details'),label=document.createElement('summary'),view=document.createElement('div'),box=document.createElement('div');
   card.className='scriptLayoutCard';card.open=true;label.textContent=c.id+' · 화면 분량';view.className='scriptLayoutViewport';box.className='scriptLayoutText';
   view.style.width=(size.width+2)+'px';view.style.height=(size.height+2)+'px';box.style.width=size.width+'px';box.style.fontSize=size.font+'px';box.textContent=displayText(c.newPlain);view.append(box);card.append(label,view);host.append(card);
   const o=overflow(view);results.push({id:c.id,...o,width:view.scrollWidth,height:box.scrollHeight});label.textContent+=' · '+(o.horizontal||o.vertical?'넘침 경고':'텍스트 영역 내 표시')+' · '+box.scrollHeight+'px / '+size.height+'px';if(o.horizontal||o.vertical)label.className='warn';card.open=results.length===1;
  }
  return results;
 }
 return {dimensions,overflow,displayText,createGate,draw,replaceBlock,gameOverflow,loadGameFonts};
});
/* JO9 MOD END SCRIPT_REVIEW_20261108 */
