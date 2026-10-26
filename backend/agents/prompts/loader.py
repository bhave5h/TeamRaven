import os
from pathlib import Path

PROMPTS_DIR = Path(__file__).parent

def load_prompt(prompt_name: str, **kwargs) -> str:
    """Loads a prompt template from agents/prompts/<prompt_name>.txt or .jinja2 and injects kwargs."""
    # Check for .txt first, then .jinja2
    txt_path = PROMPTS_DIR / f"{prompt_name}.txt"
    jinja_path = PROMPTS_DIR / f"{prompt_name}.jinja2"

    if txt_path.exists():
        with open(txt_path, "r", encoding="utf-8") as f:
            template = f.read()
        return template.format(**kwargs) if kwargs else template
    elif jinja_path.exists():
        with open(jinja_path, "r", encoding="utf-8") as f:
            template = f.read()
        return template.format(**kwargs) if kwargs else template
    else:
        raise FileNotFoundError(f"Prompt template {prompt_name} (.txt or .jinja2) not found in {PROMPTS_DIR}")
