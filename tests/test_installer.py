# 가짜 게임 폴더에서 Install.ps1의 적용·재적용·복구·FIX6 전환·충돌 처리를 PowerShell로 시험하는 스크립트
"""Usage: python tests/test_installer.py --qsp <FIX6 상태 jack.qsp> --pwsh <pwsh 경로> [--pkg dist/...]

Windows 대화창은 쓰지 않고 -NonInteractive로 실행한다. 인게임 표시 시험이 아니다.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / 'tools'))
from qsp_dump import read_locations  # noqa: E402

FIX6_ZIP = REPO / 'baseline/JO9_UI_v1_9_14_AllInOne_R2_FIX6.zip'
SNK_REF = re.compile(r"content[\\/]pic[\\/]SNKmod[\\/]([^\"'<>()]+?\.(?:png|jpg|gif))", re.I)
results: list[tuple[str, bool, str]] = []


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def tree_hashes(root: Path) -> dict[str, str]:
    return {p.relative_to(root).as_posix(): sha(p) for p in sorted(root.rglob('*')) if p.is_file()}


def check(name: str, ok: bool, detail: str = '') -> None:
    results.append((name, ok, detail))
    print(('PASS ' if ok else 'FAIL ') + name + (f' — {detail}' if detail else ''))


def fix6_files() -> dict[str, bytes]:
    out = {}
    with zipfile.ZipFile(FIX6_ZIP, metadata_encoding='cp949') as z:
        for i in z.infolist():
            if not i.is_dir():
                n = i.filename
                out[n] = z.read(i)
    return out


def make_game(root: Path, qsp: Path, fix6: dict[str, bytes], with_fix6_backup: bool) -> None:
    """FIX6가 설치된 게임을 흉내 낸다: FIX6 jack.qsp·base.css, 원본 경로의 FIX6 이미지, 순정 흉내 엔진."""
    root.mkdir(parents=True)
    shutil.copy2(qsp, root / 'jack.qsp')
    (root / 'css').mkdir()
    (root / 'css/base.css').write_bytes(fix6['payload/css/base.css'])
    (root / 'json').mkdir()
    shutil.copy2(REPO / 'resources/originals/json/menu_icon.json', root / 'json/menu_icon.json')
    (root / 'engine').mkdir()
    (root / 'engine/jack.exe').write_bytes(b'custom engine for test')
    m = json.loads(fix6['manifest.json'].decode('utf-8-sig'))
    record = []
    for e in m['Files']:
        if not e['Rel'].startswith('content/pic/'):
            continue
        t = root / e['Rel']
        t.parent.mkdir(parents=True, exist_ok=True)
        t.write_bytes(fix6[e['Source']])
        if with_fix6_backup:
            orig = b'vanilla:' + e['Rel'].encode()
            b = root / '_JO9_UI_ALL1914_BACKUPS/20260101_000000_test/original' / e['Rel']
            b.parent.mkdir(parents=True, exist_ok=True)
            b.write_bytes(orig)
            record.append({'Rel': e['Rel'], 'Existed': True, 'Before': hashlib.sha256(orig).hexdigest(), 'After': e['After']})
    if with_fix6_backup:
        state = {'Package': 'JO9_UI_ALL1914', 'Status': 'applied', 'Files': record}
        (root / '_JO9_UI_ALL1914_BACKUPS/20260101_000000_test/state.json').write_text(json.dumps(state), encoding='utf-8-sig')


def run(pwsh: str, pkg: Path, game: Path, mode: str, answer: str | None = None) -> subprocess.CompletedProcess:
    env = os.environ.copy()
    if os.name == 'nt' and Path(pwsh).name.lower() == 'powershell.exe':
        # A parent PS7/Codex shell may export only its own module paths.
        system_modules = str(Path(env.get('SystemRoot', 'C:/Windows')) / 'System32/WindowsPowerShell/v1.0/Modules')
        env['PSModulePath'] = system_modules + os.pathsep + env.get('PSModulePath', '')
    # Same process-scoped invocation as the shipped APPLY/CHECK/RESTORE.cmd.
    return subprocess.run([pwsh, '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', str(pkg / 'Install.ps1'), '-Mode', mode,
                           '-GamePath', str(game), '-NonInteractive'] + (['-ConfirmChangedFiles'] if answer is not None else []), input=answer, capture_output=True, text=True, encoding='utf-8', errors='replace', env=env)


def verify_installed(game: Path, pkg: Path, label: str) -> None:
    locs = read_locations((game / 'jack.qsp').read_bytes())
    ui_map = json.loads((pkg / 'ui_map.json').read_text(encoding='utf-8'))
    originals = {o[len('content/pic/'):].lower() for u in ui_map for o in u['Originals']}
    texts = {l['name']: l['body'] for l in locs}
    new_locations = [p for p in json.loads((pkg/'qsp-patches.json').read_text(encoding='utf-8-sig')) if p.get('New')]
    check(f'{label}: 신규 location 본문 설치 확인', all(texts.get(p['Name']) == p['Text'] for p in new_locations))
    texts['css'] = (game / 'css/base.css').read_text(encoding='utf-8')
    texts['json'] = (game / 'json/menu_icon.json').read_text(encoding='utf-8')
    json.loads(texts['json'])
    missing, left, count = [], [], 0
    direct = re.compile(r"(?<!SNKmod\\)(?<!SNKmod/)content[\\/]pic[\\/]([^\"'<>()]+?\.(?:png|jpg|gif))", re.I)
    for n, t in texts.items():
        for m in SNK_REF.finditer(t):
            count += 1
            if not (game / 'content/pic/SNKmod' / m.group(1).replace('\\', '/')).is_file():
                missing.append(f'{n}:{m.group(1)}')
        for m in direct.finditer(t):
            if m.group(1).replace('\\', '/').lower() in originals:
                left.append(f'{n}:{m.group(1)}')
    check(f'{label}: 모든 SNKmod 참조가 실제 파일을 가리킴 ({count}곳)', not missing and count > 0, ', '.join(missing[:5]))
    check(f'{label}: FIX6 이미지의 옛 경로 참조가 남지 않음', not left, ', '.join(left[:5]))
    snk = [u for u in ui_map if not (game / u['SNKmod']).is_file() or sha(game / u['SNKmod']) != u['Hash']]
    check(f'{label}: SNKmod 이미지 {len(ui_map)}개 설치·해시 일치', not snk, str(snk[:2]))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--qsp', required=True, type=Path)
    ap.add_argument('--pwsh', required=True)
    ap.add_argument('--pkg', type=Path, default=REPO / 'dist/JO9_UI_v1_9_14_SNKmod_R3')
    ap.add_argument('--upgrade-from', type=Path, help='Also check upgrade from this previously installed package')
    args = ap.parse_args()
    fix6 = fix6_files()
    work = Path(tempfile.mkdtemp(prefix='snkmod_test_'))
    try:
        # A. FIX6 백업 없는 FIX6 설치본
        g = work / 'A/game'
        make_game(g, args.qsp, fix6, with_fix6_backup=False)
        pic_before = tree_hashes(g / 'content')
        code_before = {f: sha(g / f) for f in ['jack.qsp', 'css/base.css', 'json/menu_icon.json', 'engine/jack.exe']}
        r = run(args.pwsh, args.pkg, g, 'Check')
        check('A1 Check 종료코드 0', r.returncode == 0, r.stdout[-300:] + r.stderr[-300:])
        check('A1 Check는 파일을 바꾸지 않음', tree_hashes(g) == {**{'content/' + k: v for k, v in pic_before.items()}, **code_before} or
              ({f: sha(g / f) for f in code_before} == code_before and not (g / 'content/pic/SNKmod').exists() and not (g / '_JO9_SNKmod_STATE').exists()))
        check('A1 Check가 FIX6 백업 없음 경고', '백업이 없습니다' in r.stdout + r.stderr)
        r = run(args.pwsh, args.pkg, g, 'Apply')
        check('A2 Apply 종료코드 0', r.returncode == 0, r.stdout[-400:] + r.stderr[-400:])
        verify_installed(g, args.pkg, 'A2')
        check('A2 원본 content/pic 이미지 바이트 불변', {k:v for k,v in tree_hashes(g / 'content').items() if not k.startswith('pic/SNKmod/')} == pic_before)
        check('A2 커스텀 엔진 불변', sha(g / 'engine/jack.exe') == code_before['engine/jack.exe'])
        installed = {f: sha(g / f) for f in ['jack.qsp', 'css/base.css', 'json/menu_icon.json']}
        r = run(args.pwsh, args.pkg, g, 'Apply')
        check('A3 재실행은 변경 없음', r.returncode == 0 and '이미 설치' in r.stdout and {f: sha(g / f) for f in installed} == installed, r.stdout[-200:])
        r = run(args.pwsh, args.pkg, g, 'Restore')
        check('A4 Restore 종료코드 0', r.returncode == 0, r.stdout[-300:] + r.stderr[-300:])
        check('A4 jack.qsp·base.css·menu_icon.json·엔진 설치 전과 동일', {f: sha(g / f) for f in code_before} == code_before)
        check('A4 SNKmod 폴더 정리', not (g / 'content/pic/SNKmod').exists())
        check('A4 원본 content/pic 불변', {k:v for k,v in tree_hashes(g / 'content').items() if not k.startswith('pic/SNKmod/')} == pic_before)

        # B. 설치 후 사용자가 SNKmod 파일을 바꾸면 복구 거부, 아무것도 안 바뀜
        r = run(args.pwsh, args.pkg, g, 'Apply')
        victim = g / 'content/pic/SNKmod/buttons/close_button.png'
        victim.write_bytes(b'user edit')
        snap = tree_hashes(g)
        edited_css = (g / 'css/base.css').read_bytes() + b'\n/* user edit */'
        (g / 'css/base.css').write_bytes(edited_css)
        snap = tree_hashes(g)
        r = run(args.pwsh, args.pkg, g, 'Apply', 'N\n')
        check('B1 변경 목록 표시 후 N 취소', r.returncode != 0 and 'close_button' in r.stdout + r.stderr and 'css/base.css' in r.stdout + r.stderr, r.stdout[-300:])
        check('B1 거부 시 파일 변화 없음', tree_hashes(g) == snap)
        r = run(args.pwsh, args.pkg, g, 'Apply', 'Y\n')
        check('B2 Y 승인 후 재설치 성공', r.returncode == 0, r.stdout[-250:] + r.stderr[-250:])
        copies = list((g / '_JO9_SNKmod_STATE').glob('*/changed/*/css/base.css'))
        check('B2 변경 CSS 별도 백업', any(p.read_bytes() == edited_css for p in copies))
        copies = list((g / '_JO9_SNKmod_STATE').glob('*/changed/*/content/pic/SNKmod/buttons/close_button.png'))
        check('B2 변경 이미지 별도 백업', any(p.read_bytes() == b'user edit' for p in copies))
        verify_installed(g, args.pkg, 'B2')
        victim.write_bytes(b'second edit')
        r = run(args.pwsh, args.pkg, g, 'Restore', 'Y\n')
        check('B3 변경 파일 Y 승인 복원', r.returncode == 0, r.stdout[-200:] + r.stderr[-200:])
        check('B3 원래 CSS 복원', (g / 'css/base.css').read_bytes() == fix6['payload/css/base.css'])
        copies = list((g / '_JO9_SNKmod_STATE').glob('*/changed/*/content/pic/SNKmod/buttons/close_button.png'))
        check('B3 복원 직전 변경 이미지 백업', any(p.read_bytes() == b'second edit' for p in copies))

        # C. FIX6 백업이 있는 설치본 → FIX6 이전으로 전환 후 설치, 복구 시 전환된 상태로
        g = work / 'C/game'
        make_game(g, args.qsp, fix6, with_fix6_backup=True)
        r = run(args.pwsh, args.pkg, g, 'Apply')
        check('C1 Apply 종료코드 0', r.returncode == 0, r.stdout[-400:] + r.stderr[-400:])
        m = json.loads(fix6['manifest.json'].decode('utf-8-sig'))
        vanilla_ok = all((g / e['Rel']).read_bytes() == b'vanilla:' + e['Rel'].encode()
                         for e in m['Files'] if e['Rel'].startswith('content/pic/'))
        check('C1 FIX6가 덮어쓴 원본 이미지를 백업본으로 복원', vanilla_ok)
        st = json.loads((g / '_JO9_UI_ALL1914_BACKUPS/20260101_000000_test/state.json').read_text(encoding='utf-8-sig'))
        check('C1 FIX6 기록을 restored로 표시, 백업 폴더 유지', st['Status'] == 'restored' and (g / '_JO9_UI_ALL1914_BACKUPS/20260101_000000_test/original').exists())
        verify_installed(g, args.pkg, 'C1')

        # D. 알 수 없는 main_screen 본문(다른 QSP 모드 흉내) → 경고 후 설치
        g = work / 'D/game'
        make_game(g, args.qsp, fix6, with_fix6_backup=False)
        raw = (g / 'jack.qsp').read_bytes().decode('utf-16-le').split('\r\n')
        n = int(''.join(chr(ord(c) + 5) for c in raw[3])); at = 4
        for _ in range(n):
            name = ''.join(chr(ord(c) + 5) for c in raw[at])
            if name == 'main_screen':
                body = ''.join(chr(ord(c) + 5) for c in raw[at + 2]) + '\n! other mod'
                raw[at + 2] = ''.join(chr((ord(c) - 5) & 0xFFFF) for c in body)
            at += 4 + int(''.join(chr(ord(c) + 5) for c in raw[at + 3])) * 3
        (g / 'jack.qsp').write_bytes('\r\n'.join(raw).encode('utf-16-le'))
        r = run(args.pwsh, args.pkg, g, 'Apply')
        check('D1 알 수 없는 본문도 경고 후 설치', r.returncode == 0 and '알려지지 않은 main_screen' in r.stdout + r.stderr, r.stdout[-300:] + r.stderr[-300:])
        verify_installed(g, args.pkg, 'D1')

        # E. 일반 이미지: 비대화형 실행은 동의로 보지 않는다
        pkg2 = work / 'pkg_general'
        shutil.copytree(args.pkg, pkg2)
        gen = pkg2 / 'payload/general/content/pic/bg/test_general.png'
        gen.parent.mkdir(parents=True)
        gen.write_bytes(b'general image')
        man = json.loads((pkg2 / 'manifest.json').read_text(encoding='utf-8'))
        man['General'] = [{'Rel': 'content/pic/bg/test_general.png', 'Source': 'payload/general/content/pic/bg/test_general.png',
                           'Hash': hashlib.sha256(b'general image').hexdigest()}]
        man['Payload'].append({'Rel': 'payload/general/content/pic/bg/test_general.png', 'Hash': hashlib.sha256(b'general image').hexdigest()})
        (pkg2 / 'manifest.json').write_text(json.dumps(man, ensure_ascii=False), encoding='utf-8')
        g = work / 'E/game'
        make_game(g, args.qsp, fix6, with_fix6_backup=False)
        r = run(args.pwsh, pkg2, g, 'Apply')
        check('E1 비대화형: 일반 이미지 쓰지 않고 UI만 설치', r.returncode == 0 and not (g / 'content/pic/bg/test_general.png').exists()
              and (g / 'content/pic/SNKmod').exists(), r.stdout[-300:] + r.stderr[-300:])

        # F. 엔진 정책: 순정+맞는 Qt면 교체하고 복구 시 되돌림, Qt가 다르면 경고 후 엔진만 건너뜀
        pkg3 = work / 'pkg_engine'
        shutil.copytree(args.pkg, pkg3)
        man = json.loads((pkg3 / 'manifest.json').read_text(encoding='utf-8'))
        man['Engine']['Before'] = hashlib.sha256(b'stock engine').hexdigest()
        man['Engine']['QtWidgetsHash'] = hashlib.sha256(b'qt ok').hexdigest()
        (pkg3 / 'manifest.json').write_text(json.dumps(man, ensure_ascii=False), encoding='utf-8')
        for label, qt in (('F1', b'qt ok'), ('F2', b'qt other')):
            g = work / label / 'game'
            make_game(g, args.qsp, fix6, with_fix6_backup=False)
            (g / 'engine/jack.exe').write_bytes(b'stock engine')
            (g / 'engine/Qt5Widgets.dll').write_bytes(qt)
            r = run(args.pwsh, pkg3, g, 'Apply')
            replaced = sha(g / 'engine/jack.exe') == man['Engine']['After']
            if label == 'F1':
                check('F1 순정+맞는 Qt: 엔진 교체', r.returncode == 0 and replaced, r.stdout[-200:] + r.stderr[-200:])
                r = run(args.pwsh, pkg3, g, 'Restore')
                check('F1 복구 시 순정 엔진으로 되돌림', r.returncode == 0 and (g / 'engine/jack.exe').read_bytes() == b'stock engine')
            else:
                check('F2 Qt 불일치: 경고 후 엔진만 건너뛰고 설치', r.returncode == 0 and not replaced and 'Qt5Widgets' in r.stdout + r.stderr
                      and (g / 'content/pic/SNKmod').exists(), r.stdout[-200:] + r.stderr[-200:])
        if args.upgrade_from:
            g = work / 'Upgrade/game'
            make_game(g, args.qsp, fix6, with_fix6_backup=False)
            originals_before = tree_hashes(g / 'content')
            before = {f: sha(g / f) for f in ['jack.qsp','css/base.css','json/menu_icon.json','engine/jack.exe']}
            r = run(args.pwsh, args.upgrade_from, g, 'Apply')
            check('U1 이전 R3 설치', r.returncode == 0 and (g / 'SNKmod').exists())
            r = run(args.pwsh, args.pkg, g, 'Apply')
            names = {x['name'] for x in read_locations((g / 'jack.qsp').read_bytes())}
            check('U2 개인실 개발본 업그레이드·새 location 설치', r.returncode == 0 and {'snk_room_bridge','snk_room_menu_screen'} <= names, r.stdout[-250:] + r.stderr[-250:])
            verify_installed(g, args.pkg, 'U2 새 경로')
            check('U3 업그레이드 중 원본 이미지 불변', {k:v for k,v in tree_hashes(g / 'content').items() if not k.startswith('pic/SNKmod/')} == originals_before)
            r = run(args.pwsh, args.pkg, g, 'Restore')
            check('U4 복구는 첫 R3 설치 이전 QSP·CSS·JSON·엔진과 동일', r.returncode == 0 and all(sha(g / f) == digest for f,digest in before.items()) and not (g / 'content/pic/SNKmod').exists())
        if args.upgrade_from:
            g = work / 'Moved/game'
            make_game(g, args.qsp, fix6, with_fix6_backup=False)
            r = run(args.pwsh, args.upgrade_from, g, 'Apply')
            # 사용자가 원래 SNKmod/content/pic 내용을 pic/SNKmod로 이미 이동한 상태.
            shutil.move(str(g / 'SNKmod/content/pic'), str(g / 'content/pic/SNKmod'))
            moved_before = tree_hashes(g / 'content/pic/SNKmod')
            r = run(args.pwsh, args.pkg, g, 'Apply')
            check('M1 수동 이동 상태에서 확인 없이 경로 전환', r.returncode == 0, r.stdout[-250:] + r.stderr[-250:])
            verify_installed(g, args.pkg, 'M1')
            r = run(args.pwsh, args.pkg, g, 'Restore')
            restored = tree_hashes(g / 'content/pic/SNKmod')
            check('M2 수동 이동 파일 복원 및 보존', r.returncode == 0 and restored == moved_before)
    finally:
        shutil.rmtree(work, ignore_errors=True)
    failed = [n for n, ok, _ in results if not ok]
    print(f'\n{len(results) - len(failed)}/{len(results)} passed')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
