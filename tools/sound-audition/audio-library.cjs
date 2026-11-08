'use strict';
(function (root) {
  const normalized = value => String(value || '').replace(/\\/g, '/').replace(/^\.\//, '').toLowerCase();
  const isAudio = file => /^audio\//i.test(file.type || '') || /\.(?:wav|mp3|ogg|oga|opus|m4a|aac|flac|aif|aiff|webm|weba)$/i.test(file.name || '');
  function describeFile(file) {
    const name = String(file.name || '');
    const relativePath = String(file.webkitRelativePath || file.relativePath || name);
    const size = Number.isFinite(file.size) && file.size >= 0 ? file.size : 0;
    const lastModified = Number.isFinite(file.lastModified) && file.lastModified >= 0 ? file.lastModified : 0;
    return { id: JSON.stringify([normalized(relativePath), size, lastModified]), name, relativePath, size, lastModified, type: String(file.type || '') };
  }
  function matchFile(target, files) {
    const wanted = normalized(target);
    const matches = files.filter(file => {
      const meta = describeFile(file);
      return wanted.includes('/') ? normalized(meta.relativePath) === wanted : normalized(meta.name) === wanted;
    });
    return matches.length === 1 ? { status: 'match', file: matches[0] } : { status: matches.length > 1 ? 'ambiguous' : 'missing' };
  }
  function mergeFiles(existing, incoming) {
    const selected = new Map(existing.map(file => [describeFile(file).id, file]));
    const added = [], collisions = [];
    for (const file of incoming.filter(isAudio)) {
      const id = describeFile(file).id;
      if (selected.has(id)) {
        if (selected.get(id) !== file) collisions.push(file);
      } else { selected.set(id, file); added.push(file); }
    }
    return { files: [...selected.values()], added, collisions };
  }
  function filesForState(state, files) {
    const ids = new Set(state.files.map(file => file.id));
    return files.filter(file => ids.has(describeFile(file).id));
  }
  const validReview = value => ['remake', 'adopted', 'hold'].includes(value);
  function restoreState(saved) {
    const source = saved && typeof saved === 'object' ? saved : {};
    const files = [...new Map((Array.isArray(source.files) ? source.files : []).filter(file => file && typeof file.name === 'string' && isAudio(file)).map(file => { const meta = describeFile(file); return [meta.id, meta]; })).values()];
    const ids = new Set(files.map(file => file.id));
    const assignments = Object.fromEntries(Object.entries(source.assignments || {}).filter(([key, id]) => key && typeof id === 'string' && ids.has(id)));
    const reviews = Object.fromEntries(Object.entries(source.reviews || {}).filter(([key, value]) => key && validReview(value)));
    return { version: 1, files, assignments, reviews };
  }
  function assignRow(state, key, id) {
    const next = restoreState(state);
    if (id && next.files.some(file => file.id === id)) next.assignments[key] = id;
    else delete next.assignments[key];
    return next;
  }
  function toggleReview(state, key, value) {
    const next = restoreState(state);
    if (!validReview(value)) return next;
    if (next.reviews[key] === value) delete next.reviews[key];
    else next.reviews[key] = value;
    return next;
  }
  function applyDecisions(saved, decisions, appliedIds) {
    let state = restoreState(saved);
    const done = new Set((Array.isArray(appliedIds) ? appliedIds : []).filter(id => typeof id === 'string'));
    for (const decision of Array.isArray(decisions) ? decisions : []) {
      if (!decision || typeof decision.id !== 'string' || !decision.id || done.has(decision.id)) continue;
      const files = restoreState({ files: [...state.files, ...(Array.isArray(decision.files) ? decision.files : [])] }).files;
      const ids = new Set(files.map(file => file.id));
      const assignments = Object.fromEntries(Object.entries(decision.assignments || {}).filter(([key, id]) => key && ids.has(id)));
      const reviews = Object.fromEntries(Object.entries(decision.reviews || {}).filter(([key, value]) => key && validReview(value)));
      state = restoreState({ files, assignments: { ...state.assignments, ...assignments }, reviews: { ...state.reviews, ...reviews } });
      done.add(decision.id);
    }
    return { state, appliedIds: [...done] };
  }
  function rowSource(row, state, files) {
    const id = state.assignments[row.key];
    if (id) {
      const file = files.find(item => describeFile(item).id === id);
      return file ? { status: 'assigned', file } : { status: 'unavailable', meta: state.files.find(item => item.id === id) };
    }
    if (row.filename) {
      const found = matchFile(row.filename, files);
      if (found.status !== 'missing') return found;
    }
    return { status: 'baseline', src: row.baseline || '' };
  }
  const scriptJson = value => JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, ch => ({ '<': '\\u003c', '>': '\\u003e', '&': '\\u0026', '\u2028': '\\u2028', '\u2029': '\\u2029' }[ch]));
  const api = { isAudio, describeFile, matchFile, mergeFiles, filesForState, restoreState, assignRow, toggleReview, applyDecisions, rowSource, scriptJson };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.JO9AudioLibrary = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
