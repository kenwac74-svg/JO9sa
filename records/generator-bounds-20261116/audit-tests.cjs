'use strict';
// Executes the real generate_stock retry prefix in a minimal QSP world.
// Only RNG boundaries and the numeric seed loader are controlled by fixtures.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const root = __dirname;
const core = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const source = 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const engine = 'G:/somi/Jack O Nine Tails v2.4_work/game/engine/jack.exe';
const runner = 'G:/somi/JO9sa/tools/qa/run-client-smoke.ps1';
const mode = process.argv[2] || 'red';
if (!['red', 'green'].includes(mode)) throw Error('Use red or green');
fs.mkdirSync(root, {recursive: true});
const raw = fs.readFileSync(source), doc = core.parse(raw);
const body = name => core.shift(doc.lines[doc.locations.find(l => l.name === name).body], 5);
let generator = body('generate_stock');
if (mode === 'green') {
  const mod = JSON.parse(fs.readFileSync(path.join(root, 'candidate-mod.json'), 'utf8'));
  for (const edit of mod.edits) {
    if (generator.split(edit.old).length !== 2) throw Error('Candidate anchor not found once');
    generator = generator.replace(edit.old, edit.new);
  }
}
const cutoff = '!TRANSLATE PRESET BEAUTY TO RATE';
if (!generator.includes(cutoff)) throw Error('Retry prefix cutoff missing');
generator = generator.slice(0, generator.indexOf(cutoff));
const nl = '\r\n';
const cases = [
  {name:'meta-blocked', randomMeta:1, randomType:1001, randomStat:8,
   setup:'no_loli=1', want:'meta_type=2 and stock_type=1001', redTimeout:true},
  {name:'type-duplicate', randomType:1001, randomStat:8,
   setup:'cheat_f=1\r\nnum_count=1\r\nprev_num_type[0]=1001', want:'stock_type=1001', redTimeout:true},
  {name:'type-excluded', randomType:1448, randomStat:8,
   setup:'cheat_f=1', want:'stock_type=1001', redTimeout:true},
  {name:'type-history-reset', randomType:1448, randomStat:8,
   setup:'cheat_f=1\r\nnum_count=100', want:'stock_type=1001 and num_count=1 and prev_num_type[0]=1001', redTimeout:true},
  {name:'type-gap', randomType:2339, randomStat:8,
   setup:"cheat_f=1\r\n$seed_ava[1001]=''", want:'stock_type=1002', redTimeout:true},
  {name:'stats-low', randomType:1001, randomStat:1,
   setup:'cheat_f=1', want:"attribute_sum>=12 and stock['stamina']>=2 and stock['beauty']>=2 and stock['sensitivity']>=2 and stock['intellect']>=2 and stock['temper']>=2 and stock['ego']>=2", redTimeout:true},
  {name:'explicit-stock', randomType:1001, randomStat:8,
   setup:"special_stock=1448\r\n$special_age='young'", want:"stock_type=1448 and stock['age']=0", redTimeout:false},
  {name:'normal-filter', randomMeta:4, randomType:1002, randomStat:8,
   setup:'no_loli=1\r\nno_milf=1', want:'meta_type=2 and stock_type=1002', redTimeout:false},
  {name:'empty-pool', randomType:1448, randomStat:8,
   setup:"cheat_f=1\r\nkillvar '$seed_ava'", want:'stock_type=0 and stock_state=-1 and slave_base_price=0', redTimeout:true, empty:true},
];
const results = [];
for (const test of cases) {
  const marker = 'JO9_QA_GEN_' + test.name.replaceAll('-', '_') + '_COMPLETE';
  let code = generator.replaceAll('meta_type = rand(1,5)', 'meta_type = ' + (test.randomMeta || 4))
    .replaceAll("func('jo9_mob_pool', 1)", String(test.randomType))
    .replaceAll("func('jo9_mob_pool', 2)", String(test.randomType))
    .replaceAll("func('jo9_mob_pool', 3)", String(test.randomType))
    .replaceAll('gen = rand(1,12)', 'gen = ' + test.randomStat);
  // An empty-pool diagnostic must observe the error route rather than stop at its UI message.
  if (test.empty) code = code.replace(/^([ \t]*)msg '대상을 불러오지 못했습니다\. 이전 화면으로 돌아갑니다\.'\r?$/m, '$1! diagnostic silences expected empty-registry message');
  const verify = "if " + test.want + ":\r\n msg '" + marker + "'\r\nelse\r\n msg 'GEN_ASSERT_FAILED'\r\nend\r\nexit";
  code += nl + (test.empty ? "msg 'GEN_EXPECTED_EMPTY_ABORT'" : verify);
  const setup = [
    "CONST_INT['loli_age']=1", "CONST_INT['young_age']=0", "CONST_INT['milf_age']=2",
    "CONST_INT['slave_exist']=1", "CONST_INT['no_slave']=-1", "age_code['young']=0",
    'loli_first=1', 'loli_last=3', 'young_first=1001', 'young_last=1003', 'milf_first=2001', 'milf_last=2003',
    "$seed_ava[1]='registered'", "$seed_ava[2]='registered'", "$seed_ava[3]='registered'",
    "$seed_ava[1001]='registered'", "$seed_ava[1002]='registered'", "$seed_ava[1003]='registered'",
    "$seed_ava[2001]='registered'", "$seed_ava[2002]='registered'", "$seed_ava[2003]='registered'",
    'seed_age[1]=1', 'seed_age[2]=1', 'seed_age[3]=1', 'seed_age[1001]=0', 'seed_age[1002]=0', 'seed_age[1003]=0',
    'seed_age[2001]=2', 'seed_age[2002]=2', 'seed_age[2003]=2',
    ...['fat','beauty','stamina','sensitivity','temper','ego','pride','intellect'].map((k,i)=>"$stockatr["+i+"]='stock[\""+k+"\"]'"),
    'is_home=0', test.setup, "gs 'generate_stock'", "msg 'GEN_RETURNED_WITHOUT_ASSERT'", 'exit'
  ].join(nl);
  const seed = ["stock['age']=seed_age[stock_type]", ...['fat','beauty','stamina','sensitivity','temper','ego','pride','intellect'].map(k=>"stock['"+k+"']=0")].join(nl);
  const worlds = [['Start',setup],['generate_stock',code],['get_stock_seed',seed],['jo9_mob_pool',body('jo9_mob_pool')],['city_menu_form',verify],['main_screen',verify]];
  const lines = doc.lines.slice(0, 3).concat([core.shift(String(worlds.length), -5)]);
  for (const [name,b] of worlds) lines.push(core.shift(name,-5),'',core.shift(b,-5),core.shift('0',-5));
  lines.push('');
  const fixture = path.join(root,'fixture.qsp');
  fs.writeFileSync(fixture, Buffer.from(lines.join(nl),'utf16le'));
  fs.writeFileSync(path.join(root,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
  fs.writeFileSync(path.join(root,'plan.json'),JSON.stringify([{name:test.name,checkpoint:'generator retry contract',file:fixture,marker}],null,2));
  let runnerExit = 0;
  try { cp.execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',runner,'-Engine',engine,'-Plan',path.join(root,'plan.json'),'-TimeoutSeconds','3'],{stdio:'pipe',timeout:10000}); }
  catch(e) { runnerExit=e.status ?? -1; }
  const result = JSON.parse(fs.readFileSync(path.join(root,'client-results.json'),'utf8').replace(/^\ufeff/,''))[0];
  const stderr = fs.readFileSync(path.join(root,test.name+'-stderr.log'),'utf8');
  const expected = mode === 'red' && test.redTimeout ? !result.pass && result.reason === 'Completion marker timeout' : result.pass;
  const observed = {case:test.name,mode,expectedRedTimeout:mode==='red'&&test.redTimeout,pass:expected,engine:result,runnerExit,qspError:/Error|errorCode|Unknown action/i.test(stderr),assertFailed:stderr.includes('GEN_ASSERT_FAILED')};
  results.push(observed);
  fs.writeFileSync(path.join(root,mode+'-'+test.name+'-engine.log'),stderr);
  console.log(JSON.stringify(observed));
}
fs.writeFileSync(path.join(root,mode+'-results.json'),JSON.stringify({sourceSha256:doc.hash,results},null,2));
for (const file of ['fixture.qsp','plan.json','client-results.json','FastQSP.ini',...cases.flatMap(t=>[t.name+'-stdout.log',t.name+'-stderr.log'])]) fs.rmSync(path.join(root,file),{force:true});
if (results.some(r=>!r.pass||r.qspError||r.assertFailed)) process.exitCode=1;
