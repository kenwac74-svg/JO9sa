'use strict';
// Read-only source audit. Writes only audit-evidence.json beside this script.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const core = require('../../tools/text-workshop/core.cjs');
const files = {
  table15: 'K:/doing/15_mansion_talk_and_love_rework_table.txt',
  patch16: 'K:/doing/16_qsp_patch_mansion_talk_and_love.txt',
  workQsp: 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'
};
const buffers = Object.fromEntries(Object.entries(files).map(([k,p]) => [k,fs.readFileSync(p)]));
const sha256 = b => crypto.createHash('sha256').update(b).digest('hex');
const utf8 = b => new TextDecoder('utf-8', {fatal:true}).decode(b);
const texts = { table15:utf8(buffers.table15), patch16:utf8(buffers.patch16) };
const physicalLines = t => t.replace(/\n$/, '').split('\n');
const lines = physicalLines(texts.patch16);
const normalize = s => s.replace(/\["([^"\]]+)"\]/g, "['$1']").toLowerCase();
const assignment = /^\s*(\$\w+(?:\[[^\]]+\])?)\s*=/;
let section = 0;
const primary = [], headers = [], markers = [];
for (let i=0;i<lines.length;i++) {
  const line = lines[i], header=line.match(/^! --- \[(\d+)\]/);
  if (header) {section=Number(header[1]);headers.push({section,line:i+1,header:line});}
  if (line.startsWith('! Line')) markers.push({line:i+1,target:line,followingLine:i+2,followingKind:assignment.test(lines[i+1]||'')?'assignment':(lines[i+1]||'').startsWith('!')?'comment':'other'});
  const m=line.match(assignment);
  if(m)primary.push({line:i+1,key:m[1],section});
}
const doc = core.parse(buffers.workQsp);
const locations = new Map(doc.locations.map(loc => [loc.name, {loc,body:core.shift(doc.lines[loc.body],5)}]));
const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const sources = new Map();
for(const name of ['#txt_man','#static_txt']){
  const decls=new Map();
  for(const [i,line]of locations.get(name).body.split('\n').entries()){
    const m=line.match(assignment);if(!m)continue;
    const key=normalize(m[1]);if(!decls.has(key))decls.set(key,[]);decls.get(key).push(i+1);
  }
  sources.set(name,decls);
}
const comparisons = [ [2,'#txt_man'], [3,'#static_txt'] ].map(([section,location])=>{
  const declarations=sources.get(location), wanted=primary.filter(x=>x.section===section);
  const annotate=x=>({...x,currentLocation:location,currentDeclarationLines:declarations.get(normalize(x.key))||[]});
  const rows=wanted.map(annotate);
  return {section,location,primaryLines:rows.length,matched:rows.filter(x=>x.currentDeclarationLines.length).length,unmatched:rows.filter(x=>!x.currentDeclarationLines.length),repeatedCurrentDeclarations:rows.filter(x=>x.currentDeclarationLines.length>1)};
});
const missing=comparisons.flatMap(x=>x.unmatched);
const aliases=lines.flatMap((line,i)=>line.match(/ & (\$sa_relations_rext\[[^\]]+\])\s*=/)?[{line:i+1,key:line.match(/ & (\$sa_relations_rext\[[^\]]+\])\s*=/)[1]}]:[]);
const allScalarAbsent=missing.filter(x=>!x.key.includes('[')).map(x=>{
  const re=new RegExp(escapeRegExp(x.key)+'(?![\\w])','i');
  return {...x,currentWorkLocationsWithReference:[...locations].filter(([,v])=>re.test(v.body)).map(([name])=>name)};
});
const stateBases=['$refuse_talk','$slave_relation_description','$psy_status','$bathing_slave_alone','$prise_erotic_reaction_assistant','$compliment_reaction_assistant'];
const stateMismatch=missing.filter(x=>stateBases.some(base=>x.key.startsWith(base+'[')));
const literals=core.literals(texts.patch16),markupErrors=[];
for(const literal of literals){try{core.validateMarkup(literal.text);}catch(e){markupErrors.push({line:literal.line,error:e.message});}}
const rhsLexicalIssues=[];
for(const p of primary){
  const line=lines[p.line-1],m=line.match(assignment),tail=line.slice(m[0].length).trim();
  const token=core.literals(tail)[0];
  if(!token||token.start!==1)rhsLexicalIssues.push({line:p.line,issue:'RHS does not start with a closed quoted literal'});
  else {const remainder=tail.slice(token.end+1).trim();if(remainder&&!aliases.some(a=>a.line===p.line))rhsLexicalIssues.push({line:p.line,issue:'Unexpected RHS remainder'});}
}
const tableRows=[];
for(const [i,line]of physicalLines(texts.table15).entries()){
 const m=line.match(/^\| L(\d+) \| `(\$[^`]+)` \| (.*) \|$/);if(m)tableRows.push({line:i+1,target:Number(m[1]),key:m[2],value:m[3]});
}
const byKey=new Map(primary.map(x=>[normalize(x.key),x]));
const tableMismatches=tableRows.flatMap(row=>{
 const p=byKey.get(normalize(row.key));
 const actual=p?lines[p.line-1].replace(assignment,'').trim():null;
 return actual===row.value?[]:[{tableLine:row.line,key:row.key,patchLine:p?.line||null}];
});
const groupCounts={};for(const p of primary){const base=p.key.split('[')[0],k=p.section+':'+base;groupCounts[k]=(groupCounts[k]||0)+1;}
const newlineInfo = (b,t)=>({bytes:b.length,physicalLines:physicalLines(t).length,utf8BOM:b.subarray(0,3).equals(Buffer.from([239,187,191])),LF:(t.match(/\n/g)||[]).length,CRLF:(t.match(/\r\n/g)||[]).length,CR:(t.match(/\r/g)||[]).length});
const evidence={
 schemaVersion:1,generatedAt:new Date().toISOString(),inputs:Object.fromEntries(Object.entries(files).map(([k,p])=>[k,{path:p,sha256:sha256(buffers[k])}])),
 rawFiles:{table15:newlineInfo(buffers.table15,texts.table15),patch16:newlineInfo(buffers.patch16,texts.patch16)},
 sections:headers.map((h,i)=>({...h,endLine:(headers[i+1]?.line||lines.length+1)-1})),
 counts:{primaryStringAssignmentPhysicalLines:primary.length,primaryUniqueKeys:new Set(primary.map(x=>normalize(x.key))).size,primaryDuplicateKeys:primary.length-new Set(primary.map(x=>normalize(x.key))).size,primaryByLocation:Object.fromEntries(comparisons.map(x=>[x.location,x.primaryLines])),allStringAssignmentExpressions:primary.length+aliases.length,allUniqueAssignmentKeys:new Set([...primary,...aliases].map(x=>normalize(x.key))).size,conditionalNumericStatements:lines.filter(line=>/^if\b.*:\s*sa_relations\s*\+=/i.test(line)).length,lineMarkers:markers.length,nonAssignmentLineMarkers:markers.filter(x=>x.followingKind!=='assignment'),matchingCurrentDeclarationKeys:comparisons.reduce((n,x)=>n+x.matched,0),unmatchedCurrentDeclarationKeys:missing.length,unmatchedBreakdown:{newIsolateKeys:missing.filter(x=>x.key.startsWith("$sa_relations_text['isolate_")).length,stateKeys:stateMismatch.length,scalarKeys:allScalarAbsent.length,newResultIndex4:missing.filter(x=>/^\$(cheer_up_result|straining_result)\[4\]$/.test(x.key)).length},saRelationsPrimary:groupCounts['3:$sa_relations_text'],escapedHtmlAssignmentLines:lines.filter(l=>l.startsWith('$')&&l.includes('&lt;')).length},
 aliases,perFamilyCounts:groupCounts,currentKeyComparisons:comparisons,scalarKeysAbsentThroughoutCurrentWork:allScalarAbsent,
 keyProofs:{stateMismatch,leadingWhitespaceKeys:primary.filter(x=>/\['\s/.test(x.key)),newResultIndex4:missing.filter(x=>/^\$(cheer_up_result|straining_result)\[4\]$/.test(x.key)),dynslaveNameReplacements:primary.filter(x=>/^\$(psy_status|bathing_slave_alone)\[/.test(x.key)).map(x=>({line:x.line,key:x.key,patchToken:'<<$slave_name>>'})),currentDynslaveContractComments:{location:'#static_txt',lines:[334,351]},isolateCaller:{location:'origins_relations',line:91},currentIsolateTypoDeclarations:{location:'#static_txt',lines:[3039,3040,3041]},staticSourceOffsetExamples:[{key:"$sa_relations_text['tolerant_world_eq_1']",patchLine:405,claimedSourceLine:2649,currentSourceLine:2727}]},
 table15:{rows:tableRows.length,uniqueKeys:new Set(tableRows.map(x=>normalize(x.key))).size,rowsByPart:{txtMan:tableRows.filter(x=>x.line<185).length,static:tableRows.filter(x=>x.line>=185&&x.line<271).length,saRelationsSamples:tableRows.filter(x=>x.line>=271).length},patchValueMismatches:tableMismatches},
 lexicalAndMarkup:{literalTokens:literals.length,multilineQuotedTokens:literals.filter(x=>x.text.includes('\n')).length,markupErrors,rhsLexicalIssues,locationWrappers:0,escapedLtOccurrences:(texts.patch16.match(/&lt;/g)||[]).length,escapedQuotOccurrences:(texts.patch16.match(/&quot;/g)||[]).length,realFontTagOccurrences:(texts.patch16.match(/<font/g)||[]).length},
 limits:['Read-only source audit; no game, input TXT, or QSP writes.','No proposed code execution and no diagnostic QSP was created.','core.literals and validateMarkup are lexical/markup helpers, not the QSP engine or a complete QSP grammar parser.','No engine syntax, branch execution, save loading, or displayed UI verification performed.','Current-key matching compares direct declaration variable/index spelling after quote-style and identifier-case normalization; unmatched is not by itself proof of unreachable dynamic code.','Counts are assignments/keys, not scenes.','Header Record numbers denote QSP body-field indices, not location ordinal indices; named body fields match current Work. Source line comments must be checked separately against current text.']
};
// Compare only the submitted relationship keys; retain markup tokens, never prose.
const staticLines=locations.get('#static_txt').body.split('\n');
const relationshipRows=primary.filter(x=>x.key.startsWith('$sa_relations_text[')).map(p=>{
 const patchLine=lines[p.line-1],patchTail=patchLine.slice(patchLine.indexOf('=')+1).trim();
 const patchValue=core.literals(patchTail)[0]?.text||'';
 let sourceKey=p.key,sourceLines=sources.get('#static_txt').get(normalize(sourceKey))||[],sourceVia='same-key';
 if(!sourceLines.length&&p.key.startsWith("$sa_relations_text['isolate_")){
  sourceKey=p.key.replace('$sa_relations_text','$sa_relations_rext');
  sourceLines=sources.get('#static_txt').get(normalize(sourceKey))||[];sourceVia='existing-typo-alias';
 }
 const sourceLine=sourceLines[0],sourceRaw=sourceLine?staticLines[sourceLine-1]:'',sourceTail=sourceRaw.slice(sourceRaw.indexOf('=')+1).trim();
 const sourceValue=core.literals(sourceTail)[0]?.text||'';
 const markupTokens=s=>s.match(/<\/?font\b[^>]*>|&lt;\/?font\b.*?&gt;/g)||[];
 return {key:p.key,patchLine:p.line,currentSourceKey:sourceKey,currentSourceLine:sourceLine||null,currentSourceVia:sourceVia,patchHasEscapedFont:/&lt;\/?font\b/.test(patchValue),patchHasActualFont:/<\/?font\b/.test(patchValue),currentHasEscapedFont:/&lt;\/?font\b/.test(sourceValue),currentHasActualFont:/<\/?font\b/.test(sourceValue),patchMarkupTokens:markupTokens(patchValue),currentMarkupTokens:markupTokens(sourceValue)};
});
const decodeTerms=/html.?decode|decode.?html|unescape|&lt;|&gt;|&quot;|&#60;|&#62;/i;
const pathLocations=['origins_relations','interaction','interaction.relations','interaction_screen'];
const pathScan=pathLocations.map(name=>({location:name,entityOrDecodeTermLines:locations.get(name).body.split('\n').flatMap((line,i)=>decodeTerms.test(line)?[i+1]:[])}));
const dynLines=locations.get('#dynamic').body.split('\n');
const blocks=['$voice_native_actor','$voice_native'].map(name=>{
 const start=dynLines.findIndex(line=>line.startsWith(name+' ='));let end=start+1;while(end<dynLines.length&&!/^\}/.test(dynLines[end]))end++;
 return {name,location:'#dynamic',startLine:start+1,endLine:end+1,entityOrDecodeTermLines:dynLines.slice(start,end+1).flatMap((line,i)=>decodeTerms.test(line)?[start+i+1]:[])};
});
evidence.headerRecordFields=doc.locations.filter(loc=>['relations_fastcalc','#txt_man','#static_txt','interaction.relations','interaction','origins_relations','#moodlet_base','assistant_private_room','slave_private_room1','slave_private_room2','slave_private_room3','slave_private_room4'].includes(loc.name)).map(loc=>({location:loc.name,locationOrdinalIndex:loc.index,qspBodyFieldIndex:loc.body}));
evidence.htmlEntityAudit={
 comparedRelationshipKeys:relationshipRows.length,currentSameKeyRows:relationshipRows.filter(x=>x.currentSourceVia==='same-key').length,currentTypoAliasRows:relationshipRows.filter(x=>x.currentSourceVia==='existing-typo-alias').length,
 patchEscapedFontRows:relationshipRows.filter(x=>x.patchHasEscapedFont).length,patchActualFontRows:relationshipRows.filter(x=>x.patchHasActualFont).length,currentEscapedFontRows:relationshipRows.filter(x=>x.currentHasEscapedFont).length,currentActualFontRows:relationshipRows.filter(x=>x.currentHasActualFont).length,
 currentStaticWholeBody:{escapedFontOccurrences:(locations.get('#static_txt').body.match(/&lt;\/?font\b/g)||[]).length,escapedQuotOccurrences:(locations.get('#static_txt').body.match(/&quot;/g)||[]).length},
 samples:relationshipRows.filter(x=>["$sa_relations_text['tolerant_world_eq_1']","$sa_relations_text['feat_int_low']","$sa_relations_text['isolate_1']"].includes(x.key)),
 escapedRows:relationshipRows.filter(x=>x.patchHasEscapedFont).map(({patchMarkupTokens,currentMarkupTokens,...row})=>row),pathScan,voiceBlocks:blocks,
 pathProofs:[
 {location:'interaction',line:739,role:'1117 calls origins_relations'},
 {location:'origins_relations',line:111,role:'relationship value passed as voice_native fallback argument'},
 {location:'#dynamic',line:6142,role:'voice_native_actor copies args[1] to original'},
 {location:'#dynamic',line:6143,role:'voice_native_actor initially returns original unchanged'},
 {location:'#dynamic',line:6205,role:'native fragment branch can replace fallback result'},
 {location:'origins_relations',line:91,role:'isolate relationship value copied directly to text[2]'},
 {location:'interaction_screen',line:33,role:'only removes leading spaces/nbsp/br prefix'},
 {location:'interaction_screen',line:36,role:'text[txt] interpolated directly into HTML output'}
 ],
 conclusion:'Submitted escaped font markup differs from current raw font tags. No HTML entity decoding step was found on the inspected direct/fallback output path. Literal font-tag text and loss of color styling are a credible rendering risk when these strings reach output. Native fragment replacement can bypass fallback values; actual branch/UI rendering was not executed.',
 limits:['Targeted source-path search, not proof about every engine/frontend processing step.','No QSP engine or browser-rendering test was run.']
};
const output=path.join(__dirname,'audit-evidence.json');fs.writeFileSync(output,JSON.stringify(evidence,null,2)+'\n','utf8');
console.log(JSON.stringify({evidence:output,counts:evidence.counts,lexicalAndMarkup:evidence.lexicalAndMarkup,table15:evidence.table15,hashes:Object.fromEntries(Object.entries(evidence.inputs).map(([k,v])=>[k,v.sha256]))},null,2));