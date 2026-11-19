# 설치 후 상태(0.1 등 배포본 + 순정)의 모든 이미지 참조를 순정 기준·UI 작업 출처 기준으로 분류하는 스크립트
"""Usage:
  python tools/classify_release_refs.py --pkg <배포본 폴더> --vanilla-qsp <순정 jack.qsp>
      --vanilla-manifest reference/vanilla_manifest.json --game-text <순정 game 폴더(json/css)>
      --ui-source <폴더|ZIP> [--ui-source ...] [--legacy audits/legacy_resource_refs.json] --out <결과.json>

분류 기준 (사용자 확정 2026-09-28):
- 순정과 같은 경로·같은 해시 → 원본 참조 유지 (패키지 불필요)
- UI 작업으로 교체·추가 (순정과 해시가 다르거나 순정에 없음) → content/pic/SNKmod 대상
- 한글 파일명 → 영문명으로 SNKmod 대상 (내용이 같아도)
- 이미지팩 교체분 → UI 패치 관할 아님 (순정 기준으로만 판단하므로 자동으로 제외됨)
"""
import argparse, hashlib, json, os, re, sys, zipfile
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from qsp_dump import read_locations  # noqa: E402

IMG = r'(?:png|jpg|jpeg|gif)'
FULL = re.compile(r"(SNKmod[\\/])?content[\\/]pic[\\/]([^\"'\r\n()]*?\." + IMG + r")(?![A-Za-z0-9])", re.I)
QUOTED_REL = re.compile(r"'([^'\r\n<>]*?\." + IMG + r")'|\"([^\"\r\n<>]*?\." + IMG + r")\"", re.I)
UI_DIRS = ('snkmod/', 'ui/', 'ui overhaul/', 'buttons/')
HANGUL = re.compile('[가-힣]')


def sha(b):
    return hashlib.sha256(b).hexdigest()


def norm(p):
    p = p.replace('\\', '/')
    while '//' in p:
        p = p.replace('//', '/')
    return p.lower()


