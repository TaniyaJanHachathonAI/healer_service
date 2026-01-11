"""
Configuration management for Healer Service
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Centralized configuration for the healer service"""
    
    # API Configuration
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
    OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
    
    # LLM Models
    LLM_MODEL = os.getenv("LLM_MODEL", "meta-llama/llama-3-8b-instruct")
    VISION_MODEL = os.getenv("VISION_MODEL", "google/gemini-pro-vision")
    
    # LLM Parameters
    LLM_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "800"))
    LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.0"))
    LLM_TIMEOUT = int(os.getenv("LLM_TIMEOUT", "60"))
    
    # Database
    DB_PATH = os.getenv("DB_PATH", "healed_selectors.db")
    
    # Scoring Weights
    SCORE_WEIGHT_BASE = float(os.getenv("SCORE_WEIGHT_BASE", "0.3"))
    SCORE_WEIGHT_STABILITY = float(os.getenv("SCORE_WEIGHT_STABILITY", "0.4"))
    SCORE_WEIGHT_SEMANTIC = float(os.getenv("SCORE_WEIGHT_SEMANTIC", "0.3"))
    
    # Selector Generation
    MAX_CANDIDATES = int(os.getenv("MAX_CANDIDATES", "40"))
    MAX_DOM_CANDIDATES = int(os.getenv("MAX_DOM_CANDIDATES", "40"))
    
    # Features
    ENABLE_SCREENSHOT_ANALYSIS = os.getenv("ENABLE_SCREENSHOT_ANALYSIS", "true").lower() == "true"
    ENABLE_XPATH_GENERATION = os.getenv("ENABLE_XPATH_GENERATION", "true").lower() == "true"
    
    # LLM Optimization
    MIN_LOCAL_CANDIDATES_THRESHOLD = int(os.getenv("MIN_LOCAL_CANDIDATES_THRESHOLD", "3"))  # Skip LLM if we have this many local candidates
    
    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE = os.getenv("LOG_FILE", "healer_service.log")
    
    # Pagination
    DEFAULT_PAGE_SIZE = int(os.getenv("DEFAULT_PAGE_SIZE", "20"))
    MAX_PAGE_SIZE = int(os.getenv("MAX_PAGE_SIZE", "100"))
    
    # Volatile Patterns
    VOLATILE_PATTERNS = [
        r"data-\w{6,}",
        r"\b(?=.*\d)[a-z0-9]{8,}\b"
        r"weblab", r"dingo", r"csa", r"ue", r"abtest"
    ]
    
    @classmethod
    def validate(cls):
        """Validate critical configuration"""
        if not cls.OPENROUTER_API_KEY:
            raise ValueError("OPENROUTER_API_KEY is required in environment variables")
        return True

# Validate config on import
Config.validate()
