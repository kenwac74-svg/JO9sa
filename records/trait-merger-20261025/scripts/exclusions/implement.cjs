'use strict';

const CRLF = '\r\n';
const phobias = ['darkness_attitude','blood_attitude','fire_attitude','water_attitude','vermin_attitude','deprivation_attitude'];
const ordinaryKeys = [...phobias,'courage','sport_affinity','expression_affinity','cowSK_affinity','meekness'];

function helperSource() {
  const phobiaKeyCheck = phobias.map(k=>`$args[0] = '${k}'`).join(' or ');
  return [
    '',
    '! Read-only grant check. Approved positive traits take priority over their negative opposites.',
    "if $args[0] = 'allow':",
    ' result = 1',
    ' local jo9x_candidate = args[3]',
    ' if jo9x_candidate = 0: exit',
    ` local jo9x_previous = dyneval('result = ' + $args[1] + "['" + $args[2] + "']")`,
    ' if jo9x_previous = jo9x_candidate: exit',
    ' result = dyneval($replace({',
    '  result = 1',
    `  if (${phobiaKeyCheck}) and args[1] = -1:`,
    "   if jo9xeactor['courage'] = 2: result = 0",
    '  end',
    "  if $args[0] = 'meekness':",
    "   if args[1] < 0 and jo9xeactor['jo9_slave_nature'] = 1: result = 0",
    '  end',
    "  if $args[0] = 'defiant' and args[1] = 1:",
    "   if jo9xeactor['meekness'] > 0 or jo9xeactor['jo9_slave_nature'] = 1: result = 0",
    '  end',
    "  if $args[0] = 'jo9_voice_trait' and args[1] = 1:",
    "   if jo9xeactor['expression_affinity'] > 0: result = 0",
    '  end',
    "  if $args[0] = 'cowSK_affinity' and args[1] > 0:",
    "   if jo9xeactor['sport_affinity'] = 1 or func('jo9_traits', 'activity_value', 'jo9xeactor', 'jo9_work_ethic') = 1 or func('jo9_traits', 'activity_value', 'jo9xeactor', 'passion_comfort') = -1: result = 0",
    '  end',
    "  if $args[0] = 'sport_affinity' and args[1] = 1:",
    "   if jo9xeactor['cowSK_affinity'] > 0: result = 0",
    '  end',
    "  if ($args[0] = 'jo9_work_ethic' and args[1] = 1) or ($args[0] = 'passion_comfort' and args[1] = -1):",
    "   if jo9xeactor['cowSK_affinity'] > 0: result = 0",
    '  end',
    " }, 'jo9xeactor', $args[1]), $args[2], jo9x_candidate)",
    ' exit',
    'end',
    '',
    '! Repair only approved positive/negative conflicts in this actor. Save files are not edited.',
    "if $args[0] = 'repair_exclusions':",
    ' result = 0',
    ' dynamic $replace({',
    "  if jo9xeactor['courage'] = 2:",
    ...phobias.map(k=>`   if jo9xeactor['${k}'] = -1: jo9xeactor['${k}'] = 0 & result += 1`),
    '  end',
    "  if jo9xeactor['jo9_slave_nature'] = 1 and jo9xeactor['meekness'] < 0: jo9xeactor['meekness'] = 0 & result += 1",
    "  if jo9xeactor['jo9_slave_nature'] = 1 and jo9xeactor['defiant'] = 1: jo9xeactor['defiant'] = 0 & result += 1",
    "  if jo9xeactor['meekness'] > 0 and jo9xeactor['defiant'] = 1: jo9xeactor['defiant'] = 0 & result += 1",
    "  if jo9xeactor['expression_affinity'] > 0 and jo9xeactor['jo9_voice_trait'] = 1: jo9xeactor['jo9_voice_trait'] = 0 & result += 1",
    " }, 'jo9xeactor', $args[1])",
    ' exit',
    'end',
    '',
    '! Original numeric/cycle editor setters keep their exact requested value.',
    "if $args[0] = 'set_guarded':",
    ' result = 0',
    ` local jo9x_edit_previous = dyneval('result = ' + $args[1] + "['" + $args[2] + "']")`,
    ' local jo9x_reduction = 0',
    ' if jo9x_edit_previous > 0 and args[3] > 0 and args[3] < jo9x_edit_previous: jo9x_reduction = 1',
    ' if jo9x_edit_previous < 0 and args[3] < 0 and args[3] > jo9x_edit_previous: jo9x_reduction = 1',
    " if jo9x_reduction = 0 and func('jo9_traits', 'allow', $args[1], $args[2], args[3]) = 0:",
    "  msg '이미 보유한 특성과 함께 부여할 수 없습니다. 특성은 변경되지 않았습니다.'",
    '  exit',
    ' end',
    ' dynamic $replace({jo9xeactor[$args[0]] = args[1]}, \'jo9xeactor\', $args[1]), $args[2], args[3]',
    " gs 'jo9_traits', 'repair_exclusions', $args[1]",
    ' result = 1',
    ' exit',
    'end',
    ''
  ].join(CRLF);
}

