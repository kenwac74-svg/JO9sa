'use strict';

const assert = require('node:assert/strict');

function applyProductivity({ body, edit, lines, append }) {
  function rewriteRows(location, rewrite) {
    const original = body(location).split('\r\n');
    let changes = 0;
    for (let index = original.length - 1; index >= 0; index -= 1) {
      const next = rewrite(original[index]);
      if (next === original[index]) continue;
      const current = body(location).split('\r\n');
      let from = index;
      let to = index + 1;
      let before = current[index];
      while (body(location).split(before).length !== 2) {
        assert.ok(from > 0 || to < current.length, 'Ambiguous anchor in ' + location);
        if (from > 0) from -= 1;
        if (to < current.length) to += 1;
        before = current.slice(from, to).join('\r\n');
      }
      current[index] = next;
      edit(location, before, current.slice(from, to).join('\r\n'));
      changes += 1;
    }
    return changes;
  }

  const effective = (role, value, limit = 5) => "func('jo9_nymph_productivity', '" + role + "', " + value + ', ' + limit + ')';
  append('jo9_nymph_productivity', lines(
    'local $jo9_work_actor = $args[0]',
    'local jo9_work_grade = args[1]',
    'local jo9_work_limit = args[2]',
    'if jo9_work_grade >= jo9_work_limit: result = jo9_work_grade & exit',
    'result = dyneval($replace({',
    ' result = args[0]',
    " if jo9workactor['nymphomania'] > 1 and jo9workactor['jo9_nymph_relief_day'] = day + 1: result += 1",
    "}, 'jo9workactor', $jo9_work_actor), jo9_work_grade)",
  ));

  const branch = " elseif $jo9_trait_personality_mode = 'performance':";
  const line = body('jo9_traits_personality').split('\r\n').find(value => value.trim() === branch.trim());
  assert.ok(line, 'Common education result');
  edit('jo9_traits_personality', line, lines(
    "  if result > 0 and jo9actor['nymphomania'] > 1 and jo9actor['jo9_nymph_relief_day'] = day + 1: result += 1",
    line));

  const overnight = rewriteRows('next_day', row => {
    const cook = /^([ \t]*slave_skill = )(min\((slave|assistant|room[1-4])\['cook'\], max\(1, (?:slave|assistant|room[1-4])\['mood'\]\)\))(.*)$/.exec(row);
    if (cook) return cook[1] + effective(cook[3], cook[2]) + cook[4];
    const mainClean = /^([ \t]*slave_skill = )(min\(slave\['mood'\] \+ 2, slave\['service'\]\))(.*)$/.exec(row);
    if (mainClean) return mainClean[1] + effective('slave', mainClean[2]) + mainClean[3];
    const clean = /^(\s*(?:house_mess_rate -= max\(8, |if ))((assistant|room[1-4])\['service'\])((?:\*16\)| < 3 and house_mess = 0: house_mess_rate = 10).*)$/.exec(row);
    if (clean) return clean[1] + effective(clean[3], clean[2]) + clean[4];
    if (/slave_healing_bonus = farmhand\['nurse'\]|(?:slave_healing_bonus|healing) = max\(master_medic, assistant\['nurse'\]\)/.test(row)) {
      return row.replace(/(farmhand|assistant)\['nurse'\]/, (term, role) => effective(role, term));
    }
    return row;
  });
  assert.equal(overnight, 20, 'Overnight cooking, cleaning and treatment calculations');

  const manual = rewriteRows('interaction', row => {
    const brewing = /^(\s*brewing_skill = )(min\(dynslave\['alchemy'\], dynslave\['enchanter'\]\))(.*)$/.exec(row);
    if (brewing) return brewing[1] + effective('dynslave', brewing[2]) + brewing[3];
    const work = /^([ \t]*(?:slave_skill|massage_quality|main_wash|oral_wash) = )(min ?\((?:interaction_(dynslave|slave|assistant)\['diligence'\]), .+?\))(\s*(?:&!.*)?)$/.exec(row);
    if (work && /\['(?:service|cook|music|stamina|calisthenics|expression|petting|oral)'\]/.test(work[2])) {
      return work[1] + effective(work[3], work[2]) + work[4];
    }
    const graded = /^([ \t]*slave_skill = )(slave\[['"](?:art|cowSK|pet|music|service|stamina|gladiatrix|calisthenics)['"]\])(\s*(?:&!.*)?)$/.exec(row);
    if (graded) return graded[1] + effective('slave', graded[2]) + graded[3];
    if (/slave_skill\s*=\s*\(slave\['cook'\]\s*\+\s*assistant\['cook'\]\)\s*\/\s*2/.test(row)) {
      return row.replace(/(slave|assistant)\['cook'\]/g, (term, role) => effective(role, term));
    }
    const cookXp = /^(\s*dynamic '((?:slave|assistant))_rate\["cook"\] \+= )(func\(''jo9_learning_xp'', .*\))('.*)$/.exec(row);
    if (cookXp) {
      return cookXp[1] + "func(''jo9_traits_personality'', ''xp'', ''" + cookXp[2] + "'', ''cook'', " + cookXp[3] + ')' + cookXp[4];
    }
    const milk = /^([ \t]*milk_bottle_plus = )(func\('jo9_traits_personality', 'performance', '(room[1-4])', '', milk_bottle_plus\))(.*)$/.exec(row);
    if (milk) {
      return milk[1] + "func('jo9_nymph_productivity', '" + milk[3] + "', " + milk[2] + ', 99)' + milk[4];
    }
    return row;
  });
  assert.ok(manual >= 24, 'Manual work quality and production paths');

  const brewingDisplay = rewriteRows('shop_general', row => {
    const brewing = /^(\s*brewing_skill = )(min\((slave|assistant)\['alchemy'\], (?:slave|assistant)\['enchanter'\]\))(.*)$/.exec(row);
    return brewing ? brewing[1] + effective(brewing[3], brewing[2]) + brewing[4] : row;
  });
  assert.equal(brewingDisplay, 2, 'Laboratory proficiency display and action use the same grade');

  const accounting = rewriteRows('billing', row => {
    const score = /^(\s*account_skill = max\(account_skill, )(dynslave\['secretary'\] \+ dynslave\['intellect'\])(\).*)$/.exec(row);
    if (score) return score[1] + effective('dynslave', score[2], 10) + score[3];
    const xp = /^(\s*dynslave_rate\['(intellect|secretary)'\] \+= )(func\('jo9_learning_xp', .*\))(.*)$/.exec(row);
    if (xp) return xp[1] + "func('jo9_traits_personality', 'xp', 'dynslave', '" + xp[2] + "', " + xp[3] + ')' + xp[4];
    return row;
  });
  assert.equal(accounting, 3, 'Accounting work and education');

  const milking = rewriteRows('interaction_result', row => {
    const milk = /^(\s*milk_bottle_plus = )(func\('jo9_traits_personality', 'performance', iif\(\$interaction_type = 'milking_farmhand', 'farmhand', 'dynslave'\), '', milk_bottle_plus\))(.*)$/.exec(row);
    if (milk) {
      return milk[1] + "func('jo9_nymph_productivity', iif($interaction_type = 'milking_farmhand', 'farmhand', 'dynslave'), " + milk[2] + ', 99)' + milk[3];
    }
    return row;
  });
  assert.equal(milking, 1, 'Normal work production');

  const tips = rewriteRows('interaction_city', row => {
    const paid = /^(\s*if \$(slave|assistant)\["cloth"\] ! 'slut_dress': sparks\.res = )b(\s*)$/.exec(row);
    if (paid) {
      const indent = row.match(/^\s*/)[0];
      return lines(row, indent + 'sparks.res = ' + effective(paid[2], 'sparks.res', 'sparks.res + 1'));
    }
    const duet = /^(\s*)sparks \+= sparks\.res - 20\s*$/.exec(row);
    if (duet) return lines(
      duet[1] + "sparks.res = " + effective('slave', 'sparks.res', 'sparks.res + 1'),
      duet[1] + "sparks.res = " + effective('assistant', 'sparks.res', 'sparks.res + 1'),
      row);
    return row;
  });
  assert.ok(tips >= 3, 'Variable paid work proceeds');
}

module.exports = { applyProductivity };
