'use strict';
// 장비 목록 툴팁을 현재 설명과 연결하는 격리 패치 생성기.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=__dirname,core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs'),e='\r\n';
const source=process.argv[2]||'G:/Codex/tmp/hover-meiki-fix-20261021/inputs/baseline.qsp',raw=fs.readFileSync(source),doc=core.parse(raw);
assert.equal(core.hash(raw),'1e911ced3798826e8cd1f35ed1e4115e9fd6450a9fdecaeb231b5f6885c1abb4');assert(core.serialize(doc).equals(raw));
const location=n=>doc.locations.find(l=>l.name===n),body=n=>core.shift(doc.lines[location(n).body],5),before=body('#dynamic'),edits=[],summary=[];
const formatter=[
'! JO9 MOD START EQUIPMENT_TOOLTIP_TEXT_20261021',
'$jo9_equipment_tooltip = {',
' $jo9_eq_text = $item_description[$args[0]]',
" $jo9_eq_tag = $strfind($jo9_eq_text, '<[bB][rR][^<>]*>')",
' :jo9_eq_breaks',
" if $jo9_eq_tag ! '':",
"  $jo9_eq_text = $replace($jo9_eq_text, $jo9_eq_tag, ' ')",
"  $jo9_eq_tag = $strfind($jo9_eq_text, '<[bB][rR][^<>]*>')",
"  jump 'jo9_eq_breaks'",' end',
" $jo9_eq_tag = $strfind($jo9_eq_text, '<[/]?[a-zA-Z][^<>]*>')",
' :jo9_eq_tags',
" if $jo9_eq_tag ! '':",
"  $jo9_eq_text = $replace($jo9_eq_text, $jo9_eq_tag, '')",
"  $jo9_eq_tag = $strfind($jo9_eq_text, '<[/]?[a-zA-Z][^<>]*>')",
"  jump 'jo9_eq_tags'",' end',
` $jo9_eq_text = $replace($jo9_eq_text, '&', '&amp;')`,
` $jo9_eq_text = $replace($jo9_eq_text, '"', '&quot;')`,
` $jo9_eq_text = $replace($jo9_eq_text, "'", '&#39;')`,
` $jo9_eq_text = $replace($jo9_eq_text, '<', '&lt;')`,
` $jo9_eq_text = $replace($jo9_eq_text, '>', '&gt;')`,
" $jo9_eq_tag = $strfind($jo9_eq_text, '[\\r\\n]')",
' :jo9_eq_lines',
" if $jo9_eq_tag ! '':",
"  $jo9_eq_text = $replace($jo9_eq_text, $jo9_eq_tag, ' ')",
"  $jo9_eq_tag = $strfind($jo9_eq_text, '[\\r\\n]')",
"  jump 'jo9_eq_lines'",' end',
' $result = $jo9_eq_text'," killvar 'jo9_eq_text'"," killvar 'jo9_eq_tag'",'}',
'! JO9 MOD END EQUIPMENT_TOOLTIP_TEXT_20261021',''
].join(e);
const removeItems=new Set(['без_брони','пусто','голая']);
const blocks=[...before.matchAll(/^\$(\w+) = \{/mg)].map(m=>({name:m[1],start:m.index,end:before.indexOf(e+'}',m.index)+3}));
for(const block of blocks){assert(block.end>block.start);const old=before.slice(block.start,block.end);let count=0;
 let changed=old.split(e).map(line=>{
  if(line.trimStart().startsWith('!'))return line;
  const comment=line.indexOf('&!'),at=comment<0?line.length:comment,active=line.slice(0,at),tail=line.slice(at);
  const next=active.replace(/<a href = "EXEC: \$new_item = ''([^']+)''/g,(whole,key)=>{
   if(removeItems.has(key)||key.includes('<<'))return whole;
   count++;return '<a class="tooltip-left" tooltip-data="<<$dyneval($jo9_equipment_tooltip, "'+key+'")>>"'+whole.slice(2);
  });return next+tail;
 }).join(e);
 if(block.name==='get_non_combat_equipment'){
  assert.equal(changed.split('<a href = "EXEC:').length-1,1);
  changed=changed.replace('<a href = "EXEC:','<a class="tooltip-left" tooltip-data="<<$dyneval($jo9_equipment_tooltip, $args[0])>>" href = "EXEC:');count++;
 }
 if(!count)continue;
 const id='EQUIPMENT_TOOLTIP_'+block.name.toUpperCase()+'_20261021';
 let next='! JO9 MOD START '+id+e+changed+e+'! JO9 MOD END '+id;
 if(block.name==='get_non_combat_equipment')next=formatter+next;
 edits.push({location:'#dynamic',field:'body',old,new:next,count:1});summary.push({name:block.name,constantLinks:block.name==='get_non_combat_equipment'?0:count,sharedHelper:block.name==='get_non_combat_equipment'});
}
assert.equal(summary.reduce((s,x)=>s+x.constantLinks,0),176);assert.equal(summary.filter(x=>x.sharedHelper).length,1);
const cacheOld='if jo9_meiki_revision < 214348873:'+e+' jo9_meiki_revision = 214348873';
assert.equal(body('$newloc').split(cacheOld).length-1,1);
edits.push({location:'$newloc',field:'body',old:cacheOld,new:'! JO9 MOD START EQUIPMENT_TOOLTIP_SAVE_CACHE_20261021'+e+'if jo9_meiki_revision < 214348874:'+e+' jo9_meiki_revision = 214348874'+e+'! JO9 MOD END EQUIPMENT_TOOLTIP_SAVE_CACHE_20261021',count:1});
for(const edit of edits){const loc=location(edit.location),text=core.shift(doc.lines[loc.body],5);assert.equal(text.split(edit.old).length-1,edit.count);doc.lines[loc.body]=core.shift(text.replace(edit.old,edit.new),-5);}
const candidate=core.serialize(doc);qa.inspectWorld(candidate);
const initial=core.parse(raw);for(let i=0;i<doc.lines.length;i++)if(i!==location('#dynamic').body&&i!==location('$newloc').body)assert.equal(doc.lines[i],initial.lines[i]);
const oldExecutable=before.split(e).filter(l=>!l.trimStart().startsWith('!')).map(l=>l.split('&!')[0]).join(e);
const newExecutable=body('#dynamic').split(e).filter(l=>!l.trimStart().startsWith('!')).map(l=>l.split('&!')[0]).join(e);
const href=s=>[...s.matchAll(/href = "EXEC: \$new_item = [^\r\n]*?item_change[^\r\n]*?">/g)].map(x=>x[0]);
assert.deepEqual(href(newExecutable),href(oldExecutable),'Every live item-change href preserved exactly');
const originalComments=before.split(e).filter(l=>l.trimStart().startsWith('!')||l.includes('&!')).map(l=>l.trimStart().startsWith('!')?l:l.slice(l.indexOf('&!')));
const changedComments=body('#dynamic').split(e).filter(l=>!l.includes('EQUIPMENT_TOOLTIP_')).filter(l=>l.trimStart().startsWith('!')||l.includes('&!')).map(l=>l.trimStart().startsWith('!')?l:l.slice(l.indexOf('&!')));
assert.deepEqual(changedComments,originalComments,'All pre-existing full-line and inline comments preserved');
const patch={id:'EQUIPMENT_TOOLTIP_RESTORE_20261021',description:'Restore equipment selection tooltips from current item_description at render time; preserve click/wear logic and CSS, refresh existing saved dynamic cache once using existing revision.',target:'game\\jack.qsp',before_sha256:core.hash(raw),after_sha256:core.hash(candidate),edits};
fs.mkdirSync(path.join(root,'patches'),{recursive:true});fs.writeFileSync(path.join(root,'patches','2026-10-21_equipment_tooltip_restore.json'),JSON.stringify(patch,null,2)+'\n');
fs.writeFileSync(path.join(root,'equipment-candidate.qsp'),candidate);
fs.writeFileSync(path.join(root,'change-summary.json'),JSON.stringify({source,before:core.hash(raw),after:core.hash(candidate),edits:edits.length,changedLocations:['#dynamic','$newloc'],newLocations:0,newDynamicHelpers:1,newActorFields:0,newSaveMigration:0,newCachedScriptDefinitions:['$jo9_equipment_tooltip'],newCachedScriptDefinitionMayPersistInSaves:true,scratchVariables:{names:['jo9_eq_text','jo9_eq_tag'],baselineCollisions:0,clearedBeforeReturning:true},cache:{field:'jo9_meiki_revision',before:214348873,after:214348874,action:"existing gs '#static_base'; gs '#dynamic'"},coverage:{activeConstantLinks:188,constantTooltipLinks:176,removalLinksUnchanged:12,sharedHelperLinks:1,totalLiveItemChangeLinks:189,commentedLegacyExamplesUnchanged:true},functions:summary,preserved:{allItemChangeHrefs:true,existingComments:true,otherQspFields:true,css:true,itemDescriptionDefinitions:true},normalization:{source:'current $item_description[item key], read per rendered link',strip:'br tags become spaces; remaining alpha-name HTML tags removed',escape:['&','double quote','apostrophe','<','>','CR','LF'],knownSourceEntities:'none in current #item_base literals; existing encoded entities are not decoded'}},null,2)+'\n');
console.log(JSON.stringify({patch:patch.id,after:patch.after_sha256,edits:edits.length,constantLinks:176,sharedHelper:1,cache:214348874}));
