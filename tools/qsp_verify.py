# 최종 후보 jack.qsp가 mods 변경과 UI 변경을 모두 담았는지 검사하고 컨펌 보고서를 만드는 도구
import argparse, glob, hashlib, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from qsp_dump import read_locations


def load(path):
    raw = open(path, 'rb').read()
    locs = read_locations(raw)
    by = {}
    dup = []
    for l in locs:
        if l['name'] in by:
            dup.append(l['name'])
        by[l['name']] = l
    return hashlib.sha256(raw).hexdigest().upper(), len(raw), by, dup


OPEN = re.compile(r'^\s*(if|act|loop|while|for)\b.*:\s*$', re.I)
END = re.compile(r'^\s*end\s*$', re.I)


def balance(body):
    # 여러 줄 블록의 열림(if/act/loop 등, 줄 끝이 ':')과 닫힘(end) 개수 차이. 주석(!)은 무시한다.
    b = 0
    for line in body.split('\n'):
        s = line.strip()
        if not s or s.startswith('!'):
            continue
        if OPEN.match(s):
            b += 1
        elif END.match(s):
            b -= 1
    return b


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--candidate', required=True)
    ap.add_argument('--base', help='UI 빌드의 mods 적용 전 jack.qsp (있으면 변경 location 비교)')
    ap.add_argument('--mods', default=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'mods'))
    ap.add_argument('--ui-locations', default='', help='UI 세션이 변경했다고 밝힌 location 목록(쉼표 구분 또는 파일 경로)')
    ap.add_argument('--report', help='보고서 JSON 저장 경로')
    a = ap.parse_args()

    fails, warns, info = [], [], {}
    h, size, cand, dup = load(a.candidate)
    info['candidate'] = {'sha256': h, 'bytes': size, 'locations': len(cand)}
    if dup:
        fails.append('중복 location 이름: ' + ', '.join(dup[:10]))

    # 1) mods 반영 확인
    mods = []
    for f in sorted(glob.glob(os.path.join(a.mods, '*.json'))):
        mods.append((os.path.basename(f), json.load(open(f, encoding='utf-8-sig'))))
    mod_locs = set()
    applied = []
    for fname, m in mods:
        ok = True
        for e in m['edits']:
            mod_locs.add(e['location'])
            loc = cand.get(e['location'])
            if loc is None:
                fails.append('[%s] location이 없음: %s' % (m['id'], e['location'])); ok = False; continue
            text = loc[e['field']]
            n_new = text.count(e['new'])
            if n_new < int(e['count']):
                fails.append('[%s] %s.%s: new 문자열 %d번(기대 %s번 이상)' % (m['id'], e['location'], e['field'], n_new, e['count'])); ok = False
            if e['old'] not in e['new'] and text.count(e['old']) > 0:
                fails.append('[%s] %s.%s: old 문자열이 아직 %d번 남아 있음' % (m['id'], e['location'], e['field'], text.count(e['old']))); ok = False
        applied.append({'id': m['id'], 'file': fname, 'ok': ok})
    info['mods'] = applied

    # 2) 기반 파일과 비교: 변경된 location이 mods + UI 신고 목록 안에 있는지, 블록 균형이 그대로인지
    if a.base:
        bh, bsize, base, _ = load(a.base)
        ui = set()
        if a.ui_locations:
            if os.path.isfile(a.ui_locations):
                items = open(a.ui_locations, encoding='utf-8-sig').read().replace(',', '\n').split('\n')
            else:
                items = a.ui_locations.split(',')
            # 줄 끝의 종류 표시(예: "main_screen [ui]")는 떼고 location 이름만 쓴다
            ui = {re.sub(r'\s*\[[^\]]*\]\s*$', '', x).strip() for x in items if x.strip()}
            ui.discard('')
        changed = sorted(n for n in cand if n in base and (cand[n]['body'] != base[n]['body'] or cand[n]['desc'] != base[n]['desc'] or cand[n]['actions'] != base[n]['actions']))
        added = sorted(n for n in cand if n not in base)
        removed = sorted(n for n in base if n not in cand)
        unexpected = [n for n in changed + added if n not in mod_locs and n not in ui]
        info['base'] = {'sha256': bh, 'bytes': bsize, 'locations': len(base)}
        info['changed_locations'] = len(changed); info['added_locations'] = added; info['removed_locations'] = removed
        if removed:
            fails.append('기반에 있던 location이 사라짐: ' + ', '.join(removed[:10]))
        if unexpected:
            fails.append('mods나 UI 신고 목록에 없는 변경 location %d개: %s' % (len(unexpected), ', '.join(unexpected[:15])))
        if not a.ui_locations:
            warns.append('--ui-locations가 없어 UI 변경 목록과는 대조하지 않았다(mods 밖 변경은 모두 "예상 밖"으로 표시됨).')
        for n in changed:
            if balance(cand[n]['body']) != balance(base[n]['body']):
                fails.append('블록(if/end) 균형이 기반과 달라짐: ' + n)
        for n in added:
            if balance(cand[n]['body']) != 0:
                warns.append('새 location의 블록 균형이 0이 아님: ' + n)
    else:
        warns.append('--base가 없어 변경 location 대조와 블록 균형 검사를 하지 않았다.')

    info['fails'] = fails; info['warnings'] = warns
    info['verdict'] = 'PASS' if not fails else 'FAIL'
    out = json.dumps(info, ensure_ascii=False, indent=2)
    if a.report:
        open(a.report, 'w', encoding='utf-8').write(out)
    print(out)
    sys.exit(0 if not fails else 1)


if __name__ == '__main__':
    main()
