'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const manualSourceHash="416abff6ec9cb637b9af4c088a179c38811aff98570f04ac7d50b42aae9a9d7d";
const definitions=[
  {
    "id": "ARGONSEL_NPC_ELISABET3_PREF3",
    "kind": "inline-tag",
    "variable": "$Elisabet_3_pref[3]",
    "bodyLineBefore": 4534,
    "tokenBefore": "",
    "tokenAfter": "<font color=\"#0000CD\"><b>",
    "selector": "before-final-unmatched-phrase",
    "consumers": [
      {
        "location": "interaction_city",
        "bodyLineBefore": 13648,
        "code": " copyarr '$text', '$Elisabet_3_pref'"
      }
    ]
  },
  {
    "id": "ARGONSEL_NPC_KAP_PREF4",
    "kind": "inline-tag",
    "variable": "$kap_pref[4]",
    "bodyLineBefore": 7395,
    "tokenBefore": "",
    "tokenAfter": "</b></font>",
    "selector": "before-period-after-unclosed-span",
    "consumers": [
      {
        "location": "interaction_city",
        "bodyLineBefore": 20400,
        "code": " copyarr '$text', '$kap_pref'"
      },
      {
        "location": "interaction_city",
        "bodyLineBefore": 20798,
        "code": " copyarr '$text', '$kap_pref'"
      }
    ]
  },
  {
    "id": "ARGONSEL_NPC_KAP_PREF7",
    "kind": "inline-tag",
    "variable": "$kap_pref[7]",
    "bodyLineBefore": 7398,
    "tokenBefore": "",
    "tokenAfter": "</b></font>",
    "selector": "before-literal-end",
    "consumers": [
      {
        "location": "interaction_city",
        "bodyLineBefore": 20400,
        "code": " copyarr '$text', '$kap_pref'"
      },
      {
        "location": "interaction_city",
        "bodyLineBefore": 20798,
        "code": " copyarr '$text', '$kap_pref'"
      }
    ]
  },
  {
    "id": "ARGONSEL_NPC_STATUS_VOLAND",
    "kind": "status-artifact",
    "variable": "$npc_status['Voland']",
    "bodyLineBefore": 4292,
    "tokenBefore": " (true)",
    "tokenAfter": "",
    "selector": "trailing-status-artifact",
    "consumers": [
      {
        "location": "interaction_screen_city",
        "bodyLineBefore": 101,
        "token": "<<$npc_status[$npc_id]>>"
      },
      {
        "location": "interaction_screen_city",
        "bodyLineBefore": 125,
        "token": "<<$npc_status[$npc_id]>>"
      }
    ]
  },
  {
    "id": "ARGONSEL_NPC_STATUS_VARVAR",
    "kind": "status-artifact",
    "variable": "$npc_status['Varvar']",
    "bodyLineBefore": 4328,
    "tokenBefore": " (true)",
    "tokenAfter": "",
    "selector": "trailing-status-artifact",
    "consumers": [
      {
        "location": "interaction_screen_city",
        "bodyLineBefore": 101,
        "token": "<<$npc_status[$npc_id]>>"
      },
      {
        "location": "interaction_screen_city",
        "bodyLineBefore": 125,
        "token": "<<$npc_status[$npc_id]>>"
      }
    ]
  }
];
function findAssignment(body,variable){
 const hits=body.split(/\r?\n/).map((line,i)=>({line,bodyLine:i+1})).filter(x=>x.line.trimStart().startsWith(variable+' ='));
 assert.equal(hits.length,1,'Expected exactly one assignment: '+variable);return hits[0];
}
function valueOfLine(line){const entries=core.literals(line);assert.ok(entries.length>0);return entries.at(-1).text;}
function inlineState(text){
 const stack=[],issues=[];
 const source=text.replace(/<<[\s\S]*?>>/g,'');
 for(const match of source.matchAll(/<(\/?)(b|font)\b[^<>]*>/gi)){
  const name=match[2].toLowerCase();
  if(!match[1])stack.push(name);
  else if(stack.at(-1)===name)stack.pop();
  else issues.push({offset:match.index,token:match[0],expected:stack.at(-1)||null});
 }
 return {balanced:issues.length===0&&stack.length===0,issues,unclosed:stack};
}
function stripMarkup(text){return text.replace(/<<[\s\S]*?>>/g,'\u0001$&\u0001').replace(/<[^<>]*>/g,'');}
function displayInterpolations(text){return text.match(/<<[\s\S]*?>>/g)||[];}
function countLiteral(text,token){return token?text.split(token).length-1:0;}
function plannedChange(definition,oldLine){
 assert.ok(oldLine.trimStart().startsWith(definition.variable+' ='));
 let tokenOffset;
 if(definition.selector==='last-br'){assert.equal(countLiteral(oldLine,'<br>'),2);tokenOffset=oldLine.lastIndexOf('<br>');}
 else if(definition.selector==='before-final-unmatched-phrase'){const phrase='젊고, 강인한';assert.equal(countLiteral(oldLine,phrase),1);tokenOffset=oldLine.indexOf(phrase);}
 else if(definition.selector==='before-period-after-unclosed-span'){const phrase='만족시킬 수 있게';assert.equal(countLiteral(oldLine,phrase),1);tokenOffset=oldLine.indexOf(phrase)+phrase.length;assert.ok(oldLine.startsWith('. <font',tokenOffset));}
 else if(definition.selector==='before-literal-end'){assert.ok(oldLine.endsWith("'"));tokenOffset=oldLine.length-1;}
 else if(definition.selector==='trailing-status-artifact'){assert.ok(oldLine.endsWith(" (true)'"));assert.equal(countLiteral(oldLine,' (true)'),1);tokenOffset=oldLine.length-1-definition.tokenBefore.length;}
 else throw Error('Unknown selector');
 assert.equal(oldLine.slice(tokenOffset,tokenOffset+definition.tokenBefore.length),definition.tokenBefore);
 return {tokenOffset,newLine:oldLine.slice(0,tokenOffset)+definition.tokenAfter+oldLine.slice(tokenOffset+definition.tokenBefore.length)};
}
function validateManualEntry(entry){
 assert.equal(entry.id,'ARGONSEL_NPC_BISHOP_MANUAL_PLACEHOLDER');assert.equal(entry.kind,'manual-placeholder');assert.equal(entry.location,'#npc_base');assert.equal(entry.variable,'$bishop_shaitana_pref[2]');
 assert.equal(entry.originalAssignmentSha256,manualSourceHash);assert.ok(!Object.hasOwn(entry,'oldLine'),'The specification retains only the original hash');assert.equal(entry.oldLineRetained,false);
 const expectedValue='[주교 샤이타나]<br>수동편집</div>',expectedLine=entry.variable+" = '"+expectedValue+"'";assert.equal(entry.newValue,expectedValue);assert.equal(entry.newLine,expectedLine);assert.equal(valueOfLine(entry.newLine),expectedValue);
 core.validateMarkup(expectedValue);assert.deepEqual(displayInterpolations(expectedValue),[]);assert.equal(inlineState(expectedValue).balanced,true);
 return {id:entry.id,variable:entry.variable,exactNeutralPlaceholder:true,oldLineRetained:false,originalAssignmentSha256:entry.originalAssignmentSha256,speakerPrefixPreserved:true,trailingWrapperPreserved:true,interpolationsPreserved:true,inlineAfter:inlineState(expectedValue)};
}
function validateEntry(entry){
 if(entry.kind==='manual-placeholder')return validateManualEntry(entry);
 const definition=definitions.find(x=>x.id===entry.id);assert.ok(definition,'Unknown format candidate ID');for(const key of ['kind','variable','tokenBefore','tokenAfter'])assert.equal(entry[key],definition[key],entry.id+' '+key);assert.equal(entry.location,'#npc_base');
 const planned=plannedChange(definition,entry.oldLine);assert.equal(entry.tokenOffset,planned.tokenOffset);assert.equal(entry.newLine,planned.newLine,'Only approved token splice is allowed');const oldValue=valueOfLine(entry.oldLine),newValue=valueOfLine(entry.newLine);core.validateMarkup(newValue);assert.deepEqual(displayInterpolations(newValue),displayInterpolations(oldValue));
 if(entry.kind==='inline-tag'){assert.equal(stripMarkup(newValue),stripMarkup(oldValue),'Visible prose changed');assert.equal(inlineState(newValue).balanced,true,'Ordered b/font stack must be balanced');assert.equal(inlineState(oldValue).balanced,false,'Baseline defect no longer matches expected failure');}
 else{assert.equal(newValue,oldValue.slice(0,-' (true)'.length));assert.ok(!newValue.includes('(true)'));assert.equal(inlineState(newValue).balanced,true);}
 const oldDiv=oldValue.match(/<\/?div\b[^<>]*>/gi)||[],newDiv=newValue.match(/<\/?div\b[^<>]*>/gi)||[];assert.deepEqual(newDiv,oldDiv,'Shared div fragments must remain byte identical');assert.equal(entry.oldLine.slice(0,entry.tokenOffset),entry.newLine.slice(0,entry.tokenOffset));assert.equal(entry.oldLine.slice(entry.tokenOffset+entry.tokenBefore.length),entry.newLine.slice(entry.tokenOffset+entry.tokenAfter.length));
 return {id:entry.id,variable:entry.variable,onlyApprovedTokenChanged:true,prosePreserved:true,interpolationsPreserved:true,divTokensPreserved:true,inlineBefore:inlineState(oldValue),inlineAfter:inlineState(newValue),statusArtifactRemoved:entry.kind==='status-artifact'};
}
function validateManualBaseline(entry,line){
 validateManualEntry(entry);const hash=core.hash(Buffer.from(line,'utf8'));assert.equal(hash,entry.originalAssignmentSha256,'Manual-placeholder original assignment hash mismatch');const oldValue=valueOfLine(line);assert.ok(oldValue.startsWith(entry.preserve.speakerPrefix));assert.ok(oldValue.endsWith(entry.preserve.trailingWrapper));assert.deepEqual(displayInterpolations(oldValue),[]);
 return {id:entry.id,originalAssignmentSha256:hash,originalAnchorVerified:true,hashEncoding:'UTF-8 exact assignment line without CRLF/LF'};
}
function checkDisplayLine(entry,line){
 const value=valueOfLine(line);core.validateMarkup(value);if(entry.kind==='manual-placeholder')assert.equal(value,'[주교 샤이타나]<br>수동편집</div>','Manual placeholder must equal the exact requested neutral value');else if(entry.kind==='inline-tag')assert.equal(inlineState(value).balanced,true,'Ordered b/font stack is invalid');else assert.ok(!value.includes('(true)'),'Literal status artifact remains');return {id:entry.id,pass:true,kind:entry.kind};
}
function validateDocument(doc,spec,mode){
 assert.equal(doc.locations.length,spec.baselineLocationCount);const loc=doc.locations.find(x=>x.name==='#npc_base');assert.ok(loc);const body=core.shift(doc.lines[loc.body],5),results=[];
 for(const entry of spec.candidates){const current=findAssignment(body,entry.variable);if(mode==='baseline'&&entry.kind==='manual-placeholder')validateManualBaseline(entry,current.line);else assert.equal(current.line,mode==='baseline'?entry.oldLine:entry.newLine,entry.id+' assignment mismatch');results.push({id:entry.id,bodyLine:current.bodyLine,pass:true});}return results;
}
function selfTests(spec){
 const results=[];function pass(name,fn){fn();results.push({name,pass:true});}function rejects(name,fn){assert.throws(fn);results.push({name,pass:true});}
 const first=spec.candidates.find(x=>x.kind==='inline-tag'),elisabet=spec.candidates.find(x=>x.id==='ARGONSEL_NPC_ELISABET3_PREF3'),manual=spec.candidates.find(x=>x.kind==='manual-placeholder');assert.ok(first&&elisabet&&manual);
 pass('nested b/font accepted',()=>assert.equal(inlineState('<font color="#008080"><b>x</b></font>').balanced,true));pass('equal tag counts cannot hide crossing nesting',()=>assert.equal(inlineState('<b><font color="#008080">x</b></font>').balanced,false));pass('missing close rejected by ordered stack',()=>assert.equal(inlineState('<font color="#008080"><b>x</b>').balanced,false));
 rejects('unchanged broken original rejected',()=>validateEntry({...first,newLine:first.oldLine}));rejects('additional prose edit rejected',()=>validateEntry({...first,newLine:first.newLine.slice(0,-1)+'x'+first.newLine.slice(-1)}));rejects('additional closing div rejected',()=>validateEntry({...first,newLine:first.newLine.slice(0,-1)+'</div>'+first.newLine.slice(-1)}));rejects('unapproved color edit rejected',()=>validateEntry({...elisabet,newLine:elisabet.newLine.replace('#0000CD','#0000CE')}));
 rejects('source key typo rejected',()=>{const e=spec.candidates.find(x=>x.id==='ARGONSEL_NPC_STATUS_VARVAR');validateEntry({...e,variable:"$npc_status['Barbarian']"});});rejects('status artifact left in value rejected',()=>{const e=spec.candidates.find(x=>x.kind==='status-artifact');validateEntry({...e,newLine:e.oldLine});});
 rejects('manual source hash mismatch rejected',()=>validateManualEntry({...manual,originalAssignmentSha256:'0'.repeat(64)}));rejects('manual placeholder extra text rejected',()=>validateManualEntry({...manual,newLine:manual.newLine.slice(0,-1)+'x'+manual.newLine.slice(-1)}));rejects('manual placeholder wrong variable rejected',()=>validateManualEntry({...manual,variable:'$bishop_shaitana_pref[3]'}));return results;
}
function main(){
 const args=process.argv.slice(2),mode=args[0]||'--plan';assert.ok(mode==='--plan'||mode==='--candidate','Use --plan [baselineQsp] [report.json] or --candidate candidateQsp [report.json]');const spec=JSON.parse(fs.readFileSync(path.join(__dirname,'npc-format-candidates.json'),'utf8'));
 assert.equal(spec.baselineSha256,'a2e0265881bebd8a72b3fcbb214ddaf831106cfe50e9c96da8e0b6e7d692707a');assert.equal(spec.candidates.length,6);assert.equal(new Set(spec.candidates.map(x=>x.id)).size,6);assert.equal(spec.candidates.filter(x=>x.kind==='manual-placeholder').length,1);assert.ok(!Object.hasOwn(spec,'excludedReferences'));
 const results=spec.candidates.map(validateEntry),file=args[1]||spec.baselineQsp,raw=fs.readFileSync(file),doc=core.parse(raw);assert.ok(core.serialize(doc).equals(raw));const actual=validateDocument(doc,spec,mode==='--plan'?'baseline':'candidate'),tests=selfTests(spec),baselineFailureChecks=[],manualAnchorChecks=[];let positiveDisplayChecks=[];
 const loc=doc.locations.find(x=>x.name==='#npc_base'),body=core.shift(doc.lines[loc.body],5);
 if(mode==='--plan'){
  assert.equal(doc.hash,spec.baselineSha256);let revised=body;
  for(const entry of spec.candidates){const current=findAssignment(body,entry.variable);if(entry.kind==='manual-placeholder')manualAnchorChecks.push(validateManualBaseline(entry,current.line));assert.throws(()=>checkDisplayLine(entry,current.line),'Each baseline target must fail its final display check');baselineFailureChecks.push({id:entry.id,failedAsExpected:true,kind:entry.kind});revised=revised.replace(current.line,entry.newLine);}
  const changed={...doc,lines:doc.lines.slice()};changed.lines[loc.body]=core.shift(revised,-5);const candidate=core.parse(core.serialize(changed));validateDocument(candidate,spec,'candidate');assert.ok(candidate.lines.every((line,i)=>i===loc.body||line===doc.lines[i]));positiveDisplayChecks=spec.candidates.map(entry=>checkDisplayLine(entry,findAssignment(revised,entry.variable).line));assert.equal(positiveDisplayChecks.length,6);assert.equal(baselineFailureChecks.filter(x=>x.kind!=='manual-placeholder').length,5);
 }else positiveDisplayChecks=spec.candidates.map(entry=>checkDisplayLine(entry,findAssignment(body,entry.variable).line));
 const report={status:'STATIC_PASS',mode,file,sha256:doc.hash,scope:'Five format edits and one explicitly requested neutral manual placeholder',partialScopeApprovalRequired:false,results,assignmentChecks:actual,manualAnchorChecks,baselineFailureChecks,supportedFormatBaselineFailures:baselineFailureChecks.filter(x=>x.kind!=='manual-placeholder').length,positiveDisplayChecks,selfTests:tests,gameFilesWritten:false,limits:['No native QSP engine or UI execution in this validator.','Five format assignments preserve prose and tokens except the specified repairs.','One manual-placeholder assignment is validated against the exact user-requested neutral value and original baseline UTF-8 line hash.','Shared div fragments are preserved without claiming global wrapper validity.','Candidate mode permits other independently authorized changes outside these assignments; root must perform whole-patch scope and replay checks.']};
 if(args[2])fs.writeFileSync(args[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,mode,sha256:doc.hash,candidates:results.length,formatBaselineFailuresExpected:report.supportedFormatBaselineFailures,manualBaselineAnchorChecks:manualAnchorChecks.length,positiveDisplayChecks:positiveDisplayChecks.length,positiveAndNegativeSelfTests:tests.length,gameFilesWritten:false}));
}
main();
