import json
import httpx
import re
from app.utils.config import settings

def _strip_markdown_json(text: str) -> str:
    """Removes markdown backticks and formatting from JSON string blocks."""
    text = text.strip()
    # Remove standard markdown JSON codeblocks (e.g. ```json \n ... \n ```)
    if text.startswith("```"):
        text = re.sub(r"^```(json)?\n", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\n```$", "", text)
    return text.strip()

async def generate(prompt: str, system: str) -> str:
    """
    Calls the Ollama generate endpoint and returns the raw string response.
    Uses a longer timeout to accommodate complex prompts and 7B+ models.
    """
    async with httpx.AsyncClient(timeout=600.0) as client:  # 10 minutes timeout
        response = await client.post(
            f"{settings.OLLAMA_BASE_URL}/api/generate",
            json={
                "model": settings.OLLAMA_MODEL,
                "prompt": prompt,
                "system": system,
                "stream": False
            }
        )
        response.raise_for_status()
        data = response.json()
        return data.get("response", "")

async def generate_json(prompt: str, system: str) -> dict:
    """
    Calls generate(), strips any markdown fences, and parses the response as JSON.
    Raises ValueError if parsing fails.
    """
    # Instruct model specifically to return JSON formatted content
    system_with_json_directive = f"{system}\n\nYou MUST respond with valid JSON only."
    
    response_text = await generate(prompt, system_with_json_directive)
    cleaned_text = _strip_markdown_json(response_text)
    
    try:
        return json.loads(cleaned_text)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Failed to parse JSON response: {e}\n"
            f"Raw Response: {response_text}\n"
            f"Cleaned Text: {cleaned_text}"
        ) from e

async def is_ollama_alive() -> bool:
    """
    Performs a health check on the configured Ollama base URL.
    Returns True if healthy, False otherwise.
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            return response.status_code == 200
    except Exception:
        return False
