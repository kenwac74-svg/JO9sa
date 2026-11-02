'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const REPO='G:/somi/JO9sa',WORK='G:/somi/Jack O Nine Tails v2.4_work/game',TASK='G:/Codex/tmp/arena-intro-copy-20261028';
const core=require(REPO+'/tools/text-workshop/core.cjs'),codec=require(REPO+'/tools/qa/save-codec.cjs'),gate=require(REPO+'/tools/qa/release-check.cjs');
const q=s=>"'"+String(s).replace(/'/g,"''")+"'",hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const candidate=TASK+'/jack.candidate.qsp',before=TASK+'/jack.before.qsp',save=WORK+'/save/JO9_GOLD_AP_CHECK_20261026.sav';
const out=path.resolve(process.argv[2]||'G:/Codex/tmp/arena-intro-copy-qa-20261028/native-v1');gate.assertOutside(out,[WORK,TASK,REPO,'G:/somi/JO9O','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game']);assert(!fs.existsSync(out)||fs.readdirSync(out).length===0,'New/empty output only');
const raw=fs.readFileSync(candidate),doc=core.parse(raw),baseline=core.parse(fs.readFileSync(before)),savedRaw=fs.readFileSync(save),saved=codec.parse(savedRaw);assert(codec.serialize(saved).equals(savedRaw));
function body(d,n){return core.shift(d.lines[d.locations.find(x=>x.name===n).body],5);}
function set(d,n,b){d.lines[d.locations.find(x=>x.name===n).body]=core.shift(b.replace(/\r?\n/g,'\r\n'),-5);}
function clean(s){return s.split(/\r?\n/).filter(l=>l.trim()&&!/^\$arena_slave_presentation\[1\]\s*=/.test(l)&&!/JO9 MOD (?:START|END) ARENA_INTRO_COPY(?:_REFRESH)?_20261028/.test(l)&&!/^! ARENA_INTRO_COPY_20261028: shared introduction is defined once above\.$/.test(l)&&!/^if \$args\[0\] = 'jo9_arena_intro': exit$/.test(l)&&!/^gs '#txt_man', 'jo9_arena_intro'$/.test(l.trim())).join('\n');}
const bank=body(doc,'#txt_man'),consumer=body(doc,'interaction_city'),definition=bank.split('\r\n').find(l=>/^\$arena_slave_presentation\[1\]\s*=/.test(l));
const checks={singleDefinition:bank.split('\r\n').filter(l=>/^\$arena_slave_presentation\[1\]\s*=/.test(l)).length===1,
 unchangedLocationNames:JSON.stringify(doc.locations.map(x=>x.name))===JSON.stringify(baseline.locations.map(x=>x.name)),
 voiceRoutesBeforeDefinition:bank.indexOf("if $args[0]='jo9_voice_fragment_data'")<bank.indexOf(definition)&&bank.indexOf("if $args[0] = 'jo9_voice_1112_data'")<bank.indexOf(definition),
 roomGuardBeforeDefinition:bank.indexOf("if snk_room_target > 0 and $curloc = '#txt_man'")<bank.indexOf(definition),
 targetedExitBeforeWholeBank:bank.indexOf("if $args[0] = 'jo9_arena_intro': exit")<bank.indexOf('!MAIN TEXT DATABASE'),
 consumerRefreshBeforeCopy:/gs '#txt_man', 'jo9_arena_intro'\r?\n(?:! JO9 MOD END ARENA_INTRO_COPY(?:_REFRESH)?_20261028\r?\n)?\s*\$text\[2\] = \$arena_slave_presentation\[1\]/.test(consumer),
 bankOtherNonblankCodePreserved:clean(bank)===clean(body(baseline,'#txt_man')),
 consumerOtherNonblankCodePreserved:clean(consumer)===clean(body(baseline,'interaction_city')),
 otherLocationsPreserved:doc.locations.filter(x=>!['#txt_man','interaction_city'].includes(x.name)).every(l=>body(doc,l.name)===body(baseline,l.name))};
assert(Object.values(checks).every(Boolean),'Static conservation/anchor check failed: '+JSON.stringify(checks));
const token=crypto.randomBytes(8).toString('hex').toUpperCase(),marker='JO9_QA_'+token+'_ARENA_INTRO_COPY_COMPLETE',prime=gate.primeState(saved);
const start=['killall','usehtml=1','SHOWOBJS 0','SHOWACTS 0','SHOWINPUT 0','SHOWSTAT 0',prime.code,"gs 'refresh_database'","$onnewloc=''","$counter=''","$ongload=''",'snk_room_target=0','sound_on=0','qa_intro_cases=0'];
function check(condition,tag){return ['if ('+condition+')=0:',' msg '+q('FAIL_ARENA_INTRO_'+tag),' exit','end'].join('\n');}
for(const hero of [1,101])for(const name of ['미스티','이사벨라','린']){
 start.push('hero_choice='+hero,"$master_name="+q(hero===1?'검증 주인':'검증 여주인'),'$slave_name='+q(name),"$arena_slave_presentation[1]='OLD_SAVED_ARENA_CACHE'","$arena_fight_description[1]='KEEP_COMMON_GENDER_BANK'","$prehistoric_description[1]='KEEP_FEMALE_BANK'","$superviser_message[1]='KEEP_SUPERVISER_BANK'","$text[2]='KEEP_CURRENT_PAGE'","gs '#txt_man', 'jo9_arena_intro'",
 check("instr($arena_slave_presentation[1],$master_name+'의 노예')>0 and instr($arena_slave_presentation[1],$slave_name+'!')>0",'NAMES_'+hero+'_'+name),
 check("instr($arena_slave_presentation[1],'한 쪽이 죽어야')=0 and instr($arena_slave_presentation[1],'목숨을 마음대로')>0 and instr($arena_slave_presentation[1],'명예와 부')>0",'COPY_'+hero+'_'+name),
 check("instr($arena_slave_presentation[1],'</div>')=0 and instr($arena_slave_presentation[1],'OLD_SAVED')=0",'NO_STALE_'+hero+'_'+name),
 check("$arena_fight_description[1]='KEEP_COMMON_GENDER_BANK' and $prehistoric_description[1]='KEEP_FEMALE_BANK' and $superviser_message[1]='KEEP_SUPERVISER_BANK' and $text[2]='KEEP_CURRENT_PAGE'",'OTHER_BANKS_'+hero+'_'+name),'qa_intro_cases+=1');
}
start.push(check('qa_intro_cases=6','ALL_SIX'),'*p '+q('<div id="qa_intro_sample"><<$arena_slave_presentation[1]>></div>'),'msg '+q(marker));set(doc,'Start',start.join('\n'));
const diagnostic=core.serialize(doc);assert(core.serialize(core.parse(diagnostic)).equals(diagnostic));const tracked=[candidate,before,save,WORK+'/css/base.css',WORK+'/content/js/jo9_battle_log.js'],inputHashes=Object.fromEntries(tracked.map(p=>[p,hash(fs.readFileSync(p))]));
fs.mkdirSync(out,{recursive:true});fs.copyFileSync(WORK+'/config.xml',out+'/config.xml');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');for(const n of ['css','content','fonts','json'])fs.symlinkSync(fs.realpathSync(WORK+'/'+n),out+'/'+n,process.platform==='win32'?'junction':'dir');
const file=out+'/intro-native.qsp';fs.writeFileSync(file,diagnostic);const plan=[{name:'intro-native',file,marker,checkpoint:'6 names/hero cases; stale cache replaced; other gender banks and current page untouched'}];fs.writeFileSync(out+'/plan.json',JSON.stringify(plan,null,2));
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',REPO+'/tools/qa/run-client-smoke.ps1','-Engine',WORK+'/engine/jack.exe','-Plan',out+'/plan.json','-TimeoutSeconds','30'],{encoding:'utf8',windowsHide:true,timeout:45000,maxBuffer:4*1024*1024});fs.writeFileSync(out+'/runner.log',(run.stdout||'')+(run.stderr||''));const clients=fs.existsSync(out+'/client-results.json')?JSON.parse(fs.readFileSync(out+'/client-results.json','utf8').replace(/^\uFEFF/,'')):[];
const inputsUnchanged=tracked.every(p=>hash(fs.readFileSync(p))===inputHashes[p]),pass=!run.error&&run.status===0&&clients.length===1&&clients[0].pass&&inputsUnchanged;
const report={status:pass?'PASS':'FAIL',candidateHash:hash(raw),candidate,engineExecuted:true,nativeCaseCount:6,checks,inputHashes,inputsUnchanged,client:clients,limits:['대표값prime을사용한기존loc의targeted GS검사다. 실제GUI세이브로드와이미저장된소개본문자동재발행검사가아니다.','소비자12801은정적prefix anchor와그외코드보존을검사했다. 실제intro3페이지플레이검사는아니다.']};if(run.error)report.runnerError=run.error.message;fs.writeFileSync(out+'/intro-native-results.json',JSON.stringify(report,null,2));fs.writeFileSync(__dirname+'/qa-summary.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(!pass)process.exitCode=1;
