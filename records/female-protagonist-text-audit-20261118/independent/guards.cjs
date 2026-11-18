'use strict';

// Read-only QSP branch inventory helper. This is a conservative lexical scope
// parser, not a QSP engine or a whole-program reachability proof.
const TRUE = 1, FALSE = 0, UNKNOWN = -1;
const and = (a, b) => a === FALSE || b === FALSE ? FALSE : a === TRUE && b === TRUE ? TRUE : UNKNOWN;
const or = (a, b) => a === TRUE || b === TRUE ? TRUE : a === FALSE && b === FALSE ? FALSE : UNKNOWN;
const negate = a => a === UNKNOWN ? UNKNOWN : 1 - a;

function tokenize(body) {
  const tokens = [], comments = [], diagnostics = [];
  let i = 0, line = 1, statementStart = true;
  const push = (type, start, end, tokenLine, value = body.slice(start, end)) => tokens.push({ type, start, end, line: tokenLine, value });
  while (i < body.length) {
    const ch = body[i], start = i, tokenLine = line;
    if (ch === '\r' || ch === ' ' || ch === '\t') { i++; continue; }
    if (ch === '\n') {
      // QSP's standalone trailing underscore continues a logical line.
      if (tokens.at(-1)?.value === '_') tokens.pop();
      else { push('nl', i, i + 1, line); statementStart = true; }
      i++; line++; continue;
    }
    if (ch === '!' && statementStart) {
      let quote = '', braces = 0; i++;
      while (i < body.length) {
        const cc = body[i];
        if (cc === '\n') { if (!quote && !braces) break; line++; i++; continue; }
        if (quote) { if (cc === quote) { if (body[i + 1] === quote) { i += 2; continue; } quote = ''; } }
        else if (cc === "'" || cc === '"') quote = cc;
        else if (cc === '{') braces++;
        else if (cc === '}' && braces) braces--;
        i++;
      }
      comments.push({ start, end: i, line: tokenLine });
      continue;
    }
    if (ch === "'" || ch === '"') {
      const quote = ch; i++; let closed = false;
      while (i < body.length) {
        if (body[i] === quote) { if (body[i + 1] === quote) { i += 2; continue; } i++; closed = true; break; }
        if (body[i] === '\n') line++;
        i++;
      }
      if (!closed) diagnostics.push({ kind: 'unclosed-string', start, end: i, line: tokenLine });
      push('string', start, i, tokenLine); statementStart = false; continue;
    }
    if ('{}&:()[],'.includes(ch)) {
      i++; push(ch === '&' ? 'sep' : ch === ':' ? 'colon' : ch, start, i, tokenLine);
      statementStart = ch === '&' || ch === ':' || ch === '{'; continue;
    }
    if ('=<>!+-*/'.includes(ch)) {
      i++; if ('=<>!+-*/'.includes(body[i] || '') && body[i] !== undefined) i++;
      push('op', start, i, tokenLine); statementStart = false; continue;
    }
    while (i < body.length && !/[\s'"{}&:()\[\],=<>!+*/-]/u.test(body[i])) i++;
    if (i === start) i++;
    push('word', start, i, tokenLine); statementStart = false;
  }
  return { tokens, comments, diagnostics };
}

function booleanParts(s, keyword) {
  let quote = '', paren = 0, bracket = 0, at = 0; const parts = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote) { if (ch === quote) { if (s[i + 1] === quote) i++; else quote = ''; } continue; }
    if (ch === "'" || ch === '"') { quote = ch; continue; }
    if (ch === '(') paren++; else if (ch === ')') paren--;
    else if (ch === '[') bracket++; else if (ch === ']') bracket--;
    if (!paren && !bracket && s.slice(i, i + keyword.length).toLowerCase() === keyword &&
      !/[\p{L}\p{N}_$]/u.test(s[i - 1] || '') && !/[\p{L}\p{N}_$]/u.test(s[i + keyword.length] || '')) {
      parts.push(s.slice(at, i)); at = i + keyword.length; i += keyword.length - 1;
    }
  }
  if (parts.length) { parts.push(s.slice(at)); return parts; }
  return null;
}

function wrapped(s) {
  if (s[0] !== '(' || s.at(-1) !== ')') return false;
  let n = 0, quote = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote) { if (ch === quote) { if (s[i + 1] === quote) i++; else quote = ''; } continue; }
    if (ch === "'" || ch === '"') quote = ch;
    else if (ch === '(') n++;
    else if (ch === ')' && --n === 0 && i !== s.length - 1) return false;
  }
  return n === 0;
}

