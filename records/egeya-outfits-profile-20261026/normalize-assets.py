#!/usr/bin/env python3
"""Reproduce Egeya PNGs in a NEW explicit diagnostic directory; never installs assets.

Requires Pillow (original run: 12.3.0). Example:
  py normalize-assets.py --manifest assets-manifest.json --source-zip PATH --output-dir NEW_DIR
All source and output hashes must match the supplied manifest. The source ZIP,
manifest and existing files are read-only. Output directories inside game trees
are rejected. Crop, stretch, background removal and image generation are absent.
"""
from argparse import ArgumentParser
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path, PurePosixPath
import stat
import zipfile

from PIL import Image, ImageOps, __version__ as pillow_version

CANVAS = (795, 596)
ROLE_ENTRIES = {
    'naked': 'egeya_nud.png',
    'maid': 'egeya_하녀.png',
    'secr': 'egeya_비서.png',
    'dom': 'egeya_도미나.png',
}


def require(condition, message):
    if not condition:
        raise SystemExit(message)


def digest(data):
    return sha256(data).hexdigest()


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', required=True, type=Path)
    parser.add_argument('--source-zip', required=True, type=Path)
    parser.add_argument('--output-dir', required=True, type=Path,
                        help='New diagnostic directory outside all game trees')
    args = parser.parse_args()
    manifest_path = args.manifest.resolve(strict=True)
    source = args.source_zip.resolve(strict=True)
    output = args.output_dir.resolve()
    require(not output.exists(), 'Output directory must not already exist')
    require(not any(p.name.casefold() == 'game' for p in (output, *output.parents)),
            'Output directory must be outside game trees')
    require(not source.is_relative_to(output) and not manifest_path.is_relative_to(output),
            'Output directory must not contain either input file')
    manifest_bytes = manifest_path.read_bytes()
    manifest = json.loads(manifest_bytes.decode('utf-8-sig'))
    expected_zip = manifest['source_zip_sha256_before'].lower()
    require(expected_zip == manifest['source_zip_sha256_after'].lower(),
            'Manifest source ZIP hashes disagree')
    require(tuple(manifest['canvas_dimensions']) == CANVAS, 'Unexpected canvas dimensions')
    archive_bytes = source.read_bytes()
    require(digest(archive_bytes) == expected_zip, 'Source ZIP SHA256 mismatch')
    artifacts = {entry['role']: entry for entry in manifest['artifacts']}
    require(set(artifacts) == set(ROLE_ENTRIES), 'Unexpected manifest roles')
    prepared = []
    with zipfile.ZipFile(BytesIO(archive_bytes)) as archive:
        require(len(archive.infolist()) == 4 and set(archive.namelist()) == set(ROLE_ENTRIES.values()),
                'Unexpected ZIP entries')
        for entry in archive.infolist():
            path = PurePosixPath(entry.filename.replace('\\', '/'))
            require(not path.is_absolute() and '..' not in path.parts and ':' not in entry.filename
                    and not stat.S_ISLNK(entry.external_attr >> 16), 'Unsafe ZIP entry')
        for role, name in ROLE_ENTRIES.items():
            expected = artifacts[role]
            require(expected['source_entry'] == name, 'Manifest role mapping mismatch')
            data = archive.read(name)
            require(digest(data) == expected['source_sha256'].lower(), 'Source entry SHA256 mismatch')
            with Image.open(BytesIO(data)) as opened:
                require(opened.format == 'PNG', 'Source entry must be PNG')
                original = opened.convert('RGBA')
                original.load()
            require(list(original.size) == expected['source_dimensions'], 'Source dimensions mismatch')
            fitted = ImageOps.contain(original, CANVAS, Image.Resampling.LANCZOS)
            x, y = (CANVAS[0] - fitted.width) // 2, (CANVAS[1] - fitted.height) // 2
            rectangle = [x, y, fitted.width, fitted.height]
            require(rectangle == expected['fit_rectangle_xywh'], 'Fit rectangle mismatch')
            canvas = Image.new('RGBA', CANVAS, (0, 0, 0, 0))
            canvas.paste(fitted, (x, y))
            buffer = BytesIO()
            canvas.save(buffer, format='PNG', optimize=True)
            encoded = buffer.getvalue()
            require(digest(encoded) == expected['output_sha256'].lower(),
                    'Output SHA256 mismatch; use original Pillow 12.3.0 runtime')
            relative = Path('content/pic/girls/full/2579') / f'2579_full_{role}.png'
            prepared.append((relative, encoded, rectangle))
    # Every hash is validated before creating output. No existing file is replaced.
    output.mkdir(parents=True, exist_ok=False)
    results = []
    for relative, encoded, rectangle in prepared:
        destination = output / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        with destination.open('xb') as stream:
            stream.write(encoded)
        require(digest(destination.read_bytes()) == digest(encoded), 'Saved output SHA256 mismatch')
        with Image.open(destination) as check:
            check.load()
            require(check.mode == 'RGBA' and check.size == CANVAS, 'Saved PNG format mismatch')
            require(check.getchannel('A').getextrema() == (0, 255), 'Saved PNG alpha mismatch')
        results.append({'path': relative.as_posix(), 'sha256': digest(encoded),
                        'fit_rectangle_xywh': rectangle})
    require(digest(source.read_bytes()) == expected_zip, 'Source ZIP changed during reproduction')
    require(manifest_path.read_bytes() == manifest_bytes, 'Manifest changed during reproduction')
    report = {'pillow_version': pillow_version, 'source_zip_sha256': expected_zip,
              'source_zip_unchanged': True, 'manifest_unchanged': True,
              'all_output_hashes_match_manifest': True, 'outputs': results}
    report_path = output / 'normalization-verification.json'
    with report_path.open('x', encoding='utf-8') as stream:
        json.dump(report, stream, ensure_ascii=False, indent=2)
        stream.write('\n')
    print(json.dumps({'report': str(report_path), **report}, ensure_ascii=True, indent=2))


if __name__ == '__main__':
    main()