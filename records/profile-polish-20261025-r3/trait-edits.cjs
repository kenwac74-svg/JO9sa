'use strict';
// Builds display-only QSP edits. This helper never writes a runtime file.
const assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const esc=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const states={sanity_broken:'정신분열',sanity_low:'신경 쇠약','Нет_клейма':'상표 없음'};
const charts={scars_chart:'흉터',bruises_chart:'타박상',starvation_chart:'굶주린 정도',wounds_chart:'부상'};
const newNames={attention:'관심종자',oral_pref:'펠라 중독',gag_reflex:'반사적 구역질',anal_pref:'애널섹스 중독',anal_averse:'애널섹스 혐오',defiant:'거센 반항심',slave_nature:'노예근성',innate_mute:'선천적 벙어리',ambitious:'야심가',workaholic:'일벌레',content:'안분지족',activity_active:'활동적',activity_passive:'휴식 선호',persevering:'끈기',distracted:'산만함',petty:'옹졸함',generous:'너그러움',healthy:'건강체질',frail:'약골',berserker:'광전사',paladin:'성기사',veteran:'역전의 용사',versatile:'다재다능',peerless:'절세미인'};
const attentionBody='다른 사람의 관심과 칭찬을 유난히 좋아한다. 칭찬과 격려를 반기며, 해변이나 극장에서 함께 보내는 시간도 좋은 보상이 된다. 반면 모욕과 언어적 압박에는 예민해 부정적인 기억과 불안이 커질 수 있다. 심리피학 성향이 함께 있으면 언어적 압박에는 그 성향대로 반응한다. 은둔형 외톨이와는 양립하지 않는다.';
function stripHeading(text,title){
 let body=String(text).replace(/^\s+/,'');
 // Replace only a leading display heading, never text elsewhere in a description.
 body=body.replace(/^\[[^\]\r\n]+\](?:<br\s*\/?>|\r?\n)\s*/i,'');
 for(const name of [title,...title.split(' / ')])body=body.replace(new RegExp('^'+esc(name)+'\\s*[:：]\\s*'),'');
 return body;
}
function formatDescription(text,title){return '['+title+']<br>'+stripHeading(text,title);}
function build(doc){
 const bodies=new Map(doc.locations.map(l=>[l.name,c.shift(doc.lines[l.body],5)]));
 const edits=[],rows=[],legacyNames={};
 const base=bodies.get('#static_base');assert(base,'Missing #static_base');
 for(const line of base.split('\r\n')){
  if(!line.includes('$dynslave_features_list'))continue;
  const action=line.match(/href\s*=\s*"EXEC:\s*msg\s+\$([^"\s>]+)"/i);
  const label=line.match(/dyneval\([^,]+,\s*\d+,\s*"([^"]+)"/);
  if(!action||!label||action[1]==='jo9_attention_text'||states[action[1]])continue;
  if(!legacyNames[action[1]])legacyNames[action[1]]=label[1];
  else if(legacyNames[action[1]]!==label[1]&&!legacyNames[action[1]].split(' / ').includes(label[1]))legacyNames[action[1]]+=' / '+label[1];
 }
 assert.equal(Object.keys(legacyNames).length,67,'Legacy display map drift');
 assert.equal(legacyNames['танцовщица'],'이국적인 댄서 / 발레리나');
 function lineEdit(location,old,next){
  if(old===next)return;
  const body=bodies.get(location);assert(body,'Missing location '+location);
  assert.equal(body.split(old).length-1,1,'Nonunique line edit '+location);
  edits.push({location,old,new:next,count:1});
 }
 function editAssignment(location,name,title,category){
  const body=bodies.get(location),lines=body.split('\r\n'),pattern=new RegExp('^\\s*\\$'+esc(name)+'\\s*=');
  const hits=lines.map((line,i)=>({line,i})).filter(r=>pattern.test(r.line));
  assert.equal(hits.length,1,'Expected one display assignment '+location+' $'+name);
  const {line,i}=hits[0],at=line.indexOf('=')+1,expr=line.slice(at),entry=c.literals(expr)[0];
  assert(entry,'Expected a complete first description literal '+location+' $'+name);
  const original=entry.text;
  let changed;
  if(category==='state-chart'){
   // Preserve the original centered chart and every appended value/grade unchanged.
   changed='['+title+']<br><center>';
   assert(/^(?:<br>)?<center>[^<]+(?:<br>)+$/i.test(original)||original===changed,'Unexpected chart heading');
  }else changed=formatDescription(original,title);
  const encoded=changed.replaceAll(entry.quote,entry.quote+entry.quote);
  lineEdit(location,line,line.slice(0,at+entry.start)+encoded+line.slice(at+entry.end));
  rows.push({location,line:i+1,category,key:name,title,beforeHash:c.hash(Buffer.from(original)),afterHash:c.hash(Buffer.from(changed)),bodyPreserved:category==='state-chart'||stripHeading(original,title)===stripHeading(changed,title),changed:original!==changed});
 }
 for(const location of ['#static_txt','#txt_woman']){
  for(const [name,title]of Object.entries(legacyNames))editAssignment(location,name,title,'legacy-trait');
  for(const [name,title]of Object.entries(states))editAssignment(location,name,title,'state');
 }
 for(const [name,title]of Object.entries(charts))editAssignment('#variative',name,title,'state-chart');
 const textBody=bodies.get('jo9_traits'),textLines=textBody.split('\r\n');
 for(const [key,title]of Object.entries(newNames)){
  const pattern=new RegExp("^\\s*if \\$args\\[1\\] = '"+esc(key)+"': \\$result = ");
  const hits=textLines.map((line,i)=>({line,i})).filter(r=>pattern.test(r.line));assert.equal(hits.length,1,'Description key drift '+key);
  const {line,i}=hits[0],at=line.indexOf('$result = ')+10,entry=c.literals(line.slice(at))[0];assert(entry,'Incomplete text result '+key);
  const original=entry.text,changed=key==='attention'?'['+title+']<br>'+attentionBody:formatDescription(original,title);
  lineEdit('jo9_traits',line,line.slice(0,at+entry.start)+changed.replaceAll(entry.quote,entry.quote+entry.quote)+line.slice(at+entry.end));
  rows.push({location:'jo9_traits',line:i+1,category:'new-trait',key,title,beforeHash:c.hash(Buffer.from(original)),afterHash:c.hash(Buffer.from(changed)),bodyPreserved:key==='attention'?false:stripHeading(original,title)===stripHeading(changed,title),approvedBodyRewrite:key==='attention',changed:original!==changed});
 }
 const renameLocations=['menu_form','#static_base','jo9_traits','jo9_chaotic'];let renames=0;
 for(const location of renameLocations){
  for(const line of bodies.get(location).split('\r\n'))if(line.includes('주목욕구')){
   lineEdit(location,line,line.replaceAll('주목욕구','관심종자'));renames++;
   rows.push({location,category:'display-rename',oldName:'주목욕구',newName:'관심종자',internalIdentifierUnchanged:true});
  }
 }
 assert(renames===0||renames===4,'Expected exactly four old display labels');
 assert.equal(rows.filter(r=>r.category==='legacy-trait').length,134);
 assert.equal(rows.filter(r=>r.category==='new-trait').length,24);
 assert.equal(rows.filter(r=>r.category==='state').length,6);
 assert.equal(rows.filter(r=>r.category==='state-chart').length,4);
 assert(rows.every(r=>r.bodyPreserved!==false||r.approvedBodyRewrite),'Unexpected body change');
 const audit={sourceHash:doc.hash,scope:'Display headings, approved attention wording and four display labels only; no traits, values, generation conditions or effect equations changed.',counts:{legacyDefinitions:134,newTraitResults:24,stateDefinitions:6,stateChartHeadings:4,labelRenames:renames,edits:edits.length},sharedDescription:{variable:'танцовщица',title:legacyNames['танцовщица'],note:'The parent renderer may replace this common heading with the clicked row name.'},cacheDependencies:['#static_txt','#static_base','#variative'],rows};
 return {edits,audit,names:{legacy:legacyNames,newTraits:newNames,states,charts}};
}
function buildTraitEdits(doc){return build(doc).edits;}
function inspectTraitEdits(doc){const r=build(doc);return {audit:r.audit,names:r.names};}
module.exports={buildTraitEdits,inspectTraitEdits,formatDescription};
if(require.main===module){
 const fs=require('node:fs'),path=require('node:path');
 const input=process.argv[2]||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
 const d=c.parse(fs.readFileSync(input)),r=build(d);
 fs.writeFileSync(path.join(__dirname,'trait-audit.json'),JSON.stringify(r.audit,null,2)+'\n');
 fs.writeFileSync(path.join(__dirname,'trait-names.json'),JSON.stringify(r.names,null,2)+'\n');
 const clone={...d,lines:d.lines.slice()};
 for(const e of r.edits){const l=clone.locations.find(l=>l.name===e.location);const b=c.shift(clone.lines[l.body],5);assert.equal(b.split(e.old).length-1,1);clone.lines[l.body]=c.shift(b.replace(e.old,e.new),-5);}
 const round=c.parse(c.serialize(clone));assert.equal(buildTraitEdits(round).length,0,'Display edits must be idempotent');
 console.log(JSON.stringify({status:'BUILT_AND_REPLAYED_IN_MEMORY',runtimeWritten:false,...r.audit.counts,idempotent:true}));
}
