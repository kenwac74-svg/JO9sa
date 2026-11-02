"""Read QSP in memory; persist only bounded Wong/control/CSS evidence. No game writes."""
from pathlib import Path
import hashlib
import importlib.util
import json
import re
from datetime import datetime, timezone

HERE = Path(__file__).resolve().parent
WORK = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
ORIGINAL = Path('G:/somi/JO9O/game')
spec = importlib.util.spec_from_file_location('qsp_dump_ro', 'G:/somi/JO9sa/tools/qsp_dump.py')
decoder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(decoder)

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def read_qsp(path):
    return {loc['name']: loc['body'].splitlines()
            for loc in decoder.read_locations(path.read_bytes())}

def excerpt(lines, start, stop, redact=False):
    rows = []
    for idx in range(start, min(stop, len(lines)) + 1):
        text = lines[idx - 1]
        if redact and re.search(r'\$text(?:\[\d+\])?\s*\+?=', text):
            text = re.sub(r'(\$text(?:\[\d+\])?\s*\+?=).*', r'\1 [dialogue omitted]', text)
        rows.append({'line': idx, 'code': text})
    return rows

protected = [WORK / 'jack.qsp', ORIGINAL / 'jack.qsp',
             WORK / 'css/base.css', WORK / 'css/mainScreen.css']
before = {str(p): sha(p) for p in protected}
w = read_qsp(WORK / 'jack.qsp')
o = read_qsp(ORIGINAL / 'jack.qsp')

checks = {
    'work_text_cleared_on_entry': w['end_day_screen'][12] == "killvar '$text'",
    'work_wong_has_text_one': '$text[1] =' in w['end_day_screen'][1369],
    'work_wong_has_text_two': '$text[2] =' in w['end_day_screen'][1370],
    'work_wong_no_scalar_text_assignment': not any(
        re.search(r'\$text\s*\+?=', line)
        for line in w['end_day_screen'][1363:1414]),
    'work_loop_reads_scalar': '*p \'<div id = "text"><<$text>></div>\'' in w['end_day_screen'][1576],
    'work_loop_overwrites_text_two': "txt = 1 & $text[2] = '   '" in w['end_day_screen'][1609],
    'original_clears_text': o['end_day_screen'][6] == "killvar '$text'",
    'original_wong_one_based': '$text[1] =' in o['end_day_screen'][1200] and '$text[2] =' in o['end_day_screen'][1201],
    'original_loop_reads_scalar': '<<$text>>' in o['end_day_screen'][1393],
    'original_loop_overwrites_text_two': "txt = 1 & $text[2] = '   '" in o['end_day_screen'][1420],
    'forward_increments_then_reenters': 'txt += 1' in w['$objsel'][40] and 'gt $curloc' in w['$objsel'][57],
    'work_event_marks_processed_before_render': 'end_day_guild_visit = 1' in w['end_day_screen'][1412],
}

css = (WORK / 'css/base.css').read_text(encoding='utf-8-sig')
css_blocks = []
for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', css):
    selector = re.sub(r'/\*.*?\*/', '', m[1], flags=re.S).strip()
    if any(s.strip() in {'#bg', '#text', '#side_panel_main', '#side_panel_text'}
           for s in selector.split(',')):
        # Start of selector, excluding preceding whitespace/comments.
        at = css.find(selector, m.start(), m.end())
        css_blocks.append({'line': css[:at].count('\n') + 1,
                           'selector': selector,
                           'body': re.sub(r'\s+', ' ', m[2]).strip()})