function replaceOne(text,oldText,newText,label) {
  const count=text.split(oldText).length-1;
  if(count!==1)throw Error(`${label}: expected one anchor, got ${count}`);
  return text.replace(oldText,newText);
}

// The condition (including rand) and candidate expression are each evaluated once.
// Only the final trait write is skipped when the candidate conflicts.
function wrapLine(body,line,key,role,label) {
  const keyPattern=key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const setter=new RegExp(`(${role}\\[['\"]${keyPattern}['\"]\\])\\s*=\\s*(.+?)(\\s*&!.*)?$`);
  const match=line.match(setter);
  if(!match)throw Error(`${label}: setter not found: ${line}`);
  const prefix=line.slice(0,match.index), expression=match[2].trim();
  const indent=(line.match(/^\s*/)||[''])[0];
  const isInline=/^\s*(?:if|elseif)\b/i.test(prefix);
  const candidate='jo9x_draw_'+key.toLowerCase();
  const head=isInline?prefix.replace(/:\s*$/,':'):null;
  const innerIndent=isInline?indent+' ':indent;
  const lines=[];
  if(head)lines.push(head);
  lines.push(`${innerIndent}local ${candidate} = ${expression}`);
  lines.push(`${innerIndent}if func('jo9_traits', 'allow', '${role}', '${key}', ${candidate}) = 1:`);
  lines.push(`${innerIndent} ${match[1]} = ${candidate}${match[3]||''}`);
  // Repeating a held value is permitted; repair still removes an approved
  // conflicting negative if that repeated value came from legacy actor data.
  lines.push(`${innerIndent} gs 'jo9_traits', 'repair_exclusions', '${role}'`);
  lines.push(`${innerIndent}end`);
  if(head)lines.push(indent+'end');
  if(!body.includes(line))throw Error(`${label}: source line disappeared`);
  return body.replace(line,lines.join(CRLF));
}

function wrapDirect(body,keys,role,filter=()=>true) {
  const original=body.split(CRLF);
  for(const line of original) {
    if(/^\s*!/.test(line)||!filter(line))continue;
    for(const key of keys) {
      const re=new RegExp(`(?:^|:\\s*)${role}\\[['\"]${key}['\"]\\]\\s*=`);
      if(re.test(line.trim()))body=wrapLine(body,line,key,role,role+'.'+key);
    }
  }
  return body;
}

