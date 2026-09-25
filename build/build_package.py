# FIX6 원본과 jack.qsp로 SNKmod 분리형 UI 패키지(payload·패치·치환 규칙·ui_map)를 만드는 빌드 스크립트
"""Usage: python build/build_package.py --qsp <jack.qsp> [--fix6 baseline/...FIX6.zip] [--out dist]

jack.qsp는 FIX6 설치 상태(manifest FinalQsp)여야 한다. 표준 라이브러리만 쓴다.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import shutil
import sys
import zipfile
from collections import Counter, OrderedDict
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / 'tools'))
from qsp_dump import read_locations  # noqa: E402

PACKAGE = 'JO9_UI_SNKMOD'
VERSION = 'R2'
NAME = f'JO9_UI_v1_9_14_SNKmod_{VERSION}'
FIX6_SHA = '254dc8c5cce2c9f5442f34b6de0cdbb029893eb544c76635d76b8b2e2fc0bc82'
FIX6_FINAL_QSP = '953533402226c874f1d22a9023da4d235bd512b61c2fc30f028465226f49b6d9'
MODDER_DIRS = {'grimdark', 'approved_main_v1', 'jo9_v197', 'jon-uiadds'}
FIVE = ['sjm_UI_UIadds', 'main_screen', 'slave_stat', 'city_screen', '#food_base']

# 참조 형태: content\pic\경로 / content\pic\<<iif(…)>> / $special_image[N] = '경로'
DIRECT = re.compile(r"(?<!SNKmod\\)(?<!SNKmod/)content([\\/])pic[\\/]([^\"'<>()]+?\.(?:png|jpg|gif))", re.I)
IIF = re.compile(r"(?<!SNKmod\\)(?<!SNKmod/)content[\\/]pic[\\/]<<iif\((.*?)\)>>", re.I)
INNER = re.compile(r"''([^']+?\.(?:png|jpg|gif))''", re.I)
SPECIAL = re.compile(r"\$special_image\[(\d+)\]\s*=\s*'([^']+?\.png)'", re.I)
SNK_REF = re.compile(r"SNKmod[\\/]content[\\/]pic[\\/]([^\"'<>()]+?\.(?:png|jpg|gif))", re.I)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def norm(p: str) -> str:
    return p.replace('\\', '/').lower()


def snk_rel(rel: str) -> str:
    """content/pic 아래 상대경로 → SNKmod/content/pic 아래 상대경로 (결정 2·3)."""
    parts = rel.split('/')
    if len(parts) >= 3 and parts[0].lower() == 'ui' and parts[1].lower() in MODDER_DIRS:
        rest = parts[2:]
        return '/'.join(rest) if len(rest) > 1 else '/'.join(['ui'] + rest)
    return rel


def read_fix6(path: Path) -> dict[str, bytes]:
    data = path.read_bytes()
    if sha(data) != FIX6_SHA:
        raise SystemExit('FIX6 archive hash mismatch')
    out = {}
    with zipfile.ZipFile(path) as z:
        for info in z.infolist():
            if info.is_dir():
                continue
            name = info.filename if info.flag_bits & 0x800 else info.filename.encode('cp437').decode('cp949')
            out[name] = z.read(info)
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--qsp', required=True, type=Path)
    ap.add_argument('--fix6', type=Path, default=REPO / 'baseline/JO9_UI_v1_9_14_AllInOne_R2_FIX6.zip')
    ap.add_argument('--out', type=Path, default=REPO / 'dist')
    ap.add_argument('--originals', type=Path, default=REPO / 'resources/originals/content/pic')
    args = ap.parse_args()

    src = read_fix6(args.fix6)
    fmanifest = json.loads(src['manifest.json'].decode('utf-8-sig'))
    fpatches = json.loads(src['qsp-patches.json'].decode('utf-8-sig'))
    qsp_bytes = args.qsp.read_bytes()
    if sha(qsp_bytes) != FIX6_FINAL_QSP:
        raise SystemExit('jack.qsp is not the FIX6-installed state (manifest FinalQsp)')
    locs = read_locations(qsp_bytes)

    # 1) FIX6 이미지 → SNKmod 위치. 같은 목적지로 모이는 파일은 바이트가 같아야 한다.
    rules = json.loads((REPO / 'build/resource_rules.json').read_text(encoding='utf-8'))
    images = OrderedDict()   # snk rel -> {data, originals, source}
    target = {}              # 원본 상대경로(소문자) -> snk rel

    def add_image(rel: str, data: bytes, source: str) -> None:
        dest = rules['rename'].get(rel, snk_rel(rel))
        if dest in images:
            if images[dest]['data'] != data:
                raise SystemExit(f'Different files map to one SNKmod path: {dest}')
            images[dest]['originals'].append(rel)
        else:
            images[dest] = {'data': data, 'originals': [rel], 'source': source}
        target[rel.lower()] = dest

    for e in fmanifest['Files']:
        if not e['Rel'].startswith('content/pic/'):
            continue
        rel = e['Rel'][len('content/pic/'):]
        data = src[e['Source']]
        if sha(data) != e['After']:
            raise SystemExit('FIX6 payload mismatch: ' + rel)
        add_image(rel, data, 'FIX6')

    # 1-2) FIX6에 없지만 포함할 원본 (한글 이름 영문화 등, 결정 9·10)
    # 사용자가 준 새 디자인(resources/new)이 있으면 원본보다 우선한다.
    newdir = REPO / 'resources/new/content/pic'
    missing = [r for r in rules['extra'] if not (newdir / r).is_file() and not (args.originals / r).is_file()]
    if missing:
        raise SystemExit('Missing original files under ' + str(args.originals) + ':\n' + '\n'.join(missing))
    for rel in rules['extra']:
        if (newdir / rel).is_file():
            add_image(rel, (newdir / rel).read_bytes(), 'new')
        else:
            add_image(rel, (args.originals / rel).read_bytes(), 'original')
    bad = [d for d in images if any(ord(c) > 127 for c in d)]
    if bad:
        raise SystemExit('Non-ASCII SNKmod file names need a rename rule: ' + ', '.join(bad))

    def resolve(p: str) -> str | None:
        """게임 참조 경로 → SNKmod 목적지. FIX6 파일이거나, grimdark 하위 폴더가 가리키는 원래 파일이 FIX6일 때만."""
        key = norm(p)
        if key in target:
            return target[key]
        parts = key.split('/')
        if len(parts) >= 4 and parts[0] == 'ui' and parts[1] in MODDER_DIRS:
            return target.get('/'.join(parts[2:]))
        return None

    # 2) location별 치환 규칙 (literal find → replace)
    def rules_for(text: str) -> list[tuple[str, str]]:
        found: list[tuple[str, str]] = []
        for m in IIF.finditer(text):
            dests = {resolve(p) for p in INNER.findall(m.group(1))}
            if dests == {None}:
                continue
            if None in dests or len(dests) != 1:
                raise SystemExit('Mixed iif branch targets: ' + m.group(0))
            found.append((m.group(0), 'SNKmod\\content\\pic\\' + dests.pop().replace('/', '\\')))
        for m in DIRECT.finditer(text):
            dest = resolve(m.group(2))
            if dest:
                sep = m.group(1)
                found.append((m.group(0), sep.join(['SNKmod', 'content', 'pic']) + sep + dest.replace('/', sep)))
        for m in SPECIAL.finditer(text):
            dest = resolve(m.group(2))
            if dest:
                found.append((m.group(0), f"$special_image_full[{m.group(1)}] = 'SNKmod\\content\\pic\\{dest.replace('/', chr(92))}'"))
        return found

    def apply(text: str, rules) -> str:
        for find, rep in rules:
            text = re.sub(r'(?<!SNKmod\\)(?<!SNKmod/)' + re.escape(find), lambda _m: rep, text)
        return text

    path_rules = []
    new_bodies = {}
    for loc in locs:
        rules = rules_for(loc['body'])
        if loc['name'] in FIVE:
            new_bodies[loc['name']] = apply(loc['body'], list(OrderedDict.fromkeys(rules)))
            continue
        for (find, rep), n in Counter(rules).items():
            path_rules.append({'Location': loc['name'], 'Find': find, 'Replace': rep, 'Expected': n})
        if loc['desc'] and rules_for(loc['desc']) or any(rules_for(''.join(a)) for a in loc['actions']):
            raise SystemExit('Image reference outside location body: ' + loc['name'])

    # 3) 5개 location 본문 (FIX6 Text에 같은 규칙 적용)
    fp = {p['Name']: p for p in fpatches}
    patches = []
    for name in FIVE:
        text = fp[name]['Text']
        if sha(text.encode('utf-8')) != fp[name]['After'] or text != next(l['body'] for l in locs if l['name'] == name):
            raise SystemExit('FIX6 body mismatch: ' + name)
        new = new_bodies[name]
        patches.append({'Name': name, 'Before': fp[name]['Before'] + [fp[name]['After']],
                        'After': sha(new.encode('utf-8')), 'Text': new})

    # 4) CSS
    css = src['payload/css/base.css'].decode('utf-8')
    css_new = apply(css, list(OrderedDict.fromkeys(rules_for(css))))

    # 5) 정적 검증: 치환 후 SNKmod 참조는 모두 payload에 있고, FIX6 파일의 옛 경로 참조는 남지 않는다.
    final_texts = {l['name']: l['body'] for l in locs}
    by_loc: dict[str, list] = {}
    for r in path_rules:
        by_loc.setdefault(r['Location'], []).append((r['Find'], r['Replace']))
    for name, rules in by_loc.items():
        final_texts[name] = apply(final_texts[name], rules)
    for p in patches:
        final_texts[p['Name']] = p['Text']
    final_texts['[css/base.css]'] = css_new
    lower_images = {k.lower() for k in images}
    used = Counter()
    problems = []
    for name, text in final_texts.items():
        for m in SNK_REF.finditer(text):
            key = norm(m.group(1))
            if key not in lower_images:
                problems.append(f'{name}: missing SNKmod file {m.group(1)}')
            used[key] += 1
        if rules_for(text):
            problems.append(f'{name}: unconverted FIX6 reference remains')
    if problems:
        raise SystemExit('Static verification failed:\n' + '\n'.join(problems))

    # 6) 출력
    out = args.out / NAME
    if out.exists():
        shutil.rmtree(out)
    pay = out / 'payload'
    img_entries = []
    for dest, info in images.items():
        f = pay / 'SNKmod/content/pic' / dest
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_bytes(info['data'])
        img_entries.append({'Rel': 'SNKmod/content/pic/' + dest, 'Source': 'payload/SNKmod/content/pic/' + dest,
                            'Hash': sha(info['data'])})
    (pay / 'css').mkdir(parents=True)
    (pay / 'css/base.css').write_bytes(css_new.encode('utf-8'))
    (pay / 'engine').mkdir(parents=True)
    (pay / 'engine/jack.exe').write_bytes(src['payload/engine/jack.exe'])

    def dump(name, obj):
        (out / name).write_text(json.dumps(obj, ensure_ascii=False, indent=1), encoding='utf-8')

    dump('qsp-patches.json', patches)
    dump('path-rules.json', path_rules)

    ref_locs: dict[str, Counter] = {}
    for name, text in final_texts.items():
        for m in SNK_REF.finditer(text):
            ref_locs.setdefault(norm(m.group(1)), Counter())[name] += 1
    ui_map = []
    for dest, info in images.items():
        hits = ref_locs.get(dest.lower(), {})
        ui_map.append({'SNKmod': 'SNKmod/content/pic/' + dest,
                       'Originals': ['content/pic/' + r for r in info['originals']],
                       'Hash': sha(info['data']), 'Bytes': len(info['data']), 'Source': info['source'],
                       'Status': 'used' if hits else 'spare',
                       'References': dict(hits)})
    dump('ui_map.json', ui_map)

    fix6_files = [{'Rel': e['Rel'], 'After': e['After']} for e in fmanifest['Files']]
    manifest = OrderedDict(
        Package=PACKAGE, Version=VERSION, GameVersion=fmanifest['GameVersion'],
        Images=img_entries,
        Css={'Rel': 'css/base.css', 'Source': 'payload/css/base.css', 'Hash': sha(css_new.encode('utf-8')),
             'Before': fmanifest['CssBefore'] + [sha(css.encode('utf-8'))]},
        Engine={'Rel': 'engine/jack.exe', 'Source': 'payload/engine/jack.exe', 'Before': fmanifest['EngineBefore'],
                'After': fmanifest['EngineAfter'], 'QtWidgetsHash': fmanifest['QtWidgetsHash']},
        General=[],
        Fix6={'Package': fmanifest['Package'], 'BackupDir': '_JO9_UI_ALL1914_BACKUPS', 'Files': fix6_files,
              'FinalQsp': fmanifest['FinalQsp']},
    )
    payload = []
    for p in sorted(out.rglob('*')):
        if p.is_file() and p.name != 'manifest.json':
            payload.append({'Rel': p.relative_to(out).as_posix(), 'Hash': sha(p.read_bytes())})
    manifest['Payload'] = payload
    dump('manifest.json', manifest)

    for f in ['Install.ps1', 'APPLY.cmd', 'CHECK.cmd', 'RESTORE.cmd', 'README_KR.txt']:
        if (REPO / 'installer' / f).exists():
            shutil.copy2(REPO / 'installer' / f, out / f)
    (out / 'PanelCodec.cs').write_bytes(src['PanelCodec.cs'])
    # 설치기·안내문도 무결성 목록에 넣는다.
    for f in ['Install.ps1', 'APPLY.cmd', 'CHECK.cmd', 'RESTORE.cmd', 'README_KR.txt', 'PanelCodec.cs']:
        if (out / f).exists():
            payload.append({'Rel': f, 'Hash': sha((out / f).read_bytes())})
    manifest['Payload'] = payload
    dump('manifest.json', manifest)

    print(json.dumps({'package': NAME, 'images': len(images), 'used': sum(1 for u in ui_map if u['Status'] == 'used'),
                      'spare': sum(1 for u in ui_map if u['Status'] == 'spare'),
                      'rule_locations': len(by_loc), 'rules': len(path_rules),
                      'rule_replacements': sum(r['Expected'] for r in path_rules),
                      'body_patches': len(patches)}, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    sys.exit(main())
