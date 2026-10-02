"""같은 파일명으로 겹치는 기준 리소스와 ai_girl_pack 이미지를 HTML로 비교합니다."""
from __future__ import annotations

import argparse
import hashlib
import html
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import quote


IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"}
REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = REPO_ROOT / "compare" / "base_resources_ai_girl_pack.html"


def is_image(path: Path) -> bool:
    return path.suffix.casefold() in IMAGE_EXTENSIONS


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_uri(path: Path) -> str:
    return path.resolve().as_uri()


def display_path(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def render_files(paths: list[Path], root: Path, digests: dict[Path, str]) -> str:
    cards = []
    for path in paths:
        uri = html.escape(file_uri(path), quote=True)
        shown_path = html.escape(display_path(path, root))
        digest = digests[path]
        cards.append(
            '<article class="image-card">'
            f'<a href="{uri}" target="_blank" rel="noreferrer">'
            f'<img loading="lazy" src="{uri}" alt="{html.escape(path.name, quote=True)}">'
            "</a>"
            f'<div class="path">{shown_path}</div>'
            f'<div class="meta">{path.stat().st_size:,} bytes</div>'
            f'<div class="hash" title="{digest}">SHA-256 {digest[:16]}...</div>'
            "</article>"
        )
    return '<div class="gallery">' + "".join(cards) + "</div>"


def build_report(imgpatch: Path, pack: Path, output: Path) -> tuple[int, int, int]:
    imgpatch = imgpatch.resolve()
    pack = pack.resolve()
    output = output.resolve()
    if not imgpatch.is_dir():
        raise FileNotFoundError(f"imgpatch 폴더가 없습니다: {imgpatch}")
    if not pack.is_dir():
        raise FileNotFoundError(f"ai_girl_pack 폴더가 없습니다: {pack}")

    left: dict[str, list[Path]] = defaultdict(list)
    for path in imgpatch.rglob("*"):
        if path.is_file() and is_image(path):
            left[path.name.casefold()].append(path)

    wanted_names = set(left)
    right: dict[str, list[Path]] = defaultdict(list)
    for path in pack.rglob("*"):
        if path.is_file() and is_image(path) and path.name.casefold() in wanted_names:
            right[path.name.casefold()].append(path)

    common_names = sorted(left.keys() & right.keys())
    digests = {
        path: sha256(path)
        for name in common_names
        for path in left[name] + right[name]
    }

    rows = []
    exact_groups = 0
    paired_names = 0
    matched_files = 0
    for key in common_names:
        left_paths = sorted(left[key], key=lambda p: p.as_posix().casefold())
        right_paths = sorted(right[key], key=lambda p: p.as_posix().casefold())
        left_hashes = Counter(digests[path] for path in left_paths)
        right_hashes = Counter(digests[path] for path in right_paths)
        shared_hashes = sum((left_hashes & right_hashes).values())
        if left_hashes == right_hashes:
            exact_groups += 1
            status = '<span class="badge same">내용 동일</span>'
        elif shared_hashes:
            status = f'<span class="badge partial">일부 동일 {shared_hashes}쌍</span>'
        else:
            status = '<span class="badge different">이름만 동일</span>'
        if len(left_paths) == len(right_paths) == 1:
            paired_names += 1
        matched_files += len(right_paths)
        filename = html.escape(left_paths[0].name)
        search_text = html.escape(
            " ".join(
                [filename]
                + [display_path(path, imgpatch) for path in left_paths]
                + [display_path(path, pack) for path in right_paths]
            ).casefold(),
            quote=True,
        )
        rows.append(
            f'<tr data-search="{search_text}">'
            f'<th scope="row"><div class="filename">{filename}</div>{status}</th>'
            f'<td>{render_files(left_paths, imgpatch, digests)}</td>'
            f'<td>{render_files(right_paths, pack, digests)}</td>'
            "</tr>"
        )

    no_results = ""
    if not rows:
        no_results = '<p class="empty">동일한 이미지 파일명이 없습니다.</p>'

    document = f'''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>기준 리소스 / ai_girl_pack 이미지 비교</title>
<style>
:root {{ color-scheme: light; font-family: "Malgun Gothic", "맑은 고딕", sans-serif; color: #27231e; background: #f1eee8; }}
* {{ box-sizing: border-box; }}
body {{ margin: 0; }}
header {{ position: sticky; top: 0; z-index: 2; display: flex; align-items: center; gap: 18px; padding: 14px 20px; background: #282620; color: #f7f2e8; box-shadow: 0 2px 8px #0003; }}
h1 {{ margin: 0; font-size: 19px; font-weight: 650; white-space: nowrap; }}
#filter {{ width: min(380px, 45vw); padding: 8px 10px; border: 1px solid #8b8374; border-radius: 3px; font: inherit; }}
.summary {{ margin-left: auto; color: #ded3bd; font-size: 13px; white-space: nowrap; }}
main {{ padding: 16px; }}
.paths {{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }}
.root {{ overflow-wrap: anywhere; padding: 10px 12px; background: white; border-left: 3px solid #8a754f; font: 12px/1.5 Consolas, monospace; }}
table {{ width: 100%; border-collapse: separate; border-spacing: 0 8px; table-layout: fixed; }}
thead th {{ position: sticky; top: 57px; z-index: 1; padding: 10px; text-align: left; color: #f6f1e7; background: #605642; }}
thead th:first-child {{ width: 190px; }}
tbody th, tbody td {{ vertical-align: top; padding: 10px; background: #fff; border-top: 1px solid #d8d0c2; border-bottom: 1px solid #d8d0c2; }}
tbody th {{ border-left: 1px solid #d8d0c2; text-align: left; }}
tbody td:last-child {{ border-right: 1px solid #d8d0c2; }}
.filename {{ margin-bottom: 7px; overflow-wrap: anywhere; font-size: 14px; }}
.badge {{ display: inline-block; padding: 3px 6px; border-radius: 2px; font-size: 11px; font-weight: 600; }}
.same {{ color: #245d37; background: #e0f0e3; }}
.partial {{ color: #735219; background: #f8edce; }}
.different {{ color: #853a30; background: #f5e1dd; }}
.gallery {{ display: flex; flex-wrap: wrap; align-items: flex-start; gap: 10px; }}
.image-card {{ width: min(250px, 100%); padding: 6px; background: #f7f6f3; border: 1px solid #ddd7cc; }}
.image-card a {{ display: flex; height: 190px; align-items: center; justify-content: center; background: #e7e4df; }}
.image-card img {{ display: block; max-width: 100%; max-height: 190px; object-fit: contain; }}
.path {{ margin-top: 6px; overflow-wrap: anywhere; color: #302b22; font: 11px/1.35 Consolas, monospace; }}
.meta,.hash {{ margin-top: 4px; color: #686256; font-size: 10px; }}
.empty {{ padding: 28px; background: white; }}
@media (max-width: 800px) {{ header {{ flex-wrap: wrap; }} .summary {{ margin-left: 0; }} main {{ overflow-x: auto; }} table {{ min-width: 760px; }} .paths {{ min-width: 760px; }} }}
</style>
</head>
<body>
<header>
  <h1>동일 파일명 이미지 비교</h1>
  <input id="filter" type="search" placeholder="파일명 또는 경로 필터">
  <div class="summary">공통 파일명 {len(common_names)}종 · 동일 바이트 {exact_groups}종 · 파일 짝 {paired_names}개 · AI팩 일치 파일 {matched_files}개</div>
</header>
<main>
    <div class="paths"><div class="root"><strong>기준 리소스</strong><br>{html.escape(str(imgpatch))}</div><div class="root"><strong>대조: ai_girl_pack</strong><br>{html.escape(str(pack))}</div></div>
  {no_results}
  <table>
    <thead><tr><th>공통 파일명 / 상태</th><th>imgpatch 기준 이미지</th><th>ai_girl_pack 일치 이미지</th></tr></thead>
    <tbody>{''.join(rows)}</tbody>
  </table>
</main>
<script>
const filter = document.getElementById('filter');
filter.addEventListener('input', () => {{
  const query = filter.value.trim().toLocaleLowerCase();
  document.querySelectorAll('tbody tr').forEach(row => {{
    row.hidden = !row.dataset.search.includes(query);
  }});
}});
</script>
</body>
</html>
'''
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(document, encoding="utf-8")
    return len(common_names), exact_groups, matched_files


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--imgpatch", required=True, type=Path)
    parser.add_argument("--ai-girl-pack", required=True, type=Path)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    common, identical, matched = build_report(args.imgpatch, args.ai_girl_pack, args.out)
    print(f"HTML: {args.out.resolve()}")
    print(f"공통 파일명: {common}종, 내용 동일: {identical}종, ai_girl_pack 일치 파일: {matched}개")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())