function apply(ctx) {
  const changed=[];
  function editLocation(name,fn) {
    const before=ctx.get(name),after=fn(before);
    if(before!==after){ctx.edit(name,before,after,1);changed.push(name);}
  }
  editLocation('jo9_traits',body=>{
    const anchor="if $args[0] = 'edit':"+CRLF+'! JO9 MOD END SLAVE_NATURE_EDITOR_GUARD';
    const guard=[
      "if $args[0] = 'edit':",
      ' local jo9x_edit_candidate = args[3]',
      ` if dyneval('result = ' + $args[1] + "['" + $args[2] + "']") = jo9x_edit_candidate: jo9x_edit_candidate = 0`,
      " if func('jo9_traits', 'allow', $args[1], $args[2], jo9x_edit_candidate) = 0:",
      "  msg '이미 보유한 특성과 함께 부여할 수 없습니다. 특성은 변경되지 않았습니다.'",
      '  exit',
      ' end',
      'end',
      anchor
    ].join(CRLF);
    body=replaceOne(body,anchor,guard,'JO9 editor guard');
    body=replaceOne(body,"if $args[2] = 'jo9_slave_nature': gs 'jo9_traits', 'init_slave_nature', $args[1]",
      "gs 'jo9_traits', 'repair_exclusions', $args[1]"+CRLF+" if $args[2] = 'jo9_slave_nature': gs 'jo9_traits', 'init_slave_nature', $args[1]",'JO9 editor positive priority');
    // New stock only: preserve reset-to-zero behavior; guard newly drawn grants.
    body=wrapDirect(body,['defiant','jo9_slave_nature','jo9_voice_trait'],'stock',s=>/if\s/.test(s)&&!/= 0\s*$/.test(s));
    return body+helperSource();
  });
  editLocation('menu_form',body=>{
    let count=0;
    for(const key of ordinaryKeys) {
      const re=new RegExp(`slave\\[''${key}''\\]\\s*(=|\\+=|-=)\\s*(-?\\d+)\\s*& gt`, 'g');
      body=body.replace(re,(full,op,value)=>{
        count++;
        const target=op==='='?value:`slave[''${key}''] ${op[0]} ${value}`;
        return `gs ''jo9_traits'', ''set_guarded'', ''slave'', ''${key}'', ${target} & gt`;
      });
    }
    if(count!==31)throw Error('Original editor expected31 setters, got'+count);
    return body;
  });
  editLocation('get_stock_seed',body=>wrapDirect(body,[...ordinaryKeys,'defiant','jo9_voice_trait','passion_comfort'],'stock'));
  editLocation('get_special_assistant_quest',body=>wrapDirect(body,[...ordinaryKeys,'defiant','jo9_voice_trait','passion_comfort'],'assistant'));
  for(const name of ['get_demo_slave','get_special_slave'])
    editLocation(name,body=>wrapDirect(body,ordinaryKeys,'slave'));
  editLocation('generate_stock',body=>wrapDirect(body,[...ordinaryKeys,'passion_comfort'],'stock',line=>{
    // Skip the unrelated existing gladiatrix cleanup and explicit removals.
    if(line.includes("stock['gladiatrix_affinity'] = 1:"))return false;
    if(/stock\[['\"]courage['\"]\]\s*=\s*0\s*$/.test(line))return false;
    return true;
  }));
  editLocation('interaction_city',body=>wrapDirect(body,['meekness','deprivation_attitude'],'stock'));
  return {changedLocations:changed,ordinaryEditorSetters:31};
}

function testCases() {
  const cases=[];
  const clear=`killvar 'jo9xt' & jo9xt_state = 1`;
  const test=(name,setup,key,value,expected=0,role='jo9xt')=>cases.push({
    name,code:`${clear}\n${setup.replaceAll('jo9xt',role)}\nresult = func('jo9_traits', 'allow', '${role}', '${key}', ${value})`,expected
  });
  for(const key of phobias){
    test('courage2-allowed-over-'+key,`jo9xt['${key}']=-1`,'courage',2,1);
    test(key+'-blocked-by-courage2',"jo9xt['courage']=2",key,-1);
    test(key+'-positive-not-phobia',"jo9xt['courage']=2",key,2,1);
  }
  test('nature-allowed-over-free',"jo9xt['meekness']=-5",'jo9_slave_nature',1,1);
  test('nature-allowed-over-defiant',"jo9xt['defiant']=1",'jo9_slave_nature',1,1);
  test('free-blocked-by-nature',"jo9xt['jo9_slave_nature']=1",'meekness',-5);
  test('obedient-allowed-over-defiant',"jo9xt['defiant']=1",'meekness',6,1);
  test('defiant-blocked-by-obedient',"jo9xt['meekness']=6",'defiant',1);
  test('voice-blocked-by-expression',"jo9xt['expression_affinity']=3",'jo9_voice_trait',1);
  test('expression-allowed-over-voice',"jo9xt['jo9_voice_trait']=1",'expression_affinity',2,1);
  for(const[key,value]of[['sport_affinity',1],['passion_comfort',-1],['jo9_work_ethic',1]]){
    test('cow-blocked-by-'+key,`jo9xt['${key}']=${value}`,'cowSK_affinity',2);
    test(key+'-blocked-by-cow',"jo9xt['cowSK_affinity']=2",key,value);
  }
  test('courage1-keeps-phobia',"jo9xt['darkness_attitude']=-1",'courage',1,1);
  test('pain-phobia-outside-six',"jo9xt['masochism']=-1",'courage',2,1);
  test('neutral-removal',"jo9xt['courage']=2 & jo9xt['darkness_attitude']=-1",'darkness_attitude',0,1);
  test('same-legacy-value-preserved',"jo9xt['courage']=2 & jo9xt['darkness_attitude']=-1",'courage',2,1);
  test('unrelated-change-preserves-conflict',"jo9xt['courage']=2 & jo9xt['darkness_attitude']=-1",'grace',1,1);
  for(const[key,setup]of[
    ['jo9_slave_nature',"jo9xt['jo9_slave_nature']=1 & jo9xt['meekness']=-5"],
    ['meekness',"jo9xt['meekness']=6 & jo9xt['defiant']=1"],
    ['defiant',"jo9xt['meekness']=6 & jo9xt['defiant']=1"],
    ['jo9_voice_trait',"jo9xt['jo9_voice_trait']=1 & jo9xt['expression_affinity']=2"],
    ['expression_affinity',"jo9xt['jo9_voice_trait']=1 & jo9xt['expression_affinity']=2"],
    ['cowSK_affinity',"jo9xt['cowSK_affinity']=2 & jo9xt['sport_affinity']=1"],
    ['sport_affinity',"jo9xt['cowSK_affinity']=2 & jo9xt['sport_affinity']=1"],
    ['passion_comfort',"jo9xt['cowSK_affinity']=2 & jo9xt['passion_comfort']=-1"],
    ['jo9_work_ethic',"jo9xt['cowSK_affinity']=2 & jo9xt['jo9_work_ethic']=1"]
  ])test('removal-'+key,setup,key,0,1);
  test('cow-blocked-by-legacy-alias-conflict-positive',"jo9xt['jo9_work_ethic']=1 & jo9xt['passion_comfort']=1",'cowSK_affinity',1);
  test('cow-blocked-by-legacy-alias-conflict-negative',"jo9xt['jo9_work_ethic']=-1 & jo9xt['passion_comfort']=-1",'cowSK_affinity',1);
  test('comfort2-not-active',"jo9xt['passion_comfort']=2",'cowSK_affinity',1,1);
  for(const role of ['assistant','room1','room4'])
    cases.push({name:'role-'+role,code:`killvar '${role}'\n${role}['jo9_voice_trait']=1\nresult=func('jo9_traits','allow','${role}','expression_affinity',1)`,expected:1});
  cases.push({name:'allow-pure-legacy-conflict',code:`${clear}\njo9xt['courage']=2 & jo9xt['darkness_attitude']=-1\njo9xt['expression_affinity']=3\nlocal jo9xt_check=func('jo9_traits','allow','jo9xt','jo9_voice_trait',1)\nresult=iif(jo9xt_check=0 and jo9xt['courage']=2 and jo9xt['darkness_attitude']=-1 and jo9xt['expression_affinity']=3,1,0)`,expected:1});
  const repairTest=(name,setup,condition)=>cases.push({name,code:`${clear}\n${setup}\ngs 'jo9_traits','repair_exclusions','jo9xt'\nresult=iif(${condition},1,0)`,expected:1});
  for(const key of phobias)repairTest('repair-courage-'+key,
    `jo9xt['courage']=2 & jo9xt['${key}']=-1 & jo9xt['${key}_revealed']=2 & jo9xt['grace']=3`,
    `jo9xt['courage']=2 and jo9xt['${key}']=0 and jo9xt['${key}_revealed']=2 and jo9xt['grace']=3`);
  repairTest('repair-nature-free',"jo9xt['jo9_slave_nature']=1 & jo9xt['meekness']=-5 & jo9xt['moral']=4",
    "jo9xt['jo9_slave_nature']=1 and jo9xt['meekness']=0 and jo9xt['moral']=4");
  repairTest('repair-nature-defiant',"jo9xt['jo9_slave_nature']=1 & jo9xt['defiant']=1 & jo9xt['pride']=3",
    "jo9xt['jo9_slave_nature']=1 and jo9xt['defiant']=0 and jo9xt['pride']=3");
  repairTest('repair-obedience-defiant',"jo9xt['meekness']=6 & jo9xt['defiant']=1 & jo9xt['jo9_defiant_resolved']=0",
    "jo9xt['meekness']=6 and jo9xt['defiant']=0 and jo9xt['jo9_defiant_resolved']=0");
  repairTest('repair-expression-voice',"jo9xt['expression_affinity']=2 & jo9xt['jo9_voice_trait']=1 & jo9xt['jo9_work_ethic_known']=1",
    "jo9xt['expression_affinity']=2 and jo9xt['jo9_voice_trait']=0 and jo9xt['jo9_work_ethic_known']=1");
  repairTest('repair-keeps-both-beneficial',"jo9xt['cowSK_affinity']=2 & jo9xt['sport_affinity']=1 & jo9xt['jo9_work_ethic']=1 & jo9xt['passion_comfort']=-1",
    "jo9xt['cowSK_affinity']=2 and jo9xt['sport_affinity']=1 and jo9xt['jo9_work_ethic']=1 and jo9xt['passion_comfort']=-1");
  repairTest('repair-keeps-voice2',"jo9xt['expression_affinity']=2 & jo9xt['jo9_voice_trait']=2",
    "jo9xt['expression_affinity']=2 and jo9xt['jo9_voice_trait']=2");
  for(const[key,value,oldKey,oldValue]of[
    ['courage',2,'darkness_attitude',-1],['jo9_slave_nature',1,'meekness',-5],
    ['meekness',6,'defiant',1],['expression_affinity',2,'jo9_voice_trait',1]
  ])cases.push({name:'positive-set-repairs-'+key,code:`${clear}\njo9xt['${oldKey}']=${oldValue}\nlocal jo9xt_set=func('jo9_traits','set_guarded','jo9xt','${key}',${value})\nresult=iif(jo9xt_set=1 and jo9xt['${key}']=${value} and jo9xt['${oldKey}']=0,1,0)`,expected:1});
  cases.push({name:'editor-reduces-held-cow-before-removal',code:`${clear}\njo9xt['cowSK_affinity']=2 & jo9xt['sport_affinity']=1\nlocal jo9xt_set=func('jo9_traits','set_guarded','jo9xt','cowSK_affinity',1)\nlocal jo9xt_reduced=iif(jo9xt_set=1 and jo9xt['cowSK_affinity']=1 and jo9xt['sport_affinity']=1,1,0)\njo9xt_set=func('jo9_traits','set_guarded','jo9xt','cowSK_affinity',0)\nresult=iif(jo9xt_reduced=1 and jo9xt_set=1 and jo9xt['cowSK_affinity']=0 and jo9xt['sport_affinity']=1,1,0)`,expected:1});
  return cases.map(c=>({name:c.name,body:c.code.replace(/\r?\n/g,CRLF)+CRLF+
    `if result ! ${c.expected}: msg 'FAIL_MERGER_${c.name}' & exit`+CRLF+'qa_checks += 1'}));
}

module.exports={apply,testCases,helperSource};
