# -*- coding: utf-8 -*-
"""
잭오나인테일즈(Jack O Nine Tails) 캐릭터 일러스트 추가 도구
=====================================================
무작위 노예 풀에 캐릭터 한 명을 통째로 추가한다.

한 번 "추가하기"를 누르면 아래를 전부 자동으로 처리한다.
  1) 전신 이미지  -> content/pic/girls/full/<번호>_<머리색>_<길이>_<나이>.png
  2) 얼굴(원본)   -> content/pic/girls/face/<같은이름>.png
  3) 얼굴 흑백     -> ..._gray.png   (자동 생성)
  4) 얼굴 세피아   -> ..._sepia.png  (자동 생성)
  5) 등록 데이터   -> json/slaves/<ID>.json
  6) 생성 범위     -> json/slave_index.json 의 <나이>_last 값 +1

Python 3 + Pillow(PIL) 필요. tkinter 는 파이썬 기본 포함.
이 파일은 game/picture_modding/ 안에 두고 실행하면 게임 경로를 자동으로 찾는다.
"""

import os
import re
import json
import shutil
import traceback
import io
import tempfile

from PIL import Image, ImageOps

# ---------------------------------------------------------------------------
# 상수 / 게임 규칙
# ---------------------------------------------------------------------------

HAIR_COLORS = ["black", "blond", "blue", "brown", "green", "pink", "purple", "red", "white"]
HAIR_LENGTHS = ["long", "short"]

# 나이 분류 -> (파일명 접미사, seed_age 코드, ID 밴드 시작번호, slave_index 키)
AGE_INFO = {
    "loli":  {"suffix": "loli",  "seed_age": 1, "band_first": 1,    "index_key": "loli_last"},
    "young": {"suffix": "young", "seed_age": 0, "band_first": 1001, "index_key": "young_last"},
    "milf":  {"suffix": "milf",  "seed_age": 2, "band_first": 2001, "index_key": "milf_last"},
}

# 조수(assistant) 대체 외형 슬롯: (json 필드, 라벨, girls/full 아래 하위폴더)
# 게임에서 조수 스탯 화면의 '외형' 버튼(알몸/하녀/도미나/비서)으로 전환된다.
OUTFITS = [
    ("fullmade", "하녀", "cloth"),
    ("fullmistress", "도미나", "mistress"),
    ("fullsecretary", "비서", "secretary"),
]

BOOBS_SIZES = ["0", "1", "2", "3", "4", "5"]
BOOBS_IMGS = ["boobs_A", "boobs_B", "boobs_BB", "boobs_C", "boobs_CC", "boobs_D",
              "boobs_DD", "boobs_E", "boobs_EE", "boobs_F", "boobs_FF", "boobs_G", "boobs_H"]
PUSSY_IMGS = ["pussy_l1", "pussy_l2", "pussy_l3", "pussy_m1", "pussy_m2", "pussy_m3",
              "pussy_g1", "pussy_g2", "pussy_g3"]

# 기존 이미지 표준 규격
FULL_SIZE = (795, 596)
FACE_SIZE = (151, 150)


# ---------------------------------------------------------------------------
# 경로 처리
# ---------------------------------------------------------------------------

def find_game_root(start=None):
    """picture_modding 의 부모(game 폴더)를 찾는다. 못 찾으면 None."""
    here = os.path.dirname(os.path.abspath(start or __file__))
    # 스크립트가 picture_modding 안에 있으면 부모가 game
    cand = os.path.dirname(here)
    if _looks_like_game_root(cand):
        return cand
    # 혹시 game 안에서 바로 실행한 경우
    if _looks_like_game_root(here):
        return here
    return None


def _looks_like_game_root(path):
    return (os.path.isdir(os.path.join(path, "content", "pic", "girls", "full"))
            and os.path.isdir(os.path.join(path, "json", "slaves")))


class GamePaths:
    def __init__(self, root):
        self.root = root
        self.girls_dir = os.path.join(root, "content", "pic", "girls")
        self.full_dir = os.path.join(root, "content", "pic", "girls", "full")
        self.face_dir = os.path.join(root, "content", "pic", "girls", "face")
        self.cloth_dir = os.path.join(root, "content", "pic", "girls", "full", "cloth")
        self.slaves_dir = os.path.join(root, "json", "slaves")
        self.index_file = os.path.join(root, "json", "slave_index.json")
        # 외형 하위폴더(하녀/도미나/비서)
        self.outfit_dirs = {
            sub: os.path.join(root, "content", "pic", "girls", "full", sub)
            for _f, _l, sub in OUTFITS
        }

    def outfit_dir(self, sub):
        return self.outfit_dirs[sub]


# ---------------------------------------------------------------------------
# 이미지 변환 (흑백 / 세피아) - 알파(투명) 보존
# ---------------------------------------------------------------------------

# 게임 고유의 흑백 공식. game/content/pic/girls/face 의 원본/gray 쌍을 역산한 결과이며
# 표준 luminosity(0.299/0.587/0.114) 가 아니라 아래 가중치를 쓴다 (평균오차 0.58).
# convert("L", 4-튜플)  ->  L = 0.4116*R + 0.1996*G + 0.3890*B - 0.78
GRAY_MATRIX = (0.4116, 0.1996, 0.3890, -0.78)


def _clamp8(v):
    return 0 if v < 0 else (255 if v > 255 else int(round(v)))


def _game_gray_L(img_rgba):
    """RGBA -> 게임 흑백 'L' 밴드."""
    r, g, b, _ = img_rgba.split()
    return Image.merge("RGB", (r, g, b)).convert("L", GRAY_MATRIX)


def to_grayscale(img):
    """RGBA 이미지를 게임과 동일한 흑백으로. 알파 채널 유지."""
    img = img.convert("RGBA")
    a = img.split()[3]
    gray = _game_gray_L(img)
    return Image.merge("RGBA", (gray, gray, gray, a))


# 게임 세피아 톤. 위 흑백값 gray 에 대해 (원본 gray/sepia 13.5만 픽셀 최소자승):
#   sepia_R = 1.0071*gray + 11.66   sepia_G = 0.9986*gray - 0.72   sepia_B = 0.9806*gray - 29.34
def to_sepia(img):
    """밝기 -> 세피아 톤. 알파 유지. 게임 기존 세피아와 동일한 곡선."""
    img = img.convert("RGBA")
    a = img.split()[3]
    gray = _game_gray_L(img)
    rr = gray.point(lambda v: _clamp8(1.0071 * v + 11.66))
    gg = gray.point(lambda v: _clamp8(0.9986 * v - 0.72))
    bb = gray.point(lambda v: _clamp8(0.9806 * v - 29.34))
    return Image.merge("RGBA", (rr, gg, bb, a))


def load_and_maybe_resize(path, size, do_resize):
    img = Image.open(path).convert("RGBA")
    if do_resize and img.size != size:
        img = img.resize(size, Image.LANCZOS)
    return img


# ---------------------------------------------------------------------------
# 누끼(배경 제거) - rembg 가 설치돼 있으면 사용. 애니 전용 모델 isnet-anime.
# ---------------------------------------------------------------------------

_rembg_session = None
_rembg_failed = False


def rembg_available():
    """rembg 를 쓸 수 있으면 True."""
    global _rembg_failed
    if _rembg_failed:
        return False
    try:
        from importlib.util import find_spec
        return find_spec("rembg") is not None
    except Exception:
        _rembg_failed = True
        return False


def remove_bg(img):
    """PIL 이미지의 배경을 제거해 투명 RGBA 로 반환. rembg 필요."""
    global _rembg_session
    from rembg import remove, new_session
    if _rembg_session is None:
        # 애니풍 캐릭터에 가장 깔끔한 모델
        _rembg_session = new_session("isnet-anime")
    out = remove(img.convert("RGBA"), session=_rembg_session)
    return out.convert("RGBA")


