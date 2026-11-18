"""Small neutral fixtures for the presentation-only HTML adapter."""
import re
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent.parent))
import subprocess
import unittest
from helper_dashboard_html import adapt_html, STATE_SINGLE_FLIGHT_WRAPPER, STATE_RESPONSE_GUARD


FIXTURE = b'''<!doctype html><html><head><style>body{margin:0}</style></head><body class="existing">
<div class="topbar"><div class="brand"><span class="pulse-dot" id="syncDot"></span><span>Helper <small>by \xeb\xa6\xac\xeb\xa6\xbc</small></span></div><div id="metaPills"></div>
<select id="savSelect"></select><select id="targetBuildSelect"></select>
<button id="spoilerBtn" onclick="toggleSpoiler()">Hide</button><button id="modeBtn" onclick="toggleOverlayMode()">Compact</button>
<button id="topmostBtn" onclick="openTopmost()">Overlay</button><button id="shutdownBtn" onclick="shutdownHelper()">Stop</button></div>
<div id="tabBar"></div><div id="mainWrap"></div><div id="jo9Tooltip"></div><div id="jo9ModalBackdrop"></div>
<img src="/api/game-img?path=image.png"><script>
const pref=localStorage.getItem('jo9_spoiler');localStorage.setItem('jo9_ov_tab','stats');
const path='/api/state';fetch('/api/state');const image=`/api/game-img?path=${encodeURIComponent('x')}`;
function simulateRules(){return {rules:true};}function renderQuests(){}function renderCharacters(){}function renderGuides(){}
function toggleSpoiler(){}function toggleOverlayMode(){}async function fetchState() {
const res=await fetch('/api/state');const data = await res.json();throw Error('upstream');}
setInterval(fetchState,1500);
</script></body></html>'''


class HtmlAdapterTest(unittest.TestCase):
    def test_api_namespace_in_fetch_image_and_template(self):
        out = adapt_html(FIXTURE).decode()
        self.assertIn("fetch('/workspace/helper/api/state')", out)
        self.assertIn('src="/workspace/helper/api/game-img?', out)
        self.assertIn('`/workspace/helper/api/game-img?', out)
        self.assertNotRegex(out, r'(?<!/workspace/helper)/api/')

    def test_stylesheet_loads_in_head_after_original_style(self):
        out = adapt_html(FIXTURE).decode()
        self.assertLess(out.index('</style>'), out.index('jo9-helper-workspace-style'))
        self.assertLess(out.index('href="/workspace/helper/dashboard.css"'), out.index('</head>'))
        self.assertIn('class="existing" data-jo9-workspace="helper"', out)

    def test_duplicate_brand_removed_but_sync_status_and_credit_remain(self):
        out = adapt_html(FIXTURE).decode()
        self.assertNotIn('class="brand"', out)
        self.assertEqual(out.count('id="syncDot"'), 1)
        self.assertEqual(out.count('by 리림'), 1)
        self.assertIn('class="helper-credit"', out)

    def test_only_desktop_controls_are_removed(self):
        out = adapt_html(FIXTURE).decode()
        for name in ('topmostBtn', 'shutdownBtn'):
            self.assertNotIn(f'id="{name}"', out)
        for name in ('savSelect', 'targetBuildSelect', 'spoilerBtn', 'modeBtn', 'metaPills', 'tabBar', 'mainWrap', 'jo9Tooltip', 'jo9ModalBackdrop'):
            self.assertEqual(out.count(f'id="{name}"'), 1)

    def test_runtime_script_and_preferences_unchanged_except_explicit_adapter(self):
        before = re.search(r'<script>(.*?)</script>', FIXTURE.decode(), re.S)[1]
        after = re.search(r'<script>(.*?)</script>', adapt_html(FIXTURE).decode(), re.S)[1]
        unwrapped = after.replace(STATE_SINGLE_FLIGHT_WRAPPER, '').replace(STATE_RESPONSE_GUARD, '').replace(
            'async function helperWorkspaceFetchStateSource() {', 'async function fetchState() {')
        self.assertEqual(before.replace('/api/', '/workspace/helper/api/'), unwrapped)
        self.assertIn("throw Error('upstream')", after)
        self.assertIn('setInterval(fetchState,1500)', after)
        self.assertEqual(after.count(STATE_RESPONSE_GUARD), 1)
        self.assertIn('const data = await res.json();' + STATE_RESPONSE_GUARD, after)

    def test_state_singleflight_callbacks(self):
        # Exercise the actual adapter-emitted wrapper with neutral delayed calls.
        import json
        adapted = adapt_html(FIXTURE).decode()
        self.assertEqual(adapted.count(STATE_SINGLE_FLIGHT_WRAPPER), 1)
        script = r'''
const {test} = require('node:test'), assert = require('node:assert/strict'), vm = require('node:vm');
const wrapper = __WRAPPER__;
function bind(STATE, source) {
  return vm.runInNewContext(wrapper + '\n({fetchState})', {STATE, helperWorkspaceFetchStateSource: source});
}
test('overlapping refresh calls share one promise and request', async () => {
  let calls = 0, finish;
  const api = bind({selectedSav:'a'}, () => {calls++; return new Promise(resolve => {finish=resolve;});});
  const first = api.fetchState(), second = api.fetchState(), third = api.fetchState();
  assert.equal(first, second); assert.equal(first, third); assert.equal(calls, 1);
  finish(); await first; assert.equal(calls, 1);
});
test('save selection change schedules one immediate follow-up', async () => {
  const STATE={selectedSav:'a'}, requested=[], finish=[];
  const api=bind(STATE, () => {requested.push(STATE.selectedSav); return new Promise(resolve=>finish.push(resolve));});
  const first=api.fetchState(); STATE.selectedSav='b';
  assert.equal(api.fetchState(), first); assert.deepEqual(requested, ['a']);
  finish[0](); await new Promise(setImmediate);
  assert.deepEqual(requested, ['a','b']); assert.equal(api.fetchState(), first);
  finish[1](); await first; assert.deepEqual(requested, ['a','b']);
});
test('failure releases the pending request for retry', async () => {
  let calls=0;
  const api=bind({selectedSav:'a'}, async () => {if (++calls===1) throw Error('upstream failure');});
  const failed=api.fetchState(); await assert.rejects(failed, /upstream failure/);
  const retry=api.fetchState(); assert.notEqual(retry, failed); await retry; assert.equal(calls, 2);
});
'''.replace('__WRAPPER__', json.dumps(STATE_SINGLE_FLIGHT_WRAPPER))
        run = subprocess.run(['node', '-'], input=script, text=True, encoding='utf-8', capture_output=True, timeout=15)
        self.assertEqual(run.returncode, 0, run.stdout + run.stderr)
        self.assertIn('pass 3', run.stdout)

    def test_bom_and_repeat_adaptation_do_not_duplicate_anything(self):
        once = adapt_html(b'\xef\xbb\xbf' + FIXTURE)
        self.assertEqual(adapt_html(once), once)
        self.assertEqual(once.decode().count('id="jo9-helper-workspace-style"'), 1)
        self.assertEqual(once.decode().count('id="jo9-helper-workspace-credit"'), 1)

    def test_invalid_structure_is_explicit(self):
        for raw in (b'<body>missing head</body>', b'<head></head>missing body'):
            with self.assertRaisesRegex(ValueError, 'head/body'):
                adapt_html(raw)


if __name__ == '__main__':
    unittest.main()
