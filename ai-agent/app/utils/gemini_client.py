import json
import re
import time
import asyncio
from app.utils.config import settings

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

def _strip_markdown_json(text: str) -> str:
    """Removes markdown backticks and formatting from JSON string blocks."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(json)?\n", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\n```$", "", text)
    return text.strip()

def generate(prompt: str, system: str) -> str:
    """
    Calls Gemini API and returns the response text.
    Synchronous version for compatibility.
    """
    if not GEMINI_AVAILABLE:
        raise RuntimeError("google-generativeai not installed. Install with: pip install google-generativeai")
    
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not set in environment")
    
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")
    full_prompt = f"{system}\n\n{prompt}"
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "Quota exceeded" in error_msg:
                if attempt < max_retries - 1:
                    print(f"Gemini API Rate Limit hit. Waiting 35 seconds before retry {attempt + 1}/{max_retries}...")
                    time.sleep(36.0)
                    continue
            raise ValueError(f"Gemini API error: {error_msg}")

async def generate_async(prompt: str, system: str) -> str:
    """
    Async wrapper for Gemini API call.
    """
    if not GEMINI_AVAILABLE:
        raise RuntimeError("google-generativeai not installed. Install with: pip install google-generativeai")
    
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not set in environment")
    
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")
    full_prompt = f"{system}\n\n{prompt}"
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = await model.generate_content_async(full_prompt)
            return response.text
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "Quota exceeded" in error_msg:
                if attempt < max_retries - 1:
                    print(f"Gemini API Rate Limit hit. Waiting 35 seconds before retry {attempt + 1}/{max_retries}...")
                    await asyncio.sleep(36.0)
                    continue
            raise ValueError(f"Gemini API error: {error_msg}")

def generate_json(prompt: str, system: str) -> dict:
    """
    Calls Gemini API and parses response as JSON.
    Raises ValueError if parsing fails.
    """
    system_with_json_directive = f"{system}\n\nYou MUST respond with valid JSON only."
    
    response_text = generate(prompt, system_with_json_directive)
    cleaned_text = _strip_markdown_json(response_text)
    
    try:
        parsed = json.loads(cleaned_text)
        return parsed
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse Gemini JSON response: {str(e)}\nResponse was: {cleaned_text}")

async def generate_json_async(prompt: str, system: str) -> dict:
    """
    Async version: Calls Gemini API and parses response as JSON.
    Raises ValueError if parsing fails.
    """
    system_with_json_directive = f"{system}\n\nYou MUST respond with valid JSON only."

    response_text = await generate_async(prompt, system_with_json_directive)
    cleaned_text = _strip_markdown_json(response_text)

    try:
        parsed = json.loads(cleaned_text)
        return parsed
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse Gemini JSON response: {str(e)}\nResponse was: {cleaned_text}")

def validate_gemini_connection():
    try:
        result = generate("Hello", "You are a test assistant.")
        return {
            "status": "success",
            "message": "Gemini connection successful",
            "response_preview": result[:100]
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
