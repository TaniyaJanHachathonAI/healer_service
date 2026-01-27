"""
Configuration management for Healer Service
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Centralized configuration for the healer service"""
    
    # Scoring Weights
    SCORE_WEIGHT_BASE = float(os.getenv("SCORE_WEIGHT_BASE", "0.3"))
    SCORE_WEIGHT_STABILITY = float(os.getenv("SCORE_WEIGHT_STABILITY", "0.4"))
    SCORE_WEIGHT_SEMANTIC = float(os.getenv("SCORE_WEIGHT_SEMANTIC", "0.3"))
    
    # Selector Generation
    MAX_CANDIDATES = int(os.getenv("MAX_CANDIDATES", "40"))
    MAX_DOM_CANDIDATES = int(os.getenv("MAX_DOM_CANDIDATES", "40"))
    
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
        return True

# Validate config on import
Config.validate()
