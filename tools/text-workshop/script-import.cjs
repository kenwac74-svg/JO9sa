'use strict';
// JO9 MOD SCRIPT_IMPORT_20261108
// 흐름 각본(script-export)을 AI가 각색한 결과를 받아, 페이지 번호로 원래 대사 위치를 찾아 한 번에 반영할 변경을 만든다.
// QSP를 직접 쓰지 않는다. 결과(raw)는 서버의 기존 미리보기·승인·백업 트랜잭션으로만 저장된다.
const core = require('./core.cjs');
const { plain } = require('./script-export.cjs');

const ID = String.raw`S\d+-(?:P\d+(?:-V\d+)?|L\d+)`;
const MARK_PAGE = new RegExp(String.raw`^-{2,}\s*\[(S\d+-P\d+)\]`);
const MARK_VARIANT = new RegExp(String.raw`^\(\s*(S\d+-P\d+-V\d+)\b[^)]*\)\s*대체문`);
const MARK_LINE = new RegExp(String.raw`^\[(S\d+-L\d+)\b[^\]]*\]\s*$`);
const STRUCTURE = [/^={2,}\s*\[S\d+\]/, /^\[대사 묶음[\s\]]/, /^▶ /, /^\s+\d+\)\s/, /^\s+·\s/, /^#/, /^\[실행 중 결정/, /^\(진입 조건:/, /^\(이 장면에는/, /^\(이 배열의/, /^```/];

