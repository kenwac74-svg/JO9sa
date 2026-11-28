# 풍부화 검토표(불러오기·편집·저장 도구)와 enrich-db.json, 사용법을 로컬 작업용 zip 하나로 묶는 도구
"""사용법: python tools/pack_enrich_review.py <출력 폴더>
검토표를 DB에서 다시 뽑은 뒤 enrich-db-review_<날짜>.zip을 만든다. zip은 저장소에 넣지 않는다."""
import datetime, subprocess, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'docs/dialogue-rules/db/enrich-db.json'
HTML = ROOT / 'docs/dialogue-rules/db/enrich-db-review.html'
README = '''풍부화 원고 검토표 - 불러오기·편집·저장 도구

1. 이 폴더의 enrich-db-review.html을 크롬이나 엣지로 연다.
2. "DB 불러오기"를 눌러 같은 폴더의 enrich-db.json을 고른다.
   사용자 입력 칸이 본문·여운 편집 칸으로 바뀐다.
3. 고친 뒤 "저장하기"를 누르면 enrich-db.json에 바로 쓴다(처음 한 번 쓰기 허락을 묻는다).
   브라우저가 직접 쓰지 못하면 같은 이름으로 내려받으니 그 파일로 덮어쓴다.
4. 저장소에 반영하려면 저장한 enrich-db.json을 저장소의 tools/apply_edited_enrich_db.bat 위로 끌어다 놓는다.
   DB를 덮어쓰고 게임에 넣을 사건 데이터와 검토표까지 다시 뽑는다. 그다음 커밋한다.
   데이터만 다시 뽑을 때는 tools/rebuild_enrich_data.bat을 더블클릭한다.

- 내용 검사는 하지 않는다. 행·열을 지우지 않으며, 빈 칸에 처음 쓰면 사용자 입력 행이 하나 더해진다.
- 저장 형식은 원래 파일과 같다(들여쓰기 1칸, 한글 그대로).
- 기준: {rev}, {day}.
'''


def main():
    out = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
    out.mkdir(parents=True, exist_ok=True)
    subprocess.run([sys.executable, str(ROOT / 'tools/enrich_db_html.py')], cwd=ROOT, check=True)
    rev = subprocess.run(['git', 'rev-parse', '--short', 'HEAD'], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    day = datetime.date.today().strftime('%Y%m%d')
    zp = out / f'enrich-db-review_{day}.zip'
    with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED) as z:
        z.write(HTML, 'enrich-db-review/enrich-db-review.html')
        z.write(DB, 'enrich-db-review/enrich-db.json')
        z.writestr('enrich-db-review/사용법.txt', README.format(rev=f'커밋 {rev}', day=day))
    print(zp)


if __name__ == '__main__':
    main()
