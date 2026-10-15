# Internal prototype contract

No game writes in registry or GUI startup. No native game execution.

## registry.cjs

`inspect(raw: Buffer)` returns JSON:

```
{ hash, feature:{id,title,type,summary},
  roles:[{id,label}],
  fields:[{id,label,group,kind:'number'|'text'|'icon'|'select',value,min?,max?,step?,options?:[{value,label}],help,bindings:[{location,field:'body'|'desc',line,role?,code}]}],
  states:[{code,label,icon,labelFieldId?,iconFieldId?}],
  history:[{key,label,type,description}],
  transitions:[{id,title,description,bindings:[{location,field,line,role?,code}]}],
  warnings:[] }
```

`prepare(raw:Buffer, edits:[{id,value}], baseHash:string, options?:{refreshCache?:boolean,cacheRevision?:number})` returns:

```
{ raw:Buffer, beforeHash, afterHash,
  patch:{description,edits:[{location,field,old,new,count}]},
  changes:[{id,label,before,after,bindings:[{location,field,line,role?,code}]}] }
```

No-op returns original bytes / empty edits. Reject stale hash, unknown fields, invalid typed values, ambiguous/missing/inconsistent bindings. Select values preserve their option data type and accept only registered options. Use original count/hash checks. Preserve actions, unrelated locations, conditions, numeric codes and bookkeeping. Report read-only/unsupported components through warnings instead of pretending they are editable. Existing code cache version refresh is required if a real binding lives in saved dynamic definitions; document precise resolution.

`generation.type.code` is a direct text input in group `생성 초기값` with `allowEmpty:true` and an example placeholder, never a select/datalist or predefined type list. No rule means an empty source value. Codes are compared to the existing `$age[stock['age']]` string, never an unguarded numeric `age_code[unknown]` lookup. A future code may be prepared before its game definition exists; entering it does not create a new type or storage variable.

`generation.milf.state` retains its legacy ID for project compatibility but has a generic UI label and kind `state-search`. Its `suggestions:[{value,label,tooltip}]` are read from every supported literal integer $virginity definition in #variative, including code 4 and later definitions. This is search assistance, not an allowlist. The numeric API accepts -1 (preserve/remove the owned rule) or a nonnegative QSP integer. Active rules require a nonempty type code. Code-only inactive edits remain project drafts and produce no QSP change. Legacy MILF blocks inspect as code `milf` and remain byte exact on no-op. Existing actor helper code already recognizes current state 4 and performs its discovered-history/one-time-grant processing; this edit adds no history assignments or helper calls and does not expand the helper's existing eligibility. Candidate source binding remains immediately before the verified unique trait-list anchor. A generation-only edit does not increment saved-definition cache revision.

The state editor is a text input without select/datalist. Exact names, tooltips or numeric codes can resolve directly; partial searches show inline results with an explicit use-value button. Unresolved text/empty input cannot become numeric zero or be saved/applied as a state. A reset button restores -1. Existing numeric projects remain compatible; selecting a result or typing a code invalidates a prepared candidate.

## store.cjs

`createStore({targets:[{id,label,path}], runtime})` returns synchronous methods:

- `snapshot(id)` → `{target:{id,label,path,hash},targets:[{id,label,path,hash,available}],inspection:registry.inspect(...),history:[{id,status,createdAt,targets:[{id,label,beforeHash,afterHash}],...}]}`.
- `preview({sourceId,hashes:{[targetId]:hash},targetIds,edits})` → `{id,createdAt,targets:[{id,label,path,beforeHash,afterHash,changes,patch}],changeCount}`. Store candidate in runtime. Check all selected hashes; no QSP writes.
- `apply({previewId})` → `{id,status,targets:[{id,label,beforeHash,afterHash}],...}`. Validate hashes again; all target backups and durable journal before any replacement; post-verify; recover safely on failure. No-op must not write QSP.
- `restore({id})` → transaction with current-hash guard. Preserve post-apply user changes. Journal restore and verify exact backup bytes.
- `saveProject({sourceId,hashes,edits})` → `{project:{version,featureId,sourceId,hashes,edits,savedAt}}`; runtime/project.json, preserve old project on invalid edits. No QSP writes.
- `loadProject()` → `{project:null|object}`.

## HTTP server

CLI `node server.cjs --targets <local JSON config> --runtime <dir> --port 0` (default targets from repo local.config + explicit Full sibling). localhost only. `createServer({targets,runtime})` exported for tests; returns `{server, token}`. GET / root inserts session token (not logged); /app.js, /style.css static. Write routes require X-JO9-Token and same Origin; unknown Host/Origin rejected. POST body max 256KiB.

- GET `/api/state?target=work` → snapshot.
- POST `/api/preview` → preview contract.
- POST `/api/cache-preview` → preview contract with explicit saved-definition refresh.
- POST `/api/apply` → apply contract.
- POST `/api/restore` → restore contract.
- GET `/api/project` → loadProject.
- POST `/api/project` → saveProject.
- GET `/api/export?id=<transaction or preview id>` → declarative JSON patch(es); auth required.
- GET `/api/icon?target=work&path=content/pic/...png` → image only, verified path stays under that target's pic, no traversal/symlink.

All API routes require session token. HTTP errors JSON `{error}`. Registry/store validations 400/409; auth 403; unknown routes 404. UI save/apply are explicit buttons. Browser tests use disposable QSP target copies; actual files remain unchanged.

## GUI

Element IDs: target-select; target-checks; field-search; search-results; fields; state-table; transitions; history-fields; preview-button; apply-button; save-project; load-project; preview-result; status; transactions. Use field ids as `data-field-id` on inputs/selects. Initial GET state loads actual data. Keep state per loaded source hash; invalidate prior preview on any edit/target change/load. API through `fetch` with token from `<meta name="jo9-state-token" content="...">`. Real HTML app, not inline visualization. Root nav groups: 상태표 / 전환·이력 / 생성 초기값 / 연결 효과 / 비교·적용. Field group strings from registry shown as labels; text inputs show current QSP values, no hardcoded example values. Expose only actual editable bindings; unsupported operations visibly labeled. No inline handler/script interpolation of user text. `textContent`/native inputs for source strings.

Search returns matching registered fields across tabs. Each result has `data-search-field`, group, field name, current value, and an explicit navigation button. Navigation activates the correct view, makes the matching editor visible, and focuses/highlights exactly that field while retaining the query. Editable cards use both accent and a text badge; readonly definitions have separate labels. Hover/focus exposes the field explanation, linked through `aria-describedby`. Generational select drafts persist as numbers, not option strings.
