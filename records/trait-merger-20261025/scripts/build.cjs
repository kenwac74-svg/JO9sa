'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),z=require('node:zlib'),cp=require('node:child_process');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/jo9-trait-merger-20261025',rec=repo+'/records/trait-merger-20261025',src=__dirname;
const core=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'),cr=s=>s.replace(/\r?\n/g,'\r\n');
const id='2026-10-25_trait_merge_exclusions',marker='TRAIT_MERGE_EXCLUSIONS_20261025';
function protect(){return [game+'/jack.qsp',game+'/css/base.css',game+'/css/jo9_traits_view.css',game+'/content/js/jo9_traits_view.js',game+'/FastQSP.ini',game+'/../FastQSP.ini','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/css/base.css',...fs.readdirSync(game+'/save').filter(n=>/\.sav$/i.test(n)).map(n=>game+'/save/'+n)].filter(fs.existsSync).map(path=>({path,sha256:core.hash(fs.readFileSync(path))}));}
if(process.argv[2]==='prepare'){
 assert(!fs.existsSync(tmp),'Review existing task temp before preparing');fs.mkdirSync(tmp+'/patches',{recursive:true});fs.mkdirSync(rec+'/scripts',{recursive:true});fs.mkdirSync(rec+'/evidence',{recursive:true});
 const raw=fs.readFileSync(game+'/jack.qsp');assert.deepEqual(core.serialize(core.parse(raw)),raw);qa.inspectWorld(raw);
 fs.writeFileSync(tmp+'/before.qsp',raw);fs.writeFileSync(rec+'/before.qsp.gz',z.gzipSync(raw,{level:9}));assert.deepEqual(z.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz')),raw);
 write(rec+'/inputs.json',protect());fs.copyFileSync(src+'/PLAN_KO.md',rec+'/PLAN_KO.md');
 console.log(JSON.stringify({prepared:true,baseline:core.hash(raw),protected:protect().length}));
}else if(process.argv[2]==='build'){
 const baseline=fs.readFileSync(tmp+'/before.qsp');let d=core.parse(baseline);const edits=[],touched=new Set();
 const loc=name=>{const l=d.locations.find(x=>x.name===name);assert(l,'Missing '+name);return l;};
 const get=name=>core.shift(d.lines[loc(name).body],5);
 const edit=(location,old,nw,count=1)=>{old=cr(old);nw=cr(nw);assert(old.length);const body=get(location),n=body.split(old).length-1;assert.equal(n,count,location+' exact anchor '+old.slice(0,100));d.lines[loc(location).body]=core.shift(body.split(old).join(nw),-5);edits.push({location,field:'body',old,new:nw,count});touched.add(location);};
 const ctx={get,edit};const modules={};for(const name of ['attention','activity','exclusions'])modules[name]=require('./'+name+'/implement.cjs').apply(ctx);
 const dispatch="\r\nif $args[0] = 'repair':\r\n gs 'jo9_traits', 'attention_repair', $args[1]\r\n gs 'jo9_traits', 'activity_repair', $args[1]\r\n gs 'jo9_traits', 'repair_exclusions', $args[1]\r\n exit\r\nend\r\n";
 edit('jo9_traits',get('jo9_traits'),get('jo9_traits')+dispatch);
 for(const [fn,condition]of [['$dyn_calc_slave_attrs',"dynslave_state > CONST_INT['no_slave']"],['$update_slave_price',"dynslave_state ! CONST_INT['no_slave']"],['$update_slave_features_list',"dynslave_state > CONST_INT['no_slave']"]]){
  const anchor=fn+' = {\r\n\tif '+condition+':';edit('#static_base',anchor,anchor+"\r\n\t\tgs 'jo9_traits', 'repair', 'dynslave'");
 }
 edit('$newloc','if jo9_traits_revision < 2:\r\n jo9_traits_revision = 2','if jo9_traits_revision < 3:\r\n jo9_traits_revision = 3');
 edit('$newloc'," code_defined['interaction_result_make_slave_do'] = 0"," code_defined['interaction_result_make_slave_do'] = 0\r\n first_visit['interaction_result'] = 0");
 edit('$newloc',"   gs 'jo9_traits_personality', 'gradecheck', 'dynslave'","   gs 'jo9_traits', 'repair', 'dynslave'\r\n   gs 'jo9_traits_personality', 'gradecheck', 'dynslave'");
 for(const name of [...touched]){let body=get(name),n=1,prefix;do{prefix=body.split('\r\n').slice(0,n++).join('\r\n');}while(!prefix||body.split(prefix).length!==2);edit(name,prefix,'! JO9 MOD START '+marker+'\r\n'+prefix);body=get(name);n=1;let suffix;do{suffix=body.split('\r\n').slice(-n++).join('\r\n');}while(!suffix||body.split(suffix).length!==2);edit(name,suffix,suffix+'\r\n! JO9 MOD END '+marker);}
 const raw=core.serialize(d);qa.inspectWorld(raw);fs.writeFileSync(tmp+'/candidate.qsp',raw);
 const original=core.parse(baseline),bodies=[...touched].map(name=>({name,old:core.shift(original.lines[original.locations.find(l=>l.name===name).body],5),new:get(name)}));
 const coalesced=cp.spawnSync('py',['-3','-X','utf8',src+'/coalesce.py'],{input:JSON.stringify(bodies),encoding:'utf8',timeout:120000,maxBuffer:50*1024*1024});assert.equal(coalesced.status,0,coalesced.stderr);const finalEdits=JSON.parse(coalesced.stdout);
 const replay=new Map(bodies.map(x=>[x.name,x.old]));for(const h of finalEdits){const value=replay.get(h.location);assert.equal(value.split(h.old).length-1,1,'Final hunk exact replay '+h.location);replay.set(h.location,value.replace(h.old,h.new));assert.equal(get(h.location).split(h.new).length-1,1,'Final hunk exact idempotence '+h.location);}for(const b of bodies)assert.equal(replay.get(b.name),b.new,'Full body exact replay '+b.name);
 const patch={id,description:'승인된2특성통합/5배제. 긍정우선충돌정리, 비표준값/무관한특성보존, 신규부여검사와보상·제거중복방지. WORK전용.',before_sha256:core.hash(baseline),after_sha256:core.hash(raw),edits:finalEdits};write(tmp+'/patches/'+id+'.json',patch);write(rec+'/patch.json',patch);write(rec+'/build.json',{baseline:patch.before_sha256,candidate:patch.after_sha256,changed:[...touched],locations:d.locations.length,moduleEditCounts:Object.fromEntries(Object.entries(modules).map(([k,v])=>[k,v?.changes?.length??v?.changedLocations?.length??0])),stagedEdits:edits.length,finalHunks:finalEdits.length});
 console.log(JSON.stringify({built:true,candidate:patch.after_sha256,locations:d.locations.length,changed:[...touched],edits:finalEdits.length}));
}else if(process.argv[2]==='restore'){
 assert(!fs.existsSync(tmp),'Review existing task temp before restoring');const patch=read(rec+'/patch.json'),before=z.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz'));assert.equal(core.hash(before),patch.before_sha256);
 fs.mkdirSync(tmp+'/patches',{recursive:true});fs.writeFileSync(tmp+'/before.qsp',before);fs.copyFileSync(rec+'/patch.json',tmp+'/patches/'+id+'.json');const d=core.parse(before);
 for(const h of patch.edits){const l=d.locations.find(x=>x.name===h.location),body=core.shift(d.lines[l.body],5);assert.equal(body.split(h.old).length-1,h.count);d.lines[l.body]=core.shift(body.split(h.old).join(h.new),-5);}const raw=core.serialize(d);assert.equal(core.hash(raw),patch.after_sha256);qa.inspectWorld(raw);fs.writeFileSync(tmp+'/candidate.qsp',raw);console.log(JSON.stringify({restoredIsolatedCandidate:true,workWritten:false,candidate:patch.after_sha256}));
}else throw Error('prepare / build / restore');
module.exports={repo,game,tmp,rec,src,core,qa,read,write,cr,id,marker,protect};
