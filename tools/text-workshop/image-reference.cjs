'use strict';
// JO9 MOD START IMAGE_REFERENCE_20261109
const core=require('./core.cjs'),crypto=require('node:crypto'),rules=require('./image-cut-condition-rules.cjs'),syntax=require('./check-image-cycle-syntax.cjs');
function imagePath(value){const p=String(value||'').replaceAll('\\','/').replace(/^content\/pic\//i,'');if(!p||! /\.(png|jpe?g|gif)$/i.test(p)||/[<>:"|?*\x00-\x1f]/.test(p)||p.startsWith('/')||p.split('/').some(x=>!x||x==='.'||x==='..'||/[. ]$/.test(x)))throw Error('PIC 안의 정적인 이미지 경로를 선택하세요.');return p;}
const quote=s=>"'"+s.replaceAll("'","''")+"'";
function generated(meta,indent,nl){const lines=['! JO9 MOD START IMAGE_REFERENCE_'+meta.id,'! JO9 IMAGE REFERENCE '+Buffer.from(JSON.stringify(meta)).toString('base64url')];if(meta.conditions)lines.push('if '+rules.conditionExpression(meta.conditions)+':',' '+meta.array+'['+meta.page+'] = '+quote(meta.path),'else',' '+meta.array+'['+meta.page+'] = '+quote(meta.fallback),'end');else lines.push(meta.array+'['+meta.page+'] = '+quote(meta.path));lines.push('! JO9 MOD END IMAGE_REFERENCE_'+meta.id);return lines.map(x=>indent+x).join(nl);}
function describe(body,entry){
 const re=/^([ \t]*)! JO9 MOD START IMAGE_REFERENCE_([a-f0-9]{16})\r?\n[\s\S]*?^[ \t]*! JO9 MOD END IMAGE_REFERENCE_\2(?=\r?$)/gm;
 for(const m of body.matchAll(re)){if(entry.start<m.index||entry.start>=m.index+m[0].length)continue;const encoded=m[0].match(/! JO9 IMAGE REFERENCE ([A-Za-z0-9_-]+)/);let meta;try{meta=JSON.parse(Buffer.from(encoded?.[1]||'','base64url').toString());}catch{throw Error('이미지 지정의 기록이 손상되었습니다.');}if(meta.id!==m[2]||generated(meta,m[1],body.includes('\r\n')?'\r\n':'\n')!==m[0])throw Error('이미지 지정 코드가 기록과 다릅니다. 최신 코드를 확인하세요.');const refs=core.literals(m[0]).filter(e=>e.text===meta.path||e.text===meta.fallback),first=refs[0];return{meta,start:m.index,end:m.index+m[0].length,indent:m[1],role:first&&m.index+first.start===entry.start?'primary':'fallback'};}
 return null;
}
function prepare(doc,selection,value,options={}){
 const path=imagePath(value),scenes=require('./scenes.cjs'),entries=core.entries(doc),context=scenes.buildNavigator(doc,entries).context(selection,options.sceneId,'text',options.usageId);
 if(options.source?.hash!==doc.hash)throw Error('이미지 원문이 변경되었습니다. 장면을 다시 여세요.');
 const source=context.images.find(im=>im.source&&im.source.fieldIndex===options.source.fieldIndex&&im.source.start===options.source.start&&im.source.end===options.source.end&&im.source.text===options.source.text)?.source;
 if(!source)throw Error('현재 선택한 대사·사용 장면의 이미지 지정이 아닙니다.');
 const loc=doc.locations[source.locationIndex];if(doc.locations.filter(l=>l.name===loc.name).length!==1)throw Error('위치 이름이 중복됩니다.');
 const body=core.shift(doc.lines[source.fieldIndex],5),ref=describe(body,source),lineStart=body.lastIndexOf('\n',source.start-1)+1,lineEnd=body.indexOf('\n',source.end),end=lineEnd<0?body.length:body[lineEnd-1]==='\r'?lineEnd-1:lineEnd;
 const row=body.slice(lineStart,end),binding=require('./flow.cjs').binding(body,source);if(!binding||!/^\s*\$special_image(?:_full)?\[\s*\d+\s*\]\s*=\s*(['"])(?:[^\r\n])*\1\s*$/.test(row)||body.slice(source.end+1,end).trim())throw Error('이 이미지 지정은 복합 명령입니다. 코드 범위를 먼저 확인하세요.');
 const old=ref?.meta,conditions=Object.hasOwn(options,'conditions')?(options.conditions?rules.normalizeCondition(options.conditions):null):old?.conditions||null;
 const previous=imagePath(source.text),fallback=conditions?imagePath(options.fallback||old?.fallback||previous):old?.fallback||previous;
 if(conditions&&fallback===path)throw Error('조건부 이미지와 조건 불충족 시 이미지는 서로 다른 경로를 선택하세요.');
 const meta={id:old?.id||crypto.createHash('sha256').update(loc.name+':'+source.start).digest('hex').slice(0,16),array:binding.array,page:binding.stage,path:binding.array==='$special_image_full'?'content/pic/'+path:path,fallback:binding.array==='$special_image_full'?'content/pic/'+imagePath(fallback):imagePath(fallback),conditions};
 const nl=body.includes('\r\n')?'\r\n':'\n',block=generated(meta,ref?.indent??row.match(/^[ \t]*/)[0],nl),start=ref?.start??lineStart,finish=ref?.end??end,newField=body.slice(0,start)+block+body.slice(finish);
 if(newField===body)throw Error('변경할 경로나 조건이 없습니다.');const beforeCheck=syntax.checkSyntax(body,{normalizeEol:true}),afterCheck=syntax.checkSyntax(newField,{normalizeEol:true}),blockCheck=syntax.checkSyntax(block,{normalizeEol:true}),counts=errors=>errors.reduce((a,e)=>(a[e.code]=(a[e.code]||0)+1,a),{}),baseline=counts(beforeCheck.errors);
 if(blockCheck.errors.length||Object.entries(counts(afterCheck.errors)).some(([code,n])=>n>(baseline[code]||0)))throw Error('이미지 지정 구문 검사가 실패했습니다.');
 const changed={...doc,lines:doc.lines.slice()};changed.lines[source.fieldIndex]=core.shift(newField,-5);const raw=core.serialize(changed),parsed=core.parse(raw);if(!core.serialize(parsed).equals(raw)||parsed.lines.some((s,i)=>i!==source.fieldIndex&&s!==doc.lines[i]))throw Error('이미지 지정 외 변경이 감지되었습니다.');
 return{raw,entry:context.selection,before:doc.hash,after:core.hash(raw),targetLocation:loc.name,targetFieldIndex:source.fieldIndex,oldField:body,newField,piece:core.minimalEdit(body,newField,start,finish,start+block.length),selectionStart:context.selection.fieldIndex===source.fieldIndex&&context.selection.start>=finish?context.selection.start+block.length-(finish-start):context.selection.start,page:binding.stage,path,previous,conditions,fallback:imagePath(fallback),usage:context.flow.usage,sceneId:context.scene.id,variants:1,operation:'image',syntax:{blockErrors:0,baselineIssues:beforeCheck.errors.length,candidateIssues:afterCheck.errors.length}};
}
module.exports={imagePath,describe,prepare,conditionExpression:rules.conditionExpression};
// JO9 MOD END IMAGE_REFERENCE_20261109
