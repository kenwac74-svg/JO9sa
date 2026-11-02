'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),codec=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const out='G:/somi/JO9sa/records/ui-live-consolidation-20261027',file=out+'/ui-asset-path-map-plan.json',r=JSON.parse(fs.readFileSync(file,'utf8'));
const fixed={
  "directoryIndexAssessment": {
    "status": "PUBLIC_SOURCE_UI_PATHS_OUTSIDE_PICMAX_ROOTS",
    "source": "https://gitgud.io/jack-o-nine-tails/engine-base/-/blob/9bb0276be5f94f94f911fab0daeb225cc3c559ec/qsp/jack.cpp#L50-74",
    "function": "getImages()",
    "enumeratedRoots": [
      "girls/normal_scenes",
      "girls/reward_scenes",
      "girls/sex_scenes",
      "girls/torture_scenes",
      "scene"
    ],
    "assessment": "Proposed UI sources and targets are outside the five public getImages roots. No picMax delta is expected from that implementation; installed-binary behavior still needs a before/after native snapshot before operation."
  },
  "recommendedCompatibilityPlan": {
    "choice": "Canonical ui paths plus old-path compatibility aliases in WORK for first migration.",
    "implementationPreference": "On same NTFS volume, preserve or create hardlink old/new pairs after per-file hash and collision checks; keep an explicit alias manifest. No implementation in this report.",
    "why": "Representative old/new-version saves both contain more than 2600 cached UI path variables. Rebuilding only the currently displayed page does not cover all cached menus and code definitions.",
    "volume": "G:/ NTFS confirmed with .NET DriveInfo; no CIM dependency.",
    "releaseLimit": "ZIP and normal copy/extraction may create separate old/new files. Patch/Full payload must explicitly state which aliases are included or inherited; no installer/link creation script is authorized by this plan.",
    "updateLimit": "Atomic replacement by an image editor can detach one hardlink name. Build validation must verify alias pair content equality; hardlinks are not ongoing automatic synchronization.",
    "doNotDo": [
      "Do not flatten basename namespaces.",
      "Do not remove old paths based only on current-code literal scan.",
      "Do not rewrite historic mods in place.",
      "Do not change character/art/scene image namespaces merely because content/pic contains them."
    ]
  },
  "gitAndPackaging": {
    "sourceOwner": "resources/new/<new-relative-path> for canonical new assets where tracked; preserve source provenance and explicit old-path aliases in a migration manifest.",
    "cssOwner": "assets/css-2.4/base.css and the corresponding tracked CSS files; JS remains in its existing folder.",
    "qspOwner": "New isolated mods/*.json migration patch against current WORK baseline, exact replay and idempotence; do not revise older path strings in historic patches.",
    "saveOwner": "Existing saves remain read-only; no new blanket string-variable migration is assumed.",
    "tests": [
      "Canonical path and required compatibility path both resolve to intended SHA256.",
      "No case-insensitive proposed target collisions.",
      "Native getImages/picMax snapshot unchanged for excluded UI moves.",
      "Old save menu/profile/return callbacks and image display.",
      "Current live UI click paths and tooltip/message layers.",
      "ZIP entry list excludes backups/diagnostics/source artwork and preserves required aliases explicitly."
    ],
    "zipSavingsClaimed": false
  },
  "collisionResolutionNote": "Preserve bg source subfolders in destination: content/pic/bg/page_blank.png and bg/slave_psychology/page_blank.png cannot share a flat target. Final proposed map has zero target collisions."
};

const samples=[];for(const name of ['1.sav','JO9_GOLD_AP_CHECK_20261026.sav']){const p=r.work+'/save/'+name,raw=fs.readFileSync(p),d=codec.parse(raw);let vars=0,values=0;for(const v of d.vars){let n=0;for(const value of v.values)if(typeof value[1]==='string'&&/content[\/\\]pic[\/\\](?:buttons[\/\\]|ui overhaul[\/\\]|hart_|msg_bg|bg_main|page_blank)/i.test(value[1]))n++;if(n){vars++;values+=n;}}samples.push({path:p,sha256:crypto.createHash('sha256').update(raw).digest('hex'),variablesContainingLegacyUiPaths:vars,stringValuesContainingLegacyUiPaths:values,modified:false});}
r.oldSaveCacheEvidence=samples;Object.assign(r,fixed);fs.writeFileSync(file,JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify({oldSaveVariables:samples.map(s=>({file:s.path.split('/').pop(),variables:s.variablesContainingLegacyUiPaths})),filesMoved:0}));
