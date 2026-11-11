# 시뮬레이션 전용: 구형 QSP WASM 엔진이 모르는 for 반복문을 같은 동작의 label/jump 반복으로 바꾼 qsp 사본을 만든다(게임 파일은 바꾸지 않는다)
import re, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[4] / 'tools'))
from qsp_dump import read_locations, sh  # noqa: E402

FOR = re.compile(r'^(\s*)for\s+([A-Za-z_$][\w$]*(?:\[[^\]]*\])?)\s*=\s*(.+?)\s+to\s+(.+?)(?:\s+step\s+(.+?))?\s*:\s*(.*)$', re.I)


def opens_block(line: str) -> bool:
    s = re.sub(r"\s*&?\s*!.*$", '', line.strip()) if not line.strip().startswith('!') else ''
    if not s.endswith(':'):
        return False
    return bool(re.match(r'(?i)(if|act|for)\b', s))


def closes_block(line: str) -> bool:
    return bool(re.match(r'(?i)end\b', line.strip()))


def transform(body: str, prefix: str) -> tuple[str, int]:
    lines = body.split('\r\n')
    out, n = [], 0
    i = 0

    def emit_loop(indent, var, start, stop, step, inner):
        nonlocal n
        n += 1
        k = f'{prefix}{n}'
        step = (step or '1').strip()
        cmp = '>=' if step.startswith('-') else '<='
        res = [f'{indent}{var} = {start}', f'{indent}jo9simfor_end_{k} = {stop}', f'{indent}:jo9simfor_{k}',
               f'{indent}if {var} {cmp} jo9simfor_end_{k}:']
        res += inner
        res += [f'{indent}\t{var} += {step}', f"{indent}\tjump 'jo9simfor_{k}'", f'{indent}end', f"{indent}killvar 'jo9simfor_end_{k}'"]
        return res

    while i < len(lines):
        m = FOR.match(lines[i])
        if not m:
            out.append(lines[i]); i += 1; continue
        indent, var, start, stop, step, rest = m.groups()
        rest = rest.strip()
        if rest and not rest.startswith('!'):
            out += emit_loop(indent, var, start, stop, step, [f'{indent}\t{rest}'])
            i += 1
            continue
        depth, j = 1, i + 1
        while j < len(lines):
            if opens_block(lines[j]):
                depth += 1
            elif closes_block(lines[j]):
                depth -= 1
                if depth == 0:
                    break
            j += 1
        if j >= len(lines):
            raise ValueError('for 블록의 end를 찾지 못함: ' + lines[i][:80])
        inner_body, cnt = transform('\r\n'.join(lines[i + 1:j]), prefix + f'{n + 1}_')
        out += emit_loop(indent, var, start, stop, step, inner_body.split('\r\n') if inner_body else [])
        i = j + 1
    return '\r\n'.join(out), n


def main(src: str, dst: str) -> None:
    raw = Path(src).read_bytes()
    f = raw.decode('utf-16-le').split('\r\n')
    locs = read_locations(raw)
    total = 0
    for idx, loc in enumerate(locs):
        body, n = transform(loc['body'], f'L{idx}_')
        loc['body'] = body
        total += n
    enc = lambda s: sh(s, -5)
    out = f[:3] + [enc(str(len(locs)))]
    for loc in locs:
        out += [enc(loc['name']), enc(loc['desc']), enc(loc['body']), enc(str(len(loc['actions'])))]
        for a in loc['actions']:
            out += [enc(x) for x in a]
    out.append('')
    Path(dst).write_bytes('\r\n'.join(out).encode('utf-16-le'))
    print('for 변환', total)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