function expressionTree(expression) {
  let s = String(expression).replace(/_\s*\r?\n/g, ' ').trim();
  while (wrapped(s)) s = s.slice(1, -1).trim();
  let pieces = booleanParts(s, 'or');
  if (pieces) return { kind: 'or', children: pieces.map(expressionTree) };
  pieces = booleanParts(s, 'and');
  if (pieces) return { kind: 'and', children: pieces.map(expressionTree) };
  const no = /^(?:no|not)\b\s*/i.exec(s);
  if (no) return { kind: 'not', child: expressionTree(s.slice(no[0].length)) };
  let match = /^hero_choice\s*(>=|<=|<>|!=|=|!|>|<)\s*(-?\d+)\s*$/i.exec(s);
  if (match) return { kind: 'hero', op: match[1], number: Number(match[2]) };
  match = /^(-?\d+)\s*(>=|<=|<>|!=|=|!|>|<)\s*hero_choice\s*$/i.exec(s);
  if (match) return { kind: 'hero', op: ({ '>': '<', '<': '>', '>=': '<=', '<=': '>=' })[match[2]] || match[2], number: Number(match[1]) };
  if (/^-?\d+$/.test(s)) return { kind: 'constant', value: Number(s) !== 0 ? TRUE : FALSE };
  return { kind: 'unknown', expression: s, mentionsHero: /\bhero_choice\b/i.test(s) };
}

function evaluate(tree, heroId) {
  if (tree.kind === 'unknown') return UNKNOWN;
  if (tree.kind === 'constant') return tree.value;
  if (tree.kind === 'not') return negate(evaluate(tree.child, heroId));
  if (tree.kind === 'and') return tree.children.reduce((a, t) => and(a, evaluate(t, heroId)), TRUE);
  if (tree.kind === 'or') return tree.children.reduce((a, t) => or(a, evaluate(t, heroId)), FALSE);
  const n = tree.number;
  return ({ '=': heroId === n, '!': heroId !== n, '!=': heroId !== n, '<>': heroId !== n,
    '>': heroId > n, '<': heroId < n, '>=': heroId >= n, '<=': heroId <= n })[tree.op] ? TRUE : FALSE;
}

function classify(conditions, options = {}) {
  const expressions = (conditions || []).map(c => typeof c === 'string' ? c : c.expression);
  const trees = expressions.map(expressionTree);
  const maleIds = options.maleIds || Array.from({ length: 100 }, (_, i) => i + 1);
  const femaleIds = options.femaleIds || Array.from({ length: 99 }, (_, i) => i + 101);
  const test = id => trees.reduce((v, t) => and(v, evaluate(t, id)), TRUE);
  const malePossible = maleIds.filter(id => test(id) !== FALSE);
  const femalePossible = femaleIds.filter(id => test(id) !== FALSE);
  const femaleCertain = femaleIds.filter(id => test(id) === TRUE);
  const maleCertain = maleIds.filter(id => test(id) === TRUE);
  const uncertainSyntax = Boolean(options.uncertain);
  const femaleOnly = !uncertainSyntax && !malePossible.length && femalePossible.length > 0;
  return { classification: femaleOnly ? 'proven-female-only' : !femalePossible.length && malePossible.length && !uncertainSyntax ? 'proven-male-only' : !femalePossible.length && !malePossible.length ? 'unreachable-under-id-model' : 'shared-or-unresolved',
    femaleOnly, malePossible, femalePossible, maleCertain, femaleCertain,
    reserved100Ambiguity: malePossible.length === 1 && malePossible[0] === 100 && femalePossible.length > 0,
    model: { maleIds, femaleIds }, uncertainSyntax };
}

