import json
import re
import time
import asyncio
import httpx
from app.utils.config import settings

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# You can change this anytime
MODEL = "openai/gpt-4o-mini"  
# MODEL = "openai/gpt-oss-120b:free"  # also works now


def _strip_markdown_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(json)?\n", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\n```$", "", text)
    return text.strip()


def _is_chat_model(model: str) -> bool:
    """
    Decide which endpoint to use.
    Simple rule:
    - OSS / non-chat → responses API
    - Others → chat API
    """
    return not ("gpt-oss" in model)


def _build_headers():
    return {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://bitbybit.ai",
        "X-Title": "BitByBit AI Service"
    }


def generate(prompt: str, system: str) -> str:
    if not settings.OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY not set")

    headers = _build_headers()
    is_chat = _is_chat_model(MODEL)

    if is_chat:
        url = f"{OPENROUTER_BASE_URL}/chat/completions"
        payload = {
            "model": MODEL,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 4096
        }
    else:
        url = f"{OPENROUTER_BASE_URL}/responses"
        payload = {
            "model": MODEL,
            "input": f"{system}\n\n{prompt}",
            "max_output_tokens": 4096
        }

    max_retries = 3

    for attempt in range(max_retries):
        try:
            with httpx.Client(timeout=30.0) as client:
                print(f"DEBUG → URL: {url}")
                print(f"DEBUG → MODEL: {MODEL}")

                res = client.post(url, headers=headers, json=payload)
                print(f"DEBUG → STATUS: {res.status_code}")
                print(f"DEBUG → BODY: {res.text[:500]}")

                res.raise_for_status()
                data = res.json()

                # ✅ parse response safely
                if is_chat:
                    return data["choices"][0]["message"]["content"]
                else:
                    return data["output"][0]["content"][0]["text"]

        except httpx.HTTPStatusError as e:
            print("ERROR:", e.response.text)

            if e.response.status_code == 429 and attempt < max_retries - 1:
                print("Rate limited, retrying...")
                time.sleep(10)
                continue

            raise ValueError(f"OpenRouter API error: {e.response.text}")

        except Exception as e:
            raise ValueError(f"Unexpected error: {str(e)}")


# ------------------ ASYNC VERSION ------------------ #

async def generate_async(prompt: str, system: str) -> str:
    if not settings.OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY not set")

    headers = _build_headers()
    is_chat = _is_chat_model(MODEL)

    if is_chat:
        url = f"{OPENROUTER_BASE_URL}/chat/completions"
        payload = {
            "model": MODEL,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 4096
        }
    else:
        url = f"{OPENROUTER_BASE_URL}/responses"
        payload = {
            "model": MODEL,
            "input": f"{system}\n\n{prompt}",
            "max_output_tokens": 4096
        }

    for attempt in range(3):
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(url, headers=headers, json=payload)

                res.raise_for_status()
                data = res.json()

                if is_chat:
                    return data["choices"][0]["message"]["content"]
                else:
                    return data["output"][0]["content"][0]["text"]

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429 and attempt < 2:
                await asyncio.sleep(10)
                continue

            raise ValueError(f"OpenRouter API error: {e.response.text}")

        except Exception as e:
            raise ValueError(f"Unexpected error: {str(e)}")


# ------------------ JSON HELPERS ------------------ #

def generate_json(prompt: str, system: str) -> dict:
    text = generate(prompt, system)
    clean = _strip_markdown_json(text)

    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        raise ValueError(f"Invalid JSON response:\n{text}")


async def generate_json_async(prompt: str, system: str) -> dict:
    text = await generate_async(prompt, system)
    clean = _strip_markdown_json(text)

    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        raise ValueError(f"Invalid JSON response:\n{text}")

def validate_openrouter_connection():
    try:
        result = generate("Hello", "You are a test assistant.")
        return {
            "status": "success",
            "message": "OpenRouter connection successful",
            "response_preview": result[:100]
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }