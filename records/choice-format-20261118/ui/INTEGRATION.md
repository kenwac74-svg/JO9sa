# Choice formatting frontend candidate

Candidate files are workspace-only. No game QSP or source installation was written by this task.

1. Insert `panel.html` after the closing `choiceAdditionBox` details and before `variableBox`.
2. Load `choice-format.css` beside the existing workshop stylesheets. Add it to the server CSS allowlist. All selectors are scoped under `#choiceFormatBox`.
3. Load `choice-format-ui.js` after `choice-editor.js` (and after existing script-review.js). Add it to the server JavaScript allowlist.
4. At the start of the existing shared `action('apply', async()=>{ ... })`, insert:

   ```js
   if(window.JO9ChoiceFormat?.ownsPreview(previewId))return window.JO9ChoiceFormat.apply();
   ```

5. Extend existing `JO9ChoiceEditor.dirty()` with `|| !!window.JO9ChoiceFormat?.dirty()` so the WORK-only unified scene-follow guard preserves formatting drafts without replacing the interface.

The module uses the existing global `selection`, `context`, `key`, `api`, `invalidate`, `say`, `previewId`, `render`, `remember`, `rememberAddition`, `visits`, `mode`, `refresh`, and `state`. It listens to existing selection, preview, and successful-write events. There is no independent write API or direct EXEC execution.

Options are requested with `{selection,sceneId,usageId}`. Preview submits only fields changed from the original form values; existing non-px lengths, named colors, and `normal` values remain untouched. `게임 기본 서식으로` explicitly stages removal of all six managed properties and still requires preview and shared approval. Numeric ranges are font 6–120px, letter spacing -10–40px, line height 0.5–4, and paragraph gap -120–240px.

The scoped sample uses effective formatting returned by the backend, current WORK dialogue font defaults when supplied, and a following line to show signed paragraph-gap changes. It displays label text through `textContent`. It does not execute links, reproduce original source breaks, or claim final game geometry. Existing em lengths remain em lengths in this sample.

Own apply checks the shared approval, reuses `/api/apply`, reloads the original selected source, rebases source offsets/scene IDs/usage IDs after the literal edit, and preserves current text/addition/choice-addition input drafts. It also preserves normal text typed while the save is pending. Successfully submitted formatting drafts are removed; remaining formatting drafts are rebased to the new hash. Other existing text-edit draft-store behavior is owned by the existing editor.

Run the focused frontend checks from the workspace:

```powershell
node --test artifacts/choice-format-20261118/ui/choice-format-ui.test.cjs
node --check artifacts/choice-format-20261118/ui/choice-format-ui.js
```

The 13 VM tests cover controls, draft isolation/reload, source targeting, shared approval, concurrent requests/usage switching, partial-style preservation/reset, signed-spacing sample, default fonts, save rehash, selected text preservation, and source-offset scene rebasing. Browser appearance and real game rendering require the root integration verification.
