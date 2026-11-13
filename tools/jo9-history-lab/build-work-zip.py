# 사용자 PC 작업용 ZIP(편집기 전체 + 실행 bat + 설명서)을 git이 추적하는 파일로 만드는 스크립트(원문 사본 local/·.app-data는 넣지 않는다)
# 사용: python3 build-work-zip.py <출력 폴더>   → <출력 폴더>/JO9_editor_<커밋>.zip
# 편집기 빌드·배포는 사용자가 시킬 때만 한다(사용자 규칙).
import pathlib
import subprocess
import sys
import zipfile

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parent.parent
INCLUDE = ['tools/jo9-history-lab', 'tools/character-image-adder', 'docs/claude-refusals', 'docs/CREATIVE_INTENT_RULES_20261015.md']
ROOT = 'JO9_editor/'
# 모드 제작자 인계 문서(인계 브랜치에만 있음)도 함께 넣는다
HANDOFF_BRANCH = 'origin/handoff/stats-background-generation-20261112'
HANDOFF_DIRS = ['docs/session-handoffs/2026-11-12', 'docs/session-handoffs/2026-11-13']

RUN_APP = ('@echo off\r\nchcp 65001 >nul\r\ncd /d "%~dp0tools\\jo9-history-lab"\r\nset PY=python\r\nwhere python >nul 2>nul || set PY=py\r\n'
           '%PY% -c "import webview" 2>nul\r\nif errorlevel 1 (\r\n  echo 앱 창 기능 pywebview를 처음 한 번 설치합니다...\r\n  %PY% -m pip install pywebview\r\n)\r\n'
           'start "" %PY%w start-studio-app.py\r\nif errorlevel 1 %PY% start-studio-app.py\r\n')
RUN_BROWSER = '@echo off\r\nchcp 65001 >nul\r\ncd /d "%~dp0tools\\jo9-history-lab"\r\nset PY=python\r\nwhere python >nul 2>nul || set PY=py\r\n%PY% start-history-lab.py\r\npause\r\n'
RUN_FETCH = ('@echo off\r\nchcp 65001 >nul\r\ncd /d "%~dp0tools\\jo9-history-lab\\docs\\sextalk-interviews"\r\nset PY=python\r\nwhere python >nul 2>nul || set PY=py\r\n'
             '%PY% -I fetch_originals.py %*\r\npause\r\n')
README = """# JO9 통합 캐릭터 편집기 작업 폴더 (커밋 {commit})

어느 PC에서나 이 폴더를 풀어 그대로 작업한다. 파이썬 3.8 이상 필요(게임 파일 기능은 `python -m pip install pillow`).

1. `편집기_실행.bat` 더블클릭 → 편집기 전용 앱 창(처음 한 번 pywebview 자동 설치). 창을 닫으면 끝. 처음에 게임 폴더를 지정한다.
   - 앱 창이 안 열리면 `편집기_브라우저로_실행.bat`(브라우저+검은 창).
   - 브라우저 방식에서 바꾼 설정(산식 계수 등)은 앱 창으로 자동으로 넘어오지 않는다. '전체 설정 내보내기' → 앱 창에서 불러오기.
2. `인터뷰_원문_가져오기.bat` 더블클릭(PC마다 처음 한 번, 2~3분) → 원본 블로그에서 원문을 받아 `tools/jo9-history-lab/docs/sextalk-interviews/local/`에 채운다. 원본 글이 바뀌었으면 `--all`.
3. 편집 결과는 이 폴더 안 파일에 저장된다. 저장소(브랜치 editor/character-studio-20261112)에 반영하려면 바뀐 파일을 올린다.

- 인계 문서: `tools/jo9-history-lab/docs/character-studio/EDITOR_HANDOFF_KO.md`
- 맥·리눅스: `cd tools/jo9-history-lab && python3 start-studio-app.py`
"""


def main(out_dir):
    commit = subprocess.run(['git', 'rev-parse', '--short', 'HEAD'], cwd=REPO, capture_output=True, text=True).stdout.strip()
    files = [f for f in subprocess.run(['git', 'ls-files', *INCLUDE], cwd=REPO, capture_output=True, text=True).stdout.split('\n') if f]
    files = [f for f in files if (REPO / f).is_file() and '/local/' not in f]
    out = pathlib.Path(out_dir) / f'JO9_editor_{commit}.zip'
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in files:
            z.write(REPO / f, ROOT + f)
        z.writestr(ROOT + '편집기_실행.bat', RUN_APP.encode('utf-8'))
        z.writestr(ROOT + '편집기_브라우저로_실행.bat', RUN_BROWSER.encode('utf-8'))
        z.writestr(ROOT + '인터뷰_원문_가져오기.bat', RUN_FETCH.encode('utf-8'))
        z.writestr(ROOT + 'README_KO.md', README.format(commit=commit))
        listed = subprocess.run(['git', 'ls-tree', '-r', '--name-only', HANDOFF_BRANCH, *HANDOFF_DIRS], cwd=REPO, capture_output=True, text=True).stdout.split()
        for f in listed:
            data = subprocess.run(['git', 'show', f'{HANDOFF_BRANCH}:{f}'], cwd=REPO, capture_output=True).stdout
            z.writestr(ROOT + '모드제작자_인계/' + f.split('docs/session-handoffs/')[1], data)
    print(out, len(files), '파일')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '.')
