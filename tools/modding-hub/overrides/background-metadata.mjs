// JO9 MOD CHARACTER_BACKGROUND_20261118: classification metadata does not change lore or bonuses.
export const BACKGROUND_KINDS = ['world', 'family', 'occupation'];
export function pickerBackground(data, legacy = {}) {
 const background = structuredClone(legacy);
 if (data.seed_background_fixed !== 1) return background;
 for (const kind of BACKGROUND_KINDS) {
  delete background[kind];
  if (data['seed_' + kind]) background[kind] = data['seed_' + kind];
 }
 return background;
}
export function needsBackgroundApply(data, background = {}) {
 return data.seed_background_fixed !== 1 && BACKGROUND_KINDS.some(kind => background[kind]);
}
export function serialSaves() {
 let tail = Promise.resolve();
 return task => { const next = tail.catch(() => {}).then(task); tail = next; return next; };
}
