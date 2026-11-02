'use strict';
const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs');
const rules=require('./image-cut-condition-rules.cjs');
const {checkSyntax}=require('G:/somi/JO9sa/tools/text-workshop/check-image-cycle-syntax.cjs');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const rule=(extra={})=>({base:'content/pic/scene/example.png',path:'content/pic/scene/example (2).png',morality:null,money:null,rank:2,reputation:null,...extra});
function fixture(){return [
 "if snk_room_target > 0 and $curloc = 'interior_change': gs 'snk_room_bridge', 'guard', 'interior_change'",
 '! JO9 image-cycle: saved choices are keyed by original image path.',
 "if $args[0] = 'jo9_path':",
 ' local $jo9_base, $jo9_path, $jo9_saved_path, $jo9_candidates, jo9_candidate_ids, $jo9_active_paths, jo9_active_ids',
 ' local jo9_selected, jo9_i, jo9_count, jo9_exists, jo9_active_count, jo9_selected_at, jo9_slot',
 ' $jo9_base = $lcase($args[1])',
 ' $jo9_path = $jo9_base',
 ' $jo9_saved_path = $jo9_base',
 ' $jo9_candidates[0] = $jo9_base',
 ' jo9_candidate_ids[0] = 0',
 ' jo9_count = 1',
 ' jo9_selected = jo9_cut_choice[$jo9_base]',
 '! JO9 WINDOWS IMAGE SLOT REGISTRY START',
 "if $jo9_base = 'content/pic/scene/example.png':",
 ' jo9_count = 2',
 " $jo9_candidates[0] = 'content/pic/scene/example.png'",
 ' jo9_candidate_ids[0] = 0',
 " $jo9_candidates[1] = 'content/pic/scene/example (2).png'",
 ' jo9_candidate_ids[1] = 1',
 'end',
 '! JO9 WINDOWS IMAGE SLOT REGISTRY END',
 ' jo9_active_count = 0',
 ' jo9_selected_at = -1',
 ' jo9_i = 0',
 ' :jo9_slot_registered_check',
 ' if jo9_i < jo9_count:',
 '   $jo9_candidate = $jo9_candidates[jo9_i]',
 '   if jo9_selected = jo9_candidate_ids[jo9_i]: $jo9_saved_path = $jo9_candidate',
 '   jo9_exists = 1',
 '   if jo9_exists = 1:',
 '    $jo9_active_paths[jo9_active_count] = $jo9_candidate',
 '    jo9_active_ids[jo9_active_count] = jo9_candidate_ids[jo9_i]',
 '    if jo9_selected = jo9_candidate_ids[jo9_i]: jo9_selected_at = jo9_active_count',
 '    jo9_active_count += 1',
 '   end',
 '   jo9_i += 1',
 "   jump 'jo9_slot_registered_check'",
 ' end',
 ' jo9_slot = 2',
 ' :jo9_slot_windows_check',
 ' if jo9_slot <= 4:',
 '   jo9_exists = 1',
 '     if jo9_exists = 1:',
 '      $jo9_active_paths[jo9_active_count] = $jo9_candidate',
 '      jo9_active_ids[jo9_active_count] = 10000 + jo9_slot',
 '      if jo9_selected = 10000 + jo9_slot: jo9_selected_at = jo9_active_count',
 '      jo9_active_count += 1',
 '     end',
 '   jo9_slot += 1',
 "   jump 'jo9_slot_windows_check'",
 ' end',
 ' if args[2] = 2:',
 '  jo9_image_count = jo9_active_count',
 '  $result = $jo9_saved_path',
 '  exit',
 ' end',
 ' if jo9_selected_at < 0:',
 '  jo9_selected_at = 0',
 '  jo9_cut_choice[$jo9_base] = 0',
 ' end',
 ' if jo9_active_count > 0:',
 '  if args[2] = 1: jo9_selected_at = (jo9_selected_at + 1) mod jo9_active_count',
 '  $jo9_path = $jo9_active_paths[jo9_selected_at]',
 '  jo9_cut_choice[$jo9_base] = jo9_active_ids[jo9_selected_at]',
 ' end',
 ' jo9_image_count = jo9_active_count',
 ' $result = $jo9_path',
 ' exit',
 'end',
 "if $args[0] = 'jo9_html':",
 ' $result = $args[1]',
 ' exit',
 'end',
 "*pl 'Keep all room dialogue and image lifetime code'"
].join('\r\n');}

