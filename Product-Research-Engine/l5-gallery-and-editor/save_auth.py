"""Windows entry point; reuse the already-installed Node Playwright runtime."""
from pathlib import Path
import subprocess
import sys

if __name__ == '__main__':
    raise SystemExit(subprocess.call(['node', str(Path(__file__).with_suffix('.mjs')), *sys.argv[1:]]))

