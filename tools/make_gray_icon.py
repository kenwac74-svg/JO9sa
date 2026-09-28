# 순정 ui overhaul 아이콘의 회색판(_gray) 방식을 재현해 새 회색 아이콘을 만드는 스크립트
"""Usage: python tools/make_gray_icon.py <원본.png> <예시_원본.png> <예시_gray.png> <출력.png>

순정 방식(예시 한 쌍에서 확인): 바깥 금색 액자는 원본 그대로 두고, 안쪽만 무채색 회색으로 바꾼다.
- 액자 영역: 가장자리 5px 전부 + 안쪽 3px 중 예시 회색판에서 원본이 남은 픽셀.
- 회색 밝기: 1.125 x 휘도(Rec.709) - 8.24 (예시 쌍에서 최소제곱으로 구한 값, 평균 오차 약 2.6).
- 알파 채널은 원본 그대로.
"""
import sys
import numpy as np
from PIL import Image

K, B = 1.125405, -8.2423


def load(p):
    return np.asarray(Image.open(p).convert('RGBA')).astype(float)


def main():
    src, ex, ex_gray, out = sys.argv[1:5]
    c, a, g = load(src), load(ex), load(ex_gray)
    if not (c.shape == a.shape == g.shape):
        raise SystemExit('세 이미지의 크기가 같아야 합니다.')
    h, w = c.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    dist = np.minimum.reduce([yy, h - 1 - yy, xx, w - 1 - xx])
    kept = np.abs(a - g).max(2) <= 2
    frame = (dist <= 4) | ((dist <= 7) & kept)
    y = 0.2126 * c[..., 0] + 0.7152 * c[..., 1] + 0.0722 * c[..., 2]
    gray = np.clip(np.rint(K * y + B), 0, 255)
    res = c.copy()
    for ch in range(3):
        res[..., ch] = np.where(frame, c[..., ch], gray)
    Image.fromarray(res.astype(np.uint8), 'RGBA').save(out, optimize=True)


if __name__ == '__main__':
    main()
