'use strict';
// Selected text and filename revision; no engine execution or save migration.
const fs=require('node:fs'),path=require('node:path');
const core=require('../text-workshop/core.cjs'),builder=require('./build-qsp.cjs');
const repo=path.resolve(__dirname,'../..');
const game='C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game';
const out=path.join(repo,'records/translations/json-tone-20261102');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const count=(s,t)=>s.split(t).length-1;
const normalize=s=>s.replaceAll('주인님이나 여주인님','주인님').replaceAll('주인님, 여주인님','주인님들').replaceAll('여주인님','주인님');
function within(root,rel){const p=path.resolve(root,rel),r=path.relative(path.resolve(root),p);if(!r||r.startsWith('..')||path.isAbsolute(r))throw Error('Path escapes target: '+rel);return p;}
function rawFields(raw,replacements){
 let changed=0;
 const result=raw.replace(/("(?:\\.|[^"\\])*"\s*:\s*)("(?:\\.|[^"\\])*")/g,(all,head,value)=>{
  const key=JSON.parse(head.slice(0,head.indexOf(':')).trim());
  if(!replacements.has(key))return all;
  changed++;return head+JSON.stringify(replacements.get(key));
 });
 if(changed!==replacements.size)throw Error('JSON literal replacement mismatch');
 return result;
}
function replay(raw,patch){
 const d=core.parse(raw),lines=d.lines.slice();
 for(const e of patch.edits){const l=d.locations.find(x=>x.name===e.location);if(!l)throw Error('Missing location');const at=l[e.field],s=core.shift(lines[at],5),a=count(s,e.old),b=count(s,e.new);if(a===e.count)lines[at]=core.shift(s.split(e.old).join(e.new),-5);else if(!(a===0&&b===e.count))throw Error('Patch cannot replay/reapply: '+e.location);}
 return core.serialize({lines});
}
function prepare(){
 if(fs.existsSync(path.join(out,'manifest.json')))throw Error('Prepared revision already exists; use --apply or inspect it');
 const inventory=read(path.join(repo,'tmp/json-character-inventory-20261102.json'));
 const review=read(path.join(repo,'tmp/json-tone-review-20261102.json'));
 const renames=inventory.inventory.filter(x=>x.numericBasename&&x.proposedFilename).map(x=>({old:x.file,new:x.proposedFilename,name:x.name,evidence:x.namingEvidence}));
 if(renames.length!==25)throw Error('Unexpected rename inventory');
 const names=fs.readdirSync(path.join(game,'json/slaves')).filter(x=>x.endsWith('.json'));
 const folded=new Set(names.map(x=>x.toLowerCase()));
 for(const r of renames){if(folded.has(r.new.toLowerCase()))throw Error('Rename target exists: '+r.new);if(parseInt(r.old)!==parseInt(r.new))throw Error('ID changed');}
 const rm=new Map(renames.map(x=>[x.old,x.new]));
 const erza={
  seed_world_description:'내 이름은 엘자입니다. 어스랜드라는 세계에서 페어리 테일 길드의 S급 마도사로 살았습니다. 마법으로 가득한 멋진 세계였지요. 왕국들이 있고, 하늘에는 드래곤이 날고, 사람들은 길드에 가입해 동료들과 의뢰를 수행하고 보수를 받았습니다. 공간 마법을 쓰다가 뭔가 잘못돼 이곳으로 오게 됐습니다.<!-- #nwtx -->',
  seed_family_description:'내 가족은 길드와 동료들입니다. 정말 보고 싶습니다... 혈육에 대해서는 실망스러운 기억뿐입니다. 아버지는 알지도 못했고, 어머니는 사악한 반인반룡의 마녀였습니다. 악하고 잔인한 사람이었지요... 나는 어머니와 싸워 이겼습니다. 더 할 얘기는 없습니다...<!-- #nwtx -->',
  seed_occupation_description:"내 별명은 '요정 여왕 엘자'입니다. 무슨 뜻인지 알겠습니까? 나는 기사라고요. 내 갑옷은 돌보다 단단하고, 온갖 무기를 능숙하게 다룰 줄 압니다. 다른 세계에 와서도 훈련하고 실력을 갈고닦고 싶습니다. 언젠가는 여길 벗어날 방법도 찾아낼 거고! 내 의지는 흔들리지 않을 겁니다. 이곳에서 살아남아 벗어나기 위해 당신을 따르겠지만, 나는 냉철하고 강한 사람이니 절대 굴복하지는 않을 겁니다!<!-- #nwtx -->"
 };
 const updates=new Map(),changes=[],aliases=new Map();let addressOccurrences=0;
 const payload=[];const backups=[];
 for(const name of names){
  const oldRel='json/slaves/'+name,newRel='json/slaves/'+(rm.get(name)||name),raw=fs.readFileSync(within(game,oldRel)),text=raw.toString('utf8'),j=JSON.parse(text.replace(/^\uFEFF/,'')),values=new Map();
  for(const [key,value]of Object.entries(j))if(typeof value==='string'){
   let next=normalize(value);addressOccurrences+=count(value,'여주인님');
   if(name==='2624_erza.json'&&Object.hasOwn(erza,key))next=erza[key];
   if(next!==value){values.set(key,next);changes.push({file:name,after_file:rm.get(name)||name,key,old:value,new:next});if(aliases.has(value)&&aliases.get(value)!==next)throw Error('Conflicting legacy alias');aliases.set(value,next);updates.set(value,next);}
  }
  if(!values.size&&!rm.has(name))continue;
  const next=values.size?Buffer.from(rawFields(text,values),'utf8'):raw;
  const after=JSON.parse(next.toString('utf8').replace(/^\uFEFF/,''));
  const restored={...after};for(const [key,value]of Object.entries(j))if(values.has(key))restored[key]=value;
  if(JSON.stringify(restored)!==JSON.stringify(j))throw Error('Unapproved field changed: '+name);
  if(values.size){const mask=new Map([...values.keys()].map(k=>[k,'JO9_SELECTED_LITERAL']));if(rawFields(text,mask)!==rawFields(next.toString('utf8'),mask))throw Error('Non-target JSON bytes changed: '+name);}
  const source='files/'+newRel;fs.mkdirSync(path.dirname(path.join(out,source)),{recursive:true});fs.writeFileSync(path.join(out,source),next);
  payload.push({before_path:oldRel,game_path:newRel,source,before_sha256:core.hash(raw),after_sha256:core.hash(next),bytes:next.length,kind:rm.has(name)?'rename':'text'});backups.push({rel:oldRel,raw});
 }
 const oldMap=read(path.join(repo,'records/translations/json-ko-20261102/migration-map.json'));
 const entries=oldMap.entries.map(x=>({old:x.old,new:updates.get(x.new)||normalize(x.new)}));
 for(const [old,value]of aliases)entries.push({old,new:value});
 const clean=builder.normalizeMap(entries);if(clean.length!==261)throw Error('Unexpected revised mapping count: '+clean.length);
 const before=fs.readFileSync(path.join(game,'jack.qsp')),doc=builder.inspect(before),lines=doc.lines.slice(),edits=[],changedLocations=[];
 for(const l of doc.locations){
  const old=core.shift(doc.lines[l.body],5);let next=old;
  if(l.name==='jo9_json_ko'){next=builder.helperBody(clean);if(old!==next)edits.push({location:l.name,field:'body',old,new:next,count:1});}
  else if(old.includes('여주인님')){
   if(!['interaction_city','#txt_2_woman'].includes(l.name))throw Error('Unreviewed QSP location: '+l.name);
   const oldLines=old.split('\r\n');
   next=oldLines.map(line=>{if(!line.includes('여주인님'))return line;let value=normalize(line);
    if(l.name==='interaction_city'&&line.includes('[당신]<br>&nbsp;여주인님?!... 대체 뭘 어떻게 헷갈린 거냐?!'))value=value.replace('[당신]<br>&nbsp;주인님?!... 대체 뭘 어떻게 헷갈린 거냐?!','[당신]<br>&nbsp;주인님이라고?!... 내가 네 주인이라는 게 무슨 소리냐?!');
    const n=count(old,line);if(n!==1)throw Error('QSP line anchor not unique');edits.push({location:l.name,field:'body',old:line,new:value,count:1});return value;
   }).join('\r\n');
   const a=core.literals(old),b=core.literals(next);if(a.length!==b.length)throw Error('QSP quote boundary changed');
   const skeleton=(s,ls)=>{for(const x of ls.slice().reverse())s=s.slice(0,x.start)+'TEXT'+s.slice(x.end);return s;};
   if(skeleton(old,a)!==skeleton(next,b))throw Error('Non-literal QSP code changed');
  }
  if(old!==next){lines[l.body]=core.shift(next,-5);changedLocations.push(l.name);}
 }
 const after=core.serialize({lines}),checked=builder.inspect(after);
 for(const l of doc.locations){const q=checked.locations.find(x=>x.name===l.name);if(!q)throw Error('Location removed');for(const key of ['desc','body'])if(!(key==='body'&&changedLocations.includes(l.name))&&doc.lines[l[key]]!==checked.lines[q[key]])throw Error('Unrelated location field changed');}
 if(doc.locations.length!==checked.locations.length)throw Error('Location count changed');
 const patch={id:'JSON_TONE_NAMES_20261102',before_sha256:core.hash(before),after_sha256:core.hash(after),edits};
 if(!replay(before,patch).equals(after)||!replay(after,patch).equals(after))throw Error('Patch replay/reapply failed');
 const helper=checked.locations.find(x=>x.name==='jo9_json_ko');
 if(core.shift(checked.lines[helper.body],5)!==builder.helperBody(clean))throw Error('Lookup table mismatch');
 if(clean.some(x=>x.new.includes('여주인님')))throw Error('Old address remains in lookup output');
 fs.writeFileSync(path.join(out,'files/jack.qsp'),after);payload.push({before_path:'jack.qsp',game_path:'jack.qsp',source:'files/jack.qsp',before_sha256:core.hash(before),after_sha256:core.hash(after),bytes:after.length,kind:'qsp_text'});backups.push({rel:'jack.qsp',raw:before});
 const stamp=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date()).replace(/\D/g,'');
 const backup=path.join(repo,'backups/before-json-tone-'+stamp+'_KST');
 for(const b of backups){const dest=within(backup,b.rel);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,b.raw);if(core.hash(fs.readFileSync(dest))!==core.hash(b.raw))throw Error('Backup mismatch');}
 for(const item of inventory.inventory){item.before_file=item.file;item.current_file=rm.get(item.file)||item.file;if(item.file==='8885_joker.json'||item.file==='8897_Sana.json'){item.dohnaConfirmedByQsp=true;item.additionalEvidence=[...(item.additionalEvidence||[]),{location:'interaction_city',line:item.file.startsWith('8885')?12002:12209,detail:'Dohna-specific Kula shop purchase creates this exact special_stock ID'}];}}
 inventory.scope='Pre-edit identity/settings audit with applied filename mapping; no settings invented';inventory.confirmedDohnaFiles=23;inventory.notes[2]='도나도나 23명 확정: 태그21명과 쿨라 상점 생성 코드로 확인한 조커8885·사나8897.';
 for(const group of [...review.approval_groups,...review.already_respectful_keep,...review.borderline_keep_and_flag,...review.already_approved])group.current_files=group.files.map(x=>rm.get(x)||x);
 review.already_approved[0].proposed_excerpt='내 이름은 엘자입니다.';
 const manifest={schema:1,id:patch.id,status:'prepared_verified',game,backup,prior_commit:'ca6ca6b61b276746bfe2de13a5daf713b3bfaff4',files:payload,renames,changed_fields:changes.length,json_address_occurrences:addressOccurrences,legacy_korean_aliases:aliases.size,map_entries:clean.length,qsp_changed_locations:changedLocations,validation:{json_parse:true,only_declared_fields_changed:true,json_other_bytes_preserved:true,rename_ids_preserved:true,case_insensitive_collisions:0,qsp_roundtrip:true,qsp_crlf:true,qsp_quote_boundaries:true,qsp_nonliteral_code_unchanged:true,unrelated_locations_preserved:true,patch_replay:true,patch_reapply:true,engine_run:false,visual_gameplay:false},notes:['Historic translation records remain immutable; this revision supersedes corresponding selected paths.','JSON/QSP old Korean aliases are display-only, exact-match strings; personal saves are not rewritten.','Names identify templates; this filename change does not implement unique acquisition.','Erza final defiance paragraph follows explicit user-authored adaptation.','Unapproved tone and missing-settings drafts remain unchanged.']};
 write(path.join(out,'manifest.json'),manifest);write(path.join(out,'text-changes.json'),changes);write(path.join(out,'migration-map.json'),{schema:1,entries:clean});write(path.join(out,'character-inventory.json'),inventory);write(path.join(out,'tone-review.json'),review);write(path.join(out,'renames.json'),renames);write(path.join(repo,'mods/2026-11-02_json_tone_names.json'),patch);
 fs.writeFileSync(path.join(repo,'tmp/rename-old-patterns-20261102.txt'),renames.map(x=>x.old).join('\n')+'\n');
 console.log(JSON.stringify({status:manifest.status,payload_files:payload.length,json_files:payload.length-1,renames:renames.length,fields:changes.length,address_occurrences:addressOccurrences,aliases:aliases.size,map_entries:clean.length,qsp:patch.after_sha256,backup},null,2));
}
function apply(){
 const m=read(path.join(out,'manifest.json'));
 if(m.game!==game)throw Error('Target root mismatch');
 for(const f of m.files){const old=within(game,f.before_path),dest=within(game,f.game_path),src=within(out,f.source);if(!fs.existsSync(old)||core.hash(fs.readFileSync(old))!==f.before_sha256)throw Error('Live file changed; preserve it: '+f.before_path);if(core.hash(fs.readFileSync(src))!==f.after_sha256)throw Error('Candidate changed');if(old!==dest&&fs.existsSync(dest))throw Error('Rename target already exists');const backup=within(m.backup,f.before_path);if(core.hash(fs.readFileSync(backup))!==f.before_sha256)throw Error('Missing valid backup');}
 for(const f of m.files){const old=within(game,f.before_path),dest=within(game,f.game_path),src=within(out,f.source);if(core.hash(fs.readFileSync(old))!==f.before_sha256)throw Error('Concurrent live change: '+f.before_path);if(f.kind==='rename')fs.renameSync(old,dest);else{const temporary=dest+'.jo9-tone-pending';if(fs.existsSync(temporary))throw Error('Temporary file already exists');fs.copyFileSync(src,temporary);fs.renameSync(temporary,dest);}if(core.hash(fs.readFileSync(dest))!==f.after_sha256)throw Error('Applied bytes mismatch');}
 const files=fs.readdirSync(path.join(game,'json/slaves')).filter(x=>x.endsWith('.json')),ids=new Set();
 for(const name of files){const id=parseInt(name);if(ids.has(id))throw Error('Duplicate numeric ID: '+id);ids.add(id);const j=read(path.join(game,'json/slaves',name));if(JSON.stringify(j).includes('여주인님'))throw Error('Old JSON address remains: '+name);}
 if(files.length!==1153)throw Error('JSON file count changed');
 for(const r of m.renames)if(fs.existsSync(path.join(game,'json/slaves',r.old))||!fs.existsSync(path.join(game,'json/slaves',r.new)))throw Error('Rename not complete');
 m.status='applied_and_verified';m.validation.live_hashes_match=m.files.length;m.validation.live_json_count=files.length;m.validation.duplicate_numeric_ids=0;m.validation.live_json_old_address_occurrences=0;write(path.join(out,'manifest.json'),m);console.log(JSON.stringify({status:m.status,...m.validation},null,2));
}
try{if(process.argv.includes('--apply'))apply();else prepare();}catch(e){console.error(e.stack);process.exitCode=1;}
