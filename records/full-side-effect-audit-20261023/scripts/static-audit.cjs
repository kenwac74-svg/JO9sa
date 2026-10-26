'use strict';
// Read-only inventory. Does not compile, execute, normalize, or write product files.
const fs=require('node:fs'),path=require('node:path');
const repo='G:/somi/JO9sa';
const core=require(repo+'/tools/text-workshop/core.cjs');
const syntax=require(repo+'/tools/check-image-cycle-syntax.cjs');
const preformat=require(repo+'/tools/qa/qsp-preformat.cjs');
const {inspectWorld}=require(repo+'/tools/qa/release-check.cjs');
const callNames=new Set(['GS','GOSUB','GT','GOTO','XGT','XGOTO','FUNC','$FUNC']);
function scripts(raw){const d=core.parse(raw),out=[];for(const l of d.locations){out.push({location:l.name,field:'body',text:core.shift(d.lines[l.body],5)});const at=l.body-2,n=+core.shift(d.lines[at+3],5);for(let i=0;i<n;i++)out.push({location:l.name,field:'action:'+i,text:core.shift(d.lines[at+6+3*i],5)});}return{d,out};}
function lex(text){
 const tokens=[],errors=[],stack=[];let i=0,line=1,statementStart=true;
 const add=(kind,value,start,atLine,end=i)=>tokens.push({kind,value,start,end,line:atLine});
 while(i<text.length){let ch=text[i],start=i,atLine=line;
  if(/\s/.test(ch)){if(ch==='\n'){line++;statementStart=true;add('newline','\n',start,atLine,i+1);}i++;continue;}
  if(ch==='!'&&statementStart){let q='',braces=0;i++;while(i<text.length){ch=text[i];if(ch==='\n'){line++;i++;if(!q&&!braces)break;continue;}if(q){if(ch===q){if(text[i+1]===q){i+=2;continue;}q='';}}else if(ch==="'"||ch==='"')q=ch;else if(ch==='{')braces++;else if(ch==='}'&&braces)braces--;i++;}statementStart=true;continue;}
  if(ch==="'"||ch==='"'||ch==='{'){
   const brace=ch==='{',quote=brace?'':ch;let value='',closed=false,depth=brace?1:0,q='';i++;
   while(i<text.length){ch=text[i];if(ch==='\n')line++;
    if(!brace){if(ch===quote){if(text[i+1]===quote){value+=quote;i+=2;continue;}i++;closed=true;break;}value+=ch;i++;continue;}
    if(q){if(ch===q){if(text[i+1]===q){value+=ch+ch;i+=2;continue;}q='';}}
    else if(ch==="'"||ch==='"')q=ch;else if(ch==='{')depth++;else if(ch==='}'&&!--depth){i++;closed=true;break;}
    value+=ch;i++;
   }
   add(brace?'brace':'string',value,start,atLine);if(!closed)errors.push({code:'LEX_UNCLOSED_LITERAL',line:atLine,kind:brace?'brace':quote});statementStart=false;continue;
  }
  if(/[\p{L}_$]/u.test(ch)){i++;while(i<text.length&&/[\p{L}\p{N}_.$]/u.test(text[i]))i++;add('id',text.slice(start,i),start,atLine);statementStart=false;continue;}
  i++;add('punct',ch,start,atLine);if(ch==='('||ch==='[')stack.push({ch,line:atLine});else if(ch===')'||ch===']'){const prev=stack.pop();if(!prev||prev.ch!==(ch===')'?'(':'['))errors.push({code:'LEX_BRACKET_MISMATCH',line:atLine,found:ch,opened:prev||null});}statementStart=ch==='&'||ch===':';
 }
 for(const b of stack)errors.push({code:'LEX_UNCLOSED_BRACKET',line:b.line,bracket:b.ch});
 return{tokens,errors};
}
function scanCalls(tokens,context,names){const calls=[],dynamic=[];for(let i=0;i<tokens.length;i++){const t=tokens[i];if(t.kind!=='id')continue;const k=t.value.toUpperCase();if(!callNames.has(k))continue;let j=i+1;if(tokens[j]?.value==='(')j++;const v=tokens[j],after=tokens[j+1];const exact=v?.kind==='string'&&!/<<|>>/.test(v.value)&&(!after||['newline'].includes(after.kind)||[',',')','&',':'].includes(after.value));if(exact)calls.push({...context,line:t.line,command:k,target:v.value,exists:names.has(v.value.trim().toUpperCase())});else dynamic.push({...context,line:t.line,command:k,argumentKind:v?.kind||'missing'});}return{calls,dynamic};}
function redacted(text){const l=lex(text),replacements=l.tokens.filter(t=>t.kind==='string'||t.kind==='brace').reverse();for(const t of replacements)text=text.slice(0,t.start)+(t.kind==='brace'?'{CODE}':"'STR'")+text.slice(t.end);return text.slice(0,280);}
function audit(file){
 const raw=fs.readFileSync(file),{d,out}=scripts(raw),names=new Set(d.locations.map(l=>l.name.trim().toUpperCase()));
 const checks=[],calls=[],dynamic=[],embeddedCalls=[],bracketIssues=[],embeddedCandidates=[],syntaxDiagnostics=[],jumpCalls=[],labels=[],callbackAssignments=[],libraryCommands=[];let literals=0,braceLiterals=0,physicalLines=0,logicalLines=0;
 for(const s of out){
  const context={location:s.location,field:s.field},r=syntax.checkSyntax(s.text),p=preformat(s.text),l=lex(s.text),c=scanCalls(l.tokens,{...context,scope:'direct'},names);calls.push(...c.calls);dynamic.push(...c.dynamic);physicalLines+=r.physicalLines;logicalLines+=r.logicalLines;
  const grouped=syntax.joinContinuations(syntax.preprocess(s.text).lines);
  const labelNames=new Set();for(const row of grouped){if(!row.text.startsWith(':'))continue;const name=row.text.slice(1).trim();labels.push({...context,line:row.line,name,duplicate:labelNames.has(name.toUpperCase())});labelNames.add(name.toUpperCase());}
  for(const e of r.errors){const ix=grouped.findIndex(x=>x.line<=e.line&&x.endLine>=e.line);syntaxDiagnostics.push({...context,...e,context:grouped.slice(Math.max(0,ix-2),ix+2).map(x=>({line:x.line,endLine:x.endLine,code:redacted(x.text)}))});}
  bracketIssues.push(...l.errors.map(e=>({...context,...e})));
  for(let i=0;i<l.tokens.length;i++){
   const t=l.tokens[i];
   if(t.kind==='id'){
    const k=t.value.toUpperCase();
    if(k==='JUMP'){let j=i+1;if(l.tokens[j]?.value==='(')j++;const v=l.tokens[j],after=l.tokens[j+1],exact=v?.kind==='string'&&!/<<|>>/.test(v.value)&&(!after||after.kind==='newline'||[',',')','&',':'].includes(after.value));jumpCalls.push({...context,line:t.line,target:exact?v.value:null,dynamic:!exact,exists:exact?labelNames.has(v.value.trim().toUpperCase()):null});}
    if(/^\$(?:ONNEWLOC|ONGLOAD|ONACTSEL|ONOBJADD|ONOBJDEL|ONOBJSEL|COUNTER|USERCOM)$/.test(k)&&l.tokens[i+1]?.value==='='&&l.tokens[i+2]?.kind==='string'){const target=l.tokens[i+2].value;callbackAssignments.push({...context,line:t.line,callback:k,target,exists:!target||names.has(target.toUpperCase())});}
    if(['INCLIB','FREELIB','ADDQST'].includes(k))libraryCommands.push({...context,line:t.line,command:k,literalArgument:l.tokens[i+1]?.kind==='string'?l.tokens[i+1].value:null});
   }
   if(t.kind!=='string'&&t.kind!=='brace')continue;literals++;if(t.kind==='brace')braceLiterals++;
   // Inventory possible code held in literals separately. This is not a claim
   // that those strings are executable or reachable; generated concatenations
   // and interpolation can only be established by targeted runtime probes.
   const hasCode=t.kind==='brace'||/(?:^|[\r\n&:])[\t ]*(?:gs|gt|gosub|goto|xgt|xgoto|dynamic|if|act|for|killvar|local|\$[\p{L}_][\p{L}\p{N}_]*[\t ]*=)\b/iu.test(t.value);
   const exec=[...t.value.matchAll(/\bexec:([^"<>]*)/ig)].map(m=>m[1]);
   if(hasCode){const inner=lex(t.value),c=scanCalls(inner.tokens,{...context,scope:'embedded-candidate',literalLine:t.line},names);embeddedCalls.push(...c.calls);embeddedCandidates.push({...context,line:t.line,kind:t.kind,length:t.value.length,callCount:c.calls.length,lexicalIssueCount:inner.errors.length,syntax:syntax.checkSyntax(t.value,{normalizeEol:true}).errors.map(e=>({code:e.code,line:e.line}))});}
   for(const code of exec){const inner=lex(code),c=scanCalls(inner.tokens,{...context,scope:'exec-candidate',literalLine:t.line},names);embeddedCalls.push(...c.calls);}
  }
  checks.push({...context,characters:s.text.length,physicalLines:r.physicalLines,logicalLines:r.logicalLines,syntaxDiagnosticCount:r.errors.length,preformatQuote:p.quote||null,preformatBraceDepth:p.depth,lexicalIssues:l.errors.length,literalCalls:c.calls.length,dynamicCalls:c.dynamic.length});
 }
 let world;try{world={status:'PASS',...inspectWorld(raw)};}catch(e){world={status:'FAIL',error:e.message,issues:e.issues};}
 const result={schema:1,createdAt:new Date().toISOString(),file,sha256:core.hash(raw),bytes:raw.length,locations:d.locations.length,compiledActions:out.length-d.locations.length,scripts:out.length,physicalLines,logicalLines,literals,braceLiterals,world,checks,syntaxDiagnostics,bracketIssues,calls,dynamic,missingLiteralCalls:calls.filter(c=>!c.exists),labels,jumpCalls,callbackAssignments,libraryCommands,embeddedCandidates,embeddedCalls,missingEmbeddedCandidateCalls:embeddedCalls.filter(c=>!c.exists),limits:[
 'No whole-language compiler exists in these tools. Source-derived checks cover preprocessing/grouping and standalone multiline blocks only; expression grammar is not proved.',
 'LEX_BRACKET checks are an independent balanced-delimiter screen, not expression type checking.',
 'Direct literal call inventory excludes quoted text, comments and brace-quoted strings. Embedded candidates are reported separately and may be inactive or assembled at runtime.',
 'No arbitrary locations were run. Reachability, semantic side effects, save compatibility, branch behavior, rendered HTML and dynamically generated calls require focused engine or GUI tests.',
 'Top-level END and ELSE diagnostics need engine-semantic triage; static warnings alone are not runtime failures.'
 ]};
 return result;
}
if(require.main===module){const file=process.argv[2],output=process.argv[3];if(!file)throw Error('Usage: node static-audit.cjs FILE [OUTPUT.json]');const r=audit(file);if(output){fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(output,JSON.stringify(r,null,2)+'\n');}console.log(JSON.stringify({file:r.file,sha256:r.sha256,locations:r.locations,compiledActions:r.compiledActions,scripts:r.scripts,physicalLines:r.physicalLines,logicalLines:r.logicalLines,literals:r.literals,braceLiterals:r.braceLiterals,world:r.world,syntaxDiagnostics:r.syntaxDiagnostics.length,bracketIssues:r.bracketIssues.length,calls:r.calls.length,dynamic:r.dynamic.length,missingLiteralCalls:r.missingLiteralCalls.length,labels:r.labels.length,jumps:r.jumpCalls.length,missingJumps:r.jumpCalls.filter(x=>x.exists===false).length,callbacks:r.callbackAssignments.length,missingCallbacks:r.callbackAssignments.filter(x=>!x.exists).length,libraryCommands:r.libraryCommands,embeddedCandidates:r.embeddedCandidates.length,embeddedCalls:r.embeddedCalls.length,missingEmbeddedCandidateCalls:r.missingEmbeddedCandidateCalls.length},null,2));}
module.exports={audit,lex,scripts,scanCalls};
