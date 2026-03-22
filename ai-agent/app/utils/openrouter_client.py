import json
import re
import time
import asyncio
import httpx
from app.utils.config import settings

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
# Using OpenAI's GPT-OSS-120B model
MODEL = "openai/gpt-oss-120b:free"

def _strip_markdown_json(text: str) -> str:
    """Removes markdown backticks and formatting from JSON string blocks."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(json)?\n", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\n```$", "", text)
    return text.strip()

def generate(prompt: str, system: str) -> str:
    """
    Calls OpenRouter API and returns the response text.
    Synchronous version using httpx.
    """
    if not settings.OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY not set in environment")
    
    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://bitbybit.ai",
        "X-Title": "BitByBit AI Service"
    }
    
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 4096
    }
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            with httpx.Client() as client:
                print(f"DEBUG - Calling OpenRouter with model: {MODEL}")
                print(f"DEBUG - API Key (first 20 chars): {settings.OPENROUTER_API_KEY[:20]}...")
                print(f"DEBUG - URL: {OPENROUTER_BASE_URL}/chat/completions")
                response = client.post(
                    f"{OPENROUTER_BASE_URL}/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=30.0
                )
                print(f"DEBUG - Response Status: {response.status_code}")
                print(f"DEBUG - Response Body: {response.text}")
                response.raise_for_status()
                result = response.json()
                return result["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as e:
            error_msg = str(e)
            print(f"DEBUG - HTTP Error: {error_msg}")
            print(f"DEBUG - Response content: {e.response.text}")
            if "429" in error_msg or "rate limit" in error_msg.lower():
                if attempt < max_retries - 1:
                    print(f"OpenRouter API Rate Limit hit. Waiting 10 seconds before retry {attempt + 1}/{max_retries}...")
                    time.sleep(10.0)
                    continue
            raise ValueError(f"OpenRouter API error: {error_msg}")
        except Exception as e:
            raise ValueError(f"OpenRouter API error: {str(e)}")

async def generate_async(prompt: str, system: str) -> str:
    """
    Async wrapper for OpenRouter API call using httpx.
    """
    if not settings.OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY not set in environment")
    
    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://bitbybit.ai",
        "X-Title": "BitByBit AI Service"
    }
    
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 4096
    }
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient() as client:
                print(f"DEBUG - Async calling OpenRouter with model: {MODEL}")
                response = await client.post(
                    f"{OPENROUTER_BASE_URL}/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=30.0
                )
                print(f"DEBUG - Async Response Status: {response.status_code}")
                print(f"DEBUG - Async Response Body: {response.text}")
                response.raise_for_status()
                result = response.json()
                return result["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as e:
            error_msg = str(e)
            print(f"DEBUG - Async HTTP Error: {error_msg}")
            print(f"DEBUG - Async Response content: {e.response.text}")
            if "429" in error_msg or "rate limit" in error_msg.lower():
                if attempt < max_retries - 1:
                    print(f"OpenRouter API Rate Limit hit. Waiting 10 seconds before retry {attempt + 1}/{max_retries}...")
                    await asyncio.sleep(10.0)
                    continue
            raise ValueError(f"OpenRouter API error: {error_msg}")
        except Exception as e:
            raise ValueError(f"OpenRouter API error: {str(e)}")

def generate_json(prompt: str, system: str) -> dict:
    """
    Calls OpenRouter API and parses response as JSON.
    Synchronous version.
    """
    response_text = generate(prompt, system)
    clean_json = _strip_markdown_json(response_text)
    try:
        return json.loads(clean_json)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON from OpenRouter response: {str(e)}\nResponse: {response_text}")

async def generate_json_async(prompt: str, system: str) -> dict:
    """
    Calls OpenRouter API and parses response as JSON.
    Async version.
    """
    response_text = await generate_async(prompt, system)
    clean_json = _strip_markdown_json(response_text)
    try:
        return json.loads(clean_json)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON from OpenRouter response: {str(e)}\nResponse: {response_text}")

async def validate_openrouter_connection() -> dict:
    """
    Validates OpenRouter connection and API key configuration.
    Sends a simple test request to check if everything is configured correctly.
    
    Returns:
        {
            "connected": True/False,
            "message": "...",
            "api_key_valid": True/False,
            "model": "...",
            "error": "..." (if any)
        }
    """
    try:
        if not settings.OPENROUTER_API_KEY:
            return {
                "connected": False,
                "message": "OPENROUTER_API_KEY not configured",
                "api_key_valid": False,
                "model": MODEL,
                "error": "Missing API key"
            }
        
        headers = {
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://bitbybit.ai",
            "X-Title": "BitByBit AI Service"
        }
        
        # Send a minimal test request
        test_payload = {
            "model": MODEL,
            "messages": [
                {"role": "user", "content": "Say 'ok' and nothing else."}
            ],
            "temperature": 0.1,
            "max_tokens": 10
        }
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                headers=headers,
                json=test_payload
            )
            
            if response.status_code == 200:
                return {
                    "connected": True,
                    "message": f"Connected to OpenRouter successfully",
                    "api_key_valid": True,
                    "model": MODEL,
                    "error": None
                }
            elif response.status_code == 401:
                return {
                    "connected": False,
                    "message": "OpenRouter authentication failed - check API key",
                    "api_key_valid": False,
                    "model": MODEL,
                    "error": f"HTTP 401: {response.text[:100]}"
                }
            elif response.status_code == 404:
                return {
                    "connected": False,
                    "message": f"Model '{MODEL}' not found on OpenRouter",
                    "api_key_valid": True,
                    "model": MODEL,
                    "error": f"HTTP 404: Model not available"
                }
            else:
                return {
                    "connected": False,
                    "message": f"OpenRouter returned HTTP {response.status_code}",
                    "api_key_valid": True,
                    "model": MODEL,
                    "error": f"{response.text[:100]}"
                }
                
    except Exception as e:
        return {
            "connected": False,
            "message": f"Failed to connect to OpenRouter: {str(e)}",
            "api_key_valid": False,
            "model": MODEL,
            "error": str(e)
        }
