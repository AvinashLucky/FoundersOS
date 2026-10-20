"""Separate, opt-in yt-dlp stage. Does not run during URL collection.

Standalone Windows replacement: original 1_download.sh was not found in scope.
No cookies imported; no authentication/paywall/DRM bypass. Decoder owns cleanup.
"""
import argparse
import ipaddress
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlsplit, parse_qsl

ROOT = Path(__file__).resolve().parent
SECRET = re.compile(r'token|secret|password|signature|credential|session|api.?key|^code$|^sig$|^policy$|x-amz|x-goog', re.I)

def valid_url(url):
    try:
        u = urlsplit(url)
        if u.scheme != 'https' or not u.hostname or u.username or u.password:
            return False
        host = u.hostname.lower()
        if '.' not in host or host.endswith(('.local', '.localhost', '.internal')):
            return False
        try:
            ipaddress.ip_address(host)
            return False
        except ValueError:
            pass
        return not any(SECRET.search(k) for k, _ in parse_qsl(u.query))
    except ValueError:
        return False

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, default=ROOT / 'output' / 'creator_dna_video_master.txt')
    parser.add_argument('--execute', action='store_true', help='Otherwise validate and show counts only')
    parser.add_argument('--rights-confirmed', action='store_true', help='Confirm permission for every selected URL')
    parser.add_argument('--max-items', type=int, default=3)
    args = parser.parse_args()
    if not 1 <= args.max_items <= 100:
        parser.error('--max-items must be 1..100')
    urls = list(dict.fromkeys(line.strip() for line in args.input.read_text(encoding='utf-8-sig').splitlines() if line.strip()))
    if any(not valid_url(u) for u in urls):
        parser.error('Input contains an unsafe/non-HTTPS/signed URL. Nothing downloaded.')
    selected = urls[:args.max_items]
    print(f'{len(urls)} unique URLs; {len(selected)} selected. Download: {args.execute}')
    if not args.execute:
        print('Dry run only. Use a rights-approved URL subset with --execute --rights-confirmed.')
        return 0
    if not args.rights_confirmed:
        parser.error('Download requires --rights-confirmed; public availability is not permission.')
    if not selected:
        return 0
    raw_dir = ROOT / 'raw_videos'
    raw_dir.mkdir(exist_ok=True)
    batch = raw_dir / 'batch_urls.txt'
    batch.write_text('\n'.join(selected) + '\n', encoding='utf-8')
    command = [sys.executable, '-m', 'yt_dlp', '--ignore-config', '-a', str(batch),
               '--paths', str(raw_dir), '-o', '%(extractor_key)s_%(id)s.%(ext)s',
               '--no-playlist', '--no-overwrites', '--restrict-filenames', '--concurrent-fragments', '1',
               '--sleep-requests', '1', '--sleep-interval', '1', '--max-sleep-interval', '2',
               '--retries', '1', '--fragment-retries', '1', '--socket-timeout', '20', '--max-filesize', '500M',
               '-f', 'best[height<=720]/best', '--abort-on-error', '--abort-on-unavailable-fragments']
    print('Temporary media only. Stop on denied access. Hand successful files to 2_decode.py; verify decode before its bounded raw-media cleanup.')
    try:
        return subprocess.call(command, shell=False)
    finally:
        batch.unlink(missing_ok=True)

if __name__ == '__main__':
    raise SystemExit(main())

