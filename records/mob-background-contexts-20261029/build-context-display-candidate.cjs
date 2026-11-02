'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const source='G:/somi/JO9sa/tools/mob-image-sets/catalog-mob-sets.js';
const target=path.join(__dirname,'catalog-mob-sets.candidate.js');
const original=fs.readFileSync(source),text=original.toString('utf8'),eol=text.includes('\r\n')?'\r\n':'\n';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const helper=` // JO9 MOD START MOB_BACKGROUND_CONTEXTS_20261029
 function appendBackgroundInfo(card,item){
  const contexts=Array.isArray(item.appearanceContexts)?item.appearanceContexts:[];
  const value=v=>Array.isArray(v)?v.map(value).filter(Boolean).join(' / '):v===null||v===undefined?'':String(v);
  const label=ctx=>value(ctx.label||ctx.kind||ctx.contextId||ctx.environment||'미분류');
  if(contexts.length){
   card.append(node('p','등장: '+[...new Set(contexts.map(label))].join(' / ')));
   const details=node('details');details.append(node('summary','등장 배경·QSP 근거'));
   details.style.cssText='margin:8px 0;overflow-wrap:anywhere';
   for(const ctx of contexts){
    const section=node('div');section.append(node('h4',label(ctx)));
    const add=(title,v)=>{const text=value(v);if(text)section.append(node('p',title+': '+text));};
    add('배경 기준',ctx.environment);
    add('장소',ctx.place);
    add('현재 전투 배경',ctx.battleBackground);
    if(value(ctx.sceneBackground)!==value(ctx.battleBackground))add('전투 전 장소 배경',ctx.sceneBackground);
    add('조건',ctx.condition);
    if(Array.isArray(ctx.evidence)&&ctx.evidence.length){
     const evidence=node('ul');
     for(const entry of ctx.evidence){
      const where=value(entry.location)+(entry.line===null||entry.line===undefined?'':':'+value(entry.line));
      const row=node('li');row.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere';
      row.append(node('code',[where,value(entry.text)].filter(Boolean).join(' — ')));evidence.append(row);
     }
     section.append(evidence);
    }
    details.append(section);
   }
   card.append(details);
  }
  const notes=Array.isArray(item.backgroundNotes)?item.backgroundNotes:typeof item.backgroundNotes==='string'?[item.backgroundNotes]:[];
  for(const text of notes){if(!text)continue;const note=node('p','배경 확인: '+value(text));note.style.cssText='color:#f3c77b;white-space:pre-wrap;overflow-wrap:anywhere';card.append(note);}
 }
 // JO9 MOD END MOB_BACKGROUND_CONTEXTS_20261029
`.replace(/\n/g,eol);
const anchor=" const root=node('details');";
assert.equal(text.split(anchor).length-1,1,'Unique helper insertion anchor');
const groupBefore="   card.append(node('h3',g.name),node('p','인원: '+g.count+' · '+(g.random?'중복 추첨이 가능한 무작위 구성의 대표 컷신':'고정 구성')));";
const groupAfter="   card.append(node('h3',g.name));appendBackgroundInfo(card,g);card.append(node('p','인원: '+g.count+' · '+(g.random?'중복 추첨이 가능한 무작위 구성의 대표 컷신':'고정 구성')));";
const entryBefore="card.append(node('h3',e.name+' · '+e.key));";
const entryAfter=entryBefore+'appendBackgroundInfo(card,e);';
for(const old of [groupBefore,entryBefore])assert.equal(text.split(old).length-1,1,'Unique caller anchor');
const candidate=text.replace(anchor,helper+anchor).replace(groupBefore,groupAfter).replace(entryBefore,entryAfter);
assert.equal(candidate.replace(helper,'').replace(groupAfter,groupBefore).replace(entryAfter,entryBefore),text,'All pre-existing source bytes are recoverable by removing the three additions');
assert(!/innerHTML|insertAdjacentHTML|document\.write/.test(helper),'Metadata must be inserted as text');
assert.equal(candidate.match(/appendBackgroundInfo\(card,[ge]\)/g).length,2);
assert(fs.readFileSync(source).equals(original),'Canonical source changed during candidate preparation');
fs.writeFileSync(target,candidate);
const check=spawnSync(process.execPath,['--check',target],{encoding:'utf8'});assert.equal(check.status,0,check.stderr||check.stdout);
const report={status:'CANDIDATE_ONLY',source,sourceSha256:sha(original),candidate:target,candidateSha256:sha(Buffer.from(candidate)),syntaxCheck:'PASS',reversibleAdditionsOnly:true,canonicalSourceUnchanged:fs.readFileSync(source).equals(original),textContentOnly:true,newHelper:'appendBackgroundInfo(card,item)',callSites:['existing group card immediately after h3','existing individual MOB card immediately after h3'],dataRead:['item.appearanceContexts[]','item.backgroundNotes[]'],fields:['label/kind/contextId/environment label fallback','environment','place','battleBackground','sceneBackground (only when different from battleBackground)','condition','evidence[].location/line/text'],noGameOrChecklistInstallation:true};
fs.writeFileSync(path.join(__dirname,'catalog-context-display-candidate-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
