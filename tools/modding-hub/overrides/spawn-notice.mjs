// Read-only notices: author choices are never changed or blocked.
export function newSpawnPolicy(draft) {
 if (draft.unique || !draft.register || ![draft.name,draft.slug,draft.id].some(v=>String(v??'').trim())) return null;
 return {unique:true,warning:'유니크 캐릭터의 고정 등장이 해제된 상태입니다. 이대로 만들면 일반 등장에 등록됩니다. 의도한 설정인지 확인하세요.'};
}
export function spawnNotice(policy, esc) {
 if (!policy?.unique) return '';
 if (policy.warning) return `<div class="st-spawn-warning" role="alert"><strong>⚠ 유니크 고정 등장 확인</strong><p>${esc(policy.warning)}</p></div>`;
 return '<p class="st-spawn-policy">유니크 · 일반 등장 제외</p>';
}
