'use strict';
const crypto = require('node:crypto');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
function shift(s, d) {
  const bytes=Buffer.from(s,'utf16le');
  for(let i=0;i<bytes.length;i+=2){const n=((bytes[i]|bytes[i+1]<<8)+d)&65535;bytes[i]=n&255;bytes[i+1]=n>>>8;}
  return bytes.toString('utf16le');
}
function parse(raw) {
  if (raw.length % 2) throw Error('QSP 파일의 바이트 수가 잘못되었습니다.');
  const text = raw.toString('utf16le');
  if (!Buffer.from(text, 'utf16le').equals(raw)) throw Error('원본을 그대로 읽고 쓰는 검사가 실패했습니다.');
  const lines = text.split('\r\n');
  if (lines[0] !== 'QSPGAME') throw Error('지원하는 QSPGAME 파일이 아닙니다.');
  function number(s) { const t = shift(s ?? '', 5); if (!/^\d+$/.test(t)) throw Error('QSP 구조가 잘못되었습니다.'); return Number(t); }
  const count = number(lines[3]); const locations = []; let at = 4;
  for (let i = 0; i < count; i++) {
    if (at + 3 >= lines.length) throw Error('QSP 데이터가 잘렸습니다.');
    const acts = number(lines[at + 3]);
    if (at + 4 + acts * 3 > lines.length - 1) throw Error('QSP 행동 데이터가 잘렸습니다.');
    locations.push({ index:i, name:shift(lines[at],5), desc:at+1, body:at+2 }); at += 4 + acts * 3;
  }
  if (at !== lines.length - 1 || lines[at] !== '') throw Error('QSP 구조를 끝까지 읽지 못했습니다.');
  return { lines, locations, hash:hash(raw) };
}
const serialize = doc => Buffer.from(doc.lines.join('\r\n'), 'utf16le');
function literals(body, includeComments=false) {
  const result = []; let i = 0, line=1, statementStart=0;
  while (i < body.length) {
    if (body[i] === '!' && !body.slice(statementStart,i).trim()) {
      // A QSP comment can contain a multiline quoted string. Its following
      // physical lines remain part of the comment until the string closes.
      const commentStart=i,commentLine=line;let q='', braces=0; i++;
      while(i<body.length){const ch=body[i];
        if(ch==='\n'){line++;i++;if(!q&&!braces)break;continue;}
        if(q){if(ch===q){if(body[i+1]===q){i+=2;continue;}q='';}}
        else if(ch==="'"||ch==='"')q=ch;
        else if(ch==='{')braces++;
        else if(ch==='}'&&braces)braces--;
        i++;
      }
      if(includeComments)result.push({start:commentStart+1,end:i-1,line:commentLine,comment:true});
      statementStart=i;continue;
    }
    const quote = body[i];
    if (quote !== "'" && quote !== '"') { if(body[i]==='\n')line++;if(/[\n&:]/.test(body[i]))statementStart=i+1;i++; continue; }
    const start = ++i, startLine=line; let value = ''; let closed = false;
    while (i < body.length) {
      if (body[i] === quote) {
        if (body[i+1] === quote) { value += quote; i += 2; continue; }
        closed = true; break;
      }
      if(body[i]==='\n')line++;value += body[i++];
    }
    if (!closed) break;
    result.push({ start, end:i, quote, text:value, line:startLine }); i++;
  }
  return result;
}
// 게임 화면에 보이는 대사인지(true) 코드·경로·변수 이름 같은 내부 문자열인지(false) 판정한다.
const CODE_START=/^\s*(?:gs|gt|xgt|gosub|goto|jump|if|elseif|else|end|dynamic|dyneval|func|killvar|killall|act|delact|cla|clr|cls|close|play|view|msg|wait|exec:|\$|\*p|\*pl|\*nl|set |let |local )/i;
function visibleText(s) {
  return s.replace(/<<[\s\S]*?>>/g,'X').replace(/<[^>]*>/g,' ').replace(/&[a-z]+;|&#\d+;/gi,' ').replace(/\s+/g,' ').trim();
}
function isDialogue(e) {
  if (e.field==='desc') return true;
  const raw=e.text, t=visibleText(raw);
  if (!t || CODE_START.test(raw)) return false;
  if (/[가-힣]/.test(t)) return true;
  if (/^[\w.$\[\]\\\/:#%+-]+$/u.test(t)) return false;
  if (/\.(png|jpe?g|gif|webp|mp3|ogg|wav|css|js|json|qsp)\b/i.test(t)) return false;
  if (/[=;{}]|\b\w+\(|\]\s*=|\bthen\b/.test(t)) return false;
  if (/^[\p{L}\d_]+(?:\s*,\s*[\p{L}\d_]+)+$/u.test(t)) return false; // 'slave, assistant' 같은 인자 목록
  if (/^[a-z0-9 _-]+$/.test(t) && /[-_]/.test(t)) return false; // 'icon tooltip-right' 같은 CSS 클래스 목록
  return (t.match(/\p{L}{2,}/gu)||[]).length>=3; // 영어·러시아어 등 문장(세 단어 이상)
}
function entries(doc) {
  const out=[];
  for (const loc of doc.locations) {
    const desc=shift(doc.lines[loc.desc],5);
    if (desc.trim()) out.push({ location:loc.name, locationIndex:loc.index, field:'desc', fieldIndex:loc.desc, start:0,end:desc.length,quote:'',text:desc,line:1,dialogue:true });
    const body=shift(doc.lines[loc.body],5);
    for (const entry of literals(body)) { const e={ ...entry,location:loc.name,locationIndex:loc.index,field:'body',fieldIndex:loc.body }; e.dialogue=isDialogue(e); out.push(e); }
  }
  return out;
}
// 바뀐 문자열과 앞뒤 맥락을 필드 안에서 한 번만 나오는 최소 구간으로 잘라 mods(old/new/count 1)용 조각을 만든다.
function minimalEdit(oldField,newField,start,oldEnd,newEnd) {
  const delta=newEnd-oldEnd;
  for (let pad=0;;pad=pad?pad*2:16) {
    const a=Math.max(0,start-pad), b=Math.min(oldField.length,oldEnd+pad);
    const old=oldField.slice(a,b);
    let n=0,at=-1;while((at=oldField.indexOf(old,at+1))>=0&&n<2)n++;
    if (old && n===1 || (a===0&&b===oldField.length)) return { old, new:newField.slice(a,b+delta) };
  }
}
function protectedParts(s) {
  return s.match(/<<[\s\S]*?>>|<[^<>]*>|\$[A-Za-z_가-힣][\w가-힣]*|\{\{[\s\S]*?\}\}/g) || [];
}
// Edit strings as strings: valid interpolation/HTML changes are permitted.
// HTML may be a fragment whose opening/closing tags live in other strings.
function validateMarkup(s) {
  let plain='',at=0;
  while(at<s.length){
    if(!s.startsWith('<<',at)){plain+=s[at++];continue;}
    const start=at;at+=2;let quote='',closed=false,stack=[];
    const expressionStart=at;
    for(;at<s.length;at++){
      const ch=s[at];
      if(quote){if(ch===quote){if(s[at+1]===quote)at++;else quote='';}continue;}
      if(ch==='"'||ch==="'"){quote=ch;continue;}
      if(s.startsWith('>>',at)){
        if(!s.slice(expressionStart,at).trim())throw Error('빈 치환문 <<>>은 사용할 수 없습니다.');
        if(stack.length)throw Error('치환문 안의 괄호가 닫히지 않았습니다.');
        at+=2;closed=true;break;
      }
      if(ch==='('||ch==='[')stack.push(ch);
      else if(ch===')'||ch===']'){
        if(stack.pop()!==(ch===')'?'(':'['))throw Error('치환문 안의 괄호 짝이 맞지 않습니다.');
      }
    }
    if(!closed)throw Error('치환문 <<...>>이 닫히지 않았습니다 (문자 '+(start+1)+').');
    plain+=' ';
  }
  const tagStart=/<\/?[A-Za-z][A-Za-z0-9:_-]*(?=[\s/>]|$)/g;
  let m;
  while((m=tagStart.exec(plain))){
    let quote='',closed=false,i=tagStart.lastIndex;
    for(;i<plain.length;i++){
      const ch=plain[i];
      if(quote){if(ch===quote)quote='';}
      else if(ch==='"'||ch==="'")quote=ch;
      else if(ch==='>'){closed=true;break;}
      else if(ch==='<')break;
    }
    if(!closed)throw Error('HTML 태그의 > 또는 속성 따옴표가 닫히지 않았습니다.');
    tagStart.lastIndex=i+1;
  }
}
const displayMaps=new WeakMap();
function tokenMap(texts) {
  const map=new Map();
  for(const text of texts) for(const m of text.matchAll(/<<[\s\S]*?>>/g)) {
    const label=m[0].slice(2,-2).replace(/^\$/,'');
    if(!map.has(label))map.set(label,new Set());
    map.get(label).add(m[0]);
  }
  return map;
}
function restoreDisplayTokens(doc,text,original='') {
  if(!/〈[^〉\r\n]+〉/.test(text))return text;
  let map=displayMaps.get(doc);
  if(!map){map=tokenMap(entries(doc).map(e=>e.text));displayMaps.set(doc,map);}
  const local=tokenMap([original]);
  return text.split(/(<<[\s\S]*?>>)/).map(part=>part.startsWith('<<')?part:part.replace(/〈([^〉\r\n]+)〉/g,(shown,label)=>{
    const choices=local.get(label)||map.get(label);
    if(!choices)return shown;
    if(choices.size!==1)throw Error(`표시 이름 ${shown}에 대응하는 코드가 여러 개입니다. 원문의 <<…>> 코드를 복사해 주세요.`);
    return [...choices][0];
  })).join('');
}
function prepare(doc, selection, replacement) {
  if (typeof replacement !== 'string' || !replacement.trim()) throw Error('수정문을 넣어 주세요.');
  if (replacement.length > 1000000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(replacement)) throw Error('수정문에 지원하지 않는 제어문자가 있습니다.');
  replacement = replacement.replace(/\r\n?/g,'\n');
  if (selection.hash !== doc.hash) throw Error('검색 이후 QSP가 변경되었습니다. 다시 검색해 주세요.');
  const entry=entries(doc).find(e=>e.fieldIndex===selection.fieldIndex && e.start===selection.start && e.end===selection.end);
  if (!entry || entry.text !== selection.text) throw Error('선택한 원문 위치가 달라졌습니다. 다시 검색해 주세요.');
  replacement=restoreDisplayTokens(doc,replacement,entry.text);
  if (entry.text === replacement) throw Error('원문과 수정문이 같습니다.');
  validateMarkup(replacement);
  const oldField=shift(doc.lines[entry.fieldIndex],5);
  const encoded=entry.quote ? replacement.split(entry.quote).join(entry.quote+entry.quote) : replacement;
  const newField=oldField.slice(0,entry.start)+encoded+oldField.slice(entry.end);
  const changed={...doc,lines:doc.lines.slice()}; changed.lines[entry.fieldIndex]=shift(newField,-5);
  const raw=serialize(changed), checked=parse(raw);
  if (checked.locations.length!==doc.locations.length || checked.lines.some((s,i)=>i!==entry.fieldIndex && s!==doc.lines[i])) throw Error('수정 범위를 벗어난 변경이 감지되었습니다.');
  if (entry.quote) {
    const parsed=literals(newField).find(e=>e.start===entry.start);
    if (!parsed || parsed.text!==replacement) throw Error('수정문의 따옴표 검사가 실패했습니다.');
  }
  const piece=minimalEdit(oldField,newField,entry.start,entry.end,entry.start+encoded.length);
  return { raw,entry,replacement,oldField,newField,piece,after:hash(raw) };
}
module.exports={hash,shift,parse,serialize,literals,entries,prepare,protectedParts,validateMarkup,isDialogue,visibleText,minimalEdit,restoreDisplayTokens};