test('options use actual main-screen rank and reputation values',()=>{
 a.equal(rules.OPTIONS.moralityMin,-10);a.equal(rules.OPTIONS.moralityMax,10);a.equal(rules.OPTIONS.moralityStep,0.5);
 a.deepEqual(rules.OPTIONS.ranks.map(x=>x.value),[0,1,2,3,4,5]);a.equal(rules.OPTIONS.ranks[4].label,'조합 중역');
 a.equal(rules.OPTIONS.reputations[5].label,'로마의 전설');
});
test('normalize preserves all valid conditions and canonicalizes case and slash',()=>{
 const input=rule({base:'Content\\Pic\\Characters\\PERSON.PNG',path:'Content\\Pic\\Characters\\PERSON (3).PNG',morality:{min:-4.5,max:2},money:{op:'le',value:5000},reputation:0});
 a.deepEqual(rules.normalizeRules([input]),[rule({base:'content/pic/characters/person.png',path:'content/pic/characters/person (3).png',morality:{min:-4.5,max:2},money:{op:'le',value:5000},reputation:0})]);
});
test('all supported raster extensions have same-extension numbered families',()=>{
 for(const ext of ['png','jpg','jpeg','gif','webp','bmp'])a.equal(rules.normalizeRules([rule({base:'content/pic/bg/room.'+ext,path:'content/pic/bg/room (15).'+ext})]).length,1);
});
test('normalization orders numerical cuts deterministically',()=>{
 const rs=rules.normalizeRules([rule({path:'content/pic/scene/example (10).png'}),rule({path:'content/pic/scene/example (3).png'}),rule()]);
 a.deepEqual(rs.map(x=>x.path),['content/pic/scene/example (2).png','content/pic/scene/example (3).png','content/pic/scene/example (10).png']);
});
test('unknown keys, duplicate targets and malformed rule objects fail closed',()=>{
 for(const rs of [[rule({junk:true})],[rule(),rule()],[null],[[]],[rule({money:{op:'ge',value:1,junk:1}})],[rule({morality:{min:0,max:1,junk:1}})]])a.throws(()=>rules.normalizeRules(rs));
 for(const x of [null,{},'[]'])a.throws(()=>rules.normalizeRules(x));
});
test('a rule needs a condition; rank/reputation 0 are real conditions',()=>{
 a.throws(()=>rules.normalizeRules([rule({rank:null})]));a.equal(rules.normalizeRules([rule({rank:0})])[0].rank,0);a.equal(rules.normalizeRules([rule({rank:null,reputation:0})])[0].reputation,0);
});
test('invalid morality thresholds and reversed ranges fail closed',()=>{
 for(const morality of [{min:-11,max:0},{min:0,max:10.5},{min:0.25,max:1},{min:2,max:1},{min:NaN,max:1},{min:'0',max:1}])a.throws(()=>rules.normalizeRules([rule({morality})]));
});
test('money uses exact native integer bounds with explicit ge/le operator',()=>{
 for(const money of [{op:'eq',value:1},{op:'ge',value:-1},{op:'ge',value:1.1},{op:'ge',value:'100'},{op:'ge',value:2147483648},{op:'le',value:Number.MAX_SAFE_INTEGER+1}])a.throws(()=>rules.normalizeRules([rule({money})]));
 a.equal(rules.normalizeRules([rule({money:{op:'ge',value:2147483647}})])[0].money.value,2147483647);
 a.equal(rules.normalizeRules([rule({money:{op:'ge',value:0}})])[0].money.value,0);
});
test('rank and reputation require actual integer dropdown values',()=>{
 for(const field of ['rank','reputation'])for(const value of [-1,6,1.5,'2',true])a.throws(()=>rules.normalizeRules([rule({[field]:value})]));
});
test('unsafe paths, unsupported folders, family mismatch and nonalternate files fail closed',()=>{
 for(const path of ['content/pic/scene/../example (2).png','content/pic/mob/example (2).png','content/pic/scene/other (2).png','content/pic/scene/example.png','content/pic/scene/example (1).png','content/pic/scene/example (02).png','content/pic/scene/example (2).jpg',"content/pic/scene/example' & msg 1 (2).png",'content/pic/scene/example% (2).png','content/pic/scene//example (2).png'])a.throws(()=>rules.normalizeRules([rule({path})]),path);
});
test('unconfigured body reads empty rules; an empty install changes nothing',()=>{
 const b=fixture();a.deepEqual(rules.readRules(b),[]);a.equal(rules.buildBody(b,[]),b);
});
test('metadata round trip, idempotent generation and removal preserve original byte-for-byte',()=>{
 const b=fixture(),rs=[rule(),rule({path:'content/pic/scene/example (5).png',rank:null,money:{op:'ge',value:900}})],next=rules.buildBody(b,rs);
 a.deepEqual(rules.readRules(next),rules.normalizeRules(rs));a.equal(rules.buildBody(next,rs),next);a.equal(rules.buildBody(next,[]),b);
});
test('both eligible candidate append paths get filter and matched-cut tracking hooks',()=>{
 const next=rules.buildBody(fixture(),[rule()]);
 a.equal((next.match(/jo9_ic_rule = func\('interior_change', 'jo9_cut_condition'/g)||[]).length,2);
 a.equal((next.match(/if jo9_ic_rule = 0: jo9_exists = 0/g)||[]).length,2);
 a.equal((next.match(/jo9_ic_auto_at = jo9_active_count/g)||[]).length,2);
});
test('generated predicates use exact morality halfpoints and actual game stats',()=>{
 const next=rules.buildBody(fixture(),[rule({morality:{min:-4.5,max:2.5},money:{op:'ge',value:900},rank:3,reputation:4})]);
 a.match(next,/2 \* jo9_cruel_mercy \+ jo9_cruel_mercy_half/);a.match(next,/>= -9/);a.match(next,/<= 5/);a.match(next,/sparks >= 900/);a.match(next,/guild_reputation = 3/);a.match(next,/brand_reputation = 4/);
 a.match(next,/result = -1/);a.match(next,/result = 0/);a.match(next,/result = 2/);
});
test('new configured cuts supplement outside registry and keep old IDs and whole registry intact',()=>{
 const b=fixture(),next=rules.buildBody(b,[rule({path:'content/pic/scene/example (5).png'})]),registry=x=>x.match(/! JO9 WINDOWS IMAGE SLOT REGISTRY START[\s\S]*?! JO9 WINDOWS IMAGE SLOT REGISTRY END/)[0];
 a.equal(registry(next),registry(b));a.match(next,/jo9_candidate_ids\[jo9_count\] = 10005/);a.match(next,/if .* = 'content\/pic\/scene\/example \(5\)\.png': jo9_ic_duplicate = 1/);
});
test('mode2 original rendered path is returned before automatic selection and mode1 cycles original IDs',()=>{
 const b=rules.buildBody(fixture(),[rule()]),mode2=b.indexOf('if args[2] = 2:'),mode0=b.indexOf('if args[2] = 0 and jo9_ic_auto_at >= 0:');
 a(mode2>=0&&mode0>mode2);a(b.slice(mode2,mode0).includes('$result = $jo9_saved_path'));a.match(b,/if args\[2\] = 1: jo9_selected_at = \(jo9_selected_at \+ 1\) mod jo9_active_count/);
});
test('known guard, image renderer, registry and following room code remain unchanged',()=>{
 const b=fixture(),next=rules.buildBody(b,[rule()]);a.equal(next.split('\r\n')[0],b.split('\r\n')[0]);a(next.endsWith("*pl 'Keep all room dialogue and image lifetime code'"));a(next.includes("if $args[0] = 'jo9_html':\r\n $result = $args[1]\r\n exit\r\nend"));
 a.equal(checkSyntax(next).ok,true,JSON.stringify(checkSyntax(next).errors));
});
test('missing anchors, malformed own markers and invalid metadata are rejected',()=>{
 a.throws(()=>rules.buildBody('*pl 1',[rule()]));const next=rules.buildBody(fixture(),[rule()]);
 a.throws(()=>rules.readRules(next.replace('! JO9 IMAGE CUT CONDITIONS JSON ','! REMOVED ')));
 a.throws(()=>rules.buildBody(next.replace('JO9_CUT_CONDITIONS_REGISTERED_FILTER_20261101','JO9_CUT_CONDITIONS_TAMPERED_20261101'),[rule()]));
});
test('actual current WORK body accepts build/remove without touching registry or other source bytes',()=>{
 const raw=fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'),d=core.parse(raw),l=d.locations.find(x=>x.name==='interior_change'),body=core.shift(d.lines[l.body],5),next=rules.buildBody(body,[rule({base:'content/pic/bg/colosseum.png',path:'content/pic/bg/colosseum (2).png',morality:{min:5,max:10},rank:null})]);
 a.equal(checkSyntax(next).ok,true,JSON.stringify(checkSyntax(next).errors));a.equal(rules.buildBody(next,[]),body);a.deepEqual(core.serialize(d),raw);
});

function currentBody(){const d=core.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));return core.shift(d.lines[d.locations.find(x=>x.name==='interior_change').body],5);}
test('static base installer is inert with no rules and is idempotent on actual WORK',()=>{
 const original=currentBody(),base=rules.installBaseBody(original);
 a.equal(rules.installBaseBody(base),base);a.deepEqual(rules.readRules(base),[]);a.equal(rules.buildBody(base,[]),base);
 a(base.includes("if $args[0] = 'jo9_condition_path':\r\n $result = $args[1]\r\n exit\r\nend"));
 a(base.includes("if $args[0] = 'jo9_cut_condition':\r\n result = -1\r\n exit\r\nend"));
 a.equal(checkSyntax(base).ok,true,JSON.stringify(checkSyntax(base).errors));
});
test('excluded main and combat HTML now applies conditions while retaining every cycler exclusion',()=>{
 const original=currentBody(),base=rules.installBaseBody(original),exclusion=s=>s.split('\r\n').find(x=>x.includes("if $curloc = 'main_screen'"));
 a.equal(exclusion(base),exclusion(original));
 a(base.includes("$result = func('interior_change', 'jo9_condition_html', $jo9_html)"));
 const coreBlock=base.match(/! JO9 MOD START JO9_CUT_CONDITION_CORE_20261101[\s\S]*?! JO9 MOD END JO9_CUT_CONDITION_CORE_20261101/)[0];
 a(!/jo9_cut_choice|jo9_image_count|jo9_clean|jo9_last_button|\*clr|\*p\b/.test(coreBlock));
 a(coreBlock.includes('local $jo9_ic_html'));a(coreBlock.includes("$jo9_ic_newsrc = func('interior_change', 'jo9_condition_path', $jo9_ic_src)"));
});
test('pure HTML transformer retains original quote, spacing and surrounding HTML expressions',()=>{
 const base=rules.installBaseBody(currentBody());
 a(base.includes("\\s[sS][rR][cC]\\s*=\\s*\"([^\"]+)\""));
 a(base.includes("\\s[sS][rR][cC]\\s*=\\s*''([^'']+)''"));
 a(base.includes('$jo9_ic_newattr = $replace($jo9_ic_attr, $jo9_ic_src, $jo9_ic_newsrc)'));
 a(base.includes('$jo9_ic_html = $mid($jo9_ic_html, 1, jo9_ic_next - 1) + $jo9_ic_newtag + $mid($jo9_ic_html, jo9_ic_next + len($jo9_ic_tag))'));
});
test('configured pure path override comes before fallback, uses existence and avoids saved choice mutation',()=>{
 const base=rules.installBaseBody(currentBody()),rs=[rule(),rule({path:'content/pic/scene/example (5).png',rank:null,money:{op:'ge',value:900}})],next=rules.buildBody(base,rs);
 a(next.indexOf("if $args[0] = 'jo9_condition_path':")<next.indexOf('! JO9 MOD START JO9_CUT_CONDITION_CORE_20261101'));
 const data=next.match(/! JO9 MOD START JO9_CUT_CONDITIONS_DATA_20261101[\s\S]*?! JO9 MOD END JO9_CUT_CONDITIONS_DATA_20261101/)[0];
 a(data.includes('jo9_ic_path_match < jo9_ic_path_best'));a(data.includes('if jo9_ic_path_exists = 1:'));
 a(!/jo9_cut_choice|jo9_image_count|jo9_clean|jo9_last_button/.test(data));
 a.equal(checkSyntax(next).ok,true,JSON.stringify(checkSyntax(next).errors));a.equal(rules.buildBody(next,[]),base);
});
test('static base refuses unknown source or incomplete/tampered core',()=>{
 a.throws(()=>rules.installBaseBody(fixture()));
 const base=rules.installBaseBody(currentBody());
 a.throws(()=>rules.installBaseBody(base.replace('! JO9 MOD END JO9_CUT_CONDITION_CORE_20261101','! broken')));
 a.throws(()=>rules.installBaseBody(base.replace("$result = func('interior_change', 'jo9_condition_html', $jo9_html)",'$result = $jo9_html')));
});
