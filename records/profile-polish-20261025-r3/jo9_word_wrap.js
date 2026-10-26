/* JO9 MOD START PROFILE_POLISH_20261025_R3: readonly QtWebKit word wrapping. */
(function () {
    function wrap(box) {
        if (!box) { return; }
        var original = box.textContent || box.innerText || '';
        function visit(node) {
            if (node.nodeType === 3) {
                var value = node.nodeValue, pieces = value.split(/(\s+)/), fragment, i, word;
                if (!/\S/.test(value)) { return; }
                fragment = document.createDocumentFragment();
                for (i = 0; i < pieces.length; i += 1) {
                    if (!pieces[i]) { continue; }
                    if (/^\s+$/.test(pieces[i])) {
                        fragment.appendChild(document.createTextNode(pieces[i]));
                    } else {
                        word = document.createElement('span');
                        word.className = 'jo9_word';
                        word.style.display = 'inline-block';
                        word.style.whiteSpace = 'nowrap';
                        word.appendChild(document.createTextNode(pieces[i]));
                        fragment.appendChild(word);
                    }
                }
                node.parentNode.replaceChild(fragment, node);
            } else if (node.nodeType === 1) {
                if (/^(SCRIPT|STYLE|TEXTAREA|PRE|CODE)$/.test(node.tagName) || node.className === 'jo9_word') { return; }
                var child = node.firstChild, next;
                while (child) { next = child.nextSibling; visit(child); child = next; }
            }
        }
        visit(box);
        var css = window.getComputedStyle(box, null);
        var limit = box.clientWidth - (parseFloat(css.paddingLeft) || 0) - (parseFloat(css.paddingRight) || 0);
        var words = box.querySelectorAll('.jo9_word'), j;
        // An unusually long uninterrupted token can still fit the existing panel.
        for (j = 0; j < words.length; j += 1) {
            if (limit > 0 && words[j].getBoundingClientRect().width > limit) {
                words[j].style.maxWidth = limit + 'px';
                words[j].style.whiteSpace = 'normal';
                words[j].style.wordBreak = 'break-all';
            }
        }
        box.setAttribute('data-jo9-word-wrap', (box.textContent || box.innerText || '') === original ? '1' : 'error');
    }
    function run() { wrap(document.getElementById('jo9_gameover_message')); wrap(document.getElementById('info')); }
    window.setTimeout(run, 0);
    window.setTimeout(run, 500);
}());
/* JO9 MOD END PROFILE_POLISH_20261025_R3 */
