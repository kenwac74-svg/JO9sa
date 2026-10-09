'use strict';

// Source-derived static checks, not execution in the game engine.
// The grouping loop below ports qspProcessPreformattedStrings from the actual
// engine-base fork, commit 9bb0276be5f94f94f911fab0daeb225cc3c559ec,
// qsp/codetools.cpp:94-160. QSP_SPACES is exactly space and tab.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const core = require(fs.existsSync(path.join(__dirname,'core.cjs')) ? './core.cjs' : './cut-addition/core.cjs');
const trimSpaces = s => s.replace(/^[ \t]+|[ \t]+$/g, '');

function preprocess(source) {
  const lines = [];
  let at = 0, quot = '', quotsCount = 0;
  let lineNum = 0, lastLineNum = 0, text = '';
  while (at < source.length && source[at] !== '\0') {
    const isNewLine = source.startsWith('\r\n', at);
    if (isNewLine) ++lineNum;
    if (quotsCount || quot || !isNewLine) {
      text += source[at];
      if (quot) {
        if (source[at] === quot) {
          if (source[at + 1] === quot) text += source[at++];
          else quot = '';
        }
      } else {
        if (source[at] === '{') ++quotsCount;
        else if (source[at] === '}') {
          if (quotsCount) --quotsCount;
        } else if (source[at] === "'" || source[at] === '"') quot = source[at];
      }
      ++at;
    } else {
      lines.push({ text: trimSpaces(text), line: lastLineNum + 1, endLine: lineNum });
      lastLineNum = lineNum;
      text = '';
      at += 2;
    }
  }
  lines.push({ text: trimSpaces(text), line: lastLineNum + 1, endLine: lineNum + 1 });
  return { lines, openQuote: quot || null, openBraces: quotsCount };
}

// qspProcessEOLExtensions joins lines ending in " _". The fork records the
// final continuation line as the diagnostic line, so preserve it separately.
function joinContinuations(lines) {
  const result = [];
  for (let i = 0; i < lines.length; ++i) {
    const first = lines[i];
    let text = first.text;
    while (text.endsWith(' _') && i + 1 < lines.length) {
      text = text.slice(0, -1) + lines[++i].text;
    }
    result.push({ text, line: first.line, endLine: lines[i].endLine,
      engineLine: lines[i].line });
  }
  return result;
}

function outsideColon(text) {
  let quote = '', braces = 0;
  for (let i = 0; i < text.length; ++i) {
    const ch = text[i];
    if (quote) {
      if (ch === quote) {
        if (text[i + 1] === quote) ++i;
        else quote = '';
      }
    } else if (ch === "'" || ch === '"') quote = ch;
    else if (ch === '{') ++braces;
    else if (ch === '}' && braces) --braces;
    else if (!braces && ch === ':') return i;
  }
  return -1;
}

function checkSyntax(source, options = {}) {
  if (typeof source !== 'string') throw Error('QSP source must be a string.');
  const original = source;
  if (options.normalizeEol) source = source.replace(/\r\n?|\n/g, '\r\n');
  const grouped = preprocess(source);
  const lines = joinContinuations(grouped.lines), errors = [], stack = [];
  const tail = grouped.lines.at(-1);
  if (grouped.openQuote) errors.push({ code: 'UNTERMINATED_QUOTE', line: tail.line,
    endLine: tail.endLine, quote: grouped.openQuote,
    message: 'An unmatched quote joins subsequent physical lines, including END statements.' });
  if (grouped.openBraces) errors.push({ code: 'UNTERMINATED_BRACES', line: tail.line,
    endLine: tail.endLine, depth: grouped.openBraces });
  for (const entry of lines) {
    const text = trimSpaces(entry.text);
    // Grouping happens BEFORE comments are ignored. A quoted comment may now
    // span the rest of the location; its swallowed END tokens must stay ignored.
    if (!text || text.startsWith('!') || text.startsWith(':')) continue;
    const keyword = /^(ELSE[ \t]+IF|ELSEIF|IF|FOR|ACT|ELSE|END)\b/i.exec(text)?.[1]
      .toUpperCase().replace(/[ \t]+/g, '');
    if (!keyword) continue;
    if (keyword === 'END') {
      if (!stack.length) errors.push({ code: 'UNEXPECTED_END', line: entry.line });
      else stack.pop();
      continue;
    }
    if (keyword === 'ELSE' || keyword === 'ELSEIF') {
      const top = stack.at(-1);
      if (!top || top.kind !== 'IF') errors.push({ code: 'UNEXPECTED_ELSE', line: entry.line });
      else if (top.hadElse) errors.push({ code: 'ELSE_AFTER_ELSE', line: entry.line });
      if (top && keyword === 'ELSE') top.hadElse = true;
      continue;
    }
    const colon = outsideColon(text);
    if (colon < 0) {
      errors.push({ code: 'MISSING_COLON', line: entry.line, kind: keyword });
      continue;
    }
    const remainder = trimSpaces(text.slice(colon + 1));
    // Only standalone multiline block declarations are checked. Single-line
    // IF/FOR/ACT bodies and ordinary expressions are not interpreted here.
    if (!remainder || remainder.startsWith('!')) stack.push({ kind: keyword, line: entry.line });
  }
  for (const entry of stack) errors.push({ code: 'MISSING_END', line: entry.line,
    kind: entry.kind, expectedEngineError: 'QSP_ERR_ENDNOTFOUND' });
  return { ok: errors.length === 0, verification: 'source-derived static check',
    physicalLines: source.split('\r\n').length, logicalLines: lines.length,
    normalizedEol: original !== source, errors,
    limits: 'Checks quote/brace grouping and standalone multiline IF/FOR/ACT/ELSE/ELSEIF/END balance; does not execute QSP or validate expressions, rendering, jumps, or state persistence.' };
}

