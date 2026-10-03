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
function literals(body) {
  const result = []; let i = 0, line=1;
  while (i < body.length) {
    if (body[i] === '!') { const end = body.indexOf('\n', i); if(end>=0)line++;i = end < 0 ? body.length : end+1; continue; }
    const quote = body[i];
    if (quote !== "'" && quote !== '"') { if(body[i]==='\n')line++;i++; continue; }
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
function entries(doc) {
  const out=[];
  for (const loc of doc.locations) {
    const desc=shift(doc.lines[loc.desc],5);
    if (desc.trim()) out.push({ location:loc.name, locationIndex:loc.index, field:'desc', fieldIndex:loc.desc, start:0,end:desc.length,quote:'',text:desc,line:1 });
    const body=shift(doc.lines[loc.body],5);
    for (const entry of literals(body)) out.push({ ...entry,location:loc.name,locationIndex:loc.index,field:'body',fieldIndex:loc.body });
  }
  return out;
}
function protectedParts(s) {
  return s.match(/<<[\s\S]*?>>|<[^<>]*>|\$[A-Za-z_가-힣][\w가-힣]*|\{\{[\s\S]*?\}\}/g) || [];
}
function prepare(doc, selection, replacement) {
  if (typeof replacement !== 'string' || !replacement.trim()) throw Error('수정문을 넣어 주세요.');
  if (replacement.length > 1000000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(replacement)) throw Error('수정문에 지원하지 않는 제어문자가 있습니다.');
  replacement = replacement.replace(/\r\n?/g,'\n');
  if (selection.hash !== doc.hash) throw Error('검색 이후 QSP가 변경되었습니다. 다시 검색해 주세요.');
  const entry=entries(doc).find(e=>e.fieldIndex===selection.fieldIndex && e.start===selection.start && e.end===selection.end);
  if (!entry || entry.text !== selection.text) throw Error('선택한 원문 위치가 달라졌습니다. 다시 검색해 주세요.');
  if (entry.text === replacement) throw Error('원문과 수정문이 같습니다.');
  if (JSON.stringify(protectedParts(entry.text)) !== JSON.stringify(protectedParts(replacement))) throw Error('변수·치환문·HTML 태그가 원문과 다릅니다. 이 요소들은 순서까지 그대로 유지해 주세요.');
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
  return { raw,entry,replacement,oldField,newField,after:hash(raw) };
}
module.exports={hash,shift,parse,serialize,literals,entries,prepare,protectedParts};
