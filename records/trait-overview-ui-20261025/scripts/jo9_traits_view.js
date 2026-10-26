/* JO9 MOD START UI_TRAIT_OVERVIEW_20261025. ES5 for installed QtWebKit. */
(function () {
    function trim(s) { return String(s || '').replace(/^\s+|\s+$/g, ''); }
    function text(node) { return trim(node.textContent || node.innerText || '').replace(/\u00a0/g, ' '); }
    function style(node) { return window.getComputedStyle(node, null); }
    function exec(mode, number) {
        return "EXEC: gs 'jo9_traits_view', '" + mode + "'" + (typeof number === 'number' ? ', ' + number : '');
    }
    function init() {
        var root = document.getElementById('jo9_tv_root');
        if (!root || root.getAttribute('data-ready') === '1') { return; }
        var source = document.getElementById('jo9_tv_source');
        var role = root.getAttribute('data-role') === 'assistant' ? 'assistant' : 'slave';
        var column = document.getElementById(role === 'assistant' ? 'left_column_assistant' : 'left_column');
        if (!source || !column) { return; }
        var label = role === 'assistant' ? '조수' : '노예';
        var heading = document.getElementById('jo9_tv_heading');
        var metadata = root.getElementsByTagName('textarea');
        var map = {}, i;
        for (i = 0; i < metadata.length; i += 1) {
            var actionKey = trim(metadata[i].getAttribute('data-action'));
            if (actionKey) { map[actionKey] = parseInt(metadata[i].getAttribute('data-index'), 10); }
        }
        var raw = source.cloneNode(true);
        raw.removeAttribute('id');
        // Remove only the old whole-list size=2 wrapper, preserving every inner color.
        var fonts = raw.getElementsByTagName('font');
        for (i = fonts.length - 1; i >= 0; i -= 1) {
            var font = fonts[i];
            if (font.getAttribute('size') === '2') {
                var parent = font.parentNode;
                while (font.firstChild) { parent.insertBefore(font.firstChild, font); }
                parent.removeChild(font);
            }
        }
        source.parentNode.insertBefore(raw, source.nextSibling);
        raw.style.display = 'none';
        var br = raw.getElementsByTagName('br'), breaks = [];
        for (i = 0; i < br.length; i += 1) { breaks.push(br[i]); }
        var range = document.createRange(), rows = [];
        range.setStart(raw, 0);
        function readRow(end) {
            if (end) { range.setEndBefore(end); } else { range.setEnd(raw, raw.childNodes.length); }
            var box = document.createElement('span');
            box.appendChild(range.cloneContents());
            var name = text(box);
            if (name) { rows.push({ box: box, name: name }); }
            if (end) { range.setStartAfter(end); }
        }
        for (i = 0; i < breaks.length; i += 1) { readRow(breaks[i]); }
        readRow(null);
        var states = [], other = [], titles = [];
        for (i = 0; i < rows.length; i += 1) {
            var row = rows[i];
            raw.appendChild(row.box);
            var anchor = row.box.querySelector('a[href]');
            row.action = anchor ? trim(anchor.getAttribute('href').replace(/^exec:\s*/i, '')) : '';
            row.kind = 'trait';
            row.synthetic = '';
            if (/아레나.*챔피언/.test(row.name)) { row.kind = 'title'; row.synthetic = '__arena__'; }
            else if (/경주.*챔피언/.test(row.name)) { row.kind = 'title'; row.synthetic = '__race__'; }
            else if (/jo9_traits/.test(row.action) && /'versatile'/.test(row.action)) { row.kind = 'title'; }
            else if (/\$(sanity_broken|sanity_low|Нет_клейма|wounds_chart|scars_chart|bruises_chart|starvation_chart)/i.test(row.action)) { row.kind = 'state'; }
            else if (/^회복\s*\[/.test(row.name)) { row.kind = 'state'; row.synthetic = '__rehab__'; }
            else if (/임신/.test(row.name)) { row.kind = 'state'; row.synthetic = '__pregnancy__'; }
            row.index = map[row.action] || map[row.synthetic] || 0;
            // Preserve original text/inline colors, replacing just the action with readonly UI routing.
            var innerAnchors = row.box.getElementsByTagName('a');
            while (innerAnchors.length) {
                var oldAnchor = innerAnchors[0], span = document.createElement('span');
                if (oldAnchor.getAttribute('style')) { span.setAttribute('style', oldAnchor.getAttribute('style')); }
                // Unstyled existing links use the browser's normal link color.
                if (!span.style.color) { span.style.color = style(oldAnchor).color; }
                while (oldAnchor.firstChild) { span.appendChild(oldAnchor.firstChild); }
                oldAnchor.parentNode.replaceChild(span, oldAnchor);
            }
            if (row.kind === 'state') { states.push(row); }
            else { other.push(row); if (row.kind === 'title') { titles.push(row); } }
        }
        var ordered = states.concat(other), ordinary = [];
        for (i = 0; i < ordered.length; i += 1) {
            if (ordered[i].kind !== 'title') { ordinary.push(ordered[i]); }
        }
        function link(row) {
            var a = document.createElement('a');
            a.className = 'jo9_tv_entry'; a.setAttribute('data-index', String(row.index));
            a.setAttribute('data-kind', row.kind);
            a.setAttribute('href', row.index ? exec('info', row.index) : '#');
            a.style.color = '#000';
            a.appendChild(row.box.cloneNode(true));
            if (!row.index) {
                a.onclick = function () {
                    var info = document.getElementById('info');
                    if (info) { info.textContent = text(this); }
                    return false;
                };
            }
            return a;
        }
        source.style.display = 'none';
        var list = document.createElement('div'); list.className = 'jo9_tv_list';
        var leftLinks = [];
        for (i = 0; i < ordered.length; i += 1) { var ll = link(ordered[i]); list.appendChild(ll); leftLinks.push(ll); }
        root.appendChild(list);
        var footer = document.createElement('a');
        footer.id = 'jo9_tv_footer'; footer.href = exec('open'); footer.innerHTML = label + '의 특성 전체보기'; footer.hidden = true;
        root.appendChild(footer);
        var panel = document.createElement('div'); panel.id = 'jo9_tv_panel';
        panel.style.fontFamily = style(column).fontFamily; panel.style.fontSize = style(column).fontSize; panel.style.lineHeight = style(column).lineHeight;
        var columns = document.createElement('div'); columns.className = 'jo9_tv_columns';
        var bodies = [];
        for (i = 0; i < 3; i += 1) {
            var col = document.createElement('div'); col.className = 'jo9_tv_column';
            var caption = document.createElement('div'); caption.className = 'jo9_tv_caption';
            caption.innerHTML = i === 0 ? label + '의 특성' : i === 2 ? label + '의 칭호' : '&nbsp;';
            if (i === 1) { caption.style.textDecoration = 'none'; }
            var body = document.createElement('div'); body.className = 'jo9_tv_column_items';
            col.appendChild(caption); col.appendChild(body); columns.appendChild(col); bodies.push(body);
        }
        var split = Math.ceil(ordinary.length / 2);
        for (i = 0; i < ordinary.length; i += 1) { bodies[i < split ? 0 : 1].appendChild(link(ordinary[i])); }
        for (i = 0; i < titles.length; i += 1) { bodies[2].appendChild(link(titles[i])); }
        panel.appendChild(columns); document.body.appendChild(panel);
        var close = document.createElement('a'); close.id = 'jo9_tv_close'; close.href = exec('close');
        var image = document.createElement('img'); image.src = 'content/pic/buttons/close_button.png'; image.alt = '닫기';
        close.appendChild(image); document.body.appendChild(close);
        var open = root.getAttribute('data-open') === '1';
        panel.hidden = !open; close.hidden = !open;
        if (open) {
            var all = document.getElementsByTagName('*');
            for (i = 0; i < all.length; i += 1) {
                if (/^(center_image|left_padding|right_padding|right_rules_heading|chekbox_)/.test(all[i].id || '')) { all[i].style.visibility = 'hidden'; }
            }
            // Preserve the existing native-message command and its final profile refresh.
            // A one-shot UI key restores only this actor's open view after that refresh.
            var statLinks = column.getElementsByTagName('a');
            for (i = 0; i < statLinks.length; i += 1) {
                var statLink = statLinks[i], cursor = statLink, inside = false;
                while (cursor && cursor !== column) {
                    if (cursor === root) { inside = true; break; }
                    cursor = cursor.parentNode;
                }
                var oldHref = statLink.getAttribute('href') || '';
                if (!inside && /^exec:/i.test(oldHref) && /(\bmsg\b|\$msg)/i.test(oldHref) && /\bgt\s+\$curloc\b/i.test(oldHref)) {
                    statLink.setAttribute('href', "EXEC: gs 'jo9_traits_view', 'remember' & " + oldHref.replace(/^exec:\s*/i, ''));
                }
            }
        }
        function measure() {
            if (document.getElementById('jo9_tv_root') !== root) { return; }
            for (var n = 0; n < leftLinks.length; n += 1) { leftLinks[n].style.display = 'block'; }
            footer.hidden = true;
            var limit = column.getBoundingClientRect().bottom - 10, overflow = false;
            for (var k = 0; k < leftLinks.length; k += 1) {
                if (leftLinks[k].getBoundingClientRect().bottom > limit) { overflow = true; break; }
            }
            if (overflow) {
                footer.hidden = false;
                var stop = footer.getBoundingClientRect().top - 4, clipped = false;
                for (var m = 0; m < leftLinks.length; m += 1) {
                    if (clipped || leftLinks[m].getBoundingClientRect().bottom > stop) { clipped = true; leftLinks[m].style.display = 'none'; }
                }
            }
            root.setAttribute('data-overflow', overflow ? '1' : '0');
        }
        measure();
        window.setTimeout(measure, 100);
        window.setTimeout(measure, 500);
        if (document.fonts && document.fonts.ready && document.fonts.ready.then) { document.fonts.ready.then(measure); }
        if (window.addEventListener) { window.addEventListener('resize', measure, false); }
        root.setAttribute('data-ready', '1');
        root.setAttribute('data-count', String(ordered.length));
        root.setAttribute('data-ordinary-count', String(ordinary.length));
        root.setAttribute('data-title-count', String(titles.length));
        // Exposed readonly references are used by isolated native diagnostics.
        window.JO9TraitView = { root: root, panel: panel, list: list, footer: footer, columns: bodies, measure: measure };
        raw.parentNode.removeChild(raw);
    }
    window.setTimeout(init, 0);
}());
/* JO9 MOD END UI_TRAIT_OVERVIEW_20261025 */
