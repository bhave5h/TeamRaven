import json
import logging
import re
import time
from threading import Lock
import uuid
from typing import Dict, Any, Optional
from backend.config import settings
from backend.db.database import get_db

logger = logging.getLogger("odin.llm_client")

class LLMClient:
    """Unified client for Anthropic and Groq with strict temperature 0.0 and token tracing."""

    _rate_limited = False
    _circuit_lock = Lock()

    @classmethod
    def reset_circuit_breaker(cls) -> None:
        """Allow one fresh provider attempt at the start of each analysis run."""
        with cls._circuit_lock:
            cls._rate_limited = False

    @staticmethod
    def _is_rate_limit_error(error: Exception) -> bool:
        response = getattr(error, "response", None)
        status = getattr(error, "status_code", None) or getattr(response, "status_code", None)
        if status == 429:
            return True
        message = str(error).lower()
        return "429" in message or "too many requests" in message or "rate limit" in message or "rate_limit" in message or "tokens per day" in message

    @staticmethod
    def _clean_json_response(content: str) -> str:
        """Strips markdown code fences and whitespace from LLM output, extracting pure JSON."""
        cleaned = content.strip()
        fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
        if fence_match:
            cleaned = fence_match.group(1).strip()
        
        brace_start = cleaned.find("{")
        bracket_start = cleaned.find("[")
        if brace_start != -1 and (bracket_start == -1 or brace_start < bracket_start):
            brace_end = cleaned.rfind("}")
            if brace_end != -1:
                return cleaned[brace_start:brace_end + 1].strip()
        elif bracket_start != -1:
            bracket_end = cleaned.rfind("]")
            if bracket_end != -1:
                return cleaned[bracket_start:bracket_end + 1].strip()

        return cleaned

    @classmethod
    def call_json(
        cls,
        agent_name: str,
        system_prompt: str,
        user_prompt: str,
        run_id: str = "run_default"
    ) -> Optional[Any]:
        """Calls the configured LLM provider and parses structured JSON output."""
        provider = settings.LLM_PROVIDER.lower()
        start_time = time.time()
        trace_id = f"trace_{uuid.uuid4().hex[:8]}"
        with cls._circuit_lock:
            rate_limited = cls._rate_limited
        if rate_limited:
            cls._record_trace(trace_id, run_id, agent_name, 0, 0, 0, "SKIPPED: provider rate limit")
            return None

        prompt_tokens = 0
        completion_tokens = 0
        raw_output = ""
        success = False

        try:
            if provider == "anthropic":
                raw_output, prompt_tokens, completion_tokens = cls._call_anthropic(system_prompt, user_prompt)
            elif provider == "groq":
                raw_output, prompt_tokens, completion_tokens = cls._call_groq(system_prompt, user_prompt)
            else:
                logger.error(f"Unsupported LLM provider: {provider}")
                return None

            latency_ms = int((time.time() - start_time) * 1000)
            cleaned = cls._clean_json_response(raw_output)
            parsed_json = json.loads(cleaned)
            success = True

            cls._record_trace(trace_id, run_id, agent_name, prompt_tokens, completion_tokens, latency_ms, "SUCCESS")
            return parsed_json

        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            if cls._is_rate_limit_error(e):
                with cls._circuit_lock:
                    cls._rate_limited = True
                logger.warning("LLM provider %s returned 429; skipping remaining provider calls for this analysis.", provider)
                status = "ERROR: 429 rate limit"
            else:
                logger.warning("LLM call failed for agent %s using %s: %s", agent_name, provider, e)
                status = f"ERROR: {str(e)[:100]}"
            cls._record_trace(trace_id, run_id, agent_name, prompt_tokens, completion_tokens, latency_ms, status)
            return None

    @classmethod
    def _call_anthropic(cls, system_prompt: str, user_prompt: str) -> tuple[str, int, int]:
        if not settings.ANTHROPIC_API_KEY or "your_anthropic" in settings.ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY is not configured in .env")

        import anthropic
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY, max_retries=0)

        kwargs: dict[str, Any] = {
            "model": settings.ANTHROPIC_MODEL,
            "max_tokens": settings.MAX_TOKENS_PER_CALL,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_prompt}],
        }
        response = client.messages.create(**kwargs)

        content = ""
        for block in getattr(response, "content", []):
            if hasattr(block, "text"):
                content += block.text
            elif getattr(block, "type", None) == "text":
                content += getattr(block, "text", "")
        p_tokens = getattr(response.usage, "input_tokens", 0)
        c_tokens = getattr(response.usage, "output_tokens", 0)
        return content, p_tokens, c_tokens

    @classmethod
    def _call_groq(cls, system_prompt: str, user_prompt: str) -> tuple[str, int, int]:
        if not settings.GROQ_API_KEY or "your_groq" in settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is not configured in .env")

        import groq
        client = groq.Groq(api_key=settings.GROQ_API_KEY, max_retries=0)

        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            max_tokens=settings.MAX_TOKENS_PER_CALL,
            temperature=settings.LLM_TEMPERATURE,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )

        content = response.choices[0].message.content or ""
        p_tokens = getattr(response.usage, "prompt_tokens", 0) if response.usage else 0
        c_tokens = getattr(response.usage, "completion_tokens", 0) if response.usage else 0
        return content, p_tokens, c_tokens

    @staticmethod
    def _record_trace(trace_id: str, run_id: str, agent_name: str, p_tokens: int, c_tokens: int, latency_ms: int, status: str):
        with get_db() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO traces (
                    trace_id, run_id, agent_name, prompt_tokens, completion_tokens, latency_ms, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (trace_id, run_id, agent_name, p_tokens, c_tokens, latency_ms, status))
