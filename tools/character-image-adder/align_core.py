"""크기 맞춤 계산. 규격 통일기(JO9Core)의 fitLandmarks/alignBounds 와 같은 값을 낸다.

규격: 795x596, 투명 배경, 등비 확대, 중심 X=397.5, 머리 상단 10~50px(기본 24), 하단은 무릎 위~무릎 컷.
변환 t = {"s": 배율, "x": 왼쪽 위 X, "y": 왼쪽 위 Y}  (원본 좌표 p 는 캔버스 s*p + (x, y) 로 간다.)
"""
import math

from PIL import Image

W, H = 795, 596
DEFAULT_TOP = 24
DEFAULT_HEAD = 142


def check_transform(t):
    try:
        s, x, y = float(t["s"]), float(t["x"]), float(t["y"])
    except (KeyError, TypeError, ValueError):
        raise ValueError("유효하지 않은 변환값")
    if not (math.isfinite(s) and math.isfinite(x) and math.isfinite(y)) or s < .05 or s > 12 or abs(x) > 30000 or abs(y) > 30000:
        raise ValueError("유효하지 않은 변환값")
    return {"s": s, "x": x, "y": y}


def contain_transform(size, canvas=(W, H)):
    """원본이 캔버스 안에 통째로 들어가는 기본 변환(지금까지의 비율 유지 방식)."""
    iw, ih = size
    s = min(canvas[0] / iw, canvas[1] / ih)
    return {"s": s, "x": (canvas[0] - iw * s) / 2, "y": (canvas[1] - ih * s) / 2}


def align_bounds(b, s=1.0, top=DEFAULT_TOP):
    """투명 여백 기준 정렬: 보이는 부분의 가로 중심을 397.5 에, 윗끝을 top 에."""
    return {"s": s, "x": W / 2 - (b["x"] + b["w"] / 2) * s, "y": top - b["y"] * s}


def fit_landmarks(a, b, top=DEFAULT_TOP):
    """정수리 a, 하단 컷 b (원본 좌표)를 이어 그 사이를 (596-top) 높이에 맞춘다."""
    if not a or not b or b[1] - a[1] < 8:
        raise ValueError("두 번째 점은 정수리보다 아래에 찍어 주세요.")
    s = (H - top) / (b[1] - a[1])
    return check_transform({"s": s, "x": W / 2 - a[0] * s, "y": top - a[1] * s})


def alpha_bounds(image, threshold=16):
    """알파가 threshold 보다 큰 영역 {x,y,w,h,transparent(투명 비율)}. 없으면 w=h=0."""
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    box = alpha.point(lambda v: 255 if v > threshold else 0).getbbox()
    histogram = alpha.histogram()
    total = rgba.width * rgba.height
    transparent = sum(histogram[:250]) / total if total else 1
    if not box:
        return {"x": 0, "y": 0, "w": 0, "h": 0, "transparent": 1.0}
    return {"x": box[0], "y": box[1], "w": box[2] - box[0], "h": box[3] - box[1], "transparent": transparent}


def apply_transform(image, t, canvas=(W, H), resample=Image.LANCZOS):
    """원본 이미지를 변환 t 로 795x596 투명 캔버스에 올린 새 이미지를 만든다. 원본은 바꾸지 않는다."""
    t = check_transform(t)
    cw, ch = canvas
    iw, ih = image.size
    s, x, y = t["s"], t["x"], t["y"]
    out = Image.new("RGBA", canvas, (0, 0, 0, 0))
    dx0, dy0, dx1, dy1 = x, y, x + iw * s, y + ih * s
    vx0, vy0 = max(0, math.floor(dx0)), max(0, math.floor(dy0))
    vx1, vy1 = min(cw, math.ceil(dx1)), min(ch, math.ceil(dy1))
    if vx1 <= vx0 or vy1 <= vy0:
        return out
    box = ((vx0 - dx0) / s, (vy0 - dy0) / s, (vx1 - dx0) / s, (vy1 - dy0) / s)
    box = (max(0.0, box[0]), max(0.0, box[1]), min(float(iw), box[2]), min(float(ih), box[3]))
    if box[2] - box[0] < 1e-6 or box[3] - box[1] < 1e-6:
        return out
    piece = image.convert("RGBA").resize((vx1 - vx0, vy1 - vy0), resample, box=box)
    out.paste(piece, (vx0, vy0))
    return out


def rescale_for_size(t, from_size, to_size):
    """다른 해상도의 원본에 같은 결과 크기를 내도록 수치를 옮긴다(가로 기준)."""
    t = check_transform(t)
    ratio = from_size[0] / to_size[0]
    return check_transform({"s": t["s"] * ratio, "x": t["x"], "y": t["y"]})


def round_transform(t, digits=4):
    t = check_transform(t)
    return {"s": round(t["s"], digits), "x": round(t["x"], 2), "y": round(t["y"], 2)}