function guardRanges(body) {
  const lex = tokenize(body), { tokens } = lex, diagnostics = lex.diagnostics.slice();
  const ranges = [], scopes = []; let depth = 0, statementStart = true, cursor = 0;
  const conditionItems = () => scopes.flatMap(s => s.kind === 'if' && s.condition ? [{ expression: s.condition, line: s.line, kind: s.branch, start: s.start }] : []);
  const uncertaintyItems = () => scopes.flatMap(s => s.uncertainties || []);
  const addRange = end => {
    if (end <= cursor) return;
    const conditions = conditionItems(), uncertainties = uncertaintyItems();
    const prev = ranges.at(-1);
    const signature = JSON.stringify([conditions, uncertainties, depth]);
    if (prev && prev.signature === signature && prev.end === cursor) prev.end = end;
    else ranges.push({ start: cursor, end, conditions, uncertainties, braceDepth: depth, signature });
    cursor = end;
  };
  const snapshotDiagnostic = (kind, t, extra = {}) => diagnostics.push({ kind, start: t.start, end: t.end, line: t.line, ...extra });
  const nearestIf = () => {
    for (let k = scopes.length - 1; k >= 0; k--) { if (scopes[k].depth < depth) break; if (scopes[k].kind === 'if' && scopes[k].depth === depth) return k; }
    return -1;
  };
  function headerColon(index) {
    let paren = 0, bracket = 0;
    for (let j = index + 1; j < tokens.length; j++) {
      const t = tokens[j];
      if (t.type === 'nl' || t.type === '{' || t.type === '}' || t.type === 'sep') return -1;
      if (t.type === '(') paren++; else if (t.type === ')') paren--;
      else if (t.type === '[') bracket++; else if (t.type === ']') bracket--;
      if (t.type === 'colon' && !paren && !bracket) return j;
    }
    return -1;
  }
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i], word = t.type === 'word' ? t.value.toLowerCase() : '';
    if (t.type === 'nl') {
      addRange(t.end);
      for (let k = scopes.length - 1; k >= 0; k--) if (scopes[k].inline && scopes[k].depth === depth) scopes.splice(k, 1);
      statementStart = true; continue;
    }
    if (t.type === '{') { addRange(t.end); depth++; statementStart = true; continue; }
    if (t.type === '}') {
      addRange(t.start);
      for (let k = scopes.length - 1; k >= 0; k--) {
        if (scopes[k].depth >= depth) {
          if (!scopes[k].inline) snapshotDiagnostic('unclosed-scope-before-brace', t, { scopeKind: scopes[k].kind, scopeLine: scopes[k].line });
          scopes.splice(k, 1);
        }
      }
      depth = Math.max(0, depth - 1); addRange(t.end); statementStart = false; continue;
    }
    // :loop is a QSP jump label, not a LOOP statement.
    if (t.type === 'colon' && statementStart && tokens[i + 1]?.type === 'word') {
      i++; statementStart = false; continue;
    }
    if (word === 'if' && statementStart) {
      const j = headerColon(i);
      if (j < 0) {
        snapshotDiagnostic('if-without-header-colon', t); addRange(t.end);
        scopes.push({ kind: 'malformed-if', inline: false, depth, line: t.line, start: t.start,
          uncertainties: [{ kind: 'if-without-header-colon', line: t.line }] });
        statementStart = false; continue;
      }
      const colon = tokens[j], expression = body.slice(t.end, colon.start).replace(/_\s*\r?\n/g, ' ').trim();
      addRange(colon.end);
      const inline = tokens[j + 1] && tokens[j + 1].type !== 'nl' && tokens[j + 1].type !== '}';
      scopes.push({ kind: 'if', condition: expression, branches: [expression], branch: 'if', inline: Boolean(inline), depth, line: t.line, start: t.start, uncertainties: [] });
      i = j; statementStart = true; continue;
    }
    if ((word === 'elseif' || word === 'else') && (statementStart || nearestIf() >= 0)) {
      const k = nearestIf();
      if (k < 0) { snapshotDiagnostic('unmatched-' + word, t); statementStart = true; continue; }
      const scope = scopes[k];
      if (scopes.slice(k + 1).some(s => !s.inline)) snapshotDiagnostic('branch-with-unclosed-inner-scope', t);
      scopes.splice(k + 1);
      let j = i, expression;
      if (word === 'elseif') {
        j = headerColon(i);
        if (j < 0) { snapshotDiagnostic('elseif-without-header-colon', t); statementStart = false; continue; }
        expression = body.slice(t.end, tokens[j].start).replace(/_\s*\r?\n/g, ' ').trim();
      } else if (tokens[i + 1]?.type === 'colon') j++;
      addRange(tokens[j].end);
      const complement = `not (${scope.branches.map(e => `(${e})`).join(' or ')})`;
      scope.condition = expression ? `${complement} and (${expression})` : complement;
      if (expression) scope.branches.push(expression);
      else scope.branches.push('1');
      scope.branch = word; scope.line = t.line; scope.uncertainties = [];
      i = j; statementStart = true; continue;
    }
    if (word === 'end' && statementStart) {
      addRange(t.end);
      let k = scopes.length - 1;
      while (k >= 0 && scopes[k].depth !== depth) k--;
      if (k < 0) snapshotDiagnostic('unmatched-end', t);
      else scopes.splice(k, 1);
      statementStart = false; continue;
    }
    if (['for', 'act', 'loop'].includes(word) && statementStart) {
      const j = headerColon(i);
      if (j < 0) { snapshotDiagnostic(word + '-without-header-colon', t); statementStart = false; continue; }
      const colon = tokens[j]; addRange(colon.end);
      const inline = tokens[j + 1] && tokens[j + 1].type !== 'nl' && tokens[j + 1].type !== '}';
      const header = body.slice(t.end, colon.start);
      const uncertainties = /\bhero_choice\b/i.test(header) ? [{ kind: 'hero-dependent-' + word + '-header', line: t.line }] : [];
      scopes.push({ kind: word, inline: Boolean(inline), depth, line: t.line, start: t.start, uncertainties });
      i = j; statementStart = true; continue;
    }
    if (word === 'hero_choice' && statementStart && tokens[i + 1]?.type === 'op' && /^(?:=|\+=|-=|\*=|\/=)$/.test(tokens[i + 1].value)) {
      addRange(t.start);
      for (const s of scopes) if (s.condition && /\bhero_choice\b/i.test(s.condition)) s.uncertainties.push({ kind: 'hero-choice-written-after-guard', line: t.line });
    }
    if (t.type === 'sep' || t.type === 'colon') statementStart = true;
    else statementStart = false;
  }
  addRange(body.length);
  for (const s of scopes) if (!s.inline) diagnostics.push({ kind: 'unclosed-scope-at-eof', start: s.start, end: body.length, line: s.line, scopeKind: s.kind });
  for (const r of ranges) {
    delete r.signature;
    r.effectiveBoolean = r.conditions.length ? r.conditions.map(c => `(${c.expression})`).join(' and ') : '1';
  }
  return { ranges, diagnostics, comments: lex.comments, limitations: [
    'Lexical IF/ELSEIF/ELSE scope only; no whole-program reachability, interprocedural domination, early-exit inference or save-state proof.',
    'Quoted dynamic strings and HTML exec attributes are opaque; recursively parse decoded dynamic code separately when necessary.',
    'Curly string/code blocks have separate nesting, inherit enclosing lexical conditions and may run later; assignment-time guards do not prove the later hero state.',
    'FOR/ACT/LOOP headers are balanced; hero-dependent non-IF headers and direct guarded hero_choice writes are marked uncertain.',
    'Unknown non-hero expressions use conservative three-valued evaluation; correlations between unknown expressions are not solved.'
  ] };
}

