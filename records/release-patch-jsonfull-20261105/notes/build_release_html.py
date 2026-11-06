"""Build offline notes for the full-JSON ZIP with optional INSTALL.cmd.

Run with the Python launcher: py build_release_html.py
Pillow is the only extra package. No network access is used. Source files are read
only; thumbnails are embedded directly in the resulting HTML documents.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import html
from html.parser import HTMLParser
import io
import json
from pathlib import Path
import re

from PIL import Image, ImageDraw, ImageOps


NOTES = Path(__file__).resolve().parent
DEFAULT_GAME = Path("G:/somi/Jack O Nine Tails v2.4_work/game")
MAX_SIZE = (260, 200)

CSS = """
:root{color-scheme:light;--ink:#243440;--muted:#536570;--accent:#176b68;--line:#d9e2e4;--paper:#fff;--wash:#f3f6f6}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--wash);color:var(--ink);font:16px/1.8 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow-wrap:anywhere}
main{max-width:1060px;margin:32px auto;padding:44px 54px 40px;background:var(--paper);border:1px solid var(--line);border-radius:12px}
nav{display:flex;flex-wrap:wrap;gap:10px 20px;border-bottom:1px solid var(--line);padding-bottom:18px;margin-bottom:24px;font-size:.9rem}
a{color:var(--accent);text-decoration-thickness:1px;text-underline-offset:3px}a:hover{text-decoration-thickness:2px}a:focus-visible{outline:3px solid #d9aa37;outline-offset:4px}
.eyebrow{color:var(--accent);font-size:.8rem;font-weight:700;letter-spacing:.1em;margin:0 0 8px}
h1,h2,h3{line-height:1.35;overflow-wrap:normal}h1{font-size:clamp(1.6rem,4vw,2.2rem);margin:0 0 22px;letter-spacing:-.025em}h2{font-size:1.4rem;margin:42px 0 18px;padding-top:18px;border-top:1px solid var(--line);color:#164f50}h3{font-size:1.1rem;margin:30px 0 12px}p{margin:12px 0}li{padding-left:3px;margin:8px 0}ul,ol{padding-left:24px}strong{font-weight:700}code{font: .9em/1.6 ui-monospace,Consolas,monospace;background:#eef3f3;padding:2px 4px;border-radius:3px}
.table-wrap{overflow-x:auto;margin:20px 0}table{width:100%;border-collapse:collapse;min-width:460px;font-size:.94rem}th,td{padding:11px 14px;text-align:left;border:1px solid var(--line)}th{background:#eaf2f1;color:#183f40}tr:nth-child(even) td{background:#f7f9f9}
.preview-intro{color:var(--muted);font-size:.92rem}.gallery{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin:20px 0 8px}figure{margin:0;border:1px solid var(--line);border-radius:7px;background:#fafbfb;overflow:hidden}.thumb{height:164px;display:flex;align-items:center;justify-content:center;background:#eef2f3;padding:8px}figure img{display:block;max-width:100%;max-height:148px;width:auto;height:auto}figcaption{font-size:.82rem;line-height:1.55;padding:10px 11px;min-height:62px}
.verification{margin-top:34px;padding:18px 20px;background:#f1f5f5;border:1px solid var(--line);border-radius:7px;font-size:.9rem;color:#41555f}.verification h2{border:0;padding:0;margin:0 0 8px;font-size:1rem}.verification p{margin:0}
footer{margin-top:28px;color:var(--muted);font-size:.8rem;text-align:right}
@media(max-width:850px){main{margin:16px;padding:32px}.gallery{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:520px){body{font-size:15px}main{margin:0;border:0;border-radius:0;padding:24px 18px}.gallery{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.thumb{height:150px}figure img{max-height:134px}h2{margin-top:32px}.verification{padding:15px}}
@media print{body{background:white}main{border:0;margin:0;max-width:none;padding:0}nav{display:none}figure{break-inside:avoid}.gallery{grid-template-columns:repeat(5,minmax(0,1fr))}h2,h3{break-after:avoid}a{color:inherit}.verification{break-inside:avoid}}
"""


def load_json(game: Path, stem: str) -> dict:
    return json.loads((game / "json/slaves" / f"{stem}.json").read_text(encoding="utf-8-sig"))


def image_path(game: Path, resource: str) -> Path:
    candidate = game / resource
    if candidate.suffix:
        if not candidate.is_file():
            raise FileNotFoundError(candidate)
        return candidate
    for extension in (".png", ".jpg", ".webp"):
        expanded = candidate.with_suffix(extension)
        if expanded.is_file():
            return expanded
    raise FileNotFoundError(candidate)


def preview_specs(game: Path) -> list[dict]:
    specs = [
        {"source": image_path(game, "content/pic/girls/full/Luminous.png"), "ko": "루미너스 · 의복 이벤트", "en": "Luminous · clothed event"},
        {"source": image_path(game, "content/pic/girls/full/secretary/felicity.png"), "ko": "펠리시티 · 비서 복장", "en": "Felicity · secretary outfit"},
    ]
    for stem, ko, en in [
        ("2571_isabella", "이사벨라 · 2571", "Isabella · 2571"),
        ("2071", "2071 · 갈색 장발", "2071 · long brown hair"),
        ("2324", "2324 · 하늘색 단발", "2324 · short light-blue hair"),
        ("2340", "2340 · 금발 단발", "2340 · short blonde hair"),
        ("2339", "2339 · 추가 인물", "2339 · added character"),
        ("1451", "1451 · 초상 갱신", "1451 · updated portrait"),
        ("1452", "1452 · 초상 갱신", "1452 · updated portrait"),
        ("1453", "1453 · 초상 갱신", "1453 · updated portrait"),
    ]:
        definition = load_json(game, stem)
        specs.append({"source": image_path(game, definition["seed_ava_clear"]), "ko": ko, "en": en, "definition": f"json/slaves/{stem}.json"})
    return specs


def thumbnail(source: Path) -> Image.Image:
    with Image.open(source) as original:
        original.load()
        image = ImageOps.exif_transpose(original).convert("RGBA")
    image.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)
    background = Image.new("RGBA", image.size, (238, 242, 243, 255))
    background.alpha_composite(image)
    return background.convert("RGB")


def contact_sheet(specs: list[dict], destination: Path) -> None:
    sheet = Image.new("RGB", (5 * 284, 2 * 244), "white")
    draw = ImageDraw.Draw(sheet)
    for i, spec in enumerate(specs):
        image = thumbnail(spec["source"])
        x, y = (i % 5) * 284, (i // 5) * 244
        sheet.paste(image, (x + (284 - image.width) // 2, y + (208 - image.height) // 2))
        draw.text((x + 10, y + 214), spec["en"].replace("·", "-"), fill=(36, 52, 64))
    sheet.save(destination, "JPEG", quality=90)


def inline(text: str) -> str:
    text = html.escape(text, quote=True)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    text = re.sub(r"(?<![\w/])(INSTALL_(?:KO|EN)\.txt)(?![\w.])", r'<a href="\1">\1</a>', text)
    return text


def section_id(title: str) -> str:
    if title in ("주요 업데이트", "Main updates"):
        return "updates"
    if title in ("설치와 기존 저장", "Installation and existing saves"):
        return "installation"
    if title in ("확인 범위", "Verification scope"):
        return "verification"
    return "section-" + hashlib.sha256(title.encode()).hexdigest()[:10]


def markdown_to_html(markdown: str) -> str:
    lines = markdown.splitlines()
    output: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        heading = re.match(r"^(#{1,3})\s+(.+)$", line)
        if heading:
            level, title = len(heading[1]), heading[2]
            output.append(f'<h{level} id="{section_id(title)}">{inline(title)}</h{level}>')
            i += 1
            continue
        if line.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                cells = [cell.strip() for cell in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r":?-+:?", cell.replace(" ", "")) for cell in cells):
                    rows.append(cells)
                i += 1
            if not rows or any(len(row) != len(rows[0]) for row in rows):
                raise ValueError("Malformed Markdown table")
            output.append('<div class="table-wrap"><table><thead><tr>')
            output.extend(f'<th scope="col">{inline(cell)}</th>' for cell in rows[0])
            output.append("</tr></thead><tbody>")
            for row in rows[1:]:
                output.append("<tr>" + "".join(f"<td>{inline(cell)}</td>" for cell in row) + "</tr>")
            output.append("</tbody></table></div>")
            continue
        list_match = re.match(r"^(?:-\s+|\d+\.\s+)(.+)$", line)
        if list_match:
            ordered = bool(re.match(r"^\d+\.", line))
            tag = "ol" if ordered else "ul"
            output.append(f"<{tag}>")
            while i < len(lines):
                item = re.match(r"^(\d+\.|-)\s+(.+)$", lines[i].strip())
                if not item or item[1].endswith(".") != ordered:
                    break
                output.append(f"<li>{inline(item[2])}</li>")
                i += 1
            output.append(f"</{tag}>")
            continue
        paragraph = [line]
        i += 1
        while i < len(lines) and lines[i].strip() and not re.match(r"^(#{1,3}\s|\||-\s|\d+\.\s)", lines[i].strip()):
            paragraph.append(lines[i].strip())
            i += 1
        output.append("<p>" + inline(" ".join(paragraph)) + "</p>")
    return "\n".join(output)


def gallery(specs: list[dict], language: str) -> str:
    heading = "이미지 미리보기" if language == "ko" else "Image previews"
    intro = (
        "이번 패치에 쓰이는 현재 WORK 리소스의 축소 미리보기입니다. 실제 게임 화면을 촬영한 스크린샷은 아닙니다."
        if language == "ko" else
        "Small previews of current WORK resources used by this patch. These are image previews, not screenshots captured from the running game."
    )
    output = [f'<section aria-labelledby="previews"><h2 id="previews">{heading}</h2><p class="preview-intro">{intro}</p><div class="gallery">']
    for spec in specs:
        image = thumbnail(spec["source"])
        buffer = io.BytesIO()
        image.save(buffer, "WEBP", quality=84, method=6)
        payload = base64.b64encode(buffer.getvalue()).decode("ascii")
        caption = html.escape(spec[language])
        output.append(f'<figure><div class="thumb"><img src="data:image/webp;base64,{payload}" width="{image.width}" height="{image.height}" alt="{caption}"></div><figcaption>{caption}</figcaption></figure>')
    output.append("</div></section>")
    return "\n".join(output)


class HTMLChecks(HTMLParser):
    VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack: list[str] = []
        self.ids: set[str] = set()
        self.links: list[str] = []
        self.images: list[dict] = []
        self.external_loads: list[str] = []
        self.table_rows: list[list[int]] = []
        self.current_table: list[int] | None = None
        self.current_cells: int | None = None

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag in {"script", "iframe", "object", "embed", "link"}:
            raise ValueError(f"Unexpected dependency element: {tag}")
        if tag not in self.VOID:
            self.stack.append(tag)
        if "id" in attrs:
            if attrs["id"] in self.ids:
                raise ValueError(f"Duplicate ID: {attrs['id']}")
            self.ids.add(attrs["id"])
        if tag == "a":
            self.links.append(attrs["href"])
        for name in ("src", "srcset", "poster", "data"):
            if name in attrs and not attrs[name].startswith("data:"):
                self.external_loads.append(attrs[name])
        if tag == "img":
            assert attrs["src"].startswith("data:image/webp;base64,")
            data = base64.b64decode(attrs["src"].split(",", 1)[1], validate=True)
            with Image.open(io.BytesIO(data)) as image:
                image.load()
                assert image.width <= MAX_SIZE[0] and image.height <= MAX_SIZE[1]
                assert (image.width, image.height) == (int(attrs["width"]), int(attrs["height"]))
                self.images.append({"width": image.width, "height": image.height, "bytes": len(data), "alt": attrs["alt"]})
        if tag == "table":
            self.current_table = []
        if tag == "tr":
            self.current_cells = 0
        if tag in {"th", "td"}:
            assert self.current_cells is not None
            self.current_cells += 1

    def handle_endtag(self, tag):
        if tag not in self.VOID:
            if not self.stack or self.stack.pop() != tag:
                raise ValueError(f"Unbalanced HTML: {tag}")
        if tag == "tr":
            assert self.current_table is not None and self.current_cells is not None
            self.current_table.append(self.current_cells)
            self.current_cells = None
        if tag == "table":
            assert self.current_table and len(set(self.current_table)) == 1
            self.table_rows.append(self.current_table)
            self.current_table = None


def check_html(document: str, language: str) -> dict:
    check = HTMLChecks()
    check.feed(document)
    check.close()
    assert not check.stack
    assert len(check.images) == 10
    assert not check.external_loads
    assert len(check.table_rows) == 1
    assert not re.search(r"@import|url\s*\(|https?://|\b(?:TODO|TBD)\b", document, re.I)
    assert "INSTALL.cmd" in document and "game/json" in document
    assert not re.search(r"1448\.json|3003\.json|3026\.json|25 obsolete|25개|No installer|설치기 없는", document, re.I)
    expected = {"INSTALL_KO.txt", "INSTALL_EN.txt", "RELEASE_NOTES_KO.html", "RELEASE_NOTES_EN.html"}
    for href in check.links:
        if href.startswith("#"):
            assert href[1:] in check.ids, href
        else:
            assert href in expected, href
    assert len(re.findall(r"[가-힣]", document)) == 0 if language == "en" else True
    return {"status": "PASS", "externalLoads": 0, "embeddedImages": check.images, "tables": check.table_rows, "links": check.links}


def build(game: Path) -> dict:
    specs = preview_specs(game)
    report = {"sourceGame": str(game), "packaging": "Complete game/json folder; optional INSTALL.cmd or manual JSON-folder replacement", "previews": [], "documents": {}}
    for spec in specs:
        report["previews"].append({
            "source": str(spec["source"].relative_to(game)).replace("\\", "/"),
            "sourceSha256": hashlib.sha256(spec["source"].read_bytes()).hexdigest(),
            "definition": spec.get("definition"),
        })
    for language in ("ko", "en"):
        suffix = language.upper()
        markdown = (NOTES / f"RELEASE_NOTES_{suffix}.md").read_text(encoding="utf-8")
        body = markdown_to_html(markdown)
        title = markdown.splitlines()[0].removeprefix("# ")
        check_heading = '<h2 id="verification">'
        start = body.index(check_heading)
        body, verification = body[:start], body[start:]
        # Keep verification separate and concise at the bottom.
        body += gallery(specs, language)
        body += f'<aside class="verification" aria-labelledby="verification">{verification}</aside>'
        labels = ("업데이트", "이미지 미리보기", "설치 안내", "English", "오프라인 문서 · 2.4.1 필요") if language == "ko" else ("Updates", "Image previews", "Installation", "Korean notes", "Offline document · 2.4.1 required")
        other = "EN" if language == "ko" else "KO"
        document = f'''<!doctype html>
<html lang="{language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>{html.escape(title)}</title><style>{CSS}</style></head>
<body><main><nav aria-label="{'문서 메뉴' if language == 'ko' else 'Document navigation'}"><a href="#updates">{labels[0]}</a><a href="#previews">{labels[1]}</a><a href="#installation">{labels[2]}</a><a href="RELEASE_NOTES_{other}.html" lang="{'en' if language == 'ko' else 'ko'}">{labels[3]}</a></nav><p class="eyebrow">JACK O' NINE TAILS · KOREAN EDITION</p>{body}<footer>{labels[4]}</footer></main></body></html>
'''
        result = check_html(document, language)
        output = NOTES / f"RELEASE_NOTES_{suffix}.html"
        output.write_text(document, encoding="utf-8", newline="\n")
        report["documents"][output.name] = {"bytes": output.stat().st_size, "sha256": hashlib.sha256(output.read_bytes()).hexdigest(), **result}
    (NOTES / "html-check.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--game", type=Path, default=DEFAULT_GAME)
    parser.add_argument("--contact-sheet", type=Path, help="Create only a temporary visual-review contact sheet")
    arguments = parser.parse_args()
    if arguments.contact_sheet:
        contact_sheet(preview_specs(arguments.game), arguments.contact_sheet)
        print(arguments.contact_sheet)
    else:
        report = build(arguments.game)
        print(json.dumps({name: {"status": item["status"], "bytes": item["bytes"], "embeddedImages": len(item["embeddedImages"]), "externalLoads": item["externalLoads"]} for name, item in report["documents"].items()}, ensure_ascii=False, indent=2))
