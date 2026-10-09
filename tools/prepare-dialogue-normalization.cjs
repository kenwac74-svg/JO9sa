// 현재 플레이 QSP에서 표시 대사만 정리한 후보와 선언형 모드·검증 보고서를 만든다.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {normalize,tokens,minorContext}=require('./dialogue-normalization.cjs');
const arg=n=>{const i=process.argv.indexOf(n);return i<0?undefined:process.argv[i+1];};
const repo=path.resolve(arg('--repo')||path.join(__dirname,'..'));
const core=require(path.join(repo,'tools/text-workshop/core.cjs'));
const input=arg('--input');if(!input)throw Error('Pass --input <play-game/jack.qsp>. This tool only prepares a candidate.');
const out=path.resolve(arg('--out')||'dialogue-format-candidate');fs.mkdirSync(out,{recursive:true});
const before=fs.readFileSync(input),doc=core.parse(before);assert(core.serialize(doc).equals(before));
const exceptions=JSON.parse(fs.readFileSync(path.join(__dirname,'dialogue-normalization-exceptions.json'),'utf8'));
const restrictedText=JSON.parse(fs.readFileSync(path.join(__dirname,'dialogue-normalization-restricted.json'),'utf8'));
const fingerprint=text=>crypto.createHash('sha256').update(text.replace(/<br\s*\/?\s*>/gi,'').replace(/&nbsp;|&#(?:160|x0*a0);/gi,'').replace(/[\s\u00a0-]+/gu,''),'utf8').digest('hex');
const keeps=new Set(exceptions.keepPronouns),verses=new Set(exceptions.keepLines);
const restrictedFingerprints=new Set(restrictedText.restricted);
const afterDoc={...doc,lines:doc.lines.slice()},changes=[],edits=[],skips=[];
const total={dashes:0,headers:0,whitespace:0,pronouns:0,retainedPronouns:0};
function count(s,needle){let n=0,at=0;while((at=s.indexOf(needle,at))>=0){n++;at+=needle.length;}return n;}
function skeleton(s){const parts=[];let at=0;for(const l of core.literals(s)){parts.push(s.slice(at,l.start));at=l.end;}parts.push(s.slice(at));return parts.join('');}
function ageLines(body){
 const parts=[];let at=0;for(const l of core.literals(body,true)){parts.push(body.slice(at,l.start),body.slice(l.start,l.end).replace(/[^\r\n]/g,' '));at=l.end;}parts.push(body.slice(at));const code=parts.join('');
 const rows=code.split('\n'),stack=[],unsafe=new Set();
 for(let i=0;i<rows.length;i++){
  const line=rows[i].trim(),age=/\bloli\b|loli_age|_loli_|\bno_loli\b|(?:slave|assistant|master)_age\b/i.test(line);
  if(/^\s*(?:elseif|else)\b/i.test(line)&&stack.length&&age)stack[stack.length-1].age=true;
  if(age||stack.some(x=>x.age))unsafe.add(i+1);
  if(/^(?:if|act|loop|for|while)\b[\s\S]*:\s*$/i.test(line))stack.push({age});
  if(/^end\s*(?:&|$)/i.test(line))stack.pop();
 }
 return unsafe;
}
for(const loc of doc.locations){
 for(const field of ['desc','body']){
  const index=loc[field],oldField=core.shift(doc.lines[index],5),restricted=field==='body'?ageLines(oldField):new Set();
  const es=field==='body'?core.literals(oldField).map(e=>({...e,field,location:loc.name,fieldIndex:index})):oldField.trim()?[{start:0,end:oldField.length,text:oldField,line:1,quote:'',field,location:loc.name,fieldIndex:index}]:[];
  const forbidden=es.filter(e=>restricted.has(e.line)||restrictedFingerprints.has(fingerprint(e.text))||minorContext(e.text)).map(e=>({start:e.start,end:e.end}));
  const replacements=[];
  for(const e of es){
   if(!core.isDialogue(e)||!/[가-힣]/u.test(e.text))continue;
   const lineStart=oldField.lastIndexOf('\n',e.start-1)+1,assignment=oldField.slice(lineStart,e.start),lineEnd=oldField.indexOf('\n',e.end);
   const fullLine=oldField.slice(lineStart,lineEnd<0?oldField.length:lineEnd);
   const digest=fingerprint(e.text),meta={location:loc.name,line:e.line,restricted:restricted.has(e.line)||restrictedFingerprints.has(digest)||forbidden.some(f=>f.start<(lineEnd<0?oldField.length:lineEnd)&&f.end>lineStart),assignment,
    letter:/\bmsg\s*$/i.test(assignment),keepPronouns:/^#txt_2_/.test(loc.name)||keeps.has(digest),preserveLines:verses.has(digest)};
   if(minorContext(fullLine,meta)){skips.push({location:loc.name,line:e.line,reason:'restricted-context'});continue;}
   let result;
   try{result=normalize(e.text,meta);}catch(error){skips.push({location:loc.name,line:e.line,reason:'opaque-markup'});continue;}
   if(result.skipped){skips.push({location:loc.name,line:e.line,reason:result.skipped});continue;}
   if(result.text===e.text)continue;
   assert.equal(normalize(result.text,meta).text,result.text,'Normalization must be idempotent: '+loc.name+':'+e.line);
   assert.deepEqual(tokens(result.text).parts.filter(x=>!x.br).map(x=>x.raw),tokens(e.text).parts.filter(x=>!x.br).map(x=>x.raw),'Protected HTML/expressions changed');
   // Existing unsupported markup is not repaired as part of a text-format pass.
   try{core.validateMarkup(result.text);}catch(error){skips.push({location:loc.name,line:e.line,reason:'existing-markup'});continue;}
   const encoded=e.quote?result.text.split(e.quote).join(e.quote+e.quote):result.text;
   replacements.push({...e,encoded,replacement:result.text,stats:result.stats,a:field==='body'?lineStart:0,b:field==='body'?(lineEnd<0?oldField.length:lineEnd):oldField.length});
  }
  if(!replacements.length)continue;
  // Group literals on the same physical source line. Full statements keep older mods supersession-readable.
  const chunks=[];
  for(const r of replacements){let c=chunks[chunks.length-1];if(c&&r.a<=c.b){c.b=Math.max(c.b,r.b);c.items.push(r);}else chunks.push({a:r.a,b:r.b,items:[r]});}
  let expected=oldField;
  for(const r of replacements.slice().reverse())expected=expected.slice(0,r.start)+r.encoded+expected.slice(r.end);
  for(const c of chunks){c.old=oldField.slice(c.a,c.b);c.new=c.old;for(const r of c.items.slice().reverse())c.new=c.new.slice(0,r.start-c.a)+r.encoded+c.new.slice(r.end-c.a);}
  // Match both original and final text uniquely. Different old spacing can converge
  // to identical new statements, so original-only uniqueness is insufficient for replay.
  const mapped=p=>p+replacements.filter(r=>r.end<=p).reduce((n,r)=>n+r.encoded.length-(r.end-r.start),0);
  let ranges=chunks.map(c=>({a:c.a,b:c.b}));
  for(let pass=0;;pass++){
   if(pass>30)throw Error('Patch context did not stabilize in '+loc.name);
   for(const c of ranges){c.old=oldField.slice(c.a,c.b);c.new=expected.slice(mapped(c.a),mapped(c.b));}
   let expanded=false;
   for(const c of ranges){
    const identical=ranges.filter(x=>x.old===c.old&&x.new===c.new).length;
    if(count(oldField,c.old)===identical&&count(expected,c.new)===identical)continue;
    if(c.a===0&&c.b===oldField.length)throw Error('Unmatchable patch in '+loc.name);
    const prev=c.a===0?0:oldField.lastIndexOf('\n',c.a-2)+1,next=oldField.indexOf('\n',c.b+1),following=next<0?oldField.length:next;
    const options=[{a:c.a,b:following},{a:prev,b:c.b},{a:prev,b:following}].filter(x=>(x.a!==c.a||x.b!==c.b)&&x.b-x.a<=16000&&!minorContext(oldField.slice(x.a,x.b))&&!forbidden.some(f=>f.start<x.b&&f.end>x.a));
    const choice=options.find(x=>count(oldField,oldField.slice(x.a,x.b))===1&&count(expected,expected.slice(mapped(x.a),mapped(x.b)))===1)||options[0];
    if(!choice)throw Error('Patch context unavailable in '+loc.name+':'+c.a);c.a=choice.a;c.b=choice.b;
    expanded=true;
   }
   if(!expanded)break;
   const merged=[];for(const c of ranges.sort((a,b)=>a.a-b.a)){const last=merged[merged.length-1];if(last&&c.a<=last.b)last.b=Math.max(last.b,c.b);else merged.push({a:c.a,b:c.b});}ranges=merged;
  }
  let current=oldField;const pending=ranges.slice();
  while(pending.length){const c=pending.pop(),same=pending.filter(x=>x.old===c.old&&x.new===c.new),n=same.length+1;
   assert.equal(count(current,c.old),n);edits.push({location:loc.name,field,old:c.old,new:c.new,count:n});current=current.split(c.old).join(c.new);for(const x of same)pending.splice(pending.indexOf(x),1);
  }
  assert.equal(current,expected,'Declared edits exceeded requested literal changes');
  if(field==='body'){
   assert.equal(skeleton(current),skeleton(oldField),'Executable QSP code changed');
   const a=core.literals(current),b=core.literals(oldField);assert.equal(a.length,b.length,'QSP string boundaries changed');
   a.forEach((x,i)=>assert.equal(x.quote,b[i].quote));
  }
  afterDoc.lines[index]=core.shift(current,-5);
  for(const r of replacements){changes.push({location:loc.name,field,line:r.line,...r.stats});for(const k in total)total[k]+=r.stats[k];}
 }
}
const after=core.serialize(afterDoc),checked=core.parse(after);assert(core.serialize(checked).equals(after));assert.equal(checked.locations.length,doc.locations.length);
assert.deepEqual(checked.locations.map(x=>x.name),doc.locations.map(x=>x.name));
const mod={id:'2026-10-09_dialogue_format_and_protagonist',description:'표시 대사 머리 대시 제거, NPC 줄맞춤 통일, 주인공 호칭 정리. 타인 지칭·코드·치환문·의도 문단 보존.',target:'game\\jack.qsp',before_sha256:core.hash(before).toUpperCase(),after_sha256:core.hash(after).toUpperCase(),edits};
const report={before:mod.before_sha256,after:mod.after_sha256,locations:doc.locations.length,changedLocations:[...new Set(changes.map(x=>x.location))],changedStrings:changes.length,editCount:edits.length,stats:total,skips:skips.reduce((a,x)=>(a[x.reason]=(a[x.reason]||0)+1,a),{}),checks:{byteRoundtrip:true,locationOrderUnchanged:true,executableCodeUnchanged:true,stringBoundariesUnchanged:true,protectedHtmlAndInterpolationUnchanged:true,idempotent:true},changes};
fs.writeFileSync(path.join(out,'jack.qsp'),after);fs.writeFileSync(path.join(out,'2026-10-09_dialogue_format_and_protagonist.json'),JSON.stringify(mod,null,2)+'\n');fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(out,'skipped.json'),JSON.stringify(skips,null,2)+'\n');
console.log(JSON.stringify({...report,changes:undefined},null,2));