def ui_sources(paths):
    """UI 작업 출처 파일: content/pic 기준 상대경로(소문자) -> {hash: 출처}"""
    out = defaultdict(dict)
    for src in paths:
        sp = Path(src)
        if sp.suffix.lower() == '.zip':
            with zipfile.ZipFile(sp) as z:
                for i in z.infolist():
                    n = i.filename if i.flag_bits & 0x800 else i.filename.encode('cp437').decode('cp949', 'replace')
                    if 'content/pic/' in n and not i.is_dir():
                        rel = norm(n.split('content/pic/', 1)[1])
                        out[rel][sha(z.read(i))] = f'{sp.name}:{n}'
        else:
            for f in sp.rglob('*'):
                s = f.as_posix()
                if f.is_file() and '/content/pic/' in s:
                    rel = norm(s.split('/content/pic/', 1)[1])
                    out[rel][sha(f.read_bytes())] = s
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pkg', required=True)
    ap.add_argument('--vanilla-qsp', required=True)
    ap.add_argument('--vanilla-manifest', required=True)
    ap.add_argument('--game-text', required=True)
    ap.add_argument('--ui-source', action='append', default=[])
    ap.add_argument('--legacy')
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    pkg = Path(a.pkg)
    man = json.load(open(pkg / 'manifest.json', encoding='utf-8-sig'))
    ui_map = json.load(open(pkg / 'ui_map.json', encoding='utf-8-sig'))
    patches = json.load(open(pkg / 'qsp-patches.json', encoding='utf-8-sig'))
    V = {x['Rel'].lower(): x for x in json.load(open(a.vanilla_manifest, encoding='utf-8-sig'))['Files']}
    vpic = {k[len('content/pic/'):]: v for k, v in V.items() if k.startswith('content/pic/')}

    # 설치 후 텍스트: 패치 본문(없으면 순정 본문) + 순정 설명·액션, 덮어쓰는 CSS·JSON, 그 밖의 순정 CSS·JSON
    texts = {}
    locs = read_locations(Path(a.vanilla_qsp).read_bytes())
    body = {p['Name']: p['Text'] for p in patches}
    for l in locs:
        texts['qsp:' + l['name']] = body.get(l['name'], l['body']) + '\n' + l['desc'] + '\n' + '\n'.join('\n'.join(x) for x in l['actions'])
    for n, t in body.items():
        texts.setdefault('qsp:' + n, t)
    overwritten = {o['Rel']: pkg / o['Source'] for o in man['Overwrite']}
    gt = Path(a.game_text)
    for f in sorted(list(gt.glob('css/*.css')) + list(gt.glob('json/*.json')) + list(gt.glob('json/slaves/*.json'))):
        rel = f.relative_to(gt).as_posix()
        src = overwritten.get(rel, f)
        texts[rel] = Path(src).read_text(encoding='utf-8-sig', errors='replace')

    pkg_imgs = {norm(i['Rel'])[len('content/pic/'):]: i for i in man['Images']}  # snkmod/...
    origins = {}
    for u in ui_map:
        for o in u.get('Originals', []):
            origins[norm(o)[len('content/pic/'):]] = norm(u['SNKmod'])[len('content/pic/'):]
    uis = ui_sources(a.ui_source)

    refs = defaultdict(Counter)
    dynamic = defaultdict(Counter)
    rel_literals = defaultdict(Counter)
    for name, t in texts.items():
        for m in FULL.finditer(t):
            p = (('snkmod/' if m.group(1) else '') + norm(m.group(2)))
            (dynamic if '<<' in p or '+' in p else refs)[p][name] += 1
        for m in re.finditer(r"content[\\/]pic[\\/][^\"'\r\n]*?<<", t, re.I):
            seg = t[m.start():m.start() + 160].split('"')[0].split("'")[0]
            dynamic[norm(seg)][name] += 1
        if name.startswith('qsp:'):
            for m in QUOTED_REL.finditer(t):
                p = norm(m.group(1) or m.group(2))
                if not p.startswith(('content/', 'snkmod/', 'http')) and '/' in p:
                    rel_literals[p][name] += 1

    rows = []
    for p, where in sorted(refs.items()):
        r = {'ref': p, 'where': dict(where)}
        if p.startswith('snkmod/'):
            img = pkg_imgs.get(p)
            if not img:
                r['class'] = 'ERR_SNKMOD_MISSING'
            else:
                origs = [o for o, d in origins.items() if d == p]
                same = [o for o in origs if o in vpic and vpic[o]['Sha256'] == img['Hash']]
                renamed = [o for o in origs if o.rsplit('/', 1)[-1] != p.rsplit('/', 1)[-1]]
                if not origs:
                    r['class'] = 'SNKMOD_NEW'
                elif same and not renamed:
                    r['class'] = 'SNKMOD_VANILLA_IDENTICAL'
                elif renamed and same:
                    r['class'] = 'SNKMOD_RENAMED_SAME_CONTENT'
                elif renamed:
                    r['class'] = 'SNKMOD_RENAMED_CHANGED'
                else:
                    r['class'] = 'SNKMOD_CHANGED'
                r['originals'] = origs
        else:
            v = vpic.get(p)
            ui = uis.get(p, {})
            changed_ui = {h: s for h, s in ui.items() if not v or h != v['Sha256']}
            if HANGUL.search(p):
                r['class'] = 'ERR_HANGUL_ORIGINAL_REF'
            elif not v:
                r['class'] = 'ERR_NOT_IN_VANILLA' + ('_BUT_PACKAGED:' + origins[p] if p in origins else '')
            elif p in origins:
                r['class'] = 'ERR_REDIRECT_MISSED'  # 패키지에 변경본이 있는데 원본을 가리킴
            elif changed_ui:
                r['class'] = 'ERR_UI_SOURCE_CHANGED_NOT_PACKAGED'
                r['ui_sources'] = list(changed_ui.values())
            else:
                r['class'] = 'VANILLA_OK' if p.startswith(UI_DIRS) or '/' not in p else 'VANILLA_OK_GENERAL'
        rows.append(r)

    dyn_rows = []
    for p, where in sorted(dynamic.items()):
        d = p.split('<<')[0].replace('snkmod/', '', 1)
        d = d[len('content/pic/'):] if d.startswith('content/pic/') else d
        touched = sorted({k for k in list(pkg_imgs) + list(origins) if k.replace('snkmod/', '', 1).startswith(d)})
        dyn_rows.append({'pattern': p, 'dir': d, 'where': dict(where), 'package_or_ui_files_in_dir': len(touched)})

    rel_rows = []
    for p, where in sorted(rel_literals.items()):
        v = vpic.get(p)
        cls = 'VANILLA_OK' if v else ('PACKAGED:' + origins[p] if p in origins else 'NOT_IN_VANILLA')
        if p in origins:
            cls = 'ERR_REDIRECT_MISSED(rel)' if v else cls
        rel_rows.append({'literal': p, 'class': cls, 'where': dict(where)})

    used_snk = {r['ref'] for r in rows if r['ref'].startswith('snkmod/')}
    unreferenced = sorted(k for k in pkg_imgs if k not in used_snk)
    pkg_vs_vanilla = []
    for k, img in sorted(pkg_imgs.items()):
        origs = [o for o, d in origins.items() if d == k]
        same = [o for o in origs if o in vpic and vpic[o]['Sha256'] == img['Hash']]
        ren = [o for o in origs if o.rsplit('/', 1)[-1] != k.rsplit('/', 1)[-1]]
        pkg_vs_vanilla.append({'snkmod': k, 'originals': origs, 'vanilla_identical': bool(same), 'renamed': bool(ren), 'referenced': k in used_snk})

    legacy = []
    if a.legacy:
        for e in json.load(open(a.legacy, encoding='utf-8-sig')):
            if not e.get('different'):
                continue
            p = norm(e['path'])
            ui = uis.get(p, {})
            v = vpic.get(p)
            legacy.append({'path': p, 'in_vanilla': bool(v), 'packaged_as': origins.get(p), 'ui_source_hashes': len(ui),
                           'ui_source_differs_from_vanilla': any(v and h != v['Sha256'] for h in ui), 'refs': e.get('refs')})

    out = {'counts': Counter(r['class'] for r in rows), 'refs': rows, 'dynamic': dyn_rows, 'relative_literals': rel_rows,
           'package_images': pkg_vs_vanilla, 'package_unreferenced': unreferenced, 'legacy_147': legacy}
    json.dump(out, open(a.out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(json.dumps(out['counts'], ensure_ascii=False))
    print('dynamic patterns', len(dyn_rows), 'relative literals', len(rel_rows), 'package images', len(pkg_imgs), 'unreferenced', len(unreferenced), 'legacy', len(legacy))


if __name__ == '__main__':
    main()
