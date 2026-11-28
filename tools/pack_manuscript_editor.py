# 질문 원고 편집기 HTML과 원고표 CSV, 질문별 원고 JSON, 사용법을 로컬 작업용 zip 하나로 묶는 도구
"""사용법: python tools/pack_manuscript_editor.py <출력 폴더>
manuscript-editor_<날짜>.zip을 만든다. zip은 저장소에 넣지 않는다."""
import datetime, subprocess, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILL = ROOT / 'docs/dialogue-rules/question-fill'
EDITOR = ROOT / 'tools/manuscript_editor/manuscript_editor.html'
README = '''질문 원고 편집기

1. 이 폴더의 manuscript_editor.html을 크롬이나 엣지로 연다.
2. "① 원고표 CSV 불러오기"로 question_fill_table.csv를 고른다.
3. "② 원고 JSON 불러오기"로 고칠 질문의 원고를 고른다(예: q1117_manuscript.json).
4. 처음에는 "원고 없는 칸만" 보인다. 칸마다 원문(말투 1·2·3)을 참고로 보고 입력란에 쓴다.
   - 사용자 완료: 입력이 있는 칸 / 사용자 대기: 입력해야 원고가 완성되는 칸
   - "사용자 작성 칸", "이 질문의 모든 칸"으로 바꿔 볼 수 있다.
5. "저장하기"를 누르면 그 JSON에 바로 쓴다(처음 한 번 쓰기 허락을 묻는다).
   브라우저가 직접 쓰지 못하면 같은 이름으로 내려받으니 그 파일로 덮어쓴다.
6. 저장소에 반영하려면 이 폴더를 저장소의 tools/apply_edited_manuscripts.bat 위로 끌어다 놓는다.
   원고 JSON을 저장소에 덮어쓰고 게임에 넣을 데이터까지 다시 뽑는다. 그다음 커밋한다.
   데이터만 다시 뽑을 때는 tools/rebuild_question_data.bat을 더블클릭한다.
   - 가장 최근에 받은 zip으로 작업한다. 오래된 zip의 원고를 끌어다 놓으면 그 사이 바뀐 원고가 되돌아간다.

- 내용은 검사하지 않는다. 행을 지우지 않으며, 원고가 없던 칸에 처음 쓰면 writer: user 행이 하나 더해진다.
- 저장 형식은 원래 파일과 같다(들여쓰기 1칸, 한글 그대로).
- 기준: {rev}, {day}.
'''


def main():
    out = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
    out.mkdir(parents=True, exist_ok=True)
    rev = subprocess.run(['git', 'rev-parse', '--short', 'HEAD'], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    day = datetime.date.today().strftime('%Y%m%d')
    zp = out / f'manuscript-editor_{day}.zip'
    with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED) as z:
        z.write(EDITOR, 'manuscript-editor/manuscript_editor.html')
        z.write(FILL / 'question_fill_table.csv', 'manuscript-editor/question_fill_table.csv')
        for f in sorted(FILL.glob('q*_manuscript.json')):
            z.write(f, f'manuscript-editor/{f.name}')
        z.writestr('manuscript-editor/사용법.txt', README.format(rev=f'커밋 {rev}', day=day))
    print(zp)


if __name__ == '__main__':
    main()
