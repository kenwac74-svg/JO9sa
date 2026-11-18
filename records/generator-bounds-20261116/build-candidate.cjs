'use strict';
const fs=require('node:fs'),path=require('node:path');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const root=__dirname, source='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const raw=fs.readFileSync(source),d=c.parse(raw),l=d.locations.find(x=>x.name==='generate_stock');
const original=c.shift(d.lines[l.body],5),nl='\r\n';
let candidate=original;
const edits=[];
function edit(old,lines){const replacement=lines.join(nl);if(candidate.split(old).length!==2)throw Error('Anchor missing or duplicated');candidate=candidate.replace(old,replacement);edits.push({location:'generate_stock',field:'body',old,new:replacement,count:1,patchId:'GENERATOR_RETRY_BOUNDS_20261116'});}
edit('\t\t!RANDOM AGE'+nl+'\t\t:loop_meta'+nl+'\t\t\tmeta_type = rand(1,5)'+nl+'\t\t\tif meta_type = 4: meta_type = 2'+nl+'\t\t\tif meta_type = 5: meta_type = 3',[
 '\t\t!RANDOM AGE',
 '\t\t! JO9 MOD START GENERATOR_RETRY_BOUNDS_20261116_META',
 '\t\tlocal jo9_gen_meta_tries = 0',
 '\t\t:loop_meta',
 '\t\tif jo9_gen_meta_tries < 32:',
 '\t\t\tjo9_gen_meta_tries += 1',
 '\t\t\tmeta_type = rand(1,5)',
 '\t\t\tif meta_type = 4: meta_type = 2',
 '\t\t\tif meta_type = 5: meta_type = 3',
 '\t\telse',
 '\t\t\tmeta_type = 2',
 '\t\tend',
 '\t\t! JO9 MOD END GENERATOR_RETRY_BOUNDS_20261116_META'
]);
edit('\t:loop_type'+nl,[
 '\t! JO9 MOD START GENERATOR_RETRY_BOUNDS_20261116_TYPE',
 '\tlocal jo9_gen_type_tries = 0',
 '\t:loop_type',
 '\tjo9_gen_type_tries += 1',
 '\tif jo9_gen_type_tries > 32:',
 '\t\t! Same installed pool as jo9_mob_pool; only recent-type exclusion is relaxed.',
 '\t\tlocal jo9_gen_pool_count = 0',
 '\t\tif meta_type = 1: jo9_gen_pool_count = max(0, loli_last-loli_first+1) + 180',
 '\t\tif meta_type = 2: jo9_gen_pool_count = max(0, max(young_last,1462)-young_first+1) + 260',
 '\t\tif meta_type = 3: jo9_gen_pool_count = max(0, max(milf_last,2340)-milf_first+1) + 288',
 '\t\tlocal jo9_gen_scan = 1',
 '\t\tlocal jo9_gen_age = iif(meta_type=1, CONST_INT[\'loli_age\'], iif(meta_type=2, CONST_INT[\'young_age\'], CONST_INT[\'milf_age\']))',
 '\t\t:jo9_gen_type_fallback',
 '\t\tif jo9_gen_scan <= jo9_gen_pool_count:',
 '\t\t\tstock_type = func(\'jo9_mob_pool\', meta_type, jo9_gen_scan)',
 '\t\t\tif stock_type > 0 and stock_type ! 1448 and stock_type ! 1450 and stock_type ! 2339:',
 '\t\t\t\tif $seed_ava[stock_type] ! \'\' and seed_age[stock_type] = jo9_gen_age:',
 '\t\t\t\t\tif (no_loli ! 1 or meta_type ! 1) and (no_milf ! 1 or meta_type ! 3): jump \'jo9_gen_type_ready\'',
 '\t\t\t\tend',
 '\t\t\tend',
 '\t\t\tjo9_gen_scan += 1',
 '\t\t\tjump \'jo9_gen_type_fallback\'',
 '\t\tend',
 '\t\t! No valid installed candidate: abort the caller instead of accepting type zero.',
 '\t\tdynamic $clear_slave_instance, \'stock\'',
 '\t\tstock_state = CONST_INT[\'no_slave\']',
 '\t\tstock_type = 0',
 '\t\tslave_base_price = 0',
 '\t\tmsg \'대상을 불러오지 못했습니다. 이전 화면으로 돌아갑니다.\'',
 '\t\tif is_home = 1: gt \'main_screen\'',
 '\t\tgt \'city_menu_form\'',
 '\tend',
 '\t! JO9 MOD END GENERATOR_RETRY_BOUNDS_20261116_TYPE',
 ''
]);
edit('\tprev_num_type[num_count] = stock_type &! record that we have used this type',[
 '\t! JO9 MOD START GENERATOR_RETRY_BOUNDS_20261116_TYPE_READY',
 '\t:jo9_gen_type_ready',
 '\tif jo9_gen_type_tries > 32 and num_count >= 88:',
 '\t\tkillvar \'num_count\'',
 '\t\tkillvar \'prev_num_type\'',
 '\t\tnum_count = 0',
 '\t\tprev_num_type = 0',
 '\tend',
 '\t! JO9 MOD END GENERATOR_RETRY_BOUNDS_20261116_TYPE_READY',
 '\tprev_num_type[num_count] = stock_type &! record that we have used this type'
]);
edit('i = 0'+nl+'!Slaves can now no longer generate with stats less than one.',[ 'i = 0', '! JO9 MOD START GENERATOR_RETRY_BOUNDS_20261116_ATTR_INIT', 'local jo9_gen_attr_tries = 0', '! JO9 MOD END GENERATOR_RETRY_BOUNDS_20261116_ATTR_INIT', '!Slaves can now no longer generate with stats less than one.']);
edit("if attribute_sum < 12:"+nl+"\ti = 0"+nl+"\tjump 'loop'"+nl+"end",[
 '! JO9 MOD START GENERATOR_RETRY_BOUNDS_20261116_ATTR',
 'jo9_gen_attr_tries += 1',
 'if attribute_sum < 12:',
 '\tif jo9_gen_attr_tries < 32:',
 '\t\ti = 0',
 '\t\tjump \'loop\'',
 '\tend',
 '\t! Keep the sum threshold; raise low core attributes without reducing preset values.',
 ...['stamina','beauty','sensitivity','intellect','temper','ego'].map(k=>"\tstock['"+k+"'] = max(2, stock['"+k+"'])"),
 '\tattribute_sum = stock[\'stamina\'] + stock[\'beauty\'] + stock[\'sensitivity\'] + stock[\'intellect\'] + stock[\'temper\'] + stock[\'ego\']',
 'end',
 '! JO9 MOD END GENERATOR_RETRY_BOUNDS_20261116_ATTR'
]);
const changed={...d,lines:d.lines.slice()};changed.lines[l.body]=c.shift(candidate,-5);const after=c.serialize(changed);const check=c.parse(after);
if(check.lines.some((s,i)=>i!==l.body&&s!==d.lines[i]))throw Error('Unexpected scope');
const mod={id:'2026-11-16_generate_stock_retry_bounds',status:'CANDIDATE',description:'Bound all three generate_stock retry cycles to 32 random attempts. After the cap use permitted age 2, a deterministic valid same-category pool candidate (recent duplicates only relaxed), or core attributes at least 2. Abort to home/city when the category has no valid registered candidate.',before_sha256:d.hash,after_sha256:c.hash(after),edits};
fs.writeFileSync(path.join(root,'candidate-mod.json'),JSON.stringify(mod,null,2),'utf8');
fs.writeFileSync(path.join(root,'candidate-generate_stock.qsps'),candidate,'utf8');
fs.writeFileSync(path.join(root,'candidate-diff.json'),JSON.stringify({before:d.hash,after:c.hash(after),edits:edits.length,addedBodyBytes:Buffer.byteLength(candidate,'utf16le')-Buffer.byteLength(original,'utf16le'),addedBodyLines:candidate.split(nl).length-original.split(nl).length,changedField:l.body,otherFieldsUnchanged:true},null,2),'utf8');
console.log(JSON.stringify({before:d.hash,after:c.hash(after),edits:edits.length,addedBodyBytes:Buffer.byteLength(candidate,'utf16le')-Buffer.byteLength(original,'utf16le'),addedBodyLines:candidate.split(nl).length-original.split(nl).length}));