function runSelfTests() {
  let count = 0;
  const test = fn => { fn(); ++count; };
  test(() => assert.deepEqual(preprocess('a\r\nb\r\n').lines,
    [{text:'a',line:1,endLine:1},{text:'b',line:2,endLine:2},{text:'',line:3,endLine:3}]));
  test(() => assert.equal(preprocess("'a\r\nb'\r\nc").lines.length, 2));
  test(() => assert.equal(preprocess('{a\r\n{b}\r\nc}\r\nd').lines.length, 2));
  test(() => assert.equal(preprocess("'a''b\r\nc'\r\nd").openQuote, null));
  test(() => assert.equal(preprocess('a\nb').lines.length, 1)); // Exact CRLF delimiter.
  test(() => assert.equal(preprocess('a\0ignored\r\n').lines[0].text, 'a'));
  const broken = "if 0:\r\n ! previous layer's switch\r\n *p 'ok'\r\nend";
  test(() => {
    const checked = checkSyntax(broken);
    assert.equal(checked.ok, false);
    assert.ok(checked.errors.some(e => e.code === 'UNTERMINATED_QUOTE' && e.line === 2));
    assert.ok(checked.errors.some(e => e.code === 'MISSING_END' && e.line === 1));
  });
  test(() => assert.equal(checkSyntax(broken.replace("layer's", 'layer')).ok, true));
  test(() => assert.equal(checkSyntax("if x:\r\nfor n=1 to 2:\r\nact 'go':\r\n*p 'x'\r\nend\r\nend\r\nelseif y:\r\nelse\r\nend").ok, true));
  test(() => assert.equal(checkSyntax("if x: *p 'inline'\r\n! 'paired comment'\r\n*p 'end'").ok, true));
  test(() => assert.equal(checkSyntax('if x _\r\n = 1:\r\nend').ok, true));
  test(() => assert.ok(checkSyntax('! {\r\nend').errors.some(e => e.code === 'UNTERMINATED_BRACES')));
  test(() => assert.ok(checkSyntax('end').errors.some(e => e.code === 'UNEXPECTED_END')));
  const modFile = path.resolve(__dirname, '../mods/2026-10-08_persistent_image_cycle.json.disabled');
  let actualFixture = null;
  if (fs.existsSync(modFile)) test(() => {
    const mod = JSON.parse(fs.readFileSync(modFile, 'utf8'));
    const body = mod.edits.find(e => e.location === 'interior_change').new;
    const brokenResult = checkSyntax(body);
    const repairedResult = checkSyntax(body.replace("previous layer's switch", 'previous layer switch'));
    assert.equal(brokenResult.ok, false);
    assert.equal(repairedResult.ok, true);
    actualFixture = { file: modFile, broken: brokenResult, apostropheRemoved: repairedResult };
  });
  return { ok: true, tests: count, verification: 'source-derived static check', actualFixture };
}

function main(args) {
  if (args.includes('--self-test')) { console.log(JSON.stringify(runSelfTests(), null, 2)); return; }
  let file = '', qsp = '', modFile = '', locations = [];
  for (let i = 0; i < args.length; ++i) {
    const arg = args[i];
    if (arg === '--handler' || arg === '--file') file = args[++i];
    else if (arg === '--qsp') qsp = args[++i];
    else if (arg === '--location') locations.push(args[++i]);
    else if (arg === '--mod') modFile = args[++i];
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: node tools/check-image-cycle-syntax.cjs --handler FILE\n' +
        '       node tools/check-image-cycle-syntax.cjs --qsp FILE [--location NAME ... | --mod MOD_JSON]\n' +
        '       node tools/check-image-cycle-syntax.cjs --self-test\n' +
        'Static source-derived checks only. Handler text line endings are normalized to CRLF.');
      return;
    } else if (!arg.startsWith('-') && !file && !qsp) {
      if (/\.qsp$/i.test(arg)) qsp = arg;
      else file = arg;
    } else throw Error('Unknown argument: ' + arg);
  }
  if ((file && qsp) || (!file && !qsp)) throw Error('Choose one handler file or QSP file.');
  const checks = [];
  if (file) checks.push({ location: null, ...checkSyntax(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''), {normalizeEol:true}) });
  else {
    if (modFile) {
      const mod = JSON.parse(fs.readFileSync(modFile, 'utf8'));
      locations.push(...mod.edits.map(e => e.location));
    }
    if (!locations.length) locations.push('interior_change');
    const doc = core.parse(fs.readFileSync(qsp));
    for (const name of [...new Set(locations)]) {
      const location = doc.locations.find(l => l.name === name);
      if (!location) throw Error('QSP location not found: ' + name);
      checks.push({ location: name, ...checkSyntax(core.shift(doc.lines[location.body], 5)) });
    }
  }
  const result = { ok: checks.every(c => c.ok), source: path.resolve(qsp || file), checks };
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

module.exports = { preprocess, joinContinuations, checkSyntax, runSelfTests };
if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 2; }
}
