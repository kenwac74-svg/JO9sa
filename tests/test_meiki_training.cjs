const fs=require('fs'),vm=require('vm'),assert=require('assert'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const raw=fs.readFileSync(process.argv[2]||'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp'),d=c.parse(raw);
const get=n=>{const l=d.locations.find(l=>l.name===n);assert(l,'Missing '+n);return c.shift(d.lines[l.body],5);};
assert(get('jo9_meiki_state').includes('JO9_TRAINING_V3'),'Missing discovery skill floors');
const skills=['sub_threesome','sub_dp','sub_tp','sub_gangbang','sub_bukkake'];
function compile(source){let js='';for(let line of source.split(/\r?\n/)){line=line.trim();if(!line||line.startsWith('!'))continue;line=line.replace(/\$interaction_type/g,'IT').replace(/\$args/g,'STRARGS').replace(/\bargs\b/g,'ARGS').replace(/\band\b/gi,'&&').replace(/\bor\b/gi,'||');if(line.startsWith('if ')){assert(line.endsWith(':'));js+='if ('+line.slice(3,-1).replace(/\s!\s/g,' !== ').replace(/(?<![<>!=])=(?!=)/g,'===')+') {\n';}else if(line==='end')js+='}\n';else if(line==='else')js+='} else {\n';else js+=line+';\n';}return js;}
const state=compile(get('jo9_meiki_state')),bonus=compile(get('jo9_meiki_training_bonus'));let count=0;
for(const role of ['slave','assistant','room1','room2','room3','room4'])for(const existing of [0,3,4,5]){
 const x={STRARGS:[role],ARGS:[role,0],CONST_INT:{young_age:0,milf_age:2},max:Math.max,rand:()=>1};for(const r of ['slave','assistant','room1','room2','room3','room4']){x[r]={age:2,virginity:0,jo9_meiki_initialized:0,jo9_meiki_checked:0,jo9_meiki_known:0,jo9_meiki_prev:0,sub_vaginal:0};for(const sk of skills)x[r][sk]=existing;}
 vm.runInNewContext(state,x);assert.equal(x[role].sub_vaginal,0,'undiscovered untouched');x[role].virginity=2;x.ARGS[1]=1;vm.runInNewContext(state,x);assert.equal(x[role].virginity,4);assert.equal(x[role].sub_vaginal,5);for(const sk of skills)assert.equal(x[role][sk],Math.max(existing,3));
 x[role].sub_dp=1;x[role].sub_vaginal=2;vm.runInNewContext(state,x);assert.equal(x[role].sub_dp,1,'one-time grant, no repeated reset');assert.equal(x[role].sub_vaginal,2);x[role].virginity=1;vm.runInNewContext(state,x);x[role].virginity=2;vm.runInNewContext(state,x);assert.equal(x[role].virginity,4);assert.equal(x[role].sub_dp,1,'restoration does not grant again');count++;
}
for(const role of ['slave','assistant'])for(const sk of [...skills,'sub_vaginal','sub_hj'])for(const allowed of [0,1])for(const kind of ['self_sex_lesson','self_sex_lesson_assistant','other']){
 const x={result:0,STRARGS:[role,'slave["'+sk+'"]'],ARGS:[role,0],IT:kind,func:()=>allowed,interaction_slave:{diligence:3},interaction_assistant:{diligence:3}};
 vm.runInNewContext(bonus,x);const expected=allowed&&skills.includes(sk)&&kind!=='other'?1:0;assert.equal(x.result,expected);count++;
}
const dyn=get('#dynamic'),start=dyn.indexOf('$dyn_advance_sex_skills = {'),end=dyn.indexOf('\r\n}',start),block=dyn.slice(start,end);
assert(block.includes("dynamic $replace('<<$subskill_xp>> += skill_adv_mul * max(2, success - <<$subskill_xp>>)'"),'Original gain preserved');
assert.equal((block.match(/jo9_meiki_training_bonus/g)||[]).length,1);assert(block.includes("< 5:"),'S+ cap');
const branchStart=block.indexOf('\t\t\t\telse\r\n',block.indexOf('if success >= rise_difficulty'));
const branchEnd=block.indexOf('\r\n\t\t\t\tend',branchStart),branch=block.slice(branchStart,branchEnd);
assert(branchStart>0&&branchEnd>branchStart);
const gainLine=branch.split('\r\n').find(l=>l.includes('+= skill_adv_mul * max('));
const bonusLine=branch.split('\r\n').find(l=>l.includes('jo9_meiki_training_bonus'));
assert(gainLine&&bonusLine,'Both actual operations must be in the level-up failure branch');
assert(bonusLine.trim()==="if func('jo9_meiki_training_bonus', 'dynslave', $subskill) = 1: dynamic $replace('<<$subskill_xp>> += 1', 'slave', 'dynslave')",'Exact conditional increment');
assert(branch.indexOf(gainLine)<branch.indexOf(bonusLine),'Original gain before additive bonus');
const op=l=>l.match(/\$replace\('(<<\$subskill_xp>> \+= [^']+)'/)[1].replace(/<<\$subskill_xp>>/g,'XP');
// Execute the actual extracted arithmetic with prior XP included in success, as production does.
for(const previous of [0,3,50])for(const earned of [0,1,4])for(const mul of [1,2])for(const eligible of [0,1]){const x={XP:previous,success:previous+earned,skill_adv_mul:mul,max:Math.max};vm.runInNewContext(op(gainLine),x);if(eligible)vm.runInNewContext(op(bonusLine),x);assert.equal(x.XP,previous+mul*Math.max(2,earned)+eligible);count++;}
assert(get('$newloc').includes('jo9_meiki_revision < 3'));assert(c.serialize(d).equals(raw));console.log('PASS '+count+' training cases and actual-source guards; floors once, no downgrade, XP delta +1, cap and roundtrip. Not native execution.');