function annotate(body, literals, options = {}) {
  const parsed = guardRanges(body);
  const classificationCache = new Map(); let rangeIndex = 0;
  const annotations = literals.map(entry => {
    const point = entry.start;
    while (rangeIndex < parsed.ranges.length && parsed.ranges[rangeIndex].end <= point) rangeIndex++;
    const range = parsed.ranges[rangeIndex]?.start <= point ? parsed.ranges[rangeIndex] : parsed.ranges.find(r => r.start <= point && point < r.end);
    const conditions = range?.conditions || [];
    const localDiagnostics = parsed.diagnostics.filter(d => d.start <= point && point < d.end);
    // Unknown scope headers carry their own uncertainty until END/brace closure.
    // A redundant unmatched END at an empty stack is reported globally, and does
    // not contaminate a later independent IF block or brace definition.
    const uncertainties = [...(range?.uncertainties || []), ...localDiagnostics];
    const cacheKey = JSON.stringify([conditions.map(c => c.expression), uncertainties.length > 0]);
    if (!classificationCache.has(cacheKey)) classificationCache.set(cacheKey, classify(conditions, { ...options, uncertain: uncertainties.length > 0 }));
    return { ...entry, conditions, braceDepth: range?.braceDepth || 0, uncertainties,
      guardClassification: classificationCache.get(cacheKey) };
  });
  return { annotations, diagnostics: parsed.diagnostics, limitations: parsed.limitations };
}

module.exports = { tokenize, expressionTree, evaluate, classify, guardRanges, annotate, TRUE, FALSE, UNKNOWN };
