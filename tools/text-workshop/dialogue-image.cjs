'use strict';
// JO9 MOD START DIALOGUE_IMAGE_BINDING_20261108
const assert=require('node:assert/strict'),crypto=require('node:crypto'),core=require('./core.cjs'),scenes=require('./scenes.cjs'),syntax=require('./check-image-cycle-syntax.cjs');
function imagePath(value){
 const rel=String(value||'').replaceAll('\\','/').replace(/^content\/pic\//i,'');
 if(!rel||! /\.(png|jpe?g|gif|webp|bmp)$/i.test(rel)||/[<>:"|?*\x00-\x1f]/.test(rel)||rel.startsWith('/')||rel.split('/').some(p=>!p||p==='.'||p==='..'||/[. ]$/.test(p)))throw Error('PIC 안의 정적인 이미지 경로를 선택하세요.');return rel;
}
function routeFor(a,id){const route=a.scenes.find(s=>s.id===id);if(!route||route.type)throw Error('사용 장면의 페이지 범위를 확인할 수 없습니다.');return route;}
function renderer(doc,entry,body,a,route){
 const scoped=body.slice(route.start,route.end),safe=scenes.masked(scoped);let depth=0;const delayed=[];for(let i=0;i<safe.length;i++){if(safe[i]==='{')depth++;delayed[i]=depth;if(safe[i]==='}')depth--;}
 const commonInside=scenes.calls(scoped,{location:entry.location,scene:route}).filter(c=>!delayed[c.offset]&&!a.blocks.some(b=>b.start>route.start&&route.start+c.offset>=b.start&&route.start+c.offset<b.end));
 const allowed=['interaction_screen','interaction_screen_city','special_screen','sex_interaction_screen'];
 const direct=commonInside.find(c=>allowed.includes(c.target));if(direct)return{name:direct.target,at:route.start+direct.offset};
 const outside=scenes.calls(body,{location:entry.location,scene:route}).filter(c=>c.offset>=route.end&&!a.blocks.some(b=>c.offset>=b.start&&c.offset<b.end)),simple=outside.find(c=>allowed.includes(c.target));
 if(simple)return{name:simple.target,at:route.end};
 if(entry.location==='interaction_city'&&outside.some(c=>c.target==='interaction_result_city')){
  const prefix=body.slice(0,route.start).split('');for(const b of a.blocks)if(b.start<route.start&&b.end<=route.start)for(let i=b.start;i<Math.min(b.end,prefix.length);i++)if(prefix[i]!=='\n')prefix[i]=' ';
  const type=scenes.assignments(scoped).$interaction_type??scenes.assignments(prefix.join('')).$interaction_type;
  const target=doc.locations.find(l=>l.name==='interaction_result_city');if(type==='basic'&&target){const code=core.shift(doc.lines[target.body],5),analysis=scenes.analyse(target.name,code);if(!analysis.blocks.some(b=>b.predicate?.key==='$interaction_type'&&b.predicate.value==='basic')&&scenes.calls(code,{location:target.name}).some(c=>c.target==='interaction_screen_city'&&!analysis.blocks.some(b=>c.offset>=b.start&&c.offset<b.end)))return{name:'interaction_screen_city',at:route.end};}
 }
 throw Error('이 장면의 페이지 출력 연결은 추가 분석이 필요합니다: '+entry.location+' / '+route.condition);
}
function prepare(doc,selection,value,options={}){
 const rel=imagePath(value),entries=core.entries(doc),context=scenes.buildNavigator(doc,entries).context(selection,options.sceneId,'text',options.usageId),flow=context.flow;
 if(flow?.kind!=='array'||!flow.usage||!Number.isSafeInteger(flow.selected)||flow.selected<0)throw Error('이 대사의 페이지·사용 장면 연결을 확인할 수 없습니다.');
 if(flow.usages.length>1&&!options.usageId)throw Error('대사가 여러 곳에 쓰입니다. 사용 장면을 먼저 선택하세요.');
 if(options.usageId&&flow.usage.id!==options.usageId)throw Error('선택한 사용 장면이 변경됐습니다. 다시 선택하세요.');
 const loc=doc.locations.find(l=>l.name===flow.usage.location);if(!loc||doc.locations.filter(l=>l.name===loc.name).length!==1)throw Error('사용 장면의 위치가 중복되거나 없습니다.');
 const oldField=core.shift(doc.lines[loc.body],5),analysis=scenes.analyse(loc.name,oldField),scope=routeFor(analysis,flow.usage.sceneId),page=flow.selected;
 const id=crypto.createHash('sha256').update(loc.name+'\n'+scope.condition+'\n'+JSON.stringify(scope.parents)+'\n'+page).digest('hex').slice(0,16),start='! JO9 MOD START DIALOGUE_IMAGE_'+id,end='! JO9 MOD END DIALOGUE_IMAGE_'+id;
 const previous=new RegExp('^[ \\t]*'+start+'\\r?\\n[\\s\\S]*?^[ \\t]*'+end+'[^\\r\\n]*(?:\\r?\\n|$)','gm'),matches=[...oldField.matchAll(previous)];if(matches.length>1)throw Error('같은 이미지 연결 표시가 중복되어 있습니다.');
 if(matches.some(m=>m.index<scope.start||m.index>=scope.end))throw Error('같은 조건 이름을 가진 다른 장면과 연결 표시가 겹칩니다.');
 let body=oldField.replace(previous,'');const a=scenes.analyse(loc.name,body),route=routeFor(a,flow.usage.sceneId),screen=renderer(doc,{location:loc.name},body,a,route),renderLoc=doc.locations.find(l=>l.name===screen.name);
 if(!renderLoc||! /\$special_image_full\s*\[\s*txt\s*\]/i.test(core.shift(doc.lines[renderLoc.body],5)))throw Error('이 장면의 출력기는 대사별 이미지 슬롯을 사용하지 않습니다: '+screen.name+' · 전용 출력 연결 분석이 필요합니다.');
 let at=screen.at;const lineStart=body.lastIndexOf('\n',at-1)+1,prefix=body.slice(lineStart,at);if(prefix.trim())throw Error('한 줄에 연결된 출력 명령의 범위를 확인해야 합니다: '+loc.name);at=lineStart;
 const nl=body.includes('\r\n')?'\r\n':'\n',indent=(body.slice(route.start).match(/^[ \t]*/)||[''])[0]+' ',block=[indent+start,indent+"$special_image_full["+page+"] = 'content/pic/"+rel.replaceAll("'","''")+"'",indent+end,''].join(nl);
 const newField=body.slice(0,at)+block+body.slice(at),blockCheck=syntax.checkSyntax(block,{normalizeEol:true}),baselineCheck=syntax.checkSyntax(oldField,{normalizeEol:true}),check=syntax.checkSyntax(newField,{normalizeEol:true});
 const counts=errors=>errors.reduce((map,e)=>(map[e.code]=(map[e.code]||0)+1,map),{}),beforeCounts=counts(baselineCheck.errors),afterCounts=counts(check.errors);
 if(blockCheck.errors.length||Object.entries(afterCounts).some(([code,n])=>n>(beforeCounts[code]||0)))throw Error('이미지 연결 구문 검사 실패: '+JSON.stringify(blockCheck.errors.length?blockCheck.errors:check.errors.slice(0,3)));
 const changed={...doc,lines:doc.lines.slice()};changed.lines[loc.body]=core.shift(newField,-5);const raw=core.serialize(changed),parsed=core.parse(raw);assert(core.serialize(parsed).equals(raw));parsed.lines.forEach((s,i)=>{if(i!==loc.body)assert.equal(s,doc.lines[i]);});
 let left=0,oldRight=oldField.length,newRight=newField.length;while(left<oldRight&&left<newRight&&oldField[left]===newField[left])left++;while(oldRight>left&&newRight>left&&oldField[oldRight-1]===newField[newRight-1]){oldRight--;newRight--;}
 const piece=core.minimalEdit(oldField,newField,left,oldRight,newRight),variants=flow.stages.find(s=>s.number===page)?.variants.length||1;
 return{raw,entry:context.selection,before:doc.hash,after:core.hash(raw),targetLocation:loc.name,targetFieldIndex:loc.body,oldField,newField,piece,page,path:rel,usage:flow.usage,renderer:screen.name,variants,sourceSelection:context.selection,sceneId:context.scene.id,operation:'image',syntax:{blockErrors:blockCheck.errors.length,baselineIssues:baselineCheck.errors.length,candidateIssues:check.errors.length}};
}
module.exports={prepare,imagePath};
// JO9 MOD END DIALOGUE_IMAGE_BINDING_20261108