// 각색본 텍스트 → {exportId, blocks: Map(id → 본문)}
function parse(text) {
  const rows = String(text).replace(/\r\n?/g, '\n').split('\n');
  const exportId = (String(text).match(/#\s*각본 ID:\s*([a-f0-9]{8,64})/i) || [])[1] || null;
  const blocks = new Map(), duplicate = []; let normalizedMarkers=0;
  let current = null, buffer = [], afterPageMark = false;
  const flush = () => {
    if (!current) return;
    const body = buffer.join('\n').replace(/^\n+|\n+$/g, '');
    if (blocks.has(current)) duplicate.push(current); else blocks.set(current, body);
    current = null; buffer = [];
  };
  for (const row of rows) {
    let line = row.replace(/\s+$/, '');
    if(/^\\(?:={2,}|-{2,})\s*\[S\d+/.test(line)){line=line.slice(1).replace(/\\$/, '');normalizedMarkers++;}
    let m;
    if ((m = line.match(MARK_PAGE))) { flush(); current = m[1]; afterPageMark = true; continue; }
    if ((m = line.match(MARK_VARIANT))) { flush(); current = m[1]; afterPageMark = false; continue; }
    if ((m = line.match(MARK_LINE))) { flush(); current = m[1]; afterPageMark = false; continue; }
    if (STRUCTURE.some(re => re.test(line))) { flush(); afterPageMark = false; continue; }
    if (!current) continue;
    // 페이지 바로 아래의 (조건: ...) 줄은 구조 표시다.
    if (afterPageMark && !buffer.some(x => x.trim()) && /^\(조건:.*\)$/.test(line.trim())) continue;
    if (line.trim()) afterPageMark = false;
    buffer.push(line);
  }
  flush();
  return { exportId, blocks, duplicate, normalizedMarkers };
}

const norm = s => String(s).replace(/\(빈 페이지\)/g, '').replace(/[ \t ]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{2,}/g, '\n').trim();
const tagsOf = s => (s.match(/<\/?[A-Za-z][^<>]*>/g) || []).filter(t => !/^<\/?(?:br|div|p)\b/i.test(t) && !/^<\/(?:p|li|h\d)>$/i.test(t));
const varsOf = s => (s.match(/<<[\s\S]*?>>/g) || []);
const count = list => list.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map());
function missingFrom(before, after) {
  const a = count(before), b = count(after), out = [];
  for (const [k, n] of a) if ((b.get(k) || 0) < n) out.push(k);
  return out;
}

// 각본 평문 → 게임 문자열. 원문(oldRaw)의 머리말·화자 형식·꼬리말·그림/링크 태그를 되살린다.
function toGame(newPlain, oldRaw) {
  let text = newPlain.replace(/\(빈 페이지\)/g, '').replace(/\r\n?/g, '\n').replace(/^\n+|\n+$/g, '');
  // 〈식〉 → 원문의 <<식>> (공백만 다른 경우 원문 그대로)
  const tokens = new Map(); for (const t of varsOf(oldRaw)) tokens.set(t.slice(2, -2).replace(/\s+/g, ' ').trim(), t);
  const restoreVars = s => s.replace(/〈([^〉\n]+)〉/g, (_, x) => tokens.get(x.replace(/\s+/g, ' ').trim()) || '<<' + x + '>>');
  // [그림], [선택지: 라벨] → 원문의 <img>, <a>…</a> 를 순서대로
  // 태그 속성 안의 <<식>>에 들어 있는 '>' 때문에 태그가 끊기지 않도록 한다.
  const TAG = String.raw`(?:<<[\s\S]*?>>|[^>])*>`;
  const links = [...oldRaw.matchAll(new RegExp(String.raw`(<a\b` + TAG + String.raw`)([\s\S]*?)(<\/a>)`, 'gi'))];
  const imgs = oldRaw.replace(new RegExp(String.raw`<a\b` + TAG + String.raw`[\s\S]*?<\/a>`, 'gi'), '').match(new RegExp(String.raw`<img\b` + TAG, 'gi')) || [];
  let ii = 0, li = 0;
  // 원문 태그는 자리표시자로 넣었다가 변수 복원 뒤에 되돌린다(태그 안의 <<식>>을 건드리지 않게).
  const kept = [], hold = x => '\u0001' + (kept.push(x) - 1) + '\u0001';
  const restoreObjects = s => s.replace(/\[그림\]/g, () => { if (ii >= imgs.length) throw Error('[그림] 표시가 원문보다 많습니다.'); return hold(imgs[ii++]); })
    .replace(/\[(?:선택지: ((?:〈[^〉\n]*〉|[^\]\n])*)|그림 선택지)\]/g, (_, label) => {
      if (li >= links.length) throw Error('[선택지] 표시가 원문보다 많습니다.');
      const [, open, inner, close] = links[li++];
      const same = label === undefined || label.trim() === plain(inner).replace(/\n/g, ' ').trim();
      return hold(open) + (same ? hold(inner) : label) + hold(close);
    });
  const body = s => restoreVars(restoreObjects(s)).replace(/\u0001(\d+)\u0001/g, (_, k) => kept[+k]).split('\n').map(x => x.trim()).join('<br>');
  // 원문 형식: 앞공백 · [화자]<br> · 구분자(&nbsp; / "- " / 공백) · 본문 · </div> 등 꼬리
  const head = oldRaw.match(/^(\s*)\[([^\[\]\n]{1,80})\]<br>((?:\s|&nbsp;)*(?:-\s)?)/i);
  const tail = (oldRaw.match(/((?:\s|<\/div>)*)$/i) || ['', ''])[1];
  let out;
  if (head) {
    const sp = text.match(/^([^:\n]{1,40}):[ \t]?/);
    const shown = plain('[' + head[2] + ']<br>x').replace(/: x$/, '').trim();
    let speaker = head[2], rest = text;
    if (sp) { rest = text.slice(sp[0].length); speaker = sp[1].trim() === shown ? head[2] : restoreVars(sp[1].trim()); }
    else if (text.trim() === '[' + shown + ']') rest = ''; // 화자만 있고 본문이 빈 원문
    out = head[1] + '[' + speaker + ']<br>' + head[3] + body(rest);
  } else {
    const lead = (oldRaw.match(/^((?:\s|<br\s*\/?>|&nbsp;)*)/i) || ['', ''])[1];
    out = lead + body(text);
  }
  if (ii < imgs.length || li < links.length) throw Error('원문의 그림/선택지 ' + (imgs.length - ii + links.length - li) + '개가 각색본에서 빠졌습니다.');
  return out + (tail && !out.endsWith(tail.trim()) ? tail : '');
}

// Explicit revalidation against current WORK: exact text, unique within location/field.
function revalidateRecord(doc,record){
 if(!record?.map)throw Error('원본 각본 기록이 없습니다.');
 if(record.hash===doc.hash)return record;
 const entries=core.entries(doc),map={};
 for(const [id,ref]of Object.entries(record.map)){
  const matches=entries.filter(e=>e.location===ref.location&&e.field===ref.field&&e.text===ref.text);
  if(matches.length!==1)throw Error(id+': '+(matches.length?'같은 원문이 중복되어 유일한 위치를 정할 수 없습니다.':'현재 WORK 원문이 바뀌어 충돌합니다. 원문을 다시 확인하세요.'));
  map[id]={...matches[0],hash:doc.hash};
 }
 return {...record,originalHash:record.hash,hash:doc.hash,map};
}
// record: {hash, map}, text: 각색본, opts: {allowMissing, exclude: [id]}
function prepare(doc, record, text, opts = {}) {
  if (!record || record.hash !== doc.hash) throw Error('각본을 만든 뒤 QSP가 바뀌었습니다. 각본을 다시 만들어 각색해 주세요.');
  const { blocks, duplicate } = parse(text);
  if(!blocks.size)throw Error('페이지 번호를 인식하지 못했습니다. [S1-P1] 구분선을 포함한 각본을 넣으세요.');
  if (duplicate.length) throw Error('같은 번호가 두 번 나옵니다: ' + duplicate.slice(0, 5).join(', '));
  const known = Object.keys(record.map), exclude = new Set(opts.exclude || []);
  const unknown = [...blocks.keys()].filter(id => !record.map[id]);
  if (unknown.length) throw Error('각본에 없던 번호가 있습니다: ' + unknown.slice(0, 8).join(', ') + ' — 번호를 새로 만들거나 바꾸지 마세요.');
  const missing = known.filter(id => !blocks.has(id));
  const missingPages = missing.filter(id => /-P\d+$/.test(id));
  if (missingPages.length && !opts.allowMissing) throw Error('각색본에 빠진 페이지 ' + missingPages.length + '개: ' + missingPages.slice(0, 8).join(', ') + (missingPages.length > 8 ? ' …' : '') + ' — 빠진 페이지를 원문대로 두려면 ‘빠진 번호는 원문 유지’를 켜세요.');
  const entries = new Map(core.entries(doc).map(e => [e.fieldIndex + ':' + e.start + ':' + e.end, e]));
  const changes = [], errors = [], byKey = new Map();
  let unchanged = 0;
  for (const [id, newPlain] of blocks) {
    const ref = record.map[id], key = ref.fieldIndex + ':' + ref.start + ':' + ref.end, entry = entries.get(key);
    if (!entry || entry.text !== ref.text) { errors.push(id + ': 원문 위치가 바뀌었습니다.'); continue; }
    if (norm(newPlain) === norm(plain(entry.text))) { unchanged++; continue; }
    let next;
    try { next = toGame(newPlain, entry.text); core.validateMarkup(next); }
    catch (e) { errors.push(id + ': ' + e.message); continue; }
    if (norm(plain(next)) !== norm(newPlain.replace(/\(빈 페이지\)/g, ''))) { errors.push(id + ': 게임 형식으로 되돌린 결과가 각색본과 다릅니다. 태그·괄호 표시를 확인하세요.'); continue; }
    const warnings = [];
    const lostVars = missingFrom(varsOf(entry.text), varsOf(next));
    const addedVars=missingFrom(varsOf(next),varsOf(entry.text));
    if(lostVars.length||addedVars.length){errors.push(id+': 치환변수 보존 검사 실패'+(lostVars.length?' · 빠짐 '+lostVars.join(' '):'')+(addedVars.length?' · 추가 '+addedVars.join(' '):''));continue;}
    const lostTags = missingFrom(tagsOf(entry.text), tagsOf(next));
    if (lostTags.length) warnings.push('서식 태그 빠짐: ' + lostTags.slice(0, 4).join(' '));
    const speakerOld = (entry.text.match(/^\s*\[([^\[\]\n]{1,80})\]<br>/) || [])[1], speakerNew = (next.match(/^\s*\[([^\[\]\n]{1,80})\]<br>/) || [])[1];
    if (speakerOld && speakerNew && speakerOld !== speakerNew) warnings.push('화자 바뀜: ' + speakerOld + ' → ' + speakerNew);
    if (next.length > entry.text.length * 1.8 + 40) warnings.push('원문보다 많이 깁니다 (' + entry.text.length + '→' + next.length + '자)');
    if (byKey.has(key)) {
      const prev = byKey.get(key);
      if (prev.new !== next) errors.push(id + ': ' + prev.id + '와 같은 대사인데 다르게 각색되었습니다. 한쪽만 고치세요.');
      continue;
    }
    const change = { id, key, entry, location: entry.location, line: entry.line, old: entry.text, new: next, oldPlain: plain(entry.text), newPlain: plain(next), warnings, excluded: exclude.has(id) };
    byKey.set(key, change); changes.push(change);
  }
  if (errors.length) throw Object.assign(Error('반영할 수 없는 페이지가 있습니다.\n' + errors.slice(0, 20).join('\n') + (errors.length > 20 ? '\n…외 ' + (errors.length - 20) + '건' : '')), { details: errors });
  const chosen = changes.filter(c => !c.excluded);
  if (!chosen.length) return { changes, chosen, unchanged, missing, raw: null };
  // 필드별로 한 번에 조립한다(batch-replace와 같은 방식).
  const changed = { ...doc, lines: doc.lines.slice() }, edits = [], groups = new Map();
  for (const c of chosen) { if (!groups.has(c.entry.fieldIndex)) groups.set(c.entry.fieldIndex, []); groups.get(c.entry.fieldIndex).push(c); }
  for (const group of groups.values()) {
    group.sort((a, b) => a.entry.start - b.entry.start);
    const first = group[0].entry, last = group[group.length - 1].entry, oldField = core.shift(doc.lines[first.fieldIndex], 5), parts = [];
    let cursor = 0, delta = 0;
    for (const c of group) {
      const e = c.entry, encoded = e.quote ? c.new.split(e.quote).join(e.quote + e.quote) : c.new;
      if (e.quote) { const parsed = core.literals(e.quote + encoded + e.quote); if (parsed.length !== 1 || parsed[0].text !== c.new) throw Error(c.id + ': 따옴표 검사가 실패했습니다.'); }
      parts.push(oldField.slice(cursor, e.start), encoded); cursor = e.end; delta += encoded.length - (e.end - e.start);
    }
    parts.push(oldField.slice(cursor)); const newField = parts.join('');
    const piece = core.minimalEdit(oldField, newField, first.start, last.end, last.end + delta);
    edits.push({ location: first.location, field: first.field, ...piece, count: 1 });
    changed.lines[first.fieldIndex] = core.shift(newField, -5);
  }
  const raw = core.serialize(changed), checked = core.parse(raw), fields = new Set(chosen.map(c => c.entry.fieldIndex));
  if (checked.locations.length !== doc.locations.length || checked.lines.length !== doc.lines.length || checked.lines.some((s, i) => !fields.has(i) && s !== doc.lines[i])) throw Error('수정 범위를 벗어난 변경이 감지되었습니다.');
  // 저장 후 다시 읽었을 때 각 대사가 의도한 값인지 확인
  const texts = new Map([...fields].map(f => [f, new Set(core.literals(core.shift(checked.lines[f], 5)).map(l => l.text))]));
  for (const c of chosen) if (!texts.get(c.entry.fieldIndex).has(c.new)) throw Error(c.id + ': 저장 결과 검사에 실패했습니다.');
  return { raw, before: doc.hash, after: core.hash(raw), edits, changes, chosen, unchanged, missing };
}

module.exports = { parse, toGame, prepare, norm, revalidateRecord };
