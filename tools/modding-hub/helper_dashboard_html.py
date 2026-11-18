"""Adapt the original Helper web page for the existing JO9 workspace frame.

This adapter changes presentation, URL namespaces, and request scheduling only.
Save calculations, guide content, simulator behavior, and preference keys stay
upstream.
"""
import re

API_PREFIX = '/workspace/helper/api/'
STYLE_ID = 'jo9-helper-workspace-style'
CREDIT_ID = 'jo9-helper-workspace-credit'
STATE_RESPONSE_GUARD = '''
    /* JO9_HELPER_STATE_RESPONSE_GUARD */
    if (!res.ok || data.error) throw new Error(data.error || 'Helper 상태를 읽지 못했습니다.');'''
STATE_SINGLE_FLIGHT_WRAPPER = '''// JO9_HELPER_STATE_SINGLE_FLIGHT_START
let helperWorkspaceStatePending = null;
function fetchState() {
  if (helperWorkspaceStatePending) return helperWorkspaceStatePending;
  helperWorkspaceStatePending = (async () => {
    let requestedSav;
    do {
      requestedSav = STATE.selectedSav;
      await helperWorkspaceFetchStateSource();
    } while (STATE.selectedSav !== requestedSav);
  })().finally(() => { helperWorkspaceStatePending = null; });
  return helperWorkspaceStatePending;
}
// JO9_HELPER_STATE_SINGLE_FLIGHT_END
'''


def adapt_html(raw: bytes) -> bytes:
    text = raw.decode('utf-8-sig')
    if not re.search(r'</head\s*>', text, re.I) or not re.search(r'<body\b', text, re.I):
        raise ValueError('Helper 웹 화면의 head/body 구조를 읽지 못했습니다.')

    # Existing absolute API paths must stay inside the Helper route namespace.
    # The fixed negative lookbehind also makes repeated adaptation harmless.
    text = re.sub(r'(?<!/workspace/helper)/api/', API_PREFIX, text)

    # First parse can take longer than the original 1.5-second polling period.
    # Coalesce overlapping calls, then honor a newly selected save immediately.
    if 'JO9_HELPER_STATE_SINGLE_FLIGHT_START' not in text:
        state_function = re.compile(r'\basync\s+function\s+fetchState\s*\(\s*\)\s*\{')
        if len(state_function.findall(text)) != 1:
            raise ValueError('Helper 웹 화면의 fetchState 함수를 확인하세요.')
        text = state_function.sub(lambda _match: STATE_SINGLE_FLIGHT_WRAPPER
                                  + 'async function helperWorkspaceFetchStateSource() {', text, count=1)

    # Route API/connection errors through the original catch path instead of
    # passing an error-shaped object to normal Day/stat rendering.
    if 'JO9_HELPER_STATE_RESPONSE_GUARD' not in text:
        response_anchor = 'const data = await res.json();'
        if text.count(response_anchor) != 1:
            raise ValueError('Helper 웹 화면의 상태 응답 처리를 확인하세요.')
        text = text.replace(response_anchor, response_anchor + STATE_RESPONSE_GUARD, 1)

    if f'id="{STYLE_ID}"' not in text:
        link = f'<link id="{STYLE_ID}" rel="stylesheet" href="/workspace/helper/dashboard.css">\n'
        text = re.sub(r'</head\s*>', lambda match: link + match.group(0), text, count=1, flags=re.I)

    def body_attributes(match):
        attrs = match.group(1)
        if not re.search(r'\bdata-jo9-workspace\s*=', attrs, re.I):
            attrs += ' data-jo9-workspace="helper"'
        return '<body' + attrs + '>'

    text = re.sub(r'<body\b([^>]*)>', body_attributes, text, count=1, flags=re.I)

    # Keep the status node used by fetchState, replacing only the repeated title.
    def brand_status(match):
        status = re.search(r'<span\b[^>]*\bid=["\']syncDot["\'][^>]*>\s*</span\s*>', match.group(0), re.I)
        if not status:
            return match.group(0)
        return ('<div class="helper-sync" title="세이브 연동 상태">' + status.group(0)
                + '<span class="helper-sync-label">세이브 연동</span></div>')

    text = re.sub(r'<div\b[^>]*\bclass=["\']brand["\'][^>]*>.*?</div\s*>',
                  brand_status, text, count=1, flags=re.I | re.S)

    # Desktop lifecycle controls do not belong in a web-only embedded view.
    # Their original functions stay untouched, and the standalone EXE is unchanged.
    for control in ('topmostBtn', 'shutdownBtn'):
        text = re.sub(r'<button\b(?=[^>]*\bid=["\']' + control + r'["\'])[^>]*>.*?</button\s*>\s*',
                      '', text, flags=re.I | re.S)

    if f'id="{CREDIT_ID}"' not in text:
        credit = f'<footer id="{CREDIT_ID}" class="helper-credit">공략·세이브 도우미 by 리림</footer>\n'
        text = re.sub(r'</body\s*>', lambda match: credit + match.group(0), text, count=1, flags=re.I)
    return text.encode('utf-8')
