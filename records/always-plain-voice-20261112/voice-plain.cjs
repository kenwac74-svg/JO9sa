const fs=require('fs'),z=require('zlib'),a=require('assert/strict');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',D=R+'/records/always-plain-voice-20261112',T='G:/Codex/tmp/always-plain-voice-20261112',id='2026-11-12_zzz_always_plain_voice';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),sv=require(R+'/tools/qa/save-codec.cjs');
const ids=[3002,2610,2620,3010,3021,3023,2621,3012],rd=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),wr=(p,o)=>fs.writeFileSync(p,JSON.stringify(o,null,2)+'\n'),q=s=>"'"+s.replaceAll("'","''")+"'",nl=s=>s.replace(/\r?\n/g,'\r\n');
const body=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),put=(d,n,s)=>d.lines[d.locations.find(l=>l.name===n).body]=c.shift(nl(s),-5),fn=(d,n)=>{const m=body(d,'#dynamic').match(new RegExp('^\\$'+n+' = \\{\\r\\n[\\s\\S]*?^\\}', 'm'));a(m,n);return m[0];};
function fixture(raw,stage){
 const d=c.parse(raw),dyn=body(d,'#dynamic'),names=[...dyn.matchAll(/^\$(voice_\w+) = \{/gm)].map(m=>m[1]);
 let start=`killall\n$onnewloc=''\n$ongload=''\n$counter=''\nsettimer 0\nqa_checks=0\nqa_failed=0\ngs '#dynamic'\n`;
 const reps=[[0,0,4,4,'ice'],[2,2,2,2,'plain'],[4,4,0,0,'fragile']];
 for(const n of [...ids,2576])for(const occ of ['maid','nurse','thief'])for(const [te,se,eg,pr,style]of reps){const want=ids.includes(n)?3:occ==='maid'?1:occ==='thief'?3:2;start+=`$qa_profile=$dyneval($voice_profile,${q(occ)},${te},${se},${eg},${pr},${n})\nqa_checks+=1\nif $qa_profile!${q(style+'_'+want)}: qa_failed+=1\n`;}
 start+=`if qa_failed>0: savegame 'qa.sav' & msg 'FAIL plain routing '+str(qa_failed) & exit\n`;
 // Existing cached helpers must reload through the real interaction hook.
 const hook=body(d,'interaction').split('\r\n').find(x=>x.includes("instr($voice_native,'VOICE_ARGON_NATIVE_V5')"));a(hook);
 start+=`$voice_profile={'OLD_PROFILE'}\n$voice_native={ ! VOICE_ARGON_NATIVE_V5\n}\n$voice_impression={ ! VOICE_ARGON_FLOW_V7\n}\n$voice_native_stored={'jo9_json_ko'}\n$voice_native_moods={'old'}\n$voice_relation_line={'VOICE_ARGON_RELATION_FLOW_V9'}\n${hook}\nqa_checks+=1\nif instr($voice_profile,'VOICE_ALWAYS_PLAIN_20261112')=0: qa_failed+=1\n`;
 // Actual native wrapper must select the speaker, not the other character's ID.
 start+=`gs '#txt_man','jo9_voice_fragment_data'\n$slave_name='QA'\n$assistant_name='QA_A'\nslave['temper']=2\nslave['sensitivity']=2\nslave['ego']=2\nslave['pride']=2\nassistant['temper']=2\nassistant['sensitivity']=2\nassistant['ego']=2\nassistant['pride']=2\nslave['moral']=3\nassistant['moral']=3\nslave['mood']=1\nassistant['mood']=1\n$slave_occupation='maid'\n$assistant_occupation='maid'\n$slave_psy_status='obedient'\n$assistant_psy_status='obedient'\nsa_rel=2\n`;
 const fragments=dyn; a(fragments.includes('$voice_native_actor'));
 // Inspect selected profile inside a test-only wrapper; retain all real selector logic.
 for(const [sid,aid,actor,want] of [[3002,2576,'slave',3],[2576,3002,'slave',1],[2576,3002,'slave1',3],[3002,2576,'slave1',1]]){
 start+=`slave_type=${sid}\nassistant_type=${aid}\n$qa_seen=''\n$qa_result=$dyneval($voice_native,'1111_world_prehistoric_1','ORIGINAL',${q(actor)},0)\nqa_checks+=1\nif val(mid($qa_seen,len($qa_seen),1))!${want}: qa_failed+=1\n`;
 }
 if(stage==='after'){
 for(const state of ['hateful','frightened','obedient','servile','docile'])start+=`slave_type=3002\n$slave_psy_status=${q(state)}\n$qa_result=$dyneval($voice_native,'1113_comfort_need','ORIGINAL','slave',0)\nqa_checks+=1\nif $qa_result='ORIGINAL' or instr($qa_result,'주세요')>0 or instr($qa_result,'네요')>0 or instr($qa_result,'돼요')>0: qa_failed+=1\n`;
 const copy=rd(D+'/plain-copy.json');for(const row of copy.filter(x=>x.old.includes('무서워요')||x.old.includes('해 주세요')||x.old.includes('모르겠어요')).slice(0,6))start+=`$qa_result=func('jo9_plain_voice',3002,${q(row.old)})\nqa_checks+=1\nif $qa_result!${q(row.text)}: qa_failed+=1\n$qa_result=func('jo9_plain_voice',2576,${q(row.old)})\nqa_checks+=1\nif $qa_result!${q(row.old)}: qa_failed+=1\n`;
 const cases=rd(D+'/aliases.json');for(const row of cases){for(const old of row.aliases.slice(0,2))start+=`slave_type=${row.type}\n$qa_result=$dyneval($voice_native_stored,${q(row.category)},${q(old)})\nqa_checks+=1\nif $qa_result!${q(row.text)}: qa_failed+=1\n`;}
 start+=`slave_type=3002\n$qa_result=$dyneval($voice_native_stored,'world','USER_EDIT_KEEP')\nqa_checks+=1\nif $qa_result!'USER_EDIT_KEEP': qa_failed+=1\nslave_type=2576\n$qa_result=$dyneval($voice_plain_stored,2576,'world','OTHER_KEEP')\nqa_checks+=1\nif $qa_result!'OTHER_KEEP': qa_failed+=1\nqa_checks+=1\nif slave['temper']!2 or slave['sensitivity']!2 or slave['ego']!2 or slave['pride']!2 or slave['moral']!3 or assistant['moral']!3 or slave['mood']!1 or assistant['mood']!1: qa_failed+=1\nqa_checks+=1\nif arrsize('jo9_vf_actor_type')>0: qa_failed+=1\n`;
 }
 start+=`savegame 'qa.sav'\nif qa_failed>0: msg 'FAIL plain voice '+str(qa_failed) & exit\nmsg 'JO9_QA_PLAIN_${stage}_COMPLETE'\nexit`;
 const dir=T+'/'+stage;fs.mkdirSync(dir,{recursive:true});fs.copyFileSync(G+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 const helpers=names.map(n=>{let s=fn(d,n);if(n==='voice_native_actor')s=s.replace(/(\$jo9_vn_profile=.+)/,m=>m+'\r\n $qa_seen=$jo9_vn_profile');return s;}).join('\r\n');
 const locs=[['Start',start],['#dynamic',helpers],['#txt_man',body(d,'#txt_man')],['jo9_json_ko',body(d,'jo9_json_ko')]];if(d.locations.some(x=>x.name==='jo9_plain_voice'))locs.push(['jo9_plain_voice',body(d,'jo9_plain_voice')]);
 const lines=['QSPGAME','','',c.shift(String(locs.length),-5)];for(const[n,s]of locs)lines.push(c.shift(n,-5),'',c.shift(nl(s),-5),c.shift('0',-5));lines.push('');const out=c.serialize({lines});qa.inspectWorld(out);fs.writeFileSync(dir+'/voice.qsp',out);wr(dir+'/plan.json',[{name:'voice',file:dir+'/voice.qsp',marker:'JO9_QA_PLAIN_'+stage+'_COMPLETE',checkpoint:'8 identities x3 occupations x3 personalities, non-target controls, cache refresh, actual slave/assistant speaker routing, exact legacy biography aliases'}]);
}
if(process.argv[2]==='baseline'){
 fs.mkdirSync(D,{recursive:true});fs.mkdirSync(T+'/mods',{recursive:true});const raw=fs.readFileSync(G+'/jack.qsp');a.equal(c.hash(raw),c.hash(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));qa.inspectWorld(raw);fs.writeFileSync(D+'/baseline.qsp.gz',z.gzipSync(raw));fs.writeFileSync(D+'/manifest.before.json.gz',z.gzipSync(fs.readFileSync(R+'/assets/runtime-source-2.4.1.json')));wr(D+'/verification.json',{before:c.hash(raw)});fixture(raw,'before');console.log('RED fixture prepared');
}
if(process.argv[2]==='patch'){
 a(rd(T+'/before/client-results.json').some(x=>!x.pass));const raw=z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz'));a.equal(c.hash(raw),c.hash(fs.readFileSync(G+'/jack.qsp')));const d=c.parse(raw),edits=[];
 const edit=(loc,old,nu)=>{a.equal(body(d,loc).split(old).length-1,1,old.slice(0,90));put(d,loc,body(d,loc).replace(old,()=>nu));edits.push({location:loc,field:'body',old,new:nl(nu),count:1,patchId:'VOICE_ALWAYS_PLAIN_20261112'});};
 let old=fn(d,'voice_profile');edit('#dynamic',old,old.replace(" jo9_voice_tone_code = 2"," ! JO9 MOD START VOICE_ALWAYS_PLAIN_20261112\r\n jo9_voice_tone_code = 2").replace(" $result = $jo9_voice_type",` if instr('|${ids.join('|')}|','|'+str(args[5])+'|')>0: jo9_voice_tone_code=3\r\n ! JO9 MOD END VOICE_ALWAYS_PLAIN_20261112\r\n $result = $jo9_voice_type`));
 old=fn(d,'voice_impression');edit('#dynamic',old,old.replace("slave['pride'])","slave['pride'],slave_type)"));
 old=fn(d,'voice_native_actor');edit('#dynamic',old,old.replace("dynslave['pride'])","dynslave['pride'],dyneval('result='+$jo9_vn_memory_actor+'_type'))"));
 old=body(d,'interaction').split('\r\n').find(s=>s.includes("instr($voice_native,'VOICE_ARGON_NATIVE_V5')"));edit('interaction',old,old.replace(": gs '#dynamic'"," or instr($voice_profile,'VOICE_ALWAYS_PLAIN_20261112')=0: gs '#dynamic'"));
 const manual=fs.readFileSync(R+'/records/handoff-gap-audit-20261112/json-manual-comparison.jsonl','utf8').trim().split('\n').map(JSON.parse).find(x=>x.manual).differences;
 const rewritten={
 '2621_kyaru.json':{
 seed_world_description:'솔직히 인정해. 내가 어디서 왔는지는 관심도 없고, 그저 내 입을 열게 하려는 속셈이잖아! 난 검과 마법의 세계에서 왔어. 머리가 나쁘면 살아남을 수 없는 곳이지. 시시한 질문은 그만하고 본론으로 들어가. 잘 대해 주면 나도 그만큼은 해 줄 테니까...<!-- #nwtx -->',
 seed_family_description:'흥! 남의 사정에 함부로 코 들이밀지 마! 내가 츤데레라는 걸 잊었어?! 날 고향으로 돌려보낼 방법을 찾아 준다면, 그때는 고마움의 표시로 내 소중한 사람들을 소개해 줄게. 하지만 이 구덩이에 있는 동안엔 내 사생활을 캐물을 생각 마!<!-- #nwtx -->',
 seed_occupation_description:'내 예전 여주인 알지?! 그 잘난 자존심은 다 허세고 사실은 무른 사람이야... 그래도 날 잘 챙겨 줬기에 나도 온갖 일을 도맡으며 보답했지. 필요한 일은 뭐든 할 줄 알아. 내 능력을 키워 주겠다면 말리진 않겠지만, 나한테 잘 보이려고 너무 무리하진 마!<!-- #nwtx -->'},
 '3023_Iris.json':{
 seed_world_description:'나는 미드가르 왕국의 제1왕녀이자 홍련 기사단장, 이리스 미드가르다. 납치된 여동생 알렉시아를 찾아 나섰지. 무슨 일이 있어도 반드시 동생을 찾아낼 거다!<!-- #nwtx -->',
 seed_family_description:'나는 왕가의 핏줄이자 아버지의 영토를 물려받을 후계자다. 모두의 기대가 늘 내 어깨를 무겁게 짓누르지. 하지만 나는 통치자이기 전에 전사다. 책상 앞에 앉아 있기보다 치열한 전장 한가운데 있을 때 비로소 나다울 수 있어.<!-- #nwtx -->',
 seed_occupation_description:'무엇을 하고 싶냐고? 무예를 단련하며 여동생을 찾고 내 왕국을 구하고 싶다. 내게는 막중한 책임이 있으니까. 동생을 찾는 일을 도와준다면 훨씬 협조적으로 대하겠어! 동생을 찾으면 그 애를 지도하고 돌보는 일도 직접 맡고 싶다.<!-- #nwtx -->'}};
 const strip=s=>s.replaceAll('<!-- #nwtx -->',''),aliases=[];const jsonChanges=[];
 for(const type of ids){const file=fs.readdirSync(G+'/json/slaves').find(f=>f.startsWith(type+'_')&&f.endsWith('.json'));a(file);const rawj=fs.readFileSync(G+'/json/slaves/'+file),j=rd(G+'/json/slaves/'+file);if(rewritten[file]){fs.writeFileSync(D+'/'+file+'.before.gz',z.gzipSync(rawj));for(const[k,v]of Object.entries(rewritten[file]))jsonChanges.push({file,field:k,old:j[k],new:v});}
 for(const [field,value]of Object.entries(j)){const match=field.match(/^seed_(world|family|occupation)_description(W?)$/);if(!match)continue;const text=rewritten[file]?.[field]||value,prior=manual.filter(x=>x.file===file&&x.field===field).map(x=>x.expected);aliases.push({type,file,field,category:match[1],text,aliases:[...new Set([value,...prior,text].map(strip))]});}
 }
 wr(D+'/aliases.json',aliases);wr(D+'/json-changes.json',jsonChanges);
 let helper="! JO9 MOD START VOICE_PLAIN_STORED_20261112\n$voice_plain_stored = {\n $result=$args[2]\n";
 for(const row of aliases)helper+=` if args[0]=${row.type} and $args[1]=${q(row.category)}:\n  if ${row.aliases.map(s=>`$replace($args[2],'<!-- #nwtx -->','')=${q(s)}`).join(' or ')}: $result=${q(row.text)} & exit\n end\n`;
 helper+='}\n! JO9 MOD END VOICE_PLAIN_STORED_20261112\n';
 old=fn(d,'voice_native_stored');edit('#dynamic',old,nl(helper)+old.replace(" $result=func('jo9_json_ko', 'text', $args[1])"," $result=func('jo9_json_ko', 'text', $args[1])\r\n $result=$dyneval($voice_plain_stored,slave_type,$args[0],$result)"));
 // Static complete-utterance copy: runtime does exact lookups, never suffix rewriting.
 const convert=require('./voice-copy.cjs'),bank=body(d,'#txt_man'),tones=new Map([...bank.matchAll(/^voice_fragment_tone\['([^']+)'\]=(\d+)/gm)].map(m=>[m[1],+m[2]])),copy=new Map();
 const add=s=>{const nu=convert(s);if(s!==nu&&/[가-힣]/.test(s))copy.set(s,nu);};
 for(const m of bank.matchAll(/^\$voice_fragment_text\['([^']+)'\]='((?:[^']|'')*)'/gm))if(tones.get(m[1])===3)add(m[2].replaceAll("''","'"));
 for(const line of bank.split('\r\n'))if(!line.startsWith('$voice_fragment_')){const m=line.match(/^\$[^=\r\n]+=\s*'((?:[^']|'')*)'\s*(?:&!.*)?$/);if(m)add(m[1].replaceAll("''","'"));}
 old=body(d,'chose_answer');const direct=old.split('\r\n').filter(s=>s.includes('$text')&&s.includes('=')&&!s.includes('$dyneval($voice_native')&&/[가-힣]/.test(s));for(const line of direct)for(const m of line.matchAll(/'((?:[^']|'')*)'/g))add(m[1].replaceAll("''","'"));
 for(const line of direct){const at=line.indexOf('=');edit('chose_answer',line,line.slice(0,at+1)+" func('jo9_plain_voice',slave_type,"+line.slice(at+1).trim()+')');}
 old=fn(d,'voice_profile');edit('#dynamic',old,old.replace(' ! JO9 MOD START VOICE_ALWAYS_PLAIN_20261112',' jo9_vf_actor_type=args[5]\r\n ! JO9 MOD START VOICE_ALWAYS_PLAIN_20261112'));
 // Insert once immediately before final cleanup (not the repeated pool resets).
 old=fn(d,'voice_pick_fragment');
 const p=old.lastIndexOf(" killvar '$jo9_vfp_candidates'");a(p>0);edit('#dynamic',old,old.slice(0,p)+" $result=func('jo9_plain_voice',jo9_vf_actor_type,$result)\r\n"+old.slice(p));
 for(const name of ['voice_impression','voice_native_actor']){old=fn(d,name);edit('#dynamic',old,old.slice(0,-1)+" killvar 'jo9_vf_actor_type'\r\n}");}
 let mapper="! JO9 MOD START VOICE_PLAIN_COPY_20261112\r\n$result=$args[1]\r\nif instr('|"+ids.join('|')+"|','|'+str(args[0])+'|')=0: exit\r\n";
 const lengths=new Map(),dynamicRows=[];for(const[s,nu]of copy){if(s.includes('<<')){dynamicRows.push([s,nu]);continue;}const size=s.length;if(!lengths.has(size))lengths.set(size,[]);lengths.get(size).push([s,nu]);}
 for(const[size,rows]of lengths){mapper+=`if len($args[1])=${size}:\r\n`;for(const[s,nu]of rows)mapper+=` if $args[1]=${q(s)}: $result=${q(nu)} & exit\r\n`;mapper+='end\r\n';}for(const[s,nu]of dynamicRows)mapper+=`if $args[1]=${q(s)}: $result=${q(nu)} & exit\r\n`;mapper+='! JO9 MOD END VOICE_PLAIN_COPY_20261112\r\n';
 const addLocations=[{name:'jo9_plain_voice',desc:'',body:mapper,actions:[]}];d.lines.splice(d.lines.length-1,0,c.shift('jo9_plain_voice',-5),'',c.shift(mapper,-5),c.shift('0',-5));d.lines[3]=c.shift(String(d.locations.length+1),-5);
 wr(D+'/plain-copy.json',[...copy].map(([old,text])=>({old,text})));fs.copyFileSync('./voice-copy.cjs',D+'/voice-copy.cjs');
 const candidate=c.serialize(d);qa.inspectWorld(candidate);const base=c.parse(raw),finalEdits=[...new Set(edits.map(e=>e.location))].map(location=>({location,field:'body',old:body(base,location),new:body(d,location),count:1,patchId:'VOICE_ALWAYS_PLAIN_20261112'}));wr(R+'/mods/'+id+'.json',{id,status:'APPROVED',before_sha256:c.hash(raw),after_sha256:c.hash(candidate),description:'승인8명 일반 대화 반말 전용 프로필, 실제 화자별 적용과 기존 캐시 갱신, 알려진 옛 소개문만 표시 호환. 관계 의미/육성 수치/사용자 편집 보존.',add_locations:addLocations,edits:finalEdits});fs.copyFileSync(R+'/mods/'+id+'.json',T+'/mods/'+id+'.json');fs.writeFileSync(T+'/candidate.qsp',raw);wr(D+'/verification.json',{before:c.hash(raw),after:c.hash(candidate),edits:finalEdits.length,jsonFields:jsonChanges.length,plainUtterances:copy.size});fixture(candidate,'after');console.log('Candidate '+c.hash(candidate)+' static utterances '+copy.size);
}
if(process.argv[2]==='finish'){
 const v=rd(D+'/verification.json'),m=rd(R+'/mods/'+id+'.json'),raw=fs.readFileSync(G+'/jack.qsp');a.equal(c.hash(raw),v.after);a.equal(c.hash(fs.readFileSync(T+'/candidate.qsp')),v.after);a(rd(T+'/after/client-results.json').every(x=>x.pass));qa.inspectWorld(raw);
 const restored=c.parse(raw);for(const e of [...m.edits].reverse()){a.equal(body(restored,e.location),e.new);put(restored,e.location,e.old);}const added=restored.locations.find(x=>x.name==='jo9_plain_voice');a(added);restored.lines.splice(added.body-2,4);restored.lines[3]=c.shift(String(restored.locations.length-1),-5);a(c.serialize(restored).equals(z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz'))));
 const meta=rd(R+'/assets/runtime-source-2.4.1.json');a.equal(meta.sourceQspSha256,v.before);
 for(const group of [...new Set(rd(D+'/json-changes.json').map(x=>x.file))]){const p=G+'/json/slaves/'+group,jraw=fs.readFileSync(p),j=rd(p),baseline=z.gunzipSync(fs.readFileSync(D+'/'+group+'.before.gz'));a(jraw.equals(baseline));const entry=meta.files.find(x=>x.runtimePath.replaceAll('\\','/')==='json/slaves/'+group);a(entry,group);const source=R+'/'+entry.repositoryPath;a.equal(c.hash(fs.readFileSync(source)),c.hash(jraw));let text=jraw.toString('utf8');for(const row of rd(D+'/json-changes.json').filter(x=>x.file===group)){a.equal(j[row.field],row.old);a.equal(text.split(JSON.stringify(row.old)).length-1,1);text=text.replace(JSON.stringify(row.old),()=>JSON.stringify(row.new));j[row.field]=row.new;}a.deepEqual(JSON.parse(text.replace(/^\uFEFF/,'')),j);fs.writeFileSync(p,text);fs.writeFileSync(source,text);entry.sha256=c.hash(Buffer.from(text));entry.bytes=Buffer.byteLength(text);}
 fs.copyFileSync(G+'/jack.qsp',R+'/assets/runtime/2.4.1/jack.qsp');meta.sourceQspSha256=v.after;for(const f of meta.files)if(f.runtimePath==='jack.qsp'){f.sha256=v.after;f.bytes=raw.length;}meta.latestAlwaysPlainVoice={date:'2026-11-12',mod:id,report:'records/always-plain-voice-20261112/REPORT_KO.md',types:ids};wr(R+'/assets/runtime-source-2.4.1.json',meta);
 for(const stage of ['before','after'])for(const f of fs.readdirSync(T+'/'+stage))if(/\.log$|client-results\.json$/.test(f))fs.copyFileSync(T+'/'+stage+'/'+f,D+'/'+stage+'-'+f);
 const save=sv.parse(fs.readFileSync(T+'/after/qa.sav'));a.equal(+sv.value(save,'qa_failed')[0],0);v.nativeChecks=+sv.value(save,'qa_checks')[0];v.addedQspBytes=raw.length-z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz')).length;wr(D+'/verification.json',v);fs.copyFileSync('./voice-plain.cjs',D+'/voice-plain.cjs');console.log(JSON.stringify(v));
}
if(process.argv[2]==='preflight'){
 const v=rd(D+'/verification.json'),meta=rd(R+'/assets/runtime-source-2.4.1.json');a.equal(c.hash(fs.readFileSync(G+'/jack.qsp')),v.before);a.equal(c.hash(fs.readFileSync(T+'/candidate.qsp')),v.after);a(rd(T+'/after/client-results.json').every(x=>x.pass));
 for(const file of [...new Set(rd(D+'/json-changes.json').map(x=>x.file))]){
 const entry=meta.files.find(x=>x.runtimePath.replaceAll('\\','/')==='json/slaves/'+file);a(entry,file);
 const current=fs.readFileSync(G+'/json/slaves/'+file),original=z.gunzipSync(fs.readFileSync(D+'/'+file+'.before.gz'));
 a(current.equals(original));a.equal(c.hash(current),c.hash(fs.readFileSync(R+'/'+entry.repositoryPath)));
 }
 for(const row of rd(D+'/plain-copy.json')){for(const re of [/<[^>]+>/g,/\{PH_\d+\}/g,/<<[\s\S]*?>>/g])a.deepEqual(row.old.match(re),row.text.match(re));}
 console.log('WORK/source inputs, six JSON fields and display tokens preserved');
}
