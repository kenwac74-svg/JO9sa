"""Update the native title read from config.xml, preserving UTF16 bytes."""
from pathlib import Path
import argparse, datetime, hashlib, json, re

OLD = 'Jack-o-nine-tails 2.3.2.5 & Kor Ver'
NEW = 'Jack-o-nine-tails 2.4.0.0 & Kor Ver'

def patch(raw):
    if not raw.startswith(b'\xff\xfe'):
        raise ValueError('Expected UTF16LE config.xml with BOM. No file was written.')
    text = raw[2:].decode('utf-16-le')
    titles = re.findall(r'\btitle="([^"]*)"', text)
    if titles == [NEW]:
        return raw
    if titles != [OLD] or not text.startswith('<game '):
        raise ValueError('Unrecognized game title. No file was written.')
    before = ('title="' + OLD + '"').encode('utf-16-le')
    after = ('title="' + NEW + '"').encode('utf-16-le')
    result = raw.replace(before, after, 1)
    assert len(result) == len(raw) and result.replace(after, before, 1) == raw
    return result

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--target', required=True)
    parser.add_argument('--output')
    args = parser.parse_args()
    target = Path(args.target)
    raw = target.read_bytes()
    result = patch(raw)
    backup = None
    if args.output:
        Path(args.output).write_bytes(result)
    elif result != raw:
        stamp = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).strftime('%Y%m%d_%H%M%S')
        backup = target.with_name(target.name + '.bak_' + stamp)
        with backup.open('xb') as stream:
            stream.write(raw)
        assert backup.read_bytes() == raw and target.read_bytes() == raw
        temp = target.with_name(target.name + '.title.tmp')
        with temp.open('xb') as stream:
            stream.write(result)
        temp.replace(target)
        assert target.read_bytes() == result
    print(json.dumps({'title': NEW, 'before': hashlib.sha256(raw).hexdigest(),
        'after': hashlib.sha256(result).hexdigest(), 'bytes': len(result),
        'backup': str(backup) if backup else None}))