result = {
    'generatedUtc': datetime.now(timezone.utc).isoformat(),
    'mode': 'READ_ONLY_STATIC_AUDIT',
    'scope': 'Wong delayed guild complaint bottom-dialogue rendering only',
    'status': 'STATIC_CAUSE_CONFIRMED_RUNTIME_REPRODUCTION_OWNED_BY_ROOT',
    'assertions': checks,
    'assertionsPass': all(checks.values()),
    'sourceHashes': before,
    'findings': [
        {'id': 'WUI-01', 'confidence': 'confirmed static',
         'summaryKo': '웡 방문 분기는 1번·2번 대사만 채우지만 일일 이벤트 공통 화면은 0번 대사를 출력한다.',
         'workRefs': ['end_day_screen:13', 'end_day_screen:1370-1371', 'end_day_screen:1577'],
         'originalRefs': ['end_day_screen:7', 'end_day_screen:1201-1202', 'end_day_screen:1394']},
        {'id': 'WUI-02', 'confidence': 'confirmed static',
         'summaryKo': '화면 마지막에서 두 번째 실제 대사를 공백으로 덮는다. 화살표는 페이지 숫자를 올린 뒤 현재 로케이션을 재실행하므로, 진입부 배열 삭제와 방문 완료 플래그 때문에 웡 대사 페이지가 이어서 나오지 않는다.',
         'workRefs': ['end_day_screen:1411-1414', 'end_day_screen:1610', '$objsel:35-58'],
         'originalRefs': ['end_day_screen:1237-1240', 'end_day_screen:1421', '$objsel:32-55']},
        {'id': 'WUI-03', 'confidence': 'confirmed static separation; no live DOM inspection',
         'summaryKo': 'NPC 이름·설명과 하단 대사는 각각 별도 div와 별도 변수로 출력되므로, 우측 웡 정보만 정상적으로 보이는 증상과 일치한다. 공백 데이터만으로 하단 누락이 설명되며 CSS 수정 필요성은 확인되지 않았다.',
         'workRefs': ['end_day_screen:1577', 'end_day_screen:1583-1598', '_layout:19-20'],
         'cssRefs': ['css/base.css:628', 'css/base.css:663', 'css/base.css:795', 'css/base.css:812']},
        {'id': 'WUI-04', 'confidence': 'same-pattern adjacent static candidate, outside requested root-cause ownership',
         'summaryKo': '바로 뒤 안젤리카 항의 분기도 같은 1번·2번 대사 패턴이다. 공통 화면 전체를 바꾸기보다 해당 항의 경로 두 곳을 함께 검토하는 것이 국소적이다.',
         'workRefs': ['end_day_screen:1415-1469']},
    ],
    'route': [
        'end_day_screen processes phase 1, runs daily reset, sets phase 2, and reenters (1322-1327).',
        'When end_day_guild_visit=0 and gave_guild_ill_slave>0 or gave_guild_parasite_slave>0, set npc=1/master_vong and text[1]/text[2] (1364-1371).',
        'Apply complaint side effects and clear delivery flags; end_day_guild_visit=1; jump loop (1406-1414).',
        'loop emits scalar text[0], then separate NPC fields; footer sets txt=1 and clobbers text[2] (1577-1610).',
        'Forward sees txt=1 < txt_count (2 or 3), increments then gt $curloc; reentry clears text and the completed complaint is skipped ($objsel:39-58/end_day_screen:13,1364).',
    ],
    'workingPattern': {
        'sameDailyScreenScalarExamples': ['end_day_screen:39-44', 'end_day_screen:47-59', 'end_day_screen:1284-1290'],
        'otherScreensUsePagedText': ['interaction_screen:38', 'interaction_screen_city:73', 'special_screen:60'],
        'comparison': 'Most other daily events fill scalar $text before jumping loop; actual paged screens read $text[txt]. The Wong branch combines these incompatible contracts.'},
    'cssBlocks': css_blocks,
    'implementationReviewNotes': [
        'No patch applied. Keep any fix local to delayed client/guild complaint output; no evidence supports a global CSS or object-handler edit.',
        'Either conform these event texts to the existing scalar daily-event contract, accounting for panel height, or pass them through an existing true pager with an explicit return target after effects run once.',
        'A scalar concatenation must be checked for longest parasite complaint overflow; do not assume one 185px panel can display all pages.',
        'The repeat-parasite game-over branch calls dynamic $death,$text while the reason is in text[3]; review its reason delivery separately if fixing this branch.',
        'Guild blue/purple recurrence and reputation arithmetic are investigated separately by root/logic agent; this report does not claim their root cause.'
    ],
    'evidence': {
        'workEntry': excerpt(w['end_day_screen'],11,21),
        'workWongGuards': excerpt(w['end_day_screen'],1363,1371,True),
        'workWongConclusion': excerpt(w['end_day_screen'],1398,1414,True),
        'workRender': excerpt(w['end_day_screen'],1567,1610),
        'workForward': excerpt(w['$objsel'],35,59),
        'originalEntry': excerpt(o['end_day_screen'],5,15),
        'originalWong': excerpt(o['end_day_screen'],1195,1202,True),
        'originalConclusion': excerpt(o['end_day_screen'],1227,1240,True),
        'originalRender': excerpt(o['end_day_screen'],1389,1421),
        'scalarWorkingPattern': excerpt(w['end_day_screen'],1284,1290,True),
    },
    'limits': ['No game UI/save execution performed by this child.',
               'JO9O is the provided comparison installation, not a separately verified pristine upstream release.',
               'No source dump, duplicated QSP, runtime patch, save change, CSS change, commit or push created.']
}
after = {str(p): sha(p) for p in protected}
result['sourceUnchangedDuringAudit'] = before == after
result['pass'] = result['assertionsPass'] and result['sourceUnchangedDuringAudit']
(HERE / 'ui-findings.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
md = '''# 웡 일일 방문 뒤 하단 대사 공백: 읽기 전용 조사

웡 항의 이벤트는 대사를 `$text[1]`, `$text[2]`에 만들지만, 일일 이벤트 화면은 `$text`(0번)만 출력한다. 진입부에서 배열을 지우므로 0번은 비어 있다. NPC 이름·참고 정보는 별도 변수로 출력되기 때문에 웡 정보만 보이고 하단이 비는 화면이 만들어진다.

그 다음 화면 끝의 `txt = 1 & $text[2] = '   '`가 실제 두 번째 대사도 덮는다. 화살표는 `txt`만 올린 뒤 `gt $curloc`으로 일일 이벤트를 재실행한다. 재진입하면 배열이 다시 지워지고 `end_day_guild_visit = 1` 때문에 웡 항의를 건너뛴다. 따라서 화살표를 눌러도 누락 대사가 회복되지 않는다.

## 현재 코드 근거

- `end_day_screen:13`: 대사 배열 삭제.
- `end_day_screen:1364-1371`: 방문 조건, NPC 지정, 1·2번 대사 준비.
- `end_day_screen:1411-1414`: 원인 플래그 초기화, 방문 완료 표시, 공통 화면 이동.
- `end_day_screen:1577`: 0번 대사 출력.
- `end_day_screen:1583-1598`: NPC 정보의 별도 출력.
- `end_day_screen:1610`: 두 번째 대사 공백 덮기.
- `$objsel:35-58`: 화살표 페이지 증가와 현재 로케이션 재진입.

제공된 JO9O 비교본도 같은 구조다. 대응 위치는 `end_day_screen:7,1201-1202,1237-1240,1394,1421`과 `$objsel:32-55`이다. 현재 추가된 인라인 앞 공백 제거, 이미지 경로 보정, 참고 정보 폰트가 이 0번/1번 불일치를 만든 것은 아니다. 다만 JO9O 자체를 별도 검증한 무수정 원본이라고 단정하지는 않는다.

## CSS·화면 비교

`css/base.css`의 `#text`(663)는 좌측 하단 `left:30px; top:615px; width:740px; height:185px`다. 배경 `#bg`(628)는 상단 `795×595`, NPC 정보는 `#side_panel_main`(795), `#side_panel_text`(812)이다. 보통 일일 이벤트도 이 같은 하단 패널에 스칼라 `$text`를 넣어 표시한다. 이번 건은 빈 데이터만으로 증상이 설명되며 전역 CSS·레이어 변경의 필요성은 확인되지 않았다. 이 조사는 실행 중 DOM을 검사한 결과는 아니다.

## 국소 수정 검토 사항

수정은 적용하지 않았다. 웡 항의와 바로 뒤 동일 패턴의 안젤리카 항의만 일일 이벤트의 스칼라 출력 규칙에 맞추거나, 기존의 실제 페이지 화면으로 전달하는 방향을 검토할 수 있다. 전역 화살표 핸들러를 바꿀 근거는 없다. 모든 대사를 한 장에 붙일 경우 가장 긴 기생충 항의가 185px 패널을 넘지 않는지 먼저 확인해야 한다. 반복 경고의 게임오버 사유 역시 3번에 있는데 `$death`에는 0번을 전달하므로 함께 확인할 후보이다.

조합 파랑/보라 반복과 평판 계산은 루트의 별도 조사 대상이다. 이 보고서는 그 원인이나 수정 완료를 주장하지 않는다. 수치 결과와 대사 화면을 분리해 확인해야 한다.

상세한 최소 제어문 근거·해시·검증은 `ui-findings.json`에 있다. QSP는 메모리로만 읽었으며 WORK·비교본·CSS·세이브를 변경하지 않았다.
'''
(HERE / 'ui-findings.md').write_text(md, encoding='utf-8')
print(json.dumps({'pass': result['pass'], 'assertions': checks, 'report': str(HERE / 'ui-findings.json')}, ensure_ascii=False))
