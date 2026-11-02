# Tutorial CSS integration candidate

This folder is a reviewable local candidate. WORK/css and repo assets/css-2.4 are unchanged by this agent.

The CSS uses `.jo9_tutorial_menu` as its only style scope. It does not change global `#under`, `#under_gray`, `#clear`, `.menu` or `.menu_column_*` rules. Labels, action strings and source BR markup remain intact. Only a BR that is a direct child of the wrapper, or of a cached lecture's nested `#bg`, is hidden in CSS; label-internal BR elements remain visible. The nested selector makes a preserved cached lecture menu use the same spacing as a newly rendered lecture menu.

## QSP wrapper positions

1. `demo_intro`, lecture 100, both `#bg` menu containers (WORK body lines 36 and 46): add `class="jo9_tutorial_menu jo9_tutorial_lecture"`. No extra absolute or relative container is needed. Pre-exam has seven rows and exam-in-progress has six rows; at 62px they occupy 434px/372px of the existing 595px scene panel. Do not add the long-list class here.
2. `demo_menu_form`: keep `display_fullimage(..., 'center_image_home_demo')` outside the wrapper. After that append an opening wrapper to `$text_display`, and close it immediately before `gt 'main_screen'`. The wrapper class is `jo9_tutorial_menu jo9_tutorial_practical`. On `menu_form = 17`, add `jo9_tutorial_long`. These presentation classes must not replace or modify any original action/state condition.
3. Existing modern potion branches (`menu_Drink_potion`, `menu_potion_S`; retain any additional applicable potion ID) use `jo9_tutorial_menu` only. Do not apply `.jo9_tutorial_practical`/`.jo9_tutorial_long` to them: their existing `.menu_column_0` and navigation already have absolute/common placement.
4. `menu_form = 2000`: the visible menus come from `$setting_display`, `$setting_display_c`, `$setting_display_c2` and `$setting_display_r`, not `$text_display`. Wrap each nonempty string in `jo9_tutorial_menu jo9_tutorial_settings` while retaining the shared `main_screen` rendering and original strings/callbacks. Current shared containers are at main_screen body lines 579-582. Do not change those shared output lines for non-tutorial pages.

## Height and column evidence

`demo_menu_form` source contains many duplicated if/else alternatives. The actual teacher menu (17) emits fifteen lessons plus Back and Cancel: seventeen rows. Its unchanged source remains in column-first order. The proposed two-column layout fills ten rows in the left column and seven in the right. Each row is 330x62px and the second column starts 335px after the first, matching the current common menu pitch. Width is 665px, height 620px. At main_screen origin (1,150), the wrapper's left margin 24 puts it at x25 and its bottom at y770.

Other inspected long practical menus: menu 6 has ten actual rows; menu 154 has ten; menu 31, 16 and 121 have nine. They fit in one 620px column when direct prefix BR spacing is suppressed. No default scrolling is introduced.

The existing full-image may sit behind a second menu column, as in the current common multi-column menus. Preserve it as the existing preceding sibling rather than moving it into a new containing block.

## Required native DOM verification by implementation agent

- Confirm Qt WebKit honors `-webkit-column-count`, fixed 620px height and atomic 62px rows. The intended fill is ten left and seven right rows for menu 17; balanced nine/eight is also acceptable if that engine ignores column-fill. All seventeen rows must remain in two columns in source order, with no third column or clipped last callback. This CSS has not been run in native WebKit by this audit agent.
- Check every menu 17 label, active/disabled alternates, first/last clear target and Back/Cancel bounds. Check original href strings against the pre-change output.
- Inspect menu 6 and 154 (ten rows), lecture 100 (seven/six rows), settings, and both existing modern potion branches.
- Test long labels such as `베스투리아의 암브로시아 ($25) (=5)`, `Mini-pony ($50 + $1/day) (=5)` and the long spell names. Rows use the common 20px font but 26px text line height and flex centering so labels can wrap inside a 62px target; internal BR markup is retained. Check actual line boxes and text bounds instead of assuming fonts fit.
- Ensure wrapper-added CSS creates no new containing block for the existing full-image or modern absolute menu columns. Shared home and common menus must retain their pre-change geometry and CSS rules.

## Source references

- WORK QSP: demo_menu_form 39-41 (full image), 254-332 (seventeen-row teacher menu), 424-467 and 470-519 (modern potion branches), 1027-1060 (settings), 1062 (main_screen transfer).
- WORK CSS: base.css 566-585 (original 400x40 legacy rows), 4190-4214 (current menu and columns), 4246-4250 (font), 4285-4295 (bar and 65px padding), 4315-4322 (62px common row pitch).
- No assets are generated or renamed. The source asset is `content/pic/ui/legacy_overhaul/bar.png` (409x62).
