# 대사 작업 실행 파일(.bat)이 부르는 본체: 원고·풍부화 DB를 저장소에 덮어쓰고 게임에 넣을 데이터를 다시 뽑는다(내용 검사 없음)
"""실행 파일에서 부른다. 직접 쓸 때: dialogue_tools.py <apply-manuscripts|rebuild-question|apply-enrich|rebuild-enrich> [경로...]"""
import json, os, re, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILL = ROOT / 'docs/dialogue-rules/question-fill'
DB = ROOT / 'docs/dialogue-rules/db/enrich-db.json'
BUILD = ROOT / 'docs/dialogue-rules/handoff/build'
QSP = Path(os.environ.get('JO9_QSP') or ROOT / 'assets/runtime/2.4.1/jack.qsp')
NAME = re.compile(r'^q.*_manuscript\.json$', re.I)


def run(script, *args):
    r = subprocess.run([sys.executable, str(ROOT / 'tools' / script), *map(str, args)], cwd=ROOT)
    return r.returncode == 0


def rebuild_question():
    if not QSP.exists():
        print(f'게임 파일을 찾지 못했습니다: {QSP}')
        return False
    print('질문 메뉴 데이터를 다시 뽑는 중...')
    ok = run('question_build_data.py', QSP, BUILD)
    print('데이터를 다시 뽑았습니다.' if ok else '데이터 뽑기에 실패했습니다. 위 메시지를 확인하세요.')
    return ok


def apply_manuscripts(paths):
    files = []
    for p in map(Path, paths):
        if p.is_dir():
            files += sorted(f for f in p.glob('q*_manuscript.json'))
        elif NAME.match(p.name):
            files.append(p)
        else:
            print(f'원고 JSON이 아니라 건너뜀: {p.name}')
    n = 0
    for f in files:
        try:
            data = json.loads(f.read_text(encoding='utf-8'))
            assert isinstance(data.get('rows'), list)
        except Exception as e:
            print(f'원고 형식이 아니라 건너뜀: {f.name} ({e})')
            continue
        shutil.copyfile(f, FILL / f.name)
        print(f'덮어씀: {f.name}')
        n += 1
    if not n:
        print('덮어쓴 원고가 없습니다. 원고 폴더나 q11xx_manuscript.json 파일을 끌어다 놓으세요.')
        return False
    print(f'원고 {n}개를 덮어썼습니다.')
    return rebuild_question()


def rebuild_enrich():
    print('풍부화 사건 데이터와 검토표를 다시 뽑는 중...')
    ok = run('enrich_build_data.py') and run('enrich_db_html.py')
    print('다시 뽑았습니다.' if ok else '실패했습니다. 위 메시지를 확인하세요.')
    return ok


def apply_enrich(paths):
    src = next((Path(p) for p in paths if Path(p).name.lower() == 'enrich-db.json'), None)
    if not src:
        print('enrich-db.json 파일을 끌어다 놓으세요.')
        return False
    try:
        assert isinstance(json.loads(src.read_text(encoding='utf-8')).get('fragments'), list)
    except Exception as e:
        print(f'풍부화 DB 형식이 아닙니다: {e}')
        return False
    shutil.copyfile(src, DB)
    print('덮어씀: enrich-db.json')
    return rebuild_enrich()


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    cmd, args = sys.argv[1], sys.argv[2:]
    ok = {'apply-manuscripts': lambda: apply_manuscripts(args), 'rebuild-question': rebuild_question,
          'apply-enrich': lambda: apply_enrich(args), 'rebuild-enrich': rebuild_enrich}.get(cmd, lambda: False)()
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
