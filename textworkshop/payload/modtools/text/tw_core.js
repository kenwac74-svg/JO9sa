// jack.qsp 파서·문자열 스캐너·화면 매칭·편집 적용을 담당하는 Text Workshop 코어 (브라우저/Node 공용)
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TWCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---- QSPGAME 코덱 -------------------------------------------------------
  // 파일은 UTF-16LE(BOM 없음), CRLF로 나뉜 줄이고 각 필드는 UTF-16 코드 단위마다 -5 시프트되어 있다.
  function shift(s, d) {
    let out = '';
    const CH = 8192;
    for (let i = 0; i < s.length; i += CH) {
      const part = s.slice(i, i + CH);
      const a = new Array(part.length);
      for (let j = 0; j < part.length; j++) a[j] = (part.charCodeAt(j) + d) & 0xFFFF;
      out += String.fromCharCode.apply(null, a);
    }
    return out;
  }
  function bytesToString(bytes) {
    return new TextDecoder('utf-16le').decode(bytes);
  }
  function stringToBytes(s) {
    const buf = new Uint8Array(s.length * 2);
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      buf[i * 2] = c & 255;
      buf[i * 2 + 1] = c >> 8;
    }
    return buf;
  }

  function parseQsp(bytes) {
    // fatal:false 기본값이라 BOM이 있으면 조용히 벗겨지므로 먼저 확인한다.
    if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) throw new Error('BOM이 있는 파일은 지원하지 않습니다.');
    const fields = bytesToString(bytes).split('\r\n');
    if (fields[0] !== 'QSPGAME') throw new Error('QSPGAME 형식이 아닙니다.');
    const n = parseInt(shift(fields[3], 5), 10);
    if (!(n > 0)) throw new Error('Location 개수를 읽을 수 없습니다.');
    let at = 4;
    const locs = [];
    for (let i = 0; i < n; i++) {
      if (at + 3 >= fields.length) throw new Error('파일이 중간에 끊겼습니다.');
      const acts = parseInt(shift(fields[at + 3], 5), 10);
      locs.push({ name: shift(fields[at], 5), bodyIdx: at + 2 });
      at += 4 + acts * 3;
    }
    if (at !== fields.length - 1 || fields[at] !== '') throw new Error('QSPGAME 구조가 예상과 다릅니다.');
    return { fields: fields, locs: locs };
  }
  function serializeQsp(model) {
    return stringToBytes(model.fields.join('\r\n'));
  }
  function readBody(model, locIdx) {
    return shift(model.fields[model.locs[locIdx].bodyIdx], 5);
  }

  // ---- 문자열 스캐너 ------------------------------------------------------
  // 본문에서 '...' / "..." 리터럴 위치를 찾는다. '!' 주석과 <<식>> 안의 따옴표를 건너뛴다.
  function scanLiterals(body) {
    const out = [];
    const n = body.length;
    let i = 0;
    let stmtStart = true;
    while (i < n) {
      const c = body[i];
      if (c === '\n') { stmtStart = true; i++; continue; }
      if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
      if (c === '!' && stmtStart) {
        // 주석 안의 문자열은 줄을 넘어갈 수 있다(엔진도 한 덩어리로 건너뜀). 리터럴로는 보고하지 않는다.
        while (i < n && body[i] !== '\n') {
          const d = body[i];
          if (d === "'" || d === '"') i = skipString(body, i);
          else i++;
        }
        continue;
      }
      if (c === '&' || c === ':') { stmtStart = true; i++; continue; }
      if (c === "'" || c === '"') {
        stmtStart = false;
        const q = c;
        const start = i + 1;
        let j = start;
        let ok = false;
        while (j < n) {
          const d = body[j];
          if (d === q) {
            if (body[j + 1] === q) { j += 2; continue; }
            ok = true;
            break;
          }
          if (d === '<' && body[j + 1] === '<') {
            j = skipExpr(body, j + 2);
            continue;
          }
          j++;
        }
        if (!ok) { out.push({ start: start, end: n, quote: q, broken: true }); break; }
        out.push({ start: start, end: j, quote: q, broken: false });
        i = j + 1;
        continue;
      }
      stmtStart = false;
      i++;
    }
    return out;
  }
  // body[i]의 따옴표로 시작하는 문자열 다음 위치를 돌려준다(<<식>> 안의 따옴표는 무시).
  function skipString(s, i) {
    const q = s[i];
    let j = i + 1;
    const n = s.length;
    while (j < n) {
      const d = s[j];
      if (d === q) { if (s[j + 1] === q) { j += 2; continue; } return j + 1; }
      if (d === '<' && s[j + 1] === '<') { j = skipExpr(s, j + 2); continue; }
      j++;
    }
    return n;
  }
  // <<식>> 끝(>> 다음 위치)을 돌려준다. 식 안의 따옴표 문자열은 통째로 건너뛴다.
  function skipExpr(s, i) {
    const n = s.length;
    while (i < n) {
      const c = s[i];
      if (c === '>' && s[i + 1] === '>') return i + 2;
      if (c === "'" || c === '"') {
        i++;
        while (i < n) {
          if (s[i] === c) { if (s[i + 1] === c) { i += 2; continue; } break; }
          i++;
        }
      }
      i++;
    }
    return n;
  }

  // ---- 텍스트 분류 ---------------------------------------------------------
  const ENT = { '&quot;': '"', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&nbsp;': ' ', '&#39;': "'", '&apos;': "'" };
  function decodeEntities(s) {
    return s.replace(/&(?:quot|amp|lt|gt|nbsp|apos|#39);/g, function (m) { return ENT[m]; })
      .replace(/&#(\d+);/g, function (m, d) { return String.fromCharCode(+d); });
  }
  function stripTags(s) { return s.replace(/<[^>]*>/g, ''); }
  // 화면·소스 양쪽에 같은 변환을 적용하는 비교 키. 태그·공백을 전부 제거해 Qt HTML 재포맷 차이를 흡수한다.
  function matchKey(s) { return decodeEntities(stripTags(s)).replace(/\s+/g, ''); }
  function unescapeLit(raw, q) { return raw.split(q + q).join(q); }
  function escapeLit(text, q) { return text.split(q).join(q + q); }
  const CODE_RE = /^\s*(gs|gt|goto|xgoto|xgt|if|act|dynamic|killvar|cla|clr|msg|view|addobj|delobj|\*?pl|\*?nl|\$?[\w#]+(\[[^\]]*\])?\s*=)\b/i;

  function classify(raw, q) {
    const un = unescapeLit(raw, q);
    const hasVar = un.indexOf('<<') >= 0;
    const visible = decodeEntities(stripTags(un.replace(/<<[\s\S]*?>>/g, ''))).trim();
    const hangul = /[가-힣]/.test(visible);
    const latin = /[A-Za-z]/.test(visible) && /\s/.test(visible) && visible.length >= 8;
    if (!(hangul || latin) || visible.length < 2) return null; // 키·식별자·짧은 조각은 대상이 아님
    if (CODE_RE.test(un) && un.indexOf(q) >= 0) return null; // dynamic 등에 넘기는 코드 문자열
    const m = /^\s*(?:<[^>]*>\s*)*\[([^\]\r\n]{1,30})\]/.exec(un);
    const kind = m ? '대사' : (/["“”]/.test(un) ? '대사' : '지문');
    return { un: un, hasVar: hasVar, kind: kind, speaker: m ? m[1] : '' };
  }

  function lineAt(body, pos) {
    let a = body.lastIndexOf('\n', pos - 1) + 1;
    let b = body.indexOf('\n', pos);
    if (b < 0) b = body.length;
    return { a: a, b: b };
  }
  function trimLine(s) { s = s.replace(/\r$/, '').trim(); return s.length > 160 ? s.slice(0, 160) + '…' : s; }

  // 모든 Location 본문에서 텍스트 후보를 뽑는다.
  function buildIndex(model) {
    const items = [];
    let broken = 0;
    for (let li = 0; li < model.locs.length; li++) {
      const body = readBody(model, li);
      const lits = scanLiterals(body);
      for (const L of lits) {
        if (L.broken) { broken++; continue; }
        const raw = body.slice(L.start, L.end);
        const c = classify(raw, L.quote);
        if (!c) continue;
        const ln = lineAt(body, L.start);
        const prev = ln.a > 0 ? lineAt(body, ln.a - 1) : null;
        const next = ln.b < body.length ? lineAt(body, ln.b + 1) : null;
        items.push({
          id: li + ':' + L.start,
          loc: li, location: model.locs[li].name,
          start: L.start, end: L.end, quote: L.quote, raw: raw,
          text: c.un, key: matchKey(c.un),
          hasVar: c.hasVar, kind: c.kind, speaker: c.speaker,
          before: prev ? trimLine(body.slice(prev.a, prev.b)) : '',
          line: trimLine(body.slice(ln.a, ln.b)),
          after: next ? trimLine(body.slice(next.a, next.b)) : ''
        });
      }
    }
    return { items: items, broken: broken };
  }

  // ---- 화면 매칭 -----------------------------------------------------------
  const MIN_KEY = 4;
  function fragmentsOf(text) {
    return text.split(/<<[\s\S]*?>>/).map(matchKey).filter(function (k) { return k.length >= 2; });
  }
  function matchScreen(items, screenHtml) {
    const V = matchKey(screenHtml);
    const hits = [];
    for (const it of items) {
      let hit = false;
      if (!it.hasVar) {
        hit = it.key.length >= MIN_KEY && V.indexOf(it.key) >= 0;
      } else {
        const fr = fragmentsOf(it.text);
        if (fr.length && fr.join('').length >= MIN_KEY) {
          let p = 0; hit = true;
          for (const f of fr) { const k = V.indexOf(f, p); if (k < 0) { hit = false; break; } p = k + f.length; }
        }
      }
      if (hit) hits.push(it);
    }
    // 같은 Location에서 여러 문장이 맞을수록 현재 장면일 가능성이 높다(추정).
    const per = {};
    for (const h of hits) per[h.location] = (per[h.location] || 0) + 1;
    hits.sort(function (a, b) { return (per[b.location] - per[a.location]) || (a.loc - b.loc) || (a.start - b.start); });
    return { hits: hits, perLocation: per };
  }

  function search(items, query) {
    const k = matchKey(query);
    if (!k) return [];
    return items.filter(function (it) { return it.key.indexOf(k) >= 0; });
  }
  // 검색어 등장을 바꾼 편집 후보 텍스트(변수 없는 항목의 입력 기본값)
  function replaceInText(text, from, to) {
    return text.split(from).join(to);
  }

  // ---- 편집 검증·적용 ------------------------------------------------------
  function validateNewText(newText) {
    if (/[\r\n]/.test(newText)) return '줄바꿈은 <br>로 입력하세요.';
    if (newText.indexOf('<<') >= 0 || newText.indexOf('>>') >= 0) return 'v0.1에서는 변수(<<...>>)를 넣을 수 없습니다.';
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(newText)) return '제어 문자는 입력할 수 없습니다.';
    if (newText.replace(/<[^>]*>/g, '').trim().length === 0) return '내용이 비어 있습니다.';
    return '';
  }

  // edits: [{loc, start, end, quote, oldText, newText}]. 원본 리터럴이 바뀌었으면 예외.
  function applyEdits(model, edits) {
    const byLoc = {};
    for (const e of edits) (byLoc[e.loc] = byLoc[e.loc] || []).push(e);
    const fields = model.fields.slice();
    for (const k of Object.keys(byLoc)) {
      const li = +k;
      let body = readBody(model, li);
      const list = byLoc[k].slice().sort(function (a, b) { return b.start - a.start; });
      for (let i = 1; i < list.length; i++) if (list[i].end > list[i - 1].start) throw new Error('편집 범위가 겹칩니다.');
      for (const e of list) {
        const cur = body.slice(e.start, e.end);
        if (unescapeLit(cur, e.quote) !== e.oldText || body[e.start - 1] !== e.quote || body[e.end] !== e.quote)
          throw new Error('원본이 탐색 이후 바뀌었습니다: ' + model.locs[li].name);
        const err = validateNewText(e.newText);
        if (err) throw new Error(err);
        body = body.slice(0, e.start) + escapeLit(e.newText, e.quote) + body.slice(e.end);
      }
      fields[model.locs[li].bodyIdx] = shift(body, -5);
    }
    return { fields: fields, locs: model.locs };
  }

  // 결과를 다시 읽어 의도한 리터럴만 바뀌었는지 확인한다. 문제가 있으면 예외.
  function verifyEdits(before, afterBytes, edits) {
    const after = parseQsp(afterBytes);
    if (after.fields.length !== before.fields.length) throw new Error('검증 실패: 필드 수 변경');
    const touched = {};
    for (const e of edits) touched[before.locs[e.loc].bodyIdx] = true;
    for (let i = 0; i < before.fields.length; i++)
      if (!touched[i] && before.fields[i] !== after.fields[i]) throw new Error('검증 실패: 의도하지 않은 필드 변경');
    const byLoc = {};
    for (const e of edits) (byLoc[e.loc] = byLoc[e.loc] || []).push(e);
    for (const k of Object.keys(byLoc)) {
      const li = +k;
      let expect = readBody(before, li);
      const list = byLoc[k].slice().sort(function (a, b) { return b.start - a.start; });
      for (const e of list) expect = expect.slice(0, e.start) + escapeLit(e.newText, e.quote) + expect.slice(e.end);
      if (readBody(after, li) !== expect) throw new Error('검증 실패: 본문 불일치 ' + before.locs[li].name);
    }
    return true;
  }

  return {
    shift: shift, parseQsp: parseQsp, serializeQsp: serializeQsp, readBody: readBody,
    scanLiterals: scanLiterals, classify: classify, matchKey: matchKey,
    buildIndex: buildIndex, matchScreen: matchScreen, search: search, replaceInText: replaceInText,
    validateNewText: validateNewText, applyEdits: applyEdits, verifyEdits: verifyEdits,
    escapeLit: escapeLit, unescapeLit: unescapeLit
  };
});
