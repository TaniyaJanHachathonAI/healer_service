"""
Screenshot analysis with vision models
"""
import os
import base64
import requests
from typing import Optional, Dict, Any
from config import Config
from logger import logger

def encode_image_to_base64(image_path: str) -> Optional[str]:
    """Encode image file to base64 string"""
    try:
        if not os.path.exists(image_path):
            logger.warning(f"Screenshot file not found: {image_path}", extra={'request_id': 'system'})
            return None
        
        with open(image_path, "rb") as image_file:
            encoded = base64.b64encode(image_file.read()).decode('utf-8')
            return encoded
    except Exception as e:
        logger.error(f"Failed to encode image: {e}", extra={'request_id': 'system'}, exc_info=True)
        return None

def analyze_screenshot_with_vision(
    screenshot_path: str,
    failed_selector: str,
    page_url: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Analyze screenshot using vision-capable LLM to extract UI context
    
    Returns:
        Dictionary with analysis results or None if analysis fails
    """
    if not Config.ENABLE_SCREENSHOT_ANALYSIS:
        logger.debug("Screenshot analysis is disabled", extra={'request_id': 'system'})
        return None
    
    if not screenshot_path:
        return None
    
    # Encode image
    image_base64 = encode_image_to_base64(screenshot_path)
    if not image_base64:
        return None
    
    try:
        # Build vision prompt
        system_prompt = (
            "You are an expert UI/UX analyst. Analyze the screenshot and identify "
            "UI elements that match the failed selector context. Describe the visual "
            "characteristics, position, and surrounding elements."
        )
        
        user_prompt = f"""
Analyze this screenshot and help identify the element that matches this selector:
Failed selector: {failed_selector}
Page URL: {page_url or 'N/A'}

Please provide:
1. Description of the likely target element
2. Visual characteristics (color, size, position)
3. Nearby elements or landmarks
4. Suggested stable attributes to use for selection

Return your analysis in a concise, structured format.
"""
        
        # Call vision model
        headers = {
            "Authorization": f"Bearer {Config.OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": Config.VISION_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 500,
            "temperature": 0.0
        }
        
        response = requests.post(
            Config.OPENROUTER_URL,
            headers=headers,
            json=payload,
            timeout=Config.LLM_TIMEOUT
        )
        response.raise_for_status()
        
        result = response.json()
        analysis_text = result["choices"][0]["message"]["content"]
        
        logger.info("Screenshot analysis completed successfully", extra={'request_id': 'system'})
        
        return {
            "success": True,
            "analysis": analysis_text,
            "model_used": Config.VISION_MODEL
        }
        
    except requests.exceptions.Timeout:
        logger.error("Vision API timeout", extra={'request_id': 'system'})
        return {"success": False, "error": "Vision API timeout"}
    
    except requests.exceptions.RequestException as e:
        logger.error(f"Vision API request failed: {e}", extra={'request_id': 'system'}, exc_info=True)
        return {"success": False, "error": str(e)}
    
    except Exception as e:
        logger.error(f"Screenshot analysis failed: {e}", extra={'request_id': 'system'}, exc_info=True)
        return {"success": False, "error": str(e)}

def get_visual_context_for_healing(
    screenshot_path: Optional[str],
    failed_selector: str,
    page_url: Optional[str] = None
) -> str:
    """
    Get visual context from screenshot to enhance healing prompt
    
    Returns:
        String with visual context to add to LLM prompt, or empty string if unavailable
    """
    if not screenshot_path or not Config.ENABLE_SCREENSHOT_ANALYSIS:
        return ""
    
    analysis = analyze_screenshot_with_vision(screenshot_path, failed_selector, page_url)
    
    if analysis and analysis.get("success"):
        context = f"""
Visual Analysis from Screenshot:
{analysis.get('analysis', 'No analysis available')}
"""
        return context
    
    return ""
