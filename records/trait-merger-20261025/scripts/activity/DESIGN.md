# Activity merger implementation and verification

Current approved behavior on 2026-10-25. The later user instruction "긍정 부정이 충돌하면 긍정만 남기고 부정은 삭제해" supersedes the earlier proposal to preserve known opposite activity components.

The implementation remains isolated in this workspace. implement.cjs exports apply(ctx); it modifies only bodies through ctx.get / ctx.edit. It reads adjacent activity-modes.qsrc and activity-editor.qsrc. tests.cjs exports testCases(ctx?) and returns actual native QSP assertion bodies. No runtime QSP was written by this subtask.

## Canonical activity axis

A means jo9_work_ethic; C means passion_comfort.

| Display name | Effective A | Effective C |
| --- | ---: | ---: |
| 활동적 | +1 | -1 |
| 휴식 선호 | -1 | +1 |
| None | 0 | 0 |

For ordinary A/C values -1,0,1, active wins whenever raw A=1 OR raw C=-1. Otherwise passive is selected when raw A=-1 OR raw C=1. Thus known opposite combinations A=C=1 and A=C=-1 project to one active trait immediately.

Read functions remain pure: they do not rewrite raw saved fields. activity_repair(role) explicitly converts only those two known conflicts to canonical A=1/C=-1 and returns1 when changed, otherwise0. The parent common repair dispatcher must call it on load/profile refresh. Knowledge flags, daily activity buffers, AP, and unrelated traits are preserved. It does not call allow, because the positive activity component was already held.

Values outside -1/0/1 retain original component effects and labels. In particular, old C=2 is not repaired or normalized: original massage treats it as positive, while original rest and named-feature branches require exactly C=1. This unknown old value must not be classified as a known negative trait.

## Existing effects preserved once

- Work/education: the second and later qualifying activity that day adds 2 times effective A to mood. Existing jo9_activity_day / jo9_activity_count and existing caller hooks are reused. No duplicate activity hook is added.
- Effective C=1: the original slave rest reward doubles potency, preserves the original pos_job minimum and cheap-reward clearing, and enables the comfort-need dialogue.
- Effective C=-1: the original slave rest reward halves potency, preserves the cheap-reward branch and comfort-dislike dialogue, and suppresses pos_well_rested when actually known.
- Slave massage retains the original greater-than-zero double / less-than-zero half potency branch.
- Assistant massage retains discovery only; no analogous potency multiplier is added.
- The traits add no XP/value multiplier or slot cap. XP code for jo9_focus remains separate.

## jo9_traits mode contract

| Mode | Inputs after mode | Return / side effects |
| --- | --- | --- |
| activity_value | role, key | Pure numeric effective A or C; raw fallback outside normal domain. |
| activity_sign | role | Pure +1 active / -1 passive / 0 absent or unknown-domain legacy. |
| activity_compatible | role | Pure1 when both raw fields lie in -1/0/1; otherwise0. |
| activity_known | role | Pure1 if A_known=1 OR C_revealed=2; otherwise0. |
| activity_repair | role | Canonicalizes only A=C=±1 to active. Returns1 changed /0 unchanged. |
| activity_reveal | role | Marks pending C_revealed=1 for an undiscovered effective comfort trait. |
| activity_discover | role | Consumes pending discovery, shows the merged description once, marks existing flags known. Unknown-domain legacy uses original comfort discovery. |
| activity_generate | role, normally stock | Fresh generation only. Writes one canonical pair after existing rolls; see generation policy below. |
| activity_set | role, sign | Explicit canonical grant. Returns0 for unknown-domain values, invalid sign or allow rejection; otherwise writes A/C and known flags and returns1. |
| activity_remove | role, optional raw key | Without raw key, clears the normal merged axis and both existing flags. With A or C key, explicitly removes only that legacy component. |
| activity_edit | role, raw key, requested value | Existing editor toggle routes through canonical setter/remover. Unknown-domain combinations permit targeted removal and reject implicit replacement. |

activity_set calls func('jo9_traits','allow',role,'jo9_work_ethic',sign) before every nonzero assignment. Explicit editor replacement of active with passive or passive with active is an intentional choice. Removing a trait needs no allow gate. No new persistent character key or compatibility marker is introduced.

## Generation policy

All existing RNG calls and their order remain. Both original comfort draw and work-ethic roll execute.

After the existing work roll, fresh stock resolves active when A=1 OR C=-1; otherwise passive when A=-1 OR C>0. Fresh C=2 therefore maps to canonical passive unless an active component also won. This C=2 normalization occurs only in the explicit fresh-generation mode. Existing seed/read/refresh paths are not normalized by this activity module.

The positive work-ethic assignment is gated before writing with allow, because the exclusion helper's grandfathering permits already-held raw values. The final fresh normalization also consults allow. The exclusion module separately owns original comfort seed/random writer guards. No new RNG is added to any helper.

## Display, discovery, and removal

Normal-domain activity displays one row using ASCII activity_active / activity_passive description keys, accepted by the existing overview parser. The Korean labels are 활동적 / 휴식 선호. Original workaholic / content and Russian comfort descriptions remain available for unknown-domain legacy components.

Visibility includes actual knowledge OR spell_revelio. Rested-moodlet suppression requires actual knowledge; spell-only visibility must not suppress it. Activity discovery works when the raw A field is0 and C supplied the axis. Rest/massage discovery works when raw C is0 and A supplied the axis.

The in-game editor supplies one set of merged controls and targeted removal links for unknown-domain legacy components. The independent old comfort cycle is removed from menu_form to avoid duplicate controls.

Chaotic essence counts normal passive activity once. It removes both raw aliases of that merged negative axis, preventing resurrection. A normal opposite combination already projects active, so its obsolete raw negative component is not separately eligible. Unknown-domain legacy A=-1 remains independently removable; C2 and unrelated positive traits survive.

## Integration sites

Original WORK references are in inventory.json and can be refreshed read-only with inventory.cjs. The scan found11 literal-key locations /51 references, no action-body references and five JSON seed files.

apply(ctx) changes jo9_traits, menu_form, jo9_traits_personality, chose_answer, interaction, interaction_result, #static_base and jo9_chaotic. Existing generation callers and activity hooks are reused. Five seed JSONs contain C=1; no JSON asset rewrite is needed. External tools/state-editor has no current direct binding for either key.

The parent must refresh cached #static_base feature/discovery templates and interaction-derived code when loading old saves. The existing overview requires no schema change.

Separating/removing the helper while retaining readers breaks native function calls. Removing only activity_repair hooks leaves raw obsolete negative fields present, although normal reads still project positive. Restoring only the old comfort display would duplicate the merged trait and could restore a conflicting old description. Removing the canonical chaotic path can revive the surviving alias.

## Verification

tests.cjs covers all12 A/C combinations (nine normal plus C2 for A=-1/0/1), actual activity/rest/massage behavior, raw reads before repair, positive-wins repair and idempotence,10 actor roles, knowledge/spell/AP0 preservation, daily reset, no duplicated mood, XP neutrality, overview description keys, explicit editor choice, targeted unknown-value removal, fresh-generation positive priority and chaotic single-axis removal.

JS syntax and in-memory exact patch application were checked. The original jo9_traits has11 RNG calls before and after the module. Native QSP test execution and final release validation remain the parent integration task.

The general static checker reports an existing interaction ELSE_AFTER_ELSE at original line9639 identically before and after this module; all other changed location bodies and generated assertion bodies pass its quote/brace/block checks. This checker does not prove all native expressions or gameplay.
