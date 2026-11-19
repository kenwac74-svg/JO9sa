'use strict';
// JO9 MOD START FRESH_MODE_TOOL_RULES_20261118
const {masked} = require('./scenes.cjs');

const classes = [
  {value:0,label:'젊음',code:'young_age'},
  {value:1,label:'어림',code:'fresh_age',legacyCode:'loli_age'},
  {value:2,label:'성숙',code:'mature_age',legacyCode:'milf_age'},
];
const modeValues = [
  {value:0,label:'어림 출현 · 추가 대사 비활성'},
  {value:1,label:'어림 일반 생성·경매 제외'},
  {value:2,label:'어림 출현 · 추가 대사 활성'},
];
const modeLabel = '어림 출현·추가 대사 설정';
const current = {mode:'fresh_mode',fresh:'fresh_age',mature:'mature_age'};
function describeVariable(name) {
  const key = name.trim().toLowerCase();
  if (key === 'fresh_mode' || key === 'no_loli') {
    return {label:modeLabel,code:'fresh_mode',legacy:key==='no_loli',values:modeValues,
      description:key==='no_loli'?'구세이브와 이전 코드에서 사용하는 호환 이름입니다.':'게임 전체에서 사용하는 설정입니다.'};
  }
  const constant = key.match(/^const_int\s*\[\s*(['"])(\w+)\1\s*\]$/)?.[2];
  if (constant) {
    const row = classes.find(c => c.code === constant || c.legacyCode === constant);
    if (row) return {label:'외형 분류 상수',code:row.code,legacy:constant===row.legacyCode,values:[row]};
  }
  if (/^(?:age|seed_age)(?:\[.*\])?$|^\w+\s*\[\s*(['"])age\1\s*\]$/.test(key)) {
    return {label:'외형 분류',description:'기본 분류는 0·1·2입니다. 실제 나이를 나타내는 값과 별개입니다.',values:classes};
  }
  if (/^(?:\$age|age_code)(?:\[.*\])?$/.test(key)) {
    return {label:'외형 리소스 토큰',description:'기존 이미지·리소스 연결용 토큰입니다.',values:classes.map((row,i)=>({...row,code:['young','loli','milf'][i]}))};
  }
  return undefined;
}

function symbolsFor(bodies) {
  const init = bodies.get('init_game') || '';
  const constants = bodies.get('#static_base') || '';
  return {
    mode:/^[\t ]*fresh_mode\s*=\s*0\b/m.test(init)?'fresh_mode':'no_loli',
    fresh:/^[\t ]*CONST_INT\[['"]fresh_age['"]\]\s*=\s*1\b/m.test(constants)?'fresh_age':'loli_age',
    mature:/^[\t ]*CONST_INT\[['"]mature_age['"]\]\s*=\s*2\b/m.test(constants)?'mature_age':'milf_age',
  };
}

// Match only the code identifiers. Quoted display text, resource IDs, and comparisons are preserved.
function adaptRule(code, symbols=current) {
  if (!/\b(?:fresh_mode|no_loli|fresh_age|mature_age|loli_age|milf_age)\b/i.test(code)) return code;
  const visible = masked(code);
  const binding = /\b(?:fresh_mode|no_loli)\b|\bCONST_INT\s*\[\s*(['"])(fresh_age|mature_age|loli_age|milf_age)\1\s*\]/gi;
  return code.replace(binding,(chunk,quote,constant,at) => {
    if (!/\S/.test(visible[at]||' ')) return chunk;
    if (!constant) return symbols.mode;
    return chunk.replace(constant,/^(fresh_age|loli_age)$/i.test(constant)?symbols.fresh:symbols.mature);
  });
}
module.exports = {describeVariable,symbolsFor,adaptRule,classes,modeValues,modeLabel};
// JO9 MOD END FRESH_MODE_TOOL_RULES_20261118
