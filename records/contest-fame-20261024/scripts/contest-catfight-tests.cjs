'use strict';
// Diagnostic-only native control-flow suite. Does not write WORK or game helpers.
module.exports = function catfightTests(d, c) {
  const cr = s => s.replace(/\r?\n/g, '\r\n');
  const set = (name, s) => {
    const l = d.locations.find(x => x.name === name);
    if (!l) throw Error('Missing diagnostic endpoint ' + name);
    d.lines[l.body] = c.shift(cr(s), -5);
  };
  const add = (name, s) => {
    const count = c.parse(c.serialize(d)).locations.length;
    d.lines.splice(-1, 0, c.shift(name, -5), c.shift('', -5), c.shift(cr(s), -5), c.shift('0', -5));
    d.lines[3] = c.shift(String(count + 1), -5);
  };
  const xs = [];
  for (const hero of [1, 101]) {
    for (const wins of [0, 1, 2, 3, 4]) xs.push({name:`win_${hero}_${wins}`,type:'finish',hero,wins,outcome:'победа',gain:wins===0?10:wins<3?3:0});
    for (const outcome of ['бегство', 'вырубился']) for (const wins of [0, 1, 2, 3]) xs.push({name:`loss_${hero}_${outcome==='бегство'?'retreat':'ko'}_${wins}`,type:'finish',hero,wins,outcome,gain:0});
    for (const wins of [3, 4, 99]) xs.push({name:`blocked_${hero}_${wins}`,type:'blocked',hero,wins});
    for (const wins of [0, 1, 2, 3, 4]) xs.push({name:`menu_${hero}_${wins}`,type:'menu',hero,wins});
    xs.push({name:`result_${hero}`,type:'result',hero,wins:1,gain:0});
    xs.push({name:`repeat_token_${hero}`,type:'duplicate',hero,wins:0,gain:10});
    xs.push({name:`repeat_result_${hero}`,type:'repeat_result',hero,wins:0,gain:10});
    xs.push({name:`three_wins_${hero}`,type:'series',hero,wins:0});
    xs.push({name:`colosseum_${hero}`,type:'arena',hero,wins:1});
    xs.push({name:`death_survived_${hero}`,type:'killed',hero,wins:1,gain:0});
  }
  xs.push({name:'near_cap',type:'finish',hero:1,wins:0,outcome:'победа',gain:2,fame:198});
  xs.push({name:'at_cap',type:'finish',hero:1,wins:0,outcome:'победа',gain:0,fame:200});
  xs.push({name:'role_swap',type:'swap',hero:1,wins:2});
  xs.push({name:'same_seed_separate_actors',type:'same_seed',hero:1,wins:0});
  let assertions = 0;
  const check = (predicate, label) => {
    assertions++;
    return `if (${predicate}) = 0: msg 'FAIL_CONTEST_CF_${label}' & exit\n`;
  };
  const finish = outcome => `$fight_return='Start1'\n$итог_боя='${outcome}'\ngt 'выход_из_боя'\n`;
  let next = 'jo9_qa_cf_case += 1\n';
  let endpoint = '';
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i], num = i + 1, fame = x.fame ?? 23;
    next += `if jo9_qa_cf_case = ${num}:\n`;
    next += `killvar 'slave'\nkillvar '$slave'\nkillvar 'slave_rate'\nkillvar 'assistant'\nkillvar '$assistant'\nkillvar 'assistant_rate'\nkillvar 'jo9_fog'\nkillvar 'jo9_combat'\nkillvar '$враг'\nhero_choice=${x.hero}\nslave_state=CONST_INT['slave_exist']\nassistant_state=CONST_INT['slave_exist']\nslave_type=100\nassistant_type=100\n$slave_name='CF Probe'\n$assistant_name='Other Probe'\nslave['id']=1234567\nassistant['id']=1234567\nslave['catfight_level']=${x.wins}\nassistant['catfight_level']=1\nslave['arena_level']=2\nassistant['arena_level']=1\nslave['energy']=5\nassistant['energy']=5\nslave['calories']=500\nslave['stamina']=10\nslave['age']=2\nslave['temper']=10\nslave['loser_rating']=0\nslave['winning_series']=7\nslave['gladiatrix']=2\nslave['totalEarned']=77\nslave['sensitivity']=2\nslave_rate['fame']=${fame}\nassistant_rate['fame']=61\n$slave['trademark_style']='retained_style'\n$assistant['trademark_style']='other_style'\n$place='catfightclub'\nmaster_energy=10\nmaster_half_action=0\nis_home=1\nsparks=1000\ncombatant=1\ncolosseum_fight=0\nsp_txt_is_set_from_save=0\nsp_txt=1\nskip_to=0\nsnk_room_target=0\n$g_type='dimacherus'\n$toplay=''\n$city_sounds=''\n$fight_return=''\n$return_lock='jo9_qa_cf_endpoint'\n$враг[1]='qa_no_enemy'\nfog_battle=0\nget_girl=0\nfighting_experience=0\njo9_qa_cf_phase=0\n`;
    if (['finish','duplicate','repeat_result','series','same_seed'].includes(x.type)) next += finish(x.outcome ?? 'победа');
    if (x.type === 'killed') next += finish('убит');
    if (x.type === 'result') next += "interaction_city=103005\ngt 'interaction_city'\n";
    if (x.type === 'arena') next += "$fight_return='Start'\n$итог_боя='победа'\nchallenge_type=0\ngt 'выход_из_боя'\n";
    if (x.type === 'blocked') next += "$fight_return='qa_sentinel'\narena_mode=7\nsp_txt=3\nskip_to=14\ngt '$catfight_fight_start'\n";
    if (x.type === 'menu') {
      next += "$text_display=''\ndynamic $catfightclub_options[1]\n";
      next += check(`(instr($text_display, 'combatant = 1') > 0) = ${x.wins < 3 ? 1 : 0}`, x.name+'_allowed');
      next += check(`slave_rate['fame']=${fame} and slave['catfight_level']=${x.wins}`, x.name+'_unchanged');
      next += "gt 'jo9_qa_cf_next'\n";
    }
    if (x.type === 'swap') {
      next += "dynamic $swap_slave_instances, 'slave', 'assistant'\n";
      next += check("slave['catfight_level']=1 and assistant['catfight_level']=2 and slave_rate['fame']=61 and assistant_rate['fame']=23", 'swap_values');
      next += check("$slave_name='Other Probe' and $assistant_name='CF Probe'", 'swap_names');
      next += "dynamic $swap_slave_instances, 'slave', 'assistant'\n";
      next += check("slave['catfight_level']=2 and assistant['catfight_level']=1 and slave_rate['fame']=23 and assistant_rate['fame']=61", 'swap_roundtrip');
      next += "gt 'jo9_qa_cf_next'\n";
    }
    next += 'end\n';
    if (['menu','swap'].includes(x.type)) continue;
    endpoint += `if jo9_qa_cf_case = ${num}:\n`;
    if (x.type === 'blocked') {
      // Returning through native interaction_city resets arena_mode to zero.
      endpoint += check("$args[0]='club' and $fight_return='qa_sentinel' and arena_mode=0", x.name+'_no_init');
      endpoint += check(`slave['catfight_level']=${x.wins} and slave_rate['fame']=23 and slave['calories']=500`, x.name+'_unchanged');
      endpoint += check("sp_txt=1 and skip_to=0 and interaction_city=10201",x.name+'_club');
    } else if (x.type === 'arena') {
      endpoint += check("$args[0]='result' and interaction_city=1294",x.name+'_native_result');
      endpoint += check("slave['catfight_level']=1 and slave['arena_level']=3",x.name+'_native_levels');
      endpoint += check("slave_rate['fame']=31 and slave['winning_series']=8",x.name+'_native_fame');
    } else if (x.type === 'series') {
      endpoint += check("$args[0]='result' and $fight_return=''",x.name+'_endpoint');
      for (let stage=0; stage<3; stage++) {
        endpoint += `if jo9_qa_cf_phase=${stage}:\n`;
        endpoint += check(`slave['catfight_level']=${stage+1} and slave_rate['fame']=${[33,36,39][stage]}`,x.name+'_stage'+stage);
        if (stage < 2) endpoint += `jo9_qa_cf_phase=${stage+1}\nslave['energy']=5\n` + finish('победа');
        else endpoint += check("slave_rate['fame']-23=16",x.name+'_total16') + "gt 'jo9_qa_cf_next'\n";
        endpoint += 'end\n';
      }
    } else if (x.type === 'same_seed') {
      endpoint += `if jo9_qa_cf_phase=0:\n`;
      endpoint += check("slave['catfight_level']=1 and slave_rate['fame']=33 and assistant['catfight_level']=1 and assistant_rate['fame']=61",x.name+'_first_actor');
      endpoint += "dynamic $swap_slave_instances, 'slave', 'assistant'\njo9_qa_cf_phase=1\nslave['energy']=5\n" + finish('победа') + 'end\n';
      endpoint += check("slave['catfight_level']=2 and slave_rate['fame']=64 and assistant['catfight_level']=1 and assistant_rate['fame']=33",x.name+'_independent');
      endpoint += check("slave['id']=assistant['id']",x.name+'_same_id');
    } else {
      const won = x.outcome==='победа' || ['duplicate','repeat_result'].includes(x.type);
      const want = x.type==='result'||x.type==='killed'?x.wins:x.wins+(won?1:0);
      const wantFame = fame + (x.gain ?? 0);
      endpoint += check(`slave['catfight_level']=${want} and slave_rate['fame']=${wantFame}`,x.name+'_reward');
      endpoint += check("assistant['catfight_level']=1 and assistant_rate['fame']=61",x.name+'_other_actor');
      endpoint += check("slave['arena_level']=2 and $slave['trademark_style']='retained_style'",x.name+'_other_contests');
      if(x.type!=='result') endpoint += check("$fight_return=''",x.name+'_token_consumed');
      if(x.type==='killed') endpoint += check("$args[0]='death'",x.name+'_native_death_fallthrough');
      if (['duplicate','repeat_result'].includes(x.type)) {
        endpoint += `if jo9_qa_cf_phase=0:\njo9_qa_cf_phase=1\n`;
        if(x.type==='duplicate') endpoint += "$return_lock='jo9_qa_cf_endpoint'\n$враг[1]='qa_no_enemy'\ngt 'выход_из_боя'\n";
        else endpoint += "interaction_city=103005\ngt 'interaction_city'\n";
        endpoint += 'end\n';
      }
    }
    endpoint += "gt 'jo9_qa_cf_next'\nend\n";
  }
  next += "msg 'JO9_QA_CONTEST_catfight_COMPLETE'\n";
  endpoint += "msg 'FAIL_CONTEST_CF_unexpected_endpoint'\n";
  set('interaction_screen_city', "gt 'jo9_qa_cf_endpoint', 'result'");
  set('shop_general', "gt 'jo9_qa_cf_endpoint', 'club'");
  set('боевой_интерфейс', "gt 'jo9_qa_cf_endpoint', 'battle'");
  // A native killed outcome surviving the stamina roll falls through to exit.
  // Intercept the final ending UI, without changing the native decision path.
  set('exit', "gt 'jo9_qa_cf_endpoint', 'death'");
  add('jo9_qa_cf_next', next);
  add('jo9_qa_cf_endpoint', endpoint);
  const parsed = c.parse(c.serialize(d));
  if (!c.serialize(parsed).equals(c.serialize(d))) throw Error('Diagnostic QSP roundtrip mismatch');
  return {d:parsed,code:"$onnewloc=''\n$counter=''\n$code_rev='2.4.0.0'\n$title_fix='잭 오 나인 테일 v<<$code_rev>> Kor Ver'\n$game_ver=$title_fix\none_time_conversion_of_interaction_counter_arrays=1\njo9_qa_cf_case=0\ngt 'jo9_qa_cf_next'\n",cases:xs.length,assertions,scenarios:xs,limits:'Only final city/club/battle/ending UI endpoints are replaced. Native combat finish, city result, entry guard, menu and swap code run unchanged. Killed-with-high-stamina cases follow the native fallthrough to the protagonist ending; the final exit UI is intercepted to verify no contest fame reward. Actor-deleting lethal result variants are not attributed after removal. The fixture starts at the current game version to avoid the unrelated first-load update notice.'};
};
