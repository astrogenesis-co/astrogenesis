"""Import new raw mixes. Run with --dry-run to inspect without writing files."""
import argparse
from datetime import date
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
import tempfile

REPO = Path(__file__).resolve().parents[1]
POLICY = 'gain-only-lufs-16-tp-1-pcm24-48000-lame-q2-v1'


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def fields(path):
    front = path.read_text().split('---', 2)[1]
    result = {}
    for line in front.splitlines():
        if ': ' not in line:
            continue
        key, value = line.split(': ', 1)
        try:
            result[key] = json.loads(value)
        except json.JSONDecodeError:
            result[key] = value
    return result


def measure(path):
    result = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path),
        '-map', '0:a:0', '-af', 'loudnorm=I=-16:TP=-1:LRA=50:print_format=json',
        '-f', 'null', '-'], capture_output=True, text=True, check=True)
    report, _ = json.JSONDecoder().raw_decode(result.stderr[result.stderr.rfind('{'):])
    values = float(report['input_i']), float(report['input_tp'])
    if not all(math.isfinite(v) for v in values):
        raise ValueError(f'Cannot normalize silent or unmeasurable audio: {path}')
    return values


def scan(repo, selected=None):
    records = repo / 'stars/first-star/mixes'
    songs = repo / 'stars/first-star/songs'
    excluded = set(json.loads((repo / 'scripts/excluded-mixes.json').read_text())['ids'])
    files = sorted(p for p in (repo / 'media/mixes').iterdir()
                   if p.suffix.lower() in {'.wav', '.mp3', '.m4a', '.aif', '.aiff', '.flac'})
    if selected:
        files = [p for p in files if p.stem == selected]
        if not files:
            raise ValueError(f'No raw mix found: {selected}')
    pending, seen = [], set()
    for path in files:
        mix_id = path.stem
        if mix_id in excluded:
            print(f'Excluded: {mix_id}')
            continue
        if mix_id in seen:
            raise ValueError(f'Multiple source files have the same mix ID: {mix_id}')
        seen.add(mix_id)
        match = re.fullmatch(r'(.+)-(\d{4}-\d{2}-\d{2})(?:-(\d+))?', mix_id)
        if not match or not (songs / f'{match[1]}.md').is_file():
            raise ValueError(f'Expected existing-song-slug-YYYY-MM-DD[-version]: {path.name}')
        date.fromisoformat(match[2])
        record = records / f'{mix_id}.md'
        if record.exists():
            existing = fields(record)
            if existing.get('original_sha256') and existing['original_sha256'] != digest(path):
                raise ValueError(f'Source changed for {mix_id}; use a new date/version filename.')
            for asset in [repo / 'media' / existing['source_file'],
                          repo / 'media/listening' / existing['file']]:
                if not asset.is_file():
                    raise ValueError(f'Existing record has missing audio: {asset}')
            continue
        normalized = repo / 'media/mixes-normalized' / f'{mix_id}.wav'
        if normalized.exists():
            raise ValueError(f'Normalized WAV already exists without a record: {normalized}')
        pending.append((path, match[1], match[2]))
    return pending


