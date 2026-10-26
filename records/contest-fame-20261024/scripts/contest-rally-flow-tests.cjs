'use strict';
// Diagnostic native rally flow. Only draw RNG and the final rendering endpoint change.
module.exports = function rallyFlowTests(d, c) {
  const cr = s => s.replace(/\r?\n/g, '\r\n');
  const read = name => c.shift(d.lines[d.locations.find(x => x.name === name).body], 5);
  const set = (name, s) => { d.lines[d.locations.find(x => x.name === name).body] = c.shift(cr(s), -5); };
  const add = (name, s) => {
    const count = c.parse(c.serialize(d)).locations.length;
    d.lines.splice(-1, 0, c.shift(name, -5), c.shift('', -5), c.shift(cr(s), -5), c.shift('0', -5));
    d.lines[3] = c.shift(String(count + 1), -5);
  };
  let city = read('interaction_city'), altered = 0;
  for (const selector of [102113, 102114, 102115, 102116]) {
    const rx = new RegExp('(^[ \\t]*IF interaction_city = ' + selector + ':[\\s\\S]*?)(^[ \\t]*END[ \\t]*$)', 'gmi');
    city = city.replace(rx, (all, pre, end) => {
      const hits = pre.match(/a = RAND\(1,[34]\)/g) || [];
      if (hits.length !== 1) throw Error('Unexpected native draw ' + selector);
      altered++;
      return pre.replace(/a = RAND\(1,[34]\)/, 'a = jo9_qa_rally_draw') + end;
    });
  }
  if (altered !== 8) throw Error('Expected eight native draw substitutions, got ' + altered);
  set('interaction_city', city);
  const specs = {
    102113: {oral:3,xeno:3,count:3,win:draw=>draw!==2,yes:102118,no:102117},
    102114: {oral:2,xeno:2,count:4,win:draw=>draw===2,yes:102119,no:102120},
    102115: {oral:3,xeno:2,count:3,win:draw=>draw===2,yes:102121,no:102122},
    102116: {oral:2,xeno:3,count:3,win:draw=>draw===2,yes:102123,no:102124}
  };
  const xs = [];
  for (const hero of [1,101]) {
    for (const [selector,spec] of Object.entries(specs)) {
      for (let draw=1; draw<=spec.count; draw++) xs.push({hero,selector:+selector,draw,type:'entry',repeatResult:true});
      xs.push({hero,selector:+selector,draw:spec.yes===102118?1:2,type:'old_draw'});
      xs.push({hero,selector:+selector,draw:spec.yes===102118?1:2,type:'old_result'});
    }
    xs.push({hero,selector:102113,draw:1,type:'entry',rate:39,won:1});
    xs.push({hero,selector:102113,draw:1,type:'entry',rate:79,won:1,quarter:3});
    xs.push({hero,selector:102113,draw:1,type:'entry',rate:80,won:1});
    xs.push({hero,selector:102113,draw:1,type:'refusal'});
    xs.push({hero,selector:102113,draw:1,type:'quarter_series',rate:40,won:1});
  }
  let assertions = 0;
  const check = (predicate,label) => {
    assertions++;
    return `if (${predicate})=0: msg 'FAIL_CONTEST_RF_${label}' & exit\n`;
  };
  const fixture = x => {
    const spec=specs[x.selector];
    return `killvar 'slave'\nkillvar '$slave'\nkillvar 'slave_rate'\nkillvar 'jo9_rally_ticket'\nkillvar '$jo9_rally_ticket'\nkillvar 'city_already_done_today'\nkillvar 'city_already_done_ever'\nhero_choice=${x.hero}\nslave_state=CONST_INT['slave_exist']\nassistant_state=CONST_INT['slave_exist']\nslave_type=2571\nslave['id']=910001\n$slave_name='QA Rally'\nslave['age']=2\nslave['stamina']=3\nslave['obedience']=${x.type==='refusal'?2:5}\nslave['oral']=${x.type==='refusal'?6:spec.oral}\nslave['xenophily']=${x.type==='refusal'?6:spec.xeno}\nslave['energy']=10\nslave['jo9_rally_won']=${x.won??0}\nslave['jo9_rally_fame_quarter']=${x.quarter??0}\nslave['catfight_level']=2\nslave_rate['fame']=${x.rate??23}\nassistant_rate['fame']=61\n$place='erosalon'\nsp_txt_is_set_from_save=0\ntxt_is_set_from_save=0\nsp_txt=1\nsnk_room_target=0\nsparks=1000\nmaster_energy=10\nmaster_half_action=0\nvirginity=2\nejaculation_intensity=0\n$slave_psy_status=''\njo9_qa_rally_phase=0\njo9_qa_rally_draw=${x.draw}\n`;
  };
  let next='jo9_qa_rally_case += 1\n', endpoint='';
  for (let index=0; index<xs.length; index++) {
    const x=xs[index],num=index+1,spec=specs[x.selector];
    const win=x.type==='old_result'||spec.win(x.draw),result=x.type==='refusal'?102103:(win?spec.yes:spec.no);
    const rate=x.rate??23,q=x.quarter??0,won=x.won??0;
    const eligible=!['old_draw','old_result','refusal'].includes(x.type);
    const gain=eligible&&win&&rate<80?Math.min(won===0?40:rate<40?4:1,320-rate*4-q):0;
    const expectedRate=rate>=80?rate:Math.floor((rate*4+q+gain)/4),expectedQ=rate>=80&&eligible&&win?0:(rate*4+q+gain)%4;
    const expectedWon=eligible&&win?1:won;
    const start=x.type==='old_draw'?x.selector:x.type==='old_result'?spec.yes:102102;
    next+=`if jo9_qa_rally_case=${num}:\n`+fixture(x)+`interaction_city=${start}\ngt 'interaction_city'\nend\n`;
    endpoint+=`if jo9_qa_rally_case=${num}:\n`;
    endpoint+=check(`interaction_city=${result}`,`${num}_result`);
    endpoint+=check("arrsize('jo9_rally_ticket')=0 and arrsize('$jo9_rally_ticket')=0",`${num}_ticket_consumed`);
    endpoint+=check("assistant_rate['fame']=61 and slave['catfight_level']=2 and master_energy=10 and master_half_action=0",`${num}_other_state`);
    if(x.type==='quarter_series') {
      for(let stage=0;stage<4;stage++) {
        endpoint+=`if jo9_qa_rally_phase=${stage}:\n`;
        endpoint+=check(`slave_rate['fame']=${stage===3?41:40} and slave['jo9_rally_fame_quarter']=${(stage+1)%4} and slave['jo9_rally_won']=1`,`${num}_quarter_${stage}`);
        endpoint+=check(`sparks=${1000+300*(stage+1)} and slave['energy']=${10-3*(stage+1)}`,`${num}_native_${stage}`);
        if(stage<3)endpoint+=`jo9_qa_rally_phase=${stage+1}\ninteraction_city=102102\ngt 'interaction_city'\n`;
        else endpoint+="gt 'jo9_qa_rally_next'\n";
        endpoint+='end\n';
      }
    } else {
      endpoint+=check(`slave_rate['fame']=${expectedRate} and slave['jo9_rally_fame_quarter']=${expectedQ} and slave['jo9_rally_won']=${expectedWon}`,`${num}_fame`);
      const money=x.type==='refusal'?-100:win?300:-100,energy=x.type==='refusal'?0:-3;
      if(x.repeatResult) {
        endpoint+="if jo9_qa_rally_phase=0:\n";
        endpoint+=check(`sparks=${1000+money} and slave['energy']=${10+energy}`,`${num}_native_first`);
        endpoint+=`jo9_qa_rally_phase=1\ninteraction_city=${result}\ngt 'interaction_city'\nend\n`;
        endpoint+=check(`sparks=${1000+money*2} and slave['energy']=${10+energy*2}`,`${num}_native_legacy_reentry`);
      } else endpoint+=check(`sparks=${1000+money} and slave['energy']=${10+energy}`,`${num}_native`);
      endpoint+="gt 'jo9_qa_rally_next'\n";
    }
    endpoint+='end\n';
  }
  next+="msg 'JO9_QA_CONTEST_rally_flow_COMPLETE'\n";
  endpoint+="msg 'FAIL_CONTEST_RF_UNKNOWN_CASE'\n";
  set('interaction_screen_city', "gt 'jo9_qa_rally_endpoint'");
  add('jo9_qa_rally_next',next);
  add('jo9_qa_rally_endpoint',endpoint);
  d=c.parse(c.serialize(d));
  return {d,code:"jo9_qa_rally_case=0\ngt 'jo9_qa_rally_next'\n",cases:xs.length,assertions,
    scenarios:xs.map(x=>({...x})),
    limits:['Diagnostic RNG constants replace exactly the eight native rally draw lines; insemination RNG and all production fame helper code remain original.',
      'Native entry, skill routing, result branches and interaction_result_city completion path execute; final HTML rendering alone is intercepted.',
      'Result branch reentry repeats native currency/AP effects as before; suite verifies the added fame stays single-use without changing that pre-existing behavior.',
      'No GUI image layout or legacy historical first-win reconstruction is claimed.']};
};
