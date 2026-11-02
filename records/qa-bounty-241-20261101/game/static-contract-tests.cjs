'use strict';
// Static contracts and actual resource reads. This is not an engine or UI test.
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const scenes=require('G:/somi/Jack O Nine Tails v2.4_work/game/modtools/text-workshop/scenes.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',raw=fs.readFileSync(game+'/jack.qsp'),d=c.parse(raw),tests=[];
const body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
function test(name,fn){fn();tests.push({name,pass:true});}
const city=body('interaction_city').replace(/\r\n/g,'\n'),all=scenes.analyse('interaction_city',city).scenes;
const blocks=id=>all.filter(x=>x.predicate?.value===String(id)).map(x=>city.slice(x.start,x.end));
test('parse_roundtrip_and_reviewed_source',()=>{assert.equal(d.hash,'78835089f1dc8d0d5272f991926f35fa40e7e26dede5970a3fc03612967c130d');assert(c.serialize(d).equals(raw));});
test('formal_prize_current_formula_and_single_award',()=>{
 const [b]=blocks(1294);assert(b);assert.equal((b.match(/\bsparks\s*\+=\s*purse/g)||[]).length,1);
 assert(b.indexOf('if purse < 50: purse = 50')<b.indexOf('purse *= 2'));
 assert.equal((b.match(/purse \*= 2/g)||[]).length,1);assert(/txt_count = 1/.test(b));assert(!/\$text\[2\]\s*=/.test(b));
 assert(/\(slave\['arena_level'\]\*12\)/.test(b));assert(/48271 \* \(day \+ slave_type\)/.test(b));
});
test('champion_event_prize_intentionally_preserved',()=>{const [b]=blocks(1295);assert(b);assert(!/purse \*= 2/.test(b));assert(/\$text\[3\]/.test(b));});
test('catfight_both_hero_branches_100_single_page_single_award',()=>{
 const bs=blocks(103005);assert.equal(bs.length,2);for(const b of bs){assert.equal((b.match(/\bsparks\s*\+=\s*purse/g)||[]).length,1);assert(/purse = 100/.test(b));assert(/slave\['totalEarned'\]\s*\+= purse/.test(b));assert(!/\$text\[2\]\s*=/.test(b));assert(!/catfight_level.*\+=/.test(b));}
});
test('decision_committed_before_one_morality_call_before_enemy_loop',()=>{
 const b=body('jo9_battle_fate'),x=b.slice(b.indexOf("if $args[0] = 'choose':"),b.indexOf("if $args[0] = 'choices':"));
 assert(x.indexOf("jo9_fate['phase'] ! 1")<x.indexOf("jo9_fate['phase'] = 2"));
 assert(x.indexOf("jo9_fate['phase'] = 2")<x.indexOf("gs 'jo9_cruel_mercy_apply'"));
 assert(x.indexOf("gs 'jo9_cruel_mercy_apply'")<x.indexOf(':jo9_bf_choose'));assert.equal((x.match(/gs 'jo9_cruel_mercy_apply'/g)||[]).length,1);
 assert(x.includes("$place = 'colosseum_arena' and $fight_return = 'Start'"));assert(x.includes("$place = 'catfightclub' and $fight_return = 'Start1'"));
});
test('both_loss_arenas_use_approved_thresholds_and_increment_KO_once',()=>{
 const b=body('выход_из_боя');assert.equal((b.match(/if jo9_cruel_mercy <= -5 or \(jo9_cruel_mercy < 5 and b > gladiator_valor\):/g)||[]).length,2);assert.equal((b.match(/slave\['loser_rating'\] \+= 1/g)||[]).length,2);assert(!/loser_rating'\] \+= 100/.test(b));
 assert(b.indexOf("if jo9_fate['phase'] = 3: exit")<b.indexOf("if $fight_return = 'Start':"));
});
test('bill_debit_has_active_guard',()=>{const b=body('jo9_liquidation'),x=b.slice(b.indexOf("if $jo9_lq_action = 'settle':"),b.indexOf("if $jo9_lq_action = 'finish':"));assert.equal((x.match(/sparks -=/g)||[]).length,1);assert(x.includes("if jo9_lq['active'] = 1 and sparks >= jo9_lq['bill']:"));assert(x.includes("jo9_lq['active'] = 0"));});
test('facility_27_roles_do_not_include_active_actors',()=>{const b=body('jo9_liquidation_assets'),r=[...b.matchAll(/\$jo9_lqm_slots\[\d+\] = '([^']+)'/g)].map(m=>m[1]);assert.equal(r.length,27);assert.equal(new Set(r).size,27);assert(!r.includes('slave'));assert(!r.includes('assistant'));for(let i=1;i<=18;i++)assert(r.includes('iced_'+i));});
test('actual_sale_fails_quests_after_identity_price_guard_before_clearing',()=>{const b=body('jo9_liquidation_sale');const guard=b.indexOf('if jo9_lqs_price ! jo9_lqs_expected_price'),fail=b.indexOf("gs 'jo9_liquidation_sale','fail_quests',$jo9_lqs_slot"),clear=b.indexOf('dynamic $clear_slave_instance, $jo9_lqs_slot');assert(guard>=0&&guard<fail&&fail<clear);});
const groups=[...new Set([...body('jo9_battle_fate').matchAll(/content\/pic\/mob\/defeated\/groups\/[^']+\.png/g)].map(m=>m[0]))];
test('all_8_group_art_files_actual_PNG_795x596',()=>{assert.equal(groups.length,8);for(const g of groups){const b=fs.readFileSync(path.join(game,g));assert.equal(b.toString('hex',0,8),'89504e470d0a1a0a');assert.equal(b.readUInt32BE(16),795);assert.equal(b.readUInt32BE(20),596);}});
test('known_group_renderer_does_not_emit_individual_fallback',()=>{const b=body('конец_боя'),start=b.indexOf('! JO9 MOD START GROUP_DEFEAT_SINGLE_CUT_20261101');assert(start>=0);const end=b.indexOf('! JO9 MOD END GROUP_DEFEAT_SINGLE_CUT_20261101',start),x=b.slice(start,end);assert(x);assert(!x.includes('onload='));assert(!x.includes("'sprite'"));});
const report={kind:'STATIC_CONTRACT_AND_RESOURCE_CHECKS',sourceHash:d.hash,pass:true,tests,productionWrites:0,privateSavesRead:0,limits:['These checks inspect exact current code and PNG bytes. They do not execute QSP statements or inspect GUI layout.','Native plans are prepared and executed separately by the root agent.']};
fs.writeFileSync(path.join(__dirname,'static-test-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({pass:true,tests:tests.length,sourceHash:d.hash}));