def prepare(repo, path, song, mix_date):
    mix_id = path.stem
    original_hash = digest(path)
    loudness, peak = measure(path)
    gain = min(-16 - loudness, -1 - peak)
    normalized = repo / 'media/mixes-normalized' / f'{mix_id}.wav'
    listening = repo / 'media/listening'
    records = repo / 'stars/first-star/mixes'
    for directory in (normalized.parent, listening, records):
        directory.mkdir(parents=True, exist_ok=True)
    # Keep incomplete outputs out of the import directories until encoding succeeds.
    with tempfile.TemporaryDirectory(prefix='mix-import-', dir=repo / 'media') as temp:
        wav = Path(temp) / 'normalized.wav'
        mp3 = Path(temp) / 'listening.mp3'
        subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-i', str(path),
            '-map', '0:a:0', '-map_metadata', '-1', '-af', f'volume={gain:.8f}dB',
            '-ar', '48000', '-c:a', 'pcm_s24le', str(wav)], check=True)
        actual_loudness, actual_peak = measure(wav)
        if actual_peak > -0.9:
            raise ValueError(f'Normalized true peak exceeds ceiling: {actual_peak} dBTP')
        subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-i', str(wav),
            '-map', '0:a:0', '-map_metadata', '-1', '-c:a', 'libmp3lame',
            '-q:a', '2', '-ar', '48000', str(mp3)], check=True)
        if mp3.stat().st_size > 25 * 1024 * 1024:
            raise ValueError('Listening MP3 exceeds the site limit of 25 MiB')
        if digest(path) != original_hash:
            raise ValueError('Source changed during import; retry when export/copy is complete')
        source_hash = digest(wav)
        version = hashlib.sha256((source_hash + '|libmp3lame-q2-48000-v1').encode()).hexdigest()[:16]
        filename = f'{mix_id}-{version}.mp3'
        output = listening / filename
        duration = float(subprocess.check_output(['ffprobe', '-v', 'error',
            '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', str(mp3)]))
        record = records / f'{mix_id}.md'
        if record.exists() or normalized.exists() or output.exists():
            raise ValueError(f'Output collision for {mix_id}; no existing files overwritten')
        song_title = fields(repo / 'stars/first-star/songs' / f'{song}.md').get('title', song)
        metadata = {
            'id': mix_id, 'type': 'Mix', 'title': f'{song_title} — {mix_id[len(song)+1:]}',
            'status': 'notes', 'visibility': 'private', 'song': f'songs/{song}',
            'file': filename, 'mix_date': mix_date, 'normalized': True,
            'source_file': f'mixes-normalized/{normalized.name}', 'source_sha256': source_hash,
            'original_file': f'mixes/{path.name}', 'original_sha256': original_hash,
            'normalization_policy': POLICY, 'normalization_gain_db': round(gain, 6),
            'normalized_lufs': actual_loudness, 'normalized_true_peak_dbtp': actual_peak,
            'duration_seconds': round(duration, 3),
        }
        record_text = '---\n' + ''.join(f'{key}: {json.dumps(value, ensure_ascii=False)}\n'
            for key, value in metadata.items()) + '---\n\nNormalized listening copy. Original mix preserved; gain adjustment only.\n'
        # The record is the commit marker. Roll back assets if writing it fails.
        installed = []
        try:
            wav.rename(normalized); installed.append(normalized)
            mp3.rename(output); installed.append(output)
            with record.open('x') as stream:
                installed.append(record)
                stream.write(record_text)
        except BaseException:
            for item in reversed(installed):
                item.unlink()
            raise
    print(f'Imported {mix_id}: {gain:+.2f} dB gain, {actual_loudness:.2f} LUFS, {actual_peak:.2f} dBTP')


def rebuild_manifest(repo):
    manifest = []
    for record in sorted((repo / 'stars/first-star/mixes').glob('*.md')):
        if record.name == 'README.md':
            continue
        data = fields(record)
        output = repo / 'media/listening' / data['file']
        manifest.append({'id': data['id'], 'song': data['song'].removeprefix('songs/'),
                         'file': data['file'], 'sha256': digest(output), 'bytes': output.stat().st_size})
    path = repo / 'media/listening/manifest.json'
    temp = path.with_suffix('.json.tmp')
    temp.write_text(json.dumps(manifest, indent=2) + '\n')
    temp.replace(path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--mix', help='Import only this mix ID (without extension)')
    args = parser.parse_args()
    pending = scan(REPO, args.mix)
    for path, _, _ in pending:
        print(f'New: {path.name}')
    print(f'{len(pending)} new mix(es). Existing records are preserved.')
    if args.dry_run:
        return
    for item in pending:
        prepare(REPO, *item)
    rebuild_manifest(REPO)


if __name__ == '__main__':
    main()
