"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class SelectorType(str, Enum):
    """Type of selector"""
    CSS = "css"
    XPATH = "xpath"
    MIXED = "mixed"

class FeedbackRating(str, Enum):
    """Feedback rating for healed selectors"""
    POSITIVE = "positive"
    NEGATIVE = "negative"

# Request Models

class HealRequest(BaseModel):
    """Request model for healing a single selector"""
    failed_selector: str = Field(..., min_length=1, description="The failing selector to heal")
    
    # DOM Source Options (at least one required)
    html: Optional[str] = Field(None, min_length=1, description="Full HTML content of the page (legacy)")
    semantic_dom: Optional[Dict[str, Any]] = Field(None, description="Extracted semantic DOM (recommended - 76% smaller)")
    interactive_elements: Optional[List[Dict[str, Any]]] = Field(None, description="Interactive elements only (fastest)")
    
    page_url: Optional[str] = Field(None, description="URL of the page")
    use_of_selector: Optional[str] = Field(None, description="Context about how the selector is used (e.g. 'focus on password field')")
    full_coverage: Optional[bool] = False  # If True, extracts all interactive elements (images, menus, etc.)
    screenshot_path: Optional[str] = Field(None, description="Path to screenshot file")
    selector_type: Optional[SelectorType] = Field(SelectorType.MIXED, description="Type of selectors to generate")
    
    @validator('failed_selector')
    def validate_selector(cls, v):
        if not v or not v.strip():
            raise ValueError('Selector cannot be empty')
        return v.strip()
    
    @validator('semantic_dom', always=True)
    def validate_dom_source(cls, v, values):
        """Ensure at least one DOM source is provided"""
        html = values.get('html')
        interactive = values.get('interactive_elements')
        
        if not any([html, v, interactive]):
            raise ValueError('At least one of html, semantic_dom, or interactive_elements must be provided')
        
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "failed_selector": "#submit-btn",
                "semantic_dom": {
                    "type": "semantic_dom",
                    "total_elements": 10,
                    "elements": [{"tag": "button", "text": "Submit", "selector": "#submit-btn"}]
                },
                "page_url": "https://example.com/form",
                "screenshot_path": "/path/to/screenshot.png",
                "selector_type": "mixed"
            }
        }

class BatchHealRequest(BaseModel):
    """Request model for healing multiple selectors"""
    selectors: List[HealRequest] = Field(..., min_items=1, max_items=10, description="List of selectors to heal")
    
    @validator('selectors')
    def validate_selectors(cls, v):
        if len(v) > 10:
            raise ValueError('Maximum 10 selectors allowed per batch request')
        return v

class FeedbackRequest(BaseModel):
    """Request model for submitting feedback on a healed selector"""
    healing_id: int = Field(..., gt=0, description="ID of the healing record")
    rating: FeedbackRating = Field(..., description="Positive or negative feedback")
    comment: Optional[str] = Field(None, max_length=500, description="Optional comment")
    actual_selector_used: Optional[str] = Field(None, description="The selector that actually worked")
    
    class Config:
        schema_extra = {
            "example": {
                "healing_id": 123,
                "rating": "positive",
                "comment": "Worked perfectly!",
                "actual_selector_used": "[data-testid='submit-button']"
            }
        }

# Response Models

class SelectorCandidate(BaseModel):
    """A single selector candidate with metadata"""
    selector: str
    score: float = Field(..., ge=0.0, le=1.0)
    base_score: float = Field(..., ge=0.0, le=1.0)
    attribute_score: float = Field(..., ge=0.0, le=1.0)
    tag: Optional[str] = None
    text: Optional[str] = None
    xpath: Optional[str] = None
    
    # Optional fields for backward compat or extra info if needed, but keeping it strict to request for now
    # selector_type: SelectorType # Removing as not in user request example, or make optional

class HealResponse(BaseModel):
    """Response model for healing request"""
    request_id: Optional[str] = Field(None, description="Unique request ID for tracking")
    message: str = Field(..., description="Status message")
    chosen: Optional[str] = Field(None, description="The top recommended selector")
    candidates: List[SelectorCandidate] = Field(..., description="List of candidate selectors")
    # confidence_scores: List[float] # Removed as it's part of candidate object now
    debug: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Debug information")
    # healing_id: Optional[int] # Removed or optional? User example didn't show it but it might be useful. 
    # The user request example excludes healing_id and metadata (renamed to debug). 
    # I will keep healing_id as optional but place debug as requested.
    
    class Config:
        schema_extra = {
            "example": {
                "request_id": "req_abc123",
                "candidates": ["[data-testid='submit']", "#submit-btn", "button.submit"],
                "confidence_scores": [0.95, 0.82, 0.71],
                "chosen": "[data-testid='submit']",
                "message": "Smart Healed",
                "healing_id": 456,
                "metadata": {
                    "llm_used": True,
                    "screenshot_analyzed": False,
                    "processing_time_ms": 1234
                }
            }
        }

class BatchHealResponse(BaseModel):
    """Response model for batch healing request"""
    request_id: Optional[str] = Field(None, description="Unique request ID for tracking")
    results: List[HealResponse] = Field(..., description="Healing results for each selector")
    total_processed: int = Field(..., description="Total number of selectors processed")
    total_succeeded: int = Field(..., description="Number of successful healings")
    total_failed: int = Field(..., description="Number of failed healings")
    processing_time_ms: float = Field(..., description="Total processing time in milliseconds")

class HealingHistoryItem(BaseModel):
    """A single item in healing history"""
    id: int
    old_selector: str
    new_selector: str
    confidence: float
    url: str
    timestamp: str
    feedback_rating: Optional[str] = None
    feedback_comment: Optional[str] = None

class HistoryResponse(BaseModel):
    """Response model for healing history"""
    items: List[HealingHistoryItem]
    total_count: int
    page: int
    page_size: int
    has_more: bool

class StatsResponse(BaseModel):
    """Response model for healing statistics"""
    total_healings: int
    total_with_feedback: int
    positive_feedback_count: int
    negative_feedback_count: int
    success_rate: float = Field(..., ge=0.0, le=1.0)
    most_healed_selectors: List[Dict[str, Any]]
    recent_healings_count: int
    average_confidence: float = Field(..., ge=0.0, le=1.0)
    
    class Config:
        schema_extra = {
            "example": {
                "total_healings": 1523,
                "total_with_feedback": 342,
                "positive_feedback_count": 298,
                "negative_feedback_count": 44,
                "success_rate": 0.87,
                "most_healed_selectors": [
                    {"selector": "#submit-btn", "count": 45},
                    {"selector": ".login-form", "count": 32}
                ],
                "recent_healings_count": 156,
                "average_confidence": 0.82
            }
        }

class HealthResponse(BaseModel):
    """Response model for health check"""
    status: str
    timestamp: str
    database_connected: bool
    llm_api_available: bool
    version: str = "1.0.0"

class FeedbackResponse(BaseModel):
    """Response model for feedback submission"""
    success: bool
    message: str
    feedback_id: Optional[int] = None
