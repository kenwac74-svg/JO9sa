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

`generation.milf.state` is a registered select in group `생성 초기값`. `-1` preserves original generation (or removes only this editor-owned rule); `0..3` set an initial state only for ordinary generated stock (`special_stock=0`, age `CONST_INT['milf_age']`). It does not edit saved actors, add storage variables, change RNG order or force the state on later frames. State 4 requires separate discovery/payout history integration and is not an option here. Candidate source binding is inside `generate_stock` immediately before the verified unique trait-list anchor; missing/duplicate/damaged anchors or owned blocks are refused. A generation-only edit does not increment the saved-definition cache revision.

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
