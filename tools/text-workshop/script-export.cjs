'use strict';
// JO9 MOD SCRIPT_EXPORT_20261108
// 한 장면에서 시작해 선택지·이동으로 이어지는 장면을 따라가며, 페이지 구분이 표시된 각본(txt)을 만든다.
// 읽기 전용 소스 분석이다. QSP를 실행하거나 세이브 변수를 평가하지 않는다.
const core = require('./core.cjs');
const flowModule = require('./flow.cjs');

// ---- 대사 문자열 → 각본용 평문 ----
function decode(s) {
  return s.replace(/&nbsp;/gi, ' ').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&amp;/gi, '&');
}
function plain(raw) {
  let s = String(raw);
  s = s.replace(/<<\s*([\s\S]*?)\s*>>/g, (_, v) => '〈' + v.replace(/\s+/g, ' ') + '〉');
  s = s.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, (_, label) => { const t = label.replace(/<[^>]*>/g, '').trim(); return t ? '[선택지: ' + t + ']' : '[그림 선택지]'; });
  s = s.replace(/<img\b[^>]*>/gi, '[그림]');
  s = s.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(?:div|p|li|h\d)>/gi, '\n').replace(/<(?!\/?(?:font|b|i|u|s|strong|em|span|small|big|sup|sub)\b)[^>]*>/gi, '');
  s = decode(s);
  const rows = s.split('\n').map(r => r.replace(/[ \t ]+/g, ' ').trim());
  // 게임 대사 형식: "[이름]<br> 내용" → "이름: 내용"
  const out = [];
  for (let i = 0; i < rows.length; i++) {
    const m = rows[i].match(/^\[([^\[\]:]{1,40})\]$/);
    if (m && /^(?:그림|그림 선택지)$/.test(m[1])) { out.push(rows[i]); continue; }
    if (m && i + 1 < rows.length && rows[i + 1]) { out.push(m[1] + ': ' + rows[i + 1].replace(/^-\s*/, '')); i++; continue; }
    out.push(rows[i]);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function build(doc, allEntries, h) {
  // h: {data, branches, chooseScene, masked, inScene, visible}
  let arrayIndex = null;
  function arrays() {
    if (arrayIndex) return arrayIndex;
    arrayIndex = new Map();
    for (const loc of doc.locations) {
      const d = h.data(loc.name);
      for (const e of d.entries) {
        if (e.field !== 'body' || !h.visible(e)) continue;
        const b = flowModule.binding(d.analysis.body, e);
        if (!b || b.array === '$text') continue;
        if (!arrayIndex.has(b.array)) arrayIndex.set(b.array, []);
        arrayIndex.get(b.array).push({ entry: e, location: loc.name, stage: b.stage, conditions: flowModule.conditions(d.analysis, e.start) });
      }
    }
    return arrayIndex;
  }
  // scene 안에서만 의미 있는 조건(장면 자체와 상위 조건은 제외)
  function localConditions(analysis, scene, offset) {
    return analysis.blocks.filter(b => b.kind === 'if' && offset >= b.start && offset < b.end && b.start > scene.start).map(b => b.condition);
  }
  // 주인공 성별 판본: #txt_man / #txt_woman 처럼 같은 배열을 성별 라이브러리마다 따로 정의한다.
  // 짝 이름: #txt_woman ↔ #txt_man, #npc_base_woman ↔ #npc_base, #txt_2_woman ↔ #txt_2_man
  const counterparts = w => [w.replace(/woman/i, 'man'), w.replace(/_woman/i, '')].map(x => x.toLowerCase());
  function pickEdition(rows, edition) {
    const present = new Set(rows.map(r => r.location.toLowerCase()));
    const women = [...present].filter(l => /woman/i.test(l));
    const pairs = women.map(w => [w, counterparts(w).find(m => present.has(m))]).filter(p => p[1]);
    if (!pairs.length) return rows;
    const drop = new Set(pairs.map(([w, m]) => edition === 'woman' ? m : w));
    return rows.filter(r => !drop.has(r.location.toLowerCase()));
  }
  // 실행 순서: 공용 라이브러리(#...) → 장면 위치. 같은 번호는 마지막 무조건 대입이 기본문이고,
  // 그 뒤에 오는 조건부 대입만 대체문으로 남는다. 앞서 덮어써지는 대입은 버린다.
  function stagesOf(rows, stats) {
    const order = r => (r.location.startsWith('#') ? 0 : 1);
    rows = [...rows].sort((a, b) => order(a) - order(b) || (a.location === b.location ? a.entry.start - b.entry.start : 0));
    const common = rows.length ? rows[0].conditions.filter(c => rows.every(r => r.conditions.includes(c))) : [];
    const by = new Map();
    for (const r of rows) { if (!by.has(r.stage)) by.set(r.stage, []); by.get(r.stage).push({ ...r, conditions: r.conditions.filter(c => !common.includes(c)) }); }
    return [...by].sort((a, b) => a[0] - b[0]).map(([stage, list]) => {
      let base = -1; list.forEach((r, i) => { if (!r.conditions.length) base = i; });
      if (base < 0) return { stage, variants: list };
      if (stats) stats.overwritten += base;
      return { stage, variants: [list[base], ...list.slice(base + 1)] };
    });
  }
  function sceneOf(destination) {
    const d = h.data(destination.location);
    const scene = d.analysis.scenes.find(s => s.id === destination.sceneId);
    if (!scene) throw Error('장면을 찾지 못했습니다: ' + destination.location + ' / ' + destination.sceneId);
    return { d, scene };
  }

  function collect(d, scene) {
    const body = d.analysis.body, safe = d.analysis.safe, items = [], copied = new Set();
    const slice = (scene.id === 'root') ? [0, body.length] : [scene.start, scene.end];
    // copyarr '$text', '$배열'
    const re = /\bcopyarr\s+/gi; re.lastIndex = slice[0]; let m;
    while ((m = re.exec(safe)) && m.index < slice[1]) {
      const lineEnd = body.indexOf('\n', m.index), tail = body.slice(m.index, lineEnd < 0 ? body.length : lineEnd);
      const args = core.literals(tail);
      if ((args[0]?.text || '').toLowerCase() !== '$text' || !args[1]) continue;
      const array = args[1].text.toLowerCase();
      if (!/^\$[\w]+$/.test(array)) { items.push({ kind: 'dynamic', offset: m.index, note: 'copyarr 대상이 실행 중 결정됩니다: ' + args[1].text, conditions: localConditions(d.analysis, scene, m.index) }); continue; }
      copied.add(array);
      items.push({ kind: 'array', offset: m.index, array, conditions: localConditions(d.analysis, scene, m.index) });
    }
    // 장면 안 문자열
    const direct = [];
    for (const e of d.entries) {
      if (e.field !== 'body' || !h.visible(e) || e.start < slice[0] || e.start >= slice[1]) continue;
      const b = flowModule.binding(body, e);
      if (b && b.array === '$text') { direct.push({ entry: e, stage: b.stage, location: d.loc.name, conditions: localConditions(d.analysis, scene, e.start), offset: e.start }); continue; }
      if (b && copied.has(b.array)) continue;
      items.push({ kind: 'line', offset: e.start, entry: e, conditions: localConditions(d.analysis, scene, e.start) });
    }
    if (direct.length) items.push({ kind: 'direct', offset: direct[0].offset, rows: direct });
    // 실행 중 조립되는 페이지
    const dyn = /\$text\[\s*[^\]]*\]\s*=\s*(?!['"])\S/g; dyn.lastIndex = slice[0];
    while ((m = dyn.exec(safe)) && m.index < slice[1]) {
      if (/\$text\[\s*[^\]]*\]\s*=\s*\$replace\(\s*\$text/i.test(body.slice(m.index, m.index + 80))) continue;
      items.push({ kind: 'dynamic', offset: m.index, note: '실행 중 조립되는 페이지: ' + body.slice(m.index, body.indexOf('\n', m.index) < 0 ? body.length : body.indexOf('\n', m.index)).trim().slice(0, 140), conditions: localConditions(d.analysis, scene, m.index) });
    }
    items.sort((a, b) => a.offset - b.offset);
    // 페이지를 다 넘긴 뒤 돌아갈 곳
    const returns = [];
    const rl = /\$return_lock\b/gi; rl.lastIndex = slice[0];
    while ((m = rl.exec(safe)) && m.index < slice[1]) {
      const v = body.slice(m.index, m.index + 160).match(/^\$return_lock[ \t]*=[ \t]*(['"])([^'"\n]+)\1/i);
      if (v) returns.push(v[2]);
    }
    return { items, returns: [...new Set(returns)] };
  }

  function script(start, options = {}) {
    const maxScenes = Math.max(1, Math.min(200, Number(options.maxScenes) || 30));
    const maxDepth = Math.max(0, Math.min(50, Number.isFinite(Number(options.maxDepth)) ? Number(options.maxDepth) : 6));
    const variants = options.variants !== false, edition = options.edition === 'woman' ? 'woman' : 'man', followCalls = options.followCalls === true, showCode = options.showCode === true;
    const map = {}, ref = e => ({ location: e.location, fieldIndex: e.fieldIndex, start: e.start, end: e.end, text: e.text, quote: e.quote, line: e.line });
    const ids = new Map(), queue = [], out = [], stats = { scenes: 0, pages: 0, variants: 0, lines: 0, dynamic: 0, skipped: 0, overwritten: 0 };
    const keyOf = x => x.location.toLowerCase() + '\u0000' + x.sceneId;
    function enqueue(dest, depth) {
      const k = keyOf(dest);
      if (ids.has(k)) return ids.get(k);
      if (ids.size >= maxScenes || depth > maxDepth) return null;
      const id = 'S' + (ids.size + 1); ids.set(k, id); queue.push({ dest, depth, id }); return id;
    }
    enqueue(start, 0);
    const first = sceneOf(start);
    out.push('# JO9 흐름 각본');
    out.push('# 시작 장면: ' + first.d.loc.name + ' · ' + first.scene.condition + ' (' + first.scene.line + '행)');
    out.push('# QSP: ' + doc.hash.slice(0, 12) + ' · 주인공 판본: ' + (edition === 'woman' ? '여성' : '남성') + ' · 만든 시각: ' + new Date().toISOString());
    if (options.exportId) out.push('# 각본 ID: ' + options.exportId + '  ← 반영할 때 필요합니다. 지우지 마세요.');
    out.push('#');
    out.push('# 읽는 법');
    out.push('#  ==== [S1] ... ====      장면 하나. 게임의 한 이벤트/분기 구간입니다.');
    out.push('#  ---- [S1-P3] 3/14 ----   페이지 구분. 게임에서 → 버튼으로 넘기는 한 화면입니다.');
    out.push('#  (S1-P3-V1 · 조건: ...) 대체문   같은 페이지가 조건에 따라 이 문장으로 바뀝니다.');
    out.push('#  [S1-L2 · 장면 문구]     페이지 밖에 보이는 문구(제목·버튼·안내 등).');
    out.push('#  <font>·<b> 같은 태그     게임의 색·굵기 강조입니다. 감싼 단어가 바뀌어도 태그는 남겨 두세요.');
    out.push('#  〈$변수〉               게임이 실행 중 넣는 값(이름 등). 각색할 때도 그대로 두세요.');
    out.push('#  ▶ 선택지 → [S2]        이 장면에서 갈 수 있는 다음 장면입니다.');
    out.push('# 분기는 소스 분석 결과이며, 실제로 어느 쪽이 나오는지는 세이브 상태에 따라 다릅니다.');
    out.push('# 각색을 요청할 때: 페이지 구분선과 [S1-P3] 번호를 지우거나 합치지 말고, 페이지마다 한 화면 분량을 유지해 달라고 요청하세요.');
    out.push('');
    while (queue.length) {
      const { dest, depth, id } = queue.shift();
      let d, scene;
      try { ({ d, scene } = sceneOf(dest)); } catch (e) { out.push('==== [' + id + '] ' + dest.location + ' · 열 수 없음: ' + e.message + ' ===='); continue; }
      stats.scenes++;
      out.push('==== [' + id + '] ' + d.loc.name + ' · ' + scene.condition + ' · ' + scene.line + '행' + (depth ? ' · 시작에서 ' + depth + '단계' : '') + ' ====');
      if (scene.parents?.length) out.push('(진입 조건: ' + scene.parents.join(' → ') + ')');
      const { items, returns } = collect(d, scene);
      let pageNo = 0, lineNo = 0;
      const page = (label, total, where) => { pageNo++; stats.pages++; out.push(''); out.push('---- [' + id + '-P' + pageNo + '] ' + label + (total ? '/' + total : '') + (showCode && where ? ' · ' + where : '') + ' ----'); };
      const writeStages = (stages, source) => {
        const total = stages.length;
        for (const [index, st] of stages.entries()) {
          const [base, ...alts] = st.variants;
          page(String(index + 1), total,source + '[' + st.stage + '] · ' + base.location + ' ' + base.entry.line + '행');
          if (base.conditions.length) out.push('(조건: ' + base.conditions.join(' → ') + ')');
          const pid = id + '-P' + pageNo; map[pid] = ref(base.entry);
          out.push(plain(base.entry.text) || '(빈 페이지)');
          if (variants) alts.forEach((v, k) => { stats.variants++; const vid = pid + '-V' + (k + 1); map[vid] = ref(v.entry); out.push(''); out.push('(' + vid + ' · 조건: ' + (v.conditions.join(' → ') || '조건 없이 덮어씀') + ') 대체문' + (showCode ? ' · ' + v.location + ' ' + v.entry.line + '행' : '')); out.push(plain(v.entry.text) || '(빈 페이지)'); });
        }
      };
      if (!items.length) { out.push(''); out.push('(이 장면에는 표시되는 대사가 없습니다.)'); }
      for (const it of items) {
        if (it.kind === 'array') {
          const rows = pickEdition(arrays().get(it.array) || [], edition);
          out.push('');
          out.push('[대사 묶음 ' + it.array + (it.conditions.length ? ' · 조건: ' + it.conditions.join(' → ') : '') + ' · ' + new Set(rows.map(r => r.stage)).size + '페이지]');
          if (!rows.length) { out.push('(이 배열의 대사를 찾지 못했습니다. 실행 중에 채워질 수 있습니다.)'); continue; }
          writeStages(stagesOf(rows, stats), it.array);
        } else if (it.kind === 'direct') {
          writeStages(stagesOf(it.rows, stats), '$text');
        } else if (it.kind === 'line') {
          stats.lines++;
          out.push('');
          const lid = id + '-L' + (++lineNo); map[lid] = ref(it.entry);
          out.push('[' + lid + ' · 장면 문구' + (it.conditions.length ? ' · 조건: ' + it.conditions.join(' → ') : '') + (showCode ? ' · ' + it.entry.line + '행' : '') + ']');
          out.push(plain(it.entry.text));
        } else {
          stats.dynamic++;
          out.push('');
          out.push('[실행 중 결정' + (it.conditions.length ? ' · 조건: ' + it.conditions.join(' → ') : '') + '] ' + it.note);
        }
      }
      // 선택지·이동
      const branches = h.branches(d.analysis, scene, d.loc.name, d.entries).filter(b => b.mode !== 'condition');
      if (branches.length || returns.length) { out.push(''); out.push('▶ 이 장면 다음'); }
      for (const r of returns) out.push('  · 페이지를 다 넘기면 → ' + r + ' (메뉴/허브로 복귀)');
      let n = 0;
      for (const b of branches) {
        n++;
        const call = /^(gs|gosub)$/.test(b.mode);
        const label = b.kind === 'choice' ? '「' + plain(b.label).replace(/\n/g, ' ') + '」' : (call ? '호출' : '이동');
        const cond = b.conditions?.length ? ' (조건: ' + b.conditions.filter(c => c !== scene.condition && !(scene.parents || []).includes(c)).join(' → ') + ')' : '';
        const targets = (b.destinations || []).map(t => {
          const hub = t.sceneId === 'root';
          const follow = !hub && (!call || followCalls) && !/^#/.test(t.location);
          const sid = follow ? enqueue(t, depth + 1) : null;
          if (!sid && follow) stats.skipped++;
          return sid ? '[' + sid + '] ' + t.location + ' · ' + t.title : t.location + (hub ? ' (위치 전체·허브)' : ' · ' + t.title) + (follow ? ' — 범위 밖' : '');
        });
        out.push('  ' + n + ') ' + label + cond.replace(' (조건: )', '') + ' → ' + (targets.length ? targets.join(' / ') : (b.resolved ? b.target : '목적지 미확정(' + b.target + ')')));
      }
      out.push('');
    }
    out.push('# 끝 · 장면 ' + stats.scenes + '개 · 페이지 ' + stats.pages + '개 · 조건부 대체문 ' + stats.variants + '개' + (stats.skipped ? ' · 한도 때문에 따라가지 않은 연결 ' + stats.skipped + '개' : ''));
    return { text: out.join('\n'), stats, hash: doc.hash, map };
  }
  return { script };
}
module.exports = { build, plain };
