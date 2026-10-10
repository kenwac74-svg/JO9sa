// 화면 대사의 머리말·들여쓰기·주인공 호칭만 정리하고 HTML 속성·치환문은 보존한다.
'use strict';
const PRONOUN=/(?<![\p{L}\p{N}_])(?:너는|넌)(?![\p{L}\p{N}_])/gu;
const MARK=/[\uE000\uE002\uE004](\d+)[\uE001\uE003\uE005]/g;
const PLAYER=/^(?:당신|주인공|주인|<<\$master_name>>)$/;
const MINOR=/아동|미성년|로리|소아|초등|중학생|고등학생|유아|어린\s*(?:아이|소녀|소년|애)|\bloli\b|_loli_|loli_age|(?:1[0-7]|[1-9])\s*(?:살|세)(?![가-힣])/i;
function tokens(text){
 if(/[\uE000-\uE005]/.test(text))throw Error('Reserved markup token in source');
 const parts=[];let masked='',i=0;
 while(i<text.length){
  const start=i;let type='';
  if(text.startsWith('<<',i)){
   type='expression';i+=2;let quote='',depth=0,closed=false;
   for(;i<text.length;i++){
    const ch=text[i];
    if(quote){if(ch===quote){if(text[i+1]===quote)i++;else quote='';}continue;}
    if(ch==='"'||ch==="'"){quote=ch;continue;}
    if(text.startsWith('>>',i)&&depth===0){i+=2;closed=true;break;}
    if(ch==='('||ch==='[')depth++;else if(ch===')'||ch===']')depth--;
   }
   if(!closed)throw Error('Unclosed interpolation');
  }else if(text[i]==='<'&&/^<\/?[A-Za-z!]/.test(text.slice(i))){
   type='tag';i++;let quote='',closed=false;
   for(;i<text.length;i++){
    const ch=text[i];if(quote){if(ch===quote)quote='';}
    else if(ch==='"'||ch==="'")quote=ch;
    else if(ch==='>'){i++;closed=true;break;}
   }
   if(!closed)throw Error('Unclosed HTML tag');
  }
  if(!type){masked+=text[i++];continue;}
  const raw=text.slice(start,i),index=parts.length;
  const br=type==='tag'&&/^<br\s*\/?\s*>$/i.test(raw);
  const block=type==='tag'&&/^<\/?(?:div|p|li|h[1-6])\b/i.test(raw);
  parts.push({raw,type,br,block});masked+=(br?'\uE002':block?'\uE004':'\uE000')+index+(br?'\uE003':block?'\uE005':'\uE001');
 }
 return {masked,parts,unmask:s=>s.replace(MARK,(_,n)=>parts[Number(n)].raw)};
}
const BR='\\uE002\\d+\\uE003';
const TAG='[\\uE000\\uE004]\\d+[\\uE001\\uE005]';
const WS='(?:[ \\t\\r\\n\\u00a0]|&nbsp;|&#(?:160|x0*a0);)*';
function speakerHeaders(masked,unmask){
 const re=new RegExp('(?:^|[\\uE003\\uE005\\r\\n])'+WS+'(?:'+TAG+')*'+WS+'\\[([^\\]\\r\\n]{1,100})\\]','g');
 return [...masked.matchAll(re)].map(m=>({start:m.index,end:m.index+m[0].length,label:unmask(m[1]).trim()}));
}
function minorContext(text,meta={}){
 return !!meta.restricted || MINOR.test(text)||MINOR.test(meta.assignment||'');
}
function normalize(text,meta={}){
 const stats={dashes:0,headers:0,whitespace:0,pronouns:0,retainedPronouns:0};
 if(minorContext(text,meta))return {text,stats,skipped:'restricted-context'};
 const protect=tokens(text);
 // QSP renders physical line breaks and tabs in menu/status literals. They are UI,
 // even when their visible labels contain Korean, and must not be folded as prose.
 const layout=protect.parts.some(p=>p.type==='tag'&&
  (/^<(?:div|span)\b[^>]*\bid\s*=/i.test(p.raw)||/^<(?:table|tr|td|th|pre|textarea|script|style|select|button|input)\b/i.test(p.raw)))||
  /\$for_inter_screen_city\b/.test(meta.assignment||'');
 if(layout)return {text,stats,skipped:'ui-layout'};
 const headers=speakerHeaders(protect.masked,protect.unmask);
 // Bracketed battle/status labels are labels, not speech paragraphs.
 const onlyLabel=text.replace(/<<[\s\S]*?>>/g,'X').replace(/<[^>]*>/g,'').replace(/&nbsp;|&#(?:160|x0*a0);/gi,' ').trim();
 if(/^\[[^\]\r\n]+\]$/.test(onlyLabel))return {text,stats};
 const table=/<(?:table|tr|td|th|pre|textarea|script|style)\b/i.test(text);
 const verse=meta.preserveLines;
 if(verse)return {text,stats};
 const playerPresent=headers.some(h=>PLAYER.test(h.label));
 const ambiguousConversation=headers.length>1&&!playerPresent;
 const indirect=/(?:조수|노예|소녀|소년|상대)(?:에게|를)[\s\S]{0,180}(?:말한다|말했다|말하|묻는다|물었다)/.test(protect.unmask(protect.masked));
 const letter=!!meta.letter;
 const segments=[];let at=0;
 for(let j=0;j<=headers.length;j++){
  const end=j<headers.length?headers[j].start:protect.masked.length;
  const speaker=j>0?headers[j-1].label:'';
  const part=protect.masked.slice(at,end),retained=PLAYER.test(speaker)||ambiguousConversation||indirect||letter||meta.keepPronouns;
  const next=part.replace(PRONOUN,word=>{if(retained){stats.retainedPronouns++;return word;}stats.pronouns++;return '당신은';});
  segments.push(next);at=end;
 }
 let s=segments.join('');
 if(!table&&!verse){
  // Only remove speech/list markers at the beginning of a rendered line.
  const leadingDash=new RegExp('(^|[\\r\\n]|'+BR+'|\\uE004\\d+\\uE005)('+WS+'(?:(?:'+TAG+')'+WS+')*)-([ \\t]+|&nbsp;|&#160;|(?=[가-힣]))','g');
  s=s.replace(leadingDash,(_,start,gap)=>{stats.dashes++;return start+gap;});
  // Header-adjacent dash can occur without an existing line break.
  s=s.replace(/(\[[^\]\r\n]{1,100}\])[ \t]*-(?:[ \t]+|(?=[가-힣]))/g,(_,name)=>{stats.dashes++;return name+' ';});
  const fold=headers.length>0||/[\r\n\t]/.test(s);
  if(fold){
   // A new speaker is a meaningful line break, even in a physical multiline literal.
   s=s.replace(new RegExp('[ \\t]*[\\r\\n]+[ \\t]*(?=\\[[^\\]\\r\\n]{1,100}\\])','g'),'<br>');
   s=s.replace(/[ \t\u00a0]*(?:\r\n?|\n)[ \t\u00a0]*/g,()=>{stats.whitespace++;return ' ';});
   s=s.replace(/[ \t\u00a0]{2,}|\t/g,()=>{stats.whitespace++;return ' ';});
  }
  // Remove legacy spacing around speaker names and start exactly one line below them.
  const header=new RegExp('(^|'+BR+'|\\uE004\\d+\\uE005|<br>)('+WS+')((?:'+TAG+')*'+WS+'\\[[^\\]\\r\\n]{1,100}\\])'+WS+'(?:'+BR+WS+'|<br>'+WS+')*','g');
  s=s.replace(header,(match,prefix,padding,name)=>{
   const desired=prefix+name.replace(/^[ \t\r\n]+/,'')+'<br>&nbsp;';
   if(match!==desired)stats.headers++;return desired;
  });
  if(headers.length&&/^\s*(?:[\uE000\uE004]\d+[\uE001\uE005])*\s*\[/.test(s))s=s.trimEnd();
 }
 const out=protect.unmask(s);
 return {text:out,stats};
}
module.exports={normalize,tokens,minorContext,PRONOUN};
