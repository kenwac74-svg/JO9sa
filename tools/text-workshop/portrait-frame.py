"""PNG frame inspection/composition over stdin/stdout only; never writes images."""
import base64
import io
import json
import math
import sys

from PIL import Image


class FrameError(Exception):
    def __init__(self, code, message):
        self.code, self.message = code, message


def image(encoded, frame=False):
    try:
        raw = base64.b64decode(encoded, validate=True)
        with Image.open(io.BytesIO(raw)) as source:
            if source.format != 'PNG':
                raise ValueError('PNG required')
            if source.size not in [(150, 150), (151, 150)]:
                raise FrameError('PORTRAIT_DIMENSIONS', '자동 테두리는 150×150 또는 151×150 PNG 초상에 적용할 수 있습니다.')
            source.load()
            return source.convert('RGBA')
    except FrameError:
        raise
    except Exception:
        raise FrameError('PORTRAIT_FRAME_INVALID' if frame else 'PORTRAIT_PNG_INVALID', '프레임 PNG를 읽을 수 없습니다.' if frame else '초상 PNG를 읽을 수 없습니다.')


def ring(im, width):
    pixels = im.load()
    w, h = im.size
    return [pixels[x, y] for y in range(h) for x in range(w)
            if x < width or y < width or x >= w-width or y >= h-width]


def fit(im, size):
    return im if im.size == size else im.resize(size, Image.Resampling.LANCZOS)


def compare(a, b):
    if a == b:
        return 0.0, 0.0, 1.0
    rgb = math.sqrt(sum((x[k]-y[k])**2 for x, y in zip(a, b) for k in range(3))/(len(a)*3))
    alpha = math.sqrt(sum((x[3]-y[3])**2 for x, y in zip(a, b))/len(a))
    la = [.2126*p[0]+.7152*p[1]+.0722*p[2] for p in a]
    lb = [.2126*p[0]+.7152*p[1]+.0722*p[2] for p in b]
    ma, mb = sum(la)/len(la), sum(lb)/len(lb)
    da, db = [v-ma for v in la], [v-mb for v in lb]
    denom = math.sqrt(sum(v*v for v in da)*sum(v*v for v in db))
    corr = sum(x*y for x, y in zip(da, db))/denom if denom > 1e-8 else 0.0
    return rgb, alpha, corr


def inspect(source, references, width):
    current = ring(source, width)
    scores = []
    for name, ref in references:
        rgb, alpha, corr = compare(current, ring(fit(ref, source.size), width))
        scores.append((rgb, alpha, corr, name))
        if alpha <= 4 and rgb <= 6 and (corr >= .97 or rgb < 1):
            return {'status': 'framed', 'reason': 'known-frame', 'matchName': name}
    # Transparent edges demonstrably contain no visible opaque game border.
    # All unmatched opaque/artistic edges remain uncertain: a custom frame may exist.
    transparent = sum(p[3] <= 2 for p in current)/len(current)
    result = {'status': 'unframed' if transparent >= .995 else 'uncertain',
              'reason': 'transparent-border' if transparent >= .995 else 'not-matched-to-known-frame'}
    if scores:
        best = min(scores, key=lambda x: x[0])
        result['nearestFrameName'] = best[3]
        result['edgeRmse'] = round(best[0], 3)
        result['edgeCorrelation'] = round(best[2], 4)
    return result


def main():
    request = json.load(sys.stdin)
    source = image(request['png'])
    width = request.get('borderWidth', 5)
    if not isinstance(width, int) or not 1 <= width <= 12:
        raise FrameError('PORTRAIT_INPUT_INVALID', '테두리 두께가 올바르지 않습니다.')
    references = [(item['name'], image(item['png'], frame=True)) for item in request.get('refs', [])]
    selected = image(request['frame'], frame=True) if request['operation'] == 'compose' else None
    if selected is not None:
        references.append(('selected-frame', selected))
    result = inspect(source, references, width)
    result.update({'width': source.width, 'height': source.height, 'borderWidth': width})
    if selected is not None:
        result['centerPixelsPreserved'] = True
        result['changed'] = result['status'] != 'framed'
        if result['changed']:
            frame = fit(selected, source.size)
            output = source.copy()
            p, f = output.load(), frame.load()
            w, h = output.size
            for y in range(h):
                for x in range(w):
                    if x < width or y < width or x >= w-width or y >= h-width:
                        p[x, y] = f[x, y]
            encoded = io.BytesIO()
            output.save(encoded, format='PNG', optimize=True)
            result['png'] = base64.b64encode(encoded.getvalue()).decode('ascii')
    result['ok'] = True
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    try:
        main()
    except FrameError as error:
        print(json.dumps({'ok': False, 'code': error.code, 'message': error.message}, ensure_ascii=False))
