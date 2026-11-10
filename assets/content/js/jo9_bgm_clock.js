/* JO9 MOD START RESIDENCE_BGM_CLOCK_20261111: native BGM deadline bridge; ES5 for QtWebKit. */
(function (root) {
    'use strict';
    function createClock(deps) {
        var key = 'jo9-residence-bgm-v1', memory = null, timer = null;
        function read() {
            try { var value = deps.storage.getItem(key); return value ? JSON.parse(value) : memory; }
            catch (ignore) { return memory; }
        }
        function save(state) {
            memory = state;
            try { deps.storage.setItem(key, JSON.stringify(state)); } catch (ignore) {}
        }
        function dispose() { if (timer !== null) { deps.clearTimeout(timer); timer = null; } }
        function valid(s) {
            return s && typeof s.token === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(s.token) &&
                isFinite(s.durationMs) && s.durationMs > 0 && s.durationMs <= 86400000;
        }
        function arm(state, retry) {
            dispose();
            if (!valid(state) || !state.active || state.fired) { return; }
            var remaining = state.durationMs - Math.max(0, deps.now() - state.start);
            timer = deps.setTimeout(function () {
                timer = null;
                var current = read();
                if (!current || current.token !== state.token || !current.active || current.fired) { return; }
                current.fired = true;
                save(current); // Commit before synchronous EXEC can seed the next song.
                if (deps.dispatch(current.token) === false) {
                    var latest = read();
                    if (latest && latest.token === current.token) {
                        latest.fired = false; save(latest); arm(latest, 250);
                    }
                }
            }, retry || Math.max(1, remaining));
        }
        function seed(value) {
            dispose();
            if (!value || !/^[A-Za-z0-9_-]{1,100}$/.test(value.token || '')) { return; }
            var old = read(), state;
            if (old && old.token === value.token) { state = old; }
            else { state = {token:value.token, durationMs:Number(value.durationMs), active:!!value.active, start:deps.now(), fired:false}; }
            if (!valid(state)) { state.active = false; }
            save(state); arm(state);
        }
        return {seed:seed, restore:function () { var s = read(); if (s) { arm(s); } }, dispose:dispose};
    }
    if (typeof module === 'object' && module.exports) { module.exports = createClock; return; }
    if (!root || !root.document) { return; }
    if (root.JO9BgmClock) { root.JO9BgmClock.refresh(); return; }
    var storage;
    try { storage = root.sessionStorage; } catch (ignore) { storage = null; }
    var clock = createClock({
        now:function () { return Date.now(); },
        storage:storage || {getItem:function () { return null; }, setItem:function () {}},
        setTimeout:function (fn, ms) { return root.setTimeout(fn, ms); },
        clearTimeout:function (id) { root.clearTimeout(id); },
        dispatch:function (token) {
            var doc = root.document, msg = doc.getElementById('__message__'), style;
            if (msg) {
                style = root.getComputedStyle ? root.getComputedStyle(msg, null) : msg.style;
                if (style && style.visibility !== 'hidden' && style.display !== 'none') { return false; }
            }
            if (!doc.body) { return false; }
            var link = doc.createElement('a');
            link.style.display = 'none';
            link.setAttribute('href', "EXEC: gs 'jo9_residence_bgm','advance','" + token + "'");
            doc.body.appendChild(link);
            if (typeof link.click === 'function') { link.click(); }
            else {
                var event = doc.createEvent('MouseEvents');
                event.initMouseEvent('click', true, true, root, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
                link.dispatchEvent(event);
            }
            if (link.parentNode) { link.parentNode.removeChild(link); }
            return true;
        }
    });
    root.JO9BgmClock = clock;
    var refreshTimer = null;
    clock.refresh = function () {
        if (refreshTimer !== null) { root.clearTimeout(refreshTimer); }
        // A native repaint can replay earlier inline seeds. Consume only the final seed.
        refreshTimer = root.setTimeout(function () {
            refreshTimer = null;
            if (root.jo9BgmSeed) { clock.seed(root.jo9BgmSeed); } else { clock.restore(); }
        }, 0);
    };
    clock.refresh();
}(typeof window !== 'undefined' ? window : null));
/* JO9 MOD END RESIDENCE_BGM_CLOCK_20261111 */
