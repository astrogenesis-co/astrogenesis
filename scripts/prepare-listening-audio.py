"""Copy normalized WAVs and make versioned MP3 listening copies. Run from repo root."""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys

repo = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1]) if len(sys.argv) > 1 else repo / 'media/mixes-normalized'
normalized = repo / 'media/mixes-normalized'
listening = repo / 'media/listening'
normalized.mkdir(parents=True, exist_ok=True)
listening.mkdir(parents=True, exist_ok=True)
records = repo / 'stars/first-star/mixes'
records.mkdir(exist_ok=True)
songs = {p.stem for p in (repo / 'stars/first-star/songs').glob('*.md') if p.name != 'README.md'}

def digest(path):
    return hashlib.file_digest(path.open('rb'), 'sha256').hexdigest()

def prepare(path):
    candidates = [s for s in songs if path.stem.startswith(s + '-')]
    if not candidates:
        raise ValueError(f'No song match: {path.name}')
    song = max(candidates, key=len)
    date = re.search(r'\d{4}-\d{2}-\d{2}', path.stem)
    if not date:
        raise ValueError(f'No version date: {path.name}')
    copied = normalized / path.name
    source_hash = digest(path)
    if path.resolve() != copied.resolve():
        if copied.exists() and digest(copied) != source_hash:
            raise ValueError(f'Conflicting local normalized file: {copied}')
        if not copied.exists():
            shutil.copy2(path, copied)
        assert digest(copied) == source_hash
    # Hash identifies both source and encoding settings, so URLs never change contents.
    version = hashlib.sha256((source_hash + '|libmp3lame-q2-48000-v1').encode()).hexdigest()[:16]
    filename = f'{path.stem}-{version}.mp3'
    output = listening / filename
    if not output.exists():
        temp = listening / f'{path.stem}.encoding.mp3'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(copied), '-map', '0:a:0', '-map_metadata', '-1', '-c:a', 'libmp3lame', '-q:a', '2', '-ar', '48000', str(temp)], check=True)
        temp.replace(output)
    info = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'json', str(output)]))
    title = song.replace('-', ' ').title() + ' — ' + path.stem[len(song) + 1:]
    text = f'---\nid: {path.stem}\ntype: Mix\ntitle: {title}\nstatus: notes\nvisibility: public\nsong: songs/{song}\nfile: {filename}\nmix_date: {date.group()}\nnormalized: true\nsource_file: mixes-normalized/{path.name}\nsource_sha256: {source_hash}\nduration_seconds: {float(info["format"]["duration"]):.3f}\n---\n\nNormalized listening version of this mix. The version date comes from the filename.\n'
    (records / f'{path.stem}.md').write_text(text)
    return {'id': path.stem, 'song': song, 'file': filename, 'sha256': digest(output), 'bytes': output.stat().st_size}

files = sorted(source.glob('*.wav'))
if not files:
    raise ValueError(f'No WAVs in {source}')
results = []
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for item in pool.map(prepare, files):
        results.append(item)
        print(f'Prepared {len(results)}/{len(files)}: {item["id"]}', flush=True)
(listening / 'manifest.json').write_text(json.dumps(results, indent=2) + '\n')
print(f'Prepared {len(results)} normalized listening copies; {sum(r["bytes"] for r in results)/1e6:.1f} MB total.')