def compose_full(img, canvas=FULL_SIZE):
    """Finalize the whole source canvas proportionally, without cropping subjects.

    Called only after image processing; any leftover space is transparent.
    """
    im = _load_rgba(img)
    if im.size == canvas:
        return im
    resized = ImageOps.contain(im, canvas, method=Image.LANCZOS)
    out = Image.new("RGBA", canvas, (0, 0, 0, 0))
    out.paste(resized, ((canvas[0] - resized.width) // 2,
                       (canvas[1] - resized.height) // 2))
    return out


# ---------------------------------------------------------------------------
# ID 계산
# ---------------------------------------------------------------------------

def read_index(paths):
    with open(paths.index_file, "r", encoding="utf-8-sig") as f:
        return json.load(f)


def registry_next_id(paths, age):
    """
    새 슬레이브 ID = slave_index 의 <나이>_last + 1.
    json/slaves 레지스트리는 밴드 시작번호부터 _last 까지 빈틈없이 이어져 있어야 하며,
    _last+1 로 이어붙이면 연속성이 유지돼 게임이 절대 빈 ID 를 뽑지 않는다.
    (혹시 그 번호의 json 이 이미 있으면 비어있는 다음 번호까지 건너뛴다.)
    """
    info = AGE_INFO[age]
    idx = read_index(paths)
    last = int(idx.get(info["index_key"], info["band_first"] - 1))
    nid = last + 1
    while _character_json_matches(paths, nid):
        nid += 1
    return nid


UNIQUE_ID_FIRST = 2626   # 고유 캐릭터 자동 번호 시작 (랜덤 풀 밖, 기존 고유 캐릭터 2571~2625 이후)
UNIQUE_ID_LAST = 3000


def clean_unique_slug(text):
    """JSON 파일명에 붙일 영문 이름. 영문·숫자·밑줄·하이픈만 남긴다."""
    return re.sub(r"[^A-Za-z0-9_-]+", "", (text or "").strip().replace(" ", "_"))


STORY_FIELDS = [("world", "seed_world_description", "배경 이야기(세계·과거)"),
                ("family", "seed_family_description", "가족"),
                ("occupation", "seed_occupation_description", "직업·경력")]
STORY_MARK = "<!-- #nwtx -->"


def story_to_display(value):
    """JSON 문장 -> 편집창 문장. 끝의 #nwtx 표시를 떼고 <br> 을 줄바꿈으로 바꾼다."""
    text = (value or "")
    text = re.sub(r"<!--\s*#nwtx.*?-->\s*$", "", text, flags=re.S)
    return re.sub(r"<br\s*/?>", "\n", text).strip()


def story_from_display(text):
    """편집창 문장 -> JSON 문장. 줄바꿈은 <br>, 끝에는 #nwtx 표시를 붙인다."""
    text = (text or "").strip()
    if not text:
        return ""
    return re.sub(r"\s*\n\s*", "<br>", text) + STORY_MARK


def apply_story(data, story):
    """story = {"world":..., "family":..., "occupation":...}. 빈 칸은 건드리지 않는다."""
    out = dict(data)
    for key, field, _label in STORY_FIELDS:
        value = story_from_display((story or {}).get(key, ""))
        if value:
            out[field] = value
    return out


def plan_unique_id(paths, wanted=None):
    """고유 캐릭터 번호. 지정하면 그 번호(비어 있어야 함), 아니면 2626부터 빈 번호."""
    if wanted not in (None, ""):
        nid = int(wanted)
        if nid <= 0:
            raise ValueError("번호는 1 이상이어야 합니다.")
        if _character_json_matches(paths, nid):
            raise FileExistsError("이미 사용 중인 번호입니다: %d" % nid)
        return nid
    nid = UNIQUE_ID_FIRST
    while _character_json_matches(paths, nid):
        nid += 1
        if nid > UNIQUE_ID_LAST:
            raise ValueError("고유 캐릭터 자동 번호가 가득 찼습니다. 번호를 직접 지정하세요.")
    return nid


def pool_range_warning(paths, nid):
    """번호가 랜덤 등장 범위 안이면 경고 문구를 돌려준다."""
    idx = read_index(paths)
    for info in AGE_INFO.values():
        first, last = info["band_first"], int(idx.get(info["index_key"], info["band_first"] - 1))
        if first <= nid <= last:
            return "번호 %d 는 랜덤 등장 범위(%d~%d) 안이라 랜덤으로도 등장할 수 있습니다." % (nid, first, last)
    return ""


def free_file_prefix(paths, start, cat):
    """
    이미지 파일 접두번호. 보통은 ID 와 같지만, 등록 안 된 '고아 이미지'가 그 번호를
    이미 쓰고 있으면(같은 카테고리) 덮어쓰지 않도록 비어있는 다음 번호를 찾는다.
    """
    p = start
    while True:
        base = "%04d_%s" % (p, cat)
        clash = any(os.path.exists(os.path.join(d, base + suf + ".png"))
                    for d, suf in [(paths.full_dir, ""), (paths.face_dir, ""),
                                   (paths.face_dir, "_gray"), (paths.face_dir, "_sepia")])
        if not clash:
            return p
        p += 1


def plan_add(paths, age, color, length):
    """추가 계획을 계산한다. (새 ID, 이미지 접두번호, 파일 기본이름) 반환."""
    info = AGE_INFO[age]
    cat = "%s_%s_%s" % (color, length, info["suffix"])
    new_id = registry_next_id(paths, age)
    img_prefix = free_file_prefix(paths, new_id, cat)
    base = "%04d_%s" % (img_prefix, cat)
    return new_id, img_prefix, base, cat


# ---------------------------------------------------------------------------
# 외형(하녀/도미나/비서) 이미지 저장 + 기존 캐릭터 수정
# ---------------------------------------------------------------------------

OUTFIT_FIELD_TO_SUB = {field: sub for field, _lbl, sub in OUTFITS}
OUTFIT_LABELS = {field: lbl for field, lbl, _sub in OUTFITS}


def save_outfit_image(paths, field, base, src, resize_full=True, auto_cutout=False):
    """
    외형 이미지 한 장을 해당 폴더에 저장하고, json 에 넣을 경로문자열을 반환한다.
    src 는 파일경로 또는 PIL 이미지.
    """
    sub = OUTFIT_FIELD_TO_SUB[field]
    folder = paths.outfit_dir(sub)
    os.makedirs(folder, exist_ok=True)
    img = src if isinstance(src, Image.Image) else Image.open(src)
    img = img.convert("RGBA")
    if auto_cutout:
        img = remove_bg(img)
    if resize_full:
        img = compose_full(img)
    out_path = os.path.join(folder, base + ".png")
    img.save(out_path)
    # json 경로 규칙: content/pic 없음, 확장자 없음, 슬래시
    return "girls/full/%s/%s" % (sub, base)


def _character_json_matches(paths, sid):
    pattern = re.compile(r"^0*%d(?:_[^/\\]+)?\.json$" % int(sid), re.IGNORECASE)
    return sorted(os.path.join(paths.slaves_dir, name)
                  for name in os.listdir(paths.slaves_dir) if pattern.fullmatch(name))


def read_slave(paths, sid):
    matches = _character_json_matches(paths, sid)
    if not matches:
        raise FileNotFoundError("그 ID의 데이터 파일이 없습니다: %d" % int(sid))
    if len(matches) != 1:
        raise ValueError("같은 ID의 JSON이 여러 개 있습니다: " + ", ".join(os.path.basename(p) for p in matches))
    fn = matches[0]
    with open(fn, "r", encoding="utf-8-sig") as f:
        return json.load(f), fn


def slave_base_name(data):
    """슬레이브 json 의 fullimage 에서 파일 기본이름(예: 0001_black_long_loli)을 뽑는다."""
    fi = data.get("fullimage", "")
    return os.path.basename(fi.replace("\\", "/"))


def scan_characters(paths):
    """
    json/slaves 의 모든 캐릭터를 스캔해 목록을 만든다.
    각 항목: {id, base, color, length, age, face(파일경로), outfits(가진 외형 라벨 리스트)}
    """
    root = paths.root
    out = []
    for fn in os.listdir(paths.slaves_dir):
        m = re.match(r"^(\d+)(?:_[^/\\]+)?\.json$", fn, re.IGNORECASE)
        if not m:
            continue
        sid = int(m.group(1))
        if sid == 0:
            continue  # 0_template.json defines defaults, not a selectable character.
        try:
            with open(os.path.join(paths.slaves_dir, fn), "r", encoding="utf-8-sig") as f:
                data = json.load(f)
        except Exception:
            continue
        base = slave_base_name(data)
        ava = data.get("seed_ava_clear", "")
        if ava:
            face = _abs_from_gamepath(root, ava)
        else:
            face = os.path.join(paths.face_dir, base + ".png")
        parts = base.split("_")
        color = length = age = ""
        if len(parts) >= 4 and parts[0].isdigit():
            color, length, age = parts[1], parts[2], parts[3]
        if not age:
            age = {v["seed_age"]: k for k, v in AGE_INFO.items()}.get(data.get("seed_age"), "")
        if not color:
            color = str(data.get("seed_hair", "")).lower()
        have = [lbl for field, lbl, _s in OUTFITS if data.get(field)]
        out.append({"id": sid, "base": base, "color": color, "length": length,
                    "age": age, "face": face, "outfits": have,
                    "name": data.get("seed_name", ""), "json_file": fn})
    out.sort(key=lambda d: d["id"])
    return out


def add_outfits_to_existing(paths, sid, outfit_srcs, resize_full=True,
                            auto_cutout=False, log=print):
    """
    기존 캐릭터(ID)에 외형 이미지를 추가한다.
    outfit_srcs: {json필드: (파일경로 또는 PIL이미지)}  예 {'fullmade': 'a.png'}
    """
    data, fn = read_slave(paths, sid)
    base = slave_base_name(data)
    if not base:
        raise ValueError("이 캐릭터의 fullimage 경로가 비어 있어 기준 이름을 알 수 없습니다.")
    log("→ 대상: ID %d  (기준이름 %s)" % (int(sid), base))

    changed = False
    for field, src in outfit_srcs.items():
        if not src:
            continue
        path_str = save_outfit_image(paths, field, base, src, resize_full, auto_cutout)
        data[field] = path_str
        changed = True
        log("   [OK] %s 저장: %s.png  →  json.%s" % (OUTFIT_LABELS[field], path_str, field))

    if not changed:
        log("   추가할 외형 이미지가 없습니다.")
        return

    _save_slave_json(fn, data)
    log("   [OK] json 갱신 완료: json/slaves/%d.json\n" % int(sid))


def _save_slave_json(fn, data):
    """json 을 .bak 백업 후 저장."""
    backup = fn + ".bak"
    if not os.path.exists(backup):
        shutil.copy2(fn, backup)
    with open(fn, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)


def _abs_from_gamepath(root, gpath):
    """Resolve a JSON image reference without changing its name or directory."""
    if not gpath:
        raise ValueError("이미지 경로가 비어 있습니다.")
    gpath = gpath.replace("\\", "/")
    if gpath.startswith("content/pic/"):
        relative = gpath
    else:
        relative = "content/pic/" + gpath
    if not os.path.splitext(relative)[1]:
        relative += ".png"
    target = os.path.realpath(os.path.join(root, *relative.split("/")))
    base = os.path.realpath(root)
    if os.path.commonpath([base, target]) != base:
        raise ValueError("게임 폴더 밖의 이미지 경로에는 저장할 수 없습니다.")
    return target


def _rm(path, log=None):
    if path and os.path.exists(path):
        os.remove(path)
        if log:
            log("   [삭제] %s" % os.path.basename(path))


def band_and_key(sid):
    """ID -> (밴드명, slave_index 키, 밴드 시작번호). 풀 밴드가 아니면 (None,None,None)."""
    for age, info in AGE_INFO.items():
        first = info["band_first"]
        if first <= sid <= first + 999:
            return age, info["index_key"], first
    return None, None, None


def update_attributes(paths, sid, seed_boobs, boobs_img, pussy_img, log=print):
    """신체 정보(가슴 크기/이미지, 성기 이미지)만 수정."""
    data, fn = read_slave(paths, sid)
    data["seed_boobs"] = int(seed_boobs)
    data["seed_boobs_img"] = boobs_img
    data["seed_pussy_img"] = pussy_img
    _save_slave_json(fn, data)
    log("[OK] ID %d 신체 정보 수정됨 (가슴 %s/%s, 성기 %s)"
        % (int(sid), seed_boobs, boobs_img, pussy_img))


def replace_full(paths, sid, src, resize_full=True, auto_cutout=False, log=print):
    """전신만 교체하는 기존 호출도 실제 JSON 참조 경로를 사용한다."""
    return save_existing_character(paths, sid, full_path=src, resize_full=resize_full,
                                   auto_cutout=auto_cutout, log=log)


def replace_face(paths, sid, src, resize_face=True, log=print):
    """얼굴 3종을 각각의 JSON 참조 경로에 저장한다."""
    return save_existing_character(paths, sid, face_image=src, resize_face=resize_face, log=log)


def _load_rgba(source):
    if isinstance(source, Image.Image):
        return source.convert("RGBA").copy()
    with Image.open(source) as image:
        return image.convert("RGBA")


def _png_bytes(image):
    stream = io.BytesIO()
    image.save(stream, format="PNG")
    return stream.getvalue()


def _write_files_together(payloads):
    """Prepare every file first and restore previous bytes if a commit fails."""
    previous, staged, committed = {}, {}, []
    try:
        for target, content in payloads.items():
            if os.path.isfile(target):
                with open(target, "rb") as source:
                    previous[target] = source.read()
            else:
                previous[target] = None
            if content is None:
                continue
            os.makedirs(os.path.dirname(target), exist_ok=True)
            fd, temporary = tempfile.mkstemp(prefix=".jo9-edit-", suffix=".tmp", dir=os.path.dirname(target))
            staged[target] = temporary
            with os.fdopen(fd, "wb") as destination:
                destination.write(content)
        for target, content in payloads.items():
            if content is None:
                if os.path.exists(target):
                    os.remove(target)
            else:
                os.replace(staged[target], target)
            committed.append(target)
    except Exception:
        for target in reversed(committed):
            old = previous[target]
            if old is None:
                if os.path.exists(target):
                    os.remove(target)
            else:
                with open(target, "wb") as destination:
                    destination.write(old)
        raise
    finally:
        for temporary in staged.values():
            if os.path.exists(temporary):
                os.remove(temporary)


def save_existing_character(paths, sid, full_path=None, face_path=None, face_image=None,
                            attributes=None, outfits=None, resize_full=True,
                            resize_face=True, auto_cutout=False, log=print, dry_run=False,
                            identity=None):
    """Save one existing character without allocating IDs or changing pool bounds.

    identity = {"name": 표시 이름, "slug": 영문 파일 이름} 를 주면 고유 캐릭터처럼 seed_name 을 넣고
    JSON 을 <번호>_<영문이름>.json 으로 바꾼다. ID 와 랜덤 등장 범위는 바꾸지 않는다.
    """
    data, json_file = read_slave(paths, sid)
    new_json = json_file
    updated = dict(data)
    base = slave_base_name(data)
    if not base:
        raise ValueError("이 캐릭터의 전신 이미지 경로가 비어 있습니다.")
    payloads = {}
    image_targets = set()
    removed_outfit_targets = set()

    def add_image(target, image):
        key = os.path.normcase(os.path.abspath(target))
        if key in image_targets:
            raise ValueError("서로 다른 이미지 항목이 같은 저장 경로를 참조합니다: " + target)
        image_targets.add(key)
        payloads[target] = _png_bytes(image)

    def full_image(source):
        image = _load_rgba(source)
        if auto_cutout:
            image = remove_bg(image)
        if resize_full:
            image = compose_full(image)
        return image

    if full_path is not None:
        add_image(_abs_from_gamepath(paths.root, data["fullimage"]), full_image(full_path))
    if face_image is not None or face_path is not None:
        image = _load_rgba(face_image if face_image is not None else face_path)
        if resize_face and image.size != FACE_SIZE:
            image = image.resize(FACE_SIZE, Image.LANCZOS)
        for field, suffix, variant in [
            ("seed_ava_clear", "", image),
            ("seed_ava_gray", "_gray", to_grayscale(image)),
            ("seed_ava", "_sepia", to_sepia(image)),
        ]:
            reference = data.get(field) or "content/pic/girls/face/" + base + suffix
            updated[field] = reference
            add_image(_abs_from_gamepath(paths.root, reference), variant)
    for field, source in (outfits or {}).items():
        if field not in OUTFIT_FIELD_TO_SUB:
            raise ValueError("알 수 없는 복장 항목입니다: " + str(field))
        current = data.get(field)
        if source is None:
            if current:
                removed_outfit_targets.add(_abs_from_gamepath(paths.root, current))
            updated[field] = ""
        else:
            reference = current or "girls/full/%s/%s" % (OUTFIT_FIELD_TO_SUB[field], base)
            if current:
                current_target = _abs_from_gamepath(paths.root, current)
                other_targets = {
                    _abs_from_gamepath(paths.root, data[key])
                    for key in ["fullimage", "seed_ava_clear", "seed_ava_gray", "seed_ava", *OUTFIT_FIELD_TO_SUB]
                    if key != field and data.get(key)
                }
                if current_target in other_targets:
                    default = "girls/full/%s/%s" % (OUTFIT_FIELD_TO_SUB[field], base)
                    reference = default
                    number = 2
                    while (os.path.exists(_abs_from_gamepath(paths.root, reference))
                           or _abs_from_gamepath(paths.root, reference) in payloads):
                        reference = default + "_%d" % number
                        number += 1
            updated[field] = reference
            add_image(_abs_from_gamepath(paths.root, reference), full_image(source))
    remaining_references = {
        _abs_from_gamepath(paths.root, updated[field])
        for field in ["fullimage", "seed_ava_clear", "seed_ava_gray", "seed_ava", *OUTFIT_FIELD_TO_SUB,
                      "indpack_maid", "indpack_secr", "indpack_dom", "indpack_naked", "indpack_title"]
        if updated.get(field)
    }
    for target in removed_outfit_targets:
        if target not in remaining_references and target not in payloads:
            payloads[target] = None
    allowed = {"seed_boobs", "seed_boobs_img", "seed_pussy_img"}
    for field, value in (attributes or {}).items():
        if field not in allowed:
            raise ValueError("이 화면에서 바꿀 수 없는 속성입니다: " + str(field))
        updated[field] = int(value) if field == "seed_boobs" else str(value)
    if identity is not None:
        name = (identity.get("name") or "").strip()
        if name and updated.get("seed_name") != name:
            updated = dict([("seed_name", name)] + [(k, v) for k, v in updated.items() if k != "seed_name"])
        raw_slug = (identity.get("slug") or "").strip().replace(" ", "_")
        slug = clean_unique_slug(raw_slug)
        if slug != raw_slug:
            raise ValueError("파일 이름은 영문·숫자·밑줄·하이픈만 쓸 수 있습니다.")
        updated = apply_story(updated, identity.get("story"))
        if slug:
            wanted = os.path.join(paths.slaves_dir, "%d_%s.json" % (int(sid), slug))
            if os.path.normcase(wanted) != os.path.normcase(json_file):
                if os.path.exists(wanted):
                    raise FileExistsError("이미 있는 파일 이름입니다: " + os.path.basename(wanted))
                new_json = wanted
    if updated != data or new_json != json_file:
        with open(json_file, "rb") as source:
            original_json = source.read()
        if not os.path.exists(json_file + ".bak") and not os.path.exists(new_json + ".bak"):
            payloads[json_file + ".bak"] = original_json
        payloads[new_json] = json.dumps(updated, indent=4, ensure_ascii=False).encode("utf-8")
        if new_json != json_file:
            payloads[json_file] = None
    result = {"id": int(sid), "base": base, "json_file": new_json,
              "files": list(payloads), "dry_run": dry_run, "data": updated}
    if dry_run:
        log("[미리보기] ID %d · %d개 파일 변경 예정 (저장하지 않음)" % (int(sid), len(payloads)))
    elif payloads:
        _write_files_together(payloads)
        log("[OK] ID %d 저장 완료 · 전신/얼굴/선택 복장을 기존 경로에 반영했습니다." % int(sid))
    else:
        log("변경할 내용이 없습니다.")
    return result


def remove_outfit(paths, sid, field, log=print):
    """외형(하녀/도미나/비서) 하나 제거: 이미지 삭제 + json 필드 비움."""
    data, fn = read_slave(paths, sid)
    gpath = data.get(field, "")
    if gpath:
        _rm(_abs_from_gamepath(paths.root, gpath), log)
    data[field] = ""
    _save_slave_json(fn, data)
    log("[OK] ID %d 외형 '%s' 제거됨" % (int(sid), OUTFIT_LABELS[field]))


def _band_json_ids(paths, first):
    """밴드(first~first+999) 안에 존재하는 json ID 목록."""
    out = []
    for f in os.listdir(paths.slaves_dir):
        m = re.match(r"^(\d+)(?:_[^/\\]+)?\.json$", f, re.IGNORECASE)
        if m:
            n = int(m.group(1))
            if first <= n <= first + 999:
                out.append(n)
    return sorted(out)


def _save_index(paths, idx):
    backup = paths.index_file + ".bak"
    if not os.path.exists(backup):
        shutil.copy2(paths.index_file, backup)
    with open(paths.index_file, "w", encoding="utf-8") as f:
        json.dump(idx, f, indent=2, ensure_ascii=False)


def delete_character(paths, sid, mode="safe", log=print):
    """
    캐릭터 삭제. mode:
      'safe'  (기본) : 다른 캐릭터 번호를 절대 바꾸지 않는다(세이브 안전).
                       - 맨끝 번호면 완전 제거하고 _last 를 실제 최대값으로 줄임.
                       - 중간 번호면 이미지만 지우고 그 슬롯을 바로 옆 캐릭터 데이터로
                         덮어써 '빈 노예'가 생기지 않게 한다(번호/세이브 안전).
      'swap'         : 맨끝 캐릭터를 빈 자리로 옮기고 _last 를 1 줄인다.
                       (풀 크기가 실제로 줄지만 '맨끝 ID' 하나가 바뀌므로 세이브 주의)
    """
    sid = int(sid)
    data, fn = read_slave(paths, sid)
    root = paths.root

    band, key, first = band_and_key(sid)
    idx = read_index(paths) if band is not None else None
    last = int(idx.get(key, first - 1)) if idx is not None else None
    if band is not None and not first <= sid <= last:
        band = None  # Fixed presets outside the registered random pool have no pool slot.
    references = character_image_references(data)
    ref_index = build_ref_index(paths, physical=True)
    # 다른 ID의 어느 역할에서든 쓰는 이미지는 보존하고 이 캐릭터의 데이터만 제거한다.
    for reference in references:
        users = ref_index.get(_image_path_key(paths, reference), set()) - {sid}
        target = _abs_from_gamepath(root, reference)
        if users:
            log("   [공유 보존] %s · ID %s" % (os.path.basename(target), ", ".join(str(n) for n in sorted(users))))
        else:
            _rm(target, log)

    # 프리셋(풀 밖) 또는 밴드 판별 불가 -> json 만 지우면 끝
    if band is None:
        _rm(fn, log)
        log("[OK] ID %d 삭제 완료\n" % sid)
        return

    ids = [n for n in _band_json_ids(paths, first) if n <= last]
    is_end = (sid == max(ids)) if ids else True

    if mode == "swap" and not is_end:
        # 맨끝을 빈자리로 이동 (번호 바뀜)
        _rm(fn, log)
        _last_data, src = read_slave(paths, last)
        if os.path.exists(src):
            os.rename(src, fn)
            log("   [번호이동] 맨끝 ID %d -> %d" % (last, sid))
        new_ids = [n for n in ids if n not in (sid, last)] + [sid]
        idx[key] = max(new_ids) if new_ids else first - 1
        _save_index(paths, idx)
        log("   [OK] %s -> %d" % (key, idx[key]))

    elif is_end:
        # 맨끝 삭제: 완전 제거 + _last 를 남은 최대값으로
        _rm(fn, log)
        remain = [n for n in ids if n != sid]
        idx[key] = max(remain) if remain else first - 1
        _save_index(paths, idx)
        log("   [OK] 맨끝 삭제, %s -> %d" % (key, idx[key]))

    else:
        # 중간 삭제(안전): 슬롯을 옆 캐릭터 데이터로 덮어써 빈 노예 방지 (번호 안 바뀜)
        neighbor = None
        for cand in (sid - 1, sid + 1):
            if first <= cand <= last and _character_json_matches(paths, cand):
                neighbor = cand
                break
        if neighbor is None:
            others = [n for n in ids if n != sid]
            neighbor = others[0] if others else None
        if neighbor is not None:
            ndata, _neighbor_file = read_slave(paths, neighbor)
            with open(fn, "w", encoding="utf-8") as f:
                json.dump(ndata, f, indent=4, ensure_ascii=False)
            log("   [빈자리 처리] %d번 슬롯을 %d번 데이터로 채움 (번호/세이브 안전, 빈 노예 없음)"
                % (sid, neighbor))
        else:
            _rm(fn, log)  # 이웃이 없으면 그냥 gap
            log("   [주의] 채울 이웃이 없어 %d번은 빈 번호가 됨" % sid)
    log("[OK] ID %d 삭제 완료\n" % sid)


# ---------------------------------------------------------------------------
# 핵심: 캐릭터 추가
# ---------------------------------------------------------------------------

def add_character(paths, full_path, face_path, color, length, age,
                  seed_boobs, boobs_img, pussy_img,
                  resize_full=True, resize_face=True,
                  register_pool=True, outfits=None,
                  auto_cutout=False, face_image=None, log=print, dry_run=False,
                  unique=None, title=None):
    """캐릭터 한 명을 추가한다. 성공 시 생성 정보 dict 반환.

    unique 를 주면 고유 캐릭터로 추가한다(랜덤 등장 풀에 등록하지 않음).
      unique = {"name": 표시 이름(seed_name), "slug": 영문 파일 이름, "id": 번호 또는 빈 값}
    JSON 은 <번호>_<영문이름>.json 으로 저장하고 seed_name 을 넣는다.

    face_image 를 주면(PIL 이미지) face_path 대신 그 이미지를 얼굴로 쓴다.
    (전신에서 얼굴 영역을 잘라온 경우에 사용)
    """

    info = AGE_INFO[age]
    new_id, img_prefix, base, cat = plan_add(paths, age, color, length)
    json_name = "%d.json" % new_id
    if unique is not None:
        raw_slug = (unique.get("slug") or "").strip().replace(" ", "_")
        slug = clean_unique_slug(raw_slug)
        if slug != raw_slug:
            raise ValueError("파일 이름은 영문·숫자·밑줄·하이픈만 쓸 수 있습니다.")
        new_id = plan_unique_id(paths, unique.get("id"))
        img_prefix = free_file_prefix(paths, new_id, cat)
        base = "%04d_%s" % (img_prefix, cat)
        json_name = "%d_%s.json" % (new_id, slug) if slug else "%d.json" % new_id
        register_pool = False
        warn = pool_range_warning(paths, new_id)
        if warn:
            log("   [주의] " + warn)

    full_out = os.path.join(paths.full_dir, base + ".png")
    face_clear = os.path.join(paths.face_dir, base + ".png")
    face_gray = os.path.join(paths.face_dir, base + "_gray.png")
    face_sepia = os.path.join(paths.face_dir, base + "_sepia.png")
    json_out = os.path.join(paths.slaves_dir, json_name)

    # 충돌 방지 (plan_add 가 비어있는 번호를 골라주므로 정상적으로는 걸리지 않음)
    for p in (full_out, face_clear, face_gray, face_sepia, json_out):
        if os.path.exists(p):
            raise FileExistsError("이미 존재하는 파일과 충돌: %s" % p)

    if img_prefix == new_id:
        log("-> 새 ID: %d   (파일 이름: %s)%s" % (new_id, base,
            "  [고유 캐릭터: %s]" % json_name if unique is not None else ""))
    else:
        log("-> 새 ID: %d   (그 번호 이미지가 이미 있어 파일은 %04d 번으로 저장: %s)"
            % (new_id, img_prefix, base))

    if dry_run:
        log("   [미리보기] 실제로 파일을 만들지는 않았습니다.")
        return {"id": new_id, "base": base, "cat": cat,
                "files": [full_out, face_clear, face_gray, face_sepia, json_out], "dry_run": True}

    written = []
    # 1) 원본 구도에서 배경을 제거하고, 저장 직전에만 전체 크기를 맞춘다.
    full_src = _load_rgba(full_path)
    if auto_cutout:
        log("   ... 배경 제거(누끼) 중 (처음엔 모델 로딩으로 조금 걸립니다)")
        full_src = remove_bg(full_src)
    full_img = compose_full(full_src) if resize_full else full_src
    full_img.save(full_out)
    written.append(full_out)
    log("   [OK] 전신 저장: full/%s.png  (%dx%d)" % (base, *full_img.size))

    # 2~4) 얼굴 3종 (face_image 를 주면 그걸, 아니면 face_path 파일을 사용)
    if face_image is not None:
        face_img = face_image.convert("RGBA")
        if resize_face and face_img.size != FACE_SIZE:
            face_img = face_img.resize(FACE_SIZE, Image.LANCZOS)
    else:
        face_img = load_and_maybe_resize(face_path, FACE_SIZE, resize_face)
    face_img.save(face_clear)
    to_grayscale(face_img).save(face_gray)
    to_sepia(face_img).save(face_sepia)
    written += [face_clear, face_gray, face_sepia]
    log("   [OK] 얼굴 저장: face/%s.png + _gray + _sepia  (%dx%d)" % (base, *face_img.size))

    # 선택: 외형(하녀/도미나/비서) 이미지
    outfit_fields = {"fullmade": "", "fullmistress": "", "fullsecretary": ""}
    for field, src in (outfits or {}).items():
        if src:
            outfit_fields[field] = save_outfit_image(paths, field, base, src,
                                                     resize_full, auto_cutout)
            written.append(_abs_from_gamepath(paths.root, outfit_fields[field]))
            log("   [OK] %s 저장: %s.png" % (OUTFIT_LABELS[field], outfit_fields[field]))
    title_ref = ""
    if title is not None:
        # 전용 번호 폴더가 없는 새 캐릭터의 타이틀(옷 입은 모습)은 characters/ 폴더에 둔다.
        title_stem = base
        if unique is not None and clean_unique_slug(unique.get("slug")):
            title_stem = "%d_%s" % (new_id, clean_unique_slug(unique.get("slug")))
        title_ref = _free_reference(paths, "%s/%s_title" % (CHARACTERS_DIR_NAME, title_stem), set())
        title_target = _abs_from_gamepath(paths.root, title_ref)
        os.makedirs(os.path.dirname(title_target), exist_ok=True)
        _load_rgba(title).save(title_target)
        written.append(title_target)
        log("   [OK] 타이틀 저장: %s.png" % title_ref)

    # 5) json/slaves/<ID>.json  (경로 규칙에 주의: fullimage는 content/pic 없음, seed_ava는 있음)
    data = {
        "fullimage": "girls/full/%s" % base,
        "fullmade": outfit_fields["fullmade"],
        "fullmistress": outfit_fields["fullmistress"],
        "fullsecretary": outfit_fields["fullsecretary"],
        "seed_ava": "content/pic/girls/face/%s_sepia" % base,
        "seed_ava_gray": "content/pic/girls/face/%s_gray" % base,
        "seed_ava_clear": "content/pic/girls/face/%s" % base,
        "seed_age": info["seed_age"],
        "seed_boobs": int(seed_boobs),
        "seed_boobs_img": boobs_img,
        "seed_pussy_img": pussy_img,
        "seed_psy_basic": "",
        "seed_world": "",
    }
    if title_ref:
        data["indpack_title"] = title_ref
        data["indpack_naked"] = data["fullimage"]   # 타이틀이 있으면 알몸 필드도 채운다(체크리스트와 같은 규칙)
    if unique is not None and (unique.get("name") or "").strip():
        data = dict([("seed_name", unique["name"].strip())] + list(data.items()))
    if unique is not None:
        data = apply_story(data, unique.get("story"))
    with open(json_out, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    written.append(json_out)
    log("   [OK] 데이터 저장: json/slaves/%s" % json_name)

    # 6) slave_index.json 갱신 (백업 후)
    if register_pool:
        idx = read_index(paths)
        old = idx.get(info["index_key"])
        if new_id > int(old):
            backup = paths.index_file + ".bak"
            if not os.path.exists(backup):
                shutil.copy2(paths.index_file, backup)
            idx[info["index_key"]] = new_id
            with open(paths.index_file, "w", encoding="utf-8") as f:
                json.dump(idx, f, indent=2, ensure_ascii=False)
            written.append(paths.index_file)
            log("   [OK] 생성범위 갱신: %s  %s -> %d  (랜덤 등장 대상)" % (info["index_key"], old, new_id))
        else:
            log("   -  생성범위는 이미 %d 이상이라 그대로 둠" % new_id)
    else:
        log("   -  생성범위 미갱신 (랜덤 풀 등록 안 함)")

    log("완료! ID %d (%s) 추가됨.\n" % (new_id, cat))
    return {"id": new_id, "base": base, "cat": cat, "json": json_name, "files": written, "data": data,
            "json_file": json_out, "dry_run": False}


# ---------------------------------------------------------------------------
# 슬롯(기본·타이틀·복장) 저장 규칙 · 이미지 공유 · 복제   (2026-11-10)
# 폴더 규칙은 docs/modding/IMAGE_NAMING_RULES_KO.md (사용자 확정 2026-11-09)를 따른다.
# ---------------------------------------------------------------------------

import copy

# (슬롯, 라벨, 가능한 JSON 필드(옛 필드 먼저), 역할 이름)
SLOTS = [
    ("base", "기본(알몸)", ("fullimage", "indpack_naked"), "naked"),
    ("title", "타이틀(옷 입은 모습)", ("indpack_title",), "title"),
    ("maid", "하녀", ("fullmade", "indpack_maid"), "maid"),
    ("secr", "비서", ("fullsecretary", "indpack_secr"), "secr"),
    ("dom", "도미나", ("fullmistress", "indpack_dom"), "dom"),
]
SLOT_LABELS = {key: label for key, label, _f, _r in SLOTS}
SLOT_FIELDS = {key: fields for key, _l, fields, _r in SLOTS}
SLOT_ROLE = {key: role for key, _l, _f, role in SLOTS}
IMAGE_FIELDS = ("fullimage", "fullmade", "fullmistress", "fullsecretary", "seed_ava", "seed_ava_gray",
                "seed_ava_clear", "indpack_maid", "indpack_secr", "indpack_dom", "indpack_naked", "indpack_title")
OUTFIT_SUBFOLDER = {"maid": "cloth", "secr": "secretary", "dom": "mistress"}
CHARACTERS_DIR_NAME = "characters"


def is_dedicated(paths, sid):
    """전용 번호 폴더(girls/full|face|sex_scenes/<번호>) 가 하나라도 실제로 있으면 True."""
    sid = int(sid)
    return any(os.path.isdir(os.path.join(paths.girls_dir, *part, str(sid)))
               for part in (("full",), ("face",), ("sex_scenes",)))


def _norm_ref(reference):
    text = (reference or "").replace("\\", "/")
    if text.startswith("content/pic/"):
        text = text[len("content/pic/"):]
    return os.path.splitext(text)[0].lower() if os.path.splitext(text)[1].lower() in (".png", ".gif", ".jpg") else text.lower()


def character_image_references(data):
    """모든 외형·초상 참조와 기존 기본 초상 경로를 중복 없이 돌려준다."""
    references = [data[field] for field in IMAGE_FIELDS if isinstance(data.get(field), str) and data[field]]
    base = slave_base_name(data)
    if base:
        for field, suffix in (("seed_ava_clear", ""), ("seed_ava_gray", "_gray"), ("seed_ava", "_sepia")):
            if not data.get(field):
                references.append("content/pic/girls/face/" + base + suffix)
    return list(dict.fromkeys(references))


def _image_path_key(paths, reference):
    """같은 실제 파일을 가리키는 표기 차이는 삭제 판단에서 하나로 취급한다."""
    return os.path.normcase(_abs_from_gamepath(paths.root, reference))


def build_ref_index(paths, physical=False):
    """모든 캐릭터 JSON 의 이미지 참조(또는 실제 경로) -> 그 참조를 쓰는 ID 집합."""
    index = {}
    for name in os.listdir(paths.slaves_dir):
        match = re.match(r"^(\d+)(?:_[^/\\]+)?\.json$", name, re.IGNORECASE)
        if not match:
            continue
        try:
            with open(os.path.join(paths.slaves_dir, name), "r", encoding="utf-8-sig") as stream:
                data = json.load(stream)
        except (OSError, ValueError):
            continue
        for reference in character_image_references(data):
            key = _image_path_key(paths, reference) if physical else _norm_ref(reference)
            index.setdefault(key, set()).add(int(match.group(1)))
    return index


def shared_image_users(paths, sid, data=None):
    """이 ID의 모든 외형·초상 중 하나라도 함께 쓰는 다른 ID 목록."""
    if data is None:
        data, _filename = read_slave(paths, sid)
    index = build_ref_index(paths, physical=True)
    users = set()
    for reference in character_image_references(data):
        users.update(index.get(_image_path_key(paths, reference), set()))
    return sorted(users - {int(sid)})


def slot_reference(data, slot, dedicated):
    """현재 JSON 에서 이 슬롯이 쓰는 (필드, 참조). 없으면 (None, None). 전용 폴더 캐릭터는 indpack 필드를 우선."""
    fields = SLOT_FIELDS[slot]
    # 체크리스트와 같은 기준: 기본 전신은 알몸 필드(indpack_naked)를 우선한다. 전용 폴더 캐릭터는 indpack 필드 우선.
    ordered = tuple(reversed(fields)) if (dedicated or slot == "base") else fields
    for field in ordered:
        if data.get(field):
            return field, data[field]
    return None, None


def slot_default_target(paths, sid, data, slot, base):
    """아직 연결 안 된 슬롯의 새 저장 위치 (필드, 참조). 확정된 폴더 규칙을 따른다."""
    role = SLOT_ROLE[slot]
    fields = SLOT_FIELDS[slot]
    if is_dedicated(paths, sid):
        field = fields[-1]
        return field, "girls/full/%d/%d_full_%s" % (int(sid), int(sid), role)
    if slot == "base":
        return "fullimage", "girls/full/%s" % base
    if slot == "title":
        return "indpack_title", "%s/%s_title" % (CHARACTERS_DIR_NAME, base)
    return fields[0], "girls/full/%s/%s" % (OUTFIT_SUBFOLDER[slot], base)


def rule_warning(paths, sid, slot, reference, dedicated=None):
    """참조 경로가 폴더 규칙과 다르면 안내 문구, 맞으면 빈 문자열. 저장은 막지 않는다."""
    if not reference:
        return ""
    ref = reference.replace("\\", "/")
    if ref.startswith("content/pic/"):
        ref = ref[len("content/pic/"):]
    dedicated = is_dedicated(paths, sid) if dedicated is None else dedicated
    if dedicated:
        ok = ref.startswith("girls/full/%d/" % int(sid))
        wanted = "girls/full/%d/" % int(sid)
    elif slot == "base":
        ok = ref.startswith("girls/full/") and ref.count("/") == 2
        wanted = "girls/full/"
    elif slot == "title":
        ok = ref.startswith(CHARACTERS_DIR_NAME + "/")
        wanted = CHARACTERS_DIR_NAME + "/"
    else:
        subs = {"cloth", "maid"} if slot == "maid" else {OUTFIT_SUBFOLDER[slot]}
        ok = any(ref.startswith("girls/full/%s/" % s) for s in subs)
        wanted = "girls/full/%s/" % OUTFIT_SUBFOLDER[slot]
    return "" if ok else "%s → 권장 %s" % (reference, wanted)


def _free_reference(paths, reference, taken):
    """저장 대상 참조가 이미 있거나 이번 저장에서 쓰이면 _2, _3 을 붙여 비어 있는 이름을 찾는다."""
    candidate, number = reference, 2
    while os.path.exists(_abs_from_gamepath(paths.root, candidate)) or _abs_from_gamepath(paths.root, candidate) in taken:
        candidate = "%s_%d" % (reference, number)
        number += 1
    return candidate


def link_semantics(data, updated, slot, field, reference):
    """체크리스트(character-image-links.cjs)와 같은 연결 규칙.
    - 기본 전신을 바꾸면 fullimage 와 (있으면) indpack_naked 를 같은 경로로 맞추고, 타이틀이 옛 fullimage 와 같았다면 따라간다.
    - 타이틀을 지정할 때 indpack_naked 가 없으면 현재 기본 전신으로 채운다(옷을 벗었을 때 옷 입은 그림이 나오지 않게).
    """
    if slot == "base":
        updated["fullimage"] = reference
        if "indpack_naked" in data or field == "indpack_naked":
            updated["indpack_naked"] = reference
        old_full = data.get("fullimage")
        if isinstance(data.get("indpack_title"), str) and data.get("indpack_title") and data.get("indpack_title") == old_full:
            updated["indpack_title"] = reference
    elif slot == "title":
        if not updated.get("indpack_naked") and updated.get("fullimage"):
            updated["indpack_naked"] = updated["fullimage"]


def stat_keys(data):
    """능력치 편집 대상: 정수 값을 가진 seed_* 항목 중 외모·나이 같은 분류값은 제외."""
    skip = {"seed_age", "seed_boobs", "seed_hair", "seed_world", "seed_psy_basic"}
    return sorted(k for k, v in data.items()
                  if k.startswith("seed_") and isinstance(v, int) and not isinstance(v, bool) and k not in skip)


def save_character_slots(paths, sid, slot_images=None, face_image=None, attributes=None,
                         identity=None, log=print, dry_run=False, fix_json=None):
    """기존 캐릭터의 슬롯 이미지(이미 795x596 으로 맞춘 PIL 이미지)와 얼굴을 저장한다.

    slot_images = {슬롯: PIL 이미지 | None(연결 해제)}.  슬롯 키는 SLOTS 참조.
    이미 연결된 슬롯은 같은 경로에서 교체하고, 연결 안 된 슬롯은 폴더 규칙에 맞는 새 경로를 만든다.
    같은 경로를 다른 역할이 함께 쓰고 있으면(공유 사본) 덮어쓰지 않고 새 경로를 만든다.
    반환: {"id", "files"(전체 경로 목록), "data"(저장될 JSON), "before", "targets", "warnings", "shared_with", "preserved_shared_with"}
    """
    data, json_file = read_slave(paths, sid)
    before = copy.deepcopy(data)
    updated = dict(data)
    base = slave_base_name(data) or ("%04d_%s" % (int(sid), "char"))
    dedicated = is_dedicated(paths, sid)
    payloads, taken, targets, warnings = {}, set(), {}, []
    ref_index = build_ref_index(paths, physical=True)
    shared_with = set()
    preserved_shared_with = set()
    removed = {}

    def put(target, image):
        key = os.path.normcase(os.path.abspath(target))
        if key in taken:
            raise ValueError("서로 다른 이미지 항목이 같은 저장 경로를 참조합니다: " + target)
        taken.add(key)
        payloads[target] = _png_bytes(image)

    other_refs = lambda skip_fields: {_abs_from_gamepath(paths.root, data[f]) for f in IMAGE_FIELDS
                                      if f not in skip_fields and data.get(f)}
    for slot, image in (slot_images or {}).items():
        if slot not in SLOT_FIELDS:
            raise ValueError("알 수 없는 슬롯입니다: " + str(slot))
        field, reference = slot_reference(data, slot, dedicated)
        if image is None:
            if reference:
                removed[_abs_from_gamepath(paths.root, reference)] = reference
                for f in SLOT_FIELDS[slot]:
                    updated[f] = ""
                targets[slot] = None
            continue
        if reference:
            current = _abs_from_gamepath(paths.root, reference)
            if current in other_refs(set(SLOT_FIELDS[slot])):
                field, reference = slot_default_target(paths, sid, data, slot, base)
                reference = _free_reference(paths, reference, taken)
                warnings.append("%s: 다른 역할과 같은 파일을 쓰고 있어 새 경로 %s 에 저장합니다." % (SLOT_LABELS[slot], reference))
            else:
                users = ref_index.get(_image_path_key(paths, reference), set()) - {int(sid)}
                if users:
                    shared_with |= users
        else:
            field, reference = slot_default_target(paths, sid, data, slot, base)
            reference = _free_reference(paths, reference, taken)
        updated[field] = reference
        link_semantics(data, updated, slot, field, reference)
        targets[slot] = reference
        put(_abs_from_gamepath(paths.root, reference), image.convert("RGBA"))
        note = rule_warning(paths, sid, slot, reference, dedicated)
        if note:
            warnings.append("%s 경로 규칙: %s" % (SLOT_LABELS[slot], note))

    if face_image is not None:
        face = face_image.convert("RGBA")
        if face.size != FACE_SIZE:
            face = face.resize(FACE_SIZE, Image.LANCZOS)
        for field, suffix, variant in (("seed_ava_clear", "", face), ("seed_ava_gray", "_gray", to_grayscale(face)),
                                       ("seed_ava", "_sepia", to_sepia(face))):
            if data.get(field):
                reference = data[field]
            elif dedicated:
                reference = "content/pic/girls/face/%d/%d_face%s" % (int(sid), int(sid), suffix)
            else:
                reference = "content/pic/girls/face/" + base + suffix
            updated[field] = reference
            put(_abs_from_gamepath(paths.root, reference), variant)
            users = ref_index.get(_image_path_key(paths, reference), set()) - {int(sid)}
            if users:
                shared_with |= users

    for key, value in (attributes or {}).items():
        if key not in {"seed_boobs", "seed_boobs_img", "seed_pussy_img"}:
            raise ValueError("이 화면에서 바꿀 수 없는 속성입니다: " + str(key))
        updated[key] = int(value) if key == "seed_boobs" else str(value)

    new_json = json_file
    if identity is not None:
        name = (identity.get("name") or "").strip()
        if name and updated.get("seed_name") != name:
            updated = dict([("seed_name", name)] + [(k, v) for k, v in updated.items() if k != "seed_name"])
        raw_slug = (identity.get("slug") or "").strip().replace(" ", "_")
        slug = clean_unique_slug(raw_slug)
        if slug != raw_slug:
            raise ValueError("파일 이름은 영문·숫자·밑줄·하이픈만 쓸 수 있습니다.")
        updated = apply_story(updated, identity.get("story"))
        if slug:
            wanted = os.path.join(paths.slaves_dir, "%d_%s.json" % (int(sid), slug))
            if os.path.normcase(wanted) != os.path.normcase(json_file):
                if os.path.exists(wanted):
                    raise FileExistsError("이미 있는 파일 이름입니다: " + os.path.basename(wanted))
                new_json = wanted

    remaining = {_image_path_key(paths, updated[f]) for f in IMAGE_FIELDS if updated.get(f)}
    for target, reference in removed.items():
        users = ref_index.get(_image_path_key(paths, reference), set()) - {int(sid)}
        preserved_shared_with.update(users)
        if _image_path_key(paths, reference) not in remaining and target not in payloads and not users:
            payloads[target] = None
    if updated != data or new_json != json_file:
        with open(json_file, "rb") as source:
            original_json = source.read()
        if not os.path.exists(json_file + ".bak") and not os.path.exists(new_json + ".bak"):
            payloads[json_file + ".bak"] = original_json
        payloads[new_json] = json.dumps(updated, indent=4, ensure_ascii=False).encode("utf-8")
        if new_json != json_file:
            payloads[json_file] = None
    result = {"id": int(sid), "base": base, "json_file": new_json, "files": list(payloads), "dry_run": dry_run,
              "data": updated, "before": before, "targets": targets, "warnings": warnings,
              "shared_with": sorted(shared_with), "preserved_shared_with": sorted(preserved_shared_with), "dedicated": dedicated}
    if dry_run:
        log("[미리보기] ID %d · %d개 파일 변경 예정 (저장하지 않음)" % (int(sid), len(payloads)))
    elif payloads:
        _write_files_together(payloads)
        log("[OK] ID %d 저장 완료 · %d개 파일" % (int(sid), len(payloads)))
    else:
        log("변경할 내용이 없습니다.")
    for note in warnings:
        log("   [주의] " + note)
    if shared_with and not dry_run:
        log("   [공유] 같은 이미지를 쓰는 다른 캐릭터: " + ", ".join(str(x) for x in sorted(shared_with)))
    if preserved_shared_with and not dry_run:
        log("   [공유 보존] PNG는 유지하고 이 캐릭터의 연결만 해제했습니다. 다른 ID: " + ", ".join(str(x) for x in sorted(preserved_shared_with)))
    return result


def clone_character(paths, src_sid, name=None, slug="", new_id=None, story=None, seed_overrides=None,
                    slot_images=None, face_image=None, log=print, dry_run=False):
    """기존 캐릭터를 새 번호로 복제한다. 이미지·외모·설정은 원본과 같은 경로를 그대로 공유하고,
    표시 이름·배경 이야기·능력치(seed_*)만 따로 고친다. 랜덤 등장 풀에는 넣지 않는다.

    slot_images/face_image 를 주면 그 슬롯만 복제본 전용 새 파일(폴더 규칙 경로)로 저장해 공유를 끊는다.
    원본 JSON·이미지는 바꾸지 않는다.
    """
    data, _src_file = read_slave(paths, src_sid)
    raw_slug = (slug or "").strip().replace(" ", "_")
    clean = clean_unique_slug(raw_slug)
    if clean != raw_slug:
        raise ValueError("파일 이름은 영문·숫자·밑줄·하이픈만 쓸 수 있습니다.")
    nid = plan_unique_id(paths, new_id)
    new = copy.deepcopy(data)
    if (name or "").strip():
        new = dict([("seed_name", name.strip())] + [(k, v) for k, v in new.items() if k != "seed_name"])
    new = apply_story(new, story)
    allowed = set(stat_keys(data))
    for key, value in (seed_overrides or {}).items():
        if key not in allowed:
            raise ValueError("복제본에서 바꿀 수 없는 능력치 항목입니다: " + str(key))
        new[key] = int(value)
    payloads, taken, warnings = {}, set(), []
    own_base = "%04d_%s" % (nid, clean or "clone")

    def put(target, image):
        key = os.path.normcase(os.path.abspath(target))
        if key in taken:
            raise ValueError("서로 다른 이미지 항목이 같은 저장 경로를 참조합니다: " + target)
        taken.add(key)
        payloads[target] = _png_bytes(image)

    separated = []
    for slot, image in (slot_images or {}).items():
        if image is None:
            continue
        # 복제본은 전용 번호 폴더가 없으므로 '전용 번호 폴더 없음' 규칙 경로를 쓴다.
        field = next((f for f in SLOT_FIELDS[slot] if new.get(f)), None)
        default_field, reference = None, None
        if slot == "base":
            default_field, reference = "fullimage", "girls/full/%s" % own_base
        elif slot == "title":
            default_field, reference = "indpack_title", "%s/%s_title" % (CHARACTERS_DIR_NAME, own_base)
        else:
            default_field, reference = SLOT_FIELDS[slot][0], "girls/full/%s/%s" % (OUTFIT_SUBFOLDER[slot], own_base)
        reference = _free_reference(paths, reference, taken)
        field = field or default_field
        before_link = dict(new)
        new[field] = reference
        link_semantics(before_link, new, slot, field, reference)
        put(_abs_from_gamepath(paths.root, reference), image.convert("RGBA"))
        separated.append("%s → %s" % (SLOT_LABELS[slot], reference))
    if face_image is not None:
        face = face_image.convert("RGBA")
        if face.size != FACE_SIZE:
            face = face.resize(FACE_SIZE, Image.LANCZOS)
        for field, suffix, variant in (("seed_ava_clear", "", face), ("seed_ava_gray", "_gray", to_grayscale(face)),
                                       ("seed_ava", "_sepia", to_sepia(face))):
            reference = _free_reference(paths, "content/pic/girls/face/%s%s" % (own_base, suffix), taken)
            new[field] = reference
            put(_abs_from_gamepath(paths.root, reference), variant)
        separated.append("얼굴 3종 → content/pic/girls/face/%s*" % own_base)

    json_name = "%d_%s.json" % (nid, clean) if clean else "%d.json" % nid
    json_out = os.path.join(paths.slaves_dir, json_name)
    if os.path.exists(json_out):
        raise FileExistsError("이미 존재하는 파일: " + json_name)
    payloads[json_out] = json.dumps(new, indent=4, ensure_ascii=False).encode("utf-8")
    warn = pool_range_warning(paths, nid)
    if warn:
        warnings.append(warn)
    if separated:
        warnings.append("따로 저장한 이미지: " + " / ".join(separated))
    shared_fields = sorted(f for f in IMAGE_FIELDS if new.get(f) and new.get(f) == data.get(f))
    result = {"id": nid, "source_id": int(src_sid), "json": json_name, "json_file": json_out, "files": list(payloads),
              "data": new, "before": data, "dry_run": dry_run, "warnings": warnings, "shared_fields": shared_fields,
              "shared_with": [int(src_sid)] if shared_fields else []}
    if dry_run:
        log("[미리보기] 복제 ID %d (%s) · 파일 %d개 예정" % (nid, json_name, len(payloads)))
    else:
        _write_files_together(payloads)
        log("[OK] ID %d 를 ID %d 로 복제했습니다 (%s). 공유하는 이미지 항목 %d개." % (int(src_sid), nid, json_name, len(shared_fields)))
    for note in warnings:
        log("   [주의] " + note)
    return result


# ---------------------------------------------------------------------------
# GUI
# ---------------------------------------------------------------------------

class CharacterEditor:
    """Load the shared one-window interface without importing Tk for CLI helpers."""
    def __new__(cls, window, game_root=None):
        import importlib.util
        from types import SimpleNamespace
        module_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "character_editor_ui.py")
        spec = importlib.util.spec_from_file_location("jo9_character_editor_ui", module_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module.CharacterEditor(window, backend=SimpleNamespace(**globals()), game_root=game_root)


def run_gui(game_root=None):
    import tkinter as tk
    window = tk.Tk()
    CharacterEditor(window, game_root=game_root or find_game_root())
    window.mainloop()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="JO9 character add / edit tool")
    parser.add_argument("--game", help="game folder (optional)")
    run_gui(parser.parse_args().game)
