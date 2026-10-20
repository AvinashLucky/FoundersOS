import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('download_stage', Path(__file__).with_name('1_download.py'))
download = importlib.util.module_from_spec(spec)
spec.loader.exec_module(download)

class DownloadValidation(unittest.TestCase):
    def test_public_https(self):
        self.assertTrue(download.valid_url('https://www.youtube.com/watch?v=example'))

    def test_reject_local_credentials_and_signed(self):
        for url in ['file:///C:/secret', 'http://example.com/a.mp4', 'https://127.0.0.1/a',
                    'https://example.local/a', 'https://u:p@example.com/a', 'https://example.com/a?token=secret']:
            with self.subTest(url=url):
                self.assertFalse(download.valid_url(url))

if __name__ == '__main__':
    unittest.main()
