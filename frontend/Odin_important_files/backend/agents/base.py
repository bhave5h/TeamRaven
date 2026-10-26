import logging
import json
from typing import Any, Type, TypeVar, Optional
from pydantic import BaseModel
from backend.agents.prompts.loader import load_prompt
from backend.agents.llm_client import LLMClient
from backend.config import settings

T = TypeVar("T", bound=BaseModel)

class BaseAgent:
    """Base class for all cognitive agents in the Contract War Room.
    
    Provides standard retry logic, telemetry tracing, prompt loading,
    and Pydantic schema validation.
    """

    def __init__(self, name: str, config: Optional[Any] = None, prompt_name: Optional[str] = None):
        self.name = name
        self.config = config or settings
        self.logger = logging.getLogger(f"odin.agent.{name.lower()}")
        self.system_prompt = load_prompt(prompt_name) if prompt_name else ""

    def load_system_prompt(self, prompt_name: str, **kwargs) -> str:
        """Loads and caches system prompt template."""
        self.system_prompt = load_prompt(prompt_name, **kwargs)
        return self.system_prompt

    def call_json(self, system_prompt: Optional[str], user_message: str, run_id: str = "run_default") -> Optional[Any]:
        """Synchronously calls LLM with JSON output guarantee and token tracing."""
        sys_prompt = system_prompt or self.system_prompt
        return LLMClient.call_json(
            agent_name=self.name,
            system_prompt=sys_prompt,
            user_prompt=user_message,
            run_id=run_id
        )

    async def call_llm(self, system_prompt: Optional[str], user_message: str, run_id: str = "run_default") -> str:
        """Async wrapper for LLM call."""
        # For compatibility with async pipelines
        res = self.call_json(system_prompt, user_message, run_id)
        return json.dumps(res) if res is not None else ""

    def parse_and_validate(self, raw_response: Any, schema: Type[T]) -> T:
        """Validates raw dict or JSON string against a Pydantic schema."""
        if isinstance(raw_response, str):
            data = json.loads(raw_response)
        elif isinstance(raw_response, dict):
            data = raw_response
        else:
            raise ValueError(f"Cannot parse response of type {type(raw_response)}")

        return schema.model_validate(data)
