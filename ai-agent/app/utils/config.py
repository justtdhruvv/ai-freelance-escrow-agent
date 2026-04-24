from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    AI_SERVICE_PORT: int = 8001
    ENV: str = "development"
    GITHUB_TOKEN: str = ""
    OPENROUTER_API_KEY: str = ""
    OLLAMA_BASE_URL: str = ""
    OLLAMA_MODEL: str = "qwen2.5-coder:7b"
    GEMINI_API_KEY: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
