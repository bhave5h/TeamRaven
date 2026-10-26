import os
from pathlib import Path
from dotenv import load_dotenv

# Base backend directory
BASE_DIR = Path(__file__).resolve().parent

# Load .env file
load_dotenv(BASE_DIR / ".env")

class Settings:
    # LLM Settings
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "groq").lower()
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    ANTHROPIC_MODEL: str = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
    
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.0"))
    MAX_TOKENS_PER_CALL: int = int(os.getenv("MAX_TOKENS_PER_CALL", "4096"))
    
    # Workflow Constraints
    MAX_DEBATE_ROUNDS: int = int(os.getenv("MAX_DEBATE_ROUNDS", "3"))
    MAX_CLARIFICATION_ROUNDS: int = int(os.getenv("MAX_CLARIFICATION_ROUNDS", "2"))
    
    # Dataset Paths: an explicit upload or environment setting is required.
    _bundle_env = os.getenv("DATA_BUNDLE_PATH", "./data/uploads/active/bundle")
    DATA_BUNDLE_PATH: Path = Path(_bundle_env) if os.path.isabs(_bundle_env) else (BASE_DIR / _bundle_env).resolve()
    _clock_env = os.getenv("CLOCK_PATH", "./data/uploads/active/clock.json")
    CLOCK_PATH: Path = Path(_clock_env) if os.path.isabs(_clock_env) else (BASE_DIR / _clock_env).resolve()
    del _bundle_env, _clock_env
    # SQLite Database
    DB_PATH: Path = (
        Path(os.getenv("DB_PATH", "./db/odin.db"))
        if os.path.isabs(os.getenv("DB_PATH", "./db/odin.db"))
        else (BASE_DIR / os.getenv("DB_PATH", "./db/odin.db")).resolve()
    )

    @classmethod
    def update_dataset_paths(cls, bundle_path: str, clock_path: str | None = None) -> None:
        """Dynamically update bundle paths for judge evaluation bundles."""
        b_path = Path(bundle_path)
        cls.DATA_BUNDLE_PATH = b_path if b_path.is_absolute() else (BASE_DIR / b_path).resolve()
        
        if clock_path:
            c_path = Path(clock_path)
            cls.CLOCK_PATH = c_path if c_path.is_absolute() else (BASE_DIR / c_path).resolve()
        else:
            # Check if clock.json is inside bundle_path or parent
            possible_clock = cls.DATA_BUNDLE_PATH.parent / "clock.json"
            if possible_clock.exists():
                cls.CLOCK_PATH = possible_clock

settings = Settings()
