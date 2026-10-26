import sys
from pathlib import Path

# Add backend directory and parent directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
parent_dir = backend_dir.parent

if str(parent_dir) not in sys.path:
    sys.path.insert(0, str(parent_dir))
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
