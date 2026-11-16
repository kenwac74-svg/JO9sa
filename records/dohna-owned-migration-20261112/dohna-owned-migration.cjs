const fs=require('fs'),z=require('zlib'),a=require('assert/strict');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',D=R+'/records/dohna-owned-migration-20261112',T='G:/Codex/tmp/dohna-owned-migration-20261112';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),sv=require(R+'/tools/qa/save-codec.cjs');
const id='2026-11-12_zzzzzzzz_dohna_owned_migration',loc='jo9_dohna_migrate',flag='jo9_dohna_preset_rev';
const rd=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),wr=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'),nl=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+s.replaceAll("'","''")+"'";
const body=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),put=(d,n,s)=>d.lines[d.locations.find(l=>l.name===n).body]=c.shift(nl(s),-5);
function append(d,name,s){a(!d.locations.some(l=>l.name===name));d.lines.splice(-1,0,c.shift(name,-5),'',c.shift(nl(s),-5),c.shift('0',-5));d.lines[3]=c.shift(String(d.locations.length+1),-5);return c.parse(c.serialize(d));}
const roles=['slave','assistant','prisoner','cow','room1','room2','room3','room4','farmhand','harpy','pig',...Array.from({length:18},(_,i)=>'iced_'+(i+1)),'snk_parked_slave'];
const ability=new Set(['beauty','stamina','sensitivity','temper','ego','pride','intellect','service','cook','secretary','expression','gladiatrix','nurse','art','music','calisthenics','anal_stretch']);
const groups={petting:['sub_hj','sub_fj','sub_hug','sub_paizuri'],oral:['sub_kiss','sub_tongue','sub_bj','sub_dt','sub_asslik'],penetration:['sub_vaginal','sub_anal','sub_fisting','anal_stretch'],orgy:['sub_threesome','sub_dp','sub_tp','sub_gangbang','sub_bukkake'],roleplay:['sub_seduce','sub_masturbation','sub_dildo','sub_exhibit','sub_humiliation'],fetishism:['sub_enema','sub_mazo','sub_selfpain','sub_piss','sub_kopro'],xenophily:['sub_arachnidSpider','sub_polypusvermin','sub_zoosex','sub_bestiality','sub_horse','sub_tentacles'],nipplefuck:['sub_nipplefuck'],lesbiansex:['sub_lesbiansex1','sub_lesbiansex2','sub_lesbiansex3','sub_lesbiansex4']};
function rules(){
 const map=new Map(Array.from({length:23},(_,i)=>[8877+i,{type:8877+i,keys:new Set()}]));
 for(const source of ['dohna-stats-20261112','dohna-traits-20261112','dohna-adult-presets-20261112'])for(const r of rd(R+'/records/'+source+'/plan.json').rows)for(const k of Object.keys(r.values||r.changes))map.get(r.type).keys.add(k);
 return [...map.values()].map(r=>{const file=fs.readdirSync(G+'/json/slaves').find(f=>f.startsWith(r.type+'_')),raw=fs.readFileSync(G+'/json/slaves/'+file),json=rd(G+'/json/slaves/'+file);return {type:r.type,file,hash:c.hash(raw),rules:[...r.keys].filter(k=>k!=='seed_psy_basic').map(k=>{a(k.startsWith('seed_'));const key=k.slice(5),value=json[k];a.equal(typeof value,'number',k);const mode=ability.has(key)||key.startsWith('sub_')||/_revealed$|_known$/.test(key)||key==='nymphomania'?'floor':key==='jo9_meiki_latent'?'latent':'set';return {key,value,mode};})};});
}
function source(p){let out=`! JO9 MOD START DOHNA_OWNED_MIGRATION_20261112\n! One per-actor revision, copied with the existing actor array. No seed/cache/progress overwrite.\nif $args[0]='all':\n local $j9dm_roles, j9dm_i\n`;for(const role of roles)out+=` $j9dm_roles[]=${q(role)}\n`;out+=` for j9dm_i=0 to arrsize('$j9dm_roles')-1:\n  gs '${loc}',$j9dm_roles[j9dm_i]\n end\n exit\nend\nif instr(${q('|'+roles.join('|')+'|')},'|'+$args[0]+'|')=0: exit\nlocal $j9dm_role=$args[0]\nlocal j9dm_type=dyneval('result = '+$j9dm_role+'_type')\nif j9dm_type<8877 or j9dm_type>8899: exit\nif dyneval('result = '+$j9dm_role+'_state')<=0: exit\nif dyneval('result = '+$j9dm_role+${q("['"+flag+"']")})>=1: exit\ndynamic $replace({\n`;
 for(const row of p.rows){out+=` if j9dmactor_type=${row.type}:\n`;for(const r of row.rules){const dest=`j9dmactor[${q(r.key)}]`;out+=r.mode==='latent'?`  if j9dmactor['jo9_meiki_known']=0 and j9dmactor['virginity']!4: ${dest}=max(${dest},${r.value})\n`:r.mode==='floor'?`  ${dest}=max(${dest},${r.value})\n`:`  ${dest}=${r.value}\n`;}
  if(row.type===8878)for(const [group,fields]of Object.entries(groups)){const v=row.rules.find(r=>r.key===fields[0]).value;out+=`  j9dmactor[${q(group)}]=max(j9dmactor[${q(group)}],${v})\n`;}
  if(row.rules.some(r=>(r.key==='defiant'&&r.value===1)||(r.key==='meekness'&&r.value<0)))out+="  if j9dmactor['jo9_slave_nature']=1: j9dmactor['jo9_slave_nature']=0\n";
  out+=' end\n';
 }
 out+=` j9dmactor[${q(flag)}]=1\n},'j9dmactor',$j9dm_role)\n! Existing conflict repairs touch only mutually exclusive trait keys, never progress.\ngs 'jo9_traits','activity_repair',$j9dm_role\ngs 'jo9_traits','attention_repair',$j9dm_role\ngs 'jo9_traits','repair_exclusions',$j9dm_role\n! JO9 MOD END DOHNA_OWNED_MIGRATION_20261112\n`;return nl(out);
}
function fixture(raw,p,name){let d=c.parse(raw),s="killall\n$onnewloc=''\n$ongload=''\n$counter=''\nsettimer 0\nqa_checks=0\nqa_failed=0\ngs '#static_base'\ngs '#dynamic'\n";
 const check=(expr,value,label)=>{s+=`qa_checks+=1\nif (${expr})!${typeof value==='string'?q(value):value}:\n qa_failed+=1\n $qa_errors[]=${q(label||expr)}\nend\n`;};
 const migrate=role=>s+=`if loc(${q(loc)}): gs '${loc}',${q(role)}\n`;
 check(`loc(${q(loc)})`,1,'migration exists');
 const protectedKeys=['age_count','devotion','devotion_rank','energy','health','mood','loyalty','jo9_voice_trait','custom_progress','custom_trait','ill','room_grade'];
 for(const row of p.rows){
  s+="dynamic $clear_slave_instance,'slave'\n"+`slave_type=${row.type}\nslave_state=1\n$slave_name='MANUAL NAME'\n$slave['fullimage']='MANUAL IMAGE'\n$slave_psy_basic='MANUAL MOOD'\n$slave['armor']='MANUAL ARMOR'\nslave_inventory['manual_item']=17\n`;
  for(const key of protectedKeys)s+=`slave[${q(key)}]=7\n`;
  // Prevent conflict repairs from discarding an unrelated test trait sentinel.
  s+="slave['jo9_voice_trait']=0\nslave['jo9_meiki_known']=0\nslave['virginity']=3\n";
  for(const r of row.rules)if(r.mode==='floor')s+=`slave[${q(r.key)}]=0\n`;
  migrate('slave');
  for(const r of row.rules)check(`slave[${q(r.key)}]`,r.value,'low '+row.type+' '+r.key);
  check(`slave[${q(flag)}]`,1,'flag '+row.type);
  check('$slave_name','MANUAL NAME');check("$slave['fullimage']",'MANUAL IMAGE');check("$slave['armor']",'MANUAL ARMOR');check('$slave_psy_basic','MANUAL MOOD');check("slave_inventory['manual_item']",17);
  for(const key of protectedKeys.filter(k=>k!=='jo9_voice_trait'))check(`slave[${q(key)}]`,7,'preserve '+row.type+' '+key);
  // A subsequent stat decrease or trait change is gameplay, not a reason to repeat migration.
  s+="slave['beauty']=1\nslave['custom_trait']=11\n";
  const tr=row.rules.find(r=>r.mode==='set');if(tr)s+=`slave[${q(tr.key)}]=77\n`;
  migrate('slave');check("slave['beauty']",1,'one time ability '+row.type);check("slave['custom_trait']",11);if(tr)check(`slave[${q(tr.key)}]`,77,'one time trait '+row.type);
  // Fresh counterpart with training above the new baseline must retain it.
  s+="dynamic $clear_slave_instance,'slave'\n"+`slave_type=${row.type}\nslave_state=1\nslave['virginity']=3\n`;for(const r of row.rules)if(r.mode==='floor')s+=`slave[${q(r.key)}]=${r.value+3}\n`;
  migrate('slave');for(const r of row.rules.filter(x=>x.mode==='floor'))check(`slave[${q(r.key)}]`,r.value+3,'trained '+row.type+' '+r.key);
 }
 // Every owned storage slot, including suspended/parked actors; ID, not renamed display name.
 for(let i=0;i<roles.length;i++){const role=roles[i];s+=`${role}_state=1\n${role}_type=8877\n${role}['${flag}']=0\n${role}['nurse']=0\n$${role}_name='RENAMED'\n`;}
 s+="stock_state=1\nstock_type=8877\nstock['nurse']=0\nstock['jo9_dohna_preset_rev']=0\n";
 migrate('all');for(const role of roles){check(`${role}['nurse']`,5,role+' floor');check(`${role}['${flag}']`,1,role+' flag');check(`$${role}_name`,'RENAMED');}
 check("stock['nurse']",0,'unowned untouched');check("stock['jo9_dohna_preset_rev']",0);
 s+="slave_type=8876\nslave['jo9_dohna_preset_rev']=0\nslave['nurse']=2\n";migrate('slave');check("slave['nurse']",2,'non-target');check("slave['jo9_dohna_preset_rev']",0);
 for(const state of [0,-1]){s+=`slave_type=8877\nslave_state=${state}\nslave['jo9_dohna_preset_rev']=0\nslave['nurse']=2\n`;migrate('slave');check("slave['nurse']",2,'empty/dead unchanged');check("slave['jo9_dohna_preset_rev']",0);}
 // Discovery and completed anatomy must not be turned back into an undiscovered potential.
 for(const known of [0,1]){s+=`slave_type=8878\nslave_state=1\nslave['jo9_dohna_preset_rev']=0\nslave['jo9_meiki_latent']=0\nslave['jo9_meiki_known']=${known}\nslave['virginity']=4\n`;migrate('slave');check("slave['jo9_meiki_latent']",0);check("slave['jo9_meiki_known']",known);check("slave['virginity']",4);}
 // Array swap carries revision with the character and exposes a new unmigrated actor correctly.
 s+="slave_type=8877\nslave_state=1\nslave['jo9_dohna_preset_rev']=1\nslave['nurse']=2\nassistant_type=8882\nassistant_state=1\nassistant['jo9_dohna_preset_rev']=0\nassistant['intellect']=0\ndynamic $swap_slave_instances,'slave','assistant'\n";migrate('all');check("assistant['nurse']",2,'revision follows swap');check("assistant['jo9_dohna_preset_rev']",1);check('slave_type',8882);check("slave['jo9_dohna_preset_rev']",1);
 // Targeted conflict resolution and stage/discovery preservation.
 s+="slave_type=8888\nslave_state=1\nslave['jo9_dohna_preset_rev']=0\nslave['jo9_slave_nature']=1\nslave['meekness']=6\nslave['defiant']=0\n";migrate('slave');check("slave['meekness']",-1);check("slave['defiant']",1);check("slave['jo9_slave_nature']",0);
 s+="slave_type=8884\nslave['jo9_dohna_preset_rev']=0\nslave['cowSK_affinity']=3\n";migrate('slave');check("slave['cowSK_affinity']",0);check("slave['jo9_work_ethic']",1);
 // The actual inserted callback line is used in this diagnostic, not a separate implementation.
 for(const n of ['$ongload','$newloc']){s+="slave_type=8877\nslave_state=1\nslave['jo9_dohna_preset_rev']=0\nslave['nurse']=0\n";const hook=body(d,n).split('\r\n').find(x=>x===`gs '${loc}','all'`);if(hook)s+=hook+'\n';check("slave['nurse']",5,n+' hook');}
 // The production load hook is exercised above. Inspect the engine-written SAV separately.
 s+="slave['nurse']=2\nslave['custom_progress']=4321\nsavegame 'qa.sav'\nif qa_failed>0: msg 'FAIL migration '+str(qa_failed) & exit\nmsg 'JO9_QA_DOHNAMIGRATION_owned_COMPLETE'\nexit\n";
 put(d,'Start',s);const dir=T+'/'+name;fs.mkdirSync(dir,{recursive:true});fs.copyFileSync(G+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');fs.writeFileSync(dir+'/test.qsp',c.serialize(d));wr(dir+'/plan.json',[{name:'owned-migration',file:dir+'/test.qsp',marker:'JO9_QA_DOHNAMIGRATION_owned_COMPLETE',checkpoint:'23 IDs; low/high training, 30 owned slots, conflicts, repeated hooks/swap and engine SAV persistence; full OPENGAME unverified'}]);
}
if(process.argv[2]==='prepare'){
 fs.mkdirSync(D,{recursive:true});fs.mkdirSync(T+'/mods',{recursive:true});const raw=fs.readFileSync(G+'/jack.qsp');a.equal(c.hash(raw),'d95e7e67888c881f0c0e2135aed0c43654473f784f65bab18f766d9e3e3fb2d9');a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')));a(c.serialize(c.parse(raw)).equals(raw));qa.inspectWorld(raw);
 const p={before:c.hash(raw),rows:rules(),roles,flag};wr(D+'/plan.json',p);fs.writeFileSync(D+'/baseline.qsp.gz',z.gzipSync(raw));fs.writeFileSync(D+'/manifest.before.json.gz',z.gzipSync(fs.readFileSync(R+'/assets/runtime-source-2.4.1.json')));fixture(raw,p,'before');
 fs.writeFileSync(D+'/DESIGN_PLAN_KO.md',`# 도나도나 기존 보유 인물 갱신 설계·실행 계획\n\n사용자 승인: 기존 육성/진행 보존 + 기존 영입 인물 1회 갱신.\n\n전체 프리셋 덮어쓰기는 육성을 지우므로 제외. 변경된 초기 능력/기술만 max(현재,새 기준), 지정 특성은 최신 설정으로 적용하고 비대상 특성은 보존한다. 일반 공개 단계와 강화 단계는 낮추지 않는다. 기분/성격 기준 문자열 psy_basic은 보존. 외모 등 수치도 낮추지 않아 기존 외모5는 유지된다. 동일 키의 배타적 특성은 새 설정이 우선하며 기존 충돌 정리만 사용한다. 발견 완료는 잠재로 되돌리지 않는다.\n\n기술 선택: QSP 새 로케이션 1개, $ongload/$newloc 선두 호출. 이전 세이브의 seed 캐시가 오래됐어도 현재 WORK JSON에서 확정한 값을 코드에 기록해 사용한다. 개인SAV 파일 직접 수정 없이 게임 불러오기/장면 이동 시 동작. 전체 보유 30역할(공식29+개인실 parked), 생존·점유 상태>0 및 ID8877~8899만 대상. 상점/선택 임시 복사본 제외.\n\n저장 비용: 캐릭터 배열에 ${flag} 정수1개. 같은 배열의 원래 swap/copy에 따라 이동하여 역할 변경 후 반복되지 않는다. 전역 완료표시는 쓰지 않아 다른 세이브/이후 새 영입도 정상 처리한다. 이름/이미지/장비/인벤토리/나이·소유일/헌신/관계/퀘스트/현재 자원은 쓰지 않는다.\n\n- [ ] RED: 기존 WORK에서 같은 진단을 실행해 갱신 누락 확인.\n- [ ] 구현: 고정된 변경필드 규칙 + 1회 플래그 + 두 콜백. JSON/이미지/음원은 수정하지 않음.\n- [ ] GREEN: 23인 low/high,30역할,비대상/빈칸/사망/미영입,충돌,원래 swap,저장후 재로드 검증.\n- [ ] 공식 적용기 재생/멱등·구조/왕복·역적용·입력 최신성 대조 후 WORK/추적 QSP/manifest 반영.\n- [ ] 사용법/부작용/의존성/한계를 기록하고 재생성 가능한 진단 사본 정리. 커밋·푸시·Full 반영 없음.\n`);
 console.log('Prepared rules for '+p.rows.length+' IDs and '+roles.length+' owned slots; RED fixture ready');
}
if(process.argv[2]==='build'){
 const p=rd(D+'/plan.json'),raw=z.gunzipSync(fs.readFileSync(D+'/baseline.qsp.gz'));let d=c.parse(raw);a.equal(c.hash(fs.readFileSync(G+'/jack.qsp')),p.before);const hook=nl(`! JO9 MOD START DOHNA_OWNED_LOAD_20261112\ngs '${loc}','all'\n! JO9 MOD END DOHNA_OWNED_LOAD_20261112\n`);const edits=['$ongload','$newloc'].map(location=>({location,field:'body',old:body(d,location),new:hook+body(d,location),count:1,patchId:'DOHNA_OWNED_LOAD_20261112'}));for(const e of edits)put(d,e.location,e.new);const src=source(p);d=append(d,loc,src);const out=c.serialize(d);qa.inspectWorld(out);a(c.serialize(c.parse(out)).equals(out));p.after=c.hash(out);p.mod={id,status:'APPROVED',before_sha256:p.before,after_sha256:p.after,edits,add_locations:[{name:loc,desc:'',body:src,actions:[]}]};wr(D+'/plan.json',p);wr(T+'/mods/'+id+'.json',p.mod);wr(R+'/mods/'+id+'.json',p.mod);fs.writeFileSync(T+'/candidate.qsp',raw);fixture(out,p,'after');console.log('Candidate '+p.after+'; actual-engine GREEN fixture ready');
}
if(process.argv[2]==='verify-apply'){
 const p=rd(D+'/plan.json'),raw=fs.readFileSync(G+'/jack.qsp'),out=fs.readFileSync(T+'/candidate.qsp');a.equal(c.hash(raw),p.before);a.equal(c.hash(out),p.after);a(rd(T+'/after/client-results.json').every(x=>x.pass));const save=sv.parse(fs.readFileSync(T+'/after/qa.sav'));a.equal(+sv.value(save,'qa_failed')[0],0);const checks=+sv.value(save,'qa_checks')[0];
 let inverse=c.parse(out);const last=inverse.locations.at(-1);a.equal(last.name,loc);inverse.lines.splice(last.desc-1,4);inverse.lines[3]=c.shift(String(inverse.locations.length-1),-5);inverse=c.parse(c.serialize(inverse));for(const e of p.mod.edits){a.equal(body(inverse,e.location),e.new);put(inverse,e.location,e.old);}a(c.serialize(inverse).equals(raw));
 for(const r of p.rows)a.equal(c.hash(fs.readFileSync(G+'/json/slaves/'+r.file)),r.hash,'JSON changed during task');
 a.equal(+sv.value(save,'slave',flag)[0],1);a.equal(+sv.value(save,'slave','nurse')[0],2);a.equal(+sv.value(save,'slave','custom_progress')[0],4321);a(sv.serialize(save).equals(fs.readFileSync(T+'/after/qa.sav')));
 a(raw.equals(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp')),'tracked QSP changed during task');const meta=rd(R+'/assets/runtime-source-2.4.1.json');a.equal(meta.sourceQspSha256,p.before);a(fs.readFileSync(R+'/assets/runtime-source-2.4.1.json').equals(z.gunzipSync(fs.readFileSync(D+'/manifest.before.json.gz'))),'manifest changed during task');const e=meta.files.find(x=>x.runtimePath==='jack.qsp');a(e);meta.sourceQspSha256=p.after;e.sha256=p.after;e.bytes=out.length;meta.latestDohnaOwnedMigration={date:'2026-11-12',mod:id,report:'records/dohna-owned-migration-20261112/REPORT_KO.md'};
 fs.writeFileSync(G+'/jack.qsp',out);fs.writeFileSync(R+'/assets/runtime/2.4.1/jack.qsp',out);wr(R+'/assets/runtime-source-2.4.1.json',meta);
 for(const stage of ['before','after'])for(const f of fs.readdirSync(T+'/'+stage))if(/\.log$|client-results\.json$/.test(f))fs.copyFileSync(T+'/'+stage+'/'+f,D+'/'+stage+'-'+f);wr(D+'/verification.json',{before:p.before,after:p.after,checks,failures:0,qspRoundtrip:true,saveCodecRoundtrip:true,savePersistentValues:true,inverse:true,unchangedJsons:p.rows.length,fullOpenGameTested:false,personalSaveTested:false,guiTested:false});console.log('Applied WORK + tracked source; '+checks+' native assertions passed');
}
if(process.argv[2]==='results'){
 const stage=process.argv[3]||'after',save=sv.parse(fs.readFileSync(T+'/'+stage+'/qa.sav'));console.log(JSON.stringify({checks:sv.value(save,'qa_checks')[0],failed:sv.value(save,'qa_failed')[0],errors:save.vars.find(v=>v.name==='QA_ERRORS')?.values.slice(0,12)}));
}
