/* JO9 MOD START KEYBOARD_HOTKEYS_20261108: page-level keyboard shortcuts for QtWebKit.
   - Left/Right arrows switch the top tabs (mark_one..mark_four) of the master, slave and assistant screens.
   - W N B V O E R C G press the matching travel button of the quick-move panel (qm_block).
   - H presses the go-home button in the city, barn and prison cell screens.
   Keys the engine already binds (S, A, D, Esc ...) are consumed by the engine first and never reach here. */
(function () {
    if (document.jo9HotkeysBound) { return; }
    document.jo9HotkeysBound = true;

    var TABS = ['mark_one', 'mark_two', 'mark_three', 'mark_four'];
    // Letter key code -> city_form value used by the travel buttons.
    var TRAVEL = {
        87: 1,    // W  White City
        78: 5,    // N  Necropolis
        66: 2,    // B  The Bull
        86: 3,    // V  Serpentine
        79: 4,    // O  Outcasts
        69: 121,  // E  Eastern Quarter
        82: 117,  // R  Red Light
        67: 118,  // C  Central Quarter
        71: 61    // G  City Gate
    };

    function press(anchor) {
        if (!anchor) { return false; }
        if (typeof anchor.click === 'function') {
            anchor.click();
        } else {
            var ev = document.createEvent('MouseEvents');
            ev.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
            anchor.dispatchEvent(ev);
        }
        return true;
    }

    function messageOpen() {
        var msg = document.getElementById('__message__');
        if (!msg) { return false; }
        var vis = (msg.style && msg.style.visibility) || '';
        if (!vis && window.getComputedStyle) { vis = window.getComputedStyle(msg, null).visibility; }
        return vis !== 'hidden';
    }

    function switchTab(step) {
        var boxes = [], current = -1, i, box;
        for (i = 0; i < TABS.length; i += 1) {
            box = document.getElementById(TABS[i]);
            if (!box) { return false; }
            boxes.push(box);
            // The selected tab is drawn without a link.
            if (!box.querySelector('a[href]')) { current = i; }
        }
        if (current < 0) { return false; }
        for (i = 1; i < boxes.length; i += 1) {
            var anchor = boxes[(current + step * i + boxes.length * i) % boxes.length].querySelector('a[href]');
            if (anchor) { return press(anchor); }
        }
        return false;
    }

    function travel(code) {
        var block = document.getElementById('qm_block');
        if (!block || !TRAVEL.hasOwnProperty(code)) { return false; }
        var links = block.getElementsByTagName('a'), i, m;
        for (i = 0; i < links.length; i += 1) {
            m = /city_form\s*=\s*(\d+)\b/.exec(links[i].getAttribute('href') || '');
            if (m && parseInt(m[1], 10) === TRAVEL[code]) { return press(links[i]); }
        }
        return false;
    }

    // H: the go-home button. Its tooltip starts with the word for going home,
    // which keeps the leave-home button of the main screen out of reach.
    function goHome() {
        var links = document.querySelectorAll('a[tooltip-data]'), i;
        for (i = 0; i < links.length; i += 1) {
            if (links[i].getAttribute('tooltip-data').indexOf('집으로') === 0) { return press(links[i]); }
        }
        return false;
    }

    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) { return; }
        var t = e.target, tag = t && t.tagName ? t.tagName.toUpperCase() : '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) { return; }
        if (messageOpen()) { return; }
        var code = e.keyCode || e.which, done = false;
        if (code === 37) { done = switchTab(-1); }
        else if (code === 39) { done = switchTab(1); }
        else if (code === 72) { done = goHome(); }
        else { done = travel(code); }
        if (done && e.preventDefault) { e.preventDefault(); }
    }, false);
}());
/* JO9 MOD END KEYBOARD_HOTKEYS_20261108 */
