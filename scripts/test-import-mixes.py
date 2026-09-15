"""Import safety checks using isolated fixture catalogs."""
import importlib.util
import json
from pathlib import Path
import tempfile
import sys
import unittest

sys.dont_write_bytecode = True

spec = importlib.util.spec_from_file_location('import_mixes', Path(__file__).with_name('import-mixes.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ImportSafety(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name)
        for folder in ['scripts', 'media/mixes', 'media/mixes-normalized', 'media/listening',
                       'stars/first-star/mixes', 'stars/first-star/songs']:
            (self.repo / folder).mkdir(parents=True)
        (self.repo / 'scripts/excluded-mixes.json').write_text('{"ids": ["song-2020-01-01"]}')
        (self.repo / 'stars/first-star/songs/song.md').write_text('---\ntitle: Song\n---\n')
        self.raw = self.repo / 'media/mixes/song-2026-09-02.wav'
        self.raw.write_bytes(b'original')

    def test_new_and_excluded(self):
        (self.raw.parent / 'song-2020-01-01.wav').write_bytes(b'excluded')
        self.assertEqual(len(module.scan(self.repo)), 1)

    def test_invalid_date(self):
        self.raw.rename(self.raw.with_name('song-2026-02-30.wav'))
        with self.assertRaises(ValueError):
            module.scan(self.repo)

    def test_duplicate_id(self):
        self.raw.with_suffix('.mp3').write_bytes(b'duplicate')
        with self.assertRaisesRegex(ValueError, 'Multiple source'):
            module.scan(self.repo)

    def test_existing_notes_preserved_and_replaced_source_rejected(self):
        record = self.repo / 'stars/first-star/mixes/song-2026-09-02.md'
        data = {'original_sha256': module.digest(self.raw),
                'source_file': 'mixes-normalized/song-2026-09-02.wav', 'file': 'test.mp3'}
        text = '---\n' + ''.join(f'{k}: {json.dumps(v)}\n' for k, v in data.items()) + '---\nPersonal notes.\n'
        record.write_text(text)
        (self.repo / 'media' / data['source_file']).write_bytes(b'wav')
        (self.repo / 'media/listening/test.mp3').write_bytes(b'mp3')
        self.assertEqual(module.scan(self.repo), [])
        self.assertEqual(record.read_text(), text)
        self.raw.write_bytes(b'replaced')
        with self.assertRaisesRegex(ValueError, 'Source changed'):
            module.scan(self.repo)

    def test_untracked_normalized_file_not_overwritten(self):
        (self.repo / 'media/mixes-normalized' / self.raw.name).write_bytes(b'existing')
        with self.assertRaisesRegex(ValueError, 'already exists'):
            module.scan(self.repo)


if __name__ == '__main__':
    unittest.main()